// ---------------------------------------------------------------------------
// Local style constants using THEME
// ---------------------------------------------------------------------------

export const cardStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 8,
};

export const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  marginBottom: 6,
  display: "block",
};

export const inputStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  borderRadius: 6,
  height: 36,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 14,
  fontFamily: "var(--font-mono)",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const EXPERIMENT_COST = 25;

// ---------------------------------------------------------------------------
// Types for UI display
// ---------------------------------------------------------------------------

export type ExperimentStatus = "running" | "completed" | "failed" | "cancelled";

/** Shape returned from Supabase `experiments` table via listExperiments. */
export interface ExperimentRecord {
  id: string;
  user_id: string;
  config: {
    name: string;
    assetSymbol: string;
    timeframe: string;
    strategyTemplate: string;
    generations: number;
    populationSize: number;
    createdAt: string;
  };
  result: Record<string, unknown> | null;
  status: ExperimentStatus;
  created_at: string;
  completed_at: string | null;
}

/** Derived best-score summary from the experiment result. */
export interface BestScoreSummary {
  overall: number;
  grade: string;
  totalReturn: number;
  maxDrawdown: number;
  sharpe: number;
}

/** Extract a BestScoreSummary from the serialized experiment result. */
export function extractBestScore(result: Record<string, unknown> | null): BestScoreSummary | null {
  if (!result) return null;
  const best = result.bestStrategy as Record<string, unknown> | undefined;
  if (!best || !best.score) return null;
  const summary = best.summary as Record<string, unknown> | undefined;
  const overall = typeof best.score === "number" ? best.score : 0;
  const totalReturn = (summary?.totalReturn as number) ?? 0;
  const maxDrawdown = (summary?.maxDrawdown as number) ?? 0;
  const sharpe = (summary?.sharpe as number) ?? 0;
  const grade =
    overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "F";
  return { overall, grade, totalReturn, maxDrawdown, sharpe };
}

/** Extract elapsed time in ms from result or from created_at/completed_at timestamps. */
export function extractElapsed(
  result: Record<string, unknown> | null,
  createdAt?: string,
  completedAt?: string,
): number | null {
  if (result) {
    const ms = result.elapsedMs as number | undefined;
    if (typeof ms === "number") return ms;
  }
  if (createdAt && completedAt) {
    const diff = new Date(completedAt).getTime() - new Date(createdAt).getTime();
    return diff > 0 ? diff : null;
  }
  return null;
}

/** Extract ranked strategies count from result. */
export function extractRankedCount(result: Record<string, unknown> | null): number {
  if (!result) return 0;
  const arr = result.rankedStrategies as unknown[] | undefined;
  return Array.isArray(arr) ? arr.length : 0;
}

// ---------------------------------------------------------------------------
// New experiment dialog content
// ---------------------------------------------------------------------------

export const STRATEGY_TEMPLATES = [
  { id: "sma_crossover", label: "SMA Crossover" },
  { id: "rsi_reversal", label: "RSI Reversal" },
  { id: "breakout", label: "Breakout" },
  { id: "macd_momentum", label: "MACD Momentum" },
];

export const ASSET_SYMBOLS = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "SOL/USDT", "GBP/USD"];

export const TIMEFRAMES = ["1H", "4H", "1D"];
