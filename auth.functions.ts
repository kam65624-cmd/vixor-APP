import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/**
 * Validates Telegram WebApp initData and returns an email + password for the
 * matching account, creating it if needed. The client then signs in with these
 * credentials using the standard Supabase client to establish a real session.
 */
export const telegramSignIn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ initData: z.string().min(1).max(8192) }).parse(d))
  .handler(async ({ data }) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

    const { verifyTelegramInitData } = await import("./telegram-verify.server");
    const tgUser = verifyTelegramInitData(data.initData, botToken);
    if (!tgUser) throw new Error("Invalid Telegram signature");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = `tg-${tgUser.id}@vixor.app`;
    // Deterministic per-user password derived from bot token + tg id (server-only secret)
    const { createHmac } = await import("crypto");
    const password = createHmac("sha256", botToken).update(`vixor:${tgUser.id}`).digest("hex");

    // Find by email
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 });
    let userId: string | null = null;
    for (const u of list?.users ?? []) {
      if (u.email === email) { userId = u.id; break; }
    }

    if (!userId) {
      // Try direct lookup via filter
      const { data: bySearch } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 200 });
      for (const u of bySearch?.users ?? []) {
        if (u.email === email) { userId = u.id; break; }
      }
    }

    if (!userId) {
      const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          telegram_id: tgUser.id,
          display_name: [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username,
          username: tgUser.username,
          avatar_url: tgUser.photo_url,
        },
      });
      if (error || !created.user) throw new Error(error?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    return { email, password };
  });
