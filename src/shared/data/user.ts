import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Notifications ────────────────────────
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return { notifications: notifs || [] };
  });

// ── Unread Notification Count (lightweight, no full payload) ──────────
export const getUnreadNotificationCount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null);
    return { unreadCount: count ?? 0 };
  });

// ── User Settings ────────────────────────
export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { settings: data || null };
  });

// ── User Profile ────────────────────────
export const getUserProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single();

    return { profile };
  });

// ── Mark Notification Read ────────────────────────
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    return { success: true };
  });

// ── Update User Settings ────────────────────────
export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        preferred_llm_provider: z.string().optional(),
        notification_channels: z.any().optional(),
        telegram_chat_id: z.string().nullable().optional(),
        webhook_url: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("user_settings").update(data).eq("user_id", userId);
    } else {
      await supabase.from("user_settings").insert({ user_id: userId, ...data });
    }
    return { success: true };
  });

// ── Premium Plans & Subscription ────────────────────────
export const getPremiumData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: plans } = await supabase
      .from("premium_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const { data: sub } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { plans: plans || [], subscription: sub || null };
  });
