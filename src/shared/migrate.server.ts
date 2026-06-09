// ============================================================================
// Vixor Auto-Migration Runner — Creates missing tables on server startup
// ============================================================================
//
// This script checks if the required tables exist and creates them if they don't.
// It's designed to be called once on server startup or manually via API endpoint.
//
// It uses the Supabase Admin client (service role key) to execute raw SQL
// through the REST API. Since PostgREST doesn't support raw SQL execution,
// we use a workaround: try to select from each table, and if it fails with
// "relation does not exist", we know we need to create it.
//
// However, we can't create tables through PostgREST. The actual table creation
// must be done through the Supabase Dashboard SQL Editor or the CLI.
//
// This file exports:
// 1. `checkMigrations()` - Checks which tables exist and returns status
// 2. `getMigrationSQL()` - Returns the SQL that needs to be executed
// ============================================================================

export interface MigrationStatus {
  price_alerts: boolean;
  daily_signals: boolean;
  user_strategies: boolean;
  allComplete: boolean;
  sql: string;
}

export function getMigrationSQL(): string {
  return `
-- Vixor Migration: Price Alerts, Daily Signals, User Strategies
-- Run this SQL in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/lrbgxrfvjxaixtzkutxn/sql

-- 1. Price Alerts Table
CREATE TABLE IF NOT EXISTS price_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  pair TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('above', 'below', 'crosses_up', 'crosses_down')),
  target_price NUMERIC NOT NULL,
  current_price NUMERIC,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'triggered', 'cancelled')),
  triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  timeframe TEXT DEFAULT '1H'
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_price_alerts_active ON price_alerts(status) WHERE status = 'active';

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own alerts" ON price_alerts FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Daily Signals Table
CREATE TABLE IF NOT EXISTS daily_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pair TEXT NOT NULL,
  timeframe TEXT NOT NULL,
  recommendation TEXT NOT NULL CHECK (recommendation IN ('BUY', 'SELL', 'WAIT')),
  confidence NUMERIC NOT NULL,
  entry NUMERIC,
  stop_loss NUMERIC,
  take_profit NUMERIC[],
  reasons TEXT[],
  pattern TEXT,
  market_structure JSONB,
  liquidity_zones JSONB,
  signal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_signals_date ON daily_signals(signal_date);

-- 3. User Strategies Table
CREATE TABLE IF NOT EXISTS user_strategies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Strategy',
  pairs TEXT[] NOT NULL DEFAULT '{}',
  trading_style TEXT NOT NULL DEFAULT 'Day Trading',
  risk_tolerance TEXT NOT NULL DEFAULT 'MEDIUM',
  preferred_timeframes TEXT[] NOT NULL DEFAULT '{1H,4H}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_strategies_user ON user_strategies(user_id);

ALTER TABLE user_strategies ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users can manage their own strategies" ON user_strategies FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
`;
}

export async function checkMigrations(): Promise<MigrationStatus> {
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Check each table by attempting a select
  const [alertsRes, signalsRes, strategiesRes] = await Promise.all([
    supabaseAdmin.from("price_alerts").select("id").limit(1),
    supabaseAdmin.from("daily_signals").select("id").limit(1),
    supabaseAdmin.from("user_strategies").select("id").limit(1),
  ]);

  const priceAlerts = !alertsRes.error || alertsRes.error.code !== "42P01";
  const dailySignals = !signalsRes.error || signalsRes.error.code !== "42P01";
  const userStrategies = !strategiesRes.error || strategiesRes.error.code !== "42P01";

  const allComplete = priceAlerts && dailySignals && userStrategies;

  return {
    price_alerts: priceAlerts,
    daily_signals: dailySignals,
    user_strategies: userStrategies,
    allComplete,
    sql: allComplete ? "" : getMigrationSQL(),
  };
}
