import { createFileRoute, Outlet, redirect, useLocation } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { getSupabaseOrNull } from "@/shared/supabase/client";
import { getStyleTokens } from "@/experience/styles";
import type { WorkspaceStyle } from "@/experience/styles";

/** Routes that should auto-apply the terminal (bullx) style */
const WEB3_TERMINAL_ROUTES = [
  "/discover",
  "/token/",
  "/communities",
  "/wallet-web3",
  "/activity-web3",
] as const;

function isWeb3TerminalRoute(pathname: string): boolean {
  return WEB3_TERMINAL_ROUTES.some((route) => pathname.startsWith(route));
}

/**
 * Auto-detects workspace style based on the current route.
 * Web3 terminal routes get "bullx" style; everything else gets "os" style.
 * Applies CSS vars and class to <html> root, matching the logic from WorkspaceSwitcher.
 */
function WorkspaceAutoDetector() {
  const location = useLocation();
  const prevStyle = useRef<WorkspaceStyle | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const style: WorkspaceStyle = isWeb3TerminalRoute(location.pathname) ? "bullx" : "os";
    if (style === prevStyle.current) return;
    prevStyle.current = style;

    const root = document.documentElement;
    const tokens = getStyleTokens(style);

    Object.entries(tokens.cssVars).forEach(([key, value]) => {
      root.style.setProperty(key, value as string);
    });

    root.classList.remove("ws-bullx", "ws-axiom", "ws-opensea", "ws-os");
    root.classList.add(`ws-${style}`);
  }, [location.pathname]);

  return null;
}

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
  component: () => (
    <>
      <WorkspaceAutoDetector />
      <Outlet />
    </>
  ),
});
