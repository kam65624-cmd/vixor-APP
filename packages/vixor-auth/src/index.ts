// ============================================================================
// VIXOR Auth Package — Public Exports
// ============================================================================

export * from "./types";
export { supabase, getSupabaseOrNull, getSupabaseOrThrow } from "./browser-client";
export { supabaseAdmin } from "./server-client";
export { requireSupabaseAuth } from "./middleware/server-auth";
export { attachSupabaseAuth } from "./middleware/client-auth";
