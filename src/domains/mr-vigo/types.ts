// ============================================================================
// MR.VIGO — Investigation Domain — Public Types
// ============================================================================
//
// MR.VIGO is the Investigation & Evidence surface of the VIXOR product.
// It aggregates facts from multiple data sources (Shield, Hunt, Market, Analysis)
// and presents them as discrete pieces of evidence, each with a source,
// timestamp, and status. The goal is to give the user enough context to
// form a Decision without requiring blind trust in any single signal.
//
// Key principle: unknowns are surfaced, not hidden.
// ============================================================================

/**
 * The status of an evidence item:
 *   - "verified": confirmed by ≥2 independent sources
 *   - "reported": fetched from a single source, not cross-validated
 *   - "unavailable": attempted but no data returned
 *   - "unknown": not yet attempted (lazy investigation)
 */
export type EvidenceStatus = "verified" | "reported" | "unavailable" | "unknown";

/**
 * The serializable value types an evidence item can carry. Restricted
 * to JSON-safe values so the result can cross the server→client boundary
 * without violating TanStack Start's serialization rules.
 */
export type EvidenceValue =
  string | number | boolean | null | string[] | number[] | { website: boolean; twitter: boolean };

/**
 * A single piece of evidence. Every fact in an MR.VIGO investigation
 * must be wrapped in this structure so the UI can render its source
 * and confidence consistently.
 */
export interface Evidence {
  /** A short, human-readable label (e.g. "Honeypot check", "Top-10 holders") */
  label: string;
  /** The actual data payload (score, percentage, boolean, etc.) */
  value: EvidenceValue;
  /** Where this evidence came from (GoPlus, RugCheck, Birdeye, etc.) */
  source: string;
  /** When this evidence was fetched (ISO timestamp) */
  fetchedAt: string;
  /** Confidence status of this evidence */
  status: EvidenceStatus;
  /** Optional: human-readable explanation of the result */
  detail?: string;
}

/**
 * An "Unknown" is something MR.VIGO tried to verify but could not.
 * Surfacing unknowns is critical — the plan is explicit that MR.VIGO
 * never hides uncertainty.
 */
export interface Unknown {
  /** What MR.VIGO was trying to determine (e.g. "Token deployer history") */
  topic: string;
  /** Why it could not be determined (e.g. "API returned 404", "Field not exposed") */
  reason: string;
  /** A suggested next step the user could take to resolve this */
  suggestion?: string;
}

/**
 * The aggregated result of an investigation. This is what the UI
 * receives from the server function.
 */
export interface InvestigationResult {
  /** The token under investigation */
  token: {
    address: string;
    chain: string;
    name: string;
    symbol: string;
    imageUrl?: string;
  };

  /** Overall verdict derived from the evidence (not an opaque score) */
  verdict: "SAFE" | "CAUTION" | "SUSPICIOUS" | "DANGER" | "UNABLE_TO_VERIFY";

  /** Evidence grouped by category */
  evidence: {
    security: Evidence[];
    liquidity: Evidence[];
    ownership: Evidence[];
    market: Evidence[];
    technical?: Evidence[];
  };

  /** Items MR.VIGO could not verify — surfaced, not hidden */
  unknowns: Unknown[];

  /** ISO timestamp of when this investigation was assembled */
  investigatedAt: string;

  /** Whether all critical evidence was successfully fetched */
  complete: boolean;
}
