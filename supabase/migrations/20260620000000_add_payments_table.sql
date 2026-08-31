-- ============================================================================
-- VIXOR — Payments Table (Phase 3)
-- ============================================================================
-- Stores all payment records for audit and verification.
-- Telegram Stars payments are confirmed via webhook and stored here.
-- Used by verifyStarsPayment() to validate charges before crediting points.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_charge_id   TEXT UNIQUE,
  payload             TEXT NOT NULL,           -- userId_packId_timestamp (from createInvoiceLink)
  amount_stars        INT,
  pack_id             TEXT REFERENCES point_packs(id) ON DELETE SET NULL,
  plan_id             TEXT REFERENCES premium_plans(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | failed
  telegram_invoice_url TEXT,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_charge_id ON payments (telegram_charge_id) WHERE telegram_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status) WHERE status IN ('pending', 'confirmed');

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own payments" ON payments;
CREATE POLICY "users access own payments"
  ON payments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert/update (webhook handler)
DROP POLICY IF EXISTS "service role can insert payments" ON payments;
CREATE POLICY "service role can insert payments"
  ON payments FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service role can update payments" ON payments;
CREATE POLICY "service role can update payments"
  ON payments FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);
