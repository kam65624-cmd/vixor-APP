// ============================================================================
// Vixor Trading Analysis Engine — Order Block Detection
// ============================================================================
// Order Blocks are the last opposing candle before a strong impulse move that
// creates a Fair Value Gap. They represent institutional order flow.
//
// Algorithm:
//   1. Calculate average body size across the dataset for a dynamic threshold
//   2. Scan for impulse candles (body > 1.5× average body)
//   3. Verify that the impulse creates a Fair Value Gap (3-candle imbalance)
//   4. Identify the last opposing candle immediately before the impulse
//   5. Mark the OB as mitigated when price returns to the OB zone later
// ============================================================================

import { OHLCVBar, OrderBlock } from "../core/types";
import {
  bodySize as candleBodySize,
  avgBodySize,
  isBullish,
  isBearish,
} from "../core/candle-utils";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect Order Blocks in a series of OHLCV bars.
 *
 * @param bars     Array of OHLCV candles (must be in chronological order)
 * @param lookback Number of bars before the impulse to scan for the opposing
 *                 candle (default 3). The OB is typically the candle right
 *                 before the impulse, but we allow looking further back.
 * @returns Array of detected OrderBlocks, sorted by startIndex ascending
 */
export function detectOrderBlocks(bars: OHLCVBar[], lookback = 3): OrderBlock[] {
  if (bars.length < 4) return []; // Need at least 4 bars: opposing + impulse + 2 for FVG context

  const orderBlocks: OrderBlock[] = [];

  // 1. Calculate average body size for threshold
  const avgBody = avgBodySize(bars, bars.length);

  // 2. Scan for impulse candles starting from index 2 (need i-2 for FVG check)
  for (let i = 2; i < bars.length; i++) {
    const bar = bars[i]!;
    const body = candleBodySize(bar);

    // Impulse candle must have a body > 1.5× the average body size
    if (body <= avgBody * 1.5) continue;

    // Determine impulse direction
    const bullishImpulse = isBullish(bar);
    const bearishImpulse = isBearish(bar);

    if (!bullishImpulse && !bearishImpulse) continue; // Doji — skip

    // 3. Check if this impulse creates a Fair Value Gap
    const fvgResult = createsFVG(bars, i);
    if (!fvgResult) continue;

    // The impulse direction must match the FVG direction
    if (bullishImpulse && fvgResult.type !== "BULLISH") continue;
    if (bearishImpulse && fvgResult.type !== "BEARISH") continue;

    // 4. Find the last opposing candle before the impulse
    const opposingCandleIdx = findOpposingCandle(bars, i, bullishImpulse, lookback);
    if (opposingCandleIdx === null) continue;

    const obBar = bars[opposingCandleIdx]!;

    // Compute strength: ratio of impulse body to average body, mapped to 0-100
    // At 1.5× avg → ~50, at 3× avg → 100
    const rawStrength = (body / avgBody - 1) / 2; // 0 at 1× avg, 1 at 3× avg
    const strength = Math.min(100, Math.max(0, Math.round(rawStrength * 100)));

    const ob: OrderBlock = {
      type: bullishImpulse ? "BULLISH" : "BEARISH",
      high: obBar.high,
      low: obBar.low,
      startIndex: opposingCandleIdx,
      endIndex: i, // The impulse candle marks the end of the OB formation
      mitigated: false,
      strength,
    };

    // 5. Check if the OB has been mitigated by subsequent price action
    const checkedOB = checkMitigation(ob, bars);

    orderBlocks.push(checkedOB);
  }

  // Deduplicate: if two OBs of the same type overlap significantly, keep the stronger one
  return deduplicateOrderBlocks(orderBlocks);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Check if bars form a Fair Value Gap at index `i` (the impulse candle).
 *
 * A Fair Value Gap requires 3 consecutive candles:
 *   - Bullish FVG: bars[i-2].high < bars[i].low  → gap between wicks
 *   - Bearish FVG: bars[i-2].low > bars[i].high   → gap between wicks
 */
function createsFVG(
  bars: OHLCVBar[],
  i: number,
): { type: "BULLISH" | "BEARISH"; top: number; bottom: number } | null {
  if (i < 2) return null;

  const barPrev2 = bars[i - 2]!;
  const barCurrent = bars[i]!;

  // Bullish FVG: gap up — the low of the current bar is above the high of bar i-2
  if (barCurrent.low > barPrev2.high) {
    return {
      type: "BULLISH",
      top: barCurrent.low,
      bottom: barPrev2.high,
    };
  }

  // Bearish FVG: gap down — the high of the current bar is below the low of bar i-2
  if (barPrev2.low > barCurrent.high) {
    return {
      type: "BEARISH",
      top: barPrev2.low,
      bottom: barCurrent.high,
    };
  }

  return null;
}

/**
 * Find the last opposing candle before the impulse at index `impulseIndex`.
 *
 * Bullish impulse → look for last bearish candle (close < open) in the lookback window.
 * Bearish impulse → look for last bullish candle (close > open) in the lookback window.
 *
 * We search backwards from (impulseIndex - 1) up to (impulseIndex - lookback).
 */
function findOpposingCandle(
  bars: OHLCVBar[],
  impulseIndex: number,
  bullishImpulse: boolean,
  lookback: number,
): number | null {
  const start = impulseIndex - 1;
  const end = Math.max(0, impulseIndex - lookback);

  for (let j = start; j >= end; j--) {
    const bar = bars[j]!;
    if (bullishImpulse) {
      // Look for bearish candle (close < open)
      if (isBearish(bar)) return j;
    } else {
      // Look for bullish candle (close > open)
      if (isBullish(bar)) return j;
    }
  }

  return null;
}

/**
 * Check if an Order Block has been mitigated.
 *
 * A bullish OB is mitigated when price drops below the OB's low after it was formed.
 * A bearish OB is mitigated when price rises above the OB's high after it was formed.
 *
 * Mitigation means the zone has been "tested" and is no longer considered a fresh
 * institutional interest area.
 */
function checkMitigation(ob: OrderBlock, bars: OHLCVBar[]): OrderBlock {
  // Only check bars AFTER the OB formation (endIndex)
  for (let i = ob.endIndex + 1; i < bars.length; i++) {
    const bar = bars[i]!;

    if (ob.type === "BULLISH") {
      // Bullish OB is mitigated when a candle's low drops below the OB low
      if (bar.low < ob.low) {
        return {
          ...ob,
          mitigated: true,
          mitigatedIndex: i,
        };
      }
    } else {
      // Bearish OB is mitigated when a candle's high rises above the OB high
      if (bar.high > ob.high) {
        return {
          ...ob,
          mitigated: true,
          mitigatedIndex: i,
        };
      }
    }
  }

  // Not mitigated — return as-is
  return ob;
}

/**
 * Deduplicate overlapping Order Blocks of the same type.
 *
 * If two OBs of the same type overlap by more than 50% of the smaller one,
 * keep the one with higher strength.
 */
function deduplicateOrderBlocks(obs: OrderBlock[]): OrderBlock[] {
  if (obs.length <= 1) return obs;

  // Sort by startIndex ascending
  const sorted = [...obs].sort((a, b) => a.startIndex - b.startIndex);
  const result: OrderBlock[] = [];

  for (const ob of sorted) {
    const overlappingIdx = result.findIndex((existing) => {
      if (existing.type !== ob.type) return false;

      // Calculate overlap
      const overlapTop = Math.min(existing.high, ob.high);
      const overlapBottom = Math.max(existing.low, ob.low);
      const overlapSize = overlapTop - overlapBottom;

      if (overlapSize <= 0) return false; // No overlap

      const smallerRange = Math.min(existing.high - existing.low, ob.high - ob.low);

      return overlapSize / smallerRange > 0.5;
    });

    if (overlappingIdx !== -1) {
      // Keep the stronger one
      const existing = result[overlappingIdx]!;
      if (ob.strength > existing.strength) {
        result[overlappingIdx] = ob;
      }
    } else {
      result.push(ob);
    }
  }

  return result;
}
