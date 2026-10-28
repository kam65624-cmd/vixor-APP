\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;
CREATE TYPE public.points_reason AS ENUM (
  'signup_bonus', 'analysis_cost', 'pack_purchase', 'referral_bonus',
  'daily_streak', 'premium_grant', 'admin_adjust', 'telegram_stars_purchase'
);

CREATE TABLE public.point_packs (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  points integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.premium_plans (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month', 'year')),
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.points_balances (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  delta integer NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason public.points_reason NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  payment_provider text,
  payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  telegram_charge_id text UNIQUE,
  payload text NOT NULL,
  amount_stars integer,
  pack_id uuid,
  plan_id uuid,
  status text NOT NULL DEFAULT 'pending',
  telegram_invoice_url text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own payments" ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service role can insert payments" ON public.payments FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service role can update payments" ON public.payments FOR UPDATE TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.credit_points(
  _user uuid,
  _amount integer,
  _reason public.points_reason,
  _meta jsonb DEFAULT '{}'::jsonb
) RETURNS integer
LANGUAGE plpgsql
AS $$
BEGIN
  IF _user = '00000000-0000-0000-0000-000000000099'::uuid THEN
    RAISE EXCEPTION 'simulated credit_points failure';
  END IF;
  INSERT INTO public.points_balances(user_id, balance, lifetime_earned)
  VALUES (_user, _amount, GREATEST(_amount, 0))
  ON CONFLICT (user_id) DO UPDATE
    SET balance = public.points_balances.balance + _amount,
        lifetime_earned = public.points_balances.lifetime_earned + GREATEST(_amount, 0),
        updated_at = now();
  INSERT INTO public.points_transactions(user_id, delta, metadata, reason)
  VALUES (_user, _amount, COALESCE(_meta, '{}'::jsonb), _reason);
  RETURN _amount;
END;
$$;

-- Execute the exact new migration against a disposable PostgreSQL schema.
\ir ../migrations/20261028000000_atomic_telegram_stars_fulfillment.sql

-- Simulate Supabase's table grants and prove authenticated users still cannot mutate payments.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
SET ROLE authenticated;
DO $
BEGIN
  BEGIN
    INSERT INTO public.payments(user_id, payload, amount_stars)
    VALUES ('00000000-0000-0000-0000-000000000088', 'user-forged-order', 1);
    RAISE EXCEPTION 'authenticated user unexpectedly inserted a payment';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$;
RESET ROLE;

INSERT INTO public.point_packs(id, name, points, bonus_points)
VALUES ('11111111-1111-1111-1111-111111111111', 'Test pack', 100, 10);
INSERT INTO public.premium_plans(id, name, interval)
VALUES ('22222222-2222-2222-2222-222222222222', 'Test Pro', 'month');

INSERT INTO public.payments(user_id, payload, amount_stars, pack_id)
VALUES ('00000000-0000-0000-0000-000000000001', 'order-pack-0001', 50, '11111111-1111-1111-1111-111111111111');

SELECT public.process_telegram_stars_payment('order-pack-0001', 'charge-pack-0001', 'XTR', 50, NULL);
SELECT public.process_telegram_stars_payment('order-pack-0001', 'charge-pack-0001', 'XTR', 50, NULL);
DO $$
BEGIN
  IF (SELECT balance FROM public.points_balances WHERE user_id = '00000000-0000-0000-0000-000000000001') <> 110 THEN
    RAISE EXCEPTION 'duplicate pack webhook changed points balance';
  END IF;
  IF (SELECT status FROM public.payments WHERE payload = 'order-pack-0001') <> 'confirmed' THEN
    RAISE EXCEPTION 'pack payment was not confirmed';
  END IF;
  IF (SELECT count(*) FROM public.points_transactions WHERE user_id = '00000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'pack credit transaction was not idempotent';
  END IF;
END;
$$;

INSERT INTO public.payments(user_id, payload, amount_stars, pack_id)
VALUES ('00000000-0000-0000-0000-000000000002', 'order-pack-0002', 60, '11111111-1111-1111-1111-111111111111');
DO $$
BEGIN
  BEGIN
    PERFORM public.process_telegram_stars_payment('order-pack-0002', 'charge-pack-0002', 'XTR', 59, NULL);
    RAISE EXCEPTION 'amount mismatch was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'amount mismatch was accepted' THEN RAISE; END IF;
  END;
  BEGIN
    PERFORM public.process_telegram_stars_payment('order-pack-0002', 'charge-pack-0002', 'USD', 60, NULL);
    RAISE EXCEPTION 'wrong currency was accepted';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'wrong currency was accepted' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.payments WHERE payload = 'order-pack-0002') <> 'pending' THEN
    RAISE EXCEPTION 'rejected payment mutated pending order';
  END IF;
END;
$$;

INSERT INTO public.payments(user_id, payload, amount_stars, plan_id)
VALUES ('00000000-0000-0000-0000-000000000003', 'order-premium-0001', 100, '22222222-2222-2222-2222-222222222222');
SELECT public.process_telegram_stars_payment('order-premium-0001', 'charge-premium-0001', 'XTR', 100, NULL);
SELECT public.process_telegram_stars_payment('order-premium-0001', 'charge-premium-0001', 'XTR', 100, NULL);
DO $$
BEGIN
  IF (SELECT count(*) FROM public.premium_subscriptions WHERE user_id = '00000000-0000-0000-0000-000000000003' AND status = 'active') <> 1 THEN
    RAISE EXCEPTION 'premium subscription missing or duplicated';
  END IF;
  IF (SELECT status FROM public.payments WHERE payload = 'order-premium-0001') <> 'confirmed' THEN
    RAISE EXCEPTION 'premium payment was not confirmed';
  END IF;
END;
$$;

INSERT INTO public.payments(user_id, payload, amount_stars, pack_id)
VALUES ('00000000-0000-0000-0000-000000000099', 'order-pack-rollback', 70, '11111111-1111-1111-1111-111111111111');
DO $$
BEGIN
  BEGIN
    PERFORM public.process_telegram_stars_payment('order-pack-rollback', 'charge-rollback', 'XTR', 70, NULL);
    RAISE EXCEPTION 'expected credit_points failure was not raised';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'expected credit_points failure was not raised' THEN RAISE; END IF;
    IF SQLERRM <> 'simulated credit_points failure' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.payments WHERE payload = 'order-pack-rollback') <> 'pending' THEN
    RAISE EXCEPTION 'payment confirmation was not rolled back after credit failure';
  END IF;
  IF EXISTS (SELECT 1 FROM public.points_balances WHERE user_id = '00000000-0000-0000-0000-000000000099') THEN
    RAISE EXCEPTION 'balance was changed after credit failure';
  END IF;
END;
$$;

-- Repeat-application check for the migration's idempotent DDL and function replacement.
\ir ../migrations/20261028000000_atomic_telegram_stars_fulfillment.sql
