\set ON_ERROR_STOP on
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE SCHEMA IF NOT EXISTS auth;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='service_role') THEN CREATE ROLE service_role NOLOGIN BYPASSRLS; END IF;
END $$;

CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
CREATE OR REPLACE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS $$
  SELECT COALESCE(current_setting('request.jwt.claim.role', true), '')
$$;

CREATE TYPE public.points_reason AS ENUM (
  'signup_bonus','analysis_cost','pack_purchase','referral_bonus',
  'daily_streak','premium_grant','admin_adjust','telegram_stars_purchase'
);
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  telegram_id bigint UNIQUE,
  display_name text
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profile_update_own ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

CREATE TABLE public.points_balances (
  user_id uuid PRIMARY KEY,
  balance integer NOT NULL DEFAULT 0,
  lifetime_earned integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.points_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY balance_read_own ON public.points_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY balance_write_own ON public.points_balances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY balance_update_own ON public.points_balances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.points_balances TO authenticated;
GRANT ALL ON public.points_balances TO service_role;

CREATE TABLE public.point_packs (
  id uuid PRIMARY KEY, name text NOT NULL, points integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.premium_plans (
  id uuid PRIMARY KEY, name text NOT NULL,
  interval text NOT NULL CHECK (interval IN ('month','year')),
  is_active boolean NOT NULL DEFAULT true
);
CREATE TABLE public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  plan_id uuid NOT NULL, status text NOT NULL DEFAULT 'active',
  current_period_start timestamptz NOT NULL DEFAULT now(),
  current_period_end timestamptz NOT NULL,
  payment_provider text, payment_id text,
  created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  delta integer NOT NULL, metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  reason public.points_reason NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL,
  telegram_charge_id text UNIQUE, payload text NOT NULL,
  amount_stars integer, pack_id text, plan_id text,
  status text NOT NULL DEFAULT 'pending', telegram_invoice_url text,
  confirmed_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own payments" ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service role can insert payments" ON public.payments FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service role can update payments" ON public.payments FOR UPDATE TO service_role USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

CREATE TABLE public.signal_tracking (
  id uuid PRIMARY KEY, user_id uuid NOT NULL, status text NOT NULL,
  current_price double precision, hit_tp integer, activated_at timestamptz,
  resolved_at timestamptz, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.signal_transitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_tracking_id uuid NOT NULL, user_id uuid NOT NULL,
  from_status text NOT NULL, to_status text NOT NULL, event_type text NOT NULL,
  observed_price double precision, tp_index integer, transition_reason text,
  server_received_at timestamptz NOT NULL DEFAULT now(), observed_at timestamptz,
  actor text NOT NULL DEFAULT 'system', source text NOT NULL DEFAULT 'server',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.credit_points(
  _user uuid, _amount integer, _reason public.points_reason, _meta jsonb DEFAULT '{}'::jsonb
) RETURNS integer LANGUAGE plpgsql AS $$
BEGIN
  IF _user = '00000000-0000-0000-0000-000000000099'::uuid THEN
    RAISE EXCEPTION 'simulated credit_points failure';
  END IF;
  INSERT INTO public.points_balances(user_id,balance,lifetime_earned)
  VALUES (_user,_amount,GREATEST(_amount,0))
  ON CONFLICT(user_id) DO UPDATE SET
    balance=public.points_balances.balance+_amount,
    lifetime_earned=public.points_balances.lifetime_earned+GREATEST(_amount,0),
    updated_at=now();
  INSERT INTO public.points_transactions(user_id,delta,metadata,reason)
  VALUES (_user,_amount,COALESCE(_meta,'{}'::jsonb),_reason);
  RETURN _amount;
END $$;

\ir ../migrations/20260811000001_execute_signal_transition_rpc.sql
\ir ../migrations/20261028000000_atomic_telegram_stars_fulfillment.sql
\ir ../migrations/20261102000000_gate5_security_and_stars_payer_binding.sql

-- G5-01: authenticated users cannot forge or mutate point balances.
SET ROLE service_role;
INSERT INTO public.profiles(id,telegram_id) VALUES
 ('00000000-0000-0000-0000-000000000001',12345),
 ('00000000-0000-0000-0000-000000000002',23456),
 ('00000000-0000-0000-0000-000000000099',99999);
RESET ROLE;
SET request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
SET request.jwt.claim.role='authenticated';
SET ROLE authenticated;
DO $$
BEGIN
  BEGIN
    INSERT INTO public.points_balances(user_id,balance) VALUES ('00000000-0000-0000-0000-000000000001',999999);
    RAISE EXCEPTION 'G5-01: authenticated insert unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.points_balances SET balance=999999 WHERE user_id='00000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'G5-01: authenticated update unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  BEGIN
    UPDATE public.profiles SET telegram_id=77777 WHERE id='00000000-0000-0000-0000-000000000001';
    RAISE EXCEPTION 'G5-05: authenticated telegram_id update unexpectedly succeeded';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  UPDATE public.profiles SET display_name='Updated by owner'
   WHERE id='00000000-0000-0000-0000-000000000001';
END $$;
RESET ROLE;
RESET request.jwt.claim.sub;
RESET request.jwt.claim.role;
DO $$
BEGIN
  IF has_function_privilege('authenticated',
    'public.execute_signal_transition(uuid,uuid,timestamp with time zone,text,double precision,integer,timestamp with time zone,timestamp with time zone,text,text,double precision,integer,text,timestamp with time zone,text,text)',
    'EXECUTE') THEN
    RAISE EXCEPTION 'G5-02: authenticated still has EXECUTE on SECURITY DEFINER RPC';
  END IF;
  IF NOT has_function_privilege('service_role',
    'public.execute_signal_transition(uuid,uuid,timestamp with time zone,text,double precision,integer,timestamp with time zone,timestamp with time zone,text,text,double precision,integer,text,timestamp with time zone,text,text)',
    'EXECUTE') THEN
    RAISE EXCEPTION 'G5-02: service_role lost EXECUTE on RPC';
  END IF;
END $$;

-- G5-09: P0004 is asserted explicitly; it is not swallowed by WHEN OTHERS.
INSERT INTO public.signal_tracking(id,user_id,status,updated_at)
VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001','active','2026-01-01T00:00:00Z');
DO $$
BEGIN
  BEGIN
    PERFORM public.execute_signal_transition(
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','00000000-0000-0000-0000-000000000001',
      '2025-01-01T00:00:00Z','expired'
    );
    RAISE EXCEPTION 'G5-09: stale transition unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE 'P0004' THEN
    NULL;
  END;
END $$;

-- Payer binding: wrong Telegram account cannot confirm the order; correct payer is idempotent.
INSERT INTO public.point_packs(id,name,points) VALUES
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Test pack',100);
INSERT INTO public.payments(user_id,telegram_user_id,payload,amount_stars,pack_id)
VALUES ('00000000-0000-0000-0000-000000000001',12345,
 'cccccccc-cccc-cccc-cccc-cccccccccccc',50,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DO $$
BEGIN
  BEGIN
    PERFORM public.process_telegram_stars_payment(
      'cccccccc-cccc-cccc-cccc-cccccccccccc','charge-wrong-payer','XTR',50,99999,NULL
    );
    RAISE EXCEPTION 'wrong Telegram payer was accepted';
  EXCEPTION WHEN insufficient_privilege THEN NULL;
  END;
  IF (SELECT status FROM public.payments WHERE payload='cccccccc-cccc-cccc-cccc-cccccccccccc') <> 'pending' THEN
    RAISE EXCEPTION 'wrong payer mutated order';
  END IF;
END $$;
SELECT public.process_telegram_stars_payment(
 'cccccccc-cccc-cccc-cccc-cccccccccccc','charge-correct-payer','XTR',50,12345,NULL
);
SELECT public.process_telegram_stars_payment(
 'cccccccc-cccc-cccc-cccc-cccccccccccc','charge-correct-payer','XTR',50,12345,NULL
);
DO $$
BEGIN
  IF (SELECT balance FROM public.points_balances WHERE user_id='00000000-0000-0000-0000-000000000001') <> 100 THEN
    RAISE EXCEPTION 'Stars duplicate webhook credited more than once';
  END IF;
  IF (SELECT count(*) FROM public.points_transactions WHERE user_id='00000000-0000-0000-0000-000000000001') <> 1 THEN
    RAISE EXCEPTION 'Stars duplicate webhook created multiple ledger entries';
  END IF;
END $$;

-- Rollback: a failed points grant must leave the order pending and grant no entitlement.
INSERT INTO public.payments(user_id,telegram_user_id,payload,amount_stars,pack_id)
VALUES ('00000000-0000-0000-0000-000000000099',99999,
 'dddddddd-dddd-dddd-dddd-dddddddddddd',70,'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');
DO $$
BEGIN
  BEGIN
    PERFORM public.process_telegram_stars_payment(
      'dddddddd-dddd-dddd-dddd-dddddddddddd','charge-rollback','XTR',70,99999,NULL
    );
    RAISE EXCEPTION 'expected credit_points failure was not raised';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM = 'expected credit_points failure was not raised' THEN RAISE; END IF;
    IF SQLERRM <> 'simulated credit_points failure' THEN RAISE; END IF;
  END;
  IF (SELECT status FROM public.payments WHERE payload='dddddddd-dddd-dddd-dddd-dddddddddddd') <> 'pending' THEN
    RAISE EXCEPTION 'failed grant did not roll back payment confirmation';
  END IF;
  IF EXISTS (SELECT 1 FROM public.points_balances WHERE user_id='00000000-0000-0000-0000-000000000099') THEN
    RAISE EXCEPTION 'failed grant changed point balance';
  END IF;
END $$;
