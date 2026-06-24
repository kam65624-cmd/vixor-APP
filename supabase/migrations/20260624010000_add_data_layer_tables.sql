-- ============================================================================
-- VIXOR Data Layer — Additional Tables
-- ============================================================================
-- Adds: pairs, news_cache, price_history, enhanced signals/positions
-- ============================================================================

BEGIN;

-- 1. pairs — master asset registry (pairs can exist without users)
CREATE TABLE IF NOT EXISTS public.pairs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT UNIQUE NOT NULL,
    label TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('forex', 'crypto', 'metal', 'stock', 'index')),
    decimals INT NOT NULL DEFAULT 4,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pairs_category ON public.pairs(category);

-- 2. news_cache — cached news articles from Finnhub/DexScreener
CREATE TABLE IF NOT EXISTS public.news_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol TEXT,
    category TEXT NOT NULL DEFAULT 'general',
    headline TEXT NOT NULL,
    summary TEXT,
    source TEXT,
    url TEXT,
    datetime TIMESTAMPTZ,
    sentiment TEXT CHECK (sentiment IN ('bullish', 'bearish', 'neutral')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_news_symbol ON public.news_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_news_created ON public.news_cache(created_at DESC);

-- 3. price_history — OHLCV candles for charts
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pair TEXT NOT NULL,
    timeframe TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    open NUMERIC(20, 8),
    high NUMERIC(20, 8),
    low NUMERIC(20, 8),
    close NUMERIC(20, 8),
    volume NUMERIC(20, 8),
    UNIQUE(pair, timeframe, timestamp)
);

CREATE INDEX IF NOT EXISTS idx_price_lookup ON public.price_history(pair, timeframe, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_price_recent ON public.price_history(pair, timeframe) WHERE timestamp > now() - interval '7 days';

-- 4. strategies — user trading strategies
CREATE TABLE IF NOT EXISTS public.strategies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    code TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('running', 'idle', 'failed')),
    last_run_at TIMESTAMPTZ,
    return_pct NUMERIC(8, 4),
    sharpe NUMERIC(6, 3),
    win_rate NUMERIC(4, 3),
    trades_count INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own strategies" ON public.strategies FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Service role full access strategies" ON public.strategies FOR ALL USING (auth.role() = 'service_role');

COMMIT;
