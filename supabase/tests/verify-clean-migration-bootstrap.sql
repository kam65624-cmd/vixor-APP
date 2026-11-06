DO $$
DECLARE missing_tables text[];
BEGIN
  SELECT array_agg(expected.table_name) INTO missing_tables
  FROM (VALUES ('profiles'),('analyses'),('wallet_sessions'),('web3_transactions'),('nft_badges'),('vixor_decisions'),('points_balances'),('points_transactions')) AS expected(table_name)
  WHERE to_regclass('public.' || expected.table_name) IS NULL;
  IF missing_tables IS NOT NULL THEN RAISE EXCEPTION 'Missing expected tables: %', missing_tables; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' AND column_name='xp' AND data_type='integer') THEN
    RAISE EXCEPTION 'profiles.xp is missing or has the wrong type';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='wallet_sessions' AND column_name='user_id' AND data_type='uuid') THEN
    RAISE EXCEPTION 'wallet_sessions.user_id must be UUID';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='vixor_decisions' AND column_name='user_id' AND data_type='uuid') THEN
    RAISE EXCEPTION 'vixor_decisions.user_id must be UUID';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.wallet_sessions'::regclass) THEN
    RAISE EXCEPTION 'RLS is not enabled on wallet_sessions';
  END IF;
END $$;


-- Final migration-chain invariant: clients can read only their own payments and cannot write.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'payments' AND c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'RLS is not enabled on payments after full migration replay';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND (roles @> ARRAY['public']::name[] OR roles @> ARRAY['authenticated']::name[])
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) THEN
    RAISE EXCEPTION 'client write policy remains after full migration replay';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND roles @> ARRAY['public']::name[]
  ) THEN
    RAISE EXCEPTION 'PUBLIC payment policy remains after full migration replay';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND policyname = 'users read own payments'
       AND cmd = 'SELECT'
       AND roles = ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'canonical authenticated read-own payment policy missing after replay';
  END IF;
END $$;
