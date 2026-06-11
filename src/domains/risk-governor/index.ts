// ============================================================================
// Vixor Risk Governor — Public API
// ============================================================================
//
// The Risk Governor evaluates analysis signals against risk rules
// and produces advisory decisions about position sizing and signal approval.
//
// Key principles:
//   - SYNCHRONOUS — no async, no DB, no API calls
//   - ADVISORY — never executes anything, only suggests
//   - STANDALONE — zero coupling to existing modules (only imports types)
//   - SAFE — never throws, always returns a decision
//
// Usage:
//   const governor = new RiskGovernor();
//   const decision = governor.evaluate(analysisResult, userProfile, debateResult);
//   if (decision.approved) { /* proceed with decision.suggestedSizePct */ }
// ============================================================================

export { RiskGovernor } from "./engine/governor.engine";
export {
  type RiskProfile,
  type GovernorDecision,
  type GovernorAction,
  DEFAULT_RISK_PROFILE,
} from "./types";
export {
  evaluateRiskLevel,
  evaluateRR,
  evaluateConfidence,
  compositeScore,
} from "./rules/risk-rules";
