// ============================================================================
// Vixor Debate Engine — Types
// ============================================================================
//
// Multi-agent voting system that cross-validates analysis results.
// Four agents with different perspectives vote on the signal:
//   - Analyst: Follows the primary analysis recommendation
//   - Strategist: Evaluates based on trend + risk/reward quality
//   - RiskGuard: Prioritizes risk management (highest authority)
//   - Contrarian: Devil's advocate — always challenges the thesis
//
// The engine produces a weighted consensus with a final confidence score.
// ============================================================================

export type AgentSide = "BULL" | "BEAR" | "NEUTRAL";
export type AgentName = "Analyst" | "Strategist" | "RiskGuard" | "Contrarian";

export interface AgentVote {
  /** Which agent cast this vote */
  agent: AgentName;

  /** The agent's directional vote */
  side: AgentSide;

  /** The agent's confidence in its vote (0.0 to 1.0) */
  confidence: number;

  /** Why the agent voted this way */
  reasoning: string;

  /** Importance multiplier for weighted scoring */
  weight: number;
}

export interface DebateResult {
  /** The winning side after weighted voting */
  finalSide: AgentSide;

  /** Final confidence as percentage (0-100) */
  finalConfidence: number;

  /** True if 3+ agents agree on the same side */
  consensus: boolean;

  /** True if RiskGuard vetoed a high-risk signal */
  riskOverride: boolean;

  /** All agent votes for transparency */
  votes: AgentVote[];

  /** Human-readable summary of the debate outcome */
  summary: string;
}
