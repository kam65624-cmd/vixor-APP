-- ============================================================================
-- Phase C.1 — VIXOR AI 4 Agents: vixor_decisions table
-- ============================================================================
-- Stores AI agent decisions, suggestions, warnings, and reports for the
-- Coach, Analyst, Governor, and Hunter agents.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vixor_decisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL CHECK (agent_id IN ('coach', 'analyst', 'governor', 'hunter')),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('suggestion', 'warning', 'block', 'alert', 'report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  feedback TEXT CHECK (feedback IN ('accepted', 'rejected', 'dismissed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  -- workspace context
  workspace TEXT DEFAULT 'os' CHECK (workspace IN ('os', 'bullx', 'axiom', 'opensea')),
  -- metadata
  token_symbol TEXT,
  chain TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_user_id ON vixor_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_agent_id ON vixor_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_user_created ON vixor_decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_feedback ON vixor_decisions(feedback) WHERE feedback IS NULL;

-- RLS Policies
ALTER TABLE vixor_decisions ENABLE ROW LEVEL SECURITY;

-- Users can read their own decisions
CREATE POLICY "Users can read own decisions"
  ON vixor_decisions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (bypasses RLS) can do everything — enforced by Supabase design.
-- For non-service-role inserts/updates, we add explicit policies:

-- No direct INSERT from anon — all inserts go through service role on server
CREATE POLICY "Deny anon inserts"
  ON vixor_decisions
  FOR INSERT
  WITH CHECK (false);

-- No direct UPDATE from anon — feedback updates go through service role API
CREATE POLICY "Deny anon updates"
  ON vixor_decisions
  FOR UPDATE
  USING (false);

-- No direct DELETE from anon
CREATE POLICY "Deny anon deletes"
  ON vixor_decisions
  FOR DELETE
  USING (false);
