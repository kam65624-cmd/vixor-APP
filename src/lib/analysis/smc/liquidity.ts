// ============================================================================
// Vixor Trading Analysis Engine — Liquidity Zone & Support/Resistance Detection
// ============================================================================
// Liquidity zones are areas where stop-loss orders cluster. In Smart Money
// Concepts, price tends to gravitate toward these zones to fuel institutional
// moves. The two types are:
//
//   BUY_SIDE (BSL): Above swing highs — where buy stops rest
//   SELL_SIDE (SSL): Below swing lows — where sell stops rest
//
// The algorithm clusters swing points by price proximity to find zones where
// multiple stops accumulate. More touches = stronger zone = more likely to
// be swept.
//
// Support/Resistance levels are derived similarly but focus on price reaction
// zones where price has historically reversed.
// ============================================================================

import { OHLCVBar, SwingPoint, LiquidityZone, SRLevel } from "../core/types";
import { detectSwingPoints } from "../core/market-structure";

// ---------------------------------------------------------------------------
// Public API — Liquidity Zones
// ---------------------------------------------------------------------------

/**
 * Detect Liquidity Zones from a set of pre-computed swing points.
 *
 * @param swingPoints Array of SwingPoints (highs and lows)
 * @param bars        Original OHLCV bars (used to check if zones have been swept)
 * @param tolerance   Price proximity tolerance as a fraction (default 0.2%).
 *                    Swing points within this % of each other are clustered.
 * @returns Array of LiquidityZones sorted by strength (descending)
 */
export function detectLiquidityZones(
  swingPoints: SwingPoint[],
  bars: OHLCVBar[],
  tolerance = 0.002
): LiquidityZone[] {
  if (swingPoints.length === 0) return [];

  // Separate swing highs and swing lows
  const swingHighs = swingPoints.filter((sp) => sp.type === "HIGH");
  const swingLows = swingPoints.filter((sp) => sp.type === "LOW");

  const zones: LiquidityZone[] = [];

  // 1. Cluster swing highs → BUY_SIDE zones (Buy-Side Liquidity / BSL)
  const bslZones = clusterSwingPoints(swingHighs, tolerance, "BUY_SIDE");
  zones.push(...bslZones);

  // 2. Cluster swing lows → SELL_SIDE zones (Sell-Side Liquidity / SSL)
  const sslZones = clusterSwingPoints(swingLows, tolerance, "SELL_SIDE");
  zones.push(...sslZones);

  // 3. Sort by strength (number of contributing swing points) descending
  return zones.sort((a, b) => b.strength - a.strength);
}

// ---------------------------------------------------------------------------
// Public API — Support / Resistance Levels
// ---------------------------------------------------------------------------

/**
 * Auto-detect Support and Resistance levels from OHLCV data.
 *
 * @param bars      Array of OHLCV candles (chronological)
 * @param lookback  Number of bars on each side to identify swing points (default 50)
 * @param tolerance Price proximity tolerance as a fraction (default 0.3%)
 * @returns Array of SRLevels sorted by strength (descending)
 */
export function detectSRLevels(
  bars: OHLCVBar[],
  lookback = 50,
  tolerance = 0.003
): SRLevel[] {
  if (bars.length < 7) return [];

  // 1. Find all swing highs and lows using the existing market-structure utility
  const effectiveLookback = Math.min(lookback, Math.floor(bars.length / 3));
  const swingPoints = detectSwingPoints(bars, effectiveLookback, effectiveLookback);

  if (swingPoints.length === 0) return [];

  // Current price (last close)
  const currentPrice = bars[bars.length - 1]!.close;

  // 2. Cluster swing points by price proximity
  const clusters = clusterByPrice(swingPoints, tolerance);

  // 3. Build SR levels from clusters
  const levels: SRLevel[] = clusters.map((cluster) => {
    const prices = cluster.map((sp) => sp.price);
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;

    // Determine type based on current price position
    // Levels very close to current price become PIVOT
    const distance = Math.abs(avgPrice - currentPrice) / currentPrice;
    const type: "SUPPORT" | "RESISTANCE" | "PIVOT" =
      distance < 0.002
        ? "PIVOT"
        : avgPrice < currentPrice
          ? "SUPPORT"
          : "RESISTANCE";

    // Count touches (number of swing points in cluster)
    const touches = cluster.length;

    // Find the latest bar index in the cluster
    const lastIndex = Math.max(...cluster.map((sp) => sp.index));

    return {
      price: avgPrice,
      type,
      touches,
      strength: touches, // Will be normalized below
      lastIndex,
    } satisfies SRLevel;
  });

  // 4. Normalize strength to 0-1 range
  const maxTouches = Math.max(...levels.map((l) => l.touches), 1);
  const normalized = levels.map((level) => ({
    ...level,
    strength: level.touches / maxTouches,
  }));

  // Sort by strength descending
  return normalized.sort((a, b) => b.strength - a.strength);
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Cluster swing points of the same type by price proximity.
 *
 * Algorithm: Sort by price, then iterate and group consecutive points
 * that are within `tolerance` fraction of each other.
 *
 * Returns LiquidityZone objects for each cluster.
 */
function clusterSwingPoints(
  points: SwingPoint[],
  tolerance: number,
  liquidityType: "BUY_SIDE" | "SELL_SIDE"
): LiquidityZone[] {
  if (points.length === 0) return [];

  // Sort by price ascending
  const sorted = [...points].sort((a, b) => a.price - b.price);

  const clusters: SwingPoint[][] = [];
  let currentCluster: SwingPoint[] = [sorted[0]!];

  for (let i = 1; i < sorted.length; i++) {
    const prevPrice = currentCluster[currentCluster.length - 1]!.price;
    const currPrice = sorted[i]!.price;

    // Check if current point is within tolerance of the cluster's representative price
    if (Math.abs(currPrice - prevPrice) / prevPrice <= tolerance) {
      currentCluster.push(sorted[i]!);
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]!];
    }
  }
  clusters.push(currentCluster);

  // Convert clusters to LiquidityZones
  return clusters.map((cluster) => {
    const prices = cluster.map((sp) => sp.price);
    const avgPrice = prices.reduce((s, p) => s + p, 0) / prices.length;

    return {
      type: liquidityType,
      price: avgPrice,
      strength: cluster.length,
      swingPoints: cluster,
    } satisfies LiquidityZone;
  });
}

/**
 * Cluster any swing points (mixed highs and lows) by price proximity.
 * Used for S/R level detection.
 *
 * Returns an array of clusters, each cluster being an array of SwingPoints.
 */
function clusterByPrice(
  points: SwingPoint[],
  tolerance: number
): SwingPoint[][] {
  if (points.length === 0) return [];

  // Sort by price ascending
  const sorted = [...points].sort((a, b) => a.price - b.price);

  const clusters: SwingPoint[][] = [];
  let currentCluster: SwingPoint[] = [sorted[0]!];
  let clusterAvgPrice = sorted[0]!.price;

  for (let i = 1; i < sorted.length; i++) {
    const currPrice = sorted[i]!.price;

    // Check if current point is within tolerance of the running cluster average
    if (Math.abs(currPrice - clusterAvgPrice) / clusterAvgPrice <= tolerance) {
      currentCluster.push(sorted[i]!);
      // Update running average
      clusterAvgPrice =
        currentCluster.reduce((s, sp) => s + sp.price, 0) /
        currentCluster.length;
    } else {
      clusters.push(currentCluster);
      currentCluster = [sorted[i]!];
      clusterAvgPrice = sorted[i]!.price;
    }
  }
  clusters.push(currentCluster);

  return clusters;
}
