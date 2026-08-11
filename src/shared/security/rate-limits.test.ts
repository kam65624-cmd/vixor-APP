// ============================================================================
// VIXOR Security — Rate Limits Tests
// ============================================================================

import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimit, RATE_LIMITS } from "./rate-limits";

beforeEach(() => {
  resetRateLimit();
});

describe("RATE_LIMITS config", () => {
  it("1. has all expected endpoints", () => {
    const expected = [
      "askMoxi",
      "createAnalysis",
      "scanOpportunities",
      "createSignalTracking",
      "requestSignalTransition",
      "health",
      "webhook",
      "global",
    ];
    for (const key of expected) {
      expect(RATE_LIMITS[key]).toBeDefined();
      expect(RATE_LIMITS[key].windowMs).toBeGreaterThan(0);
      expect(RATE_LIMITS[key].maxRequests).toBeGreaterThan(0);
    }
  });

  it("2. global limit is higher than individual limits", () => {
    expect(RATE_LIMITS.global.maxRequests).toBeGreaterThan(RATE_LIMITS.askMoxi.maxRequests);
    expect(RATE_LIMITS.global.maxRequests).toBeGreaterThan(RATE_LIMITS.webhook.maxRequests);
  });
});

describe("checkRateLimit", () => {
  it("3. allows first request", async () => {
    const result = await checkRateLimit("user-1", RATE_LIMITS.askMoxi);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(RATE_LIMITS.askMoxi.maxRequests - 1);
  });

  it("4. allows requests up to limit", async () => {
    for (let i = 0; i < RATE_LIMITS.health.maxRequests; i++) {
      const result = await checkRateLimit("health-client", RATE_LIMITS.health);
      expect(result.allowed).toBe(true);
    }
  });

  it("5. rejects requests over limit", async () => {
    for (let i = 0; i < RATE_LIMITS.health.maxRequests; i++) {
      await checkRateLimit("limited-user", RATE_LIMITS.health);
    }
    const result = await checkRateLimit("limited-user", RATE_LIMITS.health);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("6. tracks keys independently", async () => {
    const r1 = await checkRateLimit("user-a", RATE_LIMITS.global);
    const r2 = await checkRateLimit("user-b", RATE_LIMITS.global);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r1.remaining).toBe(r2.remaining);
  });

  it("7. remaining decrements correctly", async () => {
    const config = { windowMs: 60_000, maxRequests: 3 };
    const r0 = await checkRateLimit("decrement-test", config);
    const r1 = await checkRateLimit("decrement-test", config);
    const r2 = await checkRateLimit("decrement-test", config);
    expect(r0.remaining).toBe(2);
    expect(r1.remaining).toBe(1);
    expect(r2.remaining).toBe(0);
  });

  it("8. resetRateLimit clears a specific key", async () => {
    for (let i = 0; i < RATE_LIMITS.health.maxRequests; i++) {
      await checkRateLimit("reset-user", RATE_LIMITS.health);
    }
    resetRateLimit("reset-user");
    const result = await checkRateLimit("reset-user", RATE_LIMITS.health);
    expect(result.allowed).toBe(true);
  });

  it("9. resetRateLimit clears all keys when no arg", async () => {
    await checkRateLimit("user-x", RATE_LIMITS.health);
    await checkRateLimit("user-y", RATE_LIMITS.health);
    resetRateLimit();
    const r1 = await checkRateLimit("user-x", RATE_LIMITS.health);
    const r2 = await checkRateLimit("user-y", RATE_LIMITS.health);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });
});
