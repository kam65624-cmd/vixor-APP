// ============================================================================
// Supabase Browser Client — Lazy-initialized singleton with fail-fast guard
// ============================================================================
//
// DESIGN: When SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY are missing, we NO
// LONGER return a deep-no-op Proxy that silently swallows every call. That
// pattern masked all Supabase failures as "no data" and made the app look
// broken without any actionable error. Instead, we now:
//   1. Attempt to create the real client lazily on first access.
//   2. If env vars are missing, log a clear warning AND throw on actual use.
//   3. Callers that need graceful degradation (e.g. optional auth checks in
//      SSR beforeLoad) should call `getSupabaseOrNull()` instead.
//
// This is the fix described in audit §15 issue #3.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function resolveConfig() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Support both naming conventions: SUPABASE_ANON_KEY (common) and SUPABASE_PUBLISHABLE_KEY (TanStack Start default)
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}

type SupabaseClient = ReturnType<typeof createClient<Database>>;

let _supabase: SupabaseClient | null = null;
let _initAttempted = false;
let _missingEnvVars: string[] | null = null;

function createSupabaseClient(): SupabaseClient | null {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = resolveConfig();

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL / VITE_SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY
        ? ["SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY (or VITE_ variants)"]
        : []),
    ];
    _missingEnvVars = missing;
    console.error(
      `[Supabase] Missing environment variable(s): ${missing.join(", ")}. ` +
        `Set them in .env (see .env.example) or on Vercel. ` +
        `All Supabase calls will now throw a clear configuration error instead of silently returning empty data.`,
    );
    return null;
  }

  return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

/**
 * Returns the real Supabase client, or null if env vars are missing.
 * Use this for code paths that can tolerate "no supabase" gracefully
 * (e.g. SSR auth guards that redirect to /auth on missing session).
 */
export function getSupabaseOrNull(): SupabaseClient | null {
  if (!_initAttempted) {
    _initAttempted = true;
    try {
      _supabase = createSupabaseClient();
    } catch (e) {
      console.error("[Supabase] Failed to create client:", e);
    }
  }
  return _supabase;
}

/**
 * Returns the real Supabase client, or THROWS a clear configuration error
 * if env vars are missing. This replaces the old deep-no-op Proxy that
 * silently swallowed every call as `{ data: null, error: "..." }`.
 *
 * Use this for code paths where missing Supabase is a bug, not a feature.
 */
export function getSupabaseOrThrow(): SupabaseClient {
  const client = getSupabaseOrNull();
  if (!client) {
    const missing = _missingEnvVars?.join(", ") ?? "unknown env var(s)";
    throw new Error(
      `Supabase browser client is not configured. Missing: ${missing}. ` +
        `Set these environment variables (see .env.example) and restart the app.`,
    );
  }
  return client;
}

// ── Public singleton ───────────────────────────────────────────────────────
//
// We expose a Proxy that lazily resolves to the real client on first property
// access. If env vars are missing, we throw a clear configuration error on
// the first call — instead of silently returning `{ data: null, error: ... }`
// for every call (which made the app look "empty" instead of "broken").
//
// Code paths that need graceful "no supabase" handling should import
// `getSupabaseOrNull` directly instead of the `supabase` singleton.
//
// Import the supabase client like this:
//   import { supabase } from "@/shared/supabase/client";
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    const client = getSupabaseOrNull();
    if (!client) {
      const missing = _missingEnvVars?.join(", ") ?? "unknown env var(s)";
      throw new Error(
        `Supabase browser client is not configured. Missing: ${missing}. ` +
          `Set these environment variables (see .env.example) and restart the app.`,
      );
    }
    return Reflect.get(client, prop, receiver);
  },
});
