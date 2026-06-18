import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupabaseOrNull } from "@/shared/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // ── CRITICAL: Use getSession() NOT getUser() ──
    // getUser() sends a network request to Supabase Auth which can trigger
    // token refresh → onAuthStateChange → query invalidation → re-render cascade → React #310
    // getSession() only reads the local session from storage — no network call, no token refresh.
    //
    // ── Phase 0 fix (audit §15 issue #8) ──
    // Previously: ANY error (network failure, server-fn error, etc.) was caught
    // and the user was redirected to /auth — making the app feel unstable.
    // Now: we distinguish between (a) actual auth failures → redirect, and
    // (b) other errors → re-throw so they propagate to the error boundary.
    const client = getSupabaseOrNull();
    if (!client) {
      // Supabase not configured — redirect to /auth so the user sees the auth
      // page instead of a blank screen. This is the legitimate "no auth" case.
      console.warn("[Auth Guard] Supabase not configured — redirecting to /auth");
      throw redirect({ to: "/auth" });
    }
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        // Legitimate "no session" case — redirect to login
        throw redirect({ to: "/auth" });
      }
      return { user: data.session.user };
    } catch (err) {
      // If it's a redirect (TanStack router throws these for navigation),
      // re-throw it so the router can handle it
      if (err && typeof err === "object" && "to" in err) throw err;

      // If the error message indicates auth/session issues, redirect to /auth
      const msg = err instanceof Error ? err.message : String(err);
      const isAuthError =
        msg.includes("Invalid token") ||
        msg.includes("session_not_found") ||
        msg.includes("AuthSession") ||
        msg.includes("JWT") ||
        msg.includes("refresh_token") ||
        msg.includes("not_authenticated");
      if (isAuthError) {
        console.warn("[Auth Guard] Auth session error — redirecting to /auth:", msg);
        throw redirect({ to: "/auth" });
      }

      // For ALL OTHER errors (network failures, server errors, etc.) — DO NOT
      // silently log the user out. Propagate to the error boundary so the user
      // sees what went wrong instead of being bounced to /auth.
      console.error("[Auth Guard] Unexpected error during session check:", err);
      throw err;
    }
  },
  component: () => <Outlet />,
});
