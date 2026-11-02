-- Gate 5 recovery: payer identity binding and privilege hardening.
-- Additive migration. Never apply to production without owner approval.
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS telegram_user_id bigint;

-- New orders must be tied to the verified Telegram identity of the signed-in owner.
-- Existing pending orders remain unfulfillable until reconciled or expired.

-- G5-01: clients may read their own balances, but only service_role can mutate them.
DROP POLICY IF EXISTS "Service can insert balance" ON public.points_balances;
DROP POLICY IF EXISTS "Service can update balance" ON public.points_balances;
DROP POLICY IF EXISTS "service_role manages point balances" ON public.points_balances;
CREATE POLICY "service_role manages point balances"
  ON public.points_balances FOR ALL TO service_role
  USING (true) WITH CHECK (true);
REVOKE INSERT, UPDATE, DELETE ON public.points_balances FROM anon, authenticated;
GRANT SELECT ON public.points_balances TO authenticated;
GRANT ALL ON public.points_balances TO service_role;

-- Correct ROW_COUNT handling: GET DIAGNOSTICS returns bigint, not boolean.
CREATE OR REPLACE FUNCTION execute_signal_transition(
  p_tracking_id UUID,
  p_user_id UUID,
  p_current_version TIMESTAMPTZ,
  p_new_status TEXT,
  p_current_price DOUBLE PRECISION DEFAULT NULL,
  p_hit_tp INTEGER DEFAULT NULL,
  p_activated_at TIMESTAMPTZ DEFAULT NULL,
  p_resolved_at TIMESTAMPTZ DEFAULT NULL,
  p_from_status TEXT DEFAULT NULL,
  p_event_type TEXT DEFAULT NULL,
  p_observed_price DOUBLE PRECISION DEFAULT NULL,
  p_tp_index INTEGER DEFAULT NULL,
  p_transition_reason TEXT DEFAULT NULL,
  p_observed_at TIMESTAMPTZ DEFAULT NULL,
  p_actor TEXT DEFAULT 'system',
  p_source TEXT DEFAULT 'server'
)
RETURNS JSONB
LANGUAGE plpgsql
AS $
DECLARE
  v_rows_updated BIGINT;
  v_transition_id UUID;
  v_result JSONB;
BEGIN
  -- Step 1: Update signal_tracking with optimistic lock
  UPDATE signal_tracking
  SET
    status = p_new_status,
    current_price = COALESCE(p_current_price, current_price),
    hit_tp = COALESCE(p_hit_tp, hit_tp),  -- trigger enforces final invariant
    activated_at = COALESCE(p_activated_at, activated_at),
    resolved_at = COALESCE(p_resolved_at, resolved_at),
    updated_at = clock_timestamp()
  WHERE id = p_tracking_id
    AND user_id = p_user_id
    AND updated_at = p_current_version;

  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;

  IF v_rows_updated = 0 THEN
    RAISE EXCEPTION 'CONFLICT: Signal state has changed concurrently or not found'
      USING ERRCODE = 'P0004';
  END IF;

  -- Step 2: Insert audit record (same transaction — atomic)
  INSERT INTO signal_transitions (
    signal_tracking_id, user_id,
    from_status, to_status, event_type,
    observed_price, tp_index, transition_reason,
    server_received_at, observed_at,
    actor, source
  ) VALUES (
    p_tracking_id, p_user_id,
    COALESCE(p_from_status, 'unknown'), p_new_status, COALESCE(p_event_type, 'unknown'),
    p_observed_price, p_tp_index, p_transition_reason,
    clock_timestamp(), p_observed_at,
    p_actor, p_source
  )
  RETURNING id INTO v_transition_id;

  -- Step 3: Return result
  v_result := jsonb_build_object(
    'ok', true,
    'transition', jsonb_build_object(
      'id', v_transition_id,
      'trackingId', p_tracking_id,
      'to', p_new_status,
      'event', COALESCE(p_event_type, 'unknown'),
      'price', p_observed_price,
      'serverReceivedAt', clock_timestamp()
    )
  );

  RETURN v_result;
END;
$;

-- RLS: service_role can execute; users cannot call RPC directly
-- (the application layer calls this via admin client)
ALTER FUNCTION execute_signal_transition SECURITY DEFINER;


-- G5-02: SECURITY DEFINER transition RPC must not be executable by PUBLIC/authenticated.
ALTER FUNCTION public.execute_signal_transition(
  uuid, uuid, timestamptz, text, double precision, integer, timestamptz,
  timestamptz, text, text, double precision, integer, text, timestamptz, text, text
) SECURITY DEFINER SET search_path = pg_catalog, public, pg_temp;
REVOKE ALL ON FUNCTION public.execute_signal_transition(
  uuid, uuid, timestamptz, text, double precision, integer, timestamptz,
  timestamptz, text, text, double precision, integer, text, timestamptz, text, text
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_signal_transition(
  uuid, uuid, timestamptz, text, double precision, integer, timestamptz,
  timestamptz, text, text, double precision, integer, text, timestamptz, text, text
) TO service_role;

-- G5-05: telegram_id can only change through the server's service_role path.
CREATE OR REPLACE FUNCTION public.guard_profile_telegram_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_role text := COALESCE(current_setting('request.jwt.claim.role', true), '');
BEGIN
  IF TG_OP = 'INSERT' AND NEW.telegram_id IS NOT NULL
     AND v_role <> 'service_role' AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'telegram_id must be set through verified Telegram linking'
      USING ERRCODE = '42501';
  END IF;
  IF TG_OP = 'UPDATE' AND OLD.telegram_id IS DISTINCT FROM NEW.telegram_id
     AND v_role <> 'service_role' AND current_user <> 'service_role' THEN
    RAISE EXCEPTION 'telegram_id must be changed through verified Telegram linking'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_guard_telegram_identity ON public.profiles;
CREATE TRIGGER profiles_guard_telegram_identity
  BEFORE INSERT OR UPDATE OF telegram_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_telegram_identity();


-- Payer identity is a required input to the canonical fulfillment RPC.
-- Remove the legacy signature so old webhook code fails closed after this migration.
DROP FUNCTION IF EXISTS public.process_telegram_stars_payment(text, text, text, integer, bigint);

CREATE OR REPLACE FUNCTION public.process_telegram_stars_payment(
  _payload text,
  _charge_id text,
  _currency text,
  _amount integer,
  _telegram_user_id bigint,
  _subscription_expiration bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  p public.payments%ROWTYPE;
  v_points integer;
  v_bonus integer;
  v_period_start timestamptz;
  v_period_end timestamptz;
  v_existing_period_end timestamptz;
  v_plan_interval text;
  v_existing_charge uuid;
  v_subscription_id uuid;
BEGIN
  IF _payload IS NULL OR length(_payload) < 8 OR length(_payload) > 512
     OR _charge_id IS NULL OR length(_charge_id) < 1 OR length(_charge_id) > 256
     OR _currency IS DISTINCT FROM 'XTR' OR _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'invalid Stars payment fields' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO p
    FROM public.payments
   WHERE payload = _payload
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pending Stars order not found' USING ERRCODE = 'P0002';
  END IF;

  IF _telegram_user_id IS NULL OR p.telegram_user_id IS NULL
     OR p.telegram_user_id <> _telegram_user_id THEN
    RAISE EXCEPTION 'Telegram payer does not match the order owner' USING ERRCODE = '42501';
  END IF;

  IF p.amount_stars IS NULL OR p.amount_stars <> _amount THEN
    RAISE EXCEPTION 'Stars amount does not match pending order' USING ERRCODE = '22023';
  END IF;

  IF p.status = 'confirmed' THEN
    IF p.telegram_charge_id = _charge_id THEN
      RETURN jsonb_build_object('status', 'duplicate', 'payment_id', p.id);
    END IF;
    RAISE EXCEPTION 'order already confirmed with a different charge' USING ERRCODE = '23505';
  END IF;

  IF p.status <> 'pending' THEN
    RAISE EXCEPTION 'Stars order is not pending' USING ERRCODE = '55000';
  END IF;

  IF (p.pack_id IS NULL) = (p.plan_id IS NULL) THEN
    RAISE EXCEPTION 'order must reference exactly one pack or plan' USING ERRCODE = '22023';
  END IF;

  SELECT id INTO v_existing_charge
    FROM public.payments
   WHERE telegram_charge_id = _charge_id
     AND id <> p.id
   LIMIT 1;
  IF FOUND THEN
    RAISE EXCEPTION 'Telegram charge already bound to another order' USING ERRCODE = '23505';
  END IF;

  IF p.pack_id IS NOT NULL THEN
    SELECT points, bonus_points INTO v_points, v_bonus
      FROM public.point_packs
     WHERE id::text = p.pack_id;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'ordered point pack no longer exists' USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.payments
       SET telegram_charge_id = _charge_id,
           status = 'confirmed',
           confirmed_at = now()
     WHERE id = p.id;

    PERFORM public.credit_points(
      _user := p.user_id,
      _amount := v_points + v_bonus,
      _reason := 'telegram_stars_purchase',
      _meta := jsonb_build_object(
        'pack_id', p.pack_id,
        'telegram_charge_id', _charge_id,
        'payment_method', 'stars'
      )
    );

    RETURN jsonb_build_object('status', 'confirmed', 'payment_id', p.id, 'kind', 'pack');
  END IF;

  SELECT interval INTO v_plan_interval
    FROM public.premium_plans
   WHERE id::text = p.plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'ordered premium plan no longer exists' USING ERRCODE = 'P0002';
  END IF;

  -- Serialize subscription updates per user before reading the existing paid-through date.
  PERFORM pg_advisory_xact_lock(hashtextextended(p.user_id::text, 0));
  SELECT id, current_period_end
    INTO v_subscription_id, v_existing_period_end
    FROM public.premium_subscriptions
   WHERE user_id = p.user_id
   ORDER BY current_period_end DESC
   LIMIT 1
   FOR UPDATE;

  v_period_start := GREATEST(COALESCE(v_existing_period_end, now()), now());
  IF _subscription_expiration IS NOT NULL
     AND _subscription_expiration > extract(epoch FROM now())::bigint THEN
    v_period_end := to_timestamp(_subscription_expiration);
  ELSE
    v_period_end := v_period_start
      + CASE WHEN v_plan_interval = 'year' THEN interval '365 days' ELSE interval '30 days' END;
  END IF;

  UPDATE public.payments
     SET telegram_charge_id = _charge_id,
         status = 'confirmed',
         confirmed_at = now()
   WHERE id = p.id;

  UPDATE public.premium_subscriptions
     SET status = 'cancelled', updated_at = now()
   WHERE user_id = p.user_id
     AND status = 'active'
     AND id IS DISTINCT FROM v_subscription_id;

  IF v_subscription_id IS NOT NULL THEN
    UPDATE public.premium_subscriptions
       SET plan_id = p.plan_id::uuid,
           status = 'active',
           payment_provider = 'telegram_stars',
           payment_id = _charge_id,
           current_period_start = v_period_start,
           current_period_end = v_period_end,
           updated_at = now()
     WHERE id = v_subscription_id;
  ELSE
    INSERT INTO public.premium_subscriptions
      (user_id, plan_id, status, current_period_start, current_period_end, payment_provider, payment_id)
    VALUES
      (p.user_id, p.plan_id::uuid, 'active', v_period_start, v_period_end, 'telegram_stars', _charge_id);
  END IF;

  RETURN jsonb_build_object('status', 'confirmed', 'payment_id', p.id, 'kind', 'premium');
END;
$$;

REVOKE ALL ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint, bigint) TO service_role;
