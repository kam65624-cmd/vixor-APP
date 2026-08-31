-- ============================================================================
-- VIXOR: Enforce hit_tp ↔ status Invariant
-- ============================================================================
-- Ensures hit_tp is always consistent with status:
--   pending   → hit_tp = 0
--   active    → hit_tp = 0
--   tp1_hit   → hit_tp = 1
--   tp2_hit   → hit_tp = 2
--   tp3_hit   → hit_tp = 3
--   sl_hit    → hit_tp = 0  (no TP was hit)
--   expired   → hit_tp = 0
--   cancelled → hit_tp = 0
--   invalidated → hit_tp = 0
--
-- This trigger auto-repairs on every UPDATE, so even if a bug or direct
-- DB write creates a mismatch, the next UPDATE will normalize it.
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_hit_tp_invariant()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_correct_hit_tp INTEGER;
BEGIN
  -- Derive the correct hit_tp from status
  v_correct_hit_tp := CASE NEW.status
    WHEN 'tp1_hit' THEN 1
    WHEN 'tp2_hit' THEN 2
    WHEN 'tp3_hit' THEN 3
    ELSE 0
  END;

  -- Normalize if mismatched
  IF NEW.hit_tp IS DISTINCT FROM v_correct_hit_tp THEN
    NEW.hit_tp := v_correct_hit_tp;
  END IF;

  RETURN NEW;
END;
$$;

-- Idempotent trigger creation
DROP TRIGGER IF EXISTS trg_signal_tracking_hit_tp_invariant ON signal_tracking;
CREATE TRIGGER trg_signal_tracking_hit_tp_invariant
  BEFORE INSERT OR UPDATE ON signal_tracking
  FOR EACH ROW
  EXECUTE FUNCTION enforce_hit_tp_invariant();

-- ============================================================================
-- One-time repair: fix any existing rows that violate the invariant
-- ============================================================================
UPDATE signal_tracking
SET hit_tp = CASE status
  WHEN 'tp1_hit' THEN 1
  WHEN 'tp2_hit' THEN 2
  WHEN 'tp3_hit' THEN 3
  ELSE 0
END,
updated_at = now()
WHERE hit_tp IS DISTINCT FROM (
  CASE status
    WHEN 'tp1_hit' THEN 1
    WHEN 'tp2_hit' THEN 2
    WHEN 'tp3_hit' THEN 3
    ELSE 0
  END
);
