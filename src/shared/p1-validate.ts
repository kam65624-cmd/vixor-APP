// ============================================================================
// VIXOR P1 Migration Validation — Shared Server Function
// ============================================================================
//
// Checks whether the 3 critical Phase 1 migrations have been applied
// to the database by querying supabase_migrations.schema_migrations.
//
// Critical migrations:
//   1. 20260629000000_add_signal_tracking.sql
//   2. 20260811000000_add_signal_transitions.sql
//   3. 20260811000001_execute_signal_transition_rpc.sql
//
// Usage:
//   import { validateP1Migrations } from '@/shared/p1-validate';
//   const status = await validateP1Migrations();
// ============================================================================

export interface P1MigrationStatus {
  add_signal_tracking: {
    version: string;
    applied: boolean;
  };
  add_signal_transitions: {
    version: string;
    applied: boolean;
  };
  execute_signal_transition_rpc: {
    version: string;
    applied: boolean;
  };
  allApplied: boolean;
}

const CRITICAL_MIGRATIONS = [
  "20260629000000_add_signal_tracking",
  "20260811000000_add_signal_transitions",
  "20260811000001_execute_signal_transition_rpc",
] as const;

/**
 * Validate that the 3 critical Phase 1 migrations have been applied.
 * Uses supabaseAdmin RPC to query supabase_migrations.schema_migrations,
 * which is a Supabase system table not included in generated types.
 *
 * Returns the status of each migration and whether all are applied.
 */
export async function validateP1Migrations(): Promise<P1MigrationStatus> {
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Query system migration table via raw SQL (not in generated types).
  // The table has columns: version (text), name (text), applied_at (timestamptz)
  const versionPrefixes = CRITICAL_MIGRATIONS.map((v) => v.split("_")[0]);

  let appliedVersions: string[] = [];
  try {
    // Use the PostgreSQL-compatible query via Supabase's PostgREST
    // by querying with a type-safe approach through rpc or direct query.
    // Since schema_migrations is a system table, we use a raw SQL approach.
    const { data, error } = await (supabaseAdmin as any)
      .from("schema_migrations")
      .select("version")
      .in("version", versionPrefixes);

    if (data && !error) {
      appliedVersions = data.map((r: { version: string }) => r.version);
    }
  } catch {
    // If the query fails (e.g., RLS blocks access), assume unverified
  }

  const appliedSet = new Set(appliedVersions);

  const checkMigration = (migrationKey: string): { version: string; applied: boolean } => {
    const version = migrationKey.split("_")[0];
    return {
      version,
      applied: appliedSet.has(version),
    };
  };

  const addSignalTracking = checkMigration(CRITICAL_MIGRATIONS[0]);
  const addSignalTransitions = checkMigration(CRITICAL_MIGRATIONS[1]);
  const executeSignalTransitionRpc = checkMigration(CRITICAL_MIGRATIONS[2]);

  const allApplied =
    addSignalTracking.applied && addSignalTransitions.applied && executeSignalTransitionRpc.applied;

  return {
    add_signal_tracking: addSignalTracking,
    add_signal_transitions: addSignalTransitions,
    execute_signal_transition_rpc: executeSignalTransitionRpc,
    allApplied,
  };
}
