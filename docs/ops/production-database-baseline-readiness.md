# Production database baseline readiness

**Snapshot date:** 2026-11-06  
**Project ref:** `crscocazckmjeekivojd` (VIXOR APP Production)  
**Scope:** read-only metadata inspection only. No rows exported, no DDL executed, and no migration-history changes made.

## Observed migration-history state

- `supabase_migrations` schema was not present when checked with `to_regclass`.
- `supabase_migrations.schema_migrations` was not present.
- Supabase migration-list API returned an empty migration list.
- Therefore, Production currently has no migration ledger that can be treated as an authoritative record of applied versions.

## Observed schema inventory

| Area | Observed count |
|---|---:|
| Public base tables | 39 |
| Public views | 0 |
| Public materialized views | 0 |
| Public functions | 11 |
| Public triggers | 11 |
| Public RLS policies | 231 |
| Public indexes | 121 |
| Public enum types | 4 |
| Installed extensions | 5 |
| Public tables with RLS enabled | 39 |
| Public tables with RLS disabled | 0 |

Additional relation counts outside `public`: `auth` 27, `realtime` 3, `storage` 10, `vault` 1. These are relation counts, not a complete schema export.

Installed extensions observed: `pgcrypto`, `supabase_vault`, `pg_stat_statements`, `uuid-ossp`, and `plpgsql`.

## Independent security findings (not changed by this PR)

The Supabase Security Advisor returned these existing warnings during the same read-only review:

1. `public.create_default_watchlist()` is SECURITY DEFINER and executable by both `anon` and `authenticated`; its search_path is mutable.
2. Six public functions have mutable search_path settings.
3. Auth leaked-password protection is disabled.

These findings need separate scope and remediation review. This payments PR does not alter them.

## Safe baseline procedure

1. Do not run `supabase db push`, `supabase migration repair`, or any Production DDL while the migration ledger is absent.
2. From a clean local checkout, inspect the installed CLI's `db dump`, `db pull`, and `migration list` help output and confirm the linked project ref is exactly `crscocazckmjeekivojd`.
3. First obtain a schema-only export with `supabase db dump`. This is a read-only export; do not include production data or role dumps. Protect the file as internal schema material and review it before committing.
4. Supabase CLI's default dump excludes managed schemas (`auth`, `storage`) and extension-created schemas. Custom triggers/policies in managed schemas need a separate reviewed capture. Do not assume the public dump is the complete project baseline.
5. Compare the captured Production schema against the repository's 44-migration replay. They are not yet proven equivalent. In particular, verify public tables, columns, constraints, indexes, functions, triggers, grants, RLS policies, enums, extensions, and customizations to managed schemas.
6. Only after that comparison, choose the migration-history strategy. A `db pull` may create a local migration and can optionally insert a history row remotely; that remote history write requires explicit owner approval. Do not use `migration repair` to mark the existing chain applied until every version has been reconciled against the live schema.
7. Once a baseline strategy is approved, verify it on disposable PostgreSQL and run `supabase migration list` against Production in read-only mode before any deployment step.

## Read-only baseline capture (separate scratch directory)

**CLI version note:** Supabase CLI v3 became the default on 2026-11-02 and changes database command targets to local by default; v2 remains pinned in CI and in this capture procedure until the project deliberately completes the v3 migration. Do not run an unpinned `npx supabase` command for this operation.

Use a new empty folder outside the existing APP checkout so the 44 historical migrations and any local work are not touched. The commands below use the CI-pinned CLI version and link only the known Production project:

```powershell
$ErrorActionPreference = "Stop"
$Scratch = Join-Path $env:TEMP "vixor-production-baseline-20261106"
if (Test-Path $Scratch) {
  throw "Scratch folder already exists. Choose a new empty folder; do not overwrite it."
}
New-Item -ItemType Directory -Path $Scratch | Out-Null
Push-Location $Scratch
try {
  npx --yes supabase@2.122.1 init
  if ($LASTEXITCODE -ne 0) { throw "Supabase init failed" }

  npx --yes supabase@2.122.1 link --project-ref crscocazckmjeekivojd
  if ($LASTEXITCODE -ne 0) { throw "Supabase link failed" }

  npx --yes supabase@2.122.1 db pull production_baseline --linked --diff-engine migra
  if ($LASTEXITCODE -ne 0) { throw "Production schema pull failed" }

  Get-ChildItem .\supabase\migrations
}
finally {
  Pop-Location
}
```

- The CLI will prompt for the database password locally; do not paste it into chat or put it in the command line.
- When `db pull` asks **“Update remote migration history table?”**, answer **N**. This captures the schema locally without registering a migration version in Production.
- Do not run `db push`, `migration repair`, or `db reset --linked`.
- The generated file should contain schema DDL, not table data. Inspect it for unexpected drops, role changes, extension changes, or secrets before sharing it.
- Upload only the generated `*_production_baseline.sql` file here. We will compare it against the APP migration chain and review any managed-schema customizations before deciding how to establish history.

Supabase CLI documents that the legacy `migra` path uses `pg_dump` when remote migration history is empty, and that `db pull` asks whether to update remote history. This is why the capture is performed in an empty scratch checkout and the prompt must be declined.

## Current decision

**Baseline status: Not established.** The inventory above is not a schema dump and cannot be used as a baseline migration. Production remains unchanged. The next required evidence is a schema-only export from the actual Production database, followed by a reviewed diff against the repository chain.
