-- ============================================================================
-- VIXOR — Experiments Tables
-- ============================================================================
-- Adds the `experiments` and `experiment_generations` tables for the
-- QuantDinger-ported experiment runner. RLS enforces user ownership.
-- ============================================================================

-- Parent experiment record
create table if not exists public.experiments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  config          jsonb not null,
  result          jsonb,
  status          text not null default 'running',
  created_at      timestamptz not null default now(),
  completed_at    timestamptz,
  constraint experiments_status_chk check (status in ('running','completed','failed','cancelled'))
);

create index if not exists experiments_user_id_created_at_idx
  on public.experiments (user_id, created_at desc);

-- Per-generation snapshots (best/avg scores, full population)
create table if not exists public.experiment_generations (
  id              uuid primary key default gen_random_uuid(),
  experiment_id   uuid not null references public.experiments(id) on delete cascade,
  generation      int  not null,
  best_score      jsonb,
  avg_score       jsonb,
  population      jsonb,
  created_at      timestamptz not null default now(),
  constraint experiment_generations_generation_chk check (generation >= 0)
);

create index if not exists experiment_generations_experiment_id_idx
  on public.experiment_generations (experiment_id, generation);

-- ----------------------------------------------------------------------------
-- Row-Level Security
-- ----------------------------------------------------------------------------
alter table public.experiments                enable row level security;
alter table public.experiment_generations     enable row level security;

drop policy if exists "experiments_select_own"    on public.experiments;
drop policy if exists "experiments_insert_own"    on public.experiments;
drop policy if exists "experiments_update_own"    on public.experiments;
drop policy if exists "experiments_delete_own"    on public.experiments;

create policy "experiments_select_own" on public.experiments
  for select using (auth.uid() = user_id);
create policy "experiments_insert_own" on public.experiments
  for insert with check (auth.uid() = user_id);
create policy "experiments_update_own" on public.experiments
  for update using (auth.uid() = user_id);
create policy "experiments_delete_own" on public.experiments
  for delete using (auth.uid() = user_id);

drop policy if exists "experiment_generations_select_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_insert_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_update_own"  on public.experiment_generations;
drop policy if exists "experiment_generations_delete_own"  on public.experiment_generations;

create policy "experiment_generations_select_own" on public.experiment_generations
  for select using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_insert_own" on public.experiment_generations
  for insert with check (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_update_own" on public.experiment_generations
  for update using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
create policy "experiment_generations_delete_own" on public.experiment_generations
  for delete using (
    exists (
      select 1 from public.experiments e
      where e.id = experiment_generations.experiment_id
        and e.user_id = auth.uid()
    )
  );
