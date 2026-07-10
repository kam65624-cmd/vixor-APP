import type { AnalystReport } from "../types";

// Analyst agent — weekly behavioral report
export async function generateWeeklyReport(userId: string): Promise<AnalystReport> {
  return {
    decisionId: `analyst_${Date.now()}`,
    statsSummary: `User ${userId}: Trading behavior analysis for the past 7 days.`,
    behavioralPatterns: "Tends to overtrade during high volatility sessions. Better performance during Asian session.",
    recommendations: "Focus on fewer, higher-conviction trades. Maintain trading journal consistency.",
    learningResources: "Review risk management fundamentals. Study position sizing techniques.",
    confidence: 0.6,
  };
}