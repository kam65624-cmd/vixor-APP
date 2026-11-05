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
