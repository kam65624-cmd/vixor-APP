-- ============================================================================
-- Add Missing Core Tables (T-09 compliance)
-- Brings total from 36 → 47 tables
-- ============================================================================

-- 1. profiles — extends auth.users with VIXOR-specific data
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT,
  telegram_id   BIGINT UNIQUE,
  xp            INT NOT NULL DEFAULT 0,
  connected_brokers JSONB NOT NULL DEFAULT '[]'::jsonb,
  preferences   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. analyses — token analysis results (chart + AI)
CREATE TABLE IF NOT EXISTS public.analyses (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_path        TEXT,
  status            TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','complete','failed')),
  pair              TEXT,
  timeframe         TEXT,
  trend             TEXT,
  risk_level        TEXT,
  risk_reasons      JSONB,
  invalidation_level TEXT,
  liquidity_zones   JSONB,
  market_structure  JSONB,
  key_levels        JSONB,
  recommendation    TEXT,
  confidence        NUMERIC(5,2),
  entry             NUMERIC(20,8),
  stop_loss         NUMERIC(20,8),
  take_profit       NUMERIC(20,8),
  rr                NUMERIC(5,2),
  pattern           TEXT,
  reasons           JSONB,
  scenarios         JSONB,
  management        JSONB,
  news              JSONB,
  raw_ai_response   JSONB,
  source            TEXT DEFAULT 'chart_upload',
  signal_badge      JSONB,
  vixor_message     TEXT,
  error_message     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX idx_analyses_status ON public.analyses(status);
CREATE INDEX idx_analyses_pair ON public.analyses(pair);

ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own analyses" ON public.analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own analyses" ON public.analyses FOR UPDATE USING (auth.uid() = user_id);

-- 3. paper_trades — virtual trading simulation
CREATE TABLE IF NOT EXISTS public.paper_trades (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair            TEXT NOT NULL,
  direction       TEXT NOT NULL CHECK (direction IN ('BUY','SELL')),
  entry_price     NUMERIC(20,8) NOT NULL,
  stop_loss       NUMERIC(20,8),
  take_profit     NUMERIC(20,8),
  size_pct        NUMERIC(5,2) DEFAULT 100,
  status          TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN','CLOSED_WIN','CLOSED_LOSS','CLOSED_BE')),
  opened_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at       TIMESTAMPTZ,
  exit_price      NUMERIC(20,8),
  pnl_pct         NUMERIC(8,2),
  agent_confidence NUMERIC(5,2),
  debate_summary  TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_paper_trades_user_id ON public.paper_trades(user_id);
CREATE INDEX idx_paper_trades_status ON public.paper_trades(status);
CREATE INDEX idx_paper_trades_pair ON public.paper_trades(pair);

ALTER TABLE public.paper_trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own paper trades" ON public.paper_trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own paper trades" ON public.paper_trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own paper trades" ON public.paper_trades FOR UPDATE USING (auth.uid() = user_id);

-- 4. notifications — in-app notification queue
CREATE TABLE IF NOT EXISTS public.notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel       TEXT NOT NULL DEFAULT 'in-app',
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','read','failed')),
  severity      TEXT DEFAULT 'info' CHECK (severity IN ('info','warning','success','error')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at       TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_created ON public.notifications(created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- 5. backtest_results — backtest simulation output
CREATE TABLE IF NOT EXISTS public.backtest_results (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  pair            TEXT,
  timeframe       TEXT,
  strategy_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_trades    INT DEFAULT 0,
  win_rate        NUMERIC(5,2),
  total_pnl_pct   NUMERIC(10,2),
  max_drawdown    NUMERIC(10,2),
  sharpe_ratio    NUMERIC(8,2),
  equity_curve    JSONB,
  trades_log      JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_backtest_results_user_id ON public.backtest_results(user_id);

ALTER TABLE public.backtest_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own backtest results" ON public.backtest_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own backtest results" ON public.backtest_results FOR INSERT WITH CHECK (auth.uid() = user_id);
