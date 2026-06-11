-- ============================================================================
-- VIXOR User Memories Table — Long-term Memory Storage (PostgreSQL Only)
-- ============================================================================
--
-- Stores structured user memories for the Copilot Agent:
--   - preference: User preferences (pairs, timeframes, style)
--   - behavior: Observed behavior patterns
--   - mistake: Trading mistakes for learning
--   - insight: Copilot-generated insights
--   - strategy: Active trading strategy notes
--
-- NO pgvector, NO embeddings — pure structured memory.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('preference', 'behavior', 'mistake', 'insight', 'strategy')),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One memory per user+category+key combination
  UNIQUE(user_id, category, key)
);

-- Index for fast user memory lookups
CREATE INDEX IF NOT EXISTS idx_user_memories_user_category ON user_memories (user_id, category);

-- RLS: Users can only access their own memories
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can manage user_memories"
  ON user_memories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own memories
CREATE POLICY "Users can read own memories"
  ON user_memories
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_memories_updated_at
  BEFORE UPDATE ON user_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memories_updated_at();
