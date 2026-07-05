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
      // ── Step 1: Validate the current session with getUser() ──
      // Unlike getSession() which only reads from localStorage,
      // getUser() actually validates the JWT with the server and
      // auto-refreshes if expired (since autoRefreshToken: true).
      const {
        data: { user: validatedUser },
        error: getUserError,
      } = await client.auth.getUser();

      if (!getUserError && validatedUser) {
        return { user: validatedUser };
      }

      // ── Step 2: Session invalid or expired — try Telegram auto-signin ──
      // This makes the auth page invisible to Telegram users: they land on
      // any authenticated route, the guard signs them in silently, and they
      // see the dashboard immediately.
      console.log(
        "[Auth Guard] Session invalid, trying Telegram auto-signin. Error:",
        getUserError?.message,
      );

      const initData = getTelegramInitData();
      if (initData && initData.length > 10) {
        console.log(
          "[Auth Guard] No valid session but Telegram initData found — attempting auto-signin",
        );
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

      // ── Step 3: Nothing worked — redirect to /auth ──
      if (getUserError) {
        console.warn("[Auth Guard] Auth session invalid — redirecting to /auth");
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
