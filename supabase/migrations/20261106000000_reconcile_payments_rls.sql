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

-- Clients may read only rows explicitly bound to their authenticated user_id.
CREATE POLICY "users read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Deliberately retain service_role policies; trusted server-side payment flows own writes.

COMMIT;
