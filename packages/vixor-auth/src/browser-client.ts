// ============================================================================
// VIXOR Auth — Browser Client (Lazy-initialized singleton with fail-fast guard)
// ============================================================================

import { createClient } from "@supabase/supabase-js";

function resolveConfig() {
  const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY;
  return { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}

type SupabaseClient = ReturnType<typeof createClient>;

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
    console.error(`[VixorAuth] Missing environment variable(s): ${missing.join(", ")}`);
    return null;
  }

  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export function getSupabaseOrNull(): SupabaseClient | null {
  if (!_initAttempted) {
    _initAttempted = true;
    try {
      _supabase = createSupabaseClient();
    } catch (e) {
      console.error("[VixorAuth] Failed to create client:", e);
    }
  }
  return _supabase;
}

export function getSupabaseOrThrow(): SupabaseClient {
  const client = getSupabaseOrNull();
  if (!client) {
    const missing = _missingEnvVars?.join(", ") ?? "unknown env var(s)";
    throw new Error(`Supabase browser client is not configured. Missing: ${missing}`);
  }
  return client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop, receiver) {
    const client = getSupabaseOrNull();
    if (!client) {
      const missing = _missingEnvVars?.join(", ") ?? "unknown env var(s)";
      throw new Error(`Supabase browser client is not configured. Missing: ${missing}`);
    }
    return Reflect.get(client, prop, receiver);
  },
});
