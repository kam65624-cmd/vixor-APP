-- Minimal isolated PostgreSQL fixture for the payment RLS regression.
CREATE ROLE authenticated NOLOGIN;
CREATE ROLE service_role NOLOGIN BYPASSRLS;

CREATE SCHEMA auth;
CREATE TABLE auth.users (id UUID PRIMARY KEY);

CREATE FUNCTION auth.uid() RETURNS UUID
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claim.sub', true), '')::UUID;
$$;
GRANT USAGE ON SCHEMA auth TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION auth.uid() TO authenticated, service_role;

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  telegram_charge_id TEXT UNIQUE,
  payload TEXT NOT NULL,
  amount_stars INT,
  pack_id TEXT,
  plan_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  confirmed_at TIMESTAMPTZ
);
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users access own payments"
  ON public.payments FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "service role can insert payments"
  ON public.payments FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "service role can update payments"
  ON public.payments FOR UPDATE TO service_role USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO service_role;

INSERT INTO auth.users (id) VALUES
  ('11111111-1111-4111-8111-111111111111'),
  ('22222222-2222-4222-8222-222222222222');
INSERT INTO public.payments (user_id, payload, amount_stars, pack_id, status) VALUES
  ('11111111-1111-4111-8111-111111111111', 'payload-a', 100, 'pack-a', 'pending'),
  ('22222222-2222-4222-8222-222222222222', 'payload-b', 200, 'pack-b', 'pending');
