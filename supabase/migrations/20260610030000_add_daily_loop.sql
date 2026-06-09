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
  CREATE POLICY "Users can view own daily loops" ON daily_loops FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own daily loops" ON daily_loops FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own daily loops" ON daily_loops FOR UPDATE USING (auth.uid() = user_id);
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
  CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
