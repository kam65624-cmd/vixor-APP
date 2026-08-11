// ============================================================================
// MOXI — Governor Agent (Enhanced Implementation)
// ============================================================================
//
// Risk assessment agent. Uses LLM for nuanced risk decisions but
// enforces a hard 20% portfolio limit that the LLM cannot override.
// ============================================================================

import { callLLM } from "@/shared/llm";
import type {
  GovernorInput,
  RiskDecision,
  RiskDecisionType,
  RiskProfile,
  DecisionSeverity,
} from "../types";

// ── Constants ───────────────────────────────────────────────────────────────

/** Hard maximum — 20% of portfolio. LLM CANNOT override this. */
const HARD_MAX_PORTFOLIO_PCT = 20;

/** Warning threshold — triggers LLM assessment instead of auto-allow. */
const WARN_PORTFOLIO_PCT = 10;

// ── Data Collection ────────────────────────────────────────────────────────

interface ExistingPosition {
  pair: string;
  direction: string;
  amount: number;
  entry_price: number;
}

async function getExistingPositions(userId: string): Promise<ExistingPosition[]> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("signal_tracking")
      .select("pair, direction, entry_price")
      .eq("user_id", userId)
      .in("status", ["pending", "active"])
      .limit(20);
    return ((data as ExistingPosition[]) ?? []).map((p) => ({
      ...p,
      amount: 0, // We don't have amount in tracking — estimate from entry
    }));
  } catch {
    return [];
  }
}

async function buildRiskProfile(userId: string, token: string): Promise<Partial<RiskProfile>> {
  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");
    const { data: trades } = await supabaseAdmin
      .from("trades")
      .select("pair, direction, pnl, amount, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    if (!trades || trades.length === 0) {
      return { preferredTokens: [token], activeHours: "unknown", avgSession: "unknown" };
    }

    const closedTrades = trades.filter((t: any) => t.pnl != null);
    const avgAmount = trades.reduce((s: number, t: any) => s + (t.amount || 0), 0) / trades.length;

    // Detect preferred tokens
    const tokenCounts: Record<string, number> = {};
    for (const t of trades) {
      const tk = (t as any).pair?.split("/")[0] || "";
      if (tk) tokenCounts[tk] = (tokenCounts[tk] || 0) + 1;
    }
    const preferredTokens = Object.entries(tokenCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([t]) => t);

    // Detect style
    const highFreq = trades.length > 20;
    const bigSizers = trades.filter((t: any) => (t.amount || 0) > avgAmount * 2).length;
    const inconsistent = bigSizers / trades.length > 0.3;

    let style = "moderate";
    let weakness = "none detected";
    let strength = "consistent analysis";
    let tolerance = "medium";

    if (highFreq) {
      style = "aggressive";
      weakness = "overtrading";
      tolerance = "high";
    }
    if (inconsistent) {
      weakness = "inconsistent position sizing";
    }

    const winRate =
      closedTrades.length > 0
        ? (closedTrades.filter((t: any) => t.pnl > 0).length / closedTrades.length) * 100
        : 0;
    if (winRate > 55) {
      strength = "strong win rate";
    }

    return {
      style,
      tolerance,
      weakness,
      strength,
      preferredTokens,
      preferredChains: [],
      activeHours: "24/7",
      avgSession: highFreq ? "short (< 1h)" : "medium (1-4h)",
    };
  } catch {
    return { preferredTokens: [token], activeHours: "unknown", avgSession: "unknown" };
  }
}

// ── LLM Prompt Builder ─────────────────────────────────────────────────────

function buildGovernorPrompt(
  input: GovernorInput,
  portfolioPct: number,
  existingPositions: ExistingPosition[],
  riskProfile: Partial<RiskProfile>,
): string {
  const correlatedPositions = existingPositions.filter(
    (p) => p.pair === input.token || p.pair.includes(input.token.split("/")[0] || ""),
  );

  return `You are a risk governor in the VIXOR trading system. Assess this trade's risk and make a decision.

## TRADE REQUEST
- Token: ${input.token}
- Action: ${input.action.toUpperCase()}
- Amount: ${input.amount}
- Current Price: ${input.currentPrice}
- Position Value: ${(input.amount * input.currentPrice).toFixed(2)}
- Portfolio Value: ${input.portfolioValue}
- Portfolio %: ${portfolioPct.toFixed(1)}%

## EXISTING POSITIONS (${existingPositions.length} active)
${existingPositions.map((p) => `- ${p.direction} ${p.pair} @ ${p.entry_price}`).join("\n") || "None"}

## CORRELATED POSITIONS
${correlatedPositions.length > 0 ? correlatedPositions.map((p) => `- ${p.pair} (${p.direction})`).join("\n") : "No correlated positions."}

## USER RISK PROFILE
- Style: ${riskProfile.style || "unknown"}
- Tolerance: ${riskProfile.tolerance || "unknown"}
- Weakness: ${riskProfile.weakness || "unknown"}
- Strength: ${riskProfile.strength || "unknown"}

## HARD RULE (NON-OVERRIDABLE)
If portfolioPct > 20%, you MUST decide "block". This is a system limit.

## RESPONSE FORMAT (JSON)
Respond with ONLY a valid JSON object:
{
  "decision": "allow" | "warn" | "block",
  "riskScore": 0-100,
  "reason": "Specific reason for your decision. Reference actual numbers.",
  "suggestion": "Actionable suggestion if warn/block. Empty string if allow.",
  "severity": "low" | "medium" | "high"
}

Guidance:
- "allow": portfolioPct < 10%, no red flags
- "warn": portfolioPct 10-20%, or correlated positions, or user weakness applies
- "block": portfolioPct > 20% (MANDATORY), or extreme risk conditions
- riskScore: 0-30 = low risk, 30-60 = medium, 60-100 = high`;
}

// ── Parse LLM Response ─────────────────────────────────────────────────────

interface GovernorLLMOutput {
  decision?: string;
  riskScore?: number;
  reason?: string;
  suggestion?: string;
  severity?: string;
}

const VALID_DECISIONS: RiskDecisionType[] = ["allow", "warn", "block"];
const VALID_SEVERITIES: DecisionSeverity[] = ["low", "medium", "high", "critical"];

function parseGovernorResponse(
  raw: string,
  input: GovernorInput,
  portfolioPct: number,
  riskProfile: Partial<RiskProfile>,
): RiskDecision {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed: GovernorLLMOutput = JSON.parse(cleaned);

    let decision = VALID_DECISIONS.includes(parsed.decision as RiskDecisionType)
      ? (parsed.decision as RiskDecisionType)
      : "allow";

    // HARD LIMIT: LLM cannot override 20% block
    if (portfolioPct > HARD_MAX_PORTFOLIO_PCT) {
      decision = "block";
    }

    const riskScore =
      typeof parsed.riskScore === "number"
        ? Math.min(100, Math.max(0, Math.round(parsed.riskScore)))
        : Math.min(100, Math.round(portfolioPct * 3));

    const severity = VALID_SEVERITIES.includes(parsed.severity as DecisionSeverity)
      ? (parsed.severity as DecisionSeverity)
      : decision === "block"
        ? "high"
        : decision === "warn"
          ? "medium"
          : "low";

    return {
      decisionId: `gov_${Date.now()}`,
      decision,
      riskScore,
      reason:
        parsed.reason ||
        (decision === "block"
          ? `Position size (${portfolioPct.toFixed(1)}% of portfolio) exceeds risk limit.`
          : "Position size within acceptable risk parameters."),
      suggestion:
        parsed.suggestion ||
        (decision === "block"
          ? "Reduce position to stay under 20% portfolio allocation."
          : "Approved. Ensure stop-loss is set."),
      riskProfile: {
        style: riskProfile.style || "moderate",
        tolerance: riskProfile.tolerance || "medium",
        weakness: riskProfile.weakness || "none detected",
        strength: riskProfile.strength || "consistent planning",
        preferredChains: riskProfile.preferredChains || [],
        preferredTokens: riskProfile.preferredTokens || [input.token],
        activeHours: riskProfile.activeHours || "24/7",
        avgSession: riskProfile.avgSession || "unknown",
      },
      severity,
      confidence: 0.8,
    };
  } catch {
    // Fall back to rule-based
    return ruleBasedGovernor(input, portfolioPct, riskProfile);
  }
}

// ── Rule-Based Fallback ────────────────────────────────────────────────────

function ruleBasedGovernor(
  input: GovernorInput,
  portfolioPct: number,
  riskProfile: Partial<RiskProfile>,
): RiskDecision {
  const isHighRisk = portfolioPct > HARD_MAX_PORTFOLIO_PCT;
  const isWarn = portfolioPct > WARN_PORTFOLIO_PCT;

  return {
    decisionId: `gov_${Date.now()}`,
    decision: isHighRisk ? "block" : isWarn ? "warn" : "allow",
    riskScore: Math.min(100, Math.round(portfolioPct * 3)),
    reason: isHighRisk
      ? `Position size (${portfolioPct.toFixed(1)}% of portfolio) exceeds 20% risk limit.`
      : isWarn
        ? `Position size (${portfolioPct.toFixed(1)}% of portfolio) is in the warning zone (10-20%).`
        : "Position size within acceptable risk parameters.",
    suggestion: isHighRisk
      ? "Reduce position to stay under 20% portfolio allocation."
      : isWarn
        ? "Consider reducing size. Ensure you have proper stop-loss and aren't overexposed."
        : "Approved. Ensure stop-loss is set.",
    riskProfile: {
      style: riskProfile.style || "moderate",
      tolerance: riskProfile.tolerance || "medium",
      weakness: riskProfile.weakness || "none detected",
      strength: riskProfile.strength || "consistent planning",
      preferredChains: riskProfile.preferredChains || [],
      preferredTokens: riskProfile.preferredTokens || [input.token],
      activeHours: riskProfile.activeHours || "24/7",
      avgSession: riskProfile.avgSession || "unknown",
    },
    severity: (isHighRisk ? "high" : isWarn ? "medium" : "low") as DecisionSeverity,
    confidence: 0.75,
  };
}

// ── Main Export ─────────────────────────────────────────────────────────────

/**
 * Governor agent — risk assessment with LLM-powered nuance.
 * Hard 20% portfolio limit is enforced regardless of LLM output.
 */
export async function assessRisk(input: GovernorInput): Promise<RiskDecision> {
  const positionValue = input.amount * input.currentPrice;
  const portfolioPct =
    input.portfolioValue > 0 ? (positionValue / input.portfolioValue) * 100 : 100;

  // ── HARD LIMIT CHECK (fast path — no LLM needed) ──
  if (portfolioPct > HARD_MAX_PORTFOLIO_PCT) {
    const riskProfile = await buildRiskProfile(input.userId, input.token);
    return ruleBasedGovernor(input, portfolioPct, riskProfile);
  }

  // ── COLLECT DATA ──
  const [existingPositions, riskProfile] = await Promise.all([
    getExistingPositions(input.userId),
    buildRiskProfile(input.userId, input.token),
  ]);

  // ── AUTO-ALLOW for very small positions ──
  if (portfolioPct < 5 && existingPositions.length === 0) {
    return {
      decisionId: `gov_${Date.now()}`,
      decision: "allow",
      riskScore: Math.round(portfolioPct * 2),
      reason: `Position size (${portfolioPct.toFixed(1)}% of portfolio) is well within safe limits.`,
      suggestion: "Approved. Ensure stop-loss is set.",
      riskProfile: {
        style: riskProfile.style || "moderate",
        tolerance: riskProfile.tolerance || "medium",
        weakness: riskProfile.weakness || "none detected",
        strength: riskProfile.strength || "consistent planning",
        preferredChains: riskProfile.preferredChains || [],
        preferredTokens: riskProfile.preferredTokens || [input.token],
        activeHours: riskProfile.activeHours || "24/7",
        avgSession: riskProfile.avgSession || "unknown",
      },
      severity: "low",
      confidence: 0.85,
    };
  }

  // ── LLM ASSESSMENT ──
  try {
    const prompt = buildGovernorPrompt(input, portfolioPct, existingPositions, riskProfile);
    const response = await callLLM([{ role: "user", content: prompt }], {
      temperature: 0.3,
      maxTokens: 350,
      jsonMode: true,
    });

    return parseGovernorResponse(response.content, input, portfolioPct, riskProfile);
  } catch {
    return ruleBasedGovernor(input, portfolioPct, riskProfile);
  }
}
