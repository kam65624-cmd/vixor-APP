// ============================================================================
// VIXOR Backtest Engine — Type Definitions
// ============================================================================
// Ported from QuantDinger/backend_api_python/app/services/backtest.py
// Pure TypeScript, no Python idioms. All numeric arrays use Float64Array where
// performance matters.

/**
 * OHLCV candle. Structurally compatible with the analysis engine's OHLCVBar so
 * the two subsystems can share data without conversion.
 */
export interface Candle {
  time: number; // unix timestamp (ms) or sequential index
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Strategy compiled by the runtime (see `src/domains/strategy/runtime`). */
export interface CompiledStrategy {
  onStart?(ctx: StrategyContextLike): void;
  onBar?(ctx: StrategyContextLike): void;
  onEnd?(ctx: StrategyContextLike): void;
}

/** Minimal strategy-context surface the simulator relies on. The runtime
 *  supplies a richer implementation — this interface is a structural subset. */
export interface StrategyContextLike {
  readonly bar: Candle;
  readonly bars: readonly Candle[];
  readonly currentIndex: number;
  /** Current open position (or a flat sentinel if no position). */
  readonly position: Position;
  orders: OrderRequest[];
  buy(opts: OrderOpts): void;
  sell(opts: OrderOpts): void;
  close(opts?: { reason?: string }): void;
}

export type PositionSide = "flat" | "long" | "short";

export type PositionSizeType = "fixed" | "percent" | "kelly";

export interface PositionSizeConfig {
  type: PositionSizeType;
  /** fixed=units, percent=0..1 of equity, kelly=kelly fraction (0..1) */
  value: number;
}

export type OrderKind = "market" | "limit" | "stop" | "stop_limit";

export interface OrderOpts {
  qty?: number;
  price?: number;
  kind?: OrderKind;
  stopLoss?: number;
  takeProfit?: number;
  /** scale-in (add) vs open new — defaults to false */
  scaleIn?: boolean;
  /** tag/label for the order (used in trade log) */
  tag?: string;
}

export interface OrderRequest {
  side: "buy" | "sell";
  qty: number;
  price?: number;
  kind: OrderKind;
  stopLoss?: number;
  takeProfit?: number;
  scaleIn: boolean;
  tag?: string;
  /** bar index at which the order was placed */
  placedAtIndex: number;
}

export interface TrailingStopConfig {
  activation: number; // profit threshold to arm trailing stop (fraction of entry)
  distance: number; // trailing distance (fraction of price)
}

export interface BacktestConfig {
  strategy: CompiledStrategy;
  candles: Candle[];
  initialCapital: number;
  /** per-trade commission as fraction (e.g. 0.0006 = 6 bps) */
  commission: number;
  /** per-trade slippage as fraction */
  slippage: number;
  positionSize: PositionSizeConfig;
  /** cap notional per position (units of quote currency) */
  maxPositionSize?: number;
  allowShort?: boolean;
  maxConcurrentPositions?: number;
  /** stop-loss as fraction of entry (e.g. 0.02 = 2%) */
  stopLoss?: number;
  /** take-profit as fraction of entry */
  takeProfit?: number;
  trailingStop?: TrailingStopConfig;
  /** skip first N bars (warmup) */
  warmupPeriod?: number;
  /** execute orders on next bar open (default) vs current bar close */
  executionTiming?: "next_bar_open" | "same_bar_close";
  /** periods per year for annualization (e.g. 252 for daily, 365*24 for hourly) */
  periodsPerYear?: number;
  /** risk-free rate (annual) used in Sharpe/Sortino */
  riskFreeRate?: number;
}

/** A single point on the equity curve. */
export interface EquityPoint {
  time: number;
  equity: number;
  drawdown: number; // current drawdown as fraction (0..1, positive)
}

export interface Trade {
  id: number;
  side: "long" | "short";
  entryIndex: number;
  exitIndex: number;
  entryTime: number;
  exitTime: number;
  entryPrice: number;
  exitPrice: number;
  qty: number;
  grossPnl: number;
  commissionPaid: number;
  slippageCost: number;
  netPnl: number;
  /** return as fraction of notional */
  returnPct: number;
  /** Maximum Adverse Excursion (worst unrealised loss fraction) */
  mae: number;
  /** Maximum Favourable Excursion (best unrealised gain fraction) */
  mfe: number;
  /** R-multiple: net PnL / initial risk (= |entry - stop| * qty) */
  rMultiple: number;
  /** reason the trade was closed */
  exitReason: "signal" | "stop_loss" | "take_profit" | "trailing_stop" | "end_of_data" | "manual";
  /** duration in bars */
  durationBars: number;
  tag?: string;
}

/** Open position state — the state machine produces/consumes this. */
export interface Position {
  side: PositionSide;
  qty: number;
  entryPrice: number;
  /** blended entry price for scaled-in positions */
  avgEntryPrice: number;
  openedAtIndex: number;
  openedAtTime: number;
  stopLoss?: number;
  takeProfit?: number;
  /** trailing-stop state — set once activation threshold reached */
  trailingActive?: boolean;
  trailingPeak?: number; // best price observed (long) or worst (short)
  /** MAE/MFE in price terms */
  maePrice?: number;
  mfePrice?: number;
  /** initial risk per unit (= |entry - stop|) */
  initialRisk?: number;
  tag?: string;
}

export interface BacktestMetrics {
  totalReturn: number; // %
  annualReturn: number; // %
  cagr: number; // %
  maxDrawdown: number; // % (positive number, e.g. 12.5 = -12.5%)
  maxDrawdownAbs: number; // currency
  maxDrawdownDuration: number; // bars
  sharpe: number;
  sortino: number;
  winRate: number; // %
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  expectancy: number; // expected $ per trade
  avgRMultiple: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  totalProfit: number;
  totalCommission: number;
  volatility: number; // annualised %
}

export interface BacktestStats {
  totalBars: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  exposureTime: number; // % of bars with open position
}

export interface BacktestResult {
  equityCurve: EquityPoint[];
  trades: Trade[];
  metrics: BacktestMetrics;
  stats: BacktestStats;
  /** final equity value */
  finalEquity: number;
  /** initial capital */
  initialCapital: number;
}

/** Strategy runtime execution result — produced by `StrategyRuntime.run`. */
export interface StrategyRunResult {
  orders: OrderRequest[];
  logs: string[];
  events: Array<{ name: string; payload?: unknown; barIndex: number }>;
  /** number of bars processed */
  barsProcessed: number;
}
