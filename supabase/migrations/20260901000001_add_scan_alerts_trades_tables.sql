-- ============================================================================
-- Migration: Add scan_history, user_alerts, and user_trades tables
-- ============================================================================

-- ── 1. scan_history ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.scan_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_name TEXT,
  token_symbol TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  trust_score INTEGER,
  risk_level TEXT CHECK (risk_level IN ('safe', 'low', 'medium', 'high', 'critical')),
  is_honeypot BOOLEAN,
  buy_tax NUMERIC(5,2),
  sell_tax NUMERIC(5,2),
  can_take_back_ownership BOOLEAN,
  is_proxy BOOLEAN,
  lp_burned BOOLEAN,
  holder_count INTEGER,
  top_10_holder_pct NUMERIC(5,2),
  liquidity_usd NUMERIC,
  market_cap_usd NUMERIC,
  raw_result JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_user ON public.scan_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scan_history_token ON public.scan_history(token_address, chain);
CREATE INDEX IF NOT EXISTS idx_scan_history_score ON public.scan_history(trust_score);

ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scan_read_own" ON public.scan_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "scan_insert_own" ON public.scan_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 2. user_alerts ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  alert_type TEXT NOT NULL CHECK (alert_type IN ('rug_detected', 'liquidity_drop', 'whale_buy', 'whale_sell', 'price_spike', 'new_pair', 'trust_change')),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  title TEXT NOT NULL,
  description TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_user ON public.user_alerts(user_id, created_at DESC, is_read);
CREATE INDEX IF NOT EXISTS idx_alerts_token ON public.user_alerts(token_address);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON public.user_alerts(alert_type);

ALTER TABLE public.user_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_read_own" ON public.user_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "alert_insert_own" ON public.user_alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "alert_update_own" ON public.user_alerts FOR UPDATE USING (auth.uid() = user_id);

-- ── 3. user_trades ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address TEXT NOT NULL,
  token_symbol TEXT,
  chain TEXT NOT NULL DEFAULT 'solana',
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  amount NUMERIC NOT NULL,
  price_usd NUMERIC,
  total_usd NUMERIC,
  tx_hash TEXT,
  pnl_usd NUMERIC,
  pnl_pct NUMERIC(5,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trades_user ON public.user_trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trades_token ON public.user_trades(token_address);
CREATE INDEX IF NOT EXISTS idx_trades_status ON public.user_trades(status);

ALTER TABLE public.user_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trade_read_own" ON public.user_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "trade_insert_own" ON public.user_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "trade_update_own" ON public.user_trades FOR UPDATE USING (auth.uid() = user_id);
