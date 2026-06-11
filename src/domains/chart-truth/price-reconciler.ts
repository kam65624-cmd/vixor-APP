// ============================================================================
// Vixor Chart Truth — Price Reconciler
// ============================================================================
//
// Compares the price extracted by vision (from the chart image) against
// the real market price fetched from APIs.
//
// Returns the absolute percentage delta between the two prices.
// A delta of 0 means perfect match; a delta of 5 means 5% difference.
// ============================================================================

/**
 * Calculate the percentage delta between vision-extracted price and real market price.
 *
 * @param visionPrice  - Price read from the chart image by the vision model
 * @param marketPrice  - Real market price fetched from APIs (Binance, TwelveData, etc.)
 * @returns Percentage difference (absolute value), or 0 if either input is null
 */
export function reconcilePrice(
  visionPrice: number | null,
  marketPrice: number | null,
): number {
  // If either price is missing, we can't reconcile — return 0 (no delta info)
  if (visionPrice === null || marketPrice === null) return 0;
  if (visionPrice <= 0 || marketPrice <= 0) return 0;

  const delta = Math.abs(visionPrice - marketPrice) / marketPrice * 100;
  return Math.round(delta * 100) / 100; // Round to 2 decimal places
}
