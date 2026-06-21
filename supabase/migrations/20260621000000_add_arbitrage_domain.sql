-- ============================================================================
-- VIXOR — Arbitrage Domain Schema
-- ============================================================================
--
-- Ported from axiom-arbitrage-trading-bot. Adds 3 tables:
--
--   arbitrage_opportunities  — detected opportunities (with TTL)
--   arbitrage_executions     — executed trades (dry-run + live)
--   arbitrage_bot_stats      — daily stats (one row per day)
--
-- All tables enable RLS with "users access own rows" policy via auth.uid().
-- Service role bypasses RLS for bot operations (background scanning).
-- ============================================================================

-- ── arbitrage_opportunities ─────────────────────────────────────────────────
-- Detected arbitrage opportunities. TTL = 3-4 seconds (very short-lived).

CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id                TEXT PRIMARY KEY,            -- uniqueId('cross_dex' | 'triangular' | 'cex_dex')
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  strategy          TEXT NOT NULL CHECK (strategy IN ('cross-dex', 'triangular', 'cex-dex')),
  legs              JSONB NOT NULL,              -- Array of ArbitrageLeg
  start_token       JSONB NOT NULL,              -- TokenInfo
  end_token         JSONB NOT NULL,              -- TokenInfo
  input_amount      NUMERIC NOT NULL,            -- lamports (bigint as numeric for precision)
  expected_output   NUMERIC NOT NULL,            -- lamports
  gross_profit_bps  INTEGER NOT NULL,
  net_profit_bps    INTEGER NOT NULL,
  estimated_gas_lamports INTEGER NOT NULL,
  confidence        INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arb_opp_strategy ON arbitrage_opportunities(strategy);
CREATE INDEX IF NOT EXISTS idx_arb_opp_detected ON arbitrage_opportunities(detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_opp_user     ON arbitrage_opportunities(user_id) WHERE user_id IS NOT NULL;

-- ── arbitrage_executions ────────────────────────────────────────────────────
-- Executed trades (both dry-run and live). One row per execution attempt.

CREATE TABLE IF NOT EXISTS arbitrage_executions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id    TEXT REFERENCES arbitrage_opportunities(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  success           BOOLEAN NOT NULL,
  dry_run           BOOLEAN NOT NULL,
  tx_signature      TEXT,                        -- Solana transaction signature (live only)
  actual_output     NUMERIC,                     -- lamports actually received
  profit_lamports   NUMERIC,                     -- actual profit (output - input)
  error             TEXT,                        -- error message if failed
  executed_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_arb_exec_user      ON arbitrage_executions(user_id);
CREATE INDEX IF NOT EXISTS idx_arb_exec_executed  ON arbitrage_executions(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_arb_exec_success   ON arbitrage_executions(success) WHERE success = true;

-- ── arbitrage_bot_stats ─────────────────────────────────────────────────────
-- Daily aggregated stats. One row per day per bot mode.

CREATE TABLE IF NOT EXISTS arbitrage_bot_stats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stat_date             DATE NOT NULL,
  mode                  TEXT NOT NULL CHECK (mode IN ('mock', 'live')),
  total_scans           INTEGER NOT NULL DEFAULT 0,
  opportunities_found   INTEGER NOT NULL DEFAULT 0,
  trades_executed       INTEGER NOT NULL DEFAULT 0,
  trades_succeeded      INTEGER NOT NULL DEFAULT 0,
  total_profit_lamports NUMERIC NOT NULL DEFAULT 0,
  consecutive_failures  INTEGER NOT NULL DEFAULT 0,
  circuit_breaker_open  BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(stat_date, mode)
);

-- ── Row Level Security ──────────────────────────────────────────────────────

ALTER TABLE arbitrage_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_executions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE arbitrage_bot_stats     ENABLE ROW LEVEL SECURITY;

-- Users can read their own opportunities + executions (bot writes via service_role)
CREATE POLICY "user_own_arb_opportunities" ON arbitrage_opportunities
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "user_own_arb_executions" ON arbitrage_executions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_read_arb_stats" ON arbitrage_bot_stats
  FOR SELECT USING (true);  -- stats are global, readable by all authenticated

-- ── Grants ──────────────────────────────────────────────────────────────────
-- service_role bypasses RLS (bot uses service_role for writes)
GRANT SELECT, INSERT, UPDATE, DELETE ON arbitrage_opportunities TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON arbitrage_executions    TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE        ON arbitrage_bot_stats     TO authenticated, service_role;
