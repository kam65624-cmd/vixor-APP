-- ============================================================================
-- MOXI AI Companion — Persona Storage
-- ============================================================================
-- One row per user. Stores their customized MOXI personality.
-- Falls back to DEFAULT_MOXI_PERSONA in code when no row exists.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.moxi_personas (
  -- Primary key = user_id (one MOXI per user)
  user_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Persona fields
  name             TEXT NOT NULL DEFAULT 'MOXI',
  personality      TEXT NOT NULL DEFAULT 'A sharp, proactive AI trading companion.',
  expertise        JSONB NOT NULL DEFAULT '["SMC/ICT Technical Analysis", "Multi-timeframe market structure", "Signal tracking & monitoring", "Risk awareness & position management", "Economic event timing", "Portfolio overview & performance"]'::jsonb,
  communication_style TEXT NOT NULL DEFAULT 'mixed'
                    CHECK (communication_style IN ('formal', 'casual', 'mixed')),
  avatar_variant   TEXT NOT NULL DEFAULT 'default'
                    CHECK (avatar_variant IN ('default', 'bull', 'bear', 'crystal', 'flame', 'ocean', 'phantom', 'nova')),
  nft_token_id     TEXT,

  -- Metadata
  is_customized    BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: users can only read/write their own persona
ALTER TABLE public.moxi_personas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own MOXI persona"
  ON public.moxi_personas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MOXI persona"
  ON public.moxi_personas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own MOXI persona"
  ON public.moxi_personas FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.moxi_personas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER moxi_personas_set_updated_at
  BEFORE UPDATE ON public.moxi_personas
  FOR EACH ROW EXECUTE FUNCTION public.moxi_personas_updated_at();

-- Index for fast lookup (already covered by PK, but explicit for clarity)
CREATE INDEX IF NOT EXISTS idx_moxi_personas_user_id ON public.moxi_personas(user_id);