// ============================================================================
// VIXOR Backtest Engine — Position State Machine
// ============================================================================
// Manages FLAT ⇄ LONG/SHORT transitions with partial fills (scale-ins),
// scale-outs, and protective-stop logic (stop-loss, take-profit, trailing).
//
// All operations are pure with respect to the `Position` snapshot — the state
// machine does not own the position, it merely proposes the next state.

import type { OrderRequest, Position, PositionSide, Trade } from "./types";

const EPS = 1e-12;

export interface StateMachineConfig {
  allowShort: boolean;
  defaultStopLoss?: number; // fraction of entry
  defaultTakeProfit?: number;
  trailing?: { activation: number; distance: number };
}

export interface ApplyOrderResult {
  position: Position | null;
  /** trade closed by this order (if any) */
  closedTrade: Omit<Trade, "id"> | null;
  /** effective fill qty (could be less than requested for scale-outs) */
  filledQty: number;
  /** notional value of the fill (price * qty) */
  notional: number;
  /** reason a non-fill happened (e.g. "short_disallowed") */
  rejectReason?: string;
}

/**
 * Create a flat initial position.
 */
export function flatPosition(): Position {
  return {
    side: "flat",
    qty: 0,
    entryPrice: 0,
    avgEntryPrice: 0,
    openedAtIndex: -1,
    openedAtTime: 0,
  };
}

export function isFlat(p: Position | null): p is (Position & { side: "flat" }) | null {
  return p === null || p.side === "flat" || Math.abs(p.qty) < EPS;
}

/**
 * Apply a market/limit/stop order at the given fill price. Returns the new
 * position state and any trade closed by the operation.
 *
 * Semantics:
 *  - BUY when flat  → open LONG
 *  - SELL when flat → open SHORT (if allowed)
 *  - BUY when SHORT → close SHORT (and optionally open LONG if qty > position)
 *  - SELL when LONG → close LONG (and optionally open SHORT if qty > position)
 *  - scaleIn=true   → add to existing position (averaged entry)
 */
export function applyOrder(
  current: Position | null,
  order: OrderRequest,
  fillPrice: number,
  barIndex: number,
  barTime: number,
  config: StateMachineConfig,
): ApplyOrderResult {
  const pos = current ?? flatPosition();
  const notional = fillPrice * order.qty;

  // BUY order
  if (order.side === "buy") {
    if (pos.side === "long") {
      if (order.scaleIn) {
        const next = scaleIn(pos, fillPrice, order.qty);
        applyProtectiveLevels(next, order, config);
        return { position: next, closedTrade: null, filledQty: order.qty, notional };
      }
      // buy on existing long without scaleIn — reject (no-op)
      return {
        position: pos,
        closedTrade: null,
        filledQty: 0,
        notional: 0,
        rejectReason: "already_long",
      };
    }
    if (pos.side === "short") {
      // close short (or partial close)
      const closeQty = Math.min(order.qty, pos.qty);
      const trade = closePosition(pos, closeQty, fillPrice, barIndex, barTime, "signal");
      const remainingQty = order.qty - closeQty;
      if (remainingQty > EPS) {
        // flip to long
        const newPos = openLong(remainingQty, fillPrice, barIndex, barTime);
        applyProtectiveLevels(newPos, order, config);
        return { position: newPos, closedTrade: trade, filledQty: order.qty, notional };
      }
      const nextPos =
        pos.qty - closeQty > EPS ? { ...pos, qty: pos.qty - closeQty } : flatPosition();
      return {
        position: nextPos,
        closedTrade: trade,
        filledQty: closeQty,
        notional: closeQty * fillPrice,
      };
    }
    // flat → open long
    const next = openLong(order.qty, fillPrice, barIndex, barTime);
    applyProtectiveLevels(next, order, config);
    return { position: next, closedTrade: null, filledQty: order.qty, notional };
  }

  // SELL order
  if (order.side === "sell") {
    if (pos.side === "short") {
      if (order.scaleIn) {
        const next = scaleIn(pos, fillPrice, order.qty);
        applyProtectiveLevels(next, order, config);
        return { position: next, closedTrade: null, filledQty: order.qty, notional };
      }
      return {
        position: pos,
        closedTrade: null,
        filledQty: 0,
        notional: 0,
        rejectReason: "already_short",
      };
    }
    if (pos.side === "long") {
      const closeQty = Math.min(order.qty, pos.qty);
      const trade = closePosition(pos, closeQty, fillPrice, barIndex, barTime, "signal");
      const remainingQty = order.qty - closeQty;
      if (remainingQty > EPS) {
        if (!config.allowShort) {
          // cannot flip to short; just close long fully
          return {
            position: flatPosition(),
            closedTrade: trade,
            filledQty: closeQty,
            notional: closeQty * fillPrice,
            rejectReason: "short_disallowed",
          };
        }
        const newPos = openShort(remainingQty, fillPrice, barIndex, barTime);
        applyProtectiveLevels(newPos, order, config);
        return { position: newPos, closedTrade: trade, filledQty: order.qty, notional };
      }
      const nextPos =
        pos.qty - closeQty > EPS ? { ...pos, qty: pos.qty - closeQty } : flatPosition();
      return {
        position: nextPos,
        closedTrade: trade,
        filledQty: closeQty,
        notional: closeQty * fillPrice,
      };
    }
    if (!config.allowShort) {
      return {
        position: pos,
        closedTrade: null,
        filledQty: 0,
        notional: 0,
        rejectReason: "short_disallowed",
      };
    }
    const next = openShort(order.qty, fillPrice, barIndex, barTime);
    applyProtectiveLevels(next, order, config);
    return { position: next, closedTrade: null, filledQty: order.qty, notional };
  }

  return {
    position: pos,
    closedTrade: null,
    filledQty: 0,
    notional: 0,
    rejectReason: "unknown_side",
  };
}

/**
 * Close the entire position at `fillPrice` with the given exit reason.
 */
export function closeAll(
  pos: Position | null,
  fillPrice: number,
  barIndex: number,
  barTime: number,
  reason: Trade["exitReason"],
): ApplyOrderResult {
  if (isFlat(pos)) {
    return { position: flatPosition(), closedTrade: null, filledQty: 0, notional: 0 };
  }
  const p = pos as Position;
  const trade = closePosition(p, p.qty, fillPrice, barIndex, barTime, reason);
  return {
    position: flatPosition(),
    closedTrade: trade,
    filledQty: p.qty,
    notional: p.qty * fillPrice,
  };
}

/**
 * Update MAE/MFE and check protective stops against a bar's high/low.
 * Returns the exit reason if a stop was hit, plus the implied fill price.
 */
export interface StopCheckResult {
  shouldExit: boolean;
  reason: Trade["exitReason"];
  fillPrice: number;
  /** updated trailing state */
  trailingActive: boolean;
  trailingPeak: number | undefined;
}

export function checkProtectiveStops(
  pos: Position,
  bar: { high: number; low: number; close: number },
  config: StateMachineConfig,
): StopCheckResult {
  if (pos.side === "flat") {
    return {
      shouldExit: false,
      reason: "signal",
      fillPrice: bar.close,
      trailingActive: false,
      trailingPeak: undefined,
    };
  }

  // Update trailing peak / activation
  let trailingActive = pos.trailingActive ?? false;
  let trailingPeak = pos.trailingPeak;
  const trailingCfg = config.trailing;
  if (trailingCfg) {
    if (pos.side === "long") {
      const peak = trailingPeak === undefined ? pos.entryPrice : Math.max(trailingPeak, bar.high);
      trailingPeak = peak;
      const profitFrac = (peak - pos.entryPrice) / pos.entryPrice;
      if (!trailingActive && profitFrac >= trailingCfg.activation) trailingActive = true;
    } else {
      const trough = trailingPeak === undefined ? pos.entryPrice : Math.min(trailingPeak, bar.low);
      trailingPeak = trough;
      const profitFrac = (pos.entryPrice - trough) / pos.entryPrice;
      if (!trailingActive && profitFrac >= trailingCfg.activation) trailingActive = true;
    }
  }

  // Stop-loss
  if (pos.stopLoss !== undefined && pos.stopLoss > 0) {
    if (pos.side === "long" && bar.low <= pos.stopLoss) {
      return {
        shouldExit: true,
        reason: "stop_loss",
        fillPrice: pos.stopLoss,
        trailingActive,
        trailingPeak,
      };
    }
    if (pos.side === "short" && bar.high >= pos.stopLoss) {
      return {
        shouldExit: true,
        reason: "stop_loss",
        fillPrice: pos.stopLoss,
        trailingActive,
        trailingPeak,
      };
    }
  }

  // Take-profit
  if (pos.takeProfit !== undefined && pos.takeProfit > 0) {
    if (pos.side === "long" && bar.high >= pos.takeProfit) {
      return {
        shouldExit: true,
        reason: "take_profit",
        fillPrice: pos.takeProfit,
        trailingActive,
        trailingPeak,
      };
    }
    if (pos.side === "short" && bar.low <= pos.takeProfit) {
      return {
        shouldExit: true,
        reason: "take_profit",
        fillPrice: pos.takeProfit,
        trailingActive,
        trailingPeak,
      };
    }
  }

  // Trailing stop
  if (trailingCfg && trailingActive && trailingPeak !== undefined) {
    const dist = trailingCfg.distance * pos.entryPrice;
    if (pos.side === "long") {
      const trail = trailingPeak - dist;
      if (bar.low <= trail) {
        return {
          shouldExit: true,
          reason: "trailing_stop",
          fillPrice: trail,
          trailingActive,
          trailingPeak,
        };
      }
    } else {
      const trail = trailingPeak + dist;
      if (bar.high >= trail) {
        return {
          shouldExit: true,
          reason: "trailing_stop",
          fillPrice: trail,
          trailingActive,
          trailingPeak,
        };
      }
    }
  }

  return {
    shouldExit: false,
    reason: "signal",
    fillPrice: bar.close,
    trailingActive,
    trailingPeak,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function openLong(qty: number, price: number, barIndex: number, barTime: number): Position {
  return {
    side: "long",
    qty,
    entryPrice: price,
    avgEntryPrice: price,
    openedAtIndex: barIndex,
    openedAtTime: barTime,
    maePrice: price,
    mfePrice: price,
    initialRisk: undefined,
  };
}

function openShort(qty: number, price: number, barIndex: number, barTime: number): Position {
  return {
    side: "short",
    qty,
    entryPrice: price,
    avgEntryPrice: price,
    openedAtIndex: barIndex,
    openedAtTime: barTime,
    maePrice: price,
    mfePrice: price,
    initialRisk: undefined,
  };
}

function scaleIn(pos: Position, price: number, addQty: number): Position {
  const newQty = pos.qty + addQty;
  const newAvg = (pos.avgEntryPrice * pos.qty + price * addQty) / newQty;
  return {
    ...pos,
    qty: newQty,
    entryPrice: pos.entryPrice, // keep first entry as nominal entry
    avgEntryPrice: newAvg,
  };
}

function closePosition(
  pos: Position,
  qty: number,
  exitPrice: number,
  exitIndex: number,
  exitTime: number,
  reason: Trade["exitReason"],
): Omit<Trade, "id"> {
  const side: "long" | "short" = pos.side === "short" ? "short" : "long";
  const direction = side === "long" ? 1 : -1;
  const grossPnl = (exitPrice - pos.avgEntryPrice) * qty * direction;
  const notional = pos.avgEntryPrice * qty;
  const returnPct = notional > EPS ? grossPnl / notional : 0;
  const mae =
    pos.maePrice !== undefined && pos.avgEntryPrice > 0
      ? ((pos.maePrice - pos.avgEntryPrice) * direction) / pos.avgEntryPrice
      : 0;
  const mfe =
    pos.mfePrice !== undefined && pos.avgEntryPrice > 0
      ? ((pos.mfePrice - pos.avgEntryPrice) * direction) / pos.avgEntryPrice
      : 0;
  const initialRisk = pos.initialRisk !== undefined && pos.initialRisk > 0 ? pos.initialRisk : 0;
  const rMultiple = initialRisk > 0 ? grossPnl / (initialRisk * qty) : 0;
  return {
    side,
    entryIndex: pos.openedAtIndex,
    exitIndex,
    entryTime: pos.openedAtTime,
    exitTime,
    entryPrice: pos.avgEntryPrice,
    exitPrice,
    qty,
    grossPnl,
    commissionPaid: 0, // filled by simulator (needs commission config)
    slippageCost: 0, // filled by simulator
    netPnl: grossPnl, // adjusted by simulator
    returnPct,
    mae,
    mfe,
    rMultiple,
    exitReason: reason,
    durationBars: exitIndex - pos.openedAtIndex,
    tag: pos.tag,
  };
}

function applyProtectiveLevels(
  pos: Position,
  order: OrderRequest,
  config: StateMachineConfig,
): void {
  if (order.stopLoss !== undefined && order.stopLoss > 0) {
    pos.stopLoss =
      order.side === "buy"
        ? pos.entryPrice * (1 - order.stopLoss)
        : pos.entryPrice * (1 + order.stopLoss);
    pos.initialRisk = Math.abs(pos.entryPrice - pos.stopLoss);
  } else if (config.defaultStopLoss && config.defaultStopLoss > 0) {
    pos.stopLoss =
      order.side === "buy"
        ? pos.entryPrice * (1 - config.defaultStopLoss)
        : pos.entryPrice * (1 + config.defaultStopLoss);
    pos.initialRisk = Math.abs(pos.entryPrice - pos.stopLoss);
  }
  if (order.takeProfit !== undefined && order.takeProfit > 0) {
    pos.takeProfit =
      order.side === "buy"
        ? pos.entryPrice * (1 + order.takeProfit)
        : pos.entryPrice * (1 - order.takeProfit);
  } else if (config.defaultTakeProfit && config.defaultTakeProfit > 0) {
    pos.takeProfit =
      order.side === "buy"
        ? pos.entryPrice * (1 + config.defaultTakeProfit)
        : pos.entryPrice * (1 - config.defaultTakeProfit);
  }
}

/** Update MAE/MFE price extremes after each bar. Mutates `pos` in place. */
export function updateExcursions(pos: Position, bar: { high: number; low: number }): void {
  if (pos.side === "flat") return;
  if (pos.side === "long") {
    if (pos.maePrice === undefined || bar.low < pos.maePrice) pos.maePrice = bar.low;
    if (pos.mfePrice === undefined || bar.high > pos.mfePrice) pos.mfePrice = bar.high;
  } else {
    if (pos.maePrice === undefined || bar.high > pos.maePrice) pos.maePrice = bar.high;
    if (pos.mfePrice === undefined || bar.low < pos.mfePrice) pos.mfePrice = bar.low;
  }
}

export type { PositionSide };
