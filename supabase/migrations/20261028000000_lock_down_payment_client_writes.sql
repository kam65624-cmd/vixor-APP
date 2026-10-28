-- Client users may read their own payment history, but must never create,
-- confirm, alter, or delete payment records. Trusted server-side webhook/service
-- role code owns payment state transitions.
BEGIN;

DROP POLICY IF EXISTS "users access own payments" ON public.payments;
DROP POLICY IF EXISTS "users can read own payments" ON public.payments;

CREATE POLICY "users can read own payments"
  ON public.payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

COMMIT;
