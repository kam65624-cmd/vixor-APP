
-- Enums
CREATE TYPE public.analysis_status AS ENUM ('queued','processing','complete','failed');
CREATE TYPE public.recommendation_type AS ENUM ('BUY','SELL','WAIT');
CREATE TYPE public.points_reason AS ENUM ('signup_bonus','analysis_cost','pack_purchase','referral_bonus','daily_streak','premium_grant','admin_adjust');

-- updated_at helper
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  referral_code TEXT NOT NULL UNIQUE,
  referred_by UUID REFERENCES public.profiles(id),
  streak_days INT NOT NULL DEFAULT 0,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- points_balances
CREATE TABLE public.points_balances (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0,
  lifetime_earned INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_balances TO authenticated;
GRANT ALL ON public.points_balances TO service_role;
ALTER TABLE public.points_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own balance read" ON public.points_balances FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- points_transactions
CREATE TABLE public.points_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delta INT NOT NULL,
  reason public.points_reason NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.points_transactions TO authenticated;
GRANT ALL ON public.points_transactions TO service_role;
ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tx read" ON public.points_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_points_tx_user ON public.points_transactions(user_id, created_at DESC);

-- point_packs (public catalog)
CREATE TABLE public.point_packs (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  points INT NOT NULL,
  bonus_points INT NOT NULL DEFAULT 0,
  price_cents INT NOT NULL,
  badge TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.point_packs TO anon, authenticated;
GRANT ALL ON public.point_packs TO service_role;
ALTER TABLE public.point_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packs public read" ON public.point_packs FOR SELECT USING (is_active);

-- premium_plans (public catalog)
CREATE TABLE public.premium_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_cents INT NOT NULL,
  interval TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  badge TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);
GRANT SELECT ON public.premium_plans TO anon, authenticated;
GRANT ALL ON public.premium_plans TO service_role;
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plans public read" ON public.premium_plans FOR SELECT USING (is_active);

-- premium_subscriptions
CREATE TABLE public.premium_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES public.premium_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.premium_subscriptions TO authenticated;
GRANT ALL ON public.premium_subscriptions TO service_role;
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sub read" ON public.premium_subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_sub_user_active ON public.premium_subscriptions(user_id, current_period_end DESC);

-- analyses
CREATE TABLE public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT,
  timeframe TEXT,
  image_path TEXT,
  status public.analysis_status NOT NULL DEFAULT 'queued',
  recommendation public.recommendation_type,
  confidence INT,
  entry NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC[],
  rr TEXT,
  pattern TEXT,
  reasons TEXT[],
  scenarios JSONB,
  management TEXT[],
  news JSONB,
  raw_ai_response JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.analyses TO authenticated;
GRANT ALL ON public.analyses TO service_role;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own analyses read" ON public.analyses FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own analyses insert" ON public.analyses FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_analyses_user ON public.analyses(user_id, created_at DESC);
CREATE TRIGGER analyses_updated BEFORE UPDATE ON public.analyses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notif read" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own notif update" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX idx_notif_user ON public.notifications(user_id, created_at DESC);

-- Referral code generator
CREATE OR REPLACE FUNCTION public.gen_referral_code()
RETURNS TEXT LANGUAGE plpgsql SET search_path = public AS $$
DECLARE c TEXT; ok BOOLEAN := false;
BEGIN
  WHILE NOT ok LOOP
    c := upper(substr(replace(gen_random_uuid()::text,'-',''),1,8));
    PERFORM 1 FROM public.profiles WHERE referral_code = c;
    IF NOT FOUND THEN ok := true; END IF;
  END LOOP;
  RETURN c;
END $$;

-- Atomic spend
CREATE OR REPLACE FUNCTION public.spend_points(_user UUID, _amount INT, _reason public.points_reason, _meta JSONB DEFAULT '{}'::jsonb)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_bal INT;
BEGIN
  UPDATE public.points_balances SET balance = balance - _amount, updated_at = now()
    WHERE user_id = _user AND balance >= _amount RETURNING balance INTO new_bal;
  IF new_bal IS NULL THEN RAISE EXCEPTION 'INSUFFICIENT_POINTS'; END IF;
  INSERT INTO public.points_transactions(user_id, delta, reason, metadata) VALUES (_user, -_amount, _reason, _meta);
  RETURN new_bal;
END $$;

-- Atomic credit
CREATE OR REPLACE FUNCTION public.credit_points(_user UUID, _amount INT, _reason public.points_reason, _meta JSONB DEFAULT '{}'::jsonb)
RETURNS INT LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_bal INT;
BEGIN
  INSERT INTO public.points_balances(user_id, balance, lifetime_earned) VALUES (_user, _amount, _amount)
    ON CONFLICT (user_id) DO UPDATE SET balance = points_balances.balance + _amount,
      lifetime_earned = points_balances.lifetime_earned + _amount, updated_at = now()
    RETURNING balance INTO new_bal;
  INSERT INTO public.points_transactions(user_id, delta, reason, metadata) VALUES (_user, _amount, _reason, _meta);
  RETURN new_bal;
END $$;

-- Auto provision new user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE code TEXT;
BEGIN
  code := public.gen_referral_code();
  INSERT INTO public.profiles(id, display_name, avatar_url, referral_code, telegram_id)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
      NEW.raw_user_meta_data->>'avatar_url',
      code,
      NULLIF(NEW.raw_user_meta_data->>'telegram_id','')::BIGINT
    );
  INSERT INTO public.points_balances(user_id, balance, lifetime_earned) VALUES (NEW.id, 200, 200);
  INSERT INTO public.points_transactions(user_id, delta, reason) VALUES (NEW.id, 200, 'signup_bonus');
  RETURN NEW;
END $$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Seed catalog
INSERT INTO public.point_packs(id,name,points,bonus_points,price_cents,badge,sort_order) VALUES
  ('starter','Starter',100,0,299,NULL,1),
  ('pro','Pro',500,50,1299,'Popular',2),
  ('whale','Whale',2000,400,3999,'Best value',3);

INSERT INTO public.premium_plans(id,name,price_cents,interval,features,badge,sort_order) VALUES
  ('monthly','Monthly',1499,'month','["Unlimited analyses","Priority queue","Advanced patterns","No ads"]'::jsonb,NULL,1),
  ('yearly','Yearly',11999,'year','["Unlimited analyses","Priority queue","Advanced patterns","No ads","2 months free"]'::jsonb,'Save 33%',2);

REVOKE EXECUTE ON FUNCTION public.spend_points(UUID, INT, public.points_reason, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.credit_points(UUID, INT, public.points_reason, JSONB) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_referral_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.spend_points(UUID, INT, public.points_reason, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_points(UUID, INT, public.points_reason, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.gen_referral_code() TO service_role;

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
-- ============================================================================
-- Vixor Migration: Copilot Chat Persistence
-- ============================================================================
-- Adds copilot_conversations and copilot_messages tables for persisting
-- AI copilot chat history with multi-agent support.
-- ============================================================================

-- 1. Copilot Conversations Table
CREATE TABLE IF NOT EXISTS copilot_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Chat',
  agent_id TEXT DEFAULT 'auto', -- auto, market_analyst, risk_manager, news_analyst, strategy_builder
  is_consensus BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Copilot Messages Table
CREATE TABLE IF NOT EXISTS copilot_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES copilot_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  agent_id TEXT, -- which agent responded (for assistant messages)
  metadata JSONB DEFAULT '{}', -- store consensus data, handoff info, etc.
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Row Level Security
ALTER TABLE copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE copilot_messages ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Conversations: users can view own
  DROP POLICY IF EXISTS "Users can view own conversations" ON copilot_conversations;
  CREATE POLICY "Users can view own conversations" ON copilot_conversations FOR SELECT USING (auth.uid() = user_id);
  -- Conversations: users can insert own
  DROP POLICY IF EXISTS "Users can insert own conversations" ON copilot_conversations;
  CREATE POLICY "Users can insert own conversations" ON copilot_conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
  -- Conversations: users can update own
  DROP POLICY IF EXISTS "Users can update own conversations" ON copilot_conversations;
  CREATE POLICY "Users can update own conversations" ON copilot_conversations FOR UPDATE USING (auth.uid() = user_id);
  -- Conversations: users can delete own
  DROP POLICY IF EXISTS "Users can delete own conversations" ON copilot_conversations;
  CREATE POLICY "Users can delete own conversations" ON copilot_conversations FOR DELETE USING (auth.uid() = user_id);

  -- Messages: users can view own (via conversation ownership)
  DROP POLICY IF EXISTS "Users can view own messages" ON copilot_messages;
  CREATE POLICY "Users can view own messages" ON copilot_messages FOR SELECT USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can insert own
  DROP POLICY IF EXISTS "Users can insert own messages" ON copilot_messages;
  CREATE POLICY "Users can insert own messages" ON copilot_messages FOR INSERT WITH CHECK (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
  -- Messages: users can delete own
  DROP POLICY IF EXISTS "Users can delete own messages" ON copilot_messages;
  CREATE POLICY "Users can delete own messages" ON copilot_messages FOR DELETE USING (
    conversation_id IN (SELECT id FROM copilot_conversations WHERE user_id = auth.uid())
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON copilot_conversations(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON copilot_messages(conversation_id, created_at ASC);

-- 5. Triggers
DROP TRIGGER IF EXISTS copilot_conversations_updated_at ON copilot_conversations;
CREATE TRIGGER copilot_conversations_updated_at
  BEFORE UPDATE ON copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. Auto-update conversation title based on first user message
CREATE OR REPLACE FUNCTION auto_title_conversation()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' AND OLD IS NULL THEN
    UPDATE copilot_conversations 
    SET title = LEFT(NEW.content, 50), updated_at = now()
    WHERE id = NEW.conversation_id AND title = 'New Chat';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS copilot_messages_auto_title ON copilot_messages;
CREATE TRIGGER copilot_messages_auto_title
  AFTER INSERT ON copilot_messages
  FOR EACH ROW EXECUTE FUNCTION auto_title_conversation();
-- ============================================================================
-- Daily Trader Loop — Migration
-- ============================================================================
--
-- Creates the daily_loops and user_streaks tables for the guided daily
-- workflow feature. Run this SQL in the Supabase Dashboard SQL Editor.
-- ============================================================================

-- 1. Daily Loops Table
CREATE TABLE IF NOT EXISTS daily_loops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Morning Prep
  morning_prep_completed BOOLEAN DEFAULT false,
  morning_prep_at TIMESTAMPTZ,
  market_bias TEXT, -- bullish, bearish, neutral
  key_levels TEXT, -- key support/resistance levels noted
  watchlist_reviewed BOOLEAN DEFAULT false,

  -- Session Tracking
  london_session_traded BOOLEAN DEFAULT false,
  london_session_notes TEXT,
  ny_session_traded BOOLEAN DEFAULT false,
  ny_session_notes TEXT,
  asian_session_traded BOOLEAN DEFAULT false,
  asian_session_notes TEXT,

  -- End of Day Review
  eod_review_completed BOOLEAN DEFAULT false,
  eod_review_at TIMESTAMPTZ,
  daily_pnl NUMERIC,
  trades_taken INTEGER DEFAULT 0,
  rules_followed INTEGER DEFAULT 0,
  rules_broken INTEGER DEFAULT 0,
  emotional_state TEXT CHECK (emotional_state IN ('disciplined', 'anxious', 'fomo', 'revenge', 'calm', 'tired')) DEFAULT 'calm',
  lessons_learned TEXT,
  tomorrow_plan TEXT,

  -- Streak
  completion_percentage NUMERIC DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, date)
);

-- RLS
ALTER TABLE daily_loops ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own daily loops" ON daily_loops;
  CREATE POLICY "Users can view own daily loops" ON daily_loops FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own daily loops" ON daily_loops;
  CREATE POLICY "Users can insert own daily loops" ON daily_loops FOR INSERT WITH CHECK (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own daily loops" ON daily_loops;
  CREATE POLICY "Users can update own daily loops" ON daily_loops FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can delete own daily loops" ON daily_loops;
  CREATE POLICY "Users can delete own daily loops" ON daily_loops FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_daily_loops_user_date ON daily_loops(user_id, date DESC);

-- Trigger
DROP TRIGGER IF EXISTS daily_loops_updated_at ON daily_loops;
CREATE TRIGGER daily_loops_updated_at
  BEFORE UPDATE ON daily_loops
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2. User Streaks Table
CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Users can view own streaks" ON user_streaks;
  CREATE POLICY "Users can view own streaks" ON user_streaks FOR SELECT USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can update own streaks" ON user_streaks;
  CREATE POLICY "Users can update own streaks" ON user_streaks FOR UPDATE USING (auth.uid() = user_id);
  DROP POLICY IF EXISTS "Users can insert own streaks" ON user_streaks;
  CREATE POLICY "Users can insert own streaks" ON user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
-- ============================================================================
-- VIXOR MASTER V2 Phase 0: Enable RLS on daily_signals table
-- ============================================================================
-- Previously, daily_signals had NO Row Level Security, meaning any
-- authenticated user could read ALL signals and potentially modify them.
-- Signals are semi-public (any user should be able to read today's signals),
-- but only the system (service role) should be able to insert/update/delete.

-- Enable RLS
ALTER TABLE daily_signals ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can read signals (they are meant to be visible)
DROP POLICY IF EXISTS "Anyone can read daily signals" ON daily_signals;
CREATE POLICY "Anyone can read daily signals"
  ON daily_signals
  FOR SELECT
  USING (true);

-- Policy: Only service role can insert signals (cron job generates them)
DROP POLICY IF EXISTS "Service role can insert daily signals" ON daily_signals;
CREATE POLICY "Service role can insert daily signals"
  ON daily_signals
  FOR INSERT
  WITH CHECK (false); -- Block direct inserts from anon/authenticated users; use service role only

-- Policy: Only service role can update signals
DROP POLICY IF EXISTS "Service role can update daily signals" ON daily_signals;
CREATE POLICY "Service role can update daily signals"
  ON daily_signals
  FOR UPDATE
  USING (false)
  WITH CHECK (false);

-- Policy: Only service role can delete signals
DROP POLICY IF EXISTS "Service role can delete daily signals" ON daily_signals;
CREATE POLICY "Service role can delete daily signals"
  ON daily_signals
  FOR DELETE
  USING (false);

-- Add index for common query pattern
CREATE INDEX IF NOT EXISTS idx_daily_signals_date_pair
  ON daily_signals (signal_date DESC, pair);
-- ============================================================================
-- VIXOR Domain Events Table — Event Log for the Intelligence Platform
-- ============================================================================
--
-- Stores all domain events for observability, audit, and replay.
-- Events are persisted non-blocking by the EventOrchestrator.
-- ============================================================================

CREATE TABLE IF NOT EXISTS domain_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}',
  source TEXT,
  trace_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying by event type (e.g., "get all alert.triggered events")
CREATE INDEX IF NOT EXISTS idx_domain_events_event_type ON domain_events (event_type);

-- Index for querying by time range (e.g., "get events from last hour")
CREATE INDEX IF NOT EXISTS idx_domain_events_created_at ON domain_events (created_at DESC);

-- Index for trace correlation
CREATE INDEX IF NOT EXISTS idx_domain_events_trace_id ON domain_events (trace_id) WHERE trace_id IS NOT NULL;

-- RLS: Only service role can insert (server-side only)
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "Service role can manage domain_events" ON domain_events;
CREATE POLICY "Service role can manage domain_events"
  ON domain_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Regular users can read their own events (future: user-scoped events)
DROP POLICY IF EXISTS "Users can read domain_events" ON domain_events;
CREATE POLICY "Users can read domain_events"
  ON domain_events
  FOR SELECT
  TO authenticated
  USING (true);

-- Auto-cleanup: Delete events older than 30 days
-- (Optional: run via pg_cron or Vercel cron)
-- CREATE OR REPLACE FUNCTION clean_old_domain_events() RETURNS void AS $$
--   DELETE FROM domain_events WHERE created_at < now() - interval '30 days';
-- $$ LANGUAGE sql;
-- ============================================================================
-- VIXOR User Memories Table — Long-term Memory Storage (PostgreSQL Only)
-- ============================================================================
--
-- Stores structured user memories for the Copilot Agent:
--   - preference: User preferences (pairs, timeframes, style)
--   - behavior: Observed behavior patterns
--   - mistake: Trading mistakes for learning
--   - insight: Copilot-generated insights
--   - strategy: Active trading strategy notes
--
-- NO pgvector, NO embeddings — pure structured memory.
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_memories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('preference', 'behavior', 'mistake', 'insight', 'strategy')),
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  confidence REAL NOT NULL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  source TEXT NOT NULL DEFAULT 'system',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One memory per user+category+key combination
  UNIQUE(user_id, category, key)
);

-- Index for fast user memory lookups
CREATE INDEX IF NOT EXISTS idx_user_memories_user_category ON user_memories (user_id, category);

-- RLS: Users can only access their own memories
ALTER TABLE user_memories ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "Service role can manage user_memories" ON user_memories;
CREATE POLICY "Service role can manage user_memories"
  ON user_memories
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can read their own memories
DROP POLICY IF EXISTS "Users can read own memories" ON user_memories;
CREATE POLICY "Users can read own memories"
  ON user_memories
  FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_memories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_memories_updated_at
  BEFORE UPDATE ON user_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_user_memories_updated_at();
-- ============================================================================
-- VIXOR — QuantDinger Reuse Schema (Phase 1)
-- ============================================================================
--
-- Adds 5 tables for the infrastructure ported from QuantDinger:
--
--   user_settings     — per-user notification + LLM preferences
--   notifications     — in-app notification queue (consumed by /notifications)
--   agent_tokens      — personal access tokens for the programmatic API
--   agent_jobs        — long-running agent jobs (queued / running / done)
--   agent_audit_log   — every API call made with an agent token
--
-- All tables enable RLS with a "users access own rows" policy via auth.uid().
-- ============================================================================

-- ── user_settings ──────────────────────────────────────────────────────────
-- One row per user. Created on first preference save.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_channels JSONB NOT NULL DEFAULT '["telegram","in-app"]'::jsonb,
  preferred_llm_provider TEXT NOT NULL DEFAULT 'zai',
  llm_api_keys         JSONB NOT NULL DEFAULT '{}'::jsonb, -- encrypted blob per provider
  telegram_chat_id     TEXT,
  webhook_url          TEXT,
  webhook_secret       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read / write ONLY their own row
DROP POLICY IF EXISTS "users access own user_settings" ON user_settings;
CREATE POLICY "users access own user_settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS by default (used by NotificationRouter, LLMRouter, etc.)

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION vixor_user_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_touch_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_touch_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION vixor_user_settings_touch_updated_at();

-- ── notifications ──────────────────────────────────────────────────────────
-- In-app notification queue. Populated by NotificationRouter "in-app" channel.
--
-- IMPORTANT: The `notifications` table was created earlier in
-- `20260607170345_*.sql` with columns (id, user_id, title, body, type, read_at, created_at).
-- To preserve backward compatibility with the existing alert-checker (which
-- writes title/body/type) and the existing /notifications page (which reads
-- `*` and updates read_at), we EXTEND the existing table with new columns
-- instead of replacing it.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS channel    TEXT,
  ADD COLUMN IF NOT EXISTS payload    JSONB,
  ADD COLUMN IF NOT EXISTS status     TEXT,
  ADD COLUMN IF NOT EXISTS sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error      TEXT;

-- Backfill: every existing row is an in-app notification that was already sent.
UPDATE notifications
SET
  channel = COALESCE(channel, 'in-app'),
  payload = COALESCE(payload, jsonb_build_object(
              'title', title,
              'body',  COALESCE(body, ''),
              'type',  COALESCE(type, 'info')
            )),
  status  = COALESCE(status, CASE WHEN read_at IS NOT NULL THEN 'read' ELSE 'sent' END)
WHERE channel IS NULL OR payload IS NULL OR status IS NULL;

-- Going forward: enforce sane defaults + NOT NULL on the new columns.
ALTER TABLE notifications
  ALTER COLUMN channel  SET DEFAULT 'in-app',
  ALTER COLUMN channel  SET NOT NULL,
  ALTER COLUMN payload  SET DEFAULT '{}'::jsonb,
  ALTER COLUMN payload  SET NOT NULL,
  ALTER COLUMN status   SET DEFAULT 'pending',
  ALTER COLUMN status   SET NOT NULL;

-- Composite index for "fetch unread by user" (used by NotificationRouter + /notifications).
CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON notifications (user_id, status)
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- Ensure RLS is enabled (idempotent — original migration already enabled it).
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Replace the policy with a unified FOR ALL policy that covers the new use cases.
DROP POLICY IF EXISTS "own notif read"      ON notifications;
DROP POLICY IF EXISTS "own notif update"    ON notifications;
DROP POLICY IF EXISTS "users access own notifications" ON notifications;
CREATE POLICY "users access own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── agent_tokens ───────────────────────────────────────────────────────────
-- Personal access tokens for the programmatic API (copilot-from-script,
-- automated trading, etc.). NEVER store the raw token — only its SHA-256 hash.

CREATE TABLE IF NOT EXISTS agent_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE, -- sha256(token) hex
  scopes       TEXT[] NOT NULL DEFAULT '{}',
  name         TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_token_hash
  ON agent_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_user
  ON agent_tokens (user_id);

ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_tokens" ON agent_tokens;
CREATE POLICY "users access own agent_tokens"
  ON agent_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── agent_jobs ─────────────────────────────────────────────────────────────
-- Long-running agent jobs. Status transitions: queued → running → done | failed.

CREATE TABLE IF NOT EXISTS agent_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id   UUID REFERENCES agent_tokens(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed | cancelled
  progress   INT NOT NULL DEFAULT 0,         -- 0..100
  result     JSONB,
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_user_created
  ON agent_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_status
  ON agent_jobs (status)
  WHERE status IN ('queued', 'running');

ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_jobs" ON agent_jobs;
CREATE POLICY "users access own agent_jobs"
  ON agent_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION vixor_agent_jobs_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_jobs_touch_updated_at ON agent_jobs;
CREATE TRIGGER trg_agent_jobs_touch_updated_at
  BEFORE UPDATE ON agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION vixor_agent_jobs_touch_updated_at();

-- ── agent_audit_log ────────────────────────────────────────────────────────
-- Append-only audit log of every API call made with an agent token.
-- RLS-enabled but typically only WRITTEN by service role (server).

CREATE TABLE IF NOT EXISTS agent_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  token_id    UUID,
  route       TEXT NOT NULL,
  method      TEXT NOT NULL,
  status      INT,
  duration_ms INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_user_created
  ON agent_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_token
  ON agent_audit_log (token_id)
  WHERE token_id IS NOT NULL;

ALTER TABLE agent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_audit_log" ON agent_audit_log;
CREATE POLICY "users access own agent_audit_log"
  ON agent_audit_log
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can always insert (server-side audit logging).
DROP POLICY IF EXISTS "service role can insert agent_audit_log" ON agent_audit_log;
CREATE POLICY "service role can insert agent_audit_log"
  ON agent_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
-- ============================================================================
-- VIXOR — Experiments Tables
-- ============================================================================
-- Adds the `experiments` and `experiment_generations` tables for the
-- QuantDinger-ported experiment runner. RLS enforces user ownership.
-- ============================================================================

-- Parent experiment record
create table if not exists public.experiments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  config          jsonb not null,
  result          jsonb,
  status          text not null default 'running',
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  constraint experiments_status_chk check (status in ('running','completed','failed','cancelled'))
);

create index if not exists experiments_user_id_created_at_idx
  on public.experiments (user_id, created_at desc);

-- Per-generation snapshots (best/avg scores, full population)
create table if not exists public.experiment_generations (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid not null references public.experiments(id) on delete cascade,
  generation      int  not null,
  best_score      jsonb,
  avg_score       jsonb,
  population      jsonb,
  created_at      timestamptz not null default now(),
  constraint experiment_generations_generation_chk check (generation >= 0)
);

create index if not exists experiment_generations_experiment_id_idx
  on public.experiment_generations (experiment_id, generation);

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
alter table public.experiments                enable row level security;
alter table public.experiment_generations     enable row level security;

drop policy if exists "experiments_select_own"    on public.experiments;
drop policy if exists "experiments_insert_own"    on public.experiments;
drop policy if exists "experiments_update_own"    on public.experiments;
drop policy if exists "experiments_delete_own"    on public.experiments;

create policy "experiments_select_own" on public.experiments
  for select using (auth.uid() = user_id);
create policy "experiments_insert_own" on public.experiments
  for insert with check (auth.uid() = user_id);
create policy "experiments_update_own" on public.experiments
  for update using (auth.uid() = user_id);
create policy "experiments_delete_own" on public.experiments
  for delete using (auth.uid() = user_id);

drop policy if exists "experiment_generations_select_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_insert_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_update_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_delete_own"  on public.experiment_generations;

create policy "experiment_generations_select_own" on public.experiment_generations
  for select using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_insert_own" on public.experiment_generations
  for insert with check (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_update_own" on public.experiment_generations
  for update using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_delete_own" on public.experiment_generations
  for delete using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
-- ============================================================================
-- VIXOR — Payments Table (Phase 3)
-- ============================================================================
-- Stores all payment records for audit and verification.
-- Telegram Stars payments are confirmed via webhook and stored here.
-- Used by verifyStarsPayment() to validate charges before crediting points.
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  telegram_charge_id   TEXT UNIQUE,
  payload             TEXT NOT NULL,           -- userId_packId_timestamp (from createInvoiceLink)
  amount_stars        INT,
  pack_id             TEXT REFERENCES point_packs(id) ON DELETE SET NULL,
  plan_id             TEXT REFERENCES premium_plans(id) ON DELETE SET NULL,
  status              TEXT NOT NULL DEFAULT 'pending',  -- pending | confirmed | failed
  telegram_invoice_url TEXT,
  confirmed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_charge_id ON payments (telegram_charge_id) WHERE telegram_charge_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments (status) WHERE status IN ('pending', 'confirmed');

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own payments" ON payments;
CREATE POLICY "users access own payments"
  ON payments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can insert/update (webhook handler)
DROP POLICY IF EXISTS "service role can insert payments" ON payments;
CREATE POLICY "service role can insert payments"
  ON payments FOR INSERT TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "service role can update payments" ON payments;
CREATE POLICY "service role can update payments"
  ON payments FOR UPDATE TO service_role
  USING (true)
  WITH CHECK (true);
-- ============================================================================
-- VIXOR — Arbitrage Domain Schema
-- ============================================================================
--
-- Ported from axiom-arbitrage-trading-bot. Adds 3 tables:
--
--   arbitrage_opportunities  — detected opportunities (with TTL)
--   arbitrage_executions     — executed trades (dry-run + live)
--   arbitrage_bot_stats      — daily stats (one row per day)
--
-- All tables enable RLS with "users access own rows" policy via auth.uid().
-- Service role bypasses RLS for bot operations (background scanning).
-- ============================================================================

-- ── arbitrage_opportunities ─────────────────────────────────────────────────
-- Detected arbitrage opportunities. TTL = 3-4 seconds (very short-lived).

CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id                TEXT PRIMARY KEY,            -- uniqueId('cross_dex' | 'triangular' | 'cex_dex')
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy          TEXT NOT NULL CHECK (strategy IN ('cross-dex', 'triangular', 'cex-dex')),
  legs              JSONB NOT NULL,              -- Array of ArbitrageLeg
  start_token       JSONB NOT NULL,              -- TokenInfo
  end_token         JSONB NOT NULL,              -- TokenInfo
  input_amount      NUMERIC NOT NULL,            -- lamports (bigint as numeric for precision)
  expected_output   NUMERIC NOT NULL,            -- lamports
  gross_profit_bps  INTEGER NOT NULL,
  net_profit_bps    INTEGER NOT NULL,
  estimated_gas_lamports INTEGER NOT NULL,
  confidence        INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arb_opp_strategy ON arbitrage_opportunities(strategy);
CREATE INDEX IF NOT EXISTS idx_arb_opp_detected ON arbitrage_opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opp_user     ON arbitrage_opportunities(user_id) WHERE user_id IS NOT NULL;

-- ── arbitrage_executions ────────────────────────────────────────────────────
-- Executed trades (both dry-run and live). One row per execution attempt.

CREATE TABLE IF NOT EXISTS arbitrage_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id    TEXT REFERENCES arbitrage_opportunities(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  success           BOOLEAN NOT NULL,
  dry_run           BOOLEAN NOT NULL,
  tx_signature      TEXT,                        -- Solana transaction signature (live only)
  actual_output     NUMERIC,                     -- lamports actually received
  profit_lamports   NUMERIC,                     -- actual profit (output - input)
  error             TEXT,                        -- error message if failed
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arb_exec_user      ON arbitrage_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_arb_exec_executed  ON arbitrage_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_exec_success   ON arbitrage_executions(success) WHERE success = true;

-- ── arbitrage_bot_stats ─────────────────────────────────────────────────────
-- Daily aggregated stats. One row per day per bot mode.

CREATE TABLE IF NOT EXISTS arbitrage_bot_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date             DATE NOT NULL,
  mode                  TEXT NOT NULL CHECK (mode IN ('mock', 'live')),
  total_scans           INTEGER NOT NULL DEFAULT 0,
  opportunities_found   INTEGER NOT NULL DEFAULT 0,
  trades_executed       INTEGER NOT NULL DEFAULT 0,
  trades_succeeded      INTEGER NOT NULL DEFAULT 0,
  total_profit_lamports NUMERIC NOT NULL DEFAULT 0,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_open  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stat_date, mode)
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_executions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_bot_stats     ENABLE ROW LEVEL SECURITY;

-- Users can read their own opportunities + executions (bot writes via service_role)
CREATE POLICY "user_own_arb_opportunities" ON arbitrage_opportunities
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "user_own_arb_executions" ON arbitrage_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_read_arb_stats" ON arbitrage_bot_stats
  FOR SELECT USING (true);  -- stats are global, readable by all authenticated

-- ── Grants ──────────────────────────────────────────────────────────────────
-- service_role bypasses RLS (bot uses service_role for writes)
GRANT SELECT, INSERT, UPDATE, DELETE ON arbitrage_opportunities TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON arbitrage_executions    TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE        ON arbitrage_bot_stats     TO authenticated, service_role;
-- ============================================================================
-- VIXOR Wallet Domain — Supabase Migration
-- ============================================================================
--
-- Creates the wallet_sessions table for non-custodial wallet connections.
-- Each row represents one wallet connection session.
-- No private keys are stored — only public addresses.
--
-- Security:
--   - RLS enabled on all tables
--   - Users can only read/write their own sessions
--   - Service role can manage all sessions (server-side only)
-- ============================================================================

BEGIN;

-- 1. wallet_sessions — stores wallet connection sessions
CREATE TABLE IF NOT EXISTS public.wallet_sessions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address  TEXT NOT NULL,
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    session_token   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at      TIMESTAMPTZ NOT NULL,
    ip_address      TEXT NOT NULL DEFAULT '',
    user_agent      TEXT NOT NULL DEFAULT '',
    is_active       BOOLEAN NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT valid_wallet_address CHECK (
        (chain = 'solana' AND wallet_address ~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$') OR
        (chain = 'evm' AND wallet_address ~ '^0x[0-9a-fA-F]{40}$')
    ),
    CONSTRAINT valid_expires_at CHECK (expires_at > created_at)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_user_id ON public.wallet_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_address ON public.wallet_sessions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_active ON public.wallet_sessions(user_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_wallet_sessions_expires ON public.wallet_sessions(expires_at) WHERE is_active = true;

-- 2. web3_transactions — stores Web3 transaction history (for B.3/B.4)
CREATE TABLE IF NOT EXISTS public.web3_transactions (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    wallet_address  TEXT NOT NULL,
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    type            TEXT NOT NULL CHECK (type IN ('swap', 'transfer', 'nft_buy', 'nft_sell', 'stake', 'unstake')),
    tx_signature    TEXT,
    status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'reverted')),
    input_token     TEXT,
    output_token    TEXT,
    input_amount    NUMERIC(38, 0),
    output_amount   NUMERIC(38, 0),
    input_usd       NUMERIC(20, 6),
    output_usd      NUMERIC(20, 6),
    gas_paid        NUMERIC(20, 6),
    venue           TEXT,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    confirmed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_web3_tx_user ON public.web3_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_web3_tx_wallet ON public.web3_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_web3_tx_status ON public.web3_transactions(user_id, status);

-- 3. nft_badges — stores NFT badge states for users
CREATE TABLE IF NOT EXISTS public.nft_badges (
    id              TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_type      TEXT NOT NULL CHECK (badge_type IN ('none', 'nft', 'collection', 'verified')),
    chain           TEXT NOT NULL CHECK (chain IN ('solana', 'evm')),
    nft_mint        TEXT,
    nft_name        TEXT,
    nft_image_url   TEXT,
    verified_at     TIMESTAMPTZ,
    metadata        JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_user_badge UNIQUE (user_id, chain)
);

CREATE INDEX IF NOT EXISTS idx_nft_badges_user ON public.nft_badges(user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.wallet_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.web3_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nft_badges ENABLE ROW LEVEL SECURITY;

-- wallet_sessions: users can read their own sessions
CREATE POLICY "Users can read own wallet sessions"
    ON public.wallet_sessions FOR SELECT
    USING (auth.uid() = user_id);

-- wallet_sessions: users can insert their own sessions (via service role only)
CREATE POLICY "Users can insert own wallet sessions"
    ON public.wallet_sessions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- wallet_sessions: users can update their own sessions (disconnect)
CREATE POLICY "Users can update own wallet sessions"
    ON public.wallet_sessions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- wallet_sessions: users can delete their own sessions
CREATE POLICY "Users can delete own wallet sessions"
    ON public.wallet_sessions FOR DELETE
    USING (auth.uid() = user_id);

-- Service role bypass (needed for server functions)
CREATE POLICY "Service role full access to wallet_sessions"
    ON public.wallet_sessions FOR ALL
    USING (auth.role() = 'service_role');

-- web3_transactions: users can read their own transactions
CREATE POLICY "Users can read own web3 transactions"
    ON public.web3_transactions FOR SELECT
    USING (auth.uid() = user_id);

-- web3_transactions: users can insert their own transactions
CREATE POLICY "Users can insert own web3 transactions"
    ON public.web3_transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- web3_transactions: users can update their own transactions
CREATE POLICY "Users can update own web3 transactions"
    ON public.web3_transactions FOR UPDATE
    USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role full access to web3_transactions"
    ON public.web3_transactions FOR ALL
    USING (auth.role() = 'service_role');

-- nft_badges: users can read their own badges
CREATE POLICY "Users can read own nft badges"
    ON public.nft_badges FOR SELECT
    USING (auth.uid() = user_id);

-- Service role bypass
CREATE POLICY "Service role full access to nft_badges"
    ON public.nft_badges FOR ALL
    USING (auth.role() = 'service_role');

COMMIT;
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
-- ============================================================================
-- Phase C.1 — VIXOR AI 4 Agents: vixor_decisions table
-- ============================================================================
-- Stores AI agent decisions, suggestions, warnings, and reports for the
-- Coach, Analyst, Governor, and Hunter agents.
-- ============================================================================

CREATE TABLE IF NOT EXISTS vixor_decisions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id TEXT NOT NULL CHECK (agent_id IN ('coach', 'analyst', 'governor', 'hunter')),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('suggestion', 'warning', 'block', 'alert', 'report')),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  confidence REAL DEFAULT 0.5 CHECK (confidence >= 0 AND confidence <= 1),
  feedback TEXT CHECK (feedback IN ('accepted', 'rejected', 'dismissed', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  -- workspace context
  workspace TEXT DEFAULT 'os' CHECK (workspace IN ('os', 'bullx', 'axiom', 'opensea')),
  -- metadata
  token_symbol TEXT,
  chain TEXT,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_user_id ON vixor_decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_agent_id ON vixor_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_user_created ON vixor_decisions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vixor_decisions_feedback ON vixor_decisions(feedback) WHERE feedback IS NULL;

-- RLS Policies
ALTER TABLE vixor_decisions ENABLE ROW LEVEL SECURITY;

-- Users can read their own decisions
CREATE POLICY "Users can read own decisions"
  ON vixor_decisions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role (bypasses RLS) can do everything — enforced by Supabase design.
-- For non-service-role inserts/updates, we add explicit policies:

-- No direct INSERT from anon — all inserts go through service role on server
CREATE POLICY "Deny anon inserts"
  ON vixor_decisions
  FOR INSERT
  WITH CHECK (false);

-- No direct UPDATE from anon — feedback updates go through service role API
CREATE POLICY "Deny anon updates"
  ON vixor_decisions
  FOR UPDATE
  USING (false);

-- No direct DELETE from anon
CREATE POLICY "Deny anon deletes"
  ON vixor_decisions
  FOR DELETE
  USING (false);
