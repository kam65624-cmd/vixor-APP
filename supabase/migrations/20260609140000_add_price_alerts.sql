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
