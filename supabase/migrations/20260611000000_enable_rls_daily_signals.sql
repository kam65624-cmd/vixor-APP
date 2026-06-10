-- ============================================================================
-- VIXOR MASTER V2 Phase 0: Enable RLS on daily_signals table
-- ============================================================================
-- Previously, daily_signals had NO Row Level Security, meaning any
-- authenticated user could read ALL signals and potentially modify them.
-- Signals are semi-public (any user should be able to read today's signals),
-- but only the system (service role) should be able to insert/update/delete.

-- Enable RLS
ALTER TABLE daily_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read signals (they are meant to be visible)
CREATE POLICY "Anyone can read daily signals"
  ON daily_signals
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert signals (cron job generates them)
CREATE POLICY "Service role can insert daily signals"
  ON daily_signals
  FOR INSERT
  WITH CHECK (false); -- Block direct inserts from anon/authenticated users; use service role only

-- Policy: Only service role can update signals
CREATE POLICY "Service role can update daily signals"
  ON daily_signals
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Policy: Only service role can delete signals
CREATE POLICY "Service role can delete daily signals"
  ON daily_signals
  FOR DELETE
  USING (false);

-- Add index for common query pattern
CREATE INDEX IF NOT EXISTS idx_daily_signals_date_pair
  ON daily_signals (signal_date DESC, pair);
