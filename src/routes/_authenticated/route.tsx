import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/shared/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // ── CRITICAL: Use getSession() NOT getUser() ──
    // getUser() sends a network request to Supabase Auth which can trigger
    // token refresh → onAuthStateChange → query invalidation → re-render cascade → React #310
    // getSession() only reads the local session from storage — no network call, no token refresh.
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) throw redirect({ to: "/auth" });
      return { user: data.session.user };
    } catch (err) {
      // If it's a redirect, re-throw it
      if (err && typeof err === "object" && "to" in err) throw err;
      // If Supabase client is not configured, redirect to auth
      console.warn(
        "[Auth Guard] Session check failed, redirecting to auth:",
        err instanceof Error ? err.message : String(err),
      );
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
