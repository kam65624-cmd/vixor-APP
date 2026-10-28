import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/supabase/client.server", () => ({
  supabaseAdmin: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabaseAdmin } from "@/shared/supabase/client.server";
import { answerStarsPreCheckout, fulfillStarsPayment, validateStarsOrder } from "./stars-payments";

const admin = supabaseAdmin as unknown as {
  from: ReturnType<typeof vi.fn>;
  rpc: ReturnType<typeof vi.fn>;
};

describe("Telegram Stars payment contract", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects currency and amount values that do not match the Stars contract", async () => {
    expect(await validateStarsOrder("order-payload-123", "USD", 100)).toEqual({
      ok: false,
      errorMessage: "Invalid payment details.",
    });
    expect(await validateStarsOrder("order-payload-123", "XTR", 0)).toEqual({
      ok: false,
      errorMessage: "Invalid payment details.",
    });
    expect(admin.from).not.toHaveBeenCalled();
  });

  it("rejects missing, non-pending, or amount-mismatched orders before pre-checkout approval", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: {
        id: "order-id",
        amount_stars: 50,
        status: "pending",
        pack_id: "pack-id",
        plan_id: null,
      },
      error: null,
    });
    const query = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle,
    };
    admin.from.mockReturnValue(query);

    expect(await validateStarsOrder("order-payload-123", "XTR", 49)).toEqual({
      ok: false,
      errorMessage: "Payment amount does not match the order.",
    });
    expect(admin.from).toHaveBeenCalledWith("payments");
    expect(query.eq).toHaveBeenCalledWith("status", "pending");
  });

  it("never treats a database fulfillment error as success", async () => {
    admin.rpc.mockResolvedValue({ data: null, error: { message: "database unavailable" } });
    await expect(
      fulfillStarsPayment({
        currency: "XTR",
        total_amount: 50,
        invoice_payload: "order-payload-123",
        telegram_payment_charge_id: "charge-123",
      }),
    ).rejects.toThrow("Atomic Stars fulfillment failed");
  });

  it("returns duplicate only when the atomic database RPC reports a duplicate", async () => {
    admin.rpc.mockResolvedValue({ data: { status: "duplicate" }, error: null });
    await expect(
      fulfillStarsPayment({
        currency: "XTR",
        total_amount: 50,
        invoice_payload: "order-payload-123",
        telegram_payment_charge_id: "charge-123",
      }),
    ).resolves.toBe("duplicate");
    expect(admin.rpc).toHaveBeenCalledWith("process_telegram_stars_payment", {
      _payload: "order-payload-123",
      _charge_id: "charge-123",
      _currency: "XTR",
      _amount: 50,
      _subscription_expiration: null,
    });
  });

  it("rejects pre-checkout when no bot token is configured", async () => {
    const oldToken = process.env.TELEGRAM_BOT_TOKEN;
    delete process.env.TELEGRAM_BOT_TOKEN;
    await expect(
      answerStarsPreCheckout({
        id: "query-1",
        currency: "XTR",
        total_amount: 50,
        invoice_payload: "order-payload-123",
      }),
    ).rejects.toThrow("TELEGRAM_BOT_TOKEN not configured");
    if (oldToken) process.env.TELEGRAM_BOT_TOKEN = oldToken;
  });
});
