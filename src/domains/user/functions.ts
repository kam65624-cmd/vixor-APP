// ============================================================================
// User Domain — Server Functions
// ============================================================================
//
// User profile, commerce, notifications, referrals, and Telegram integration.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { structuredLogger } from "@/shared/structured-logger";

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
  expectedPayload: string,
): Promise<boolean> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    // ── Method 1: Database lookup (webhook-confirmed payments) ──
    // Check if this chargeId was confirmed by the Telegram webhook
    const { data: confirmedPayment } = await supabaseAdmin
      .from("payments")
      .select("id, payload, status")
      .eq("telegram_charge_id", chargeId)
      .eq("status", "confirmed")
      .maybeSingle();

    if (confirmedPayment && confirmedPayment.payload === expectedPayload) {
      return true;
    }

    // ── Method 2: Telegram Bot API verification (fallback) ──
    // Use checkTransaction to verify with Telegram directly
    // @ts-expect-error Telegram Bot API endpoint
    const res = await fetch(`https://api.telegram.org/bot${botToken}/checkTransaction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        charge_id: chargeId,
      }),
    });

    if (res.ok) {
      const result = await res.json();
      // checkTransaction returns { ok: true, result: { ... } } if valid
      if (result.ok && result.result) {
        // Verify the payload from the transaction matches what we expected
        if (result.result.invoice_payload === expectedPayload) {
          return true;
        }
      }
    }

    return false;
  } catch {
    structuredLogger("payment", {
      level: "error",
      kind: "verification_failed",
      chargeId,
      expectedPayload,
    });
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
      const expectedPayload = `${userId}_${data.packId}`;
      const verified = await verifyStarsPayment(botToken, data.telegramChargeId, expectedPayload);
      if (!verified) {
        throw new Error("Payment verification failed: charge could not be confirmed");
      }
    } else if (!isFree) {
      throw new Error("Payment required: this pack is not free");
    }
    // Free packs or verified payments proceed to credit.

    const total = pack.points + (pack.bonus_points ?? 0);
    const { error } = await supabaseAdmin.rpc("credit_points", {
      _user: userId,
      _amount: total,
      _reason: data.paymentMethod === "stars" ? "pack_purchase_stars" : "pack_purchase_free",
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
      const expectedPayload = `${userId}_${data.planId}`;
      const verified = await verifyStarsPayment(botToken, data.telegramChargeId, expectedPayload);
      if (!verified) {
        throw new Error("Payment verification failed: charge could not be confirmed");
      }
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
    const username = user.username || user.first_name || "Trader";

    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        telegram_id: String(user.id) as any,
        telegram_username: username,
        telegram_photo_url: photoUrl,
      })
      .eq("id", userId);

    if (error) throw new Error("Failed to link Telegram account");

    return { ok: true, telegram_username: username, telegram_photo_url: photoUrl };
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
