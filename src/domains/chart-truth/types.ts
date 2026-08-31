// ============================================================================
// Vixor Chart Truth — Types
// ============================================================================
//
// Truth Validation compares vision-extracted data against REAL market data.
// This is the P1.6 layer that catches silent errors like:
//   Vision says price=3372.80 but real market price is 3290.00
//
// The truth layer NEVER blocks analysis — it only warns.
// ============================================================================

export type TruthStatus = "verified" | "unverified" | "unreliable";

export interface TruthValidationResult {
  /** Overall truth score (0.0 to 1.0) — how well vision matches reality */
  truthScore: number;

  /** Classification based on the score */
  status: TruthStatus;

  /** Percentage difference between vision price and real market price */
  priceDelta: number | null;

  /** Whether the vision-detected symbol matches a known trading pair */
  symbolMatch: boolean;

  /** Human-readable warnings about discrepancies */
  warnings: string[];
}
