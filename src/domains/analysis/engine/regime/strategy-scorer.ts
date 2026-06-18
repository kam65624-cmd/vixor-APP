// ============================================================================
// VIXOR Analysis Engine — Strategy Scorer
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/experiment/scoring.py
//
// Scores a backtest result across multiple dimensions and produces a letter
// grade (A/B/C/D/F). Pure function — no I/O.

import type { BacktestResult, EquityPoint } from "@/domains/backtest/engine/types";
import type { RegimeClassification } from "./regime-detector";

export interface ScoringOpts {
  /** weights per component (0..1, will be normalised) */
  weights?: Partial<ScoringWeights>;
  /** minimum trade count before applying sample-size penalty */
  minTrades?: number;
  /** small-sample penalty threshold */
  smallSampleTrades?: number;
  /** regime classification to compute regimeFit against */
  regime?: RegimeClassification;
}

export interface ScoringWeights {
  return: number;
  annualReturn: number;
  sharpe: number;
  profitFactor: number;
  winRate: number;
  drawdown: number;
  stability: number;
}

export interface StrategyScore {
  /** 0..100 overall weighted score */
  overall: number;
  /** 0..100 per-dimension scores */
  profitability: number;
  consistency: number;
  riskAdjusted: number;
  drawdown: number;
  regimeFit: number;
  /** letter grade */
  grade: "A" | "B" | "C" | "D" | "F";
  /** raw component scores for debugging / UI */
  components: {
    returnScore: number;
    annualReturnScore: number;
    sharpeScore: number;
    profitFactorScore: number;
    winRateScore: number;
    drawdownScore: number;
    stabilityScore: number;
    sampleSizeScore: number;
  };
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  return: 0.22,
  annualReturn: 0.12,
  sharpe: 0.18,
  profitFactor: 0.14,
  winRate: 0.09,
  drawdown: 0.15,
  stability: 0.1,
};

export function scoreStrategy(result: BacktestResult, opts?: ScoringOpts): StrategyScore {
  const weights = { ...DEFAULT_WEIGHTS, ...(opts?.weights ?? {}) };
  const m = result.metrics;
  const totalReturn = m.totalReturn;
  const annualReturn = m.annualReturn;
  const maxDrawdown = Math.abs(m.maxDrawdown);
  const sharpe = m.sharpe;
  const profitFactor = m.profitFactor;
  const winRate = m.winRate;
  const totalTrades = m.totalTrades;

  const returnScore = boundedScore(totalReturn, -20, 80);
  const annualReturnScore = boundedScore(annualReturn, -20, 120);
  const sharpeScore = boundedScore(sharpe, -1, 3);
  const profitFactorScore = boundedScore(profitFactor, 0.7, 2.5);
  const winRateScore = boundedScore(winRate, 35, 70);
  const drawdownScore = inverseScore(maxDrawdown, 5, 45);
  const stabilityScoreVal = computeStabilityScore(result.equityCurve);
  const sampleSizeScore = boundedScore(totalTrades, 5, 80);

  const regimeFit = opts?.regime
    ? estimateRegimeFit(opts.regime, {
        sharpeScore,
        returnScore,
        winRateScore,
        stabilityScore: stabilityScoreVal,
        drawdownScore,
        profitFactorScore,
      })
    : 50;

  const weighted =
    returnScore * weights.return +
    annualReturnScore * weights.annualReturn +
    sharpeScore * weights.sharpe +
    profitFactorScore * weights.profitFactor +
    winRateScore * weights.winRate +
    drawdownScore * weights.drawdown +
    stabilityScoreVal * weights.stability;

  let adjusted = weighted;
  const minTrades = opts?.minTrades ?? 5;
  const smallSample = opts?.smallSampleTrades ?? 12;
  if (totalTrades < minTrades) adjusted -= 12;
  else if (totalTrades < smallSample) adjusted -= 5;

  const overall = Math.max(0, Math.min(100, adjusted * 0.88 + regimeFit * 0.12));

  // Map the seven raw scores into the five user-facing dimensions
  const profitability = Math.round((returnScore + annualReturnScore + profitFactorScore) / 3);
  const consistency = Math.round((stabilityScoreVal + winRateScore) / 2);
  const riskAdjusted = Math.round((sharpeScore + drawdownScore) / 2);
  const drawdownDim = Math.round(drawdownScore);
  const grade = scoreToGrade(overall);

  return {
    overall: Math.round(overall * 100) / 100,
    profitability,
    consistency,
    riskAdjusted,
    drawdown: drawdownDim,
    regimeFit: Math.round(regimeFit),
    grade,
    components: {
      returnScore: Math.round(returnScore),
      annualReturnScore: Math.round(annualReturnScore),
      sharpeScore: Math.round(sharpeScore),
      profitFactorScore: Math.round(profitFactorScore),
      winRateScore: Math.round(winRateScore),
      drawdownScore: Math.round(drawdownScore),
      stabilityScore: Math.round(stabilityScoreVal),
      sampleSizeScore: Math.round(sampleSizeScore),
    },
  };
}

/** Rank a list of items by their `score.overall` (mutates + returns sorted desc).
 *  Each returned item has an added `rank` field (1-based). */
export function rankByScore<T extends { score?: { overall?: number } }>(
  items: T[],
): Array<T & { rank: number }> {
  return items
    .map((item, idx) => ({ item, idx }))
    .sort((a, b) => (b.item.score?.overall ?? 0) - (a.item.score?.overall ?? 0))
    .map((entry, i) => ({ ...entry.item, rank: i + 1 }) as T & { rank: number });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function boundedScore(value: number, floor: number, ceiling: number): number {
  if (ceiling <= floor) return 50;
  const ratio = (value - floor) / (ceiling - floor);
  return Math.max(0, Math.min(100, ratio * 100));
}

function inverseScore(value: number, floor: number, ceiling: number): number {
  if (ceiling <= floor) return 50;
  const ratio = (value - floor) / (ceiling - floor);
  return Math.max(0, Math.min(100, (1 - ratio) * 100));
}

function computeStabilityScore(equityCurve: EquityPoint[]): number {
  if (equityCurve.length < 3) return 45;
  const values = equityCurve.map((p) => p.equity);
  let positiveSteps = 0;
  let totalSteps = 0;
  for (let i = 1; i < values.length; i++) {
    totalSteps++;
    if (values[i] >= values[i - 1]) positiveSteps++;
  }
  const monotonicity = totalSteps > 0 ? positiveSteps / totalSteps : 0;
  return Math.max(0, Math.min(100, monotonicity * 100));
}

function estimateRegimeFit(
  regime: RegimeClassification,
  components: {
    sharpeScore: number;
    returnScore: number;
    winRateScore: number;
    stabilityScore: number;
    drawdownScore: number;
    profitFactorScore: number;
  },
): number {
  const key = regime.regimeKey;
  if (key === "bull_trend" || key === "bear_trend") {
    return Math.min(100, components.sharpeScore * 0.5 + components.returnScore * 0.5);
  }
  if (key === "range_compression") {
    return Math.min(100, components.winRateScore * 0.6 + components.stabilityScore * 0.4);
  }
  if (key === "high_volatility") {
    return Math.min(100, components.drawdownScore * 0.6 + components.profitFactorScore * 0.4);
  }
  return Math.min(100, components.stabilityScore * 0.5 + components.sharpeScore * 0.5);
}

function scoreToGrade(score: number): "A" | "B" | "C" | "D" | "F" {
  if (score >= 85) return "A";
  if (score >= 72) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}
