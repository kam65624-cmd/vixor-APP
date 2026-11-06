-- Production reconciliation for Telegram Stars.
-- Adds the schema missing from the live APP database and installs the payer-bound
-- fulfillment RPC. Prices remain NULL until the product owner configures them.
-- This migration is additive/idempotent and does not backfill or rewrite payment rows.

BEGIN;

-- Catalog pricing: NULL means Stars checkout is not configured for that item.
ALTER TABLE public.point_packs
  ADD COLUMN IF NOT EXISTS stars_price integer;
ALTER TABLE public.premium_plans
  ADD COLUMN IF NOT EXISTS stars_price integer;

-- Bind every pending invoice to the verified Telegram payer at order creation.
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS telegram_user_id bigint;

-- Fulfillment metadata expected by the APP subscription read model.
-- Existing subscriptions are preserved; newly fulfilled subscriptions populate these fields.
ALTER TABLE public.premium_subscriptions
  ADD COLUMN IF NOT EXISTS current_period_start timestamptz,
  ADD COLUMN IF NOT EXISTS payment_provider text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'point_packs_stars_price_positive'
       AND conrelid = 'public.point_packs'::regclass
  ) THEN
    ALTER TABLE public.point_packs
      ADD CONSTRAINT point_packs_stars_price_positive
      CHECK (stars_price IS NULL OR stars_price > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'premium_plans_stars_price_positive'
       AND conrelid = 'public.premium_plans'::regclass
  ) THEN
    ALTER TABLE public.premium_plans
      ADD CONSTRAINT premium_plans_stars_price_positive
      CHECK (stars_price IS NULL OR stars_price > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'payments_stars_price_positive'
       AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_stars_price_positive
      CHECK (amount_stars IS NULL OR amount_stars > 0) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'payments_telegram_user_id_positive'
       AND conrelid = 'public.payments'::regclass
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_telegram_user_id_positive
      CHECK (telegram_user_id IS NULL OR telegram_user_id > 0) NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.point_packs
  VALIDATE CONSTRAINT point_packs_stars_price_positive;
ALTER TABLE public.premium_plans
  VALIDATE CONSTRAINT premium_plans_stars_price_positive;
ALTER TABLE public.payments
  VALIDATE CONSTRAINT payments_stars_price_positive;
ALTER TABLE public.payments
  VALIDATE CONSTRAINT payments_telegram_user_id_positive;

DO $$
BEGIN
  IF EXISTS (
    SELECT payload FROM public.payments GROUP BY payload HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate payment payloads exist; reconcile them before creating the unique index';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS payments_payload_unique
  ON public.payments(payload);

-- The production schema stores catalog/subscription plan IDs as text, while the
-- clean historical bootstrap uses UUIDs. Resolve the destination type from the
-- catalog so the same RPC safely supports both deployed shapes.
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
  v_plan_id_type text;
BEGIN
  IF _payload IS NULL OR length(_payload) < 8 OR length(_payload) > 512
     OR _charge_id IS NULL OR length(_charge_id) < 1 OR length(_charge_id) > 256
     OR _currency IS DISTINCT FROM 'XTR' OR _amount IS NULL OR _amount <= 0
     OR _telegram_user_id IS NULL OR _telegram_user_id <= 0 THEN
    RAISE EXCEPTION 'invalid Stars payment fields' USING ERRCODE = '22023';
  END IF;

  SELECT * INTO p
    FROM public.payments
   WHERE payload = _payload
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'pending Stars order not found' USING ERRCODE = 'P0002';
  END IF;

  IF p.telegram_user_id IS NULL OR p.telegram_user_id <> _telegram_user_id THEN
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
      _reason := 'telegram_stars_purchase'::public.points_reason,
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

  SELECT format_type(a.atttypid, a.atttypmod)
    INTO v_plan_id_type
    FROM pg_attribute a
   WHERE a.attrelid = 'public.premium_subscriptions'::regclass
     AND a.attname = 'plan_id'
     AND a.attnum > 0
     AND NOT a.attisdropped;

  IF v_plan_id_type IS NULL THEN
    RAISE EXCEPTION 'premium_subscriptions.plan_id column is missing';
  END IF;

  IF v_subscription_id IS NOT NULL THEN
    EXECUTE format(
      'UPDATE public.premium_subscriptions
          SET plan_id = $1::%s,
              status = ''active'',
              payment_provider = ''telegram_stars'',
              payment_id = $2,
              current_period_start = $3,
              current_period_end = $4,
              updated_at = now()
        WHERE id = $5',
      v_plan_id_type
    )
    USING p.plan_id, _charge_id, v_period_start, v_period_end, v_subscription_id;
  ELSE
    EXECUTE format(
      'INSERT INTO public.premium_subscriptions
         (user_id, plan_id, status, current_period_start, current_period_end, payment_provider, payment_id)
       VALUES ($1, $2::%s, ''active'', $3, $4, ''telegram_stars'', $5)',
      v_plan_id_type
    )
    USING p.user_id, p.plan_id, v_period_start, v_period_end, _charge_id;
  END IF;

  RETURN jsonb_build_object('status', 'confirmed', 'payment_id', p.id, 'kind', 'premium');
END;
$$;

REVOKE ALL ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint, bigint)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.process_telegram_stars_payment(text, text, text, integer, bigint, bigint)
  TO service_role;

COMMIT;
