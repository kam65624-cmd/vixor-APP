// Backward-compatible re-export — actual code moved to @/domains/copilot/server/agents
export {
  ALL_AGENTS,
  getAgentById,
  autoSelectAgent,
  marketAnalystAgent,
  riskManagerAgent,
  newsAnalystAgent,
  strategyBuilderAgent,
} from "@/domains/copilot/server/agents";
export type { AgentId, AgentDefinition, UserContext } from "@/domains/copilot/server/agents";
