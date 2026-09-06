// ============================================================================
// ECHO — Tracking & Outcome & Learning — Public Types
// ============================================================================
//
// ECHO is the fourth character surface in the VIXOR decision loop. It
// aggregates the user's history across decisions, trades, notes, and
// watchlist items into a unified timeline view. The goal is to make
// outcomes visible so the user can learn from them.
//
// Key principles:
//   - TIMELINE-FIRST: everything is shown on a single timeline
//   - LEARNING-FOCUSED: each item includes what was decided and what happened
//   - NO EXECUTION: ECHO is read-only by design (decisions happen in DR.DEX)
// ============================================================================

/**
 * An entry on the user's decision/outcome timeline. Each item represents
 * either a decision (e.g. "Logged Paper Decision: BUY") or an observation
 * (e.g. "Trade closed", "Note added", "Token added to watchlist").
 */
export interface TimelineEntry {
  id: string;
  type: "DECISION" | "TRADE" | "NOTE" | "WATCHLIST" | "LOOP";
  occurredAt: string;
  title: string;
  summary: string;
  /** Optional: the token this entry relates to */
  tokenAddress?: string;
  chain?: string;
  /** Optional: numeric value (PnL, position size, etc.) */
  value?: number;
  /** Optional: a unit for the value (USD, PCT, etc.) */
  unit?: string;
  /** Optional: tag for filtering (e.g. "BUY", "TP1_HIT", "WEEKLY") */
  tag?: string;
}

/**
 * Weekly performance summary — pulled from trades performance
 */
export interface WeeklySummary {
  weekStart: string;
  weekEnd: string;
  totalTrades: number;
  wins: number;
  losses: number;
  netPnlUsd: number;
  winRate: number;
  bestTrade?: { title: string; pnlUsd: number };
  worstTrade?: { title: string; pnlUsd: number };
}

/**
 * The aggregated ECHO overview — what the home page shows.
 */
export interface EchoOverview {
  /** Most recent items across all sources */
  timeline: TimelineEntry[];
  /** Active signal trackings the user is monitoring */
  activeTrackings: number;
  /** Total closed trades */
  totalTrades: number;
  /** Recent weekly summary (if any) */
  recentWeek?: WeeklySummary;
  /** Items the user is watching */
  watchlistCount: number;
  /** Recent notes count */
  recentNotesCount: number;
  /** Today's daily-loop state, if any */
  todayLoop: {
    completed: boolean;
    morningPrep: boolean;
    sessionTracking: boolean;
    eodReview: boolean;
  };
  /** ISO timestamp */
  fetchedAt: string;
}
