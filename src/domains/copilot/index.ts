// ============================================================================
// Copilot Domain — Barrel Export
// ============================================================================

// Server functions
export * from "./functions";
export * from "./conversations";

// Types
export type {
  AgentId,
  AgentDefinition,
  UserContext,
  ChatMessage,
  AgentResponse,
  ConsensusResponse,
  TelegramUser,
  // Phase C.1 — VIXOR AI 4 Agents
  VixorAgentId,
  DecisionType,
  DecisionFeedback,
  DecisionSeverity,
  CoachSentiment,
  RiskLevel,
  TradeAction,
  HunterSignal,
  CoachInput,
  CoachResponse,
  AnalystInput,
  AnalystReport,
  GovernorInput,
  RiskProfile,
  RiskDecisionType,
  RiskDecision,
  HunterInput,
  HunterScore,
} from "./types";

// Server modules
export {
  ALL_AGENTS,
  getAgentById,
  autoSelectAgent,
  marketAnalystAgent,
  riskManagerAgent,
  newsAnalystAgent,
  strategyBuilderAgent,
} from "./server/agents";
export { runAgent, runConsensus } from "./server/agent-orchestrator";
