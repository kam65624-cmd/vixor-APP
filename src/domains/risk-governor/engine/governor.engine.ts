// ============================================================================
// Vixor Risk Governor — Engine
// ============================================================================
//
// The Risk Governor evaluates every analysis signal and produces a decision:
//   - PROCEED:     Signal is good, trade at suggested size
//   - REDUCE_SIZE: Signal is OK but risky, reduce position size
//   - WAIT:        Signal is too weak, wait for better setup
//   - BLOCK:       Signal is dangerous, do not trade
//
// The Governor is SYNCHRONOUS — no async, no DB, no API calls.
// It produces ADVISORY suggestions only — never executes anything.
//
// It can consume optional DebateResult to factor in RiskGuard veto.
// ============================================================================

import type { AnalysisResult } from "@/domains/analysis/server/run-analysis";
import type { DebateResult } from "@/domains/debate";
import type { RiskProfile, GovernorDecision, GovernorAction } from "../types";
import { DEFAULT_RISK_PROFILE } from "../types";
import {
  evaluateRiskLevel,
  evaluateRR,
  evaluateConfidence,
  compositeScore,
} from "../rules/risk-rules";

export class RiskGovernor {
  /**
   * Evaluate a signal and produce a risk governance decision.
   * This method is SYNCHRONOUS and NEVER throws.
   *
   * @param signal       - The analysis result to evaluate
   * @param profile      - User's risk profile (defaults to conservative)
   * @param debateResult - Optional debate result from the Debate Engine
   * @returns GovernorDecision with action, size, and warnings
   */
  evaluate(
    signal: AnalysisResult,
    profile: RiskProfile = DEFAULT_RISK_PROFILE,
    debateResult?: DebateResult,
  ): GovernorDecision {
    try {
      // ── WAIT signals are always approved as-is ──
      if (signal.recommendation === "WAIT") {
        return {
          approved: true,
          action: "PROCEED",
          originalSignal: "WAIT",
          adjustedSignal: "WAIT",
          suggestedSizePct: 0,
          reason: "Analysis recommends WAIT — no position to take.",
          warnings: [],
        };
      }

      // ── Calculate composite score from risk rules ──
      const riskMult = evaluateRiskLevel(signal.risk_level);
      const rrMult = evaluateRR(signal.rr);
      const confMult = evaluateConfidence(signal.confidence);
      const composite = compositeScore(riskMult, rrMult, confMult);

      // ── Build warnings ──
      const warnings: string[] = [];
      if (signal.risk_level === "HIGH") {
        warnings.push("High risk setup — size reduced significantly.");
      }
      if (rrMult <= 0.5) {
        warnings.push("Poor risk/reward ratio — the potential reward does not justify the risk.");
      }
      if (signal.confidence < 60) {
        warnings.push("Low confidence signal — consider waiting for a clearer setup.");
      }
      if (debateResult?.riskOverride) {
        warnings.push("RiskGuard agent vetoed this signal — proceed with extreme caution.");
      }

      // ── Determine action based on composite score ──
      let action: GovernorAction;
      let adjustedSignal: "BUY" | "SELL" | "WAIT" = signal.recommendation;
      let suggestedSizePct: number;
      let reason: string;

      // Risk override from Debate Engine: force REDUCE_SIZE
      if (debateResult?.riskOverride === true) {
        action = "REDUCE_SIZE";
        suggestedSizePct = Math.min(composite, 0.25);
        adjustedSignal = signal.recommendation;
        reason = `RiskGuard veto: high-risk signal with debate override. Position size capped at 25%. Composite score: ${composite.toFixed(2)}.`;
      }
      // Very low composite: BLOCK
      else if (composite < 0.3) {
        action = "BLOCK";
        adjustedSignal = "WAIT";
        suggestedSizePct = 0;
        reason = `Composite risk score too low (${composite.toFixed(2)}). Risk level: ${signal.risk_level}, RR: ${signal.rr}, Confidence: ${signal.confidence}%. Signal blocked for safety.`;
      }
      // Marginal composite: REDUCE_SIZE
      else if (composite < 0.6) {
        action = "REDUCE_SIZE";
        suggestedSizePct = composite;
        reason = `Marginal risk score (${composite.toFixed(2)}). Position size reduced. Risk level: ${signal.risk_level}, RR: ${signal.rr}, Confidence: ${signal.confidence}%.`;
      }
      // Good composite: PROCEED
      else {
        action = "PROCEED";
        suggestedSizePct = composite;
        reason = `Good risk profile (composite: ${composite.toFixed(2)}). Risk level: ${signal.risk_level}, RR: ${signal.rr}, Confidence: ${signal.confidence}%. Proceeding with suggested size.`;
      }

      // ── Cap suggested size to profile max ──
      suggestedSizePct = Math.min(suggestedSizePct, profile.maxPositionSizePct / 0.02);

      // ── Round for readability ──
      suggestedSizePct = Math.round(suggestedSizePct * 100) / 100;

      return {
        approved: action === "PROCEED" || action === "REDUCE_SIZE",
        action,
        originalSignal: signal.recommendation,
        adjustedSignal,
        suggestedSizePct,
        reason,
        warnings,
      };
    } catch (err) {
      // NEVER throw — return a safe default
      return {
        approved: false,
        action: "WAIT",
        originalSignal: signal.recommendation,
        adjustedSignal: "WAIT",
        suggestedSizePct: 0,
        reason: "Risk Governor encountered an error — defaulting to WAIT for safety.",
        warnings: ["Governor evaluation failed. Treat this signal with maximum caution."],
      };
    }
  }
}
