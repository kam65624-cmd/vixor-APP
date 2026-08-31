// ============================================================================
// VIXOR Experiment — Strategy Evolution Engine
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/experiment/evolution.py
//
// Genetic-algorithm-style parameter exploration: builds variants from a
// structured parameter space (grid or random), then — when paired with the
// backtest engine + scorer — evolves a population across generations.

import { runBacktest, type BacktestConfig, type BacktestResult } from "@/domains/backtest/engine";
import {
  scoreStrategy,
  type StrategyScore,
} from "@/domains/analysis/engine/regime/strategy-scorer";
import type { RegimeClassification } from "@/domains/analysis/engine/regime/regime-detector";

/** A single tunable parameter spec. */
export interface ParameterSpec {
  /** numeric range — produces `min`, `min+step`, ... `max` */
  min?: number;
  max?: number;
  step?: number;
  /** explicit value list — takes precedence over range */
  values?: Array<number | string | boolean>;
}

export type ParameterSpace = Record<string, ParameterSpec | Array<number | string | boolean>>;

export interface EvolutionConfig {
  /** factory that builds a fresh BacktestConfig from a parameter assignment */
  buildBacktest: (params: Record<string, number | string | boolean>) => BacktestConfig;
  parameterSpace: ParameterSpace;
  populationSize?: number;
  /** "grid" | "random" for the initial population */
  method?: "grid" | "random";
  /** mutation probability per gene (default 0.15) */
  mutationRate?: number;
  /** fraction of population kept as elites each generation (default 0.2) */
  eliteFraction?: number;
  /** concurrency limit for backtests within a generation (default 4) */
  concurrency?: number;
  /** optional regime used by the scorer */
  regime?: RegimeClassification;
  /** RNG seed for reproducibility */
  seed?: number;
}

export interface Individual {
  params: Record<string, number | string | boolean>;
  score: StrategyScore | null;
  result: BacktestResult | null;
  generation: number;
}

export interface GenerationStats {
  generation: number;
  bestScore: number | null;
  avgScore: number | null;
  population: Array<{
    params: Record<string, number | string | boolean>;
    score: StrategyScore | null;
  }>;
}

export interface EvolutionResult {
  generations: GenerationStats[];
  best: Individual | null;
  history: Individual[];
}

/**
 * Genetic-algorithm evolution engine for strategy parameters.
 */
export class EvolutionEngine {
  private config: EvolutionConfig;
  private rng: () => number;

  constructor(config: EvolutionConfig) {
    this.config = config;
    const seed = config.seed ?? 0;
    this.rng = seed > 0 ? mulberry32(seed) : Math.random;
  }

  async run(generations: number): Promise<EvolutionResult> {
    const populationSize = this.config.populationSize ?? 12;
    const method = this.config.method ?? "grid";
    const mutationRate = this.config.mutationRate ?? 0.15;
    const eliteFraction = this.config.eliteFraction ?? 0.2;
    const concurrency = this.config.concurrency ?? 4;

    // Initial population
    let population = this.initialPopulation(populationSize, method);

    const generationStats: GenerationStats[] = [];
    const history: Individual[] = [];

    for (let g = 0; g < generations; g++) {
      const scored = await this.scoreBatch(population, concurrency, g);
      scored.sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0));

      const scores = scored.map((i) => i.score?.overall ?? 0).filter((s) => Number.isFinite(s));
      const best = scores.length > 0 ? Math.max(...scores) : null;
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;

      generationStats.push({
        generation: g,
        bestScore: best,
        avgScore: avg,
        population: scored.map((i) => ({ params: i.params, score: i.score })),
      });
      history.push(...scored);

      if (g === generations - 1) break;

      // Selection + breeding for next generation
      const eliteCount = Math.max(1, Math.floor(scored.length * eliteFraction));
      const elites = scored.slice(0, eliteCount);
      const next: Array<Record<string, number | string | boolean>> = elites.map((e) => ({
        ...e.params,
      }));

      while (next.length < populationSize) {
        const parentA = this.tournament(scored);
        const parentB = this.tournament(scored);
        const child = this.crossover(parentA, parentB);
        this.mutate(child, mutationRate);
        next.push(child);
      }
      population = next;
    }

    const best =
      history
        .filter((i) => i.score !== null)
        .sort((a, b) => (b.score?.overall ?? 0) - (a.score?.overall ?? 0))[0] ?? null;

    return { generations: generationStats, best, history };
  }

  // -----------------------------------------------------------------------
  // Initial population
  // -----------------------------------------------------------------------
  private initialPopulation(
    size: number,
    method: "grid" | "random",
  ): Array<Record<string, number | string | boolean>> {
    const space = this.config.parameterSpace;
    const keys = Object.keys(space);
    if (keys.length === 0) return [{}];

    const resolved: Record<string, Array<number | string | boolean>> = {};
    for (const k of keys) resolved[k] = resolveValues(space[k]);

    if (method === "grid") {
      const combos = cartesianProduct(keys.map((k) => resolved[k]));
      const out: Array<Record<string, number | string | boolean>> = [];
      for (const combo of combos) {
        const params: Record<string, number | string | boolean> = {};
        keys.forEach((k, i) => (params[k] = combo[i]));
        out.push(params);
        if (out.length >= size) break;
      }
      return out;
    }

    // random
    const out: Array<Record<string, number | string | boolean>> = [];
    for (let i = 0; i < size; i++) {
      const params: Record<string, number | string | boolean> = {};
      for (const k of keys) {
        params[k] = resolved[k][Math.floor(this.rng() * resolved[k].length)];
      }
      out.push(params);
    }
    return out;
  }

  // -----------------------------------------------------------------------
  // Selection / breeding
  // -----------------------------------------------------------------------
  private tournament(population: Individual[]): Record<string, number | string | boolean> {
    const a = population[Math.floor(this.rng() * population.length)];
    const b = population[Math.floor(this.rng() * population.length)];
    const aScore = a.score?.overall ?? 0;
    const bScore = b.score?.overall ?? 0;
    return { ...(aScore >= bScore ? a : b).params };
  }

  private crossover(
    a: Record<string, number | string | boolean>,
    b: Record<string, number | string | boolean>,
  ): Record<string, number | string | boolean> {
    const child: Record<string, number | string | boolean> = {};
    for (const k of Object.keys(this.config.parameterSpace)) {
      const choices = [a[k], b[k]];
      child[k] = choices[Math.floor(this.rng() * 2) % 2];
    }
    return child;
  }

  private mutate(params: Record<string, number | string | boolean>, rate: number): void {
    const space = this.config.parameterSpace;
    for (const k of Object.keys(space)) {
      if (this.rng() < rate) {
        const values = resolveValues(space[k]);
        if (values.length > 0) {
          params[k] = values[Math.floor(this.rng() * values.length)];
        }
      }
    }
  }

  // -----------------------------------------------------------------------
  // Batch scoring (concurrency-limited)
  // -----------------------------------------------------------------------
  private async scoreBatch(
    population: Array<Record<string, number | string | boolean>>,
    concurrency: number,
    generation: number,
  ): Promise<Individual[]> {
    const individuals: Individual[] = population.map((params) => ({
      params,
      score: null,
      result: null,
      generation,
    }));
    const queue = individuals.slice();
    const workers = Array.from(
      { length: Math.max(1, Math.min(concurrency, queue.length)) },
      async () => {
        while (queue.length > 0) {
          const ind = queue.shift();
          if (!ind) break;
          try {
            const cfg = this.config.buildBacktest(ind.params);
            const result = await runBacktest(cfg);
            ind.result = result;
            ind.score = scoreStrategy(result, { regime: this.config.regime });
          } catch {
            ind.result = null;
            ind.score = null;
          }
        }
      },
    );
    await Promise.all(workers);
    return individuals;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function resolveValues(
  spec: ParameterSpec | Array<number | string | boolean>,
): Array<number | string | boolean> {
  if (Array.isArray(spec)) return spec;
  if (spec.values && spec.values.length > 0) return spec.values;
  const min = spec.min;
  const max = spec.max;
  const step = spec.step ?? 1;
  if (min === undefined || max === undefined) return [];
  if (step === 0) return [min];
  const out: Array<number | string | boolean> = [];
  let cursor = min;
  while (cursor <= max + 1e-9) {
    out.push(Math.round(cursor * 1e10) / 1e10);
    cursor += step;
  }
  return out;
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  if (arrays.length === 0) return [[]];
  const [first, ...rest] = arrays;
  const restProduct = cartesianProduct(rest);
  const out: T[][] = [];
  for (const v of first) {
    for (const combo of restProduct) {
      out.push([v, ...combo]);
    }
  }
  return out;
}

/** Tiny seeded RNG (mulberry32) for reproducible evolution runs. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type { BacktestConfig, BacktestResult, RegimeClassification, StrategyScore };
