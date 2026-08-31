// ============================================================================
// VIXOR Experiment Domain — Barrel
// ============================================================================
export {
  EvolutionEngine,
  type EvolutionConfig,
  type EvolutionResult,
  type GenerationStats,
  type Individual,
  type ParameterSpec,
  type ParameterSpace,
} from "./evolution";

export {
  ExperimentRunner,
  runSingleBacktest,
  type ExperimentConfig,
  type ExperimentResult,
  type LlmRouterLike,
} from "./runner";

export {
  SYSTEM_PROMPT,
  buildRoundPrompt,
  buildStrategyTemplatePrompt,
  buildMutationPrompt,
  extractIndicatorParams,
  parseLlmCandidates,
  type CandidateRiskParams,
  type LlmCandidate,
  type PreviousResult,
} from "./prompts";
