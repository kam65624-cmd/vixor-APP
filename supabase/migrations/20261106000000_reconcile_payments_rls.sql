-- Reconcile legacy payment policies without changing payment rows or service-role access.
-- This is intentionally a new, uniquely timestamped migration. Historical migrations
-- remain immutable even though two older files share the 20261028000000 version.

BEGIN;

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Remove every known client-facing legacy policy observed in the Production catalog.
-- PostgreSQL combines permissive policies with OR, so leaving even one write policy
-- would keep the corresponding client operation available.
DROP POLICY IF EXISTS "users access own payments" ON public.payments;
DROP POLICY IF EXISTS "users can read own payments" ON public.payments;
DROP POLICY IF EXISTS "users read own payments" ON public.payments;
DROP POLICY IF EXISTS "Read own" ON public.payments;
DROP POLICY IF EXISTS "Insert own" ON public.payments;
DROP POLICY IF EXISTS "Update own" ON public.payments;
DROP POLICY IF EXISTS "Delete own" ON public.payments;

-- Fail closed if Production has any additional client-facing write policy
-- not covered by the reviewed legacy policy names above.
DO $
BEGIN
  IF EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'payments'
       AND cmd IN ('INSERT', 'UPDATE', 'DELETE', 'ALL')
       AND roles && ARRAY['public', 'authenticated']::name[]
  ) THEN
    RAISE EXCEPTION 'Unreviewed client-facing payments write policy remains';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND cmd = 'INSERT' AND roles @> ARRAY['service_role']::name[]
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_policies
     WHERE schemaname = 'public' AND tablename = 'payments'
       AND cmd = 'UPDATE' AND roles @> ARRAY['service_role']::name[]
  ) THEN
    RAISE EXCEPTION 'Required service_role payment policies are missing';
  END IF;
END;
$;

-- Clients may read only rows explicitly bound to their authenticated user_id.
CREATE POLICY "users read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Deliberately retain service_role policies; trusted server-side payment flows own writes.

COMMIT;
