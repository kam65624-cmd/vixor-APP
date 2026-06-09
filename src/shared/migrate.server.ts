// ============================================================================
// Vixor Auto-Migration Runner — Creates missing tables on server startup
// ============================================================================
//
// This script checks if the required tables exist and creates them if they don't.
// It's designed to be called once on server startup or manually via API endpoint.
//
// It uses the Supabase Admin client (service role key) to execute raw SQL
// through the REST API. Since PostgREST doesn't support raw SQL execution,
// we use a workaround: try to select from each table, and if it fails with
// "relation does not exist", we know we need to create it.
//
// However, we can't create tables through PostgREST. The actual table creation
// must be done through the Supabase Dashboard SQL Editor or the CLI.
//
// This file exports:
// 1. `checkMigrations()` - Checks which tables exist and returns status
// 2. `getMigrationSQL()` - Returns the SQL that needs to be executed
// ============================================================================

export interface MigrationStatus {
  price_alerts: boolean;
  daily_signals: boolean;
  user_strategies: boolean;
  trading_notes: boolean;
  trades: boolean;
  copilot_conversations: boolean;
  copilot_messages: boolean;
  daily_loops: boolean;
  user_streaks: boolean;
  allComplete: boolean;
  sql: string;
}

export function getMigrationSQL(): string {
  return `
-- Vixor Migration: Price Alerts, Daily Signals, User Strategies
-- Run this SQL in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/lrbgxrfvjxaixtzkutxn/sql

-- 1. Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  pair TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'crosses_up', 'crosses_down')),
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled')),
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  timeframe TEXT DEFAULT '1H'
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(status) WHERE status = 'active';

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Daily Signals Table
CREATE TABLE IF NOT EXISTS daily_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('BUY', 'SELL', 'WAIT')),
  confidence NUMERIC NOT NULL,
  entry NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC[],
  reasons TEXT[],
  pattern TEXT,
  market_structure JSONB,
  liquidity_zones JSONB,
  signal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_signals_date ON daily_signals(signal_date);

-- 3. User Strategies Table
CREATE TABLE IF NOT EXISTS user_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Strategy',
  pairs TEXT[] NOT NULL DEFAULT '{}',
  trading_style TEXT NOT NULL DEFAULT 'Day Trading',
  risk_tolerance TEXT NOT NULL DEFAULT 'MEDIUM',
  preferred_timeframes TEXT[] NOT NULL DEFAULT '{1H,4H}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_strategies_user ON user_strategies(user_id);

ALTER TABLE user_strategies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own strategies" ON user_strategies FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Trading Notes Table
CREATE TABLE IF NOT EXISTS trading_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  mood TEXT CHECK (mood IN ('confident', 'cautious', 'anxious', 'neutral')) DEFAULT 'neutral',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trading_notes_user_id ON trading_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_notes_pair ON trading_notes(pair) WHERE pair IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trading_notes_analysis_id ON trading_notes(analysis_id) WHERE analysis_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trading_notes_pinned ON trading_notes(user_id, is_pinned) WHERE is_pinned = true;

ALTER TABLE trading_notes ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own notes" ON trading_notes FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own notes" ON trading_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own notes" ON trading_notes FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own notes" ON trading_notes FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trading_notes_updated_at ON trading_notes;
CREATE TRIGGER trading_notes_updated_at
  BEFORE UPDATE ON trading_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 5. Trades Table
CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  entry_price NUMERIC NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity NUMERIC,
  exit_price NUMERIC,
  exit_date TIMESTAMPTZ,
  stop_loss NUMERIC,
  take_profit NUMERIC,
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  strategy TEXT,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Note: Generated columns (pnl, pnl_pips, r_multiple) require raw SQL execution
-- in the Supabase Dashboard. See supabase/migrations/20260610010000_add_trades.sql
-- for the full migration with generated columns.

CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(user_id, pair);
CREATE INDEX IF NOT EXISTS idx_trades_dates ON trades(user_id, entry_date DESC);

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  agent_id TEXT DEFAULT 'auto',
  is_consensus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Copilot Messages Table
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users can view own conversations" ON copilot_conversations FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own conversations" ON copilot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own conversations" ON copilot_conversations FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own conversations" ON copilot_conversations FOR DELETE USING (auth.uid() = user_id);
  CREATE POLICY "Users can view own messages" ON copilot_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  CREATE POLICY "Users can insert own messages" ON copilot_messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  CREATE POLICY "Users can delete own messages" ON copilot_messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON copilot_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id, created_at ASC);

DROP TRIGGER IF EXISTS copilot_conversations_updated_at ON copilot_conversations;
CREATE TRIGGER copilot_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

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

-- 8. Daily Loops Table
CREATE TABLE IF NOT EXISTS daily_loops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_prep_completed BOOLEAN DEFAULT false,
  morning_prep_at TIMESTAMPTZ,
  market_bias TEXT,
  key_levels TEXT,
  watchlist_reviewed BOOLEAN DEFAULT false,
  london_session_traded BOOLEAN DEFAULT false,
  london_session_notes TEXT,
  ny_session_traded BOOLEAN DEFAULT false,
  ny_session_notes TEXT,
  asian_session_traded BOOLEAN DEFAULT false,
  asian_session_notes TEXT,
  eod_review_completed BOOLEAN DEFAULT false,
  eod_review_at TIMESTAMPTZ,
  daily_pnl NUMERIC,
  trades_taken INTEGER DEFAULT 0,
  rules_followed INTEGER DEFAULT 0,
  rules_broken INTEGER DEFAULT 0,
  emotional_state TEXT CHECK (emotional_state IN ('disciplined', 'anxious', 'fomo', 'revenge', 'calm', 'tired')) DEFAULT 'calm',
  lessons_learned TEXT,
  tomorrow_plan TEXT,
  completion_percentage NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_loops_user_date ON daily_loops(user_id, date DESC);

ALTER TABLE daily_loops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can view own daily loops" ON daily_loops FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own daily loops" ON daily_loops FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own daily loops" ON daily_loops FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own daily loops" ON daily_loops FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS daily_loops_updated_at ON daily_loops;
CREATE TRIGGER daily_loops_updated_at
  BEFORE UPDATE ON daily_loops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 9. User Streaks Table
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
  CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;
}

export async function checkMigrations(): Promise<MigrationStatus> {
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Check each table by attempting a select
  const [alertsRes, signalsRes, strategiesRes, notesRes, tradesRes, copilotConvRes, copilotMsgRes, loopsRes, streaksRes] = await Promise.all([
    supabaseAdmin.from("price_alerts").select("id").limit(1),
    supabaseAdmin.from("daily_signals").select("id").limit(1),
    supabaseAdmin.from("user_strategies").select("id").limit(1),
    supabaseAdmin.from("trading_notes").select("id").limit(1),
    supabaseAdmin.from("trades").select("id").limit(1),
    supabaseAdmin.from("copilot_conversations").select("id").limit(1),
    supabaseAdmin.from("copilot_messages").select("id").limit(1),
    supabaseAdmin.from("daily_loops").select("id").limit(1),
    supabaseAdmin.from("user_streaks").select("id").limit(1),
  ]);

  const priceAlerts = !alertsRes.error || alertsRes.error.code !== "42P01";
  const dailySignals = !signalsRes.error || signalsRes.error.code !== "42P01";
  const userStrategies = !strategiesRes.error || strategiesRes.error.code !== "42P01";
  const tradingNotes = !notesRes.error || notesRes.error.code !== "42P01";
  const tradesTable = !tradesRes.error || tradesRes.error.code !== "42P01";
  const copilotConversations = !copilotConvRes.error || copilotConvRes.error.code !== "42P01";
  const copilotMessages = !copilotMsgRes.error || copilotMsgRes.error.code !== "42P01";
  const dailyLoops = !loopsRes.error || loopsRes.error.code !== "42P01";
  const userStreaks = !streaksRes.error || streaksRes.error.code !== "42P01";

  const allComplete = priceAlerts && dailySignals && userStrategies && tradingNotes && tradesTable && copilotConversations && copilotMessages && dailyLoops && userStreaks;

  return {
    price_alerts: priceAlerts,
    daily_signals: dailySignals,
    user_strategies: userStrategies,
    trading_notes: tradingNotes,
    trades: tradesTable,
    copilot_conversations: copilotConversations,
    copilot_messages: copilotMessages,
    daily_loops: dailyLoops,
    user_streaks: userStreaks,
    allComplete,
    sql: allComplete ? "" : getMigrationSQL(),
  };
}
