-- ============================================================
-- Migration: Add Discovery Domain Tables
-- Created: 2026-06-23
-- Phase: B.4 — Memecoin Discovery
-- ============================================================
-- Tables:
--   1. memecoin_discoveries  — Cache for scored token discoveries
--   2. social_signals        — Social media signal tracking
-- ============================================================

-- ── 1. memecoin_discoveries ────────────────────────────────────
-- Caches scored token results from the 5-stage discovery pipeline.
-- Updated every 30s via polling / scan endpoint.

CREATE TABLE IF NOT EXISTS public.memecoin_discoveries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_address  TEXT NOT NULL,
  symbol         TEXT NOT NULL,
  name           TEXT NOT NULL,
  chain          TEXT NOT NULL,
  price          NUMERIC(24, 12),
  change_24h     NUMERIC(12, 6),
  volume_24h     NUMERIC(24, 2),
  liquidity      NUMERIC(24, 2),
  market_cap     NUMERIC(24, 2),
  discovery_score   INTEGER NOT NULL DEFAULT 0 CHECK (discovery_score BETWEEN 0 AND 100),
  smart_money_score INTEGER NOT NULL DEFAULT 0 CHECK (smart_money_score BETWEEN 0 AND 100),
  social_score      INTEGER NOT NULL DEFAULT 0 CHECK (social_score BETWEEN 0 AND 100),
  liquidity_score   INTEGER NOT NULL DEFAULT 0 CHECK (liquidity_score BETWEEN 0 AND 100),
  age_score         INTEGER NOT NULL DEFAULT 0 CHECK (age_score BETWEEN 0 AND 100),
  risk_level        TEXT NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low', 'medium', 'high')),
  nft_badge         TEXT NOT NULL DEFAULT 'none' CHECK (nft_badge IN ('none', 'nft', 'collection', 'verified')),
  raw_data         JSONB DEFAULT '{}'::jsonb,
  scanned_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_chain
  ON public.memecoin_discoveries (chain);
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_discovery_score
  ON public.memecoin_discoveries (discovery_score DESC);
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_symbol
  ON public.memecoin_discoveries (symbol);
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_scanned_at
  ON public.memecoin_discoveries (scanned_at DESC);
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_user_id
  ON public.memecoin_discoveries (user_id);
CREATE INDEX IF NOT EXISTS idx_memecoin_discoveries_risk_level
  ON public.memecoin_discoveries (risk_level);
-- Unique constraint to prevent duplicate entries per address+chain
CREATE UNIQUE INDEX IF NOT EXISTS idx_memecoin_discoveries_address_chain
  ON public.memecoin_discoveries (token_address, chain);

-- ── 2. social_signals ──────────────────────────────────────────
-- Stores social media signals from Twitter, Telegram, Reddit, LunarCrush.

CREATE TABLE IF NOT EXISTS public.social_signals (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_symbol     TEXT NOT NULL,
  source           TEXT NOT NULL CHECK (source IN ('twitter', 'telegram', 'reddit', 'lunarcrush')),
  mentions         INTEGER NOT NULL DEFAULT 0,
  sentiment        NUMERIC(4, 3) NOT NULL DEFAULT 0 CHECK (sentiment BETWEEN -1 AND 1),
  engagement       INTEGER NOT NULL DEFAULT 0,
  influencer_score INTEGER NOT NULL DEFAULT 0 CHECK (influencer_score BETWEEN 0 AND 100),
  window_start     TIMESTAMPTZ NOT NULL,
  window_end       TIMESTAMPTZ NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_social_signals_token_symbol
  ON public.social_signals (token_symbol);
CREATE INDEX IF NOT EXISTS idx_social_signals_source
  ON public.social_signals (source);
CREATE INDEX IF NOT EXISTS idx_social_signals_window
  ON public.social_signals (window_start DESC, window_end DESC);
CREATE INDEX IF NOT EXISTS idx_social_signals_created_at
  ON public.social_signals (created_at DESC);

-- ── RLS Policies ──────────────────────────────────────────────

-- Enable RLS on both tables
ALTER TABLE public.memecoin_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_signals ENABLE ROW LEVEL SECURITY;

-- memecoin_discoveries: authenticated users can read all, write their own
CREATE POLICY "discoveries_select_authenticated"
  ON public.memecoin_discoveries
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "discoveries_insert_authenticated"
  ON public.memecoin_discoveries
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "discoveries_update_authenticated"
  ON public.memecoin_discoveries
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "discoveries_delete_authenticated"
  ON public.memecoin_discoveries
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- social_signals: authenticated users can read all, write requires service role
CREATE POLICY "social_signals_select_authenticated"
  ON public.social_signals
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "social_signals_insert_service"
  ON public.social_signals
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "social_signals_update_service"
  ON public.social_signals
  FOR UPDATE
  TO service_role
  USING (true);

-- ── Updated_at trigger ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER memecoin_discoveries_updated_at
  BEFORE UPDATE ON public.memecoin_discoveries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
