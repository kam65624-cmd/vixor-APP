-- ============================================================================
-- Migration: Add 'pending' status to trades table
-- Problem: EVM swaps are not immediately confirmed; the current CHECK constraint
-- only allows 'open' | 'closed' | 'cancelled'. Adding 'pending' so swap executions
-- can be tracked before block confirmation.
-- Phase 2.8: Consolidate user_trades → trades
-- ============================================================================

ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_status_check;

ALTER TABLE public.trades
ADD CONSTRAINT trades_status_check
CHECK (status IN ('open', 'closed', 'cancelled', 'pending'));

-- Make 'pending' entries visible to Echo once confirmed (changed to 'closed')
-- Also add 'swap' tag for filtering swap executions from manual journal trades
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Track chain and token address for swap executions (Phase 2.8)
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS token_address TEXT;
ALTER TABLE public.trades ADD COLUMN IF NOT EXISTS chain TEXT DEFAULT 'solana';
