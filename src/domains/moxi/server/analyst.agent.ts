// ============================================================================
// MOXI — Analyst Agent (Real Implementation)
// ============================================================================
//
// Behavioral analysis agent that generates weekly trading reports.
// Uses LLM for nuanced analysis, falls back to rule-based stats.
// ============================================================================

import { callLLM } from "@/shared/llm";
import type { AnalystReport, AnalystInput } from "../types";

// ── Data Collection ────────────────────────────────────────────────────────

interface TradeRecord {
  pair: string;
  direction: string;
  pnl: number | null;
  quantity: number | null;
  created_at: string;
}

interface AnalysisRecord {
  pair: string;
  timeframe: string;
  recommendation: string;
  confidence: number;
  created_at: string;
}

interface UserData {
  trades: TradeRecord[];
  analyses: AnalysisRecord[];
  memories: string;
}

async function collectUserData(userId: string): Promise<UserData> {
  let trades: TradeRecord[] = [];
  let analyses: AnalysisRecord[] = [];
  let memories = "";

  try {
    const { supabaseAdmin } = await import("@/shared/supabase/client.server");

    const [tradesResult, analysesResult] = await Promise.all([
      supabaseAdmin
        .from("trades")
        .select("pair, direction, pnl, quantity, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabaseAdmin
        .from("analyses")
        .select("pair, timeframe, recommendation, confidence, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    trades = (tradesResult.data as unknown as TradeRecord[]) ?? [];
    analyses = (analysesResult.data as AnalysisRecord[]) ?? [];
  } catch {
    // Non-fatal
  }

  try {
    const { MemoryStore } = await import("@/shared/memory");
    memories = (await MemoryStore.contextForPrompt(userId)) || "";
  } catch {
    // Non-fatal
  }

  return { trades, analyses, memories };
}

// ── Rule-Based Fallback ────────────────────────────────────────────────────

function ruleBasedAnalyst(userId: string, data: UserData): AnalystReport {
  const { trades, analyses } = data;
  const closedTrades = trades.filter((t) => t.pnl != null);
  const wins = closedTrades.filter((t) => t.pnl! > 0);
  const losses = closedTrades.filter((t) => t.pnl! < 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  // Detect patterns
  const patterns: string[] = [];
  if (winRate < 40 && closedTrades.length >= 5) {
    patterns.push("Below 40% win rate — strategy may need adjustment.");
  }
  if (trades.length >= 10) {
    const avgQty = trades.reduce((s, t) => s + (t.quantity ?? 0), 0) / trades.length;
    const highSizers = trades.filter((t) => (t.quantity ?? 0) > avgQty * 2);
    if (highSizers.length > trades.length * 0.3) {
      patterns.push("Inconsistent position sizing — frequently trades 2x+ average size.");
    }
  }

  // Check consecutive losses
  let maxConsecutiveLosses = 0;
  let currentStreak = 0;
  for (const t of [...trades].reverse()) {
    if (t.pnl != null && t.pnl < 0) {
      currentStreak++;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  if (maxConsecutiveLosses >= 3) {
    patterns.push(`Max ${maxConsecutiveLosses} consecutive losses — potential tilt risk.`);
  }

  const confidence = closedTrades.length >= 10 ? 0.8 : closedTrades.length >= 5 ? 0.6 : 0.35;

  return {
    decisionId: `analyst_${Date.now()}`,
    statsSummary: `User ${userId}: ${trades.length} trades (${closedTrades.length} closed), ${wins.length}W/${losses.length}L (${winRate.toFixed(0)}% WR), Total PnL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}. ${analyses.length} analyses run.`,
    behavioralPatterns:
      patterns.length > 0
        ? patterns.join(" ")
        : "No significant behavioral patterns detected with current data volume.",
    recommendations:
      closedTrades.length < 5
        ? "Build up more trade history (at least 10 closed trades) for meaningful behavioral analysis."
        : winRate < 45
          ? "Focus on higher-conviction setups. Quality over quantity — aim for 3-5 well-analyzed trades per week."
          : "Maintain current approach. Review losing trades for common denominators.",
    learningResources:
      winRate < 40
        ? "Study: Mark Douglas 'Trading in the Zone' for emotional discipline. Review SMC/ICT order block entry techniques."
        : "Study: Advanced risk-reward optimization and multi-timeframe confluence analysis.",
    confidence,
  };
}

// ── LLM Prompt Builder ─────────────────────────────────────────────────────

function buildAnalystPrompt(data: UserData, input: AnalystInput): string {
  const { trades, analyses, memories } = data;
  const closedTrades = trades.filter((t) => t.pnl != null);
  const wins = closedTrades.filter((t) => t.pnl! > 0);
  const losses = closedTrades.filter((t) => t.pnl! < 0);
  const totalPnl = closedTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;

  // Pair distribution
  const pairCounts: Record<string, number> = {};
  for (const t of trades) {
    pairCounts[t.pair] = (pairCounts[t.pair] || 0) + 1;
  }
  const topPairs = Object.entries(pairCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([pair, count]) => `${pair}: ${count} trades`)
    .join(", ");

  // Recent analysis confidence
  const avgConfidence =
    analyses.length > 0 ? analyses.reduce((s, a) => s + a.confidence, 0) / analyses.length : 0;

  return `You are a behavioral trading analyst. Analyze this trader's data and produce a weekly behavioral report.

## TRADER DATA
- Total trades: ${trades.length}
- Closed trades: ${closedTrades.length}
- Win/Loss: ${wins.length}W / ${losses.length}L
- Win rate: ${winRate.toFixed(1)}%
- Total PnL: ${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
- Top pairs: ${topPairs || "None"}
- Average analysis confidence: ${avgConfidence.toFixed(0)}%
- Analyses run: ${analyses.length}

## RECENT TRADES (last 10)
${trades
  .slice(0, 10)
  .map(
    (t) =>
      `- ${t.direction} ${t.pair}: qty=${t.quantity ?? "?"}, PnL=${t.pnl ?? "open"} (${new Date(t.created_at).toLocaleDateString()})`,
  )
  .join("\n")}

## RECENT ANALYSES (last 5)
${
  analyses
    .slice(0, 5)
    .map((a) => `- ${a.pair} ${a.timeframe}: ${a.recommendation} (${a.confidence}% conf)`)
    .join("\n") || "No analyses."
}

## USER MEMORY
${memories || "No stored memories."}

## ANALYSIS DIMENSIONS
Analyze these specific areas:
1. **Win rate trends** — improving, declining, or stable?
2. **Risk management** — position sizing consistency, stop-loss discipline
3. **Emotional trading** — signs of revenge trading, FOMO entries, panic exits
4. **Strategy consistency** — sticking to plan or chasing different setups daily
5. **Pair specialization** — focused on few pairs or scattered across many?

## RESPONSE FORMAT (JSON)
Respond with ONLY a valid JSON object:
{
  "statsSummary": "2-3 sentence summary of key stats and performance.",
  "behavioralPatterns": "2-4 specific behavioral patterns detected. Be specific — reference actual numbers.",
  "recommendations": "2-3 actionable, specific recommendations. NOT generic advice.",
  "learningResources": "Specific resources, concepts, or techniques to study based on weaknesses found.",
  "confidence": 0.0-1.0
}

Confidence guidance:
- 0.3-0.5: < 5 closed trades (insufficient data)
- 0.5-0.7: 5-15 trades (patterns emerging)
- 0.7-0.9: 15+ trades (reliable patterns)`;
}

// ── Parse LLM Response ─────────────────────────────────────────────────────

interface AnalystLLMOutput {
  statsSummary?: string;
  behavioralPatterns?: string;
  recommendations?: string;
  learningResources?: string;
  confidence?: number;
}

function parseAnalystResponse(raw: string, userId: string, data: UserData): AnalystReport {
  try {
    let cleaned = raw.trim();
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed: AnalystLLMOutput = JSON.parse(cleaned);

    return {
      decisionId: `analyst_${Date.now()}`,
      statsSummary: parsed.statsSummary || `User ${userId}: Trading behavior analysis.`,
      behavioralPatterns: parsed.behavioralPatterns || "No patterns detected.",
      recommendations: parsed.recommendations || "Continue tracking trades for better analysis.",
      learningResources: parsed.learningResources || "Review trading fundamentals.",
      confidence:
        typeof parsed.confidence === "number" && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.5,
    };
  } catch {
    return ruleBasedAnalyst(userId, data);
  }
}

// ── Main Export ─────────────────────────────────────────────────────────────

/**
 * Analyst agent — generates weekly behavioral analysis reports.
 * Uses real user data (trades, analyses, memories) for personalization.
 * Falls back to rule-based analysis if LLM is unavailable.
 */
export async function generateWeeklyReport(userId: string): Promise<AnalystReport> {
  const data = await collectUserData(userId);

  // Need at least some data for LLM analysis to be worthwhile
  const hasEnoughData = data.trades.length >= 3 || data.analyses.length >= 2;

  if (!hasEnoughData) {
    return ruleBasedAnalyst(userId, data);
  }

  // Try LLM-powered analysis
  try {
    const input: AnalystInput = {
      userId,
      memories: data.memories,
      analyses: data.analyses.length,
      trades: data.trades.length,
      portfolio: 0, // Not used in prompt, but part of type
    };
    const prompt = buildAnalystPrompt(data, input);
    const response = await callLLM([{ role: "user", content: prompt }], {
      temperature: 0.5,
      maxTokens: 500,
      jsonMode: true,
    });

    return parseAnalystResponse(response.content, userId, data);
  } catch {
    return ruleBasedAnalyst(userId, data);
  }
}
