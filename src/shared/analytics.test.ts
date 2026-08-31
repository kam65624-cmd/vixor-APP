import { describe, it, expect } from "vitest";

// Test that analytics module exports exist and are callable
// (actual Mixpanel tracking is mocked in test env)

describe("analytics module", () => {
  it("exports trackEvent function", async () => {
    const mod = await import("./analytics");
    expect(typeof mod.trackEvent).toBe("function");
  });

  it("exports identifyUser function", async () => {
    const mod = await import("./analytics");
    expect(typeof mod.identifyUser).toBe("function");
  });
});
