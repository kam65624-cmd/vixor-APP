import { defineEventHandler, getMethod, readBody, getHeader, createError } from "h3";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight } from "./_security";
import { isWebhookSecretBypassAllowed } from "@/shared/security/api-auth";
import { answerStarsPreCheckout, fulfillStarsPayment } from "../utils/stars-payments";

type PreCheckoutQuery = {
  id: string;
  currency: string;
  total_amount: number;
  invoice_payload: string;
};

type SuccessfulPayment = {
  currency: string;
  total_amount: number;
  invoice_payload: string;
  subscription_expiration_date?: number;
  telegram_payment_charge_id: string;
};

const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;
  if (getMethod(event) !== "POST") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const telegramSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (telegramSecret) {
    if (getHeader(event, "x-telegram-bot-api-secret-token") !== telegramSecret) {
      throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
    }
  } else {
    const allowNoAuth = isWebhookSecretBypassAllowed(
      process.env.NODE_ENV,
      process.env.VIXOR_ALLOW_NO_AUTH === "true",
    );
    if (!allowNoAuth) {
      throw createError({ statusCode: 500, statusMessage: "Webhook not configured" });
    }
  }

  try {
    const body = (await readBody(event)) as Record<string, unknown>;
    if (body.pre_checkout_query && typeof body.pre_checkout_query === "object") {
      await answerStarsPreCheckout(body.pre_checkout_query as PreCheckoutQuery);
      return "OK";
    }

    const message = body.message as { successful_payment?: SuccessfulPayment } | undefined;
    if (message?.successful_payment) {
      await fulfillStarsPayment(message.successful_payment);
      return "OK";
    }

    return "Event ignored";
  } catch {
    console.error("[Telegram Webhook] Payment processing failed; returning retryable error.");
    throw createError({ statusCode: 500, statusMessage: "Payment processing failed" });
  }
});

export default withRateLimit(handler, { webhook: true });
