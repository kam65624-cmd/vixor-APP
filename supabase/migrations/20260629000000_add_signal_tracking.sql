-- ============================================================================
-- VIXOR Phase 2: Signal Tracking Table
-- ============================================================================
-- Per-user signal lifecycle tracking. Users "follow" daily signals or analysis
-- results, and the system monitors them for TP/SL hits via real-time prices.
-- ============================================================================

CREATE TYPE signal_status AS ENUM (
  'pending',    -- Created, waiting for entry to be reached
  'active',     -- Entry reached, now monitoring TP/SL
  'tp1_hit',    -- First take-profit level hit
  'tp2_hit',    -- Second take-profit level hit
  'tp3_hit',    -- Third take-profit level hit
  'sl_hit',     -- Stop-loss hit
  'expired',    -- Signal expired (time-based)
  'cancelled'   -- User manually cancelled
);

CREATE TABLE signal_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signal_id UUID REFERENCES daily_signals(id),
  source_type TEXT NOT NULL DEFAULT 'daily_signal',
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL', 'WAIT')),
  entry_price DOUBLE PRECISION,
  stop_loss DOUBLE PRECISION,
  take_profit JSONB DEFAULT '[]'::jsonb,
  status signal_status NOT NULL DEFAULT 'pending',
  current_price DOUBLE PRECISION,
  previous_price DOUBLE PRECISION,
  max_favorable_excursion DOUBLE PRECISION DEFAULT 0,
  max_adverse_excursion DOUBLE PRECISION DEFAULT 0,
  hit_tp INTEGER DEFAULT 0,
  activated_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_signal_tracking_user_status ON signal_tracking(user_id, status);
CREATE INDEX idx_signal_tracking_pair ON signal_tracking(pair);
CREATE INDEX idx_signal_tracking_status ON signal_tracking(status) WHERE status IN ('pending', 'active');

-- RLS: Users can only see/modify their own tracking
ALTER TABLE signal_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signal_tracking_select_own" ON signal_tracking
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "signal_tracking_insert_own" ON signal_tracking
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "signal_tracking_update_own" ON signal_tracking
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "signal_tracking_delete_own" ON signal_tracking
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass for server-side cron operations
CREATE POLICY "signal_tracking_service_role" ON signal_tracking
  FOR ALL USING (auth.role() = 'service_role');