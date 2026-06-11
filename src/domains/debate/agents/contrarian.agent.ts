// ============================================================================
// Vixor Debate Engine — Contrarian Agent
// ============================================================================
//
// The Contrarian is the devil's advocate. It ALWAYS votes the opposite
// of the primary analysis. Its purpose is not to be right, but to ensure
// the team has considered the bear case.
//
// Weight: 0.8 (lowest — it's there to challenge, not to lead)
// Confidence: Always 0.4 (moderate — it's a counter-argument, not a thesis)
// ============================================================================

import type { AgentVote, AgentSide } from "../types";
import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";

/**
 * Contrarian agent — always votes opposite of the primary analysis.
 * This ensures the debate considers the counter-argument, preventing
// groupthink and overconfidence in one direction.
 */
export function contrarianVote(result: AnalysisResult): AgentVote {
  // Determine the analyst direction
  const analystDirection: AgentSide =
    result.recommendation === "BUY" ? "BULL" :
    result.recommendation === "SELL" ? "BEAR" :
    "NEUTRAL";

  // Always vote opposite
  let side: AgentSide;
  let reasoning: string;

  if (analystDirection === "BULL") {
    side = "BEAR";
    reasoning = "Devil's advocate: challenging the bullish thesis. What if the trend reverses or support breaks?";
  } else if (analystDirection === "BEAR") {
    side = "BULL";
    reasoning = "Devil's advocate: challenging the bearish thesis. What if this is a false breakdown or a buying opportunity?";
  } else {
    side = "NEUTRAL";
    reasoning = "Devil's advocate: the analysis is already neutral — no counter-position to take.";
  }

  return {
    agent: "Contrarian",
    side,
    confidence: 0.4, // Always moderate — this is a challenge, not a conviction
    reasoning,
    weight: 0.8, // Lowest weight — challenges but doesn't lead
  };
}
