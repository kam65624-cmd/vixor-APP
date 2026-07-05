// ============================================================================
// Auth Attacher — Client middleware that attaches Bearer token to server Fns
// ============================================================================
//
// FIX: getSession() reads from localStorage without validating the JWT.
// If the access_token is expired (default: 1 hour), it still gets sent,
// causing "Unauthorized: Invalid token" on every server function call.
//
// Solution: Use getUser() which validates the JWT with the server and
// auto-refreshes if expired (since autoRefreshToken: true in client.ts).
// Falls back to getSession() only if getUser() fails unexpectedly.
// ============================================================================

import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      // ── Strategy 1: getUser() validates the JWT and auto-refreshes ──
      // This is the primary method because it ensures the token is valid
      // before sending it. If the access_token is expired but the
      // refresh_token is still valid, Supabase auto-refreshes the session.
      const {
        data: { user },
        error: getUserError,
      } = await supabase.auth.getUser();

      if (!getUserError && user) {
        // getUser() succeeded — session is valid (or was just refreshed).
        // Re-read session to get the fresh access_token.
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.access_token) {
          return next({
            headers: { Authorization: `Bearer ${session.access_token}` },
          });
        }
      }

      // ── Strategy 2: Fallback to getSession() ──
      // If getUser() failed for a non-auth reason (e.g. network), try
      // sending whatever token we have. The server will reject invalid
      // tokens, which is better than silently dropping auth headers.
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      return next({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      // If Supabase client is not configured (missing env vars),
      // proceed without auth headers — the server middleware will
      // return an appropriate error to the client.
      console.warn(
        "[Supabase Auth Attacher] Failed to get session:",
        error instanceof Error ? error.message : String(error),
      );
      return next({
        headers: {},
      });
    }
  },
);
