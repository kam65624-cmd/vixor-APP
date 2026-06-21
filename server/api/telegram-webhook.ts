import { defineEventHandler, getMethod, readBody, getHeader, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";

// Rate limiting is handled by server/middleware/rate-limit.ts

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  // SECURITY: Verify Telegram webhook secret token
  const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (telegramSecret) {
    const receivedSecret = getHeader(event, "x-telegram-bot-api-secret-token");
    if (receivedSecret !== telegramSecret) {
      console.warn("[Telegram Webhook] Rejected: invalid secret token");
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else {
    // SECURITY: Reject all requests when webhook secret is not configured
    // Use VIXOR_ALLOW_NO_AUTH=true explicitly for local development
    const allowNoAuth = process.env.VIXOR_ALLOW_NO_AUTH === "true";
    if (!allowNoAuth) {
      console.error(
        "[Telegram Webhook] TELEGRAM_WEBHOOK_SECRET not set and VIXOR_ALLOW_NO_AUTH is not true. Rejecting request.",
      );
      throw createError({ statusCode: 500, statusMessage: "Webhook not configured" });
    }
    console.warn(
      "[Telegram Webhook] WARNING: Running without webhook secret (VIXOR_ALLOW_NO_AUTH=true)",
    );
  }

  try {
    const body = (await readBody(event)) as Record<string, any>;

    // 1. Handle pre_checkout_query
    if (body.pre_checkout_query) {
      const queryId = body.pre_checkout_query.id as string;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      if (!botToken) {
        console.error("[Telegram Webhook] TELEGRAM_BOT_TOKEN not set");
        return "Bot not configured";
      }

      await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pre_checkout_query_id: queryId,
          ok: true,
        }),
      });

      return "OK";
    }

    // 2. Handle successful_payment
    if (body.message && body.message.successful_payment) {
      const payment = body.message.successful_payment as Record<string, any>;
      const payload = payment.invoice_payload as string;
      const chargeId = payment.provider_payment_charge_id as string;

      if (payload) {
        // Parse payload: userId_packId_timestamp
        const parts = payload.split("_");
        const userId = parts[0];
        const packId = parts[1];

        // Update the payment record to confirmed
        if (chargeId) {
          // SECURITY: Only update + credit if payment was pending (idempotency guard)
          const { data: updatedPayment, error: updateError } = await supabaseAdmin
            .from("payments")
            .update({
              telegram_charge_id: chargeId,
              status: "confirmed",
              confirmed_at: new Date().toISOString(),
            })
            .eq("payload", payload)
            .eq("status", "pending")
            .select("id")
            .maybeSingle();

          if (updateError || !updatedPayment) {
            // Payment already confirmed or not found — skip silently (idempotent)
            return "OK";
          }
        }

        const { data: pack } = await supabaseAdmin
          .from("point_packs")
          .select("*")
          .eq("id", packId)
          .single();

        if (pack) {
          const totalPoints = pack.points + (pack.bonus_points || 0);

          await supabaseAdmin.rpc("credit_points", {
            _user: userId,
            _amount: totalPoints,
            _reason: "telegram_stars_purchase" as const,
            _meta: { pack_id: packId, telegram_payment: chargeId },
          });
        }
      }

      return "OK";
    }

    return "Event ignored";
  } catch (error) {
    console.error("Telegram webhook error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
