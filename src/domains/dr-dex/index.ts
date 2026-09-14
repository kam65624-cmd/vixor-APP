// ============================================================================
// DR.DEX — Risk & Decision Safety — Public API
// ============================================================================

export {
  type GovernorAction,
  type GovernorDecision,
  type RiskProfile,
  type PaperDecision,
  type RiskAssessment,
  type RiskVerdict,
} from "./types";

export { assessToken, logPaperDecision } from "./functions";
export { assessTokenWithPatterns } from "./candlestick-analyzer";
export type {
  CandlestickAnalysisResult,
  PatternAnalysisResult,
  PatternSummary,
} from "./candlestick-analyzer";

export { DEFAULT_RISK_PROFILE } from "@/domains/risk-governor";
