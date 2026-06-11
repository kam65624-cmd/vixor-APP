// ============================================================================
// Vixor Debate Engine — Strategist Agent
// ============================================================================
//
// The Strategist evaluates based on TREND QUALITY + RISK/REWARD RATIO.
// It looks at the bigger picture: is the trend aligned? Is the RR worth it?
//
// Weight: 1.2 (slightly higher than Analyst — strategic view matters)
//
// Logic:
//   - Trend + good RR (> 1.5) → follow trend direction with higher confidence
//   - Trend + bad RR (< 1.0) → NEUTRAL regardless of trend (bad setup)
//   - No clear trend → NEUTRAL
// ============================================================================

import type { AgentVote, AgentSide } from "../types";
import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";

/**
 * Parse the risk/reward ratio string (e.g., "1:2.5" → 2.5)
 * Returns the reward-to-risk multiplier. Higher = better setup.
 */
function parseRR(rrString: string): number {
  if (!rrString) return 0;

  // Handle formats: "1:2.5", "1/2.5", "2.5R", "2.5", etc.
  const colonMatch = rrString.match(/1[:/]\s*([\d.]+)/);
  if (colonMatch) return parseFloat(colonMatch[1]);

  const rMatch = rrString.match(/([\d.]+)\s*R/i);
  if (rMatch) return parseFloat(rMatch[1]);

  // Try parsing as a plain number
  const num = parseFloat(rrString);
  return isNaN(num) ? 0 : num;
}

/**
 * Strategist agent — evaluates trend alignment and risk/reward quality.
 * Gives more weight to signals that have both trend alignment AND good RR.
 */
export function strategistVote(result: AnalysisResult): AgentVote {
  const rr = parseRR(result.rr);
  const isBullishTrend = result.trend === "BULLISH";
  const isBearishTrend = result.trend === "BEARISH";

  let side: AgentSide;
  let confidence: number;
  let reasoning: string;

  // Bad RR ratio (< 1.0) — NEUTRAL regardless of trend
  if (rr > 0 && rr < 1.0) {
    side = "NEUTRAL";
    confidence = 0.4;
    reasoning = `Poor risk/reward ratio (${result.rr}) — not worth the trade regardless of trend direction.`;
  }
  // Bullish trend + good RR
  else if (isBullishTrend && rr >= 1.5) {
    side = "BULL";
    confidence = Math.min(0.9, 0.6 + (rr / 10)); // Higher RR = higher confidence
    reasoning = `Bullish trend with strong RR (${result.rr}) — favorable setup for longs.`;
  }
  // Bearish trend + good RR
  else if (isBearishTrend && rr >= 1.5) {
    side = "BEAR";
    confidence = Math.min(0.9, 0.6 + (rr / 10));
    reasoning = `Bearish trend with strong RR (${result.rr}) — favorable setup for shorts.`;
  }
  // Trend aligned but mediocre RR (1.0 - 1.5)
  else if (isBullishTrend) {
    side = "BULL";
    confidence = 0.5;
    reasoning = `Bullish trend but mediocre RR (${result.rr}) — trade with caution.`;
  }
  else if (isBearishTrend) {
    side = "BEAR";
    confidence = 0.5;
    reasoning = `Bearish trend but mediocre RR (${result.rr}) — trade with caution.`;
  }
  // Neutral trend
  else {
    side = "NEUTRAL";
    confidence = 0.4;
    reasoning = `No clear trend direction — market is ranging. Prefer to wait.`;
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    agent: "Strategist",
    side,
    confidence,
    reasoning,
    weight: 1.2,
  };
}
