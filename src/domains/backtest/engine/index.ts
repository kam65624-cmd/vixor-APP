// ============================================================================
// VIXOR Backtest Engine — Barrel
// ============================================================================
export { runBacktest, runBacktestSync, runBacktestCore } from "./simulator";
export {
  applyOrder,
  closeAll,
  checkProtectiveStops,
  flatPosition,
  isFlat,
  updateExcursions,
  type StateMachineConfig,
  type ApplyOrderResult,
  type StopCheckResult,
} from "./state-machine";
export { CandlePath, packCandles, type PackedCandles, type CandlePathEvent } from "./candle-path";
export {
  computeMetrics,
  computeMaxDrawdown,
  computeReturns,
  computeTradeStats,
  computeCagr,
  sharpeRatio,
  sortinoRatio,
  stdDev,
  mean,
  type MetricComputationInput,
  type DrawdownResult,
} from "./metrics";
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
} from "./types";
