// ============================================================================
// VIXOR — Backtest Performance Runner (real implementation)
// ============================================================================
// Run via:  bun run scripts/perf-runner.ts [projectRoot]
//
// Loads the REAL `runBacktestSync` from src/domains/backtest/engine and runs
// it on a 200-candle fixture. Reports elapsed ms and exits non-zero on failure
// to meet the < 500ms KPI target.

import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

const projectRoot = resolve(process.argv[2] ?? process.cwd());
const srcPath = resolve(projectRoot, "src/domains/backtest/engine/index.ts");

const { runBacktestSync } = await import(srcPath);

function makeCandles(n: number, basePrice = 100, seed = 42) {
  const candles = [];
  let price = basePrice;
  let rng = seed;
  const next = () => {
    rng = (rng * 1103515245 + 12345) & 0x7fffffff;
    return rng / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    const phase = Math.floor(i / (n / 3));
    const drift = phase === 1 ? -0.4 : 0.4;
    const noise = (next() - 0.5) * 1.5;
    const open = price;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + next() * 0.5;
    const low = Math.min(open, close) - next() * 0.5;
    candles.push({
      time: 1700000000000 + i * 60_000,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume: 1000 + next() * 500,
    });
    price = close;
  }
  return candles;
}

const candles = makeCandles(200);

// SMA-crossover compiled strategy (matches the test fixture).
const strategy = {
  onBar(ctx: { bars: Array<{ close: number }>; position: { side: string }; buy(o: unknown): void; close(): void }) {
    const closes = ctx.bars.map((b) => b.close);
    if (closes.length < 20) return;
    let s5 = 0;
    for (let i = closes.length - 5; i < closes.length; i++) s5 += closes[i];
    s5 /= 5;
    let s20 = 0;
    for (let i = closes.length - 20; i < closes.length; i++) s20 += closes[i];
    s20 /= 20;
    if (s5 > s20) {
      if (ctx.position.side !== "long") {
        ctx.buy({ qty: 1, kind: "market" });
        if (ctx.position.side === "short") ctx.close();
      }
    } else if (s5 < s20) {
      if (ctx.position.side === "long") ctx.close();
    }
  },
};

const t0 = performance.now();
const result = runBacktestSync({
  strategy,
  candles,
  initialCapital: 10_000,
  commission: 0.0006,
  slippage: 0.0002,
  positionSize: { type: "fixed", value: 1 },
  executionTiming: "same_bar_close",
});
const elapsed = performance.now() - t0;

console.log("VIXOR backtest perf check (200 candles) [real runBacktestSync]");
console.log("=============================================================");
console.log(`Final equity:    ${result.finalEquity.toFixed(2)}`);
console.log(`Trades:          ${result.trades.length}`);
console.log(`Equity points:   ${result.equityCurve.length}`);
console.log(`Sharpe:          ${result.metrics.sharpe.toFixed(2)}`);
console.log(`Max DD:          ${result.metrics.maxDrawdown.toFixed(2)}%`);
console.log(`Elapsed:         ${elapsed.toFixed(2)} ms`);
console.log(`Target:          < 500 ms`);
console.log(`Result:          ${elapsed < 500 ? "PASS ✓" : "FAIL ✗"}`);

if (elapsed >= 500) process.exit(1);
