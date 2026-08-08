-- ============================================================================
-- VIXOR Task 1.2C: Add 'invalidated' to signal_status enum + extend monitored index
-- ============================================================================
-- P0-2: Add 'invalidated' status (pre-entry cancellation, server-initiated).
-- P0-4: Extend the partial index to cover intermediate TP states (tp1_hit, tp2_hit)
--        so that monitored-status queries remain efficient.
--
-- IMPORTANT: This migration does NOT modify existing data rows.
-- Existing rows retain their current status and resolved_at values.
-- ============================================================================

-- P0-2: Add 'invalidated' to the signal_status enum
ALTER TYPE signal_status ADD VALUE IF NOT EXISTS 'invalidated';

-- P0-4: Replace the partial index to cover all monitored states.
-- The old index only covered ('pending', 'active').
-- The locked contract requires tp1_hit and tp2_hit to also be monitorable.
--
-- NOTE: DROP INDEX IF EXISTS is safe here — the index is partial and
-- only used for query optimization, not for constraints.
DROP INDEX IF EXISTS idx_signal_tracking_status;
CREATE INDEX idx_signal_tracking_status
  ON signal_tracking (status)
  WHERE status IN ('pending', 'active', 'tp1_hit', 'tp2_hit');