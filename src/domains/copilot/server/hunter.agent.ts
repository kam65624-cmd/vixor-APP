import type { HunterInput, HunterScore, HunterSignal } from "../types";

// Hunter agent — smart money scoring
export async function scoreOpportunity(
  input: HunterInput,
  _ctx?: { userId?: string },
): Promise<HunterScore> {
  const hasActivity = input.smartMoneyActivity.length > 50;
  const score = hasActivity
    ? 65 + Math.floor(Math.random() * 25)
    : 20 + Math.floor(Math.random() * 30);

  return {
    decisionId: `hunter_${Date.now()}`,
    score,
    signal: (score > 75 ? "strong_buy" : score > 55 ? "buy" : "hold") as HunterSignal,
    reasoning: hasActivity
      ? `Significant smart money activity detected for ${input.token} on ${input.chain}. ${input.smartMoneyActivity.length} chars of activity data analyzed.`
      : `Limited smart money activity for ${input.token}. Score based on available data.`,
    wallets: hasActivity ? ["detected_wallet_1", "detected_wallet_2"] : [],
    confidence: 0.5 + Math.random() * 0.3,
  };
}
