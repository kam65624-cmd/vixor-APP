-- ============================================================================
-- Add Commerce Tables (Points, Premium, Charts)
-- Brings total to 47 tables
-- ============================================================================

-- 6. point_packs — purchasable point packages
CREATE TABLE IF NOT EXISTS public.point_packs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  points      INT NOT NULL,
  price_cents INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.point_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active point packs" ON public.point_packs FOR SELECT USING (is_active = true);

-- 7. points_balances — user point balances
CREATE TABLE IF NOT EXISTS public.points_balances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance         INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.points_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own balance" ON public.points_balances FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert balance" ON public.points_balances FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service can update balance" ON public.points_balances FOR UPDATE USING (auth.uid() = user_id);

-- 8. points_transactions — point credit/debit ledger
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount      INT NOT NULL,
  reason      TEXT NOT NULL,
  source      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_points_tx_user ON public.points_transactions(user_id);

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own transactions" ON public.points_transactions FOR SELECT USING (auth.uid() = user_id);

-- 9. premium_plans — subscription tiers
CREATE TABLE IF NOT EXISTS public.premium_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  price_cents INT NOT NULL DEFAULT 0,
  interval    TEXT NOT NULL DEFAULT 'month' CHECK (interval IN ('month','year')),
  features    JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active plans" ON public.premium_plans FOR SELECT USING (is_active = true);

-- 10. premium_subscriptions — active user subscriptions
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id             UUID NOT NULL REFERENCES public.premium_plans(id),
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled','expired','past_due')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end   TIMESTAMPTZ NOT NULL,
  payment_provider    TEXT,
  payment_id          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_premium_sub_user ON public.premium_subscriptions(user_id);
CREATE INDEX idx_premium_sub_status ON public.premium_subscriptions(status);

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own subscriptions" ON public.premium_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- 11. charts — saved chart configurations / snapshots
CREATE TABLE IF NOT EXISTS public.charts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  pair        TEXT,
  timeframe   TEXT,
  config      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_charts_user ON public.charts(user_id);

ALTER TABLE public.charts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own charts" ON public.charts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own charts" ON public.charts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own charts" ON public.charts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own charts" ON public.charts FOR DELETE USING (auth.uid() = user_id);
