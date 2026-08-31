-- Phase 1: Analysis Context Expansion
-- This migration adds necessary fields to provide rich contextual analysis instead of simple signals.

-- 1. Add context fields to the analyses table
ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS trend VARCHAR(20),
ADD COLUMN IF NOT EXISTS risk_level VARCHAR(20),
ADD COLUMN IF NOT EXISTS risk_reasons TEXT[],
ADD COLUMN IF NOT EXISTS invalidation_level DECIMAL(15,5),
ADD COLUMN IF NOT EXISTS liquidity_zones JSONB,
ADD COLUMN IF NOT EXISTS market_structure JSONB,
ADD COLUMN IF NOT EXISTS key_levels JSONB,
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'CHART_UPLOAD',
ADD COLUMN IF NOT EXISTS opportunity_id UUID;

-- 2. Add total_xp and skills to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS technical_analysis_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS risk_management_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS psychology_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trade_management_score INTEGER DEFAULT 0;
