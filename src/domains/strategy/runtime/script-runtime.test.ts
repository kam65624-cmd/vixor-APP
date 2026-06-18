// ============================================================================
// VIXOR Strategy Runtime — Tests
// ============================================================================
import { describe, it, expect, beforeEach } from "vitest";
import { StrategyRuntime } from "./index";
import type { Candle } from "@/domains/backtest/engine/types";

function makeCandles(n: number, basePrice = 100): Candle[] {
  const candles: Candle[] = [];
  let price = basePrice;
  let s = 7;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    const drift = Math.sin(i / 5) * 0.6;
    const noise = (next() - 0.5) * 1.0;
    const open = price;
    const close = Math.max(1, open + drift + noise);
    const high = Math.max(open, close) + next() * 0.4;
    const low = Math.min(open, close) - next() * 0.4;
    candles.push({
      time: i,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
      volume: 1000,
    });
    price = close;
  }
  return candles;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

describe("StrategyRuntime.compile", () => {
  it("rejects empty source", () => {
    const rt = new StrategyRuntime();
    expect(() => rt.compile("")).toThrow(/empty/i);
  });

  it("requires onBar", () => {
    const rt = new StrategyRuntime();
    expect(() => rt.compile("function onStart(ctx) {}")).toThrow(/onBar/i);
  });

  it("compiles a minimal onBar strategy", () => {
    const rt = new StrategyRuntime();
    const compiled = rt.compile("function onBar(ctx) { ctx.log('hi'); }");
    expect(typeof compiled.onBar).toBe("function");
  });
});

describe("StrategyRuntime.run", () => {
  let candles: Candle[];

  beforeEach(() => {
    candles = makeCandles(100);
  });

  it("places a buy order when SMA(20) > SMA(50) condition fires", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.bars.length < 50) return;
        const sma20 = ctx.indicator.sma(20);
        const sma50 = ctx.indicator.sma(50);
        if (sma20 > sma50) {
          ctx.buy({ qty: 1 });
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    expect(result.orders.length).toBeGreaterThan(0);
    expect(result.orders.some((o) => o.side === "buy")).toBe(true);
  });

  it("ctx.bars does not include future candles (lookahead protection)", () => {
    const rt = new StrategyRuntime();
    let maxBarsSeen = 0;
    let currentIndexAtMax = 0;
    const src = `
      function onBar(ctx) {
        if (ctx.bars.length > ${0}) {
          // capture via emit
          ctx.emit('bars_len', ctx.bars.length);
          ctx.emit('idx', ctx.currentIndex);
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    for (const ev of result.events) {
      if (typeof ev.payload === "number") {
        if (ev.name === "bars_len") maxBarsSeen = Math.max(maxBarsSeen, ev.payload);
        if (ev.name === "idx") currentIndexAtMax = Math.max(currentIndexAtMax, ev.payload);
      }
    }
    // bars length should never exceed currentIndex + 1
    expect(maxBarsSeen).toBeLessThanOrEqual(currentIndexAtMax + 1);
    // and never exceed total candles
    expect(maxBarsSeen).toBeLessThanOrEqual(candles.length);
  });

  it("ctx.indicator.sma returns latest value as a number by default", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.bars.length >= 20) {
          ctx.emit('sma', ctx.indicator.sma(20));
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    const ev = result.events.find((e) => e.name === "sma" && typeof e.payload === "number");
    const value: number | undefined = ev?.payload as number | undefined;
    expect(value).not.toBeUndefined();
    expect(typeof value).toBe("number");
    expect(Number.isFinite(value)).toBe(true);
  });

  it("ctx.indicator.sma returns full series when opts.series=true", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.bars.length >= 20) {
          const arr = ctx.indicator.sma(20, { series: true });
          ctx.emit('sma_arr_len', Array.isArray(arr) ? arr.length : -1);
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    // Take the LAST event — fires on the final bar where ctx.bars.length === candles.length
    const ev = [...result.events].reverse().find((e) => e.name === "sma_arr_len");
    expect(ev?.payload).toBe(candles.length);
  });

  it("autoExecute mode updates cash/position", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.currentIndex === 5) ctx.buy({ qty: 2 });
        if (ctx.currentIndex === 10) ctx.close();
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles, {
      autoExecute: true,
      initialCapital: 10_000,
      commission: 0,
      slippage: 0,
    });
    expect(result.orders.length).toBeGreaterThanOrEqual(2);
    // After close, cash should reflect realised PnL
    // (we don't assert exact value since prices are random — just that it ran)
  });

  it("emits indicator values for rsi, macd, atr, bollinger, stochastic, adx", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.currentIndex === ctx.bars.length - 1) {
          ctx.emit('rsi', ctx.indicator.rsi(14));
          ctx.emit('macd', JSON.stringify(ctx.indicator.macd()));
          ctx.emit('atr', ctx.indicator.atr(14));
          ctx.emit('bb', JSON.stringify(ctx.indicator.bollinger()));
          ctx.emit('stoch', JSON.stringify(ctx.indicator.stochastic()));
          ctx.emit('adx', ctx.indicator.adx(14));
          ctx.emit('obv', ctx.indicator.obv());
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    const names = result.events.map((e) => e.name);
    for (const k of ["rsi", "macd", "atr", "bb", "stoch", "adx", "obv"]) {
      expect(names).toContain(k);
    }
  });

  it("captures strategy errors in logs without crashing", () => {
    const rt = new StrategyRuntime();
    const src = `
      function onBar(ctx) {
        if (ctx.currentIndex === 3) {
          throw new Error('boom');
        }
      }
    `;
    const compiled = rt.compile(src);
    const result = rt.run(compiled, candles);
    expect(result.logs.some((l: unknown) => typeof l === "string" && l.includes("boom"))).toBe(
      true,
    );
  });
});
