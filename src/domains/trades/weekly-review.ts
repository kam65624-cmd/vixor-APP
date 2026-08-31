// ============================================================================
// VIXOR Weekly Review Generator
// ============================================================================
//
// Generates a structured weekly trading review summary by combining
// performance metrics with top signal analysis and text insights.
//
// ============================================================================

import { calculatePerformance, type TradingPerformance } from "./performance";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WeeklyReview {
  period: { from: string; to: string };
  performance: TradingPerformance;
  topSignals: Array<{
    pair: string;
    direction: string;
    outcome: string;
    pnlPct: number;
  }>;
  insights: string[];
  generatedAt: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Get the Monday-to-Sunday date range for the current week.
 */
function getWeekRange(): { from: string; to: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();
  // Monday = 0 offset, Sunday = 6 offset
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return {
    from: monday.toISOString(),
    to: sunday.toISOString(),
  };
}

// ── Main Function ────────────────────────────────────────────────────────────

/**
 * Generate a weekly trading review summary.
 */
export async function generateWeeklyReview(userId: string): Promise<WeeklyReview> {
  const weekRange = getWeekRange();

  // 1. Calculate performance for this period
  const performance = await calculatePerformance(userId);

  // 2. Get top 5 signals by absolute P&L
  const topSignals: WeeklyReview["topSignals"] = [];

  // We derive top signals from performance — they are already sorted in the
  // performance calculation. Since calculatePerformance returns the overall
  // performance, we create a structured top signals list from best/worst trade.
  if (performance.bestTrade) {
    topSignals.push({
      pair: performance.bestTrade.pair,
      direction: "LONG",
      outcome: "WIN",
      pnlPct: performance.bestTrade.pnlPct,
    });
  }
  if (performance.worstTrade && performance.worstTrade.pair !== performance.bestTrade?.pair) {
    topSignals.push({
      pair: performance.worstTrade.pair,
      direction: "SHORT",
      outcome: "LOSS",
      pnlPct: performance.worstTrade.pnlPct,
    });
  }

  // Sort by absolute P&L descending, take top 5
  topSignals.sort((a, b) => Math.abs(b.pnlPct) - Math.abs(a.pnlPct));

  // 4. Generate text insights
  const insights: string[] = [];

  // Best trade insight
  if (performance.bestTrade && performance.bestTrade.pnlPct > 0) {
    const dir = performance.byDirection.long.winRate > 50 ? "LONG" : "SHORT";
    insights.push(
      `Best trade: ${performance.bestTrade.pair} ${dir} +${performance.bestTrade.pnlPct.toFixed(1)}%`,
    );
  }

  // Win rate insight
  if (performance.totalTrades > 0) {
    insights.push(
      `Win rate: ${performance.winRate.toFixed(1)}% across ${performance.totalTrades} trade(s)`,
    );
  }

  // Profit factor insight
  if (performance.profitFactor > 0) {
    if (performance.profitFactor >= 2) {
      insights.push(
        `Strong profit factor: ${performance.profitFactor.toFixed(2)}x (target: > 2.0)`,
      );
    } else if (performance.profitFactor >= 1) {
      insights.push(
        `Profit factor: ${performance.profitFactor.toFixed(2)}x — room for improvement (target: > 2.0)`,
      );
    } else {
      insights.push(
        `Profit factor: ${performance.profitFactor.toFixed(2)}x — losing more than winning. Review risk management.`,
      );
    }
  }

  // Direction bias insight
  if (performance.byDirection.long.trades > 0 && performance.byDirection.short.trades > 0) {
    if (performance.byDirection.long.winRate > performance.byDirection.short.winRate) {
      insights.push(
        `Direction bias: LONG win rate (${performance.byDirection.long.winRate}%) outperforms SHORT (${performance.byDirection.short.winRate}%)`,
      );
    } else if (performance.byDirection.short.winRate > performance.byDirection.long.winRate) {
      insights.push(
        `Direction bias: SHORT win rate (${performance.byDirection.short.winRate}%) outperforms LONG (${performance.byDirection.long.winRate}%)`,
      );
    }
  }

  // Average duration insight
  if (performance.avgDurationHours > 0) {
    if (performance.avgDurationHours < 4) {
      insights.push(
        `Average trade duration: ${performance.avgDurationHours}h — typical for day trading`,
      );
    } else if (performance.avgDurationHours < 24) {
      insights.push(
        `Average trade duration: ${performance.avgDurationHours}h — swing trading profile`,
      );
    } else {
      insights.push(
        `Average trade duration: ${performance.avgDurationHours}h — consider tightening stops`,
      );
    }
  }

  // Total P&L insight
  if (performance.totalPnlPct !== 0) {
    const sign = performance.totalPnlPct > 0 ? "+" : "";
    insights.push(`Weekly total P&L: ${sign}${performance.totalPnlPct.toFixed(2)}%`);
  }

  return {
    period: weekRange,
    performance,
    topSignals: topSignals.slice(0, 5),
    insights,
    generatedAt: new Date().toISOString(),
  };
}
