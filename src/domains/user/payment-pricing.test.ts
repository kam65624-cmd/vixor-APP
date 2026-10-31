import { describe, expect, it } from "vitest";
import { isPackFree } from "./payment-pricing";

describe("isPackFree", () => {
  it("treats an unpriced zero-cost pack as free", () => {
    expect(isPackFree({ price_cents: 0, stars_price: null })).toBe(true);
  });

  it("does not treat a Stars-priced pack as free when fiat price is zero", () => {
    expect(isPackFree({ price_cents: 0, stars_price: 50 })).toBe(false);
  });

  it("does not treat a fiat-priced pack as free without a Stars price", () => {
    expect(isPackFree({ price_cents: 499, stars_price: null })).toBe(false);
  });

  it("does not treat invalid negative prices as free", () => {
    expect(isPackFree({ price_cents: -1, stars_price: 0 })).toBe(false);
  });
});
