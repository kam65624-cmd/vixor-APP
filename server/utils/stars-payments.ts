import { supabaseAdmin } from "@/shared/supabase/client.server";

export type StarsOrderCheck = {
  ok: boolean;
  errorMessage?: string;
};

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
  telegram_payment_charge_id: string;
  subscription_expiration_date?: number;
};

function validPayload(payload: unknown): payload is string {
  return typeof payload === "string" && payload.length >= 8 && payload.length <= 512;
}

/** Validate against a server-created pending order; never trust a user id/resource from the payload. */
export async function validateStarsOrder(
  payload: unknown,
  currency: unknown,
  amount: unknown,
): Promise<StarsOrderCheck> {
  if (
    !validPayload(payload) ||
    currency !== "XTR" ||
    !Number.isSafeInteger(amount) ||
    (amount as number) <= 0
  ) {
    return { ok: false, errorMessage: "Invalid payment details." };
  }

  const { data: order, error } = await supabaseAdmin
    .from("payments")
    .select("id, amount_stars, status, pack_id, plan_id")
    .eq("payload", payload)
    .eq("status", "pending")
    .maybeSingle();

  if (error || !order) return { ok: false, errorMessage: "Order not found or no longer pending." };
  if (order.amount_stars == null || order.amount_stars !== amount) {
    return { ok: false, errorMessage: "Payment amount does not match the order." };
  }
  if ((order.pack_id == null) === (order.plan_id == null)) {
    return { ok: false, errorMessage: "Invalid order configuration." };
  }

  return { ok: true };
}

/** Atomically confirms the payment and grants its purchased entitlement in PostgreSQL. */
export async function fulfillStarsPayment(
  payment: SuccessfulPayment,
): Promise<"confirmed" | "duplicate"> {
  if (
    !validPayload(payment.invoice_payload) ||
    payment.currency !== "XTR" ||
    !Number.isSafeInteger(payment.total_amount) ||
    payment.total_amount <= 0 ||
    typeof payment.telegram_payment_charge_id !== "string" ||
    payment.telegram_payment_charge_id.length === 0
  ) {
    throw new Error("Invalid Telegram Stars successful_payment fields");
  }

  const { data, error } = await supabaseAdmin.rpc("process_telegram_stars_payment", {
    _payload: payment.invoice_payload,
    _charge_id: payment.telegram_payment_charge_id,
    _currency: payment.currency,
    _amount: payment.total_amount,
    _subscription_expiration: payment.subscription_expiration_date ?? null,
  });

  if (error) {
    // Do not acknowledge a payment that was not atomically fulfilled; Telegram may retry.
    throw new Error("Atomic Stars fulfillment failed");
  }

  const result = data as { status?: unknown } | null;
  if (result?.status === "confirmed") return "confirmed";
  if (result?.status === "duplicate") return "duplicate";
  throw new Error("Atomic Stars fulfillment returned an unexpected result");
}

export async function answerStarsPreCheckout(query: PreCheckoutQuery): Promise<void> {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN not configured");

  let validation: StarsOrderCheck;
  try {
    validation = await validateStarsOrder(
      query.invoice_payload,
      query.currency,
      query.total_amount,
    );
  } catch {
    validation = { ok: false, errorMessage: "Payment validation is temporarily unavailable." };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/answerPreCheckoutQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pre_checkout_query_id: query.id,
      ok: validation.ok,
      ...(!validation.ok
        ? { error_message: validation.errorMessage ?? "Payment could not be verified." }
        : {}),
    }),
  });

  if (!response.ok) throw new Error("Telegram pre-checkout response failed");
  const result = (await response.json()) as { ok?: boolean };
  if (result.ok !== true) throw new Error("Telegram rejected pre-checkout response");
}
