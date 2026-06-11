// ============================================================================
// Vixor Trading Analysis Engine — Fair Value Gap (FVG) Detection
// ============================================================================
// Fair Value Gaps are 3-candle patterns where the wicks of candle 1 and
// candle 3 do not overlap, creating a "gap" in price delivery.
//
// Bullish FVG: bars[i].low > bars[i-2].high  → gap up (buying imbalance)
// Bearish FVG: bars[i-2].low > bars[i].high  → gap down (selling imbalance)
//
// The gap represents an area of inefficiency where price is likely to return
// to "fill" the imbalance. Larger gaps are more significant.
//
// We use ATR (Average True Range) as a significance filter to avoid
// detecting micro-gaps that are just noise.
// ============================================================================

import { OHLCVBar, FairValueGap } from "../core/types";
import { atr } from "../core/candle-utils";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect all Fair Value Gaps in a series of OHLCV bars.
 *
 * @param bars Array of OHLCV candles (must be in chronological order)
 * @returns Array of detected FairValueGaps, sorted by bar index ascending
 */
export function detectFVGs(bars: OHLCVBar[]): FairValueGap[] {
  if (bars.length < 3) return [];

  const fvgs: FairValueGap[] = [];

  // Compute ATR(14) for significance filtering
  const atrValue = atr(bars, 14);
  const minGapSize = atrValue * 0.1; // Minimum gap must be > 0.1 × ATR

  for (let i = 2; i < bars.length; i++) {
    const bar0 = bars[i - 2]!; // First candle in the 3-bar pattern
    const bar2 = bars[i]!; // Third candle in the 3-bar pattern

    // --- Bullish FVG ---
    // The low of candle 3 is above the high of candle 1 → gap up
    if (bar2.low > bar0.high) {
      const gapTop = bar2.low;
      const gapBottom = bar0.high;
      const gapSize = gapTop - gapBottom;

      // Filter by significance
      if (gapSize > minGapSize) {
        fvgs.push({
          type: "BULLISH",
          top: gapTop,
          bottom: gapBottom,
          index: i,
          filled: false,
          size: gapSize,
        });
      }
    }

    // --- Bearish FVG ---
    // The high of candle 3 is below the low of candle 1 → gap down
    if (bar0.low > bar2.high) {
      const gapTop = bar0.low;
      const gapBottom = bar2.high;
      const gapSize = gapTop - gapBottom;

      // Filter by significance
      if (gapSize > minGapSize) {
        fvgs.push({
          type: "BEARISH",
          top: gapTop,
          bottom: gapBottom,
          index: i,
          filled: false,
          size: gapSize,
        });
      }
    }
  }

  // Now check which FVGs have been filled by subsequent price action
  return markFilledFVGs(fvgs, bars);
}

/**
 * Get unfilled FVGs that are near the current price.
 *
 * "Near" is defined as being within `proximityATR` distance from the
 * current price. This is useful for finding active imbalances that price
 * may react to.
 *
 * @param fvgs          Previously detected FVGs (with fill status)
 * @param currentPrice  The current price of the asset
 * @param proximityATR  How close (in ATR units) an FVG must be to be considered "near"
 * @returns Unfilled FVGs within proximity of the current price
 */
export function getActiveFVGs(
  fvgs: FairValueGap[],
  currentPrice: number,
  proximityATR: number,
): FairValueGap[] {
  return fvgs.filter((fvg) => {
    if (fvg.filled) return false;

    // Check if the FVG zone overlaps with the proximity band around current price
    const priceTop = currentPrice + proximityATR;
    const priceBottom = currentPrice - proximityATR;

    // FVG is "near" if its zone overlaps with [priceBottom, priceTop]
    const overlaps = fvg.top >= priceBottom && fvg.bottom <= priceTop;

    // Or if the current price is inside the FVG zone
    const insideFVG = currentPrice >= fvg.bottom && currentPrice <= fvg.top;

    return overlaps || insideFVG;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Mark FVGs as filled if subsequent price action has returned to the gap zone.
 *
 * A bullish FVG is filled when price drops back through the entire gap
 * (a bar's low <= fvg.bottom, meaning price has fully retraced through the gap).
 *
 * A bearish FVG is filled when price rises back through the entire gap
 * (a bar's high >= fvg.top, meaning price has fully retraced through the gap).
 *
 * The FVG is considered "filled" when price fully traverses through the gap
 * zone (100% fill). A partial fill is not enough — the gap must be
 * completely closed.
 */
function markFilledFVGs(fvgs: FairValueGap[], bars: OHLCVBar[]): FairValueGap[] {
  return fvgs.map((fvg) => {
    // Scan bars AFTER the FVG formation for fills
    for (let i = fvg.index + 1; i < bars.length; i++) {
      const bar = bars[i]!;

      if (fvg.type === "BULLISH") {
        // Bullish FVG is filled when a bar's low goes below the FVG bottom
        // (price has fully retraced through the gap)
        if (bar.low <= fvg.bottom) {
          return {
            ...fvg,
            filled: true,
            filledIndex: i,
          };
        }
      } else {
        // Bearish FVG is filled when a bar's high goes above the FVG top
        // (price has fully retraced through the gap)
        if (bar.high >= fvg.top) {
          return {
            ...fvg,
            filled: true,
            filledIndex: i,
          };
        }
      }
    }

    return fvg;
  });
}
