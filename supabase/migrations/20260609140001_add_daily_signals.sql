-- Daily Signals Table
CREATE TABLE daily_signals (
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

CREATE INDEX idx_daily_signals_date ON daily_signals(signal_date);

-- User Strategies Table
CREATE TABLE user_strategies (
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

CREATE INDEX idx_user_strategies_user ON user_strategies(user_id);

ALTER TABLE user_strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own strategies" ON user_strategies FOR ALL USING (auth.uid() = user_id);
