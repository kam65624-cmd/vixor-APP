-- ============================================================================
-- P0-S3: Add current_level column to profiles table
-- Adds level tracking directly to user profile for fast reads.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS current_level    INT NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 100),
  ADD COLUMN IF NOT EXISTS current_tier     TEXT NOT NULL DEFAULT 'bronze' CHECK (current_tier IN ('bronze','silver','gold','platinum')),
  ADD COLUMN IF NOT EXISTS level_title      TEXT NOT NULL DEFAULT 'Scout',
  ADD COLUMN IF NOT EXISTS username         TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url       TEXT,
  ADD COLUMN IF NOT EXISTS bio              TEXT;

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_profiles_xp    ON public.profiles(xp DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_level ON public.profiles(current_level DESC);

-- Function to sync level when XP changes
CREATE OR REPLACE FUNCTION sync_profile_level()
RETURNS TRIGGER AS $$
DECLARE
  v_level   INT;
  v_tier    TEXT;
  v_title   TEXT;
BEGIN
  -- Find the highest level where xp_required <= NEW.xp
  SELECT level, tier, title
    INTO v_level, v_tier, v_title
    FROM public.xp_levels
   WHERE xp_required <= NEW.xp
   ORDER BY level DESC
   LIMIT 1;

  IF v_level IS NOT NULL THEN
    NEW.current_level := v_level;
    NEW.current_tier  := v_tier;
    NEW.level_title   := v_title;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: auto-update level whenever XP changes
DROP TRIGGER IF EXISTS trg_sync_profile_level ON public.profiles;
CREATE TRIGGER trg_sync_profile_level
  BEFORE UPDATE OF xp ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_profile_level();
