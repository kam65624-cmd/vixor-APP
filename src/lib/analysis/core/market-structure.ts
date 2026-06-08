// ============================================================================
// Vixor Local Analysis Engine — Market Structure Analysis (SMC / ICT)
// ============================================================================
//
// Implements:
//   1. detectSwingPoints      — Williams Fractals swing detection
//   2. classifySwingStructure — HH / HL / LH / LL classification
//   3. detectBOSandCHoCH      — Break of Structure & Change of Character
//   4. determineMarketStructure — Overall structure verdict
//
// These four functions compose into `analyzeMarketStructure`, the single
// public entry-point that returns a `MarketStructureResult`.
// ============================================================================

import { OHLCVBar, SwingPoint, BOSEvent, MarketStructureResult } from "./types";

// ---------------------------------------------------------------------------
// 1. Swing-point detection  (Williams Fractals)
// ---------------------------------------------------------------------------

/**
 * Detect swing highs and swing lows using the Williams Fractals approach.
 *
 * A **swing high** at bar `i` requires `leftBars` bars on each side whose
 * highs are all **strictly lower** than `bars[i].high`.
 *
 * A **swing low** at bar `i` requires `leftBars` bars on each side whose
 * lows are all **strictly higher** than `bars[i].low`.
 *
 * When two adjacent bars share the same extreme and qualify, the **last**
 * one wins (right-most priority), matching common charting convention.
 */
export function detectSwingPoints(
  bars: OHLCVBar[],
  leftBars: number = 3,
  rightBars: number = 3,
): SwingPoint[] {
  const swings: SwingPoint[] = [];
  if (bars.length < leftBars + rightBars + 1) return swings;

  // Track candidate highs/lows so we can deduplicate equal-price runs
  let pendingHigh: { index: number; price: number } | null = null;
  let pendingLow: { index: number; price: number } | null = null;

  for (let i = leftBars; i < bars.length - rightBars; i++) {
    const bar = bars[i]!;

    // --- Check swing HIGH ---
    let isHigh = true;
    for (let l = 1; l <= leftBars; l++) {
      if (bars[i - l]!.high >= bar.high) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) {
      for (let r = 1; r <= rightBars; r++) {
        if (bars[i + r]!.high >= bar.high) {
          isHigh = false;
          break;
        }
      }
    }

    if (isHigh) {
      // Deduplicate: if same price as pending, take the rightmost bar
      if (pendingHigh && pendingHigh.price === bar.high) {
        pendingHigh.index = i;
      } else {
        if (pendingHigh) {
          swings.push({ index: pendingHigh.index, price: pendingHigh.price, type: "HIGH" });
        }
        pendingHigh = { index: i, price: bar.high };
      }
    }

    // --- Check swing LOW ---
    let isLow = true;
    for (let l = 1; l <= leftBars; l++) {
      if (bars[i - l]!.low <= bar.low) {
        isLow = false;
        break;
      }
    }
    if (isLow) {
      for (let r = 1; r <= rightBars; r++) {
        if (bars[i + r]!.low <= bar.low) {
          isLow = false;
          break;
        }
      }
    }

    if (isLow) {
      if (pendingLow && pendingLow.price === bar.low) {
        pendingLow.index = i;
      } else {
        if (pendingLow) {
          swings.push({ index: pendingLow.index, price: pendingLow.price, type: "LOW" });
        }
        pendingLow = { index: i, price: bar.low };
      }
    }
  }

  // Flush any remaining pendings
  if (pendingHigh) {
    swings.push({ index: pendingHigh.index, price: pendingHigh.price, type: "HIGH" });
  }
  if (pendingLow) {
    swings.push({ index: pendingLow.index, price: pendingLow.price, type: "LOW" });
  }

  // Sort by index (chronological order)
  swings.sort((a, b) => a.index - b.index);

  return swings;
}

// ---------------------------------------------------------------------------
// 2. Swing structure classification  (HH / HL / LH / LL)
// ---------------------------------------------------------------------------

/**
 * Classify each swing point relative to the previous swing of the **same**
 * type (highs vs highs, lows vs lows).
 *
 * - **HH** — Higher High:  current swing high > previous swing high
 * - **LH** — Lower High:  current swing high < previous swing high
 * - **HL** — Higher Low:  current swing low  > previous swing low
 * - **LL** — Lower Low:   current swing low  < previous swing low
 *
 * The first swing of each type is left unclassified (no `structure` field).
 */
export function classifySwingStructure(swingPoints: SwingPoint[]): SwingPoint[] {
  const result: SwingPoint[] = swingPoints.map((sp) => ({ ...sp }));

  let prevHigh: SwingPoint | null = null;
  let prevLow: SwingPoint | null = null;

  for (const sp of result) {
    if (sp.type === "HIGH") {
      if (prevHigh !== null) {
        if (sp.price > prevHigh.price) {
          sp.structure = "HH";
        } else if (sp.price < prevHigh.price) {
          sp.structure = "LH";
        } else {
          // Equal high — keep same as previous classification or default LH
          sp.structure = prevHigh.structure ?? "LH";
        }
      }
      prevHigh = sp;
    } else {
      if (prevLow !== null) {
        if (sp.price > prevLow.price) {
          sp.structure = "HL";
        } else if (sp.price < prevLow.price) {
          sp.structure = "LL";
        } else {
          sp.structure = prevLow.structure ?? "HL";
        }
      }
      prevLow = sp;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// 3. BOS / CHoCH detection
// ---------------------------------------------------------------------------

/**
 * Detect Break of Structure (BOS) and Change of Character (CHoCH) events.
 *
 * ### Algorithm
 *
 * We walk the classified swing points in chronological order and maintain a
 * "current trend direction" derived from the structure labels seen so far.
 *
 * - **BOS** — When price breaks a swing level in the **same** direction as
 *   the prevailing trend.  Example: in an uptrend, price makes a higher high
 *   above the previous swing high → bullish BOS.
 *
 * - **CHoCH** — When price breaks a swing level in the **opposite** direction
 *   to the prevailing trend.  Example: in an uptrend, price breaks below the
 *   previous swing low → bearish CHoCH (first sign of reversal).
 *
 * We additionally confirm the "break" by checking that at least one bar
 * between the two swings actually closed beyond the reference swing price,
 * making it a genuine structural break and not just a wick.
 */
export function detectBOSandCHoCH(swingPoints: SwingPoint[], bars: OHLCVBar[]): BOSEvent[] {
  const events: BOSEvent[] = [];
  if (swingPoints.length < 3) return events;

  // Determine current trend context from the swing structure labels
  let currentTrend: "BULLISH" | "BEARISH" | "NEUTRAL" = "NEUTRAL";

  // Count recent HH/HL vs LH/LL to establish initial trend
  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;

  for (let i = 0; i < swingPoints.length; i++) {
    const sp = swingPoints[i]!;
    const struct = sp.structure;

    if (struct === "HH") hhCount++;
    else if (struct === "HL") hlCount++;
    else if (struct === "LH") lhCount++;
    else if (struct === "LL") llCount++;

    const bullishSignals = hhCount + hlCount;
    const bearishSignals = lhCount + llCount;

    // Wait until we have at least two signals before assigning a trend
    if (bullishSignals + bearishSignals < 2) continue;

    // Determine trend based on weighted recent signals
    // Give more weight to more recent signals
    const recentWindow = swingPoints.slice(Math.max(0, i - 5), i + 1);
    let recentBull = 0;
    let recentBear = 0;
    for (const rsp of recentWindow) {
      if (rsp.structure === "HH" || rsp.structure === "HL") recentBull++;
      if (rsp.structure === "LH" || rsp.structure === "LL") recentBear++;
    }

    if (recentBull > recentBear) {
      currentTrend = "BULLISH";
    } else if (recentBear > recentBull) {
      currentTrend = "BEARISH";
    }
    // else keep previous trend (or NEUTRAL)

    // Now check for BOS / CHoCH against the previous swing of the same type
    // Look for the previous swing of the same type (HIGH or LOW)
    let prevSameType: SwingPoint | null = null;
    for (let j = i - 1; j >= 0; j--) {
      if (swingPoints[j]!.type === sp.type) {
        prevSameType = swingPoints[j]!;
        break;
      }
    }

    if (!prevSameType || !prevSameType.structure || !sp.structure) continue;

    // Determine if this is a break in the same direction (BOS) or opposite (CHoCH)
    const isBullishBreak =
      sp.type === "HIGH" && sp.structure === "HH" && prevSameType.structure !== "HH";
    const isBearishBreak =
      sp.type === "LOW" && sp.structure === "LL" && prevSameType.structure !== "LL";

    // Continuation breaks (same direction as trend)
    const isTrendContinuation =
      (currentTrend === "BULLISH" && sp.structure === "HH") ||
      (currentTrend === "BEARISH" && sp.structure === "LL");

    // Reversal breaks (opposite to trend)
    const isTrendReversal =
      (currentTrend === "BULLISH" && sp.type === "LOW" && sp.structure === "LL") ||
      (currentTrend === "BEARISH" && sp.type === "HIGH" && sp.structure === "HH");

    // Confirm the break with actual candle closes
    const breakConfirmed = confirmBreakWithCandles(prevSameType, sp, bars);

    if (!breakConfirmed) continue;

    if (isTrendContinuation && (isBullishBreak || isBearishBreak)) {
      // BOS: break in the same direction as trend
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: currentTrend === "BULLISH" ? "BULLISH" : "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp,
      });
    } else if (isTrendReversal) {
      // CHoCH: break in the opposite direction to trend
      const newDirection: "BULLISH" | "BEARISH" = currentTrend === "BULLISH" ? "BEARISH" : "BULLISH";
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: newDirection,
        fromSwing: prevSameType,
        toSwing: sp,
      });
      // Update the prevailing trend after a CHoCH
      currentTrend = newDirection;
    } else if (isBullishBreak && currentTrend === "BULLISH") {
      // HH in bullish trend = BOS
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: "BULLISH",
        fromSwing: prevSameType,
        toSwing: sp,
      });
    } else if (isBearishBreak && currentTrend === "BEARISH") {
      // LL in bearish trend = BOS
      events.push({
        index: sp.index,
        price: sp.price,
        type: "BOS",
        direction: "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp,
      });
    } else if (isBullishBreak && currentTrend !== "BULLISH") {
      // HH in non-bullish trend = potential CHoCH
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: "BULLISH",
        fromSwing: prevSameType,
        toSwing: sp,
      });
      currentTrend = "BULLISH";
    } else if (isBearishBreak && currentTrend !== "BEARISH") {
      // LL in non-bearish trend = potential CHoCH
      events.push({
        index: sp.index,
        price: sp.price,
        type: "CHoCH",
        direction: "BEARISH",
        fromSwing: prevSameType,
        toSwing: sp,
      });
      currentTrend = "BEARISH";
    }
  }

  return events;
}

/**
 * Confirm that at least one bar between two swings closed beyond the
 * reference swing's price level, validating the structural break.
 */
function confirmBreakWithCandles(
  fromSwing: SwingPoint,
  toSwing: SwingPoint,
  bars: OHLCVBar[],
): boolean {
  const startIdx = Math.min(fromSwing.index, toSwing.index);
  const endIdx = Math.max(fromSwing.index, toSwing.index);

  if (startIdx >= bars.length || endIdx >= bars.length) return false;

  if (toSwing.type === "HIGH") {
    // For a swing high break, we need a bar that closed above fromSwing price
    const refPrice = fromSwing.price;
    for (let i = startIdx; i <= endIdx && i < bars.length; i++) {
      if (bars[i]!.close > refPrice) return true;
    }
  } else {
    // For a swing low break, we need a bar that closed below fromSwing price
    const refPrice = fromSwing.price;
    for (let i = startIdx; i <= endIdx && i < bars.length; i++) {
      if (bars[i]!.close < refPrice) return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 4. Overall market structure determination
// ---------------------------------------------------------------------------

/** Helper to build lastBOS object with proper type narrowing */
function buildLastBOS(
  lastBOSPrice: number | undefined,
  lastBOSType: "BOS" | "CHoCH" | undefined,
  lastBOSDirection: "BULLISH" | "BEARISH" | "NEUTRAL" | undefined,
): { price: number; type: "BOS" | "CHoCH"; direction: "BULLISH" | "BEARISH" } | undefined {
  if (
    lastBOSPrice !== undefined &&
    lastBOSType &&
    lastBOSDirection &&
    lastBOSDirection !== "NEUTRAL"
  ) {
    return { price: lastBOSPrice, type: lastBOSType, direction: lastBOSDirection };
  }
  return undefined;
}

/**
 * Determine the overall market structure direction from BOS events and
 * classified swing points.
 *
 * Strategy:
 * 1. Look at the **most recent** BOS/CHoCH events (last 3) to determine
 *    the active directional bias.
 * 2. Cross-reference with the swing structure labels (HH/HL vs LH/LL).
 * 3. If the signals are mixed or insufficient, declare SIDEWAYS / CONSOLIDATION.
 */
export function determineMarketStructure(
  bosEvents: BOSEvent[],
  swingPoints: SwingPoint[],
  _bars: OHLCVBar[],
): Omit<MarketStructureResult, "swingPoints" | "bosEvents"> {
  // ---- Count structure labels in the recent portion ----
  const recentSwings = swingPoints.slice(-10);
  let hhCount = 0;
  let hlCount = 0;
  let lhCount = 0;
  let llCount = 0;

  for (const sp of recentSwings) {
    if (sp.structure === "HH") hhCount++;
    else if (sp.structure === "HL") hlCount++;
    else if (sp.structure === "LH") lhCount++;
    else if (sp.structure === "LL") llCount++;
  }

  const bullishStructureCount = hhCount + hlCount;
  const bearishStructureCount = lhCount + llCount;

  // ---- Analyze recent BOS/CHoCH events ----
  let lastBOSPrice: number | undefined;
  let lastBOSType: "BOS" | "CHoCH" | undefined;
  let lastBOSDirection: "BULLISH" | "BEARISH" | "NEUTRAL" | undefined;

  // Count recent event directions
  let recentBullishEvents = 0;
  let recentBearishEvents = 0;

  const recentEvents = bosEvents.slice(-5);
  for (const evt of recentEvents) {
    if (evt.direction === "BULLISH") recentBullishEvents++;
    else recentBearishEvents++;

    // Track the very last event
    lastBOSPrice = evt.price;
    lastBOSType = evt.type;
    lastBOSDirection = evt.direction;
  }

  // CHoCH carries more weight — it signals a potential trend change
  const lastEvent = bosEvents.length > 0 ? bosEvents[bosEvents.length - 1] : null;
  if (lastEvent && lastEvent.type === "CHoCH") {
    // A CHoCH overrides — it's the most important signal
    const dir = lastEvent.direction;
    const structure = dir === "BULLISH" ? "HIGHER_HIGHS" : "LOWER_LOWS";

    return {
      direction: dir === "BULLISH" ? "BULLISH" : "BEARISH",
      structure,
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection),
    };
  }

  // ---- Weighted decision combining swing labels + BOS events ----
  const bullScore = bullishStructureCount * 2 + recentBullishEvents * 3;
  const bearScore = bearishStructureCount * 2 + recentBearishEvents * 3;

  // Need a meaningful margin to declare a direction
  const total = bullScore + bearScore;
  const margin = total > 0 ? Math.abs(bullScore - bearScore) / total : 0;

  if (margin < 0.15 || total === 0) {
    // Insufficient edge → consolidation
    return {
      direction: "SIDEWAYS",
      structure: "CONSOLIDATION",
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection),
    };
  }

  if (bullScore > bearScore) {
    // Determine if it's HH-driven or HL-driven
    const structure = hhCount >= hlCount ? "HIGHER_HIGHS" : "HIGHER_LOW";
    return {
      direction: "BULLISH",
      structure,
      lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection),
    };
  }

  // Bearish
  const structure = llCount >= lhCount ? "LOWER_LOWS" : "LOWER_HIGHS";
  return {
    direction: "BEARISH",
    structure,
    lastBOS: buildLastBOS(lastBOSPrice, lastBOSType, lastBOSDirection),
  };
}

// ---------------------------------------------------------------------------
// Public entry-point
// ---------------------------------------------------------------------------

/**
 * Run the full market structure pipeline:
 *
 *   detectSwingPoints → classifySwingStructure → detectBOSandCHoCH → determineMarketStructure
 */
export function analyzeMarketStructure(
  bars: OHLCVBar[],
  leftBars: number = 3,
  rightBars: number = 3,
): MarketStructureResult {
  const rawSwings = detectSwingPoints(bars, leftBars, rightBars);
  const swingPoints = classifySwingStructure(rawSwings);
  const bosEvents = detectBOSandCHoCH(swingPoints, bars);
  const structure = determineMarketStructure(bosEvents, swingPoints, bars);

  return {
    ...structure,
    swingPoints,
    bosEvents,
  };
}
