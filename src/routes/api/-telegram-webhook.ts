import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/shared/supabase/client.server";

export const APIRoute = createAPIFileRoute("/api/telegram-webhook")({
  POST: async ({ request }) => {
    // SECURITY: Verify Telegram webhook secret token
    const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (telegramSecret) {
      const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
      if (receivedSecret !== telegramSecret) {
        console.warn("[Telegram Webhook] Rejected: invalid secret token");
        return new Response("Unauthorized", { status: 401 });
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        console.error("[Telegram Webhook] CRITICAL: TELEGRAM_WEBHOOK_SECRET not set in production!");
        return new Response("Webhook not configured", { status: 500 });
      }
      console.warn("[Telegram Webhook] WARNING: No TELEGRAM_WEBHOOK_SECRET set (development only)");
    }

    try {
      const body = await request.json();

      // 1. Handle pre_checkout_query (Telegram asks if we are ready to proceed with payment)
      if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

        // Answer the pre_checkout_query with ok: true
        await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pre_checkout_query_id: queryId,
            ok: true,
          }),
        });

        return new Response("OK");
      }

      // 2. Handle successful_payment
      if (body.message && body.message.successful_payment) {
        const payment = body.message.successful_payment;
        const payload = payment.invoice_payload; // "userId_packId_timestamp"

        if (payload) {
          const [userId, packId] = payload.split("_");

          // Fetch the pack to know how many points to credit
          const { data: pack } = await supabaseAdmin
            .from("point_packs")
            .select("*")
            .eq("id", packId)
            .single();

          if (pack) {
            const totalPoints = pack.points + (pack.bonus_points || 0);

            // Credit points via RPC
            await supabaseAdmin.rpc("credit_points", {
              _user: userId,
              _amount: totalPoints,
              _reason: "pack_purchase" as any,
              _meta: { pack_id: packId, telegram_payment: payment.provider_payment_charge_id },
            });
          }
        }
        return new Response("OK");
      }

      return new Response("Event ignored");
    } catch (error) {
      console.error("Telegram webhook error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
});
