// ============================================================================
// Vixor Debate Engine — Public API
// ============================================================================
//
// The Debate Engine provides multi-agent cross-validation of analysis results.
// Four agents with different perspectives vote on each signal:
//   - Analyst (1.0): Follows the primary analysis
//   - Strategist (1.2): Evaluates trend + risk/reward quality
//   - RiskGuard (1.5): Prioritizes risk management (highest authority)
//   - Contrarian (0.8): Devil's advocate — challenges the thesis
//
// The engine is OPT-IN, gated by ENABLE_DEBATE_ENGINE=true.
// It attaches results to AnalysisResult._debate for downstream consumption.
// ============================================================================

export { DebateEngine } from "./engine/debate.engine";
export { type DebateResult, type AgentVote, type AgentSide, type AgentName } from "./types";
