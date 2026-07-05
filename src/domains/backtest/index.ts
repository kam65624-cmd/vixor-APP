// ============================================================================
// VIXOR Backtest Domain — Barrel Export
// ============================================================================
//
// The Backtest Domain provides in-house strategy backtesting with:
//   - A full backtest simulator (candle-by-candle execution)
//   - State machine for position management (stops, excursions, etc.)
//   - Performance metrics (Sharpe, Sortino, max drawdown, CAGR, etc.)
//   - Server functions for running backtests from the UI
//
// Architecture:
//   - engine/     → Pure logic: simulator, state machine, metrics, types
//   - functions.ts → Server functions (createServerFn) for UI integration
// ============================================================================

// Engine barrel — pure logic, safe for both client and server
export {
  runBacktest,
  runBacktestSync,
  runBacktestCore,
  applyOrder,
  closeAll,
  checkProtectiveStops,
  flatPosition,
  isFlat,
  updateExcursions,
  CandlePath,
  packCandles,
  computeMetrics,
  computeMaxDrawdown,
  computeReturns,
  computeTradeStats,
  computeCagr,
  sharpeRatio,
  sortinoRatio,
  stdDev,
  mean,
} from "./engine";

export type {
  BacktestConfig,
  BacktestResult,
  BacktestMetrics,
  BacktestStats,
  Candle,
  CompiledStrategy,
  EquityPoint,
  OrderOpts,
  OrderRequest,
  Position,
  PositionSide,
  PositionSizeConfig,
  PositionSizeType,
  StrategyContextLike,
  Trade,
  TrailingStopConfig,
  OrderKind,
  StrategyRunResult,
  StateMachineConfig,
  ApplyOrderResult,
  StopCheckResult,
  PackedCandles,
  CandlePathEvent,
  MetricComputationInput,
  DrawdownResult,
} from "./engine";

// Strategy compilation (used by server functions and experiments)
export { compileStrategy } from "./functions";
