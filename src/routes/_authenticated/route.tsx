import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { getSupabaseOrNull } from "@/shared/supabase/client";
import { getTelegramInitData } from "@/shared/telegram";

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
      if (!error && data.session) {
        return { user: data.session.user };
      }

      // ── No session — try Telegram auto-signin if inside Telegram WebApp ──
      // This makes the auth page invisible to Telegram users: they land on
      // any authenticated route, the guard signs them in silently, and they
      // see the dashboard immediately.
      const initData = getTelegramInitData();
      if (initData && initData.length > 10) {
        console.log("[Auth Guard] No session but Telegram initData found — attempting auto-signin");
        try {
          const { telegramSignIn } = await import("@/domains/user/auth.functions");
          const { email, password } = await telegramSignIn({ data: { initData } });
          const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
            email,
            password,
          });
          if (!signInError && signInData.session) {
            console.log("[Auth Guard] Telegram auto-signin success");
            return { user: signInData.session.user };
          }
          console.error("[Auth Guard] Telegram auto-signin signIn failed:", signInError?.message);
        } catch (tgErr) {
          console.error("[Auth Guard] Telegram auto-signin failed:", tgErr);
        }
      }

      // ── No session and no Telegram auto-signin — redirect to /auth ──
      if (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const isAuthError =
          msg.includes("Invalid token") ||
          msg.includes("session_not_found") ||
          msg.includes("AuthSession") ||
          msg.includes("JWT") ||
          msg.includes("refresh_token") ||
          msg.includes("not_authenticated");
        if (isAuthError) {
          console.warn("[Auth Guard] Auth session error — redirecting to /auth:", msg);
        }
      }
      throw redirect({ to: "/auth" });
    } catch (err) {
      if (err && typeof err === "object" && "to" in err) throw err;
      console.error("[Auth Guard] Unexpected error during session check:", err);
      throw err;
    }
  },
  component: () => <Outlet />,
});