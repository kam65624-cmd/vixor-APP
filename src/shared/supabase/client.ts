// ============================================================================
// Supabase Browser Client — Lazy-initialized singleton with deep Proxy fallback
// ============================================================================
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

function createSupabaseClient() {
  // Use import.meta.env for client-side (Vite build-time replacement)
  // Fall back to process.env for SSR (server-side rendering)
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  // Support both naming conventions: SUPABASE_ANON_KEY (common) and SUPABASE_PUBLISHABLE_KEY (TanStack Start default)
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    const missing = [
      ...(!SUPABASE_URL ? ["SUPABASE_URL"] : []),
      ...(!SUPABASE_PUBLISHABLE_KEY ? ["SUPABASE_PUBLISHABLE_KEY / SUPABASE_ANON_KEY"] : []),
    ];
    const message = `Missing Supabase environment variable(s): ${missing.join(", ")}.`;
    console.warn(`[Supabase] ${message} — client will be non-functional until env vars are set.`);
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

type SupabaseClient = ReturnType<typeof createClient<Database>>;

let _supabase: SupabaseClient | null | undefined;
let _initAttempted = false;

/**
 * Deep no-op Proxy — returns a Proxy for any property access, and a
 * no-op async function for any function call. This ensures that
 * `supabase.auth.signInWithPassword()` etc. never throw "is not a function"
 * even when the real client hasn't been created yet.
 */
function deepNoOp(): any {
  return new Proxy(() => Promise.resolve({ data: null, error: new Error("Supabase not configured") }), {
    get(_, prop) {
      if (prop === "then" || prop === "catch" || prop === "finally") {
        // Make the no-op function thenable (awaitable) without recursion
        return undefined;
      }
      return deepNoOp();
    },
    apply() {
      return Promise.resolve({ data: null, error: new Error("Supabase not configured") });
    },
  });
}

// Import the supabase client like this:
// import { supabase } from "@/shared/supabase/client";
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    if (!_supabase && !_initAttempted) {
      _initAttempted = true;
      try {
        _supabase = createSupabaseClient();
      } catch (e) {
        console.error("[Supabase] Failed to create client:", e);
      }
    }
    if (_supabase) {
      return Reflect.get(_supabase, prop, receiver);
    }
    // Deep no-op: returns a Proxy that supports arbitrary nested property
    // access and function calls without ever throwing "is not a function"
    return deepNoOp();
  },
});
