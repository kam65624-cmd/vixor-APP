import { defineEventHandler, getMethod, getHeader, readBody, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";

// ============================================================================
// Telegram Stars Payment Webhook
// ============================================================================
//
// POST /api/stars-webhook
//
// Handles Telegram Bot API Stars payment updates delivered via webhook:
//   1. `pre_checkout_query` → auto-approve (answer "ok")
//   2. `successful_payment` → credit user (pack purchase or premium subscription)
//
// Security: verifies X-Telegram-Bot-Api-Secret-Token header.
// ============================================================================

type SuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  subscription_expiration_date?: string;
  is_recurring?: boolean;
  telegram_payment_charge_id: string;
  provider_payment_charge_id?: string;
};

type PreCheckoutQuery = {
  id: string;
  from: { id: number; is_bot: boolean; first_name: string };
  currency: string;
  total_amount: number;
  invoice_payload: string;
  shipping_option_id?: string;
  order_info?: Record<string, any>;
};

/**
 * Answer a Telegram pre-checkout query with "ok" (approve).
 * Stars payments are always auto-approved since the invoice was
 * created server-side with known prices.
 */
async function answerPreCheckout(queryId: string): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) {
    throw new Error("TELEGRAM_BOT_TOKEN not configured");
  }

  const res = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pre_checkout_query_id: queryId,
      ok: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`[Stars Webhook] answerPreCheckoutQuery failed: ${res.status} ${text}`);
    throw new Error(`Failed to answer pre-checkout: ${res.status}`);
  }
}

/**
 * Credit a point pack purchase to the user.
 * Payload format: "pack:{userId}:{packId}"
 */
async function creditPackPurchase(userId: string, packId: string, chargeId: string): Promise<void> {
  // Fetch pack details
  const { data: pack, error } = await supabaseAdmin
    .from("point_packs")
    .select("*")
    .eq("id", packId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !pack) {
    console.error(`[Stars Webhook] Pack not found: ${packId}`, error);
    return;
  }

  const total = pack.points + (pack.bonus_points ?? 0);

  const { error: rpcError } = await supabaseAdmin.rpc("credit_points", {
    _user: userId,
    _amount: total,
    _reason: "pack_purchase_stars" as any,
    _meta: {
      pack_id: packId,
      telegram_charge_id: chargeId,
      payment_method: "stars",
    },
  });

  if (rpcError) {
    console.error(`[Stars Webhook] credit_points failed for user ${userId}:`, rpcError);
  } else {
    console.log(`[Stars Webhook] Credited ${total} points to ${userId} for pack ${packId}`);
  }
}

/**
 * Activate a premium subscription for the user.
 * Payload format: "premium:{userId}:{planId}"
 */
async function creditPremiumSubscription(
  userId: string,
  planId: string,
  chargeId: string,
  subscriptionExpirationDate?: number,
): Promise<void> {
  // Fetch plan details
  const { data: plan, error } = await supabaseAdmin
    .from("premium_plans")
    .select("*")
    .eq("id", planId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !plan) {
    console.error(`[Stars Webhook] Premium plan not found: ${planId}`, error);
    return;
  }

  // Use Telegram's subscription expiration date if provided, otherwise compute
  const periodEnd = subscriptionExpirationDate
    ? new Date(subscriptionExpirationDate * 1000).toISOString()
    : new Date(Date.now() + (plan.interval === "year" ? 365 : 30) * 86400 * 1000).toISOString();

  // Upsert subscription (set active)
  const { error: insertError } = await supabaseAdmin.from("premium_subscriptions").upsert(
    {
      user_id: userId,
      plan_id: planId,
      status: "active",
      current_period_end: periodEnd,
    },
    { onConflict: "user_id" },
  );

  if (insertError) {
    console.error(`[Stars Webhook] Failed to activate premium for ${userId}:`, insertError);
  } else {
    console.log(`[Stars Webhook] Activated premium (${planId}) for ${userId} until ${periodEnd}`);
  }
}

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // ── SECURITY: Verify Telegram webhook secret token ──
  const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (telegramSecret) {
    const receivedSecret = getHeader(event, "x-telegram-bot-api-secret-token");
    if (receivedSecret !== telegramSecret) {
      console.warn("[Stars Webhook] Rejected: invalid secret token");
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else {
    if (process.env.NODE_ENV === "production") {
      console.error("[Stars Webhook] CRITICAL: TELEGRAM_WEBHOOK_SECRET not set in production!");
      throw createError({ statusCode: 500, statusMessage: "Webhook not configured" });
    }
    console.warn("[Stars Webhook] WARNING: No TELEGRAM_WEBHOOK_SECRET set (development only)");
  }

  try {
    const body = (await readBody(event)) as Record<string, any>;

    // ── 1. Handle pre_checkout_query → auto-approve ──
    if (body.pre_checkout_query) {
      const query = body.pre_checkout_query as PreCheckoutQuery;
      console.log(
        `[Stars Webhook] pre_checkout_query from user ${query.from?.id}, ` +
          `payload=${query.invoice_payload}, amount=${query.total_amount} ${query.currency}`,
      );
      await answerPreCheckout(query.id);
      return "OK";
    }

    // ── 2. Handle successful_payment → credit the user ──
    if (body.message?.successful_payment) {
      const payment = body.message.successful_payment as SuccessfulPayment;
      const payload = payment.invoice_payload;
      const chargeId = payment.telegram_payment_charge_id;

      console.log(
        `[Stars Webhook] successful_payment: payload=${payload}, ` +
          `charge=${chargeId}, amount=${payment.total_amount} ${payment.currency}`,
      );

      if (!payload) {
        console.error("[Stars Webhook] Missing invoice_payload, skipping");
        return "OK";
      }

      // Parse payload: "type:userId:resourceId" or fallback "userId_resourceId"
      const segments = payload.split(":");
      if (segments.length === 3) {
        const [type, userId, resourceId] = segments;

        if (type === "pack") {
          await creditPackPurchase(userId, resourceId, chargeId);
        } else if (type === "premium") {
          await creditPremiumSubscription(
            userId,
            resourceId,
            chargeId,
            payment.subscription_expiration_date,
          );
        } else {
          console.warn(`[Stars Webhook] Unknown payload type: ${type}`);
        }
      } else if (segments.length === 2) {
        // Legacy format: "userId_packId"
        const [userId, resourceId] = segments;
        await creditPackPurchase(userId, resourceId, chargeId);
      } else {
        console.warn(`[Stars Webhook] Unrecognized payload format: ${payload}`);
      }

      return "OK";
    }

    return "Event ignored";
  } catch (error) {
    console.error("[Stars Webhook] Error processing update:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
