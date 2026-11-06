-- Verify authenticated clients can read only their own rows and cannot mutate payment state.
SET ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', false);

DO $$
DECLARE
  affected INTEGER;
  visible_rows INTEGER;
BEGIN
  SELECT count(*) INTO visible_rows FROM public.payments;
  IF visible_rows <> 1 THEN
    RAISE EXCEPTION 'RLS read isolation failed: expected one own payment row, got %', visible_rows;
  END IF;

  UPDATE public.payments SET status = 'confirmed' WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'authenticated role updated a payment row';
  END IF;

  DELETE FROM public.payments WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 0 THEN
    RAISE EXCEPTION 'authenticated role deleted a payment row';
  END IF;

  BEGIN
    INSERT INTO public.payments (user_id, payload, amount_stars, pack_id, status)
    VALUES (auth.uid(), 'forged-payload', 1, 'pack-a', 'confirmed');
    RAISE EXCEPTION 'authenticated role inserted a forged payment';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.payments SET status = 'confirmed' WHERE payload = 'payload-a';
  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN
    RAISE EXCEPTION 'service role cannot update payment state';
  END IF;
END $$;
RESET ROLE;

-- The reconciliation must leave exactly one client policy: authenticated SELECT own.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND (roles @> ARRAY['public']::name[] OR roles @> ARRAY['authenticated']::name[])
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
  ) THEN
    RAISE EXCEPTION 'legacy client write policy remains on public.payments';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND roles @> ARRAY['public']::name[]
  ) THEN
    RAISE EXCEPTION 'legacy PUBLIC payment policy remains';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND policyname = 'users read own payments'
       AND cmd = 'SELECT'
       AND roles = ARRAY['authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'canonical authenticated read-own policy is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND policyname = 'service role can insert payments'
       AND cmd = 'INSERT'
       AND roles = ARRAY['service_role']::name[]
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND policyname = 'service role can update payments'
       AND cmd = 'UPDATE'
       AND roles = ARRAY['service_role']::name[]
  ) THEN
    RAISE EXCEPTION 'trusted service_role payment policies were not preserved';
  END IF;
END $$;
