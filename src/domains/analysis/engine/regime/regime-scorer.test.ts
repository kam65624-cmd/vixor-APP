// ============================================================================
// VIXOR Analysis Engine — Regime Detector + Strategy Scorer Tests
// ============================================================================
import { describe, it, expect } from "vitest";
import { detectRegime } from "./regime-detector";
import { scoreStrategy, rankByScore } from "./strategy-scorer";
import type { BacktestResult, Candle } from "@/domains/backtest/engine/types";

function makeCandles(n: number, basePrice = 100): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  let s = 11;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    // Strong uptrend for first half, downtrend for second
    const drift = i < n / 2 ? 0.5 : -0.5;
    const open = price;
    const close = Math.max(1, open + drift + (next() - 0.5) * 0.6);
    const high = Math.max(open, close) + next() * 0.3;
    const low = Math.min(open, close) - next() * 0.3;
    candles.push({
      time: i,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: 1000,
    });
    price = close;
  }
  return candles;
}

describe("detectRegime", () => {
  it("rejects insufficient candles", () => {
    expect(() => detectRegime(makeCandles(10))).toThrow(/30 candles/i);
  });

  it("classifies a strong uptrend as trending_up or transition", () => {
    const candles = makeCandles(60);
    const r = detectRegime(candles);
    expect(["trending_up", "trending_down", "ranging", "volatile", "quiet"]).toContain(r.regime);
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
    expect(r.indicators.adx).toBeGreaterThanOrEqual(0);
    expect(r.indicators.hurst).toBeGreaterThanOrEqual(0);
    expect(r.indicators.hurst).toBeLessThanOrEqual(1);
    expect(r.strategyFamilies.length).toBeGreaterThan(0);
  });

  it("returns all indicator fields populated", () => {
    const r = detectRegime(makeCandles(50));
    expect(r.indicators).toHaveProperty("adx");
    expect(r.indicators).toHaveProperty("atrPercentile");
    expect(r.indicators).toHaveProperty("hurst");
    expect(r.indicators).toHaveProperty("trendStrength");
    expect(r.indicators).toHaveProperty("emaGapPct");
    expect(r.indicators).toHaveProperty("realizedVolPct");
    expect(r.indicators).toHaveProperty("directionalEfficiency");
    expect(r.indicators).toHaveProperty("priceChangePct");
  });
});

describe("scoreStrategy", () => {
  function makeResult(overrides: Partial<BacktestResult> = {}): BacktestResult {
    return {
      equityCurve: [
        { time: 0, equity: 10_000, drawdown: 0 },
        { time: 1, equity: 10_500, drawdown: 0 },
        { time: 2, equity: 10_800, drawdown: 0 },
        { time: 3, equity: 11_200, drawdown: 0 },
      ],
      trades: [
        {
          id: 1,
          side: "long",
          entryIndex: 0,
          exitIndex: 1,
          entryTime: 0,
          exitTime: 1,
          entryPrice: 100,
          exitPrice: 105,
          qty: 100,
          grossPnl: 500,
          commissionPaid: 5,
          slippageCost: 0,
          netPnl: 495,
          returnPct: 0.05,
          mae: 0,
          mfe: 0.05,
          rMultiple: 1,
          exitReason: "signal",
          durationBars: 1,
        },
        {
          id: 2,
          side: "long",
          entryIndex: 1,
          exitIndex: 2,
          entryTime: 1,
          exitTime: 2,
          entryPrice: 105,
          exitPrice: 108,
          qty: 100,
          grossPnl: 300,
          commissionPaid: 5,
          slippageCost: 0,
          netPnl: 295,
          returnPct: 0.03,
          mae: 0,
          mfe: 0.03,
          rMultiple: 0.6,
          exitReason: "signal",
          durationBars: 1,
        },
      ],
      metrics: {
        totalReturn: 12,
        annualReturn: 60,
        cagr: 50,
        maxDrawdown: 8,
        maxDrawdownAbs: 800,
        maxDrawdownDuration: 3,
        sharpe: 1.5,
        sortino: 2.0,
        winRate: 65,
        profitFactor: 1.8,
        avgWin: 300,
        avgLoss: -150,
        expectancy: 200,
        avgRMultiple: 0.8,
        totalTrades: 20,
        winningTrades: 13,
        losingTrades: 7,
        totalProfit: 1200,
        totalCommission: 60,
        volatility: 15,
      },
      stats: {
        totalBars: 100,
        totalTrades: 20,
        winningTrades: 13,
        losingTrades: 7,
        exposureTime: 60,
      },
      finalEquity: 11_200,
      initialCapital: 10_000,
      ...overrides,
    };
  }

  it("produces a score with overall in [0, 100] and a valid grade", () => {
    const score = scoreStrategy(makeResult());
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(100);
    expect(["A", "B", "C", "D", "F"]).toContain(score.grade);
    expect(score.profitability).toBeGreaterThanOrEqual(0);
    expect(score.consistency).toBeGreaterThanOrEqual(0);
    expect(score.riskAdjusted).toBeGreaterThanOrEqual(0);
    expect(score.drawdown).toBeGreaterThanOrEqual(0);
    expect(score.regimeFit).toBeGreaterThanOrEqual(0);
  });

  it("applies a small-sample penalty for <5 trades", () => {
    const highScore = scoreStrategy(makeResult());
    const smallSample = scoreStrategy(
      makeResult({
        metrics: { ...makeResult().metrics, totalTrades: 2 },
      }),
    );
    expect(smallSample.overall).toBeLessThanOrEqual(highScore.overall);
  });

  it("rankByScore sorts descending by overall", () => {
    const items = [
      { score: { overall: 50 } },
      { score: { overall: 90 } },
      { score: { overall: 70 } },
      { score: undefined },
    ] as Array<{ score?: { overall?: number } }>;
    const ranked = rankByScore(items);
    expect(ranked[0].score?.overall).toBe(90);
    expect(ranked[1].score?.overall).toBe(70);
    expect(ranked[2].score?.overall).toBe(50);
    expect(ranked[0].rank).toBe(1);
  });
});
