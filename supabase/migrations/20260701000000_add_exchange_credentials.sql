-- Add exchange_credentials JSONB column to user_settings
-- Stores AES-256-GCM encrypted API keys per exchange
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS exchange_credentials JSONB DEFAULT '{}'::jsonb;