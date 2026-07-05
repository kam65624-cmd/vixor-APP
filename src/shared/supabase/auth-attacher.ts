// ============================================================================
// Auth Attacher — Client middleware that attaches Bearer token to server Fns
// ============================================================================
//
// PROBLEM: getSession() returns the cached JWT from localStorage without
// checking if it's expired. When the 1-hour JWT expires, every server
// function call sends a dead token → "Unauthorized: Invalid token".
//
// SOLUTION: Decode the JWT locally (zero network cost) to check expiry.
// If expired, call refreshSession() to get a fresh token. Only send
// valid, non-expired tokens. Never send expired tokens to the server.
// ============================================================================

import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "./client";

/** Check if a JWT is expired by decoding the `exp` claim (no network call). */
function isJwtExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // exp is in seconds, Date.now() is in ms — add 30s buffer
    return payload.exp * 1000 < Date.now() + 30_000;
  } catch {
    return true; // If we can't parse it, treat as expired
  }
}

// Must be registered as a global `functionMiddleware` in `src/start.ts`; otherwise
// the browser never attaches the bearer token to serverFn RPCs.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    try {
      const { data } = await supabase.auth.getSession();
      let token = data.session?.access_token;

      if (token && isJwtExpired(token)) {
        // ── Token expired — try to refresh it ──
        // Supabase will use the refresh_token (valid for 30 days by default)
        // to get a new access_token. This is ONE network call, only when needed.
        console.log("[Auth Attacher] Token expired, refreshing...");
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        if (!refreshError && refreshData.session?.access_token) {
          token = refreshData.session.access_token;
          console.log("[Auth Attacher] Token refreshed successfully");
        } else {
          // Refresh failed (refresh_token also expired) — don't send any token.
          // The server will return an auth error, which the calling code can
          // handle (e.g., redirect to /auth). Sending an expired token would
          // just waste a server round-trip with the same error.
          console.warn(
            "[Auth Attacher] Token refresh failed:",
            refreshError?.message || "unknown error",
          );
          return next({ headers: {} });
        }
      }

      return next({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      console.warn(
        "[Supabase Auth Attacher] Failed to get session:",
        error instanceof Error ? error.message : String(error),
      );
      return next({ headers: {} });
    }
  },
);
