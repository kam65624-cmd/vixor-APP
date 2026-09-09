/**
 * VIXOR — Binance REST Kline/F candlestick client
 * =================================================
 * Fetches historical OHLCV candlestick data from Binance public API.
 *
 * Public endpoint — no API key required.
 * Rate limit: 1200 requests/minute (weighted).
 *
 * Usage:
 *   const bars = await getKlines({ symbol: 'BTCUSDT', interval: '1h', limit: 100 });
 *   // → OHLCVBar[] ready for pattern detection
 *
 * Supported intervals:
 *   1m, 3m, 5m, 15m, 30m, 1h, 2h, 4h, 6h, 8h, 12h, 1d, 3d, 1w, 1M
 */

import type { OHLCVBar } from "@/domains/analysis/engine/core/types";

export const BINANCE_REST_URL = "https://api.binance.com";
export const BINANCE_TESTNET_URL = "https://testnet.binance.vision";

export type KlineInterval =
  | "1m"
  | "3m"
  | "5m"
  | "15m"
  | "30m"
  | "1h"
  | "2h"
  | "4h"
  | "6h"
  | "8h"
  | "12h"
  | "1d"
  | "3d"
  | "1w"
  | "1M";

export interface GetKlinesParams {
  /** Binance symbol, e.g. "BTCUSDT", "SOLUSDT" */
  symbol: string;
  /** Kline interval, e.g. "1h", "4h", "1d" */
  interval: KlineInterval;
  /** Number of candles to fetch, max 1000 */
  limit?: number;
  /** Start time in ms (optional) */
  startTime?: number;
  /** End time in ms (optional) */
  endTime?: number;
  /** Use testnet instead of mainnet */
  testnet?: boolean;
}

// ── Binance kline raw response shape ──────────────────────────────────────────

/** Raw Binance kline tuple — each element is a specific field per their API docs */
type RawKline = [
  number, // 0  open time
  string, // 1  open
  string, // 2  high
  string, // 3  low
  string, // 4  close
  string, // 5  volume
  number, // 6  close time
  string, // 7  quote volume
  number, // 8  num trades
  string, // 9  taker buy base vol
  string, // 10 taker buy quote vol
  string, // 11 ignore
];

// ── Main fetch function ───────────────────────────────────────────────────────

/**
 * Fetch OHLCV candlestick data from Binance.
 * Returns parsed OHLCVBar[] or null on failure.
 */
export async function getKlines(params: GetKlinesParams): Promise<OHLCVBar[]> {
  const { symbol, interval, limit = 100, startTime, endTime, testnet = false } = params;

  const base = testnet ? BINANCE_TESTNET_URL : BINANCE_REST_URL;
  const url = new URL(`${base}/api/v3/klines`);

  url.searchParams.set("symbol", symbol.toUpperCase());
  url.searchParams.set("interval", interval);
  url.searchParams.set("limit", String(Math.min(limit, 1000)));

  if (startTime) url.searchParams.set("startTime", String(startTime));
  if (endTime) url.searchParams.set("endTime", String(endTime));

  try {
    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      console.error(`[binance-klines] HTTP ${res.status} for ${symbol} ${interval}`);
      return [];
    }

    const data: RawKline[] = await res.json();

    if (!Array.isArray(data) || data.length === 0) return [];

    return data.map((k) => ({
      time: k[0] as number,
      open: parseFloat(k[1]) as number,
      high: parseFloat(k[2]) as number,
      low: parseFloat(k[3]) as number,
      close: parseFloat(k[4]) as number,
      volume: parseFloat(k[5]) as number,
    }));
  } catch (err) {
    console.error(`[binance-klines] Failed to fetch ${symbol} ${interval}:`, err);
    return [];
  }
}

// ── Convenience: last N bars for pattern detection ─────────────────────────────

/**
 * Get the most recent `count` bars for a symbol/interval.
 * Ideal for feeding into `detectCandlestickPatterns()`.
 */
export async function getRecentBars(
  symbol: string,
  interval: KlineInterval = "1h",
  count = 200,
  testnet = false,
): Promise<OHLCVBar[]> {
  return getKlines({ symbol, interval, limit: count, testnet });
}

// ── Convenience: specific timeframe bundle ─────────────────────────────────────

/**
 * Get bars across multiple timeframes for a symbol.
 * Useful for multi-timeframe analysis (MTF).
 */
export async function getMultiTimeframeBars(
  symbol: string,
  testnet = false,
): Promise<Record<string, OHLCVBar[]>> {
  const intervals: KlineInterval[] = ["15m", "1h", "4h", "1d"];

  // Fetch all timeframes in parallel
  const results = await Promise.all(
    intervals.map((iv) => getKlines({ symbol, interval: iv, limit: 100, testnet }).catch(() => [])),
  );

  const bundle: Record<string, OHLCVBar[]> = {};
  intervals.forEach((iv, i) => {
    bundle[iv] = results[i];
  });

  return bundle;
}

// ── Symbol search (public) ─────────────────────────────────────────────────────

/**
 * Check if a symbol pair exists on Binance.
 * Returns the canonical symbol (e.g. BTCUSDT) or null.
 */
export async function resolveSymbol(base: string, quote = "USDT"): Promise<string | null> {
  try {
    const url = `${BINANCE_REST_URL}/api/v3/exchangeInfo`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5_000),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as { symbols?: Array<{ symbol: string; status: string }> };

    const match = (data.symbols ?? []).find(
      (s) => s.symbol === `${base.toUpperCase()}${quote.toUpperCase()}` && s.status === "TRADING",
    );

    return match?.symbol ?? null;
  } catch {
    return null;
  }
}

// ── Type re-export for consumers ─────────────────────────────────────────────

export type { OHLCVBar };
