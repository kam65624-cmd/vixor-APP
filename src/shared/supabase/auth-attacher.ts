// ============================================================================
// Auth Attacher — Client middleware that attaches Bearer token to server Fns
// ============================================================================
//
// PROBLEM: getSession() returns the cached JWT from localStorage. The token
// may look valid locally (exp in the future) but be rejected by the Supabase
// server (key rotation, user disabled, etc.). Sending a dead token causes
// "Unauthorized: Invalid token" on every server function call.
//
// SOLUTION: Call getUser() first — this validates the JWT with the Supabase
// server AND auto-refreshes it if expired (since autoRefreshToken: true in
// client.ts). After getUser() succeeds, getSession() returns the fresh token.
// This costs one extra API call per server function but guarantees we NEVER
// send a rejected token.
//
// WHY NOT just check JWT expiry locally? Because a token can be "not expired"
// by clock but still rejected by the server. Local checks are insufficient.
// ============================================================================

import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      // ── Step 1: Validate session with server ──
      // getUser() makes an API call to Supabase to validate the JWT.
      // With autoRefreshToken: true, it also auto-refreshes if expired.
      // This is the ONLY reliable way to know the token is valid.
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (!getUserError && user) {
        // ── Step 2: Get the (possibly refreshed) token ──
        // After getUser() succeeds, the session in localStorage is updated
        // with the fresh token (if a refresh happened). getSession() is a
        // local call that reads from localStorage — no network needed here.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          return next({ headers: { Authorization: `Bearer ${session.access_token}` } });
        }
      }

      // ── No valid session — proceed without auth header ──
      // The server middleware (requireSupabaseAuth) will return 401.
      // The calling code (mutation onError, query onError) handles this.
      console.warn("[Auth Attacher] No valid session:", getUserError?.message || "no user");
      return next({ headers: {} });
    } catch (error) {
      console.warn(
        "[Auth Attacher] Unexpected error:",
        error instanceof Error ? error.message : String(error),
      );
      return next({ headers: {} });
    }
  },
);
