import { describe, expect, it } from "vitest";
import { rejectUnverifiedPremiumActivation } from "./premium-activation";

describe("premium activation security", () => {
  it("rejects direct activation when no verified payment is provided", () => {
    expect(() => rejectUnverifiedPremiumActivation()).toThrow(
      "Premium activation requires a verified payment. Direct activation is disabled.",
    );
  });
});
