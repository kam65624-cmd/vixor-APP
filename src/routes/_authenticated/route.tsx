import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    // ── CRITICAL: Use getSession() NOT getUser() ──
    // getUser() sends a network request to Supabase Auth which can trigger
    // token refresh → onAuthStateChange → query invalidation → re-render cascade → React #310
    // getSession() only reads the local session from storage — no network call, no token refresh.
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: () => <Outlet />,
});
