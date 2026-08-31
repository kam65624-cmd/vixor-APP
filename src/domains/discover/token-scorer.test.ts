// ============================================================================
// VIXOR Discover — Token Scorer Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import { scoreToken, rankTokens, type TokenScore } from "./token-scorer";
import type { EnrichedToken } from "./discover-crypto-data";

// ── Helpers ──────────────────────────────────────────────────────────────

function makeToken(overrides: Partial<EnrichedToken> = {}): EnrichedToken {
  return {
    chainId: "solana",
    tokenAddress: "0x" + "a".repeat(64),
    symbol: "TEST",
    name: "Test Token",
    icon: null,
    description: null,
    url: "https://dexscreener.com/solana/0x" + "a".repeat(64),
    priceUsd: 0.001,
    change24h: null,
    volume24h: null,
    liquidityUsd: null,
    fdv: null,
    marketCap: null,
    pairAddress: null,
    isBoosted: false,
    boostAmount: null,
    totalBoostAmount: null,
    ...overrides,
  };
}

describe("token-scorer", () => {
  // ── scoreToken ──────────────────────────────────────────────────────

  describe("scoreToken", () => {
    it("returns zero scores for a token with no data", () => {
      const token = makeToken();
      const result = scoreToken(token);

      expect(result.liquidityScore).toBe(0);
      expect(result.volumeScore).toBe(0);
      expect(result.momentumScore).toBe(5); // <0% change → 5
      expect(result.overallScore).toBe(5);
      expect(result.safetyFlags).toContain("low_liquidity");
      expect(result.safetyFlags).toContain("new_token");
    });

    it("scores high liquidity correctly (>$5M = 40)", () => {
      const token = makeToken({ liquidityUsd: 10_000_000 });
      const result = scoreToken(token);
      expect(result.liquidityScore).toBe(40);
    });

    it("scores mid liquidity correctly ($500k-$5M = 30)", () => {
      const token = makeToken({ liquidityUsd: 1_000_000 });
      const result = scoreToken(token);
      expect(result.liquidityScore).toBe(30);
    });

    it("scores high volume correctly (>$1M = 30)", () => {
      const token = makeToken({ volume24h: 5_000_000 });
      const result = scoreToken(token);
      expect(result.volumeScore).toBe(30);
    });

    it("scores high momentum correctly (>50% = 30)", () => {
      const token = makeToken({ change24h: 75 });
      const result = scoreToken(token);
      expect(result.momentumScore).toBe(30);
    });

    it("flags high FDV-to-liquidity ratio", () => {
      const token = makeToken({ liquidityUsd: 10_000, fdv: 500_000 });
      // ratio = 500000 / 10000 = 50x > 20x
      const result = scoreToken(token);
      expect(result.safetyFlags).toContain("high_fdv");
    });

    it("does not flag normal FDV-to-liquidity ratio", () => {
      const token = makeToken({ liquidityUsd: 1_000_000, fdv: 5_000_000 });
      // ratio = 5x, within normal range
      const result = scoreToken(token);
      expect(result.safetyFlags).not.toContain("high_fdv");
    });

    it("returns correct overall score as sum of sub-scores", () => {
      // liquidity = $100k → 20, volume = $500k → 20, momentum = 25% → 25
      const token = makeToken({
        liquidityUsd: 100_000,
        volume24h: 500_000,
        change24h: 25,
      });
      const result = scoreToken(token);
      expect(result.overallScore).toBe(20 + 20 + 25); // 65
    });
  });

  // ── rankTokens ─────────────────────────────────────────────────────

  describe("rankTokens", () => {
    it("sorts by overallScore descending", () => {
      const tokens = [
        makeToken({ liquidityUsd: 100_000, volume24h: 500_000, change24h: 10 }), // 20+20+20=60
        makeToken({ liquidityUsd: 10_000_000, volume24h: 5_000_000, change24h: 75 }), // 40+30+30=100
        makeToken({ liquidityUsd: 50_000, volume24h: 50_000, change24h: 5 }), // 10+10+15=35
      ];
      const ranked = rankTokens(tokens);
      expect(ranked).toHaveLength(3);
      expect(ranked[0].overallScore).toBeGreaterThanOrEqual(ranked[1].overallScore);
      expect(ranked[1].overallScore).toBeGreaterThanOrEqual(ranked[2].overallScore);
    });

    it("filters out tokens below minScore", () => {
      const tokens = [
        makeToken({ liquidityUsd: 100_000, volume24h: 500_000, change24h: 10 }), // 20+20+15=55
        makeToken({ liquidityUsd: 5_000, volume24h: 500, change24h: -5 }), // 0+0+5=5
      ];
      const ranked = rankTokens(tokens, { minScore: 30 });
      expect(ranked).toHaveLength(1);
      expect(ranked[0].overallScore).toBe(55);
    });

    it("filters out tokens below minLiquidityUsd", () => {
      const tokens = [
        makeToken({ liquidityUsd: 100_000, volume24h: 500_000, change24h: 30 }), // 20+20+25=65
        makeToken({ liquidityUsd: 5_000, volume24h: 500_000, change24h: 30 }), // 10+20+25=55
      ];
      const ranked = rankTokens(tokens, { minLiquidityUsd: 50_000 });
      expect(ranked).toHaveLength(1);
    });

    it("respects maxResults limit", () => {
      const tokens = Array.from(
        { length: 5 },
        () => makeToken({ liquidityUsd: 10_000_000, volume24h: 5_000_000, change24h: 50 }), // all 100
      );
      const ranked = rankTokens(tokens, { maxResults: 2 });
      expect(ranked).toHaveLength(2);
    });

    it("returns empty array when no tokens pass filters", () => {
      const tokens = [
        makeToken({ liquidityUsd: 100, volume24h: 50, change24h: -10 }), // 0+0+5=5
      ];
      const ranked = rankTokens(tokens, { minScore: 30 });
      expect(ranked).toHaveLength(0);
    });

    it("uses default options when none provided", () => {
      const tokens = [makeToken({ liquidityUsd: 10_000, volume24h: 500_000, change24h: 30 })];
      // score = 10+20+25 = 55, above default minScore 30, liquidity = 10000 >= default 10000
      const ranked = rankTokens(tokens);
      expect(ranked).toHaveLength(1);
    });
  });
});
