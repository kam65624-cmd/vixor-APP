-- ============================================================================
-- Migration: add_performance_indexes (Phase 3.1)
-- Date: 2026-09-28
-- Purpose: Add missing composite indexes for query performance
-- Existing indexes verified — this file adds only new ones.
-- ============================================================================

-- signal_tracking: filter by status + sort by created_at (for active signal lists)
CREATE INDEX IF NOT EXISTS idx_signal_tracking_status_created
  ON public.signal_tracking (status, created_at DESC)
  WHERE status IN ('pending', 'active');

-- trades: weekly PnL aggregation by exit_date (ECHO / echo/functions.ts)
CREATE INDEX IF NOT EXISTS idx_trades_user_exit_date
  ON public.trades (user_id, exit_date DESC)
  WHERE exit_date IS NOT NULL;

-- trades: swap executions by source filter
CREATE INDEX IF NOT EXISTS idx_trades_source
  ON public.trades (user_id, source, created_at DESC)
  WHERE source = 'swap';

-- daily_signals: dedup + query by pair + timeframe + date
CREATE INDEX IF NOT EXISTS idx_daily_signals_pair_timeframe
  ON public.daily_signals (pair, timeframe, signal_date DESC);

-- paper_decisions: active decisions by user (ECHO timeline)
CREATE INDEX IF NOT EXISTS idx_paper_decisions_user_active
  ON public.paper_decisions (user_id, decided_at DESC)
  WHERE outcome IS NULL;

-- analyses: fast lookup by status for MR.VIGO dashboard
CREATE INDEX IF NOT EXISTS idx_analyses_status_created
  ON public.analyses (status, created_at DESC);
