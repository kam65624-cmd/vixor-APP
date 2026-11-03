#!/usr/bin/env bash
set -euo pipefail
: "${PGHOST:=localhost}"
: "${PGPORT:=5432}"
: "${PGUSER:=postgres}"
: "${PGDATABASE:=vixor_bootstrap_test}"
psql_cmd=(psql -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$PGDATABASE" -v ON_ERROR_STOP=1)
"${psql_cmd[@]}" -f supabase/tests/fixtures/supabase-platform-bootstrap.sql
"${psql_cmd[@]}" -f supabase/tests/fixtures/app-pre-migration-baseline.sql
mapfile -t migrations < <(find supabase/migrations -maxdepth 1 -type f -name '*.sql' | sort)
if [[ ${#migrations[@]} -eq 0 ]]; then echo 'No Supabase migrations found' >&2; exit 1; fi
for migration in "${migrations[@]}"; do echo "Applying ${migration}"; "${psql_cmd[@]}" -f "$migration"; done
"${psql_cmd[@]}" -f supabase/tests/verify-clean-migration-bootstrap.sql
echo "Clean PostgreSQL bootstrap passed: ${#migrations[@]} migrations applied."
