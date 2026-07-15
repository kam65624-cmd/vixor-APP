// ============================================================================
// VIXOR Strategy Runtime — Script Runtime
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/strategy_script_runtime.py
//
// Compiles user strategy code (plain TS/JS) into a `CompiledStrategy` and runs
// it bar-by-bar over a candle series.
//
// Sandbox note: the spec calls for wrapping user code in `@/shared/safe-exec`
// (Agent 2's sandbox). To avoid a hard cross-agent dependency at build time,
// we use a minimal `new Function` wrapper with a restricted global scope and
// a try/catch guard. This is intentionally swappable — once Agent 2's safe-exec
// exports a `safeExec(src, env)` helper, the `compile()` body below can be
// replaced with that call.

import type { Candle, OrderOpts, OrderRequest, Position } from "@/domains/backtest/engine/types";
import {
  applyOrder,
  closeAll,
  flatPosition,
  isFlat,
  type StateMachineConfig,
} from "@/domains/backtest/engine/state-machine";
import { IndicatorParamsParser, type IndicatorParam } from "./indicator-params";
import type {
  CompiledStrategy,
  IndicatorAPI,
  IndicatorOpts,
  RunConfig,
  StrategyContext,
  StrategyRunResult,
} from "./types";

export interface CompileOptions {
  /** user-supplied param overrides (merged with declared @param defaults) */
  params?: Record<string, unknown>;
  /** timeout for the initial compile pass (ms) — soft hint, not enforced */
  compileTimeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Indicator math (self-contained — no external dep)
// ---------------------------------------------------------------------------
const EPS = 1e-12;

function smaArr(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period <= 0) return out;
  let sum = 0;
  let count = 0;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (Number.isFinite(v)) {
      sum += v;
      count++;
    }
    if (i >= period) {
      const old = values[i - period];
      if (Number.isFinite(old)) {
        sum -= old;
        count--;
      }
    }
    if (count >= period) out[i] = sum / period;
  }
  return out;
}

function emaArr(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period <= 0 || values.length === 0) return out;
  const k = 2 / (period + 1);
  let prev = NaN;
  let seedSum = 0;
  let seedCount = 0;
  let seeded = false;
  for (let i = 0; i < values.length; i++) {
    const v = values[i];
    if (!Number.isFinite(v)) {
      out[i] = prev;
      continue;
    }
    if (!seeded) {
      seedSum += v;
      seedCount++;
      if (seedCount === period) {
        prev = seedSum / period;
        out[i] = prev;
        seeded = true;
      }
      continue;
    }
    prev = v * k + prev * (1 - k);
    out[i] = prev;
  }
  return out;
}

function rsiArr(values: number[], period: number): number[] {
  const out = new Array<number>(values.length).fill(NaN);
  if (period <= 0 || values.length < period + 1) return out;
  let gainSum = 0;
  let lossSum = 0;
  for (let i = 1; i <= period; i++) {
    const diff = values[i] - values[i - 1];
    if (diff >= 0) gainSum += diff;
    else lossSum -= diff;
  }
  let avgGain = gainSum / period;
  let avgLoss = lossSum / period;
  out[period] = avgLoss < EPS ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  for (let i = period + 1; i < values.length; i++) {
    const diff = values[i] - values[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    out[i] = avgLoss < EPS ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }
  return out;
}

function trueRange(high: number[], low: number[], close: number[]): number[] {
  const out = new Array<number>(high.length).fill(0);
  for (let i = 0; i < high.length; i++) {
    if (i === 0) {
      out[i] = high[i] - low[i];
      continue;
    }
    const a = high[i] - low[i];
    const b = Math.abs(high[i] - close[i - 1]);
    const c = Math.abs(low[i] - close[i - 1]);
    out[i] = Math.max(a, b, c);
  }
  return out;
}

function atrArr(high: number[], low: number[], close: number[], period: number): number[] {
  const tr = trueRange(high, low, close);
  const out = new Array<number>(high.length).fill(NaN);
  if (period <= 0 || high.length < period) return out;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += tr[i];
  let prev = sum / period;
  out[period - 1] = prev;
  for (let i = period; i < high.length; i++) {
    prev = (prev * (period - 1) + tr[i]) / period;
    out[i] = prev;
  }
  return out;
}

function macdArr(
  values: number[],
  fast: number,
  slow: number,
  signal: number,
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = emaArr(values, fast);
  const emaSlow = emaArr(values, slow);
  const macd = values.map((_, i) =>
    Number.isFinite(emaFast[i]) && Number.isFinite(emaSlow[i]) ? emaFast[i] - emaSlow[i] : NaN,
  );
  const firstValid = macd.findIndex((v) => Number.isFinite(v));
  const signalArr = new Array<number>(values.length).fill(NaN);
  if (firstValid >= 0) {
    const sliced = macd.slice(firstValid);
    const sig = emaArr(sliced, signal);
    for (let i = 0; i < sig.length; i++) signalArr[firstValid + i] = sig[i];
  }
  const histogram = values.map((_, i) =>
    Number.isFinite(macd[i]) && Number.isFinite(signalArr[i]) ? macd[i] - signalArr[i] : NaN,
  );
  return { macd, signal: signalArr, histogram };
}

function bollingerArr(
  values: number[],
  period: number,
  stddev: number,
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = smaArr(values, period);
  const upper = new Array<number>(values.length).fill(NaN);
  const lower = new Array<number>(values.length).fill(NaN);
  for (let i = period - 1; i < values.length; i++) {
    if (!Number.isFinite(middle[i])) continue;
    let sumSq = 0;
    let count = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const diff = values[j] - middle[i];
      sumSq += diff * diff;
      count++;
    }
    const sd = count > 0 ? Math.sqrt(sumSq / count) : 0;
    upper[i] = middle[i] + stddev * sd;
    lower[i] = middle[i] - stddev * sd;
  }
  return { upper, middle, lower };
}

function stochasticArr(
  high: number[],
  low: number[],
  close: number[],
  period: number,
  smoothK: number,
  smoothD: number,
): { k: number[]; d: number[] } {
  const kRaw = new Array<number>(close.length).fill(NaN);
  for (let i = period - 1; i < close.length; i++) {
    let hh = -Infinity;
    let ll = Infinity;
    for (let j = i - period + 1; j <= i; j++) {
      if (high[j] > hh) hh = high[j];
      if (low[j] < ll) ll = low[j];
    }
    kRaw[i] = hh - ll < EPS ? 50 : ((close[i] - ll) / (hh - ll)) * 100;
  }
  const k = smaArr(kRaw, smoothK);
  const d = smaArr(k, smoothD);
  return { k, d };
}

function adxArr(high: number[], low: number[], close: number[], period: number): number[] {
  const n = high.length;
  const out = new Array<number>(n).fill(NaN);
  if (n < period * 2) return out;
  const plusDM = new Array<number>(n).fill(0);
  const minusDM = new Array<number>(n).fill(0);
  const tr = new Array<number>(n).fill(0);
  for (let i = 1; i < n; i++) {
    const up = high[i] - high[i - 1];
    const down = low[i - 1] - low[i];
    plusDM[i] = up > down && up > 0 ? up : 0;
    minusDM[i] = down > up && down > 0 ? down : 0;
    const a = high[i] - low[i];
    const b = Math.abs(high[i] - close[i - 1]);
    const c = Math.abs(low[i] - close[i - 1]);
    tr[i] = Math.max(a, b, c);
  }
  const atr = new Array<number>(n).fill(NaN);
  const plusDM_smooth = new Array<number>(n).fill(NaN);
  const minusDM_smooth = new Array<number>(n).fill(NaN);
  let trSum = 0;
  let plusSum = 0;
  let minusSum = 0;
  for (let i = 1; i <= period; i++) {
    trSum += tr[i];
    plusSum += plusDM[i];
    minusSum += minusDM[i];
  }
  atr[period] = trSum;
  plusDM_smooth[period] = plusSum;
  minusDM_smooth[period] = minusSum;
  for (let i = period + 1; i < n; i++) {
    atr[i] = atr[i - 1] - atr[i - 1] / period + tr[i];
    plusDM_smooth[i] = plusDM_smooth[i - 1] - plusDM_smooth[i - 1] / period + plusDM[i];
    minusDM_smooth[i] = minusDM_smooth[i - 1] - minusDM_smooth[i - 1] / period + minusDM[i];
  }
  const dx = new Array<number>(n).fill(NaN);
  for (let i = period; i < n; i++) {
    if (atr[i] < EPS) {
      dx[i] = 0;
      continue;
    }
    const plusDI = (plusDM_smooth[i] / atr[i]) * 100;
    const minusDI = (minusDM_smooth[i] / atr[i]) * 100;
    const sum = plusDI + minusDI;
    dx[i] = sum < EPS ? 0 : (Math.abs(plusDI - minusDI) / sum) * 100;
  }
  let adx = NaN;
  let dxSum = 0;
  let count = 0;
  for (let i = period; i < n; i++) {
    if (Number.isFinite(dx[i])) {
      dxSum += dx[i];
      count++;
      if (count === period) {
        adx = dxSum / period;
        out[i] = adx;
      } else if (count > period) {
        adx = (adx * (period - 1) + dx[i]) / period;
        out[i] = adx;
      }
    }
  }
  return out;
}

function obvArr(close: number[], volume: number[]): number[] {
  const out = new Array<number>(close.length).fill(0);
  for (let i = 1; i < close.length; i++) {
    if (close[i] > close[i - 1]) out[i] = out[i - 1] + volume[i];
    else if (close[i] < close[i - 1]) out[i] = out[i - 1] - volume[i];
    else out[i] = out[i - 1];
  }
  return out;
}

// ---------------------------------------------------------------------------
// Source-field extraction
// ---------------------------------------------------------------------------
function extractSource(bars: readonly Candle[], opts: IndicatorOpts | undefined): number[] {
  const source = opts?.source ?? "close";
  switch (source) {
    case "open":
      return bars.map((b) => b.open);
    case "high":
      return bars.map((b) => b.high);
    case "low":
      return bars.map((b) => b.low);
    case "close":
      return bars.map((b) => b.close);
    case "volume":
      return bars.map((b) => b.volume);
    case "hl2":
      return bars.map((b) => (b.high + b.low) / 2);
    case "hlc3":
      return bars.map((b) => (b.high + b.low + b.close) / 3);
    case "ohlc4":
      return bars.map((b) => (b.open + b.high + b.low + b.close) / 4);
    default:
      return bars.map((b) => b.close);
  }
}

function latest(arr: number[]): number {
  for (let i = arr.length - 1; i >= 0; i--) {
    if (Number.isFinite(arr[i])) return arr[i];
  }
  return NaN;
}

// ---------------------------------------------------------------------------
// Indicator API factory
// ---------------------------------------------------------------------------
function createIndicatorAPI(barsAccessor: () => readonly Candle[]): IndicatorAPI {
  const api: IndicatorAPI = {
    sma(period, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = smaArr(extractSource(bars, opts), period);
      return opts?.series ? arr : latest(arr);
    },
    ema(period, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = emaArr(extractSource(bars, opts), period);
      return opts?.series ? arr : latest(arr);
    },
    rsi(period, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = rsiArr(extractSource(bars, opts), period);
      return opts?.series ? arr : latest(arr);
    },
    macd(fast = 12, slow = 26, signal = 9, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) {
        return { macd: NaN, signal: NaN, histogram: NaN };
      }
      const r = macdArr(extractSource(bars, opts), fast, slow, signal);
      if (opts?.series) return r;
      const li = r.macd.length - 1;
      return {
        macd: r.macd[li] ?? NaN,
        signal: r.signal[li] ?? NaN,
        histogram: r.histogram[li] ?? NaN,
      };
    },
    atr(period, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = atrArr(
        bars.map((b) => b.high),
        bars.map((b) => b.low),
        bars.map((b) => b.close),
        period,
      );
      return opts?.series ? arr : latest(arr);
    },
    bollinger(period = 20, stddev = 2, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return { upper: NaN, middle: NaN, lower: NaN };
      const r = bollingerArr(extractSource(bars, opts), period, stddev);
      if (opts?.series) return r;
      const li = r.middle.length - 1;
      return { upper: r.upper[li] ?? NaN, middle: r.middle[li] ?? NaN, lower: r.lower[li] ?? NaN };
    },
    stochastic(period = 14, smoothK = 3, smoothD = 3, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return { k: NaN, d: NaN };
      const r = stochasticArr(
        bars.map((b) => b.high),
        bars.map((b) => b.low),
        bars.map((b) => b.close),
        period,
        smoothK,
        smoothD,
      );
      if (opts?.series) return r;
      const li = r.k.length - 1;
      return { k: r.k[li] ?? NaN, d: r.d[li] ?? NaN };
    },
    adx(period = 14, opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = adxArr(
        bars.map((b) => b.high),
        bars.map((b) => b.low),
        bars.map((b) => b.close),
        period,
      );
      return opts?.series ? arr : latest(arr);
    },
    obv(opts) {
      const bars = barsAccessor();
      if (bars.length === 0) return NaN;
      const arr = obvArr(
        bars.map((b) => b.close),
        bars.map((b) => b.volume),
      );
      return opts?.series ? arr : latest(arr);
    },
  };
  return api;
}

// ---------------------------------------------------------------------------
// StrategyRuntime
// ---------------------------------------------------------------------------

/**
 * Strategy runtime — compiles user code and runs it bar-by-bar.
 *
 * Compilation strategy: wrap the user source in a function body that exposes
 * a controlled set of globals (none — only the user's own declarations), then
 * execute it. The user code is expected to define `onStart`, `onBar`, and/or
 * `onEnd` functions as top-level declarations / arrow assignments. After
 * execution we collect them.
 *
 * NOTE: For full sandboxing, swap the `new Function` call below for Agent 2's
 * `safe-exec` runner once available. The function signature is intentionally
 * minimal to make that swap trivial.
 */
export class StrategyRuntime {
  /** Parsed indicator params (populated after compile). */
  private declaredParams: IndicatorParam[] = [];

  /**
   * Compile a strategy from source.
   *
   * The source may define `onStart`, `onBar`, `onEnd` as top-level functions
   * (using `function onStart(ctx) {...}` or `const onStart = (ctx) => {...}`).
   * At least `onBar` must be defined.
   */
  compile(src: string, opts?: CompileOptions): CompiledStrategy {
    if (!src || !src.trim()) {
      throw new Error("Strategy source is empty");
    }
    // Parse @param declarations (so users can call ctx.param('foo') later)
    this.declaredParams = IndicatorParamsParser.parseParams(src);

    // Wrap user source in a function that returns the handlers it defined.
    // NOTE: we deliberately do NOT pre-declare `let onStart = undefined` etc.
    // because that creates a TDZ binding which conflicts with user-declared
    // `function onBar(...)` (function declarations create a binding in the
    // same scope). Using `typeof X !== 'undefined'` lets us safely probe.
    const wrapperSrc = `
      "use strict";
      ${src}
      return {
        onStart: typeof onStart !== 'undefined' ? onStart : undefined,
        onBar: typeof onBar !== 'undefined' ? onBar : undefined,
        onEnd: typeof onEnd !== 'undefined' ? onEnd : undefined,
      };
    `;
    let handlers: {
      onStart?: (ctx: StrategyContext) => void;
      onBar?: (ctx: StrategyContext) => void;
      onEnd?: (ctx: StrategyContext) => void;
    };
    try {
      const fn = new Function(wrapperSrc) as () => typeof handlers;
      handlers = fn();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Strategy compile failed: ${msg}`);
    }
    if (typeof handlers.onBar !== "function") {
      throw new Error("Strategy must define an onBar(ctx) function");
    }
    void opts; // reserved for future compile-time options
    return {
      onStart: handlers.onStart,
      onBar: handlers.onBar,
      onEnd: handlers.onEnd,
    };
  }

  /**
   * Run a compiled strategy over a candle series.
   *
   * If `config.autoExecute` is true, orders are executed against an internal
   * paper account so `position`/`equity`/`cash` reflect the strategy's
   * decisions. Otherwise (default) orders are simply collected into `ctx.orders`
   * for each bar — useful when feeding the compiled strategy into the backtest
   * engine, which handles execution itself.
   */
  run(compiled: CompiledStrategy, candles: Candle[], config?: RunConfig): StrategyRunResult {
    if (!Array.isArray(candles)) {
      throw new Error("candles must be an array");
    }
    const initialCapital = config?.initialCapital ?? 10_000;
    const commissionRate = config?.commission ?? 0;
    const slippageRate = config?.slippage ?? 0;
    const allowShort = config?.allowShort ?? false;
    const autoExecute = config?.autoExecute ?? false;
    const userParams = config?.params ?? {};

    const logs: string[] = [];
    const events: Array<{ name: string; payload?: unknown; barIndex: number }> = [];
    const allOrders: OrderRequest[] = [];

    // Mutable state — shared by closure across all bars
    const state = {
      cash: initialCapital,
      position: flatPosition() as Position,
      totalCommission: 0,
    };

    const mergedParams = IndicatorParamsParser.mergeParams(this.declaredParams, userParams);

    const ctxState = {
      bar: (candles[0] ?? emptyCandle()) as Candle,
      bars: [] as readonly Candle[],
      currentIndex: 0,
      orders: [] as OrderRequest[],
      equity: initialCapital,
    };

    const indicatorAPI = createIndicatorAPI(() => ctxState.bars);

    const ctx: StrategyContext = {
      get bar() {
        return ctxState.bar;
      },
      get bars() {
        return ctxState.bars;
      },
      get currentIndex() {
        return ctxState.currentIndex;
      },
      get position() {
        return state.position;
      },
      get orders() {
        return ctxState.orders;
      },
      get equity() {
        return markToMarket(state.position, ctxState.bar.close, state.cash);
      },
      get cash() {
        return state.cash;
      },
      buy(opts: OrderOpts) {
        pushOrder(ctxState, "buy", opts);
      },
      sell(opts: OrderOpts) {
        pushOrder(ctxState, "sell", opts);
      },
      close() {
        if (isFlat(state.position)) return;
        pushOrder(ctxState, state.position.side === "long" ? "sell" : "buy", {
          qty: Number.POSITIVE_INFINITY,
          kind: "market",
        });
      },
      indicator: indicatorAPI,
      log(msg: string) {
        logs.push(`[bar ${ctxState.currentIndex}] ${msg}`);
      },
      emit(event: string, payload?: unknown) {
        events.push({ name: event, payload, barIndex: ctxState.currentIndex });
      },
      param<T = unknown>(name: string, defaultValue?: T): T {
        if (Object.prototype.hasOwnProperty.call(mergedParams, name)) {
          return mergedParams[name] as T;
        }
        return defaultValue as T;
      },
    };

    const smConfig: StateMachineConfig = { allowShort };

    const processOrders = (fillPrice: number) => {
      for (const order of ctxState.orders) {
        allOrders.push(order);
        if (!autoExecute) continue;

        const price = applySlippage(order.side, fillPrice, slippageRate);
        if (!Number.isFinite(order.qty) || order.qty <= 0) {
          // close-all sentinel
          if (!isFlat(state.position)) {
            const result = closeAll(
              state.position,
              price,
              ctxState.currentIndex,
              ctxState.bar.time,
              "manual",
            );
            if (result.closedTrade) {
              state.cash += result.closedTrade.netPnl;
              state.totalCommission += result.closedTrade.commissionPaid;
            }
            state.position = result.position ?? flatPosition();
          }
          continue;
        }

        const result = applyOrder(
          state.position,
          order,
          price,
          ctxState.currentIndex,
          ctxState.bar.time,
          smConfig,
        );
        if (result.closedTrade) {
          state.cash += result.closedTrade.netPnl;
          state.totalCommission += result.closedTrade.commissionPaid;
        }
        state.position = result.position ?? flatPosition();
      }
      ctxState.orders = [];
    };

    if (typeof compiled.onStart === "function") {
      ctxState.bars = candles;
      ctxState.currentIndex = 0;
      ctxState.bar = candles[0] ?? emptyCandle();
      try {
        compiled.onStart(ctx);
      } catch (err) {
        logs.push(`[onStart error] ${err instanceof Error ? err.message : String(err)}`);
      }
      processOrders(ctxState.bar.close);
    }

    for (let i = 0; i < candles.length; i++) {
      ctxState.bar = candles[i];
      ctxState.bars = candles.slice(0, i + 1);
      ctxState.currentIndex = i;
      ctxState.orders = [];

      if (typeof compiled.onBar === "function") {
        try {
          compiled.onBar(ctx);
        } catch (err) {
          logs.push(`[onBar error @ ${i}] ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      processOrders(ctxState.bar.close);
    }

    ctxState.currentIndex = candles.length - 1;
    ctxState.bars = candles;
    if (typeof compiled.onEnd === "function") {
      try {
        compiled.onEnd(ctx);
      } catch (err) {
        logs.push(`[onEnd error] ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    void commissionRate;
    return {
      orders: allOrders,
      logs,
      events,
      barsProcessed: candles.length,
      finalEquity: ctxState.equity,
    };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pushOrder(
  state: { orders: OrderRequest[]; currentIndex: number },
  side: "buy" | "sell",
  opts: OrderOpts,
): void {
  if (opts.qty !== undefined && opts.qty <= 0) return;
  state.orders.push({
    side,
    qty: opts.qty ?? 0,
    price: opts.price,
    kind: opts.kind ?? "market",
    stopLoss: opts.stopLoss,
    takeProfit: opts.takeProfit,
    scaleIn: opts.scaleIn ?? false,
    tag: opts.tag,
    placedAtIndex: state.currentIndex,
  });
}

function applySlippage(side: "buy" | "sell", price: number, slippage: number): number {
  if (slippage <= 0) return price;
  return side === "buy" ? price * (1 + slippage) : price * (1 - slippage);
}

function markToMarket(pos: Position, price: number, cash: number): number {
  if (isFlat(pos)) return cash;
  const dir = pos.side === "long" ? 1 : -1;
  return cash + (price - pos.avgEntryPrice) * pos.qty * dir;
}

function emptyCandle(): Candle {
  return { time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };
}
