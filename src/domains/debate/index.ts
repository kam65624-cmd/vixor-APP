// Debate domain — consensus analysis for AI agents
// Phase 2 (F15): Removed dead DebateEngine class (keyword counting stub).
// The real debate engine is in debate/engine.ts when implemented.
// DebateResult type is preserved — used by risk-governor.

export interface DebateResult {
  consensus: string;
  confidence: number;
  summary: string;
  agents: Array<{ name: string; opinion: string; weight: number }>;
  riskOverride?: boolean;
}
