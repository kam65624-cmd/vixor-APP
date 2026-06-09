import { createAPIFileRoute } from "@tanstack/react-start/api";
import { supabaseAdmin } from "@/shared/supabase/client.server";

export const APIRoute = createAPIFileRoute("/api/telegram-webhook")({
  POST: async ({ request }) => {
    try {
      const body = await request.json();

      if (body.pre_checkout_query) {
        const queryId = body.pre_checkout_query.id;
        const botToken = process.env.TELEGRAM_BOT_TOKEN;

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

      if (body.message && body.message.successful_payment) {
        const payment = body.message.successful_payment;
        const payload = payment.invoice_payload;

        if (payload) {
          const [userId, packId] = payload.split("_");

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
