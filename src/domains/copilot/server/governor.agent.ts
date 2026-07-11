import type {
  GovernorInput,
  RiskDecision,
  RiskDecisionType,
  RiskProfile,
  DecisionSeverity,
} from "../types";

// Governor agent — risk assessment
export async function assessRisk(input: GovernorInput): Promise<RiskDecision> {
  const positionValue = input.amount * input.currentPrice;
  const portfolioPct = (positionValue / input.portfolioValue) * 100;
  const isHighRisk = portfolioPct > 20;

  return {
    decisionId: `gov_${Date.now()}`,
    decision: (isHighRisk ? "block" : "allow") as RiskDecisionType,
    riskScore: Math.min(100, Math.round(portfolioPct * 3)),
    reason: isHighRisk
      ? `Position size (${portfolioPct.toFixed(1)}% of portfolio) exceeds 20% risk limit.`
      : "Position size within acceptable risk parameters.",
    suggestion: isHighRisk
      ? "Reduce position to stay under 20% portfolio allocation."
      : "Approved. Ensure stop-loss is set.",
    riskProfile: {
      style: "moderate",
      tolerance: "medium",
      weakness: "occasional over-leveraging",
      strength: "consistent planning",
      preferredChains: [],
      preferredTokens: [input.token],
      activeHours: "24/7",
      avgSession: "4h",
    },
    severity: (isHighRisk ? "high" : "low") as DecisionSeverity,
    confidence: 0.8,
  };
}
