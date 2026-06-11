-- ============================================================================
-- VIXOR Domain Events Table — Event Log for the Intelligence Platform
-- ============================================================================
--
-- Stores all domain events for observability, audit, and replay.
-- Events are persisted non-blocking by the EventOrchestrator.
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  source TEXT,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by event type (e.g., "get all alert.triggered events")
CREATE INDEX IF NOT EXISTS idx_domain_events_event_type ON domain_events (event_type);

-- Index for querying by time range (e.g., "get events from last hour")
CREATE INDEX IF NOT EXISTS idx_domain_events_created_at ON domain_events (created_at DESC);

-- Index for trace correlation
CREATE INDEX IF NOT EXISTS idx_domain_events_trace_id ON domain_events (trace_id) WHERE trace_id IS NOT NULL;

-- RLS: Only service role can insert (server-side only)
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage domain_events"
  ON domain_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Regular users can read their own events (future: user-scoped events)
CREATE POLICY "Users can read domain_events"
  ON domain_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Auto-cleanup: Delete events older than 30 days
-- (Optional: run via pg_cron or Vercel cron)
-- CREATE OR REPLACE FUNCTION clean_old_domain_events() RETURNS void AS $$
--   DELETE FROM domain_events WHERE created_at < now() - interval '30 days';
-- $$ LANGUAGE sql;
