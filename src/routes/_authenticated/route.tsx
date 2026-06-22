import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupabaseOrNull } from "@/shared/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const client = getSupabaseOrNull();
    if (!client) {
      console.warn("[Auth Guard] Supabase not configured — redirecting to /auth");
      throw redirect({ to: "/auth" });
    }
    try {
      const { data, error } = await client.auth.getSession();
      if (error || !data.session) {
        throw redirect({ to: "/auth" });
      }
      return { user: data.session.user };
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
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
      console.error("[Auth Guard] Unexpected error during session check:", err);
      throw err;
    }
  },
  component: () => <Outlet />,
});