import { defineEventHandler, getMethod, readBody, createError } from "h3";
import { supabaseAdmin } from "@/shared/supabase/client.server";

export default defineEventHandler(async (event) => {
  const method = getMethod(event);

  if (method !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  try {
    const body = (await readBody(event)) as Record<string, any>;

    // 1. Handle pre_checkout_query (Telegram asks if we are ready to proceed with payment)
    if (body.pre_checkout_query) {
      const queryId = body.pre_checkout_query.id as string;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;

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

      return "OK";
    }

    return "Event ignored";
  } catch (error) {
    console.error("Telegram webhook error:", error);
    throw createError({ statusCode: 500, statusMessage: "Internal server error" });
  }
});
