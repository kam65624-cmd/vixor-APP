// ============================================================================
// Vixor Debate Engine — Analyst Agent
// ============================================================================
//
// The Analyst agent directly follows the primary analysis recommendation.
// It is the baseline voter — if the analysis says BUY, the Analyst says BULL.
//
// Weight: 1.0 (baseline — equal influence)
// ============================================================================

import type { AgentVote, AgentSide } from "../types";
import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";

/**
 * Analyst agent — follows the primary analysis recommendation.
 * This is the simplest agent: it trusts the analysis output.
 */
export function analystVote(result: AnalysisResult): AgentVote {
  let side: AgentSide;
  let confidence: number;

  if (result.recommendation === "BUY") {
    side = "BULL";
    confidence = result.confidence / 100;
  } else if (result.recommendation === "SELL") {
    side = "BEAR";
    confidence = result.confidence / 100;
  } else {
    side = "NEUTRAL";
    confidence = 0.5;
  }

  // Clamp confidence to 0-1 range
  confidence = Math.max(0, Math.min(1, confidence));

  const reasoning = result.reasons.length > 0
    ? result.reasons[0]
    : `Analysis recommends ${result.recommendation} with ${result.confidence}% confidence`;

  return {
    agent: "Analyst",
    side,
    confidence,
    reasoning,
    weight: 1.0,
  };
}
