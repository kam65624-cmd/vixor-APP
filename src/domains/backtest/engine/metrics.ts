// ============================================================================
// VIXOR Backtest Engine — Performance Metrics
// ============================================================================
// Pure functions. No side effects. All inputs are plain arrays so they can be
// unit-tested in isolation and re-used by the experiment scorer.

import type { BacktestMetrics, EquityPoint, Trade } from "./types";

export interface MetricComputationInput {
  equityCurve: EquityPoint[];
  trades: Trade[];
  initialCapital: number;
  /** periods per year (e.g. 252 daily) */
  periodsPerYear: number;
  riskFreeRate?: number;
  totalCommission?: number;
}

const EPS = 1e-12;

function safeDiv(a: number, b: number): number {
  if (!Number.isFinite(b) || Math.abs(b) < EPS) return 0;
  return a / b;
}

function annualizationFactor(periodsPerYear: number): number {
  if (!Number.isFinite(periodsPerYear) || periodsPerYear <= 0) return 252;
  return periodsPerYear;
}

/**
 * Compute equity returns (per-bar fractional returns).
 * Filters zero/negative equity (post-liquidation) to avoid division noise.
 */
export function computeReturns(equity: number[]): number[] {
  if (equity.length < 2) return [];
  const out: number[] = new Array(equity.length - 1);
  for (let i = 1; i < equity.length; i++) {
    const prev = equity[i - 1];
    const curr = equity[i];
    if (!Number.isFinite(prev) || prev <= 0 || !Number.isFinite(curr)) {
      out[i - 1] = 0;
    } else {
      out[i - 1] = (curr - prev) / prev;
    }
  }
  return out;
}

/** Population standard deviation (ddof=0). */
export function stdDev(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  let sum = 0;
  let sq = 0;
  let count = 0;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    sum += v;
    sq += v * v;
    count++;
  }
  if (count === 0) return 0;
  const mean = sum / count;
  // population variance
  const variance = Math.max(0, sq / count - mean * mean);
  return Math.sqrt(variance);
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  let sum = 0;
  for (const v of values) sum += v;
  return sum / values.length;
}

/**
 * Sharpe ratio (annualised).
 *  Sharpe = (annualised return - risk-free) / annualised volatility
 */
export function sharpeRatio(equity: number[], periodsPerYear: number, riskFreeRate = 0.02): number {
  if (equity.length < 2) return 0;
  const returns = computeReturns(equity);
  const valid = returns.filter((r) => Number.isFinite(r));
  if (valid.length === 0) return 0;
  const af = annualizationFactor(periodsPerYear);
  const avgReturn = mean(valid) * af;
  const std = stdDev(valid) * Math.sqrt(af);
  if (!Number.isFinite(std) || std < EPS) return 0;
  const s = (avgReturn - riskFreeRate) / std;
  return Number.isFinite(s) ? s : 0;
}

/**
 * Sortino ratio (annualised). Uses downside deviation only.
 */
export function sortinoRatio(
  equity: number[],
  periodsPerYear: number,
  riskFreeRate = 0.02,
): number {
  if (equity.length < 2) return 0;
  const returns = computeReturns(equity);
  const downside: number[] = [];
  for (const r of returns) {
    if (Number.isFinite(r) && r < 0) downside.push(r * r);
  }
  if (downside.length === 0) return 0;
  const downsideDev = Math.sqrt(mean(downside));
  if (downsideDev < EPS) return 0;
  const af = annualizationFactor(periodsPerYear);
  const avgReturn = mean(returns.filter((r) => Number.isFinite(r))) * af;
  const s = (avgReturn - riskFreeRate) / (downsideDev * Math.sqrt(af));
  return Number.isFinite(s) ? s : 0;
}

export interface DrawdownResult {
  maxDrawdownPct: number; // positive number
  maxDrawdownAbs: number;
  maxDrawdownDuration: number; // bars
  drawdownSeries: number[]; // per-point drawdown fraction (0..1)
}

/**
 * Compute max drawdown (% and absolute) and the longest drawdown duration
 * measured in bars.
 */
export function computeMaxDrawdown(equity: number[]): DrawdownResult {
  if (equity.length === 0) {
    return { maxDrawdownPct: 0, maxDrawdownAbs: 0, maxDrawdownDuration: 0, drawdownSeries: [] };
  }
  const drawdownSeries = new Array<number>(equity.length);
  let peak = equity[0];
  let maxDdPct = 0;
  let maxDdAbs = 0;
  let peakIdx = 0;
  let longestDuration = 0;
  for (let i = 0; i < equity.length; i++) {
    const v = equity[i];
    if (Number.isFinite(v) && v > peak) {
      peak = v;
      peakIdx = i;
    }
    const ddAbs = peak - v;
    const ddPct = peak > EPS ? ddAbs / peak : 0;
    drawdownSeries[i] = ddPct;
    if (ddAbs > maxDdAbs) maxDdAbs = ddAbs;
    if (ddPct > maxDdPct) maxDdPct = ddPct;
    const dur = i - peakIdx;
    if (dur > longestDuration) longestDuration = dur;
  }
  return {
    maxDrawdownPct: maxDdPct * 100,
    maxDrawdownAbs: maxDdAbs,
    maxDrawdownDuration: longestDuration,
    drawdownSeries,
  };
}

export function computeTradeStats(trades: Trade[]) {
  const closingTrades = trades.filter((t) => t.netPnl !== 0 || t.exitReason !== "end_of_data");
  const wins = closingTrades.filter((t) => t.netPnl > 0);
  const losses = closingTrades.filter((t) => t.netPnl < 0);
  const totalWins = wins.reduce((acc, t) => acc + t.netPnl, 0);
  const totalLosses = Math.abs(losses.reduce((acc, t) => acc + t.netPnl, 0));
  const winRate = closingTrades.length > 0 ? (wins.length / closingTrades.length) * 100 : 0;
  const profitFactor = totalLosses > EPS ? totalWins / totalLosses : totalWins > 0 ? totalWins : 0;
  const avgWin = wins.length > 0 ? totalWins / wins.length : 0;
  const avgLoss = losses.length > 0 ? -totalLosses / losses.length : 0;
  const expectancy =
    closingTrades.length > 0
      ? closingTrades.reduce((acc, t) => acc + t.netPnl, 0) / closingTrades.length
      : 0;
  const avgR =
    closingTrades.length > 0
      ? closingTrades.reduce((acc, t) => acc + t.rMultiple, 0) / closingTrades.length
      : 0;
  return {
    totalTrades: closingTrades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate,
    profitFactor,
    avgWin,
    avgLoss,
    expectancy,
    avgRMultiple: avgR,
    totalProfit: totalWins - totalLosses,
  };
}

/** Compound annual growth rate. */
export function computeCagr(
  initial: number,
  finalValue: number,
  periods: number,
  periodsPerYear: number,
): number {
  if (initial <= 0 || periods <= 0 || periodsPerYear <= 0) return 0;
  if (finalValue <= 0) return -1;
  const years = periods / periodsPerYear;
  if (years <= 0) return 0;
  const ratio = finalValue / initial;
  const cagr = Math.pow(ratio, 1 / years) - 1;
  return Number.isFinite(cagr) ? cagr * 100 : 0;
}

/**
 * Full metric block from equity curve + trade list.
 */
export function computeMetrics(input: MetricComputationInput): BacktestMetrics {
  const {
    equityCurve,
    trades,
    initialCapital,
    periodsPerYear,
    riskFreeRate = 0.02,
    totalCommission = 0,
  } = input;
  if (equityCurve.length === 0) {
    return {
      totalReturn: 0,
      annualReturn: 0,
      cagr: 0,
      maxDrawdown: 0,
      maxDrawdownAbs: 0,
      maxDrawdownDuration: 0,
      sharpe: 0,
      sortino: 0,
      winRate: 0,
      profitFactor: 0,
      avgWin: 0,
      avgLoss: 0,
      expectancy: 0,
      avgRMultiple: 0,
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      totalProfit: 0,
      totalCommission,
      volatility: 0,
    };
  }
  const equityArr = equityCurve.map((p) => p.equity);
  const finalEquity = equityArr[equityArr.length - 1];
  const totalReturn = safeDiv(finalEquity - initialCapital, initialCapital) * 100;
  const years = equityCurve.length / annualizationFactor(periodsPerYear);
  const annualReturn = years > 0 ? totalReturn / years : 0;
  const cagr = computeCagr(initialCapital, finalEquity, equityCurve.length, periodsPerYear);

  const dd = computeMaxDrawdown(equityArr);
  const sharpe = sharpeRatio(equityArr, periodsPerYear, riskFreeRate);
  const sortino = sortinoRatio(equityArr, periodsPerYear, riskFreeRate);
  const ts = computeTradeStats(trades);

  const returns = computeReturns(equityArr);
  const vol = stdDev(returns) * Math.sqrt(annualizationFactor(periodsPerYear)) * 100;

  return {
    totalReturn: round2(totalReturn),
    annualReturn: round2(annualReturn),
    cagr: round2(cagr),
    maxDrawdown: round2(dd.maxDrawdownPct),
    maxDrawdownAbs: round2(dd.maxDrawdownAbs),
    maxDrawdownDuration: dd.maxDrawdownDuration,
    sharpe: round2(sharpe),
    sortino: round2(sortino),
    winRate: round2(ts.winRate),
    profitFactor: round2(ts.profitFactor),
    avgWin: round2(ts.avgWin),
    avgLoss: round2(ts.avgLoss),
    expectancy: round2(ts.expectancy),
    avgRMultiple: round2(ts.avgRMultiple),
    totalTrades: ts.totalTrades,
    winningTrades: ts.winningTrades,
    losingTrades: ts.losingTrades,
    totalProfit: round2(ts.totalProfit),
    totalCommission: round2(totalCommission),
    volatility: round2(vol),
  };
}

function round2(v: number): number {
  if (!Number.isFinite(v)) return 0;
  return Math.round(v * 100) / 100;
}
