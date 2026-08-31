// ============================================================================
// VIXOR Weekly Review Generator — Unit Tests
// ============================================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the performance module
const mockCalculatePerformance = vi.fn();
vi.mock("./performance", () => ({
  calculatePerformance: mockCalculatePerformance,
}));

const { generateWeeklyReview } = await import("./weekly-review");

describe("generateWeeklyReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a review with empty performance when no trades", async () => {
    mockCalculatePerformance.mockResolvedValue({
      totalTrades: 0,
      winRate: 0,
      avgWinPct: 0,
      avgLossPct: 0,
      profitFactor: 0,
      totalPnlPct: 0,
      bestTrade: null,
      worstTrade: null,
      avgDurationHours: 0,
      byDirection: { long: { trades: 0, winRate: 0 }, short: { trades: 0, winRate: 0 } },
    });

    const review = await generateWeeklyReview("user-1");

    expect(review.period.from).toBeDefined();
    expect(review.period.to).toBeDefined();
    expect(review.generatedAt).toBeDefined();
    expect(review.topSignals).toHaveLength(0);
    expect(review.performance.totalTrades).toBe(0);
  });

  it("includes best trade in topSignals", async () => {
    mockCalculatePerformance.mockResolvedValue({
      totalTrades: 5,
      winRate: 60,
      avgWinPct: 8.5,
      avgLossPct: -2.1,
      profitFactor: 2.5,
      totalPnlPct: 15.3,
      bestTrade: { pair: "BTC/USDT", pnlPct: 8.5 },
      worstTrade: { pair: "ETH/USDT", pnlPct: -2.1 },
      avgDurationHours: 3.5,
      byDirection: { long: { trades: 4, winRate: 75 }, short: { trades: 1, winRate: 0 } },
    });

    const review = await generateWeeklyReview("user-1");

    expect(review.topSignals.length).toBeGreaterThanOrEqual(1);
    expect(review.topSignals[0]?.pair).toBe("BTC/USDT");
    expect(review.topSignals[0]?.pnlPct).toBe(8.5);
    expect(review.topSignals[0]?.outcome).toBe("WIN");
  });

  it("generates insight about best trade and win rate", async () => {
    mockCalculatePerformance.mockResolvedValue({
      totalTrades: 10,
      winRate: 62,
      avgWinPct: 5,
      avgLossPct: -2,
      profitFactor: 2.5,
      totalPnlPct: 20,
      bestTrade: { pair: "BTC/USDT", pnlPct: 8.5 },
      worstTrade: { pair: "ETH/USDT", pnlPct: -1.5 },
      avgDurationHours: 3,
      byDirection: { long: { trades: 8, winRate: 62.5 }, short: { trades: 2, winRate: 50 } },
    });

    const review = await generateWeeklyReview("user-1");

    expect(review.insights.length).toBeGreaterThan(0);

    // Should mention win rate
    const winRateInsight = review.insights.find((i) => i.includes("Win rate"));
    expect(winRateInsight).toBeDefined();
    expect(winRateInsight).toContain("62.0%");

    // Should mention best trade
    const bestTradeInsight = review.insights.find((i) => i.includes("Best trade"));
    expect(bestTradeInsight).toBeDefined();
    expect(bestTradeInsight).toContain("BTC/USDT");
  });

  it("generates duration-based insight for short trades", async () => {
    mockCalculatePerformance.mockResolvedValue({
      totalTrades: 3,
      winRate: 66.67,
      avgWinPct: 5,
      avgLossPct: -1,
      profitFactor: 3,
      totalPnlPct: 8,
      bestTrade: { pair: "SOL/USDT", pnlPct: 5 },
      worstTrade: { pair: "XRP/USDT", pnlPct: -1 },
      avgDurationHours: 1.5, // Less than 4h
      byDirection: { long: { trades: 3, winRate: 66.67 }, short: { trades: 0, winRate: 0 } },
    });

    const review = await generateWeeklyReview("user-1");

    const durationInsight = review.insights.find((i) => i.includes("duration"));
    expect(durationInsight).toBeDefined();
    expect(durationInsight).toContain("day trading");
  });
});
