// ============================================================================
// VIXOR Backtest Engine — Main Simulator
// ============================================================================
// Iterates candles, invokes the strategy, executes orders on the configured
// timing, applies protective stops, and produces a full BacktestResult.

import {
  applyOrder,
  checkProtectiveStops,
  closeAll,
  flatPosition,
  isFlat,
  updateExcursions,
  type StateMachineConfig,
} from "./state-machine";
import { CandlePath } from "./candle-path";
import { computeMetrics } from "./metrics";
import type {
  BacktestConfig,
  BacktestResult,
  BacktestStats,
  Candle,
  EquityPoint,
  OrderOpts,
  OrderRequest,
  Position,
  StrategyContextLike,
  Trade,
} from "./types";
import type { CompiledStrategy } from "./types";

const EPS = 1e-12;

/**
 * Run a backtest.
 *
 * Performance characteristics:
 *  - O(n) candle iteration with no per-bar allocations beyond order/eq pushes.
 *  - Uses Float64Array-backed candle packing for fast numeric work.
 *  - Targets < 500ms for a 200-candle single-strategy backtest (KPI §9).
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  return runBacktestSync(config);
}

/** Synchronous core — exported for the perf-check script (avoids event-loop overhead). */
export function runBacktestSync(config: BacktestConfig): BacktestResult {
  const candles = config.candles;
  if (!Array.isArray(candles) || candles.length === 0) {
    throw new Error("BacktestConfig.candles must be a non-empty array");
  }
  if (!config.strategy || typeof config.strategy !== "object") {
    throw new Error("BacktestConfig.strategy must be a compiled strategy object");
  }
  const initialCapital = config.initialCapital > 0 ? config.initialCapital : 10_000;
  const commissionRate = clamp(config.commission ?? 0, 0, 1);
  const slippageRate = clamp(config.slippage ?? 0, 0, 1);
  const periodsPerYear =
    config.periodsPerYear && config.periodsPerYear > 0 ? config.periodsPerYear : 252;
  const riskFreeRate = config.riskFreeRate ?? 0.02;
  const warmup = Math.max(0, config.warmupPeriod ?? 0);
  const timing = config.executionTiming ?? "next_bar_open";
  const allowShort = config.allowShort ?? false;
  const smConfig: StateMachineConfig = {
    allowShort,
    defaultStopLoss: config.stopLoss,
    defaultTakeProfit: config.takeProfit,
    trailing: config.trailingStop,
  };

  const path = new CandlePath(candles);
  const equityCurve: EquityPoint[] = [];
  const trades: Trade[] = [];
  let tradeIdCounter = 1;
  let position: Position = flatPosition();
  let cash = initialCapital;
  let totalCommissionPaid = 0;
  let totalSlippageCost = 0;
  let barsInMarket = 0;

  // Build the strategy context (re-bound per bar) — we re-use a single object
  // and mutate its fields for performance, then expose it to the strategy.
  const ctxState: {
    bar: Candle;
    bars: readonly Candle[];
    currentIndex: number;
    orders: OrderRequest[];
    position: Position;
  } = {
    bar: candles[0],
    bars: [],
    currentIndex: 0,
    orders: [],
    position,
  };

  const context: StrategyContextLike = {
    get bar() {
      return ctxState.bar;
    },
    get bars() {
      return ctxState.bars;
    },
    get currentIndex() {
      return ctxState.currentIndex;
    },
    get orders() {
      return ctxState.orders;
    },
    get position() {
      return ctxState.position;
    },
    buy(opts: OrderOpts) {
      pushOrder(ctxState, "buy", opts);
    },
    sell(opts: OrderOpts) {
      pushOrder(ctxState, "sell", opts);
    },
    close() {
      // Implemented as a market sell (if long) / buy (if short) of the full qty.
      // We emit a special "close" signal by setting kind=market and qty=Infinity;
      // the simulator detects Infinity and closes the whole position.
      pushOrder(ctxState, ctxState.position.side === "long" ? "sell" : "buy", {
        qty: Number.POSITIVE_INFINITY,
        kind: "market",
      });
    },
  };

  // onStart
  if (typeof config.strategy.onStart === "function") {
    try {
      config.strategy.onStart(context);
    } catch {
      // swallow — strategy errors shouldn't crash the simulator
    }
  }

  // Mark-to-market equity helper.
  const computeEquity = (price: number): number => {
    if (isFlat(position)) return cash;
    const dir = position.side === "long" ? 1 : -1;
    return cash + (price - position.avgEntryPrice) * position.qty * dir;
  };

  // Record initial equity point
  equityCurve.push({
    time: candles[0].time,
    equity: initialCapital,
    drawdown: 0,
  });

  let peakEquity = initialCapital;
  let lastBar: Candle = candles[0];

  // Main loop
  while (true) {
    const bar = path.next();
    if (bar === null) break;
    lastBar = bar;
    const idx = path.currentIndex;

    // 1) Apply protective stops at bar open (using bar's high/low range)
    if (!isFlat(position)) {
      const stopCheck = checkProtectiveStops(position, bar, smConfig);
      if (stopCheck.shouldExit) {
        const result = closeAll(position, stopCheck.fillPrice, idx, bar.time, stopCheck.reason);
        if (result.closedTrade) {
          finalizeTrade(
            result.closedTrade,
            stopCheck.fillPrice,
            commissionRate,
            slippageRate,
            trades,
            tradeIdCounter++,
          );
          cash += result.closedTrade.netPnl;
          totalCommissionPaid += result.closedTrade.commissionPaid;
          totalSlippageCost += result.closedTrade.slippageCost;
        }
        position = result.position ?? flatPosition();
      } else {
        position.trailingActive = stopCheck.trailingActive;
        position.trailingPeak = stopCheck.trailingPeak;
        updateExcursions(position, bar);
      }
    }

    if (idx < warmup) {
      // Skip strategy invocation during warmup — still record equity.
      const eq = computeEquity(bar.close);
      peakEquity = Math.max(peakEquity, eq);
      equityCurve.push({ time: bar.time, equity: eq, drawdown: drawdownFrac(peakEquity, eq) });
      continue;
    }

    // 2) Invoke strategy with this bar
    ctxState.bar = bar;
    ctxState.bars = path.visibleBars;
    ctxState.currentIndex = idx;
    ctxState.position = position;
    ctxState.orders = [];

    if (typeof config.strategy.onBar === "function") {
      try {
        config.strategy.onBar(context);
      } catch {
        // strategy error → skip orders this bar
        ctxState.orders = [];
      }
    }

    // 3) Execute orders — either at this bar's close or next bar's open.
    const executionPrice = (
      o: OrderRequest,
    ): { price: number; barIndex: number; barTime: number } => {
      if (timing === "same_bar_close") {
        return {
          price: applySlippage(o.side, bar.close, slippageRate),
          barIndex: idx,
          barTime: bar.time,
        };
      }
      const nextBar = path.peekNext();
      if (nextBar === null) {
        // No next bar — execute at current close (end-of-data fill)
        return {
          price: applySlippage(o.side, bar.close, slippageRate),
          barIndex: idx,
          barTime: bar.time,
        };
      }
      return {
        price: applySlippage(o.side, nextBar.open, slippageRate),
        barIndex: idx + 1,
        barTime: nextBar.time,
      };
    };

    for (const order of ctxState.orders) {
      // Handle "close all" sentinel (qty = Infinity)
      if (!Number.isFinite(order.qty) || order.qty <= 0) {
        if (!isFlat(position)) {
          const exec = executionPrice(order);
          const result = closeAll(position, exec.price, exec.barIndex, exec.barTime, "manual");
          if (result.closedTrade) {
            finalizeTrade(
              result.closedTrade,
              exec.price,
              commissionRate,
              slippageRate,
              trades,
              tradeIdCounter++,
            );
            cash += result.closedTrade.netPnl;
            totalCommissionPaid += result.closedTrade.commissionPaid;
            totalSlippageCost += result.closedTrade.slippageCost;
          }
          position = result.position ?? flatPosition();
        }
        continue;
      }

      // Limit/stop order fill checks
      if (order.kind === "limit") {
        const exec = executionPrice(order);
        const wantPrice = order.price ?? 0;
        if (order.side === "buy" && exec.price > wantPrice) continue;
        if (order.side === "sell" && exec.price < wantPrice) continue;
        applyAndRecord(order, exec);
      } else if (order.kind === "stop" || order.kind === "stop_limit") {
        const exec = executionPrice(order);
        const wantPrice = order.price ?? 0;
        if (order.side === "buy" && exec.price < wantPrice) continue;
        if (order.side === "sell" && exec.price > wantPrice) continue;
        applyAndRecord(order, exec);
      } else {
        const exec = executionPrice(order);
        applyAndRecord(order, exec);
      }
    }

    // 4) Re-check protective stops at bar close (covers intrabar moves)
    if (!isFlat(position)) {
      const stopCheck = checkProtectiveStops(position, bar, smConfig);
      if (stopCheck.shouldExit) {
        const result = closeAll(position, stopCheck.fillPrice, idx, bar.time, stopCheck.reason);
        if (result.closedTrade) {
          finalizeTrade(
            result.closedTrade,
            stopCheck.fillPrice,
            commissionRate,
            slippageRate,
            trades,
            tradeIdCounter++,
          );
          cash += result.closedTrade.netPnl;
          totalCommissionPaid += result.closedTrade.commissionPaid;
          totalSlippageCost += result.closedTrade.slippageCost;
        }
        position = result.position ?? flatPosition();
      } else {
        position.trailingActive = stopCheck.trailingActive;
        position.trailingPeak = stopCheck.trailingPeak;
        updateExcursions(position, bar);
      }
      barsInMarket++;
    }

    // 5) Record equity point at bar close
    const eq = computeEquity(bar.close);
    peakEquity = Math.max(peakEquity, eq);
    equityCurve.push({ time: bar.time, equity: eq, drawdown: drawdownFrac(peakEquity, eq) });
  }

  // Close any open position at the last bar's close (end-of-data)
  if (!isFlat(position)) {
    const result = closeAll(
      position,
      lastBar.close,
      path.currentIndex,
      lastBar.time,
      "end_of_data",
    );
    if (result.closedTrade) {
      finalizeTrade(
        result.closedTrade,
        lastBar.close,
        commissionRate,
        slippageRate,
        trades,
        tradeIdCounter++,
      );
      cash += result.closedTrade.netPnl;
      totalCommissionPaid += result.closedTrade.commissionPaid;
      totalSlippageCost += result.closedTrade.slippageCost;
    }
    position = result.position ?? flatPosition();
    // Update last equity point
    const finalEq = cash;
    const last = equityCurve[equityCurve.length - 1];
    if (last) {
      last.equity = finalEq;
      last.drawdown = drawdownFrac(peakEquity, finalEq);
    }
  }

  // onEnd
  if (typeof config.strategy.onEnd === "function") {
    ctxState.position = position;
    try {
      config.strategy.onEnd(context);
    } catch {
      // swallow
    }
  }

  const metrics = computeMetrics({
    equityCurve,
    trades,
    initialCapital,
    periodsPerYear,
    riskFreeRate,
    totalCommission: totalCommissionPaid,
  });

  const stats: BacktestStats = {
    totalBars: candles.length,
    totalTrades: trades.length,
    winningTrades: trades.filter((t) => t.netPnl > 0).length,
    losingTrades: trades.filter((t) => t.netPnl < 0).length,
    exposureTime: candles.length > 0 ? (barsInMarket / candles.length) * 100 : 0,
  };

  return {
    equityCurve,
    trades,
    metrics,
    stats,
    finalEquity: cash,
    initialCapital,
  };

  // ----- inline helper (closure over scope) -----
  function applyAndRecord(
    order: OrderRequest,
    exec: { price: number; barIndex: number; barTime: number },
  ): void {
    const result = applyOrder(position, order, exec.price, exec.barIndex, exec.barTime, smConfig);
    if (result.closedTrade) {
      finalizeTrade(
        result.closedTrade,
        exec.price,
        commissionRate,
        slippageRate,
        trades,
        tradeIdCounter++,
      );
      cash += result.closedTrade.netPnl;
      totalCommissionPaid += result.closedTrade.commissionPaid;
      totalSlippageCost += result.closedTrade.slippageCost;
    }
    position = result.position ?? flatPosition();
    ctxState.position = position;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function pushOrder(
  state: { orders: OrderRequest[]; currentIndex: number },
  side: "buy" | "sell",
  opts: OrderOpts,
): void {
  if (opts.qty !== undefined && opts.qty <= 0) return;
  state.orders.push({
    side,
    qty: opts.qty ?? 0,
    price: opts.price,
    kind: opts.kind ?? "market",
    stopLoss: opts.stopLoss,
    takeProfit: opts.takeProfit,
    scaleIn: opts.scaleIn ?? false,
    tag: opts.tag,
    placedAtIndex: state.currentIndex,
  });
}

function applySlippage(side: "buy" | "sell", price: number, slippage: number): number {
  if (slippage <= 0) return price;
  // buyer pays more, seller receives less
  return side === "buy" ? price * (1 + slippage) : price * (1 - slippage);
}

function finalizeTrade(
  trade: Omit<Trade, "id">,
  exitPrice: number,
  commissionRate: number,
  slippageRate: number,
  trades: Trade[],
  id: number,
): void {
  const notionalEntry = trade.entryPrice * trade.qty;
  const notionalExit = exitPrice * trade.qty;
  const commission = (notionalEntry + notionalExit) * commissionRate;
  const slippageCost = notionalExit * slippageRate;
  trade.commissionPaid = commission;
  trade.slippageCost = slippageCost;
  trade.netPnl = trade.grossPnl - commission - slippageCost;
  trades.push({ id, ...trade });
}

function drawdownFrac(peak: number, current: number): number {
  if (peak <= EPS) return 0;
  return Math.max(0, (peak - current) / peak);
}

function clamp(v: number, lo: number, hi: number): number {
  if (!Number.isFinite(v)) return lo;
  return Math.max(lo, Math.min(hi, v));
}

// Re-export for callers that want a sync entrypoint without the async wrapper.
export { runBacktestSync as runBacktestCore };
export type { CompiledStrategy };
