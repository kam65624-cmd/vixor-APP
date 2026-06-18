// ============================================================================
// VIXOR Experiment — Experiment Runner
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/experiment/runner.py
//
// Orchestrates a full experiment: detect regime → build parameter space →
// evolve → score → persist results. The runner is the public entrypoint used
// by API routes.

import { runBacktest, type BacktestConfig, type BacktestResult } from "@/domains/backtest/engine";
import {
  detectRegime,
  type RegimeClassification,
} from "@/domains/analysis/engine/regime/regime-detector";
import {
  scoreStrategy,
  type StrategyScore,
} from "@/domains/analysis/engine/regime/strategy-scorer";
import {
  EvolutionEngine,
  type EvolutionConfig,
  type EvolutionResult,
  type ParameterSpace,
} from "./evolution";
import {
  buildRoundPrompt,
  buildStrategyTemplatePrompt,
  extractIndicatorParams,
  parseLlmCandidates,
  SYSTEM_PROMPT,
  type LlmCandidate,
  type PreviousResult,
} from "./prompts";
import type { Candle } from "@/domains/backtest/engine/types";

export interface ExperimentConfig {
  /** strategy template name (e.g. "sma_crossover") */
  strategyTemplate: string;
  /** source code of the strategy (for @param extraction + LLM context) */
  strategySource?: string;
  /** parameter space to explore */
  parameterSpace: ParameterSpace;
  /** factory that builds a BacktestConfig from a parameter assignment */
  buildBacktest: (params: Record<string, number | string | boolean>) => BacktestConfig;
  generations: number;
  populationSize: number;
  method?: "grid" | "random";
  fitnessWeights?: Partial<Record<keyof StrategyScore, number>>;
  assetSymbol: string;
  timeframe: string;
  dateRange: { from: Date; to: Date };
  /** optional candle slice (skip if you prefer the runner to fetch) */
  candles?: Candle[];
  /** early-stop score threshold (default 82) */
  earlyStopScore?: number;
  /** evolution seed for reproducibility */
  seed?: number;
  /** user id (for Supabase persistence) */
  userId?: string;
  /** optional LLM router (from Agent 2's @/shared/llm/) — if absent, runner
   *  skips the LLM-driven candidate generation step */
  llmRouter?: LlmRouterLike;
}

export interface LlmRouterLike {
  chat(
    messages: Array<{ role: "system" | "user"; content: string }>,
    opts?: { temperature?: number; jsonMode?: boolean },
  ): Promise<string>;
}

export interface ExperimentResult {
  experimentId?: string;
  regime: RegimeClassification | null;
  evolution: EvolutionResult;
  rankedStrategies: Array<{
    params: Record<string, number | string | boolean>;
    score: StrategyScore | null;
    result: BacktestResult | null;
  }>;
  bestStrategy: {
    params: Record<string, number | string | boolean>;
    score: StrategyScore | null;
    summary: {
      totalReturn: number;
      maxDrawdown: number;
      sharpe: number;
      totalTrades: number;
    } | null;
  } | null;
  /** generator hints for downstream UIs */
  generatorHints: {
    preferredFamilies: string[];
    regime: string;
    promptHint: string;
  } | null;
  /** elapsed wall-clock time (ms) */
  elapsedMs: number;
  /** LLM-driven candidate suggestions (if LLM router was provided) */
  llmCandidates?: LlmCandidate[];
}

/**
 * Orchestrates a full experiment run.
 *
 * Flow:
 *   1. Detect regime (if candles are supplied)
 *   2. If an LLM router is provided, generate a first round of LLM candidates
 *      and backtest them
 *   3. Run the genetic evolution for N generations
 *   4. Rank + persist (persistence is delegated to the caller via `onResult`)
 */
export class ExperimentRunner {
  /**
   * Run a full experiment. Returns the full result; does not throw on
   * individual-backtest failures (they're recorded as null scores).
   */
  async run(config: ExperimentConfig): Promise<ExperimentResult> {
    const t0 = Date.now();
    let regime: RegimeClassification | null = null;
    if (config.candles && config.candles.length >= 30) {
      try {
        regime = detectRegime(config.candles);
      } catch {
        regime = null;
      }
    }

    // Optional LLM candidate generation
    let llmCandidates: LlmCandidate[] | undefined;
    if (config.llmRouter && config.strategySource) {
      try {
        const indicatorParams = extractIndicatorParams(config.strategySource);
        const prompt = buildRoundPrompt({
          indicatorCode: config.strategySource,
          indicatorParams,
          regime,
          previousResults: null,
          roundNumber: 1,
          nCandidates: 5,
        });
        const raw = await config.llmRouter.chat(
          [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: prompt },
          ],
          { temperature: 0.7, jsonMode: true },
        );
        llmCandidates = parseLlmCandidates(raw);
      } catch {
        llmCandidates = [];
      }
    }

    const evolutionConfig: EvolutionConfig = {
      buildBacktest: config.buildBacktest,
      parameterSpace: config.parameterSpace,
      populationSize: config.populationSize,
      method: config.method ?? "grid",
      regime: regime ?? undefined,
      seed: config.seed,
    };
    const engine = new EvolutionEngine(evolutionConfig);
    const earlyStop = config.earlyStopScore ?? 82;

    // We run one generation at a time so we can early-stop on score threshold.
    const generations: EvolutionResult["generations"] = [];
    const history: EvolutionResult["history"] = [];
    let best: EvolutionResult["best"] = null;
    for (let g = 0; g < config.generations; g++) {
      const partial = await engine.run(1);
      generations.push(...partial.generations);
      history.push(...partial.history);
      if (
        partial.best &&
        (best === null || (partial.best.score?.overall ?? 0) > (best.score?.overall ?? 0))
      ) {
        best = partial.best;
      }
      if (best && (best.score?.overall ?? 0) >= earlyStop) break;
    }

    // Rank all evaluated individuals
    const ranked = history
      .map((ind) => ({
        params: ind.params,
        score: ind.score,
        result: ind.result,
      }))
      .sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));

    const bestStrategy = best
      ? {
          params: best.params,
          score: best.score,
          summary: best.result
            ? {
                totalReturn: best.result.metrics.totalReturn,
                maxDrawdown: best.result.metrics.maxDrawdown,
                sharpe: best.result.metrics.sharpe,
                totalTrades: best.result.metrics.totalTrades,
              }
            : null,
        }
      : null;

    const generatorHints = regime
      ? {
          preferredFamilies: regime.strategyFamilies.slice(0, 3),
          regime: regime.regime,
          promptHint: `Focus on ${regime.strategyFamilies.slice(0, 2).join(", ") || "robust"} setups under ${regime.label} conditions with risk controls.`,
        }
      : null;

    return {
      regime,
      evolution: { generations, best, history },
      rankedStrategies: ranked,
      bestStrategy,
      generatorHints,
      elapsedMs: Date.now() - t0,
      llmCandidates,
    };
  }

  /** Helper: build a per-experiment unique prompt for the LLM to suggest a template. */
  buildTemplatePrompt(regime: RegimeClassification): string {
    return buildStrategyTemplatePrompt(regime);
  }

  /** Helper: build a per-experiment summary of previous rounds (for LLM input). */
  buildPreviousResultsList(history: EvolutionResult["history"]): PreviousResult[] {
    return history
      .filter((h) => h.score !== null && h.result !== null)
      .slice(-10)
      .map((h) => ({
        name: `gen${h.generation}`,
        score: { overall: h.score?.overall, grade: h.score?.grade },
        result: {
          totalReturn: h.result?.metrics.totalReturn,
          maxDrawdown: h.result?.metrics.maxDrawdown,
          sharpeRatio: h.result?.metrics.sharpe,
          totalTrades: h.result?.metrics.totalTrades,
        },
      }));
  }
}

/**
 * Convenience: run a single backtest with the given config. Useful for
 * non-evolution experiments or sanity-checks.
 */
export async function runSingleBacktest(config: BacktestConfig): Promise<{
  result: BacktestResult;
  score: StrategyScore;
}> {
  const result = await runBacktest(config);
  const score = scoreStrategy(result);
  return { result, score };
}

export type { BacktestConfig, BacktestResult, ParameterSpace, RegimeClassification, StrategyScore };
