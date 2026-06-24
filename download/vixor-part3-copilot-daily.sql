-- ============================================================================
-- Vixor Migration: Copilot Chat Persistence
-- ============================================================================
-- Adds copilot_conversations and copilot_messages tables for persisting
-- AI copilot chat history with multi-agent support.
-- ============================================================================

-- 1. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  agent_id TEXT DEFAULT 'auto', -- auto, market_analyst, risk_manager, news_analyst, strategy_builder
  is_consensus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Copilot Messages Table
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT, -- which agent responded (for assistant messages)
  metadata JSONB DEFAULT '{}', -- store consensus data, handoff info, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Conversations: users can view own
  DROP POLICY IF EXISTS "Users can view own conversations" ON copilot_conversations;
  CREATE POLICY "Users can view own conversations" ON copilot_conversations FOR SELECT USING (auth.uid() = user_id);
  -- Conversations: users can insert own
  DROP POLICY IF EXISTS "Users can insert own conversations" ON copilot_conversations;
  CREATE POLICY "Users can insert own conversations" ON copilot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  -- Conversations: users can update own
  DROP POLICY IF EXISTS "Users can update own conversations" ON copilot_conversations;
  CREATE POLICY "Users can update own conversations" ON copilot_conversations FOR UPDATE USING (auth.uid() = user_id);
  -- Conversations: users can delete own
  DROP POLICY IF EXISTS "Users can delete own conversations" ON copilot_conversations;
  CREATE POLICY "Users can delete own conversations" ON copilot_conversations FOR DELETE USING (auth.uid() = user_id);

  -- Messages: users can view own (via conversation ownership)
  DROP POLICY IF EXISTS "Users can view own messages" ON copilot_messages;
  CREATE POLICY "Users can view own messages" ON copilot_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can insert own
  DROP POLICY IF EXISTS "Users can insert own messages" ON copilot_messages;
  CREATE POLICY "Users can insert own messages" ON copilot_messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can delete own
  DROP POLICY IF EXISTS "Users can delete own messages" ON copilot_messages;
  CREATE POLICY "Users can delete own messages" ON copilot_messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON copilot_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id, created_at ASC);

-- 5. Triggers
DROP TRIGGER IF EXISTS copilot_conversations_updated_at ON copilot_conversations;
CREATE TRIGGER copilot_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Auto-update conversation title based on first user message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND OLD IS NULL THEN
    UPDATE copilot_conversations 
    SET title = LEFT(NEW.content, 50), updated_at = now()
    WHERE id = NEW.conversation_id AND title = 'New Chat';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS copilot_messages_auto_title ON copilot_messages;
CREATE TRIGGER copilot_messages_auto_title
  AFTER INSERT ON copilot_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();
-- ============================================================================
-- Daily Trader Loop — Migration
-- ============================================================================
--
-- Creates the daily_loops and user_streaks tables for the guided daily
-- workflow feature. Run this SQL in the Supabase Dashboard SQL Editor.
-- ============================================================================

-- 1. Daily Loops Table
CREATE TABLE IF NOT EXISTS daily_loops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Morning Prep
  morning_prep_completed BOOLEAN DEFAULT false,
  morning_prep_at TIMESTAMPTZ,
  market_bias TEXT, -- bullish, bearish, neutral
  key_levels TEXT, -- key support/resistance levels noted
  watchlist_reviewed BOOLEAN DEFAULT false,

  -- Session Tracking
  london_session_traded BOOLEAN DEFAULT false,
  london_session_notes TEXT,
  ny_session_traded BOOLEAN DEFAULT false,
  ny_session_notes TEXT,
  asian_session_traded BOOLEAN DEFAULT false,
  asian_session_notes TEXT,

  -- End of Day Review
  eod_review_completed BOOLEAN DEFAULT false,
  eod_review_at TIMESTAMPTZ,
  daily_pnl NUMERIC,
  trades_taken INTEGER DEFAULT 0,
  rules_followed INTEGER DEFAULT 0,
  rules_broken INTEGER DEFAULT 0,
  emotional_state TEXT CHECK (emotional_state IN ('disciplined', 'anxious', 'fomo', 'revenge', 'calm', 'tired')) DEFAULT 'calm',
  lessons_learned TEXT,
  tomorrow_plan TEXT,

  -- Streak
  completion_percentage NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE daily_loops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own daily loops" ON daily_loops;
  CREATE POLICY "Users can view own daily loops" ON daily_loops FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own daily loops" ON daily_loops;
  CREATE POLICY "Users can insert own daily loops" ON daily_loops FOR INSERT WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own daily loops" ON daily_loops;
  CREATE POLICY "Users can update own daily loops" ON daily_loops FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can delete own daily loops" ON daily_loops;
  CREATE POLICY "Users can delete own daily loops" ON daily_loops FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_loops_user_date ON daily_loops(user_id, date DESC);

-- Trigger
DROP TRIGGER IF EXISTS daily_loops_updated_at ON daily_loops;
CREATE TRIGGER daily_loops_updated_at
  BEFORE UPDATE ON daily_loops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
  CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
  CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
  CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
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
DROP POLICY IF EXISTS "Anyone can read daily signals" ON daily_signals;
CREATE POLICY "Anyone can read daily signals"
  ON daily_signals
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert signals (cron job generates them)
DROP POLICY IF EXISTS "Service role can insert daily signals" ON daily_signals;
CREATE POLICY "Service role can insert daily signals"
  ON daily_signals
  FOR INSERT
  WITH CHECK (false); -- Block direct inserts from anon/authenticated users; use service role only

-- Policy: Only service role can update signals
DROP POLICY IF EXISTS "Service role can update daily signals" ON daily_signals;
CREATE POLICY "Service role can update daily signals"
  ON daily_signals
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Policy: Only service role can delete signals
DROP POLICY IF EXISTS "Service role can delete daily signals" ON daily_signals;
CREATE POLICY "Service role can delete daily signals"
  ON daily_signals
  FOR DELETE
  USING (false);

-- Add index for common query pattern
CREATE INDEX IF NOT EXISTS idx_daily_signals_date_pair
  ON daily_signals (signal_date DESC, pair);
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
DROP POLICY IF EXISTS "Service role can manage domain_events" ON domain_events;
CREATE POLICY "Service role can manage domain_events"
  ON domain_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Regular users can read their own events (future: user-scoped events)
DROP POLICY IF EXISTS "Users can read domain_events" ON domain_events;
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
DROP POLICY IF EXISTS "Service role can manage user_memories" ON user_memories;
CREATE POLICY "Service role can manage user_memories"
  ON user_memories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own memories
DROP POLICY IF EXISTS "Users can read own memories" ON user_memories;
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
-- ============================================================================
-- VIXOR — QuantDinger Reuse Schema (Phase 1)
-- ============================================================================
--
-- Adds 5 tables for the infrastructure ported from QuantDinger:
--
--   user_settings     — per-user notification + LLM preferences
--   notifications     — in-app notification queue (consumed by /notifications)
--   agent_tokens      — personal access tokens for the programmatic API
--   agent_jobs        — long-running agent jobs (queued / running / done)
--   agent_audit_log   — every API call made with an agent token
--
-- All tables enable RLS with a "users access own rows" policy via auth.uid().
-- ============================================================================

-- ── user_settings ──────────────────────────────────────────────────────────
-- One row per user. Created on first preference save.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_channels JSONB NOT NULL DEFAULT '["telegram","in-app"]'::jsonb,
  preferred_llm_provider TEXT NOT NULL DEFAULT 'zai',
  llm_api_keys         JSONB NOT NULL DEFAULT '{}'::jsonb, -- encrypted blob per provider
  telegram_chat_id     TEXT,
  webhook_url          TEXT,
