// ============================================================================
// VIXOR AI Behavioral Analyst Agent — Weekly Behavioral Report
// ============================================================================
//
// Generates weekly behavioral analysis reports (Sunday 08:00 UTC via cron).
// Uses Anthropic Claude for advanced reasoning on behavioral patterns.
// Stores reports in vixor_decisions with type='report'.
// ============================================================================

import { llmRouter } from "@/shared/llm";
import { MemoryStore } from "@/shared/memory";
import { storeDecision } from "./decision-store";
import type { AnalystReport } from "../types";

/** Coerced JSON output from the LLM. */
interface AnalystLLMOutput {
  statsSummary?: string;
  behavioralPatterns?: string;
  recommendations?: string;
  learningResources?: string;
}

/**
 * Builds the Behavioral Analyst system prompt.
 */
export function buildAnalystSystemPrompt(): string {
  return `You are VIXOR Behavioral Analyst, an expert in trading psychology and behavioral finance.

## YOUR ROLE
You analyze a trader's behavior over the past week to produce a personalized behavioral report. You identify patterns in their trading decisions, emotional tendencies, strengths, and areas for improvement.

## RESPONSE FORMAT
You MUST respond with ONLY valid JSON (no markdown, no code fences):
\`\`\`
{"statsSummary": "...", "behavioralPatterns": "...", "recommendations": "...", "learningResources": "..."}
\`\`\`

## FIELD RULES
- **statsSummary**: 3-5 sentences summarizing the trader's weekly stats — win rate, average trade size, best/worst pairs, and overall performance metrics. Reference specific numbers.
- **behavioralPatterns**: 4-6 bullet points about behavioral patterns observed. Include strengths (e.g., "Good discipline on stop losses") and weaknesses (e.g., "Tends to chase pumps during high volatility"). Be specific and reference actual behaviors.
- **recommendations**: 3-5 specific, actionable improvement steps for the next week. Each should be a concrete action, not vague advice. Example: "Set a max of 3 trades per day — you tend to overtrade after losses."
- **learningResources**: 2-3 suggested learning topics or resources based on identified weaknesses. Example: "Study risk-reward optimization — your average R:R is below 1:1."

## IMPORTANT RULES
- Be specific — reference actual numbers and patterns from the data provided
- Be constructive — frame weaknesses as growth opportunities
- Never use "As an AI" or disclaimers
- Keep each section focused and actionable
- Use the data provided, don't invent statistics`;
}

/**
 * Builds the user message for the Analyst LLM call.
 */
export function buildAnalystUserMessage(
  memories: string,
  analysisCount: number,
  tradeCount: number,
  portfolioValue: number,
): string {
  return `## WEEKLY BEHAVIORAL DATA

### User Memories (Learned Behaviors)
${memories}

### Activity Stats (Past 7 Days)
- Analyses run: ${analysisCount}
- Trades executed: ${tradeCount}
- Current portfolio value: $${portfolioValue.toLocaleString()}
- Report period: ${new Date(Date.now() - 7 * 24 * 3600_000).toISOString().split("T")[0]} to ${new Date().toISOString().split("T")[0]}

Generate the weekly behavioral report as JSON.`;
}

/**
 * Parses the LLM response into a typed AnalystReport.
 * Falls back to safe defaults if the JSON is malformed.
 */
export function parseAnalystResponse(raw: string, decisionId: string): AnalystReport {
  try {
    const cleaned = raw
      .replace(/^```json?\s*/i, "")
      .replace(/```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned) as AnalystLLMOutput;

    return {
      decisionId,
      statsSummary:
        typeof parsed.statsSummary === "string"
          ? parsed.statsSummary
          : "Stats summary unavailable.",
      behavioralPatterns:
        typeof parsed.behavioralPatterns === "string"
          ? parsed.behavioralPatterns
          : "No behavioral patterns identified.",
      recommendations:
        typeof parsed.recommendations === "string"
          ? parsed.recommendations
          : "No recommendations available.",
      learningResources:
        typeof parsed.learningResources === "string"
          ? parsed.learningResources
          : "No learning resources suggested.",
      confidence: 0.8,
    };
  } catch {
    return {
      decisionId,
      statsSummary: "Weekly stats summary could not be generated.",
      behavioralPatterns: "Behavioral pattern analysis unavailable.",
      recommendations: "Recommendations could not be generated this week.",
      learningResources: "Learning resources unavailable.",
      confidence: 0.3,
    };
  }
}

/**
 * Generates a weekly behavioral analysis report for a user.
 * Designed to be called by the cron endpoint on Sunday 08:00 UTC.
 *
 * @param userId - The user to generate the report for
 * @param overrides - Optional overrides for testing
 * @returns The generated analyst report
 */
export async function generateWeeklyReport(
  userId: string,
  overrides?: {
    memories?: string;
    analysisCount?: number;
    tradeCount?: number;
    portfolioValue?: number;
    llmRouter?: typeof llmRouter;
  },
): Promise<AnalystReport> {
  const router = overrides?.llmRouter ?? llmRouter;
  const { supabaseAdmin } = await import("@/shared/supabase/client.server");

  // Fetch user data in parallel
  const [memoryContext, analysisResult, tradeResult] = await Promise.all([
    overrides?.memories !== undefined
      ? Promise.resolve(overrides.memories)
      : MemoryStore.contextForPrompt(userId),
    supabaseAdmin
      .from("analyses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", new Date(Date.now() - 7 * 24 * 3600_000).toISOString()),
    supabaseAdmin
      .from("daily_signals")
      .select("id", { count: "exact", head: true })
      .gte("signal_date", new Date(Date.now() - 7 * 24 * 3600_000).toISOString().split("T")[0]),
  ]);

  const analysisCount = overrides?.analysisCount ?? analysisResult.count ?? 0;
  const tradeCount = overrides?.tradeCount ?? tradeResult.count ?? 0;
  const portfolioValue = overrides?.portfolioValue ?? 0;

  const systemPrompt = buildAnalystSystemPrompt();
  const userMessage = buildAnalystUserMessage(
    memoryContext,
    analysisCount,
    tradeCount,
    portfolioValue,
  );

  // Use Anthropic Claude for advanced reasoning
  const response = await router.chat({
    messages: [{ role: "user", content: userMessage }],
    systemPrompt,
    temperature: 0.5,
    maxTokens: 2048,
    provider: "anthropic",
    fallbacks: ["zai", "groq"],
    timeoutMs: 30_000,
  });

  // Store decision
  const stored = await storeDecision({
    userId,
    agentId: "analyst",
    decisionType: "report",
    title: `Weekly Behavioral Report — ${new Date().toISOString().split("T")[0]}`,
    description: response.content,
    data: {
      reportType: "weekly_behavioral",
      analysisCount,
      tradeCount,
      portfolioValue,
      period: `${new Date(Date.now() - 7 * 24 * 3600_000).toISOString().split("T")[0]} to ${new Date().toISOString().split("T")[0]}`,
    },
    confidence: 0.8,
  });

  return parseAnalystResponse(response.content, stored.id);
}
