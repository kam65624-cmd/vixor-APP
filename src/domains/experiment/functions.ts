// ============================================================================
// VIXOR Experiment Domain — Server Functions
// ============================================================================
//
// CRUD + async runner for the experiment system. Replaces mock data in the
// experiments page with real Supabase persistence + experiment runner
// integration.
//
// Server functions:
//   listExperiments  — GET  all experiments for current user
//   getExperiment    — GET  single experiment + generation history
//   createExperiment — POST insert record → fire-and-forget runner → return id
//   cancelExperiment — POST set status to "cancelled"
//
// Internal helpers:
//   runExperimentAsync — fetches OHLCV → builds config → runs runner → persists
// ============================================================================

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";
import { supabaseAdmin } from "@/shared/supabase/client.server";
import { fetchBinanceKlines, fetchTwelveDataKlines } from "@/domains/market/server/price-fetcher";
import { type BacktestConfig, type Candle } from "@/domains/backtest/engine";
import { AssetRegistry } from "@/shared/asset-registry";
import {
  ExperimentRunner,
  type ExperimentConfig,
  type ExperimentResult,
  type ParameterSpace,
} from "./runner";

// ---------------------------------------------------------------------------
// 1. listExperiments
// ---------------------------------------------------------------------------

export const listExperiments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("experiments")
      .select("id, user_id, config, result, status, created_at, completed_at")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data ?? [];
  });

// ---------------------------------------------------------------------------
// 2. getExperiment
// ---------------------------------------------------------------------------

export const getExperiment = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Fetch experiment
    const { data: experiment, error: expErr } = await context.supabase
      .from("experiments")
      .select("id, user_id, config, result, status, created_at, completed_at")
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();

    if (expErr) throw new Error(expErr.message);
    if (!experiment) throw new Error("Experiment not found");

    // Fetch generation history
    const { data: generations, error: genErr } = await context.supabase
      .from("experiment_generations")
      .select("id, experiment_id, generation, best_score, avg_score, population, created_at")
      .eq("experiment_id", data.id)
      .order("generation", { ascending: true });

    if (genErr) throw new Error(genErr.message);

    return {
      ...experiment,
      generations: generations ?? [],
    };
  });

// ---------------------------------------------------------------------------
// 3. createExperiment
// ---------------------------------------------------------------------------

export const createExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    (d: unknown) =>
      z
        .object({
          name: z.string().min(1).max(128),
          assetSymbol: z.string().min(1).max(32),
          timeframe: z.string().min(1).max(16),
          strategyTemplate: z.string().min(1).max(64).default("sma_crossover"),
          generations: z.number().int().min(1).max(20).default(3),
          populationSize: z.number().int().min(2).max(50).default(8),
        })
        .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { userId } = context;

    const config = {
      name: data.name,
      assetSymbol: data.assetSymbol,
      timeframe: data.timeframe,
      strategyTemplate: data.strategyTemplate,
      generations: data.generations,
      populationSize: data.populationSize,
      createdAt: new Date().toISOString(),
    };

    // Insert experiment with status "running" via admin client (RLS bypass for insert)
    const { data: experiment, error } = await supabaseAdmin
      .from("experiments")
      .insert({
        user_id: userId,
        config,
        status: "running",
      })
      .select("id")
      .single();

    if (error) throw new Error(error.message);

    // Fire-and-forget: run the experiment asynchronously
    void runExperimentAsync(experiment.id, userId, config);

    return { id: experiment.id, status: "running" };
  });

// ---------------------------------------------------------------------------
// 4. cancelExperiment
// ---------------------------------------------------------------------------

export const cancelExperiment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    // Use admin client to bypass RLS for status update
    const { error } = await supabaseAdmin
      .from("experiments")
      .update({
        status: "cancelled",
        completed_at: new Date().toISOString(),
      })
      .eq("id", data.id)
      .eq("user_id", context.userId);

    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------------------------------------------------------------------------
// 5. runExperimentAsync — Internal helper (fire-and-forget)
// ---------------------------------------------------------------------------

/**
 * Asynchronous experiment runner. Called with `void runExperimentAsync(...)` —
 * errors are caught internally and written to the experiment record.
 *
 * Flow:
 *   1. Fetch OHLCV candles from Binance (crypto) or TwelveData (forex/commodity)
 *   2. Build a simple SMA crossover buildBacktest factory
 *   3. Build ExperimentConfig with parameter space
 *   4. Run ExperimentRunner.run() (cap generations at 5 for speed)
 *   5. Persist each generation to experiment_generations
 *   6. Update experiment status to "completed" or "failed"
 */
async function runExperimentAsync(
  experimentId: string,
  userId: string,
  rawConfig: Record<string, unknown>,
): Promise<void> {
  const assetSymbol = String(rawConfig.assetSymbol ?? "BTC/USDT");
  const timeframe = String(rawConfig.timeframe ?? "1h");
  const strategyTemplate = String(rawConfig.strategyTemplate ?? "sma_crossover");
  const generations = Math.min(
    Math.max(1, Number(rawConfig.generations) || 3),
    5, // cap at 5 for MVP speed
  );
  const populationSize = Math.min(
    Math.max(2, Number(rawConfig.populationSize) || 8),
    20, // cap at 20 for MVP speed
  );

  try {
    // ----------------------------------------------------------
    // Step 1: Fetch OHLCV candles
    // ----------------------------------------------------------
    const candles = await fetchCandles(assetSymbol, timeframe, 200);
    if (!candles || candles.length < 30) {
      throw new Error(
        `Insufficient candle data: got ${candles?.length ?? 0} bars (need ≥ 30)`,
      );
    }

    // ----------------------------------------------------------
    // Step 2: Build parameter space based on strategy template
    // ----------------------------------------------------------
    const parameterSpace = buildParameterSpace(strategyTemplate);

    // ----------------------------------------------------------
    // Step 3: Build ExperimentConfig
    // ----------------------------------------------------------
    const firstCandleTime = candles[0].time * 1000;
    const lastCandleTime = candles[candles.length - 1].time * 1000;
    const experimentConfig: ExperimentConfig = {
      strategyTemplate,
      parameterSpace,
      buildBacktest: (params) =>
        buildSmaBacktestConfig(candles, params, timeframe),
      generations,
      populationSize,
      method: "grid",
      assetSymbol,
      timeframe,
      dateRange: {
        from: new Date(firstCandleTime),
        to: new Date(lastCandleTime),
      },
      candles,
      earlyStopScore: 85,
      seed: Date.now(),
      userId,
    };

    // ----------------------------------------------------------
    // Step 4: Run experiment
    // ----------------------------------------------------------
    const runner = new ExperimentRunner();
    const result: ExperimentResult = await runner.run(experimentConfig);

    // ----------------------------------------------------------
    // Step 5: Persist generation snapshots
    // ----------------------------------------------------------
    for (const gen of result.evolution.generations) {
      await supabaseAdmin.from("experiment_generations").insert({
        experiment_id: experimentId,
        generation: gen.generation,
        best_score: gen.bestScore,
        avg_score: gen.avgScore,
        population: gen.population.map((p) => ({
          params: p.params,
          score: p.score,
        })),
      });
    }

    // ----------------------------------------------------------
    // Step 6: Mark experiment completed
    // ----------------------------------------------------------
    // Serialize result for storage (strip heavy equity curves / trade arrays)
    const serializableResult = serializeResult(result);

    await supabaseAdmin
      .from("experiments")
      .update({
        status: "completed",
        result: serializableResult,
        completed_at: new Date().toISOString(),
      })
      .eq("id", experimentId);

    console.log(
      `[ExperimentRunner] Experiment ${experimentId} completed in ${result.elapsedMs}ms`,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[ExperimentRunner] Experiment ${experimentId} failed:`, message);

    // Update experiment status to failed
    await supabaseAdmin
      .from("experiments")
      .update({
        status: "failed",
        result: { error: message },
        completed_at: new Date().toISOString(),
      })
      .eq("id", experimentId);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Fetch OHLCV candles — routes to Binance for crypto, TwelveData for
 * forex / commodities.
 */
async function fetchCandles(
  assetSymbol: string,
  timeframe: string,
  limit: number,
): Promise<Candle[]> {
  if (AssetRegistry.isCrypto(assetSymbol)) {
    const bars = await fetchBinanceKlines(assetSymbol, timeframe, limit);
    return bars.map((b) => ({
      time: b.time,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.volume,
    }));
  }

  // Forex / commodity — use TwelveData
  const bars = await fetchTwelveDataKlines(assetSymbol, timeframe, limit);
  return bars.map((b) => ({
    time: b.time,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));
}

/**
 * Build a parameter space based on the strategy template name.
 * Returns a ParameterSpace dict with tunable ranges.
 */
function buildParameterSpace(
  strategyTemplate: string,
): ParameterSpace {
  switch (strategyTemplate) {
    case "sma_crossover":
    default:
      return {
        fastPeriod: { min: 5, max: 30, step: 5 },
        slowPeriod: { min: 20, max: 60, step: 10 },
        stopLossPct: [0.01, 0.02, 0.03, 0.05],
        takeProfitPct: [0.02, 0.04, 0.06, 0.08],
        positionSize: [0.1, 0.25, 0.5],
      };
    case "rsi_reversal":
      return {
        rsiPeriod: { min: 7, max: 21, step: 2 },
        oversold: [25, 30, 35],
        overbought: [65, 70, 75],
        stopLossPct: [0.01, 0.02, 0.03],
        takeProfitPct: [0.02, 0.04, 0.06],
        positionSize: [0.1, 0.25, 0.5],
      };
    case "breakout":
      return {
        lookback: { min: 10, max: 40, step: 5 },
        atrMultiplier: [1.0, 1.5, 2.0, 2.5],
        stopLossPct: [0.01, 0.02, 0.03, 0.05],
        takeProfitPct: [0.03, 0.05, 0.08],
        positionSize: [0.1, 0.25, 0.5],
      };
    case "macd_momentum":
      return {
        fastEma: [8, 10, 12],
        slowEma: [20, 24, 26],
        signalPeriod: [7, 9, 11],
        stopLossPct: [0.01, 0.02, 0.03],
        takeProfitPct: [0.03, 0.05, 0.08],
        positionSize: [0.1, 0.25, 0.5],
      };
  }
}

/**
 * Build a BacktestConfig with a simple SMA crossover strategy.
 * This is a lightweight, no-LLM strategy for fast iteration.
 *
 * The strategy computes two SMAs on the close price and goes long when
 * fast crosses above slow, goes flat when fast crosses below slow.
 */
function buildSmaBacktestConfig(
  candles: Candle[],
  params: Record<string, number | string | boolean>,
  timeframe: string,
): BacktestConfig {
  const fastPeriod = Number(params.fastPeriod) || 10;
  const slowPeriod = Number(params.slowPeriod) || 20;
  const stopLossPct = Number(params.stopLossPct) || 0.02;
  const takeProfitPct = Number(params.takeProfitPct) || 0.04;
  const positionSize = Number(params.positionSize) || 0.25;

  // Precompute SMAs
  const fastSma = computeSma(candles, fastPeriod);
  const slowSma = computeSma(candles, slowPeriod);

  // Build a simple SMA crossover strategy.
  // Goes long when fast SMA crosses above slow SMA, closes when it crosses below.
  // Stop-loss / take-profit are set as absolute prices on each buy order.
  const strategy = {
    onBar(ctx: {
      readonly bar: Candle;
      readonly bars: readonly Candle[];
      readonly currentIndex: number;
      readonly position: { side: string };
      buy: (opts: { qty?: number; stopLoss?: number; takeProfit?: number }) => void;
      close: () => void;
    }) {
      const i = ctx.currentIndex;
      if (i < slowPeriod) return;

      const fast = fastSma[i];
      const slow = slowSma[i];
      if (fast === null || slow === null) return;

      const prevFast = i > 0 ? fastSma[i - 1] : null;
      const prevSlow = i > 0 ? slowSma[i - 1] : null;

      const price = ctx.bar.close;

      if (ctx.position.side === "flat") {
        // Buy signal: fast SMA crosses above slow SMA
        if (
          prevFast !== null &&
          prevSlow !== null &&
          prevFast <= prevSlow &&
          fast > slow
        ) {
          ctx.buy({
            stopLoss: stopLossPct > 0 ? price * (1 - stopLossPct) : undefined,
            takeProfit: takeProfitPct > 0 ? price * (1 + takeProfitPct) : undefined,
          });
        }
      } else {
        // Close signal: fast SMA crosses below slow SMA
        if (
          prevFast !== null &&
          prevSlow !== null &&
          prevFast >= prevSlow &&
          fast < slow
        ) {
          ctx.close();
        }
      }
    },
  };

  return {
    strategy: strategy as BacktestConfig["strategy"],
    candles,
    initialCapital: 10_000,
    commission: 0.0006, // 6 bps
    slippage: 0.0002, // 2 bps
    positionSize: { type: "percent", value: positionSize },
    allowShort: false,
    maxConcurrentPositions: 1,
    warmupPeriod: slowPeriod,
    executionTiming: "next_bar_open",
    periodsPerYear: timeframeToPeriodsPerYear(timeframe),
    riskFreeRate: 0.02,
  };
}

/**
 * Simple SMA computation. Returns array same length as candles, with null
 * for indices where there isn't enough data.
 */
function computeSma(
  candles: Candle[],
  period: number,
): (number | null)[] {
  const result: (number | null)[] = new Array(candles.length).fill(null);
  if (period <= 0 || candles.length < period) return result;

  let sum = 0;
  for (let i = 0; i < candles.length; i++) {
    sum += candles[i].close;
    if (i >= period) {
      sum -= candles[i - period].close;
    }
    if (i >= period - 1) {
      result[i] = sum / period;
    }
  }
  return result;
}

/**
 * Convert timeframe string to periods-per-year for annualization.
 */
function timeframeToPeriodsPerYear(timeframe: string): number {
  const tf = timeframe.toLowerCase();
  if (tf === "1m") return 365 * 24 * 60;
  if (tf === "5m") return 365 * 24 * 12;
  if (tf === "15m") return 365 * 24 * 4;
  if (tf === "30m") return 365 * 24 * 2;
  if (tf === "1h") return 365 * 24;
  if (tf === "2h") return 365 * 12;
  if (tf === "4h") return 365 * 6;
  if (tf === "6h") return 365 * 4;
  if (tf === "12h") return 365 * 2;
  if (tf === "1d") return 365;
  if (tf === "1w") return 52;
  return 252; // sensible default
}

/**
 * Serialize an ExperimentResult for JSONB storage.
 * Strips heavy equity curves and full trade arrays to keep the JSONB
 * column size reasonable while preserving all useful metrics.
 */
function serializeResult(result: ExperimentResult): Record<string, unknown> {
  return {
    regime: result.regime
      ? {
          regime: result.regime.regime,
          label: result.regime.label,
          confidence: result.regime.confidence,
          strategyFamilies: result.regime.strategyFamilies,
        }
      : null,
    bestStrategy: result.bestStrategy
      ? {
          params: result.bestStrategy.params,
          score: result.bestStrategy.score,
          summary: result.bestStrategy.summary,
        }
      : null,
    generatorHints: result.generatorHints,
    elapsedMs: result.elapsedMs,
    rankedStrategies: result.rankedStrategies.slice(0, 20).map((s) => ({
      params: s.params,
      score: s.score,
      summary: s.result
        ? {
            totalReturn: s.result.metrics.totalReturn,
            maxDrawdown: s.result.metrics.maxDrawdown,
            sharpe: s.result.metrics.sharpe,
            totalTrades: s.result.metrics.totalTrades,
          }
        : null,
    })),
    totalGenerations: result.evolution.generations.length,
    totalEvaluated: result.evolution.history.length,
  };
}
