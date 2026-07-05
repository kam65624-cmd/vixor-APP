// ============================================================================
// VIXOR AI Smart Money Hunter Agent — On-chain Opportunity Scoring
// ============================================================================
//
// Scans for smart money wallet activity and scores opportunities based on
// Helius RPC data and Birdeye metrics from the discovery domain.
// ============================================================================

import { llmRouter } from "@/shared/llm";
import { storeDecision } from "./decision-store";
import type { HunterInput, HunterScore, HunterSignal } from "../types";

/** Coerced JSON output from the LLM. */
interface HunterLLMOutput {
  score?: number;
  signal?: string;
  reasoning?: string;
  wallets?: string[];
}

/** Maps a numeric score to a HunterSignal. */
function mapScoreToSignal(score: number): HunterSignal {
  if (score >= 80) return "strong_buy";
  if (score >= 60) return "buy";
  if (score >= 40) return "hold";
  return "sell";
}

/**
 * Builds the Smart Money Hunter system prompt.
 */
export function buildHunterSystemPrompt(): string {
  return `You are VIXOR Smart Money Hunter, an on-chain analyst who identifies trading opportunities by tracking smart money wallet activity, price action, and volume patterns.

## YOUR ROLE
You analyze on-chain data to score the potential of a token opportunity. You look for:
- Smart money accumulation patterns
- Volume anomalies (sudden spikes or unusual activity)
- Price action confirming institutional interest
- Wallet clustering and whale movements

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON (no markdown, no code fences):
\`\`\`
{"score": 72, "signal": "buy", "reasoning": "3 known whale wallets accumulated 500K tokens in the last 24h. Volume is 4x the 7-day average. Price holding above support.", "wallets": ["addr1", "addr2", "addr3"]}
\`\`\`

## FIELD RULES
- **score**: Integer 0-100. Higher = better opportunity.
  - 80+ = strong_buy (rare, high conviction)
  - 60-79 = buy (good opportunity)
  - 40-59 = hold (neutral, insufficient data)
  - < 40 = sell (bearish signals)
- **signal**: Must be exactly one of: "strong_buy", "buy", "hold", "sell"
- **reasoning**: 2-4 sentences explaining the score. Reference specific on-chain data points.
- **wallets**: Array of wallet addresses that influenced this score (if any from the data)

## SCORING GUIDELINES
- 3+ smart money wallets buying: +30
- Volume > 3x average: +20
- Volume > 5x average: +30
- Price holding key support: +10
- Price breaking resistance: +15
- Smart money wallets selling: -30
- Volume declining: -15
- Price below key support: -20
- Low liquidity (< $50K): -10

## IMPORTANT RULES
- Base scores on the DATA provided, not speculation
- Be honest about data quality — if data is sparse, score closer to 50
- Reference specific wallet addresses when available
- Never use "As an AI" or disclaimers`;
}

/**
 * Builds the user message for the Hunter LLM call.
 */
export function buildHunterUserMessage(input: HunterInput): string {
  const { token, chain, smartMoneyActivity, priceData, volumeData } = input;

  return `## OPPORTUNITY ANALYSIS REQUEST
- **Token**: ${token}
- **Chain**: ${chain}

## SMART MONEY ACTIVITY
${smartMoneyActivity || "No smart money data available."}

## PRICE DATA
${priceData || "No price data available."}

## VOLUME DATA
${volumeData || "No volume data available."}

Score this opportunity and respond with JSON.`;
}

/**
 * Parses the LLM response into a typed HunterScore.
 * Falls back to safe defaults if the JSON is malformed.
 */
export function parseHunterResponse(raw: string, decisionId: string): HunterScore {
  try {
    const cleaned = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as HunterLLMOutput;

    const score = typeof parsed.score === "number" ? Math.max(0, Math.min(100, parsed.score)) : 50;

    const validSignals: HunterSignal[] = ["strong_buy", "buy", "hold", "sell"];
    const signal = validSignals.includes(parsed.signal as HunterSignal)
      ? (parsed.signal as HunterSignal)
      : mapScoreToSignal(score);

    return {
      decisionId,
      score,
      signal,
      reasoning:
        typeof parsed.reasoning === "string"
          ? parsed.reasoning
          : `Score: ${score}/100 based on available data.`,
      wallets: Array.isArray(parsed.wallets)
        ? parsed.wallets.filter((w): w is string => typeof w === "string")
        : [],
      confidence: Math.min(score / 100, 0.9),
    };
  } catch {
    return {
      decisionId,
      score: 50,
      signal: "hold",
      reasoning: "Opportunity analysis could not be completed — insufficient data or parse error.",
      wallets: [],
      confidence: 0.2,
    };
  }
}

/**
 * Scores a token opportunity using the Smart Money Hunter agent.
 *
 * @param input - Opportunity parameters including on-chain data
 * @param overrides - Optional overrides for testing
 * @returns Hunter score with decision ID
 */
export async function scoreOpportunity(
  input: HunterInput,
  overrides?: {
    userId?: string;
    llmRouter?: typeof llmRouter;
  },
): Promise<HunterScore> {
  const router = overrides?.llmRouter ?? llmRouter;
  const userId = overrides?.userId ?? "system";

  const systemPrompt = buildHunterSystemPrompt();
  const userMessage = buildHunterUserMessage(input);

  const response = await router.chat({
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    temperature: 0.5,
    maxTokens: 768,
    provider: "zai",
    fallbacks: ["anthropic", "groq"],
    timeoutMs: 15_000,
  });

  // Store decision
  const stored = await storeDecision({
    userId,
    agentId: "hunter",
    decisionType: "alert",
    title: `Hunter: ${input.token} (${input.chain})`,
    description: response.content,
    data: {
      token: input.token,
      chain: input.chain,
      smartMoneyActivity: input.smartMoneyActivity,
    },
    confidence: 0.7,
    tokenSymbol: input.token,
    chain: input.chain,
  });

  return parseHunterResponse(response.content, stored.id);
}
