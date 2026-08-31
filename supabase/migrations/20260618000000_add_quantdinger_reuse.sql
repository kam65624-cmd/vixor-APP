-- ============================================================================
-- VIXOR — QuantDinger Reuse Schema (Phase 1)
-- ============================================================================
--
-- Adds 5 tables for the infrastructure ported from QuantDinger:
--
--   user_settings     — per-user notification + LLM preferences
--   notifications     — in-app notification queue (consumed by /notifications)
--   agent_tokens      — personal access tokens for the programmatic API
--   agent_jobs        — long-running agent jobs (queued / running / done)
--   agent_audit_log   — every API call made with an agent token
--
-- All tables enable RLS with a "users access own rows" policy via auth.uid().
-- ============================================================================

-- ── user_settings ──────────────────────────────────────────────────────────
-- One row per user. Created on first preference save.

CREATE TABLE IF NOT EXISTS user_settings (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_channels JSONB NOT NULL DEFAULT '["telegram","in-app"]'::jsonb,
  preferred_llm_provider TEXT NOT NULL DEFAULT 'zai',
  llm_api_keys         JSONB NOT NULL DEFAULT '{}'::jsonb, -- encrypted blob per provider
  telegram_chat_id     TEXT,
  webhook_url          TEXT,
  webhook_secret       TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can read / write ONLY their own row
DROP POLICY IF EXISTS "users access own user_settings" ON user_settings;
CREATE POLICY "users access own user_settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role bypasses RLS by default (used by NotificationRouter, LLMRouter, etc.)

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION vixor_user_settings_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_settings_touch_updated_at ON user_settings;
CREATE TRIGGER trg_user_settings_touch_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION vixor_user_settings_touch_updated_at();

-- ── notifications ──────────────────────────────────────────────────────────
-- In-app notification queue. Populated by NotificationRouter "in-app" channel.
--
-- IMPORTANT: The `notifications` table was created earlier in
-- `20260607170345_*.sql` with columns (id, user_id, title, body, type, read_at, created_at).
-- To preserve backward compatibility with the existing alert-checker (which
-- writes title/body/type) and the existing /notifications page (which reads
-- `*` and updates read_at), we EXTEND the existing table with new columns
-- instead of replacing it.

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS channel    TEXT,
  ADD COLUMN IF NOT EXISTS payload    JSONB,
  ADD COLUMN IF NOT EXISTS status     TEXT,
  ADD COLUMN IF NOT EXISTS sent_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error      TEXT;

-- Backfill: every existing row is an in-app notification that was already sent.
UPDATE notifications
SET
  channel = COALESCE(channel, 'in-app'),
  payload = COALESCE(payload, jsonb_build_object(
              'title', title,
              'body',  COALESCE(body, ''),
              'type',  COALESCE(type, 'info')
            )),
  status  = COALESCE(status, CASE WHEN read_at IS NOT NULL THEN 'read' ELSE 'sent' END)
WHERE channel IS NULL OR payload IS NULL OR status IS NULL;

-- Going forward: enforce sane defaults + NOT NULL on the new columns.
ALTER TABLE notifications
  ALTER COLUMN channel  SET DEFAULT 'in-app',
  ALTER COLUMN channel  SET NOT NULL,
  ALTER COLUMN payload  SET DEFAULT '{}'::jsonb,
  ALTER COLUMN payload  SET NOT NULL,
  ALTER COLUMN status   SET DEFAULT 'pending',
  ALTER COLUMN status   SET NOT NULL;

-- Composite index for "fetch unread by user" (used by NotificationRouter + /notifications).
CREATE INDEX IF NOT EXISTS idx_notifications_user_status
  ON notifications (user_id, status)
  WHERE status IN ('pending', 'sent');

CREATE INDEX IF NOT EXISTS idx_notifications_user_created
  ON notifications (user_id, created_at DESC);

-- Ensure RLS is enabled (idempotent — original migration already enabled it).
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Replace the policy with a unified FOR ALL policy that covers the new use cases.
DROP POLICY IF EXISTS "own notif read"      ON notifications;
DROP POLICY IF EXISTS "own notif update"    ON notifications;
DROP POLICY IF EXISTS "users access own notifications" ON notifications;
CREATE POLICY "users access own notifications"
  ON notifications
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── agent_tokens ───────────────────────────────────────────────────────────
-- Personal access tokens for the programmatic API (script access,  
-- automated trading, etc.). NEVER store the raw token — only its SHA-256 hash.

CREATE TABLE IF NOT EXISTS agent_tokens (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash   TEXT NOT NULL UNIQUE, -- sha256(token) hex
  scopes       TEXT[] NOT NULL DEFAULT '{}',
  name         TEXT,
  last_used_at TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_token_hash
  ON agent_tokens (token_hash);

CREATE INDEX IF NOT EXISTS idx_agent_tokens_user
  ON agent_tokens (user_id);

ALTER TABLE agent_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_tokens" ON agent_tokens;
CREATE POLICY "users access own agent_tokens"
  ON agent_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── agent_jobs ─────────────────────────────────────────────────────────────
-- Long-running agent jobs. Status transitions: queued → running → done | failed.

CREATE TABLE IF NOT EXISTS agent_jobs (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_id   UUID REFERENCES agent_tokens(id) ON DELETE SET NULL,
  status     TEXT NOT NULL DEFAULT 'queued', -- queued | running | done | failed | cancelled
  progress   INT NOT NULL DEFAULT 0,         -- 0..100
  result     JSONB,
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_user_created
  ON agent_jobs (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_jobs_status
  ON agent_jobs (status)
  WHERE status IN ('queued', 'running');

ALTER TABLE agent_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_jobs" ON agent_jobs;
CREATE POLICY "users access own agent_jobs"
  ON agent_jobs
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION vixor_agent_jobs_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_agent_jobs_touch_updated_at ON agent_jobs;
CREATE TRIGGER trg_agent_jobs_touch_updated_at
  BEFORE UPDATE ON agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION vixor_agent_jobs_touch_updated_at();

-- ── agent_audit_log ────────────────────────────────────────────────────────
-- Append-only audit log of every API call made with an agent token.
-- RLS-enabled but typically only WRITTEN by service role (server).

CREATE TABLE IF NOT EXISTS agent_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID,
  token_id    UUID,
  route       TEXT NOT NULL,
  method      TEXT NOT NULL,
  status      INT,
  duration_ms INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_user_created
  ON agent_audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_agent_audit_log_token
  ON agent_audit_log (token_id)
  WHERE token_id IS NOT NULL;

ALTER TABLE agent_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users access own agent_audit_log" ON agent_audit_log;
CREATE POLICY "users access own agent_audit_log"
  ON agent_audit_log
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Service role can always insert (server-side audit logging).
DROP POLICY IF EXISTS "service role can insert agent_audit_log" ON agent_audit_log;
CREATE POLICY "service role can insert agent_audit_log"
  ON agent_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);
