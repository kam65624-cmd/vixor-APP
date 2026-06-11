// ============================================================================
// Vixor Debate Engine — RiskGuard Agent
// ============================================================================
//
// The RiskGuard has the HIGHEST authority in the debate (weight 1.5).
// Its sole job is to protect against excessive risk.
//
// Weight: 1.5 (highest — can override consensus on high-risk signals)
//
// Logic:
//   - HIGH risk → NEUTRAL with low confidence (risk veto)
//   - MEDIUM risk → follow analyst direction but reduce confidence by 20%
//   - LOW risk → follow analyst direction, boost confidence by 10%
//
// When RiskGuard returns NEUTRAL on HIGH risk, it sets riskOverride=true
// in the debate result, signaling that this signal was flagged.
// ============================================================================

import type { AgentVote, AgentSide } from "../types";
import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";

/**
 * RiskGuard agent — prioritizes risk management above all else.
 * This agent can veto high-risk signals by voting NEUTRAL with high weight.
 */
export function riskGuardVote(result: AnalysisResult): AgentVote {
  // Determine the analyst direction (same logic as analyst.agent.ts)
  const analystDirection: AgentSide =
    result.recommendation === "BUY" ? "BULL" :
    result.recommendation === "SELL" ? "BEAR" :
    "NEUTRAL";

  let side: AgentSide;
  let confidence: number;
  let reasoning: string;

  if (result.risk_level === "HIGH") {
    // HIGH RISK → VETO: vote NEUTRAL regardless of what analysis says
    side = "NEUTRAL";
    confidence = 0.3; // Low confidence in the NEUTRAL vote means "don't trade"
    reasoning = result.risk_reasons.length > 0
      ? `Risk veto: ${result.risk_reasons[0]}. High-risk signal — recommending caution.`
      : `Risk veto: Signal classified as HIGH risk. Recommend reducing position size or skipping this trade.`;
  }
  else if (result.risk_level === "MEDIUM") {
    // MEDIUM RISK → Follow direction with reduced confidence
    side = analystDirection;
    confidence = Math.max(0.2, (result.confidence / 100) * 0.8); // 20% confidence reduction
    reasoning = result.risk_reasons.length > 0
      ? `Medium risk: ${result.risk_reasons[0]}. Reducing confidence by 20%.`
      : `Medium risk signal — proceeding with reduced confidence.`;
  }
  else {
    // LOW RISK → Follow direction with boosted confidence
    side = analystDirection;
    confidence = Math.min(1.0, (result.confidence / 100) * 1.1); // 10% confidence boost
    reasoning = result.risk_reasons.length > 0
      ? `Low risk: ${result.risk_reasons[0]}. Good risk profile for this setup.`
      : `Low risk signal — confidence boosted. Good setup quality.`;
  }

  // Clamp confidence
  confidence = Math.max(0, Math.min(1, confidence));

  return {
    agent: "RiskGuard",
    side,
    confidence,
    reasoning,
    weight: 1.5, // Highest weight — can override consensus
  };
}
