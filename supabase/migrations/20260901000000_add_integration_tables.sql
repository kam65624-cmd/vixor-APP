-- ============================================================================
-- Integration Tables — watchlist, user_settings, whale_wallets
-- These complement the existing shield tables (contract_scans, etc.)
-- ============================================================================

-- ── 1. user_watchlist ────────────────────────────────────────────────────────
-- Tokens the user is actively monitoring

CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address    TEXT NOT NULL,
  token_name       TEXT,
  token_symbol     TEXT,
  chain            TEXT NOT NULL DEFAULT 'solana',
  image_url        TEXT,
  notes            TEXT,
  alert_enabled    BOOLEAN NOT NULL DEFAULT false,
  alert_type       TEXT CHECK (alert_type IN ('price_above','price_below','volume_spike','rug_detected')),
  alert_threshold  NUMERIC,
  last_risk_level  TEXT CHECK (last_risk_level IN ('safe','low','medium','high','critical')),
  added_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_watchlist_unique ON public.user_watchlist(user_id, token_address, chain);
CREATE INDEX idx_user_watchlist_user_id ON public.user_watchlist(user_id);
CREATE INDEX idx_user_watchlist_created ON public.user_watchlist(created_at DESC);

ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own watchlist" ON public.user_watchlist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own watchlist" ON public.user_watchlist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own watchlist" ON public.user_watchlist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own watchlist" ON public.user_watchlist FOR DELETE USING (auth.uid() = user_id);


-- ── 2. user_settings ─────────────────────────────────────────────────────────
-- Per-user application preferences

CREATE TABLE IF NOT EXISTS public.user_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_chain            TEXT NOT NULL DEFAULT 'solana',
  default_currency         TEXT NOT NULL DEFAULT 'usd',
  alert_sound_enabled      BOOLEAN NOT NULL DEFAULT true,
  alert_push_enabled       BOOLEAN NOT NULL DEFAULT true,
  alert_telegram_enabled   BOOLEAN NOT NULL DEFAULT false,
  scan_auto_save           BOOLEAN NOT NULL DEFAULT true,
  compact_mode             BOOLEAN NOT NULL DEFAULT false,
  language                 TEXT NOT NULL DEFAULT 'en',
  timezone                 TEXT NOT NULL DEFAULT 'UTC',
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own settings" ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own settings" ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own settings" ON public.user_settings FOR UPDATE USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION user_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW
  EXECUTE FUNCTION user_settings_touch_updated_at();


-- ── 3. whale_wallets ─────────────────────────────────────────────────────────
-- User-tracked smart money / whale wallets

CREATE TABLE IF NOT EXISTS public.whale_wallets (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address   TEXT NOT NULL,
  label            TEXT,
  chain            TEXT NOT NULL DEFAULT 'solana',
  total_pnl_usd    NUMERIC,
  win_rate         NUMERIC(5,2),
  total_trades     INTEGER,
  is_smart_money   BOOLEAN NOT NULL DEFAULT false,
  last_active      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, wallet_address, chain)
);

CREATE INDEX idx_whale_wallets_user_id ON public.whale_wallets(user_id);
CREATE INDEX idx_whale_wallets_address ON public.whale_wallets(wallet_address);

ALTER TABLE public.whale_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own whale wallets" ON public.whale_wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own whale wallets" ON public.whale_wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own whale wallets" ON public.whale_wallets FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own whale wallets" ON public.whale_wallets FOR DELETE USING (auth.uid() = user_id);
