// ============================================================================
// VIXOR Strategy Runtime — Types
// ============================================================================
import type {
  Candle,
  OrderKind,
  OrderOpts,
  OrderRequest,
  Position,
  StrategyContextLike,
} from "@/domains/backtest/engine/types";

/** Indicator return shape — either a single latest value or a full series. */
export type IndicatorResult = number | number[];

/** Indicator API exposed to user strategies via `ctx.indicator`. */
export interface IndicatorAPI {
  /** Simple Moving Average of `close` over `period`. */
  sma(period: number, opts?: IndicatorOpts): IndicatorResult;
  /** Exponential Moving Average of `close` over `period`. */
  ema(period: number, opts?: IndicatorOpts): IndicatorResult;
  /** Relative Strength Index (Wilder's smoothing). */
  rsi(period: number, opts?: IndicatorOpts): IndicatorResult;
  /** MACD: { macd, signal, histogram }. */
  macd(
    fast?: number,
    slow?: number,
    signal?: number,
    opts?: IndicatorOpts,
  ):
    | { macd: number; signal: number; histogram: number }
    | { macd: number[]; signal: number[]; histogram: number[] };
  /** Average True Range (Wilder's). */
  atr(period: number, opts?: IndicatorOpts): IndicatorResult;
  /** Bollinger Bands: { upper, middle, lower }. */
  bollinger(
    period?: number,
    stddev?: number,
    opts?: IndicatorOpts,
  ):
    | { upper: number; middle: number; lower: number }
    | { upper: number[]; middle: number[]; lower: number[] };
  /** Stochastic oscillator: { k, d }. */
  stochastic(
    period?: number,
    smoothK?: number,
    smoothD?: number,
    opts?: IndicatorOpts,
  ): { k: number; d: number } | { k: number[]; d: number[] };
  /** Average Directional Index. */
  adx(period?: number, opts?: IndicatorOpts): IndicatorResult;
  /** On-Balance Volume. */
  obv(opts?: IndicatorOpts): IndicatorResult;
}

export interface IndicatorOpts {
  /** which OHLCV field to use (default: close) */
  source?: "open" | "high" | "low" | "close" | "volume" | "hl2" | "hlc3" | "ohlc4";
  /** return the full series instead of the latest value (default: false) */
  series?: boolean;
}

/**
 * StrategyContext — the runtime surface passed to `onStart`/`onBar`/`onEnd`.
 * Extends the backtest engine's `StrategyContextLike` so a runtime-produced
 * compiled strategy is directly usable by the backtest simulator.
 */
export interface StrategyContext extends StrategyContextLike {
  /** All bars so far (lookback allowed, future NOT visible). */
  readonly bars: readonly Candle[];
  /** Current bar. */
  readonly bar: Candle;
  readonly currentIndex: number;
  /** Current open position (or a flat sentinel if no position). */
  readonly position: Position;
  /** Pending orders placed during this bar (cleared each bar by the runtime). */
  orders: OrderRequest[];
  buy(opts: OrderOpts): void;
  sell(opts: OrderOpts): void;
  close(): void;
  /** Indicator helper. */
  readonly indicator: IndicatorAPI;
  /** Append to the run log. */
  log(msg: string): void;
  /** Emit a custom event (captured in the run result). */
  emit(event: string, payload?: unknown): void;
  /** Param accessor — uses user-provided defaults merged with declared @param values. */
  param<T = unknown>(name: string, defaultValue?: T): T;
  /** Available capital (cash + unrealised PnL of current position). */
  readonly equity: number;
  /** Cash balance. */
  readonly cash: number;
}

export interface RunConfig {
  initialCapital?: number;
  /** user-supplied param overrides */
  params?: Record<string, unknown>;
  /** if true, runtime auto-execute orders against an internal paper account
   *  so `position`/`equity`/`cash` are updated each bar. If false (default),
   *  orders are simply collected into `orders` for the caller (e.g. backtester)
   *  to process. */
  autoExecute?: boolean;
  commission?: number;
  slippage?: number;
  allowShort?: boolean;
}

export interface CompiledStrategy {
  onStart?(ctx: StrategyContext): void;
  onBar?(ctx: StrategyContext): void;
  onEnd?(ctx: StrategyContext): void;
}

/** Result of running a compiled strategy over a series of bars. */
export interface StrategyRunResult {
  orders: OrderRequest[];
  logs: unknown[];
  events: Array<{ name: string; payload?: unknown; barIndex: number }>;
  finalEquity: number;
  barsProcessed: number;
}

export type { Candle, OrderKind, OrderOpts, OrderRequest, Position };
