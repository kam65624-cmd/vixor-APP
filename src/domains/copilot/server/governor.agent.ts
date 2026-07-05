// ============================================================================
// VIXOR AI Risk Governor Agent — Trade Risk Assessment
// ============================================================================
//
// Assesses trade risk and can block/warn/allow trades based on user's risk
// profile, position sizing, and portfolio exposure.
// ============================================================================

import { llmRouter } from "@/shared/llm";
import { MemoryStore } from "@/shared/memory";
import { storeDecision } from "./decision-store";
import type {
  GovernorInput,
  RiskDecision,
  RiskDecisionType,
  RiskProfile,
  DecisionSeverity,
} from "../types";

/** Coerced JSON output from the LLM. */
interface GovernorLLMOutput {
  riskScore?: number;
  reason?: string;
  suggestion?: string;
}

/**
 * Builds a risk profile from user memories.
 * Extracts structured data from the raw memory context string.
 */
export function buildRiskProfile(memoryContext: string): RiskProfile {
  const defaultProfile: RiskProfile = {
    style: "unknown",
    tolerance: "medium",
    weakness: "Not enough data",
    strength: "Not enough data",
    preferredChains: [],
    preferredTokens: [],
    activeHours: "unknown",
    avgSession: "unknown",
  };

  if (!memoryContext || memoryContext === "No stored memories for this user yet.") {
    return defaultProfile;
  }

  // Extract structured insights from memory text (best-effort parsing)
  const lower = memoryContext.toLowerCase();

  // Detect trading style
  if (lower.includes("scalp")) defaultProfile.style = "scalper";
  else if (lower.includes("swing")) defaultProfile.style = "swing";
  else if (lower.includes("day") || lower.includes("intraday")) defaultProfile.style = "day trader";
  else if (lower.includes("position") || lower.includes("long-term"))
    defaultProfile.style = "position trader";

  // Detect risk tolerance
  if (lower.includes("conservative") || lower.includes("low risk"))
    defaultProfile.tolerance = "low";
  else if (lower.includes("aggressive") || lower.includes("high risk"))
    defaultProfile.tolerance = "high";
  else defaultProfile.tolerance = "medium";

  // Detect weakness
  if (lower.includes("revenge") || lower.includes("chase"))
    defaultProfile.weakness = "Emotional trading (revenge/chase)";
  else if (lower.includes("overtrade")) defaultProfile.weakness = "Overtrading";
  else if (lower.includes("stop")) defaultProfile.weakness = "Poor stop loss discipline";
  else defaultProfile.weakness = "Needs more data to identify";

  // Detect strength
  if (lower.includes("discipline") || lower.includes("patient"))
    defaultProfile.strength = "Disciplined approach";
  else if (lower.includes("analysis") || lower.includes("research"))
    defaultProfile.strength = "Strong analytical approach";
  else defaultProfile.strength = "Consistent activity";

  return defaultProfile;
}

/**
 * Builds the Risk Governor system prompt.
 */
export function buildGovernorSystemPrompt(): string {
  return `You are VIXOR Risk Governor, a conservative risk management AI. Your job is to assess the risk of a proposed trade and decide whether to allow, warn, or block it.

## YOUR ROLE
You evaluate trades based on:
- Position sizing relative to portfolio (max 5% of portfolio per trade)
- Risk-reward alignment
- Portfolio concentration risk
- User's known risk tolerance and behavioral patterns
- Market conditions implied by the token and chain

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON (no markdown, no code fences):
\`\`\`
{"riskScore": 45, "reason": "Position size is 8% of portfolio — exceeds 5% recommended limit.", "suggestion": "Reduce position to $500 to stay within 5% risk limit."}
\`\`\`

## FIELD RULES
- **riskScore**: Integer 0-100. 0 = no risk, 100 = extreme risk.
  - Score > 70 → BLOCK (high risk)
  - Score 40-70 → WARN (medium risk)
  - Score < 40 → ALLOW (low risk)
- **reason**: 1-3 sentences explaining why this risk score was assigned. Reference specific numbers.
- **suggestion**: 1 actionable suggestion for risk mitigation. Required when score >= 40.

## RISK SCORING GUIDELINES
- Position > 10% of portfolio: +30 points
- Position > 5% of portfolio: +15 points
- Unknown token (low liquidity): +20 points
- Chain with high volatility (meme chains): +10 points
- User history shows emotional trading: +15 points
- Position < 2% of portfolio: -10 points
- User has strong discipline history: -10 points
- Trade size < $100: -5 points (too small to matter)

## IMPORTANT RULES
- Be CONSERVATIVE — always err on the side of caution
- Use specific numbers and percentages
- Never allow trades that exceed 10% of portfolio
- Reference the user's risk profile from memory
- Never use "As an AI" or disclaimers`;
}

/**
 * Builds the user message for the Governor LLM call.
 */
export function buildGovernorUserMessage(input: GovernorInput, riskProfile: RiskProfile): string {
  const { action, token, amount, currentPrice, portfolioValue } = input;
  const positionValue = amount * currentPrice;
  const positionPct =
    portfolioValue > 0 ? ((positionValue / portfolioValue) * 100).toFixed(2) : "unknown";

  return `## TRADE ASSESSMENT REQUEST
- **Action**: ${action.toUpperCase()}
- **Token**: ${token}
- **Amount**: ${amount} tokens
- **Current Price**: $${currentPrice}
- **Position Value**: $${positionValue.toLocaleString()}
- **Portfolio Value**: $${portfolioValue.toLocaleString()}
- **Position as % of Portfolio**: ${positionPct}%

## USER RISK PROFILE
- **Trading Style**: ${riskProfile.style}
- **Risk Tolerance**: ${riskProfile.tolerance}
- **Known Weakness**: ${riskProfile.weakness}
- **Known Strength**: ${riskProfile.strength}
- **Preferred Chains**: ${riskProfile.preferredChains.join(", ") || "None identified"}
- **Preferred Tokens**: ${riskProfile.preferredTokens.join(", ") || "None identified"}

Assess this trade's risk and respond with JSON.`;
}

/**
 * Maps a risk score to a decision type and severity.
 */
export function mapScoreToDecision(score: number): {
  decision: RiskDecisionType;
  severity: DecisionSeverity;
} {
  if (score > 70) {
    return { decision: "block", severity: "critical" };
  }
  if (score > 55) {
    return { decision: "block", severity: "high" };
  }
  if (score > 40) {
    return { decision: "warn", severity: "medium" };
  }
  if (score > 25) {
    return { decision: "warn", severity: "low" };
  }
  return { decision: "allow", severity: "low" };
}

/**
 * Parses the LLM response into a typed RiskDecision.
 * Falls back to safe defaults if the JSON is malformed.
 */
export function parseGovernorResponse(
  raw: string,
  decisionId: string,
  riskProfile: RiskProfile,
  token: string,
): RiskDecision {
  try {
    const cleaned = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as GovernorLLMOutput;

    const riskScore =
      typeof parsed.riskScore === "number" ? Math.max(0, Math.min(100, parsed.riskScore)) : 50;

    const { decision, severity } = mapScoreToDecision(riskScore);

    return {
      decisionId,
      decision,
      riskScore,
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : `Risk score: ${riskScore}/100 for ${token} trade.`,
      suggestion:
        typeof parsed.suggestion === "string"
          ? parsed.suggestion
          : "Review position sizing before proceeding.",
      riskProfile,
      severity,
      confidence: 0.75,
    };
  } catch {
    return {
      decisionId,
      decision: "warn",
      riskScore: 50,
      reason: "Risk assessment could not be completed — defaulting to warn.",
      suggestion: "Proceed with caution and verify position sizing.",
      riskProfile,
      severity: "medium",
      confidence: 0.3,
    };
  }
}

/**
 * Assesses trade risk using the Risk Governor agent.
 *
 * @param input - Trade parameters to assess
 * @param overrides - Optional overrides for testing
 * @returns Risk decision with decision ID
 */
export async function assessRisk(
  input: GovernorInput,
  overrides?: {
    memoryContext?: string;
    llmRouter?: typeof llmRouter;
  },
): Promise<RiskDecision> {
  const router = overrides?.llmRouter ?? llmRouter;

  // Fetch user memories
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

  const riskProfile = buildRiskProfile(memoryContext);

  // Quick pre-check: if position > 10% of portfolio, block immediately
  const positionValue = input.amount * input.currentPrice;
  if (input.portfolioValue > 0 && positionValue / input.portfolioValue > 0.1) {
    const stored = await storeDecision({
      userId: input.userId,
      agentId: "governor",
      decisionType: "block",
      title: `BLOCKED: ${input.action.toUpperCase()} ${input.token} — exceeds 10% portfolio`,
      description: `Position value $${positionValue.toLocaleString()} exceeds 10% of portfolio ($${input.portfolioValue.toLocaleString()}).`,
      data: { token: input.token, action: input.action, amount: input.amount, riskScore: 95 },
      confidence: 0.95,
      tokenSymbol: input.token,
      severity: "critical",
    });
    const decisionId = stored.success ? stored.id : crypto.randomUUID();

    return {
      decisionId,
      decision: "block",
      riskScore: 95,
      reason: `Position value $${positionValue.toLocaleString()} is ${((positionValue / input.portfolioValue) * 100).toFixed(1)}% of portfolio — exceeds 10% maximum.`,
      suggestion: `Reduce position to $${(input.portfolioValue * 0.05).toLocaleString()} (5% of portfolio) or less.`,
      riskProfile,
      severity: "critical",
      confidence: 0.95,
    };
  }

  const systemPrompt = buildGovernorSystemPrompt();
  const userMessage = buildGovernorUserMessage(input, riskProfile);

  const response = await router.chat({
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    temperature: 0.4,
    maxTokens: 512,
    provider: "zai",
    fallbacks: ["anthropic"],
    timeoutMs: 10_000,
  });

  const parsed = parseGovernorResponse(response.content, "", riskProfile, input.token);
  const { decision: finalDecision, severity: finalSeverity } = mapScoreToDecision(parsed.riskScore);

  const stored = await storeDecision({
    userId: input.userId,
    agentId: "governor",
    decisionType:
      finalDecision === "block" ? "block" : finalDecision === "warn" ? "warning" : "suggestion",
    title: `${finalDecision.toUpperCase()}: ${input.action.toUpperCase()} ${input.token}`,
    description: parsed.reason,
    data: {
      token: input.token,
      action: input.action,
      amount: input.amount,
      riskScore: parsed.riskScore,
    },
    confidence: parsed.confidence,
    tokenSymbol: input.token,
    severity: finalSeverity,
  });

  const decisionId = stored.success ? stored.id : crypto.randomUUID();

  return {
    ...parsed,
    decisionId,
    decision: finalDecision,
    severity: finalSeverity,
  };
}
