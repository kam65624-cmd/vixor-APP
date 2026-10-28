import { describe, expect, it } from "vitest";
import { isConfirmedPaymentForPurchase } from "./payment-verification";

const confirmedPackPayment = {
  status: "confirmed",
  user_id: "user-a",
  pack_id: "pack-a",
  plan_id: null,
};

describe("confirmed Stars payment binding", () => {
  it("accepts only the confirmed charge for the same user and pack", () => {
    expect(isConfirmedPaymentForPurchase(confirmedPackPayment, "user-a", { kind: "pack", id: "pack-a" })).toBe(true);
  });

  it("rejects a charge confirmed for another user", () => {
    expect(isConfirmedPaymentForPurchase(confirmedPackPayment, "user-b", { kind: "pack", id: "pack-a" })).toBe(false);
  });

  it("rejects reusing a pack charge for another pack", () => {
    expect(isConfirmedPaymentForPurchase(confirmedPackPayment, "user-a", { kind: "pack", id: "pack-b" })).toBe(false);
  });

  it("rejects reusing a pack charge to grant premium", () => {
    expect(isConfirmedPaymentForPurchase(confirmedPackPayment, "user-a", { kind: "premium", id: "pro-monthly" })).toBe(false);
  });

  it("rejects pending payments", () => {
    expect(isConfirmedPaymentForPurchase({ ...confirmedPackPayment, status: "pending" }, "user-a", { kind: "pack", id: "pack-a" })).toBe(false);
  });
});
