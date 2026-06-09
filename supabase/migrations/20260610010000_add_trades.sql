-- Vixor Migration: Trades Table
-- Run this SQL in the Supabase Dashboard SQL Editor

CREATE TABLE trades (
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
  CREATE POLICY "Users can view own trades" ON trades FOR SELECT USING (auth.uid() = user_id);
  CREATE POLICY "Users can insert own trades" ON trades FOR INSERT WITH CHECK (auth.uid() = user_id);
  CREATE POLICY "Users can update own trades" ON trades FOR UPDATE USING (auth.uid() = user_id);
  CREATE POLICY "Users can delete own trades" ON trades FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_status ON trades(user_id, status);
CREATE INDEX idx_trades_pair ON trades(user_id, pair);
CREATE INDEX idx_trades_dates ON trades(user_id, entry_date DESC);

-- Auto-update updated_at trigger
DROP TRIGGER IF EXISTS trades_updated_at ON trades;
CREATE TRIGGER trades_updated_at
  BEFORE UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
