-- ============================================================================
-- VIXOR Phase 3: Signal Transitions Audit Table
-- ============================================================================
-- Records every valid signal state transition for audit, compliance,
-- and debugging. Each row is an immutable record of a single transition.
-- ============================================================================

CREATE TABLE signal_transitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_tracking_id UUID NOT NULL REFERENCES signal_tracking(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  event_type TEXT NOT NULL,
  observed_price DOUBLE PRECISION,
  tp_index INTEGER,
  transition_reason TEXT,
  server_received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  observed_at TIMESTAMPTZ,
  actor TEXT NOT NULL DEFAULT 'system',
  source TEXT NOT NULL DEFAULT 'server',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX idx_signal_transitions_tracking_id ON signal_transitions(signal_tracking_id);
CREATE INDEX idx_signal_transitions_user_id ON signal_transitions(user_id);
CREATE INDEX idx_signal_transitions_created_at ON signal_transitions(created_at);

-- RLS: Users can only see their own transition history
ALTER TABLE signal_transitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "signal_transitions_select_own" ON signal_transitions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "signal_transitions_service_role" ON signal_transitions
  FOR ALL USING (auth.role() = 'service_role');
