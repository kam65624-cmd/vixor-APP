// ============================================================================
// VIXOR Backtest Engine — Candle Path Iterator
// ============================================================================
// Provides bar-by-bar iteration with lookahead protection. The simulator never
// sees future candles — only `bars[0..=currentIndex]` is exposed via the
// strategy context.

import type { Candle } from "./types";

export interface CandlePathEvent {
  type: "bar_open" | "bar_close";
  index: number;
  bar: Candle;
  /** bars visible to the strategy at this moment (0..=index) */
  visibleBars: readonly Candle[];
}

/**
 * Packs candle OHLCV columns into Float64Arrays for fast metric computation
 * and indicator math. The source `candles` array remains the canonical view
 * (with timestamps) — these arrays are for numeric heavy-lifting.
 */
export interface PackedCandles {
  n: number;
  time: Float64Array;
  open: Float64Array;
  high: Float64Array;
  low: Float64Array;
  close: Float64Array;
  volume: Float64Array;
}

export function packCandles(candles: readonly Candle[]): PackedCandles {
  const n = candles.length;
  const time = new Float64Array(n);
  const open = new Float64Array(n);
  const high = new Float64Array(n);
  const low = new Float64Array(n);
  const close = new Float64Array(n);
  const volume = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const c = candles[i];
    time[i] = c.time;
    open[i] = c.open;
    high[i] = c.high;
    low[i] = c.low;
    close[i] = c.close;
    volume[i] = c.volume;
  }
  return { n, time, open, high, low, close, volume };
}

/**
 * Iterator over a candle series. `next()` advances by one bar and returns a
 * `visibleBars` slice that excludes future candles — this is the single source
 * of truth for what the strategy is allowed to see.
 */
export class CandlePath {
  private readonly candles: readonly Candle[];
  private index: number;
  readonly packed: PackedCandles;

  constructor(candles: readonly Candle[]) {
    this.candles = candles;
    this.index = -1;
    this.packed = packCandles(candles);
  }

  get length(): number {
    return this.candles.length;
  }

  /** Current bar (or `null` before the first `next()` call). */
  get current(): Candle | null {
    if (this.index < 0 || this.index >= this.candles.length) return null;
    return this.candles[this.index];
  }

  get currentIndex(): number {
    return this.index;
  }

  /** Bars visible to the strategy — `candles[0..=currentIndex]`. */
  get visibleBars(): readonly Candle[] {
    if (this.index < 0) return [];
    return this.candles.slice(0, this.index + 1);
  }

  /** Look-ahead-safe accessor: returns candle at `i` only if `i <= index`. */
  at(i: number): Candle | null {
    if (i < 0 || i > this.index || i >= this.candles.length) return null;
    return this.candles[i];
  }

  /** Peek at the *next* bar (used by the simulator for next-bar-open execution).
   *  This is the only method allowed to see a future candle, and only by one bar. */
  peekNext(): Candle | null {
    if (this.index + 1 >= this.candles.length) return null;
    return this.candles[this.index + 1];
  }

  reset(): void {
    this.index = -1;
  }

  next(): Candle | null {
    this.index++;
    if (this.index >= this.candles.length) {
      this.index = this.candles.length; // park at end
      return null;
    }
    return this.candles[this.index];
  }
}
