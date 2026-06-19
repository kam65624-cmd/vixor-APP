// ============================================================================
// VIXOR Backtest Domain — Server Functions
// ============================================================================
//
// Real server functions powering the backtest page.
// Replaces mock data with live OHLCV fetching and the in-house backtest engine.
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { supabaseAdmin } from "@/shared/supabase/client.server";
import { AssetRegistry } from "@/shared/asset-registry";
import { runBacktest } from "./engine";
import type { Candle, CompiledStrategy } from "./engine/types";
import {
  fetchBinanceKlines,
  fetchTwelveDataKlines,
} from "@/domains/market/server/price-fetcher";

// ============================================================================
// Indicator Helpers
// ============================================================================
// Minimal math-only implementations — no external analysis engine needed.

/** Simple Moving Average over the last `period` closes in `bars`.
 *  `offset` = 0 → current bar, 1 → one bar back, etc. */
function sma(
  bars: readonly Candle[],
  period: number,
  offset: number = 0,
): number {
  const endIdx = bars.length - 1 - offset;
  const startIdx = endIdx - period + 1;
  if (startIdx < 0 || bars.length === 0) return 0;
  let sum = 0;
  for (let i = startIdx; i <= endIdx; i++) sum += bars[i].close;
  return sum / period;
}

/** Relative Strength Index (Wilder's smoothing). */
function rsi(
  bars: readonly Candle[],
  period: number = 14,
  offset: number = 0,
): number {
  const effectiveLen = bars.length - offset;
  if (effectiveLen < period + 1) return 50;
  let avgGain = 0;
  let avgLoss = 0;
  // Seed with simple average of first `period` changes
  const seedStart = effectiveLen - period - 1;
  for (let i = seedStart; i < seedStart + period; i++) {
    const change = bars[i + 1].close - bars[i].close;
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;
  // Wilder's smoothing for remaining bars up to current
  const currentEnd = bars.length - 1 - offset;
  for (let i = seedStart + period + 1; i <= currentEnd; i++) {
    const change = bars[i].close - bars[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Exponential Moving Average computed from the first bar forward. */
function ema(bars: readonly Candle[], period: number): number {
  if (bars.length === 0) return 0;
  const k = 2 / (period + 1);
  let val = bars[0].close;
  for (let i = 1; i < bars.length; i++) {
    val = bars[i].close * k + val * (1 - k);
  }
  return val;
}

/** Highest high over the last `period` bars. `offset` = 1 → look one bar back. */
function highest(bars: readonly Candle[], period: number, offset: number = 0): number {
  const endIdx = bars.length - 1 - offset;
  const startIdx = endIdx - period + 1;
  if (startIdx < 0 || bars.length === 0) return 0;
  let max = -Infinity;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].high > max) max = bars[i].high;
  }
  return max;
}

/** Lowest low over the last `period` bars. `offset` = 1 → look one bar back. */
function lowest(bars: readonly Candle[], period: number, offset: number = 0): number {
  const endIdx = bars.length - 1 - offset;
  const startIdx = endIdx - period + 1;
  if (startIdx < 0 || bars.length === 0) return 0;
  let min = Infinity;
  for (let i = startIdx; i <= endIdx; i++) {
    if (bars[i].low < min) min = bars[i].low;
  }
  return min;
}

// ============================================================================
// Strategy Compiler
// ============================================================================

/**
 * Build a CompiledStrategy from a preset name.
 * Each strategy uses only the indicator helpers above and the
 * StrategyContextLike interface exposed by the simulator.
 */
export function compileStrategy(preset: string): CompiledStrategy {
  switch (preset) {
    // ── SMA Crossover ─────────────────────────────────────────────────────
    case "sma_crossover": {
      const fastLen = 10;
      const slowLen = 20;
      return {
        onStart() {},
        onBar(ctx) {
          const bars = ctx.bars;
          if (bars.length < slowLen + 1) return;
          const fast = sma(bars, fastLen);
          const slow = sma(bars, slowLen);
          const prevFast = sma(bars, fastLen, 1);
          const prevSlow = sma(bars, slowLen, 1);
          // Bullish crossover: fast crosses above slow
          if (prevFast <= prevSlow && fast > slow) {
            if (ctx.position.side === "flat") {
              ctx.buy({ kind: "market", qty: 1, tag: "sma_cross_long" });
            }
          }
          // Bearish crossover: fast crosses below slow
          if (prevFast >= prevSlow && fast < slow) {
            if (ctx.position.side === "long") {
              ctx.sell({ kind: "market", qty: 1, tag: "sma_cross_exit" });
            }
          }
        },
        onEnd() {},
      };
    }

    // ── RSI Reversal ───────────────────────────────────────────────────────
    case "rsi_reversal": {
      const period = 14;
      return {
        onStart() {},
        onBar(ctx) {
          const bars = ctx.bars;
          if (bars.length < period + 2) return;
          const currentRSI = rsi(bars, period);
          const prevRSI = rsi(bars, period, 1);
          // Oversold bounce: RSI crosses above 30
          if (prevRSI <= 30 && currentRSI > 30) {
            if (ctx.position.side === "flat") {
              ctx.buy({ kind: "market", qty: 1, tag: "rsi_oversold" });
            }
          }
          // Overbought drop: RSI crosses below 70
          if (prevRSI >= 70 && currentRSI < 70) {
            if (ctx.position.side === "long") {
              ctx.sell({ kind: "market", qty: 1, tag: "rsi_overbought" });
            }
          }
        },
        onEnd() {},
      };
    }

    // ── Breakout ────────────────────────────────────────────────────────────
    case "breakout": {
      const lookbackHigh = 20;
      const lookbackLow = 10;
      return {
        onStart() {},
        onBar(ctx) {
          const bars = ctx.bars;
          if (bars.length < lookbackHigh + 1) return;
          const current = ctx.bar;
          const prevHigh = highest(bars, lookbackHigh - 1, 1); // 20-bar high before current
          const prevLow = lowest(bars, lookbackLow - 1, 1); // 10-bar low before current
          // Buy on 20-bar high breakout
          if (current.high > prevHigh && prevHigh > 0) {
            if (ctx.position.side === "flat") {
              ctx.buy({ kind: "market", qty: 1, tag: "breakout_long" });
            }
          }
          // Sell on 10-bar low breakdown
          if (current.low < prevLow && prevLow > 0 && prevLow < Infinity) {
            if (ctx.position.side === "long") {
              ctx.sell({ kind: "market", qty: 1, tag: "breakdown_exit" });
            }
          }
        },
        onEnd() {},
      };
    }

    // ── MACD Momentum ───────────────────────────────────────────────────────
    case "macd_momentum": {
      const fastLen = 12;
      const slowLen = 26;
      const signalLen = 9;
      const signalK = 2 / (signalLen + 1);
      let prevMacdLine = 0;
      let prevSignalLine = 0;
      let signalEma = 0;
      let barCount = 0;

      return {
        onStart() {
          prevMacdLine = 0;
          prevSignalLine = 0;
          signalEma = 0;
          barCount = 0;
        },
        onBar(ctx) {
          const bars = ctx.bars;
          if (bars.length < slowLen) return;

          const fastEma = ema(bars, fastLen);
          const slowEma = ema(bars, slowLen);
          const macdLine = fastEma - slowEma;

          // Running EMA of MACD for signal line
          if (barCount === 0) {
            signalEma = macdLine;
          } else {
            signalEma = macdLine * signalK + signalEma * (1 - signalK);
          }
          const currentSignal = signalEma;

          // Skip first bar (need previous values for crossover detection)
          if (barCount > 0) {
            // Bullish crossover: MACD crosses above signal
            if (prevMacdLine <= prevSignalLine && macdLine > currentSignal) {
              if (ctx.position.side === "flat") {
                ctx.buy({ kind: "market", qty: 1, tag: "macd_bull_x" });
              }
            }
            // Bearish crossover: MACD crosses below signal
            if (prevMacdLine >= prevSignalLine && macdLine < currentSignal) {
              if (ctx.position.side === "long") {
                ctx.sell({ kind: "market", qty: 1, tag: "macd_bear_x" });
              }
            }
          }

          prevMacdLine = macdLine;
          prevSignalLine = currentSignal;
          barCount++;
        },
        onEnd() {},
      };
    }

    default:
      throw new Error(`Unknown strategy preset: "${preset}"`);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/** Map a timeframe key to annualisation periods. */
function getPeriodsPerYear(timeframe: string): number {
  switch (timeframe) {
    case "1M":
      return 365 * 24 * 60; // 525,600
    case "5M":
      return 365 * 24 * 12; // 105,120
    case "15M":
      return 365 * 24 * 4; // 35,040
    case "30M":
      return 365 * 24 * 2; // 17,520
    case "1H":
      return 365 * 24; // 8,760
    case "4H":
      return 365 * 6; // 2,190
    case "1D":
      return 252;
    case "1W":
      return 52;
    default:
      return 252;
  }
}

/** Warmup bars needed before the strategy can produce signals. */
function getWarmupPeriod(preset: string): number {
  switch (preset) {
    case "sma_crossover":
      return 21; // slowLen + 1
    case "rsi_reversal":
      return 16; // RSI period + 2
    case "breakout":
      return 21; // lookback high
    case "macd_momentum":
      return 27; // slow EMA + 1
    default:
      return 30;
  }
}

/** Convert KlineBar[] (time in seconds) to Candle[] (time in ms). */
function klinesToCandles(
  klines: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>,
): Candle[] {
  return klines.map((k) => ({
    time: k.time * 1000, // seconds → milliseconds
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
    volume: k.volume,
  }));
}

/** Filter candles to a date range (inclusive). Times are in ms. */
function filterByDateRange(
  candles: Candle[],
  startDate?: string,
  endDate?: string,
): Candle[] {
  if (!startDate && !endDate) return candles;
  const startMs = startDate ? new Date(startDate).getTime() : 0;
  const endMs = endDate
    ? new Date(endDate).getTime() + 86_400_000 // include end date
    : Infinity;
  return candles.filter((c) => c.time >= startMs && c.time <= endMs);
}

/**
 * Fetch OHLCV data. Uses Binance for crypto pairs, TwelveData for
 * forex/commodity pairs. Returns candles with time in ms.
 */
async function fetchOHLCV(
  pair: string,
  timeframe: string,
  limit: number = 1000,
): Promise<Candle[]> {
  const isCrypto = AssetRegistry.isCrypto(pair);

  let klines: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>;

  if (isCrypto) {
    klines = await fetchBinanceKlines(pair, timeframe, Math.min(limit, 1000));
  } else {
    klines = await fetchTwelveDataKlines(pair, timeframe, Math.min(limit, 1000));
  }

  if (!klines || klines.length === 0) {
    throw new Error(`No OHLCV data available for ${pair} (${timeframe})`);
  }

  return klinesToCandles(klines);
}

// ============================================================================
// Validators
// ============================================================================

const RunBacktestInput = z.object({
  pair: z.string().min(1),
  timeframe: z.string().min(1),
  strategyPreset: z.string().min(1),
  initialCapital: z.number().positive().default(100_000),
  riskPercent: z.number().min(0.1).max(100).default(2),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  /** Commission as a fraction of notional (e.g. 0.001 = 0.1%) */
  commission: z.number().min(0).max(0.1).default(0.001),
  /** Slippage as a fraction of fill price (e.g. 0.0005 = 0.05%) */
  slippage: z.number().min(0).max(0.1).default(0.0005),
});

const VALID_PRESETS = ["sma_crossover", "rsi_reversal", "breakout", "macd_momentum"];
const VALID_TIMEFRAMES = ["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"];

// ============================================================================
// Server Function 1: runBacktestServer (POST)
// ============================================================================

const BACKTEST_POINT_COST = 10;

export const runBacktestServer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => RunBacktestInput.parse(d))
  .handler(async ({ data, context }) => {
    const { userId } = context;

    console.log(
      `[Backtest] User ${userId} running backtest: ${data.pair} ${data.timeframe} ${data.strategyPreset}`,
    );

    // ── 0. Deduct points ──
    const { data: balBefore } = await supabaseAdmin
      .from("points_balances")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const currentBalance = (balBefore as { balance: number } | null)?.balance ?? 0;
    if (currentBalance < BACKTEST_POINT_COST) {
      throw new Error(
        `INSUFFICIENT_POINTS:${BACKTEST_POINT_COST}:${currentBalance}`,
      );
    }
    const { error: spendErr } = await supabaseAdmin.rpc("spend_points", {
      _user: userId,
      _amount: BACKTEST_POINT_COST,
      _reason: "analysis_cost",
      _meta: { action: "backtest", pair: data.pair, timeframe: data.timeframe, strategy: data.strategyPreset },
    });
    if (spendErr) {
      console.error(`[Backtest] Failed to spend points for ${userId}:`, spendErr.message);
      throw new Error("Failed to deduct points. Please try again.");
    }

    // ── Validate inputs ──
    if (!VALID_PRESETS.includes(data.strategyPreset)) {
      throw new Error(
        `Invalid strategy preset: "${data.strategyPreset}". Must be one of: ${VALID_PRESETS.join(", ")}`,
      );
    }
    if (!VALID_TIMEFRAMES.includes(data.timeframe)) {
      throw new Error(
        `Invalid timeframe: "${data.timeframe}". Must be one of: ${VALID_TIMEFRAMES.join(", ")}`,
      );
    }

    // ── 1. Fetch OHLCV data ──
    const rawCandles = await fetchOHLCV(data.pair, data.timeframe, 1000);

    // ── 2. Filter by date range if provided ──
    const candles = filterByDateRange(rawCandles, data.startDate, data.endDate);

    if (candles.length < 30) {
      throw new Error(
        `Insufficient data: only ${candles.length} candles after filtering. Need at least 30 bars.`,
      );
    }

    // ── 3. Compile strategy ──
    const strategy = compileStrategy(data.strategyPreset);

    // ── 4. Build backtest config ──
    const periodsPerYear = getPeriodsPerYear(data.timeframe);
    const warmupPeriod = getWarmupPeriod(data.strategyPreset);

    const config = {
      strategy,
      candles,
      initialCapital: data.initialCapital,
      commission: data.commission,
      slippage: data.slippage,
      positionSize: {
        type: "percent" as const,
        value: data.riskPercent / 100,
      },
      allowShort: false,
      warmupPeriod,
      executionTiming: "next_bar_open" as const,
      periodsPerYear,
      riskFreeRate: 0.02,
    };

    // ── 5. Run the backtest ──
    const result = await runBacktest(config);

    console.log(
      `[Backtest] Completed: ${result.metrics.totalTrades} trades, ` +
        `${result.metrics.totalReturn.toFixed(2)}% return, ` +
        `Sharpe ${result.metrics.sharpe.toFixed(2)}`,
    );

    return {
      ...result,
      pointsCost: BACKTEST_POINT_COST,
      remainingBalance: currentBalance - BACKTEST_POINT_COST,
    };
  });

// ============================================================================
// Server Function 2: getBacktestHistory (GET)
// ============================================================================

export const getBacktestHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({ limit: z.number().min(1).max(100).default(20) })
      .parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    // TODO: Persist results to `backtest_results` table, then query:
    //
    // const { supabase } = context;
    // const { data: rows } = await supabase
    //   .from("backtest_results")
    //   .select("*")
    //   .eq("user_id", userId)
    //   .order("created_at", { ascending: false })
    //   .limit(data.limit);
    // return rows ?? [];

    return [];
  });
