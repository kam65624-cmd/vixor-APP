-- Atomic Telegram Stars order validation, charge idempotency, and entitlement fulfillment.
-- Apply only through reviewed migrations; this file is never executed against production here.

ALTER TABLE public.point_packs
  ADD COLUMN IF NOT EXISTS bonus_points integer NOT NULL DEFAULT 0;

-- Telegram Stars prices are explicitly configured in Stars; never derive them from client input.
ALTER TABLE public.point_packs
  ADD COLUMN IF NOT EXISTS stars_price integer;
ALTER TABLE public.premium_plans
  ADD COLUMN IF NOT EXISTS stars_price integer;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'payments_stars_price_positive'
       AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_stars_price_positive
      CHECK (amount_stars IS NULL OR amount_stars > 0) NOT VALID;
  END IF;
END;
$$;
ALTER TABLE public.payments
  VALIDATE CONSTRAINT payments_stars_price_positive;

-- Payloads are opaque order IDs; one payload must resolve to exactly one pending order.
DO $$
BEGIN
  IF EXISTS (
    SELECT payload FROM public.payments GROUP BY payload HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate payment payloads exist; reconcile them before enabling Stars fulfillment';
  END IF;
  CREATE UNIQUE INDEX IF NOT EXISTS payments_payload_unique ON public.payments(payload);
END;
$$;

-- End-user sessions may read their own payment history, but cannot create or mutate payment records.
DROP POLICY IF EXISTS "users access own payments" ON public.payments;
DROP POLICY IF EXISTS "users read own payments" ON public.payments;
CREATE POLICY "users read own payments"
  ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.process_telegram_stars_payment(
  _payload text,
  _charge_id text,
  _currency text,
  _amount integer,
  _subscription_expiration bigint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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

REVOKE ALL ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint) TO service_role;
