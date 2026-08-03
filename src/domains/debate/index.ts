// Debate domain — consensus analysis for AI agents
export interface DebateResult {
  consensus: string;
  confidence: number;
  summary: string;
  agents: Array<{ name: string; opinion: string; weight: number }>;
  riskOverride?: boolean;
}

export class DebateEngine {
  async run(input: Record<string, unknown>): Promise<DebateResult> {
    const pair = String(input.pair ?? "UNKNOWN");
    const trend = String(input.trend ?? "NEUTRAL");
    const riskLevel = String(input.risk_level ?? "MEDIUM");

    // Build agents from whatever context is available
    const agents: Array<{ name: string; analysis: string }> = Array.isArray(input.agents)
      ? input.agents
      : [
          { name: "Risk", analysis: `Risk level: ${riskLevel}.` },
          { name: "Trend", analysis: `Trend: ${trend}.` },
        ];

    const bullish = agents.filter((a) => {
      const l = a.analysis.toLowerCase();
      return l.includes("bullish") || l.includes("low risk");
    }).length;
    const bearish = agents.filter((a) => {
      const l = a.analysis.toLowerCase();
      return l.includes("bearish") || l.includes("high risk");
    }).length;
    const total = agents.length || 1;

    return {
      consensus: bullish > bearish ? "bullish" : bullish < bearish ? "bearish" : "neutral",
      confidence: Math.max(bullish, bearish) / total,
      summary: `Debate for ${pair}: ${bullish > bearish ? "BULLISH" : bullish < bearish ? "BEARISH" : "NEUTRAL"} consensus.`,
      agents: agents.map((a) => ({ name: a.name, opinion: a.analysis.slice(0, 300), weight: 1 })),
    };
  }
}
