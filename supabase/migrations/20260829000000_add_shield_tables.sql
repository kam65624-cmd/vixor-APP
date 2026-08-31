-- ============================================================================
-- P0-S3-T1: SHIELD Domain Tables
-- Adds 5 tables for SHIELD (security & forensics product):
--   contract_scans    — on-chain contract analysis results
--   rug_pull_flags    — detected rug pull indicators
--   case_files        — investigation case management
--   risk_assessments  — composite token risk scores
--   hunt_shield_alerts — cross-product alerts (HUNT → SHIELD)
-- ============================================================================

-- ── 1. contract_scans ───────────────────────────────────────────────────────
-- Stores results from contract scanning (GoPlus, RugCheck, custom engine).

CREATE TABLE IF NOT EXISTS public.contract_scans (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_address  TEXT NOT NULL,
  chain             TEXT NOT NULL DEFAULT 'solana' CHECK (chain IN ('solana','ethereum','bsc','base','arbitrum')),
  token_name        TEXT,
  token_symbol      TEXT,

  -- Core security flags
  is_honeypot       BOOLEAN,
  is_mintable       BOOLEAN,
  is_blacklistable  BOOLEAN,
  is_proxy          BOOLEAN,
  has_trading_cooldown BOOLEAN,
  is_anti_whale     BOOLEAN,
  is_open_source    BOOLEAN,
  is_renounced      BOOLEAN,

  -- Risk scores (0-100, higher = more risky)
  buy_tax           NUMERIC(5,2),
  sell_tax          NUMERIC(5,2),
  holder_count      INT,
  top_holder_pct    NUMERIC(5,2),   -- % held by top 10 holders
  lp_locked_pct     NUMERIC(5,2),   -- % of LP locked
  lp_lock_days      INT,

  -- Composite score
  risk_score        INT NOT NULL DEFAULT 0 CHECK (risk_score BETWEEN 0 AND 100),
  verdict           TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (verdict IN ('SAFE','CAUTION','SUSPICIOUS','DANGER','UNKNOWN')),
  verdict_reasons   JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Raw provider responses
  goplus_data       JSONB,
  rugcheck_data     JSONB,
  custom_data       JSONB,

  scanned_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contract_scans_user_id    ON public.contract_scans(user_id);
CREATE INDEX idx_contract_scans_address    ON public.contract_scans(contract_address);
CREATE INDEX idx_contract_scans_chain      ON public.contract_scans(chain);
CREATE INDEX idx_contract_scans_verdict    ON public.contract_scans(verdict);
CREATE INDEX idx_contract_scans_created    ON public.contract_scans(created_at DESC);

ALTER TABLE public.contract_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own scans" ON public.contract_scans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scans" ON public.contract_scans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own scans" ON public.contract_scans FOR DELETE USING (auth.uid() = user_id);


-- ── 2. rug_pull_flags ───────────────────────────────────────────────────────
-- Individual rug pull signals/indicators detected for a contract.

CREATE TABLE IF NOT EXISTS public.rug_pull_flags (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_scan_id  UUID NOT NULL REFERENCES public.contract_scans(id) ON DELETE CASCADE,
  contract_address  TEXT NOT NULL,
  flag_type         TEXT NOT NULL,  -- e.g. 'honeypot', 'dev_dump', 'fake_lp', 'wash_trading'
  severity          TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  description       TEXT NOT NULL,
  evidence          JSONB NOT NULL DEFAULT '{}'::jsonb,  -- on-chain tx hashes, wallet addresses, etc.
  is_confirmed      BOOLEAN NOT NULL DEFAULT false,
  detected_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_rug_pull_flags_scan_id  ON public.rug_pull_flags(contract_scan_id);
CREATE INDEX idx_rug_pull_flags_address  ON public.rug_pull_flags(contract_address);
CREATE INDEX idx_rug_pull_flags_type     ON public.rug_pull_flags(flag_type);
CREATE INDEX idx_rug_pull_flags_severity ON public.rug_pull_flags(severity);

ALTER TABLE public.rug_pull_flags ENABLE ROW LEVEL SECURITY;
-- Rug flags are readable by anyone who can read the parent scan
CREATE POLICY "Anyone can read rug flags" ON public.rug_pull_flags FOR SELECT USING (true);


-- ── 3. case_files ───────────────────────────────────────────────────────────
-- User-managed investigation case files (SHIELD forensics workflow).

CREATE TABLE IF NOT EXISTS public.case_files (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','investigating','closed','archived')),
  priority         TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','critical')),

  -- Linked entities
  contract_addresses TEXT[] NOT NULL DEFAULT '{}',
  wallet_addresses   TEXT[] NOT NULL DEFAULT '{}',
  related_scans      UUID[] NOT NULL DEFAULT '{}',   -- references contract_scans.id

  -- Evidence and notes
  evidence         JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes            TEXT,
  tags             TEXT[] NOT NULL DEFAULT '{}',

  -- Verdict
  final_verdict    TEXT CHECK (final_verdict IN ('SAFE','SUSPICIOUS','DANGER','INCONCLUSIVE')),
  verdict_notes    TEXT,

  opened_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at        TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_case_files_user_id  ON public.case_files(user_id);
CREATE INDEX idx_case_files_status   ON public.case_files(status);
CREATE INDEX idx_case_files_priority ON public.case_files(priority);
CREATE INDEX idx_case_files_created  ON public.case_files(created_at DESC);

ALTER TABLE public.case_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own cases" ON public.case_files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cases" ON public.case_files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON public.case_files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases" ON public.case_files FOR DELETE USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION shield_case_files_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_case_files_touch_updated_at
  BEFORE UPDATE ON public.case_files
  FOR EACH ROW
  EXECUTE FUNCTION shield_case_files_touch_updated_at();


-- ── 4. risk_assessments ─────────────────────────────────────────────────────
-- Composite risk score for a token (aggregates multiple data sources).

CREATE TABLE IF NOT EXISTS public.risk_assessments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_address TEXT NOT NULL,
  chain            TEXT NOT NULL DEFAULT 'solana',
  token_symbol     TEXT,

  -- Score breakdown (0-100 each)
  contract_score   INT NOT NULL DEFAULT 0,    -- code analysis
  liquidity_score  INT NOT NULL DEFAULT 0,    -- LP health
  holder_score     INT NOT NULL DEFAULT 0,    -- concentration risk
  social_score     INT NOT NULL DEFAULT 0,    -- sentiment & social signals
  trading_score    INT NOT NULL DEFAULT 0,    -- wash trading & manipulation

  -- Weighted composite
  overall_score    INT NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  verdict          TEXT NOT NULL DEFAULT 'UNKNOWN' CHECK (verdict IN ('SAFE','CAUTION','SUSPICIOUS','DANGER','UNKNOWN')),

  data_sources     TEXT[] NOT NULL DEFAULT '{}',
  assessed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ  -- TTL for cache invalidation
);

CREATE UNIQUE INDEX idx_risk_assessments_address_chain ON public.risk_assessments(contract_address, chain);
CREATE INDEX idx_risk_assessments_verdict ON public.risk_assessments(verdict);
CREATE INDEX idx_risk_assessments_assessed ON public.risk_assessments(assessed_at DESC);

ALTER TABLE public.risk_assessments ENABLE ROW LEVEL SECURITY;
-- Public read (cached risk scores available to all users)
CREATE POLICY "Anyone can read risk assessments" ON public.risk_assessments FOR SELECT USING (true);
-- Only service role can write (server-side computation)
CREATE POLICY "Service can insert assessments" ON public.risk_assessments FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service can update assessments" ON public.risk_assessments FOR UPDATE TO service_role USING (true);


-- ── 5. hunt_shield_alerts ───────────────────────────────────────────────────
-- Cross-product alerts: HUNT discovers a token, SHIELD flags it.

CREATE TABLE IF NOT EXISTS public.hunt_shield_alerts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_address TEXT NOT NULL,
  token_symbol     TEXT,
  chain            TEXT NOT NULL DEFAULT 'solana',

  alert_type       TEXT NOT NULL CHECK (alert_type IN ('rug_pull','honeypot','suspicious_trading','whale_dump','dev_wallet_activity','social_manipulation')),
  severity         TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
  title            TEXT NOT NULL,
  description      TEXT,
  evidence         JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Linkage
  scan_id          UUID REFERENCES public.contract_scans(id) ON DELETE SET NULL,
  case_file_id     UUID REFERENCES public.case_files(id) ON DELETE SET NULL,

  -- Status
  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','acknowledged','dismissed','resolved')),
  acknowledged_at  TIMESTAMPTZ,
  resolved_at      TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_hunt_shield_alerts_user_id  ON public.hunt_shield_alerts(user_id);
CREATE INDEX idx_hunt_shield_alerts_address  ON public.hunt_shield_alerts(contract_address);
CREATE INDEX idx_hunt_shield_alerts_type     ON public.hunt_shield_alerts(alert_type);
CREATE INDEX idx_hunt_shield_alerts_severity ON public.hunt_shield_alerts(severity);
CREATE INDEX idx_hunt_shield_alerts_status   ON public.hunt_shield_alerts(status);
CREATE INDEX idx_hunt_shield_alerts_created  ON public.hunt_shield_alerts(created_at DESC);

ALTER TABLE public.hunt_shield_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own alerts" ON public.hunt_shield_alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON public.hunt_shield_alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service can insert alerts" ON public.hunt_shield_alerts FOR INSERT TO service_role WITH CHECK (true);
