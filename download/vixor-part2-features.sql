CREATE POLICY "own chart read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own chart insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "own chart delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'charts' AND auth.uid()::text = (storage.foldername(name))[1]);
-- User Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Watchlist Items
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'forex',
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, pair)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- RLS
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent — DROP IF EXISTS before CREATE)
DO $$ BEGIN
  -- watchlists policies
  DROP POLICY IF EXISTS "Users can view own watchlists" ON watchlists;
  CREATE POLICY "Users can view own watchlists" ON watchlists FOR SELECT USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can create own watchlists" ON watchlists;
  CREATE POLICY "Users can create own watchlists" ON watchlists FOR INSERT WITH CHECK (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can update own watchlists" ON watchlists;
  CREATE POLICY "Users can update own watchlists" ON watchlists FOR UPDATE USING (user_id = auth.uid());

  DROP POLICY IF EXISTS "Users can delete own watchlists" ON watchlists;
  CREATE POLICY "Users can delete own watchlists" ON watchlists FOR DELETE USING (user_id = auth.uid());

  -- watchlist_items policies
  DROP POLICY IF EXISTS "Users can view items in own watchlists" ON watchlist_items;
  CREATE POLICY "Users can view items in own watchlists" ON watchlist_items FOR SELECT USING (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );

  DROP POLICY IF EXISTS "Users can add items to own watchlists" ON watchlist_items;
  CREATE POLICY "Users can add items to own watchlists" ON watchlist_items FOR INSERT WITH CHECK (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );

  DROP POLICY IF EXISTS "Users can update items in own watchlists" ON watchlist_items;
  CREATE POLICY "Users can update items in own watchlists" ON watchlist_items FOR UPDATE USING (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );

  DROP POLICY IF EXISTS "Users can delete items from own watchlists" ON watchlist_items;
  CREATE POLICY "Users can delete items from own watchlists" ON watchlist_items FOR DELETE USING (
    watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
  );
END $$;

-- Auto-create default watchlist for new users
CREATE OR REPLACE FUNCTION create_default_watchlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO watchlists (user_id, name, is_default, sort_order)
  VALUES (NEW.id, 'My Watchlist', true, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_watchlist();
-- Phase 1: Analysis Context Expansion
-- This migration adds necessary fields to provide rich contextual analysis instead of simple signals.

-- 1. Add context fields to the analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS trend VARCHAR(20),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS risk_reasons TEXT[],
ADD COLUMN IF NOT EXISTS invalidation_level DECIMAL(15,5),
ADD COLUMN IF NOT EXISTS liquidity_zones JSONB,
ADD COLUMN IF NOT EXISTS market_structure JSONB,
ADD COLUMN IF NOT EXISTS key_levels JSONB,
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'CHART_UPLOAD',
ADD COLUMN IF NOT EXISTS opportunity_id UUID;

-- 2. Add total_xp and skills to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS technical_analysis_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_management_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS psychology_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trade_management_score INTEGER DEFAULT 0;
-- Add signal_badge and vixor_message columns to analyses table
ALTER TABLE analyses
ADD COLUMN IF NOT EXISTS signal_badge JSONB,
ADD COLUMN IF NOT EXISTS vixor_message TEXT;
-- Price Alerts Table
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

-- Enable RLS
ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own alerts" ON price_alerts;
CREATE POLICY "Users can manage their own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);
-- Daily Signals Table
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

-- User Strategies Table
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
DROP POLICY IF EXISTS "Users can manage their own strategies" ON user_strategies;
CREATE POLICY "Users can manage their own strategies" ON user_strategies FOR ALL USING (auth.uid() = user_id);
CREATE TABLE IF NOT EXISTS trading_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT, -- optional: link to a trading pair like "BTC/USD"
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL, -- optional: link to an analysis
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}', -- array of tags like ['setup', 'lesson', 'review']
  mood TEXT CHECK (mood IN ('confident', 'cautious', 'anxious', 'neutral')) DEFAULT 'neutral',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE trading_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own notes" ON trading_notes;
CREATE POLICY "Users can view own notes" ON trading_notes FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own notes" ON trading_notes;
CREATE POLICY "Users can insert own notes" ON trading_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own notes" ON trading_notes;
CREATE POLICY "Users can update own notes" ON trading_notes FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own notes" ON trading_notes;
CREATE POLICY "Users can delete own notes" ON trading_notes FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trading_notes_user_id ON trading_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_notes_pair ON trading_notes(pair) WHERE pair IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trading_notes_analysis_id ON trading_notes(analysis_id) WHERE analysis_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_trading_notes_pinned ON trading_notes(user_id, is_pinned) WHERE is_pinned = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trading_notes_updated_at
  BEFORE UPDATE ON trading_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- Vixor Migration: Trades Table
-- Run this SQL in the Supabase Dashboard SQL Editor

CREATE TABLE IF NOT EXISTS trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('long', 'short')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),

  -- Entry
  entry_price NUMERIC NOT NULL,
  entry_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  quantity NUMERIC, -- position size (lots/units)

  -- Exit (nullable until trade is closed)
  exit_price NUMERIC,
  exit_date TIMESTAMPTZ,

  -- Risk Management
  stop_loss NUMERIC,
  take_profit NUMERIC,

  -- Calculated Fields
  pnl NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN exit_price IS NULL THEN NULL
      WHEN direction = 'long' THEN (exit_price - entry_price) * COALESCE(quantity, 1)
      WHEN direction = 'short' THEN (entry_price - exit_price) * COALESCE(quantity, 1)
    END
  ) STORED,
  pnl_pips NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN exit_price IS NULL THEN NULL
      WHEN direction = 'long' THEN exit_price - entry_price
      WHEN direction = 'short' THEN entry_price - exit_price
    END
  ) STORED,
  r_multiple NUMERIC GENERATED ALWAYS AS (
    CASE
      WHEN exit_price IS NULL OR stop_loss IS NULL OR stop_loss = entry_price THEN NULL
      ELSE (CASE WHEN direction = 'long' THEN exit_price - entry_price ELSE entry_price - exit_price END)
        / ABS(entry_price - stop_loss)
    END
  ) STORED,

  -- Metadata
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  strategy TEXT,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own trades" ON trades;
  CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own trades" ON trades;
  CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own trades" ON trades;
  CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can delete own trades" ON trades;
  CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_status ON trades(user_id, status);
CREATE INDEX IF NOT EXISTS idx_trades_pair ON trades(user_id, pair);
CREATE INDEX IF NOT EXISTS idx_trades_dates ON trades(user_id, entry_date DESC);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
