// ============================================================================
// VIXOR V2 — Security Scan Provider
// ============================================================================
//
// Runs and tracks security scans (RugCheck, GoPlus, contract analysis, etc.).
// A failed or partial scan is NEVER considered safe.
// ============================================================================

import type { ProviderResult } from "./types";
import type { SecurityScan } from "../types";

export interface SecurityScanInput {
  caseId: string;
  targetId: string;
  network: string | null;
  address: string;
  /** Optional list of evidence categories to focus on */
  categories?: string[];
}

export interface SecurityScanProvider {
  runScan(input: SecurityScanInput): Promise<ProviderResult<SecurityScan>>;
  getScanStatus(scanId: string): Promise<ProviderResult<SecurityScan>>;
}
