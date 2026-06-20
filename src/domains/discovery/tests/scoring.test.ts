/**
 * @module domains/discovery/tests/scoring
 * @description Unit tests for the 5-stage discovery scoring algorithm.
 */

import { describe, it, expect } from "vitest";
import {
  stage1_filterNewPairs,
  stage2_liquidityFilter,
  stage3_smartMoneyScore,
  stage4_socialVelocityScore,
  stage5_combinedScore,
  calculateLiquidityScore,
  calculateAgeScore,
  classifyRisk,
  determineNftBadge,
  runDiscoveryPipeline,
} from "../scoring";
import type { RawTokenData } from "../types";

// ── Test Data ────────────────────────────────────────────────────────────────

function makeRawToken(overrides: Partial<RawTokenData> = {}): RawTokenData {
  return {
    address: "So11111111111111111111111111111111111111112",
    symbol: "TEST",
    name: "Test Token",
    price: 0.001,
    change24h: 10,
    volume24h: 50_000,
    liquidity: 100_000,
    marketCap: 1_000_000,
    chain: "solana",
    createdAt: Date.now() - 3600_000, // 1 hour ago
    ...overrides,
  };
}

// ── Stage 1: Filter New Pairs ──────────────────────────────────────────────────

describe("stage1_filterNewPairs", () => {
  it("filters out tokens with missing address", () => {
    const tokens = [makeRawToken({ address: "" }), makeRawToken()];
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(1);
  });

  it("filters out tokens with short address (< 10 chars)", () => {
    const tokens = [makeRawToken({ address: "abc" }), makeRawToken()];
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(1);
  });

  it("filters out tokens with empty symbol", () => {
    const tokens = [makeRawToken({ symbol: "" }), makeRawToken()];
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(1);
  });

  it("filters out tokens with negative price", () => {
    const tokens = [makeRawToken({ price: -1 }), makeRawToken()];
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(1);
  });

  it("filters out tokens without chain", () => {
    const tokens = [
      makeRawToken({ chain: undefined as unknown as RawTokenData["chain"] }),
      makeRawToken(),
    ];
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(1);
  });

  it("keeps all valid tokens", () => {
    const tokens = Array.from({ length: 5 }, () => makeRawToken());
    const result = stage1_filterNewPairs(tokens);
    expect(result).toHaveLength(5);
  });

  it("returns empty array for empty input", () => {
    expect(stage1_filterNewPairs([])).toHaveLength(0);
  });
});

// ── Stage 2: Liquidity Filter ────────────────────────────────────────────────

describe("stage2_liquidityFilter", () => {
  it("filters out tokens below minimum liquidity", () => {
    const tokens = [
      makeRawToken({ liquidity: 5_000 }), // below default $10K
      makeRawToken({ liquidity: 15_000 }), // above
    ];
    const result = stage2_liquidityFilter(tokens);
    expect(result).toHaveLength(1);
    expect(result[0].liquidity).toBe(15_000);
  });

  it("filters out tokens below minimum volume", () => {
    const tokens = [
      makeRawToken({ liquidity: 20_000, volume24h: 500 }), // below $1K volume
      makeRawToken({ liquidity: 20_000, volume24h: 5_000 }),
    ];
    const result = stage2_liquidityFilter(tokens);
    expect(result).toHaveLength(1);
  });

  it("respects custom thresholds", () => {
    const tokens = [
      makeRawToken({ liquidity: 1_000 }),
      makeRawToken({ liquidity: 50_000 }),
    ];
    const result = stage2_liquidityFilter(tokens, { minLiquidity: 500 });
    expect(result).toHaveLength(2);
  });

  it("returns empty for all-below-threshold", () => {
    const tokens = [
      makeRawToken({ liquidity: 100, volume24h: 50 }),
    ];
    const result = stage2_liquidityFilter(tokens);
    expect(result).toHaveLength(0);
  });
});

// ── Stage 3: Smart Money Score ──────────────────────────────────────────────

describe("stage3_smartMoneyScore", () => {
  it("returns baseline score when no holders", () => {
    const score = stage3_smartMoneyScore(0);
    expect(score).toBe(30); // SCORING.noDataSmartMoney
  });

  it("returns higher score for more holders", () => {
    const score1 = stage3_smartMoneyScore(1);
    const score10 = stage3_smartMoneyScore(10);
    const score100 = stage3_smartMoneyScore(100);
    expect(score10).toBeGreaterThan(score1);
    expect(score100).toBeGreaterThan(score10);
  });

  it("never exceeds 100", () => {
    const score = stage3_smartMoneyScore(99999);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const score = stage3_smartMoneyScore(-1);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it("returns exactly 30 for negative input", () => {
    expect(stage3_smartMoneyScore(-5)).toBe(30);
  });
});

// ── Stage 4: Social Velocity Score ──────────────────────────────────────────

describe("stage4_socialVelocityScore", () => {
  it("returns baseline when no mentions", () => {
    const score = stage4_socialVelocityScore(0, 0);
    expect(score).toBe(25); // SCORING.noDataSocial
  });

  it("returns higher score for more mentions", () => {
    const low = stage4_socialVelocityScore(10, 0.5);
    const high = stage4_socialVelocityScore(1000, 0.5);
    expect(high).toBeGreaterThan(low);
  });

  it("positive sentiment boosts score", () => {
    const neutral = stage4_socialVelocityScore(100, 0);
    const positive = stage4_socialVelocityScore(100, 1);
    expect(positive).toBeGreaterThan(neutral);
  });

  it("negative sentiment reduces score", () => {
    const neutral = stage4_socialVelocityScore(100, 0);
    const negative = stage4_socialVelocityScore(100, -1);
    expect(negative).toBeLessThan(neutral);
  });

  it("never exceeds 100", () => {
    const score = stage4_socialVelocityScore(999999, 1);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never goes below 0", () => {
    const score = stage4_socialVelocityScore(999999, -1);
    expect(score).toBeGreaterThanOrEqual(0);
  });
});

// ── Stage 5: Combined Score ──────────────────────────────────────────────────

describe("stage5_combinedScore", () => {
  it("calculates weighted score with default weights", () => {
    // All 100s → 100
    const score = stage5_combinedScore(100, 100, 100, 100);
    expect(score).toBe(100);
  });

  it("calculates weighted score with all zeros", () => {
    const score = stage5_combinedScore(0, 0, 0, 0);
    expect(score).toBe(0);
  });

  it("smart money has highest weight (40%)", () => {
    const smOnly = stage5_combinedScore(100, 0, 0, 0);
    const socialOnly = stage5_combinedScore(0, 100, 0, 0);
    const liqOnly = stage5_combinedScore(0, 0, 100, 0);
    const ageOnly = stage5_combinedScore(0, 0, 0, 100);
    expect(smOnly).toBeGreaterThan(socialOnly);
    expect(smOnly).toBeGreaterThan(liqOnly);
    expect(smOnly).toBeGreaterThan(ageOnly);
  });

  it("normalizes weights that don't sum to 1", () => {
    const score = stage5_combinedScore(50, 50, 50, 50, {
      smartMoney: 2,
      social: 1,
      liquidity: 1,
      age: 0,
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("never exceeds 100", () => {
    const score = stage5_combinedScore(100, 100, 100, 100, {
      smartMoney: 0.5,
      social: 0.5,
      liquidity: 0,
      age: 0,
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── Liquidity Score ─────────────────────────────────────────────────────────

describe("calculateLiquidityScore", () => {
  it("returns 0 for zero liquidity", () => {
    expect(calculateLiquidityScore(0)).toBe(0);
  });

  it("returns higher score for more liquidity", () => {
    const low = calculateLiquidityScore(10_000);
    const high = calculateLiquidityScore(1_000_000);
    expect(high).toBeGreaterThan(low);
  });

  it("lock percentage boosts score", () => {
    const noLock = calculateLiquidityScore(100_000, 0);
    const fullLock = calculateLiquidityScore(100_000, 100);
    expect(fullLock).toBeGreaterThan(noLock);
  });

  it("high concentration penalizes score", () => {
    const normal = calculateLiquidityScore(100_000, 0, 50);
    const concentrated = calculateLiquidityScore(100_000, 0, 95);
    expect(normal).toBeGreaterThan(concentrated);
  });

  it("never exceeds 100", () => {
    const score = calculateLiquidityScore(999_999_999, 100, 0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

// ── Age Score ───────────────────────────────────────────────────────────────

describe("calculateAgeScore", () => {
  it("returns 100 for brand-new token", () => {
    const score = calculateAgeScore(Date.now());
    expect(score).toBe(100);
  });

  it("returns 0 for old token", () => {
    const oldDate = Date.now() - 73 * 3600_000; // 73 hours ago (past max 72h)
    const score = calculateAgeScore(oldDate);
    expect(score).toBe(0);
  });

  it("returns 50 for token at half max age", () => {
    const halfAge = Date.now() - 36 * 3600_000;
    const score = calculateAgeScore(halfAge, 72);
    expect(score).toBeCloseTo(50, -1); // ~50, allow rounding
  });

  it("respects custom maxAgeHours", () => {
    const score = calculateAgeScore(Date.now() - 2 * 3600_000, 1); // 2h old, max 1h
    expect(score).toBe(0);
  });

  it("handles ISO string input", () => {
    const score = calculateAgeScore(new Date().toISOString());
    expect(score).toBe(100);
  });

  it("handles invalid date gracefully", () => {
    const score = calculateAgeScore("invalid");
    expect(score).toBe(100); // treated as "old"
  });
});

// ── Risk Classification ──────────────────────────────────────────────────────

describe("classifyRisk", () => {
  it("returns 'high' for honeypot", () => {
    expect(classifyRisk(95, true)).toBe("high");
  });

  it("returns 'low' for high score", () => {
    expect(classifyRisk(80)).toBe("low");
  });

  it("returns 'medium' for medium score", () => {
    expect(classifyRisk(55)).toBe("medium");
  });

  it("returns 'high' for low score", () => {
    expect(classifyRisk(20)).toBe("high");
  });

  it("returns 'high' for edge case 39", () => {
    expect(classifyRisk(39)).toBe("high");
  });

  it("returns 'medium' for edge case 40", () => {
    expect(classifyRisk(40)).toBe("medium");
  });

  it("returns 'low' for edge case 70", () => {
    expect(classifyRisk(70)).toBe("low");
  });

  it("returns 'high' for high concentration + medium score", () => {
    expect(classifyRisk(50, false, 95)).toBe("high");
  });
});

// ── NFT Badge ───────────────────────────────────────────────────────────────

describe("determineNftBadge", () => {
  it("returns 'verified' when isVerified", () => {
    expect(determineNftBadge(true, true)).toBe("verified");
  });

  it("returns 'collection' when hasNft but not verified", () => {
    expect(determineNftBadge(true, false)).toBe("collection");
  });

  it("returns 'none' when no nft", () => {
    expect(determineNftBadge(false, false)).toBe("none");
  });

  it("returns 'verified' even when hasNft is false but isVerified is true", () => {
    expect(determineNftBadge(false, true)).toBe("verified");
  });
});

// ── Full Pipeline ────────────────────────────────────────────────────────────

describe("runDiscoveryPipeline", () => {
  it("runs full pipeline with empty maps", () => {
    const tokens = Array.from({ length: 3 }, () => makeRawToken());
    const result = runDiscoveryPipeline(tokens);
    expect(result).toHaveLength(3);
    // All should have scores
    for (const t of result) {
      expect(t.discoveryScore).toBeGreaterThanOrEqual(0);
      expect(t.discoveryScore).toBeLessThanOrEqual(100);
      expect(["low", "medium", "high"]).toContain(t.riskLevel);
      expect(["none", "nft", "collection", "verified"]).toContain(t.nftBadge);
    }
  });

  it("sorts by discovery score descending", () => {
    const tokens = [
      makeRawToken({ liquidity: 10_000, volume24h: 2_000 }),
      makeRawToken({ liquidity: 500_000, volume24h: 100_000 }),
      makeRawToken({ liquidity: 100_000, volume24h: 50_000 }),
    ];
    const result = runDiscoveryPipeline(tokens);
    expect(result[0].discoveryScore).toBeGreaterThanOrEqual(
      result[1].discoveryScore,
    );
    expect(result[1].discoveryScore).toBeGreaterThanOrEqual(
      result[2].discoveryScore,
    );
  });

  it("filters out tokens below liquidity threshold", () => {
    const tokens = [
      makeRawToken({ liquidity: 1_000, volume24h: 500 }), // should be filtered
      makeRawToken({ liquidity: 100_000, volume24h: 10_000 }),
    ];
    const result = runDiscoveryPipeline(tokens);
    expect(result).toHaveLength(1);
  });

  it("applies smart money data", () => {
    const smMap = new Map<string, number>();
    smMap.set("So11111111111111111111111111111111111111112", 10);

    const tokens = [makeRawToken()];
    const result = runDiscoveryPipeline(tokens, smMap);
    expect(result[0].smartMoneyHolders).toBe(10);
    expect(result[0].smartMoneyScore).toBeGreaterThan(30); // baseline
  });

  it("applies social data", () => {
    const socialMap = new Map<string, { mentions: number; sentiment: number }>();
    socialMap.set("TEST", { mentions: 500, sentiment: 0.8 });

    const tokens = [makeRawToken()];
    const result = runDiscoveryPipeline(tokens, new Map(), socialMap);
    expect(result[0].socialMentions).toBe(500);
    expect(result[0].socialScore).toBeGreaterThan(25); // baseline
  });

  it("marks honeypots as high risk", () => {
    const honeypotSet = new Set<string>();
    honeypotSet.add("So11111111111111111111111111111111111111112");

    const tokens = [makeRawToken({ liquidity: 500_000 })]; // high score normally
    const result = runDiscoveryPipeline(
      tokens,
      new Map(),
      new Map(),
      { honeypotSet },
    );
    expect(result[0].isHoneypot).toBe(true);
    expect(result[0].riskLevel).toBe("high");
  });

  it("returns empty for empty input", () => {
    const result = runDiscoveryPipeline([]);
    expect(result).toHaveLength(0);
  });
});
