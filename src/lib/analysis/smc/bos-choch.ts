// ============================================================================
// Vixor Trading Analysis Engine — Break of Structure & Change of Character
// ============================================================================
// Re-exports the BOS/CHoCH detection from market-structure and adds additional
// utilities for real-time BOS/CHoCH detection and trend determination from
// swing structure.
//
// BOS (Break of Structure): Continuation of the current trend. A swing point
// is broken in the direction of the prevailing trend.
//
// CHoCH (Change of Character): Reversal signal. A swing point is broken
// AGAINST the prevailing trend, indicating a potential trend change.
// ============================================================================

import { OHLCVBar, SwingPoint, BOSEvent, TrendDirection } from "../core/types";
import {
  detectBOSandCHoCH as detectBOSFromStructure,
  detectSwingPoints,
  classifySwingStructure,
} from "../core/market-structure";

// Re-export the core market-structure functions under their original names
export { detectBOSFromStructure as detectBOSandCHoCH, detectSwingPoints, classifySwingStructure };

// ---------------------------------------------------------------------------
// Public API — Extended BOS/CHoCH Detection
// ---------------------------------------------------------------------------

/**
 * Detect if a BOS or CHoCH occurred at the given bar by analyzing swing points.
 *
 * This function provides a higher-level interface that combines:
 *   1. The structure-based BOS/CHoCH detection from market-structure.ts
 *   2. Bar-level price break detection for real-time analysis
 *
 * @param bars       Array of OHLCV candles (chronological order)
 * @param swingHighs Pre-detected swing highs
 * @param swingLows  Pre-detected swing lows
 * @returns Object containing the most recent BOS/CHoCH and the full event list
 */
export function detectRecentBOS(
  bars: OHLCVBar[],
  swingHighs: SwingPoint[],
  swingLows: SwingPoint[]
): {
  lastBOS: {
    price: number;
    type: "BOS" | "CHoCH";
    direction: TrendDirection;
  } | null;
  recentBOSList: BOSEvent[];
} {
  if (bars.length < 3 || (swingHighs.length === 0 && swingLows.length === 0)) {
    return { lastBOS: null, recentBOSList: [] };
  }

  // 1. Run the structure-based BOS/CHoCH detection
  const allSwings = [...swingHighs, ...swingLows].sort(
    (a, b) => a.index - b.index
  );
  const classifiedSwings = classifySwingStructure(allSwings);
  const structureEvents = detectBOSFromStructure(classifiedSwings, bars);

  // 2. Also detect bar-level breaks (real-time price breaking swing levels)
  const barBreakEvents = detectBarLevelBreaks(bars, swingHighs, swingLows);

  // 3. Merge and deduplicate all events
  const allEvents = [...structureEvents, ...barBreakEvents];
  const dedupedEvents = deduplicateBOSEvents(allEvents);

  // Find the last event
  const lastEvent = dedupedEvents.length > 0 ? dedupedEvents[dedupedEvents.length - 1]! : null;

  return {
    lastBOS: lastEvent
      ? {
          price: lastEvent.price,
          type: lastEvent.type,
          direction: lastEvent.direction,
        }
      : null,
    recentBOSList: dedupedEvents,
  };
}

/**
 * Determine the current trend direction from swing structure.
 *
 * Compares the last 2-3 swing highs and swing lows:
 *   - HH (Higher High) + HL (Higher Low) = BULLISH
 *   - LH (Lower High) + LL (Lower Low) = BEARISH
 *   - Mixed = NEUTRAL / SIDEWAYS
 *
 * @param swingHighs Pre-detected swing highs
 * @param swingLows  Pre-detected swing lows
 * @returns Object with trend direction and structure description
 */
export function determineTrendFromSwings(
  swingHighs: SwingPoint[],
  swingLows: SwingPoint[]
): {
  direction: TrendDirection;
  structure: string;
} {
  if (swingHighs.length === 0 && swingLows.length === 0) {
    return { direction: "NEUTRAL", structure: "INSUFFICIENT_DATA" };
  }

  // Use the classifySwingStructure utility to assign HH/HL/LH/LL labels
  const allSwings = [...swingHighs, ...swingLows].sort((a, b) => a.index - b.index);
  const classified = classifySwingStructure(allSwings);

  const classifiedHighs = classified.filter((sp) => sp.type === "HIGH");
  const classifiedLows = classified.filter((sp) => sp.type === "LOW");

  // Look at the most recent 3 swing points of each type
  const recentHighs = classifiedHighs.slice(-3);
  const recentLows = classifiedLows.slice(-3);

  // Count structure labels
  let hhCount = 0;
  let lhCount = 0;
  let hlCount = 0;
  let llCount = 0;

  for (const sp of recentHighs) {
    if (sp.structure === "HH") hhCount++;
    else if (sp.structure === "LH") lhCount++;
  }

  for (const sp of recentLows) {
    if (sp.structure === "HL") hlCount++;
    else if (sp.structure === "LL") llCount++;
  }

  // Determine trend from the pattern
  const bullishSignals = hhCount + hlCount;
  const bearishSignals = lhCount + llCount;

  // Build structure description
  const highStructure = hhCount > lhCount ? "HIGHER_HIGHS" : lhCount > hhCount ? "LOWER_HIGHS" : "MIXED_HIGHS";
  const lowStructure = hlCount > llCount ? "HIGHER_LOWS" : llCount > hlCount ? "LOWER_LOWS" : "MIXED_LOWS";

  let direction: TrendDirection;
  let structure: string;

  if (bullishSignals > bearishSignals && bullishSignals >= 2) {
    direction = "BULLISH";
    structure = `${highStructure} + ${lowStructure}`;
  } else if (bearishSignals > bullishSignals && bearishSignals >= 2) {
    direction = "BEARISH";
    structure = `${highStructure} + ${lowStructure}`;
  } else if (bullishSignals === bearishSignals) {
    // Check for specific patterns
    if (hhCount > 0 && hlCount > 0) {
      direction = "BULLISH";
      structure = "HIGHER_HIGHS + HIGHER_LOWS";
    } else if (lhCount > 0 && llCount > 0) {
      direction = "BEARISH";
      structure = "LOWER_HIGHS + LOWER_LOWS";
    } else {
      direction = "NEUTRAL";
      structure = "CONSOLIDATION";
    }
  } else {
    // Weak signal
    direction = "NEUTRAL";
    structure = `${highStructure} + ${lowStructure}`;
  }

  // Special case: only 1 comparison available — use it cautiously
  if (recentHighs.length >= 2 && recentLows.length >= 2) {
    const lastHigh = recentHighs[recentHighs.length - 1]!;
    const prevHigh = recentHighs[recentHighs.length - 2]!;
    const lastLow = recentLows[recentLows.length - 1]!;
    const prevLow = recentLows[recentLows.length - 2]!;

    const isHH = lastHigh.price > prevHigh.price;
    const isHL = lastLow.price > prevLow.price;
    const isLH = lastHigh.price < prevHigh.price;
    const isLL = lastLow.price < prevLow.price;

    if (isHH && isHL) {
      direction = "BULLISH";
      structure = "HIGHER_HIGHS + HIGHER_LOWS";
    } else if (isLH && isLL) {
      direction = "BEARISH";
      structure = "LOWER_HIGHS + LOWER_LOWS";
    } else if (isHH && isLL) {
      direction = "NEUTRAL";
      structure = "EXPANDING_VOLATILITY";
    } else if (isLH && isHL) {
      direction = "NEUTRAL";
      structure = "CONTRACTING_VOLATILITY";
    }
  }

  // Edge case: only highs or only lows available
  if (recentHighs.length < 2 && recentLows.length >= 2) {
    direction = hlCount > llCount ? "BULLISH" : llCount > hlCount ? "BEARISH" : "NEUTRAL";
    structure = lowStructure;
  } else if (recentLows.length < 2 && recentHighs.length >= 2) {
    direction = hhCount > lhCount ? "BULLISH" : lhCount > hhCount ? "BEARISH" : "NEUTRAL";
    structure = highStructure;
  }

  return { direction, structure };
}

// ---------------------------------------------------------------------------
// Internal Helpers
// ---------------------------------------------------------------------------

/**
 * Detect BOS/CHoCH events by scanning bar-level price breaks of swing points.
 *
 * This catches cases where price actually breaks through a swing level between
 * swing point formations, which the structure-based detection might miss.
 *
 * We walk through the bars chronologically, tracking which swing points have
 * been broken by actual price action.
 */
function detectBarLevelBreaks(
  bars: OHLCVBar[],
  swingHighs: SwingPoint[],
  swingLows: SwingPoint[]
): BOSEvent[] {
  const events: BOSEvent[] = [];

  if (bars.length === 0) return events;

  // Sort swing points by index
  const sortedHighs = [...swingHighs].sort((a, b) => a.index - b.index);
  const sortedLows = [...swingLows].sort((a, b) => a.index - b.index);

  // Track which swing points have been broken
  const brokenHighIndices = new Set<number>();
  const brokenLowIndices = new Set<number>();

  // Determine initial trend from swing structure
  const allSwings = [...swingHighs, ...swingLows].sort((a, b) => a.index - b.index);
  const classified = classifySwingStructure(allSwings);

  let recentBullSignals = 0;
  let recentBearSignals = 0;
  for (const sp of classified.slice(-10)) {
    if (sp.structure === "HH" || sp.structure === "HL") recentBullSignals++;
    if (sp.structure === "LH" || sp.structure === "LL") recentBearSignals++;
  }

  let currentTrend: TrendDirection =
    recentBullSignals > recentBearSignals
      ? "BULLISH"
      : recentBearSignals > recentBullSignals
        ? "BEARISH"
        : "NEUTRAL";

  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i]!;

    // Check if this bar breaks any unbroken swing high
    for (const sh of sortedHighs) {
      if (brokenHighIndices.has(sh.index)) continue;
      if (i <= sh.index) continue; // Can't break a future swing

      if (bar.close > sh.price) {
        // This swing high is broken by a bar close above it
        brokenHighIndices.add(sh.index);

        // Determine if this is BOS or CHoCH
        const eventType: "BOS" | "CHoCH" =
          currentTrend === "BULLISH" ? "BOS" : "CHoCH";

        // Find the previous swing high for the fromSwing field
        const prevHighIdx = sortedHighs.findIndex((h) => h.index === sh.index) - 1;
        const prevHigh = prevHighIdx >= 0 ? sortedHighs[prevHighIdx]! : sh;

        events.push({
          type: eventType,
          direction: "BULLISH",
          price: sh.price,
          index: i,
          fromSwing: prevHigh,
          toSwing: sh,
        });

        // Update trend after CHoCH
        if (eventType === "CHoCH") {
          currentTrend = "BULLISH";
        }
      }
    }

    // Check if this bar breaks any unbroken swing low
    for (const sl of sortedLows) {
      if (brokenLowIndices.has(sl.index)) continue;
      if (i <= sl.index) continue;

      if (bar.close < sl.price) {
        // This swing low is broken by a bar close below it
        brokenLowIndices.add(sl.index);

        const eventType: "BOS" | "CHoCH" =
          currentTrend === "BEARISH" ? "BOS" : "CHoCH";

        const prevLowIdx = sortedLows.findIndex((l) => l.index === sl.index) - 1;
        const prevLow = prevLowIdx >= 0 ? sortedLows[prevLowIdx]! : sl;

        events.push({
          type: eventType,
          direction: "BEARISH",
          price: sl.price,
          index: i,
          fromSwing: prevLow,
          toSwing: sl,
        });

        if (eventType === "CHoCH") {
          currentTrend = "BEARISH";
        }
      }
    }
  }

  return events;
}

/**
 * Deduplicate BOS events — if multiple events occur at the same bar index,
 * keep the more significant one (CHoCH > BOS, then by price significance).
 */
function deduplicateBOSEvents(events: BOSEvent[]): BOSEvent[] {
  if (events.length <= 1) return events;

  const result: BOSEvent[] = [];
  const byIndex = new Map<number, BOSEvent[]>();

  for (const event of events) {
    const existing = byIndex.get(event.index);
    if (existing) {
      existing.push(event);
    } else {
      byIndex.set(event.index, [event]);
    }
  }

  const indices = Array.from(byIndex.keys()).sort((a, b) => a - b);
  for (const idx of indices) {
    const grouped = byIndex.get(idx)!;
    if (grouped.length === 1) {
      result.push(grouped[0]!);
    } else {
      // Keep CHoCH over BOS (more significant)
      const choch = grouped.find((e: BOSEvent) => e.type === "CHoCH");
      if (choch) {
        result.push(choch);
      } else {
        // Keep the one with the highest absolute price (most significant level)
        const sorted = [...grouped].sort((a: BOSEvent, b: BOSEvent) => Math.abs(b.price) - Math.abs(a.price));
        result.push(sorted[0]!);
      }
    }
  }

  return result;
}
