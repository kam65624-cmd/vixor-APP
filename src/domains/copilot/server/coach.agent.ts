import type { CoachInput, CoachResponse, CoachSentiment, RiskLevel, TradeAction } from "../types";

// Coach agent — trading psychology coaching
export async function coachTrade(input: CoachInput): Promise<CoachResponse> {
  const isOnTilt = input.action === "buy" && input.amount > 1000;
  return {
    decisionId: `coach_${Date.now()}`,
    comment: isOnTilt
      ? "I notice you might be over-leveraging. Consider reducing position size."
      : "Your trade setup looks reasonable. Stay disciplined.",
    sentiment: isOnTilt ? ("bearish" as CoachSentiment) : ("neutral" as CoachSentiment),
    riskLevel: isOnTilt ? ("high" as RiskLevel) : ("low" as RiskLevel),
    suggestion: isOnTilt
      ? "Reduce position size by 50% and set a tighter stop-loss."
      : "Follow your trading plan and maintain stop-loss discipline.",
    confidence: 0.7,
  };
}
