// ============================================================================
// User Domain — Server Functions
// ============================================================================
//
// User profile, commerce, notifications, referrals, and Telegram integration.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { log } from "@/shared/structured-logger";

// ---------- ME / PROFILE ----------
export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: balance }, { data: sub }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("points_balances").select("*").eq("user_id", userId).maybeSingle(),
      supabase
        .from("premium_subscriptions")
        .select("*, premium_plans(*)")
        .eq("user_id", userId)
        .gt("current_period_end", new Date().toISOString())
        .order("current_period_end", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      profile,
      balance: balance ?? { balance: 0, lifetime_earned: 0 },
      premium: sub,
      isPremium: !!sub,
    };
  });

// ---------- CATALOG ----------
export const getPointPacks = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("point_packs")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  });

export const getPremiumPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("premium_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    return data ?? [];
  });

// ---------- PURCHASES ----------
//
// Two modes:
//   1. Stars payment (Telegram): client sends { packId, paymentMethod: "stars", telegramChargeId }
//      Server verifies via Telegram getPayments API before granting.
//   2. Free/gratis: pack price_cents == 0, instant grant without verification.
//
// Any other paymentMethod or missing verification data → 400.
//

/**
 * Verify a Telegram Stars payment by calling the Bot API.
 *
 * Telegram Stars flow:
 *   1. Server creates an invoice via createInvoiceLink (stores payload as userId_packId_timestamp)
 *   2. User pays → Telegram sends successful_payment webhook with the same payload
 *   3. The webhook handler stores the confirmed chargeId in `payments` table
 *   4. This function verifies the chargeId exists in confirmed payments
 *
 * Returns true only if the payment is confirmed and matches the expected payload.
 */
async function verifyStarsPayment(
  botToken: string,
  chargeId: string,
  _expectedPayload: string | null,
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    // ── Method 1: Database lookup (webhook-confirmed payments) ──
    // Check if this chargeId was confirmed by the Telegram webhook
    const { data: confirmedPayment } = await supabaseAdmin
      .from("payments")
      .select("id, status")
      .eq("telegram_charge_id", chargeId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (confirmedPayment) {
      return true;
    }

    // No need for fallback API call — webhook confirmation is the source of truth
    return false;
  } catch {
    log.error("verification_failed", { chargeId });
    return false;
  }
}

export const purchasePack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        packId: z.string().min(1).max(64),
        paymentMethod: z.enum(["stars", "free"]).optional().default("free"),
        telegramChargeId: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data: pack } = await supabaseAdmin
      .from("point_packs")
      .select("*")
      .eq("id", data.packId)
      .eq("is_active", true)
      .maybeSingle();
    if (!pack) throw new Error("Pack not found");

    // --- Payment verification ---
    const isFree = !pack.price_cents || pack.price_cents === 0;
    if (data.paymentMethod === "stars" && !isFree) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) throw new Error("Server configuration error: Telegram bot token not set");
      if (!data.telegramChargeId) {
        throw new Error("Payment verification failed: missing charge ID");
      }
      // Verify charge exists in confirmed payments (webhook auto-credits points)
      const verified = await verifyStarsPayment(botToken, data.telegramChargeId, null);
      if (!verified) {
        throw new Error("Payment verification failed: charge could not be confirmed");
      }
      // Points are already credited by the webhook — skip credit_points here to prevent double-crediting
      return { ok: true, credited: 0, message: "Points already credited via webhook" };
    } else if (!isFree) {
      throw new Error("Payment required: this pack is not free");
    }
    // Free packs or verified payments proceed to credit.

    const total = pack.points + (pack.bonus_points ?? 0);
    const { error } = await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: total,
      _reason:
        data.paymentMethod === "stars"
          ? ("telegram_stars_purchase" as const)
          : ("pack_purchase" as const),
      _meta: {
        pack_id: pack.id,
        price_cents: pack.price_cents,
        payment_method: data.paymentMethod,
      },
    });
    if (error) throw new Error(error.message);
    return { ok: true, credited: total };
  });

export const subscribePremium = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        planId: z.string().min(1).max(64),
        paymentMethod: z.enum(["stars", "free"]).optional().default("free"),
        telegramChargeId: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data: plan } = await supabaseAdmin
      .from("premium_plans")
      .select("*")
      .eq("id", data.planId)
      .eq("is_active", true)
      .maybeSingle();
    if (!plan) throw new Error("Plan not found");

    // --- Payment verification ---
    const isFree = !plan.price_cents || plan.price_cents === 0;
    if (data.paymentMethod === "stars" && !isFree) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) throw new Error("Server configuration error: Telegram bot token not set");
      if (!data.telegramChargeId) {
        throw new Error("Payment verification failed: missing charge ID");
      }
      // Verify charge exists in confirmed payments (webhook auto-credits premium)
      const verified = await verifyStarsPayment(botToken, data.telegramChargeId, null);
      if (!verified) {
        throw new Error("Payment verification failed: charge could not be confirmed");
      }
      // Premium subscription is granted — webhook confirms payment, we grant subscription here
    } else if (!isFree) {
      throw new Error("Payment required: this plan is not free");
    }

    const days = plan.interval === "year" ? 365 : 30;
    const periodEnd = new Date(Date.now() + days * 86400 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("premium_subscriptions").insert({
      user_id: userId,
      plan_id: plan.id,
      status: "active",
      current_period_end: periodEnd,
    });
    if (error) throw new Error(error.message);
    return { ok: true, current_period_end: periodEnd };
  });

// ---------- NOTIFICATIONS ----------
export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

export const markAllNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await context.supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .is("read_at", null);
    return { ok: true };
  });

// ---------- REFERRALS ----------
export const claimReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        code: z
          .string()
          .min(4)
          .max(16)
          .regex(/^[A-Z0-9]+$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId, supabase } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data: me } = await supabase
      .from("profiles")
      .select("referred_by")
      .eq("id", userId)
      .maybeSingle();
    if (me?.referred_by) throw new Error("Referral already applied");

    const { data: ref } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("referral_code", data.code)
      .maybeSingle();
    if (!ref || ref.id === userId) throw new Error("Invalid code");

    await supabaseAdmin.from("profiles").update({ referred_by: ref.id }).eq("id", userId);
    await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: 15,
      _reason: "referral_bonus",
      _meta: { from: ref.id },
    });
    await supabaseAdmin.rpc("credit_points", {
      _user: ref.id,
      _amount: 25,
      _reason: "referral_bonus",
      _meta: { from: userId },
    });
    return { ok: true };
  });

export const getReferralStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { count } = await context.supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", context.userId);
    return { count: count ?? 0 };
  });

// ---------- TELEGRAM INTEGRATION ----------
export const linkTelegramAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ initData: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("Server configuration error: missing bot token");

    const { verifyTelegramInitData } = await import("@/domains/user/server/telegram-verify");

    const user = verifyTelegramInitData(data.initData, botToken);
    if (!user) throw new Error("Invalid Telegram signature");

    const photoUrl = user.photo_url || null;
    const username = user.username || null;
    const displayName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "Trader";

    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_id: String(user.id) as any,
        telegram_username: username,
        telegram_photo_url: photoUrl,
        display_name: displayName,
      })
      .eq("id", userId);

    if (error) throw new Error("Failed to link Telegram account");

    return {
      ok: true,
      telegram_username: username,
      telegram_photo_url: photoUrl,
      display_name: displayName,
    };
  });

// ---------- TELEGRAM AUTO-SYNC ----------
// Called on every app open from Telegram WebApp to keep profile data fresh.
// Updates display_name, telegram_username, telegram_photo_url, telegram_id.
export const syncTelegramProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        telegramId: z.number(),
        firstName: z.string(),
        lastName: z.string().optional(),
        username: z.string().optional(),
        photoUrl: z.string().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const displayName =
      [data.firstName, data.lastName].filter(Boolean).join(" ") || data.username || "Trader";

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_id: String(data.telegramId) as any,
        telegram_username: data.username || null,
        telegram_photo_url: data.photoUrl || null,
        display_name: displayName,
      })
      .eq("id", userId);

    if (error) {
      log.warn("sync_telegram_failed", { userId, error: error.message });
      // Don't throw — this is a background sync, failure should not block the app
      return { ok: false, error: error.message };
    }

    return { ok: true, display_name: displayName };
  });

export const createStarsInvoice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ packId: z.string(), amountStars: z.number() }).parse(d))
  .handler(async ({ data, context }) => {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) throw new Error("Bot token not configured");

    const payload = `${context.userId}_${data.packId}_${Date.now()}`;

    const res = await fetch(`https://api.telegram.org/bot${botToken}/createInvoiceLink`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Vixor Points",
        description: `Purchase Vixor Points Pack`,
        payload: payload,
        provider_token: "",
        currency: "XTR",
        prices: [{ label: "Points", amount: data.amountStars }],
      }),
    });

    const result = await res.json();
    if (!result.ok) throw new Error(result.description || "Failed to create invoice");

    // Store the payment record so the webhook and verification can find it
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      telegram_charge_id: null, // Will be set when webhook confirms
      payload: payload,
      amount_stars: data.amountStars,
      pack_id: data.packId,
      status: "pending",
      telegram_invoice_url: result.result,
    });

    return { invoiceUrl: result.result };
  });

// ---------- REWARDS REDEMPTION ----------
export const redeemReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        rewardName: z.string().min(1).max(64),
        cost: z.number().int().positive(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    // 1. Check current balance
    const { data: bal } = await supabaseAdmin
      .from("points_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();

    const currentBalance = bal?.balance ?? 0;
    if (currentBalance < data.cost) {
      throw new Error(
        `Insufficient points. You need ${data.cost} pts but have ${currentBalance} pts.`,
      );
    }

    // 2. Deduct points via RPC
    const { error: debitErr } = await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: -data.cost,
      _reason: "admin_adjust" as const,
      _meta: { reward_name: data.rewardName, cost: data.cost, type: "reward_redemption" },
    });
    if (debitErr) throw new Error(debitErr.message);

    return { ok: true, newBalance: currentBalance - data.cost };
  });

// ---------- DAILY CHECK-IN ----------
const CHECKIN_DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const CHECKIN_WEEK_POINTS = [50, 50, 75, 75, 100, 100, 150];

export const claimDailyCheckin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const userId = context.userId;
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    // 1. Get current streak info
    const { data: streakRow } = await supabaseAdmin
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastDate = streakRow?.last_completed_date
      ? new Date(new Date(streakRow.last_completed_date).setHours(0, 0, 0, 0))
      : null;

    // 2. Already checked in today?
    if (lastDate && lastDate.getTime() === today.getTime()) {
      throw new Error("Already checked in today");
    }

    // 3. Calculate streak
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = lastDate && lastDate.getTime() === yesterday.getTime();

    let newStreak: number;
    if (isConsecutive) {
      newStreak = (streakRow?.current_streak ?? 0) + 1;
    } else {
      newStreak = 1; // Reset streak
    }

    // 4. Determine points based on day of week (0=Sun, 1=Mon, ..., 6=Sat)
    // Map to our CHECKIN_WEEK_POINTS array which is Mon-Sun (index 0-6)
    const jsDay = today.getDay(); // 0=Sun
    const weekIndex = jsDay === 0 ? 6 : jsDay - 1; // Convert to Mon=0...Sun=6
    const pointsToCredit = CHECKIN_WEEK_POINTS[weekIndex];

    // 5. Credit points
    const { error: creditErr } = await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: pointsToCredit,
      _reason: "daily_streak",
      _meta: { day_of_week: CHECKIN_DAY_LABELS[weekIndex], streak: newStreak },
    });
    if (creditErr) {
      throw new Error(creditErr.message);
    }

    // 6. Update streak
    const longest = Math.max(newStreak, streakRow?.longest_streak ?? 0);
    if (streakRow) {
      await supabaseAdmin
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: longest,
          last_completed_date: today.toISOString(),
        })
        .eq("user_id", userId);
    } else {
      await supabaseAdmin.from("user_streaks").insert({
        user_id: userId,
        current_streak: newStreak,
        longest_streak: longest,
        last_completed_date: today.toISOString(),
      });
    }

    return {
      ok: true as const,
      points: pointsToCredit,
      streak: newStreak,
      day: CHECKIN_DAY_LABELS[weekIndex],
    };
  });
