// ============================================================================
// VIXOR V2 — Evidence Provider
// ============================================================================
//
// Returns facts and sources for MR.VIGO investigation.
// Evidence describes WHAT was observed. It does NOT interpret risk.
// Risk interpretation is the role of the risk assessment layer.
// ============================================================================

import type { ProviderResult } from "./types";
import type { EvidenceItem } from "../types";

export interface EvidenceProvider {
  /**
   * Returns all evidence items associated with a case.
   * Items MUST include a caseId that matches the input.
   */
  getEvidence(caseId: string): Promise<ProviderResult<EvidenceItem[]>>;
}
