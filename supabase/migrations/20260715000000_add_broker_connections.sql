-- Broker Connections Table
-- Stores user broker connection statuses
CREATE TABLE IF NOT EXISTS public.broker_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  broker_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected')),
  connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, broker_name)
);

-- Enable RLS
ALTER TABLE public.broker_connections ENABLE ROW LEVEL SECURITY;

-- Users can read their own connections
CREATE POLICY "Users can read own broker connections"
  ON public.broker_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert own broker connections"
  ON public.broker_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update own broker connections"
  ON public.broker_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_broker_connections_user_status
  ON public.broker_connections(user_id, status);