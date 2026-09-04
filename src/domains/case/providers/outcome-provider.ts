// ============================================================================
// VIXOR V2 — Outcome Provider
// ============================================================================
//
// Tracks and retrieves case outcomes for ECHO history.
// Does NOT change past decisions. Does NOT shame the user.
// Does NOT pressure further trading based on outcomes.
// ============================================================================

import type { ProviderResult } from "./types";
import type { Outcome } from "../types";

export interface OutcomeProvider {
  /**
   * Starts tracking an outcome for a case that has a recorded decision.
   * Returns the initial outcome record in "pending" state.
   */
  startTracking(caseId: string): Promise<ProviderResult<Outcome>>;
  /**
   * Returns the current outcome for a case.
   */
  getOutcome(caseId: string): Promise<ProviderResult<Outcome>>;
}
