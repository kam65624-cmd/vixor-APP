// ============================================================================
// MOXI — Coach Agent (Real Implementation)
// ============================================================================
//
// Trading psychology & discipline coach. Uses LLM to generate personalized
// coaching based on the user's trade context. Falls back to rule-based
// responses if LLM is unavailable.
// ============================================================================

import { callLLM } from "@/shared/llm";
import type { CoachInput, CoachResponse, CoachSentiment, RiskLevel } from "../types";

// ── Prompt Builder ─────────────────────────────────────────────────────────

function buildCoachPrompt(input: CoachInput, recentTrades: string): string {
  const positionValue = input.amount * input.currentPrice;
  const isLarge = input.amount > 1000;
  const isBuy = input.action === "buy";

  return `You are a trading psychology coach within the VIXOR trading system. Your job is to give ONE concise, actionable piece of coaching on a trade the user is about to take.

## USER'S TRADE
- Token: ${input.token}
- Chain: ${input.chain}
- Action: ${input.action.toUpperCase()}
- Amount: ${input.amount} (position value: ~${positionValue.toFixed(2)})
- Current Price: ${input.currentPrice}

## RECENT TRADE CONTEXT
${recentTrades || "No recent trade history available."}

## YOUR COACHING FOCUS
${
  isBuy && isLarge
    ? "The user is buying a LARGE position. Watch for over-leveraging, FOMO, and revenge trading tendencies."
    : isBuy
      ? "The user is buying. Assess conviction and alignment with their strategy."
      : "The user is selling. Check if this is driven by fear/panic or a rational decision."
}

## RESPONSE FORMAT (JSON)
Respond with ONLY a valid JSON object (no markdown, no backticks):
{
  "comment": "One sentence of honest, direct coaching. No generic platitudes.",
  "sentiment": "bullish" | "bearish" | "neutral",
  "riskLevel": "low" | "medium" | "high",
  "suggestion": "One specific, actionable next step. Not vague advice.",
  "confidence": 0.0-1.0
}

Rules:
- Be DIRECT and HONEST. Traders respect straight talk.
- NEVER say "consider" or "you might want to". State your position.
- Reference specific data from the trade context when possible.
- If the position size seems reckless, say so clearly.
- If consecutive losses are detected, address emotional state.
- Keep confidence LOW (0.3-0.5) if you have no recent trade data.
- Keep confidence HIGH (0.7-0.9) if you have clear patterns to analyze.
- Do NOT use generic advice like "stay disciplined" or "manage your risk".`;
}

// ── Rule-Based Fallback ────────────────────────────────────────────────────

function ruleBasedCoach(input: CoachInput): CoachResponse {
  const positionValue = input.amount * input.currentPrice;
  const isOnTilt = input.action === "buy" && input.amount > 1000;
  const isLargeSell = input.action === "sell" && input.amount > 5000;

  let comment: string;
  let sentiment: CoachSentiment = "neutral";
  let riskLevel: RiskLevel = "low";
  let suggestion: string;

  if (isOnTilt) {
    comment = `That's a ${input.amount} ${input.token} buy. Large position sizes after losses often indicate revenge trading.`;
    sentiment = "bearish";
    riskLevel = "high";
    suggestion = `Cut the size to ${Math.round(input.amount * 0.4)} and wait for clearer confirmation. If you're chasing, step away for 15 minutes.`;
  } else if (isLargeSell) {
    comment = `Selling ${input.amount} worth of ${input.token} — that's a significant exit. Make sure this isn't panic selling.`;
    sentiment = "bearish";
    riskLevel = "medium";
    suggestion =
      "Verify your stop-loss was hit or your thesis changed before exiting. If it's emotional, reconsider.";
  } else {
    comment = `${input.action === "buy" ? "Buy" : "Sell"} ${input.amount} ${input.token} at ${input.currentPrice} — trade looks reasonable in terms of sizing.`;
    sentiment = "neutral";
    riskLevel = "low";
    suggestion = "Set your stop-loss before entry and stick to it. No moving the goalposts.";
  }

  return {
    decisionId: `coach_${Date.now()}`,
    comment,
    sentiment,
    riskLevel,
    suggestion,
    confidence: 0.5,
  };
}

// ── Parse LLM Response ─────────────────────────────────────────────────────

interface CoachLLMOutput {
  comment?: string;
  sentiment?: string;
  riskLevel?: string;
  suggestion?: string;
  confidence?: number;
}

function parseCoachResponse(raw: string, input: CoachInput): CoachResponse {
  try {
    // Strip markdown fences if present
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed: CoachLLMOutput = JSON.parse(cleaned);

    const validSentiments: CoachSentiment[] = ["bullish", "bearish", "neutral"];
    const validRiskLevels: RiskLevel[] = ["low", "medium", "high"];

    return {
      decisionId: `coach_${Date.now()}`,
      comment: parsed.comment || "Trade coaching unavailable.",
      sentiment: validSentiments.includes(parsed.sentiment as CoachSentiment)
        ? (parsed.sentiment as CoachSentiment)
        : "neutral",
      riskLevel: validRiskLevels.includes(parsed.riskLevel as RiskLevel)
        ? (parsed.riskLevel as RiskLevel)
        : "low",
      suggestion: parsed.suggestion || "Follow your trading plan.",
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.5,
    };
  } catch {
    // LLM returned unparseable response — fall back to rules
    return ruleBasedCoach(input);
  }
}

// ── Fetch Recent Trade Context ─────────────────────────────────────────────

async function getRecentTradeContext(userId: string): Promise<string> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data: trades } = await supabaseAdmin
      .from("trades")
      .select("pair, direction, pnl, quantity, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!trades || trades.length === 0) return "";

    const lines = trades.map((t: any) => {
      const pnl = t.pnl != null ? (t.pnl >= 0 ? `+${t.pnl}` : `${t.pnl}`) : "open";
      return `- ${t.direction} ${t.pair}: qty=${t.quantity ?? "?"}, PnL=${pnl} (${new Date(t.created_at).toLocaleDateString()})`;
    });

    // Calculate simple stats
    const closedTrades = trades.filter((t: any) => t.pnl != null);
    const wins = closedTrades.filter((t: any) => t.pnl > 0).length;
    const losses = closedTrades.filter((t: any) => t.pnl < 0).length;
    const recentWins = trades.slice(0, 5).filter((t: any) => t.pnl != null && t.pnl > 0).length;

    let summary = `Recent trades (${trades.length}):
${lines.join("\n")}`;
    if (closedTrades.length > 0) {
      summary += `\n\nStats: ${wins}W / ${losses}L (${closedTrades.length > 0 ? ((wins / closedTrades.length) * 100).toFixed(0) : 0}% win rate)`;
    }
    if (recentWins === 0 && trades.length >= 3) {
      summary += "\n⚠️ No wins in last 5 trades — possible losing streak.";
    }

    // Check for consecutive losses
    let consecutiveLosses = 0;
    for (const t of trades) {
      if (t.pnl != null && t.pnl < 0) consecutiveLosses++;
      else break;
    }
    if (consecutiveLosses >= 3) {
      summary += `\n🚨 ${consecutiveLosses} consecutive losses — HIGH emotional risk.`;
    }

    return summary;
  } catch {
    return "";
  }
}

// ── Main Export ─────────────────────────────────────────────────────────────

/**
 * Coach agent — provides real-time trade coaching with LLM-powered
 * personalized advice and graceful rule-based fallback.
 */
export async function coachTrade(input: CoachInput): Promise<CoachResponse> {
  const recentTrades = await getRecentTradeContext(input.userId);
  const hasData = recentTrades.length > 0;

  // If no trade data and no LLM key, use rule-based (fast path)
  if (!hasData) {
    return ruleBasedCoach(input);
  }

  // Try LLM-powered coaching
  try {
    const prompt = buildCoachPrompt(input, recentTrades);
    const response = await callLLM([{ role: "user", content: prompt }], {
      temperature: 0.6,
      maxTokens: 300,
      jsonMode: true,
    });

    return parseCoachResponse(response.content, input);
  } catch {
    // LLM failed — fall back to rule-based
    return ruleBasedCoach(input);
  }
}
