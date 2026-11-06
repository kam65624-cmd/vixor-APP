-- Archived unchanged from supabase/migrations to remove a duplicate migration version.
-- The active migration 20261106000000_reconcile_payments_rls.sql supersedes this
-- policy-only migration. The original file name and SQL contents are preserved verbatim.
-- Historical source file: supabase/migrations/20261028000000_lock_down_payment_client_writes.sql

-- Client users may read their own payment history, but must never create,
-- confirm, alter, or delete payment records. Trusted server-side webhook/service
-- role code owns payment state transitions.
BEGIN;

-- Keep the table protected even if an earlier schema drift disabled RLS.
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own payments" ON public.payments;
DROP POLICY IF EXISTS "users can read own payments" ON public.payments;

CREATE POLICY "users can read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
