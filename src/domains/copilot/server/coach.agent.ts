// ============================================================================
// VIXOR AI Coach Agent — Real-time Trading Coach
// ============================================================================
//
// Provides real-time coaching overlay when a user previews a trade.
// Uses ZAI provider for < 2s latency target.
// Stores decisions in vixor_decisions for the feedback loop.
// ============================================================================

import { llmRouter } from "@/shared/llm";
import { MemoryStore } from "@/shared/memory";
import { storeDecision } from "./decision-store";
import type { CoachInput, CoachResponse, CoachSentiment, RiskLevel } from "../types";

/** Coerced JSON output from the LLM. */
interface CoachLLMOutput {
  comment?: string;
  sentiment?: string;
  riskLevel?: string;
  suggestion?: string;
}

/**
 * Builds the Coach system prompt.
 */
export function buildCoachSystemPrompt(): string {
  return `You are VIXOR Coach, a real-time trading coach that provides instant, actionable feedback when a trader is about to execute a trade.

## YOUR ROLE
You give a brief, sharp coaching comment — like a seasoned trader sitting next to the user. You consider:
- Market timing and context
- Position sizing relative to typical behavior
- Emotional state signals (e.g., chasing pumps, revenge trading)
- Risk-reward alignment

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON (no markdown, no code fences). Example:
\`\`\`
{"comment": "Buying SOL at resistance after a 40% pump in 2 hours — classic FOMO entry. Consider waiting for a pullback to the 0.382 Fib.", "sentiment": "bearish", "riskLevel": "high", "suggestion": "Wait for a pullback to the $142 support level before entering."}
\`\`\`

## FIELD RULES
- **comment**: 1-3 sentences, sharp and direct. Reference specific price levels.
- **sentiment**: Must be exactly one of: "bullish", "bearish", "neutral"
- **riskLevel**: Must be exactly one of: "low", "medium", "high"
- **suggestion**: 1 actionable suggestion (what the user should do)

## IMPORTANT RULES
- Be direct and specific — never vague
- Reference specific numbers and price levels from the trade data
- If you detect emotional trading (FOMO, revenge), call it out directly
- Never use "As an AI" or disclaimers — you are a coach, not an AI assistant
- Keep the total response under 200 words`;
}

/**
 * Builds the user message for the Coach LLM call.
 */
export function buildCoachUserMessage(input: CoachInput, memoryContext: string): string {
  const { token, action, amount, chain, currentPrice } = input;

  return `## TRADE PREVIEW
- **Token**: ${token}
- **Action**: ${action.toUpperCase()}
- **Amount**: $${amount.toLocaleString()}
- **Chain**: ${chain}
- **Current Price**: $${currentPrice}
- **Position Value**: $${(amount * currentPrice).toLocaleString()}

## USER MEMORY (Last 30 Days)
${memoryContext}

Based on this trade preview and the user's history, provide your coaching feedback as JSON.`;
}

/**
 * Parses the LLM response into a typed CoachResponse.
 * Falls back to safe defaults if the JSON is malformed.
 */
export function parseCoachResponse(raw: string, decisionId: string): CoachResponse {
  try {
    // Strip markdown code fences if present
    const cleaned = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as CoachLLMOutput;

    const validSentiments: CoachSentiment[] = ["bullish", "bearish", "neutral"];
    const validRiskLevels: RiskLevel[] = ["low", "medium", "high"];

    return {
      decisionId,
      comment:
        typeof parsed.comment === "string" ? parsed.comment : "No coaching comment available.",
      sentiment: validSentiments.includes(parsed.sentiment as CoachSentiment)
        ? (parsed.sentiment as CoachSentiment)
        : "neutral",
      riskLevel: validRiskLevels.includes(parsed.riskLevel as RiskLevel)
        ? (parsed.riskLevel as RiskLevel)
        : "medium",
      suggestion:
        typeof parsed.suggestion === "string" ? parsed.suggestion : "Proceed with caution.",
      confidence: 0.7,
    };
  } catch {
    return {
      decisionId,
      comment: "Coach analysis unavailable — could not parse AI response.",
      sentiment: "neutral",
      riskLevel: "medium",
      suggestion: "Review the trade manually before executing.",
      confidence: 0.3,
    };
  }
}

/**
 * Runs the Coach agent for a trade preview.
 *
 * @param input - Trade preview parameters
 * @param overrides - Optional overrides for testing (memory context, LLM router)
 * @returns Coaching response with decision ID
 */
export async function coachTrade(
  input: CoachInput,
  overrides?: {
    memoryContext?: string;
    llmRouter?: typeof llmRouter;
  },
): Promise<CoachResponse> {
  const router = overrides?.llmRouter ?? llmRouter;

  // Fetch user memories for context
  let memoryContext: string;
  if (overrides?.memoryContext !== undefined) {
    memoryContext = overrides.memoryContext;
  } else {
    try {
      memoryContext = await MemoryStore.contextForPrompt(input.userId);
    } catch {
      memoryContext = "No stored memories for this user yet.";
    }
  }

  const systemPrompt = buildCoachSystemPrompt();
  const userMessage = buildCoachUserMessage(input, memoryContext);

  // Use ZAI provider for fastest latency (< 2s target)
  const response = await router.chat({
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    temperature: 0.6,
    maxTokens: 512,
    provider: "zai",
    timeoutMs: 10_000,
  });

  // Store decision before returning
  const stored = await storeDecision({
    userId: input.userId,
    agentId: "coach",
    decisionType: "suggestion",
    title: `Coach: ${input.action.toUpperCase()} ${input.token}`,
    description: response.content,
    data: { token: input.token, action: input.action, amount: input.amount },
    confidence: 0.7,
    tokenSymbol: input.token,
    chain: input.chain,
  });

  const decisionId = stored.success ? stored.id : crypto.randomUUID();

  return parseCoachResponse(response.content, decisionId);
}
