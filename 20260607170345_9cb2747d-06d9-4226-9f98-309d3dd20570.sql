
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
