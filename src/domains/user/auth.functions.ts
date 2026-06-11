// ============================================================================
// User Domain — Auth Functions
// ============================================================================
//
// Telegram sign-in (WebApp + Widget) and admin user creation.
// NO Gemini API — 100% local authentication via Telegram + Supabase.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Validates Telegram WebApp initData OR Login Widget auth data and returns
 * an email + password for the matching account, creating it if needed.
 *
 * Two auth paths:
 * 1. WebApp: initData is a URL-encoded query string (from Telegram.WebApp.initData)
 * 2. Widget: initData is a JSON string with {id, first_name, ..., hash}
 */
export const telegramSignIn = createServerFn({ method: "POST" })
  .validator((d: unknown) => z.object({ initData: z.string().min(1).max(8192) }).parse(d))
  .handler(async ({ data }) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    // ── Determine auth type ──
    // WebApp initData looks like: "query_id=...&user=...&auth_date=...&hash=..."
    // Widget auth data is JSON: {"id":123,"first_name":"...","hash":"..."}
    let tgUser: { id: number; first_name?: string; last_name?: string; username?: string; photo_url?: string } | null = null;

    const isJson = data.initData.trimStart().startsWith("{");

    if (isJson) {
      // ── Telegram Login Widget auth ──
      const { verifyTelegramWidgetAuth } = await import("@/domains/user/server/telegram-verify");
      try {
        const parsed = JSON.parse(data.initData) as Record<string, string>;
        // Convert all values to strings for the verification function
        const authData: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
          authData[k] = String(v);
        }
        tgUser = verifyTelegramWidgetAuth(authData, botToken);
      } catch {
        // If JSON parsing fails, try WebApp format
      }
    }

    if (!tgUser) {
      // ── Telegram WebApp initData auth ──
      const { verifyTelegramInitData } = await import("@/domains/user/server/telegram-verify");
      tgUser = verifyTelegramInitData(data.initData, botToken);
    }

    if (!tgUser) throw new Error("Invalid Telegram authentication data");

    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const email = `tg-${tgUser.id}@vixor.app`;
    const { createHmac } = await import("crypto");
    const password = createHmac("sha256", botToken).update(`vixor:${tgUser.id}`).digest("hex");

    // ── Find or create the user ──
    // Strategy: Try to create first. If user already exists, that's fine —
    // we just need the email/password to sign in on the client side.
    // This avoids the expensive and unreliable listUsers() pagination.

    const displayName =
      [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username || "Trader";

    const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        telegram_id: tgUser.id,
        display_name: displayName,
        username: tgUser.username,
        avatar_url: tgUser.photo_url,
      },
    });

    if (createErr) {
      // If user already exists, that's OK — they can still sign in
      if (
        createErr.message.includes("already registered") ||
        createErr.message.includes("already been registered") ||
        createErr.message.includes("User already registered") ||
        createErr.status === 422 ||
        createErr.status === 409
      ) {
        console.log("[Auth] Telegram user already exists, proceeding with sign-in:", email);
      } else {
        // Some other error — this is fatal
        throw new Error(`Failed to create user: ${createErr.message}`);
      }
    } else if (created.user) {
      // New user — update their profile with telegram info
      try {
        await supabaseAdmin
          .from("profiles")
          .update({
            telegram_id: String(tgUser.id),
            telegram_username: tgUser.username,
            telegram_photo_url: tgUser.photo_url,
            display_name: displayName,
          })
          .eq("id", created.user.id);
      } catch {
        // Non-critical — profile row may not exist yet (trigger creates it)
      }

      // Credit signup bonus points (non-blocking)
      try {
        await supabaseAdmin.rpc("credit_points", {
          _user: created.user.id,
          _amount: 200,
          _reason: "signup_bonus",
          _meta: { source: "telegram_signup" },
        });
      } catch {
        // Non-critical — points system may not be set up yet
      }
    }

    return { email, password };
  });

/**
 * Creates a dedicated admin user for the application.
 * DEVELOPMENT-ONLY: This endpoint is disabled in production builds.
 */
export const createAdmin = (() => {
  if (process.env.NODE_ENV !== "production") {
    return createServerFn({ method: "POST" })
      .validator((d: unknown) =>
        z.object({ email: z.string().email(), password: z.string().min(6) }).parse(d),
      )
      .handler(async ({ data }) => {
        const { supabaseAdmin } = await import("@/shared/supabase/client.server");
        const { email, password } = data;
        const { error } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
        });
        if (error) throw new Error(`Failed to create admin user: ${error.message}`);
        return { email, password };
      });
  }
  return async () => {
    throw new Error("createAdmin endpoint is disabled in production.");
  };
})();
