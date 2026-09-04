// ============================================================================
// VIXOR V2 — Discovery Provider
// ============================================================================
//
// Returns the target feed and signal provenance for MOXI discovery.
// Does NOT return investment recommendations or profit promises.
// ============================================================================

import type { ProviderResult } from "./types";
import type { Signal, Target } from "../types";

export interface ListTargetsInput {
  /** Optional filter by network, e.g. "ethereum", "solana" */
  network?: string;
  /** Optional search query */
  query?: string;
  /** Maximum number of targets to return */
  limit?: number;
}

export interface DiscoveryProvider {
  listTargets(input?: ListTargetsInput): Promise<ProviderResult<Target[]>>;
  getSignal(targetId: string): Promise<ProviderResult<Signal>>;
}
