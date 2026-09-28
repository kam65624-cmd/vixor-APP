-- ============================================================================
-- Migration: add_paper_decisions
-- Date: 2026-09-28
-- Purpose: Persistent storage for DR.DEX paper trading decisions.
--          Closes the gap where logPaperDecision returned decisions to the
--          caller but never persisted them, leaving ECHO unable to see them.
--
-- Relationship:
--   paper_decisions: user_id → profiles.id
--   signal_tracking: paper_decisions.id (FK via source_decision_id)
--   echo/functions.ts: reads paper_decisions for timeline + aggregate stats
-- ============================================================================

-- Enable UUID extension if not already enabled (idempotent)
create extension if not exists "pgcrypto";

-- ── Paper Decisions Table ────────────────────────────────────────────────────
create table if not exists public.paper_decisions (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references public.profiles(id) on delete cascade,
  token_address text        not null,
  chain         text        not null,
  token_name    text,
  token_symbol  text,

  -- Decision fields
  action        text        not null check (action in ('BUY', 'SELL', 'WAIT')),
  rationale     text        not null,
  invalidation_condition  text not null,
  target_price  numeric,
  stop_loss     numeric,
  position_size_pct  numeric not null check (position_size_pct between 0 and 1),

  -- Risk Governor output
  governor_action  text    not null check (governor_action in ('PROCEED', 'REDUCE_SIZE', 'WAIT', 'BLOCK')),
  risk_verdict    text,

  -- Outcome tracking (filled when user resolves the decision)
  outcome        text check (outcome in ('tp_hit', 'sl_hit', 'invalidated', 'expired', 'unknown')),
  resolved_at    timestamptz,

  -- Metadata
  decided_at     timestamptz not null default now(),
  created_at     timestamptz not null default now()
);

-- ── RLS ──────────────────────────────────────────────────────────────────────
alter table public.paper_decisions enable row level security;

-- Users can only see their own decisions
create policy "paper_decisions_owner_select"
  on public.paper_decisions for select
  using (auth.uid() = user_id);

create policy "paper_decisions_owner_insert"
  on public.paper_decisions for insert
  with check (auth.uid() = user_id);

create policy "paper_decisions_owner_update"
  on public.paper_decisions for update
  using (auth.uid() = user_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists paper_decisions_user_id_idx
  on public.paper_decisions (user_id);

create index if not exists paper_decisions_status_idx
  on public.paper_decisions (user_id, outcome);

create index if not exists paper_decisions_created_at_idx
  on public.paper_decisions (created_at desc);

-- ── Comment ───────────────────────────────────────────────────────────────────
comment on table public.paper_decisions is
  'DR.DEX paper trading decisions — persist-only, never executes real trades.';
