import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    } catch (e) {
      // If Supabase is not configured (missing env vars), redirect to auth
      // The auth page will handle showing a proper error
      if (e && typeof e === 'object' && 'to' in e) throw e; // re-throw redirect
      console.warn("[Auth] Could not check user, redirecting to login:", e);
      throw redirect({ to: "/auth" });
    }
  },
  component: () => <Outlet />,
});
