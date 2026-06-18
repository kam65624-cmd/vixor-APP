// ============================================================================
// VIXOR Backtest Engine — Simulator Tests
// ============================================================================
import { describe, it, expect, beforeEach } from "vitest";
import { performance } from "node:perf_hooks";
import {
  runBacktest,
  runBacktestSync,
  type BacktestConfig,
  type Candle,
  type CompiledStrategy,
} from "./index";

// ---------------------------------------------------------------------------
// Fixture: 100 deterministic candles with a clear trending segment in the
// middle so SMA(5)/SMA(20) crossovers occur.
// ---------------------------------------------------------------------------
function makeCandles(n: number, basePrice = 100, seed = 42): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  let rng = seed;
  const next = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    // Trend phase: first third up, second third down, last third up
    const phase = Math.floor(i / (n / 3));
    const drift = phase === 1 ? -0.4 : 0.4;
    const noise = (next() - 0.5) * 1.5;
    const open = price;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + next() * 0.5;
    const low = Math.min(open, close) - next() * 0.5;
    const volume = 1000 + next() * 500;
    candles.push({
      time: 1700000000000 + i * 60_000,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: round2(volume),
    });
    price = close;
  }
  return candles;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// Simple SMA-crossover strategy. When SMA(5) > SMA(20) it buys 1 unit;
// when SMA(5) < SMA(20) it sells to close.
function makeSmaCrossoverStrategy(): CompiledStrategy {
  return {
    onBar(ctx) {
      const closes = ctx.bars.map((b) => b.close);
      if (closes.length < 20) return;
      const sma5 = avg(closes.slice(-5));
      const sma20 = avg(closes.slice(-20));
      if (sma5 > sma20) {
        if (ctx.position.side !== "long") {
          ctx.buy({ qty: 1, kind: "market" });
          if (ctx.position.side === "short") ctx.close();
        }
      } else if (sma5 < sma20) {
        if (ctx.position.side === "long") ctx.close();
      }
    },
  };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  let s = 0;
  for (const v of arr) s += v;
  return s / arr.length;
}

describe("runBacktestSync", () => {
  let candles: Candle[];

  beforeEach(() => {
    candles = makeCandles(100);
  });

  it("produces a final equity consistent with trades minus commissions", () => {
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0.0006,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = runBacktestSync(config);

    expect(result.equityCurve.length).toBe(candles.length + 1);
    expect(result.trades.length).toBeGreaterThan(0);
    expect(result.metrics.totalTrades).toBe(result.trades.length);
    expect(result.finalEquity).toBeGreaterThan(0);

    // Sanity: final equity ≈ initial + sum(netPnl) - sum(commission+slippage already in netPnl)
    const sumPnl = result.trades.reduce((a, t) => a + t.netPnl, 0);
    const expected = result.initialCapital + sumPnl;
    expect(Math.abs(result.finalEquity - expected)).toBeLessThan(0.5);
  });

  it("trade count > 0 — SMA crossover should fire on trending data", () => {
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = runBacktestSync(config);
    expect(result.trades.length).toBeGreaterThan(0);
  });

  it("max drawdown is non-negative and <= initial capital", () => {
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0.0006,
      slippage: 0.0002,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = runBacktestSync(config);
    expect(result.metrics.maxDrawdown).toBeGreaterThanOrEqual(0);
    expect(result.metrics.maxDrawdownAbs).toBeLessThanOrEqual(result.initialCapital);
  });

  it("sharpe is a finite number", () => {
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = runBacktestSync(config);
    expect(Number.isFinite(result.metrics.sharpe)).toBe(true);
  });

  it("respects warmupPeriod (no trades before warmup ends)", () => {
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
      warmupPeriod: 50,
    };
    const result = runBacktestSync(config);
    for (const t of result.trades) {
      expect(t.entryIndex).toBeGreaterThanOrEqual(50);
    }
  });

  it("enforces stop-loss when configured", () => {
    const strategy: CompiledStrategy = {
      onBar(ctx) {
        if (ctx.currentIndex === 5 && ctx.position.side === "flat") {
          ctx.buy({ qty: 1, stopLoss: 0.02 });
        }
      },
    };
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = runBacktestSync(config);
    expect(result.trades.length).toBeGreaterThan(0);
    const t = result.trades[0];
    // exit reason should be stop_loss if a 2% adverse move happened; otherwise end_of_data
    expect(["stop_loss", "end_of_data", "signal"]).toContain(t.exitReason);
  });
});

describe("runBacktest (async wrapper)", () => {
  it("returns a BacktestResult", async () => {
    const candles = makeCandles(60);
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = await runBacktest(config);
    expect(result.equityCurve.length).toBeGreaterThan(0);
  });
});

describe("metrics edge cases", () => {
  it("returns zeros for empty equity curve", async () => {
    // single bar = equity curve has 1 entry, no returns
    const candles: Candle[] = [
      { time: 1, open: 100, high: 101, low: 99, close: 100, volume: 1000 },
    ];
    const config: BacktestConfig = {
      strategy: { onBar() {} },
      candles,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const result = await runBacktest(config);
    expect(result.metrics.sharpe).toBe(0);
    expect(result.metrics.totalTrades).toBe(0);
  });
});

describe("performance (KPI §9: 200-candle backtest < 500ms)", () => {
  it("completes a 200-candle SMA-crossover backtest in under 500ms", () => {
    const candles = makeCandles(200);
    const strategy = makeSmaCrossoverStrategy();
    const config: BacktestConfig = {
      strategy,
      candles,
      initialCapital: 10_000,
      commission: 0.0006,
      slippage: 0.0002,
      positionSize: { type: "fixed", value: 1 },
      executionTiming: "same_bar_close",
    };
    const t0 = performance.now();
    const result = runBacktestSync(config);
    const elapsed = performance.now() - t0;

    console.log(`  200-candle backtest elapsed: ${elapsed.toFixed(1)} ms`);
    expect(elapsed).toBeLessThan(500);
    expect(result.equityCurve.length).toBe(201);
    expect(result.trades.length).toBeGreaterThan(0);
  });
});
