// ============================================================================
// VIXOR V2 — Market Data Normalizers
// ============================================================================
//
// Provider-specific adapters that convert raw API responses into canonical types.
// Each normalizer is a pure function with no side effects.
//
// Contract: Raw Provider Response → NormalizationResponse<CanonicalType>
//
// ============================================================================

import type {
  CanonicalQuote,
  CanonicalCandle,
  CanonicalOrderBook,
  NormalizationResponse,
  PriceSource,
} from "./types";

// ── Pair Normalization ─────────────────────────────────────────────────────
// Converts provider-specific pair formats to canonical "BASE/QUOTE" format.

/**
 * Normalize a pair string to canonical format.
 * Handles: "BTCUSDT" → "BTC/USDT", "BTC-USDT" → "BTC/USDT", "BTC/USDT" → "BTC/USDT"
 */
export function normalizePair(raw: string): string {
  // Already canonical
  if (raw.includes("/")) return raw.toUpperCase();

  // Known quote assets (ordered by specificity)
  const quotes = ["USDT", "USDC", "BUSD", "USD", "EUR", "BTC", "ETH", "SOL"];

  const upper = raw.toUpperCase();

  // Handle dash-separated pairs first ("BTC-USDT" → "BTC/USDT")
  if (upper.includes("-")) {
    const parts = upper.split("-");
    if (parts.length === 2 && parts[0] && parts[1]) {
      return `${parts[0]}/${parts[1]}`;
    }
  }

  // Handle concatenated pairs ("BTCUSDT" → "BTC/USDT")
  for (const quote of quotes) {
    if (upper.endsWith(quote)) {
      const base = upper.slice(0, -quote.length);
      if (base.length > 0) return `${base}/${quote}`;
    }
  }

  return raw.toUpperCase();
}

// ── Binance Normalizer ──────────────────────────────────────────────────────

/** Normalizes a Binance WebSocket ticker payload into a CanonicalQuote */
export function normalizeBinanceTicker(payload: {
  s?: string;
  c?: string;
  h?: string;
  l?: string;
  v?: string;
  q?: string;
  P?: string;
}): NormalizationResponse<CanonicalQuote> {
  if (!payload.s || !payload.c) {
    return {
      ok: false,
      error: "Missing symbol or price in Binance payload",
      code: "MISSING_FIELD",
      source: "binance",
    };
  }

  const pair = normalizePair(payload.s);
  const price = parseFloat(payload.c);
  const high = parseFloat(payload.h ?? "0");
  const low = parseFloat(payload.l ?? "0");
  const volume = parseFloat(payload.v ?? "0");
  const quoteVolume = parseFloat(payload.q ?? "0");
  const changePct = parseFloat(payload.P ?? "0");

  if (isNaN(price) || price <= 0) {
    return {
      ok: false,
      error: `Invalid Binance price: ${payload.c}`,
      code: "VALIDATION_FAILED",
      source: "binance",
    };
  }

  return {
    ok: true,
    data: {
      pair,
      price,
      bid: null,
      ask: null,
      change24hPct: changePct,
      high24h: high || price,
      low24h: low || price,
      volume24h: volume,
      quoteVolume24h: quoteVolume || null,
      timestamp: new Date().toISOString(),
      source: "binance",
    },
    source: "binance",
    normalizedAt: new Date().toISOString(),
  };
}

// ── Finnhub Normalizer ──────────────────────────────────────────────────────

/** Normalizes a Finnhub quote into a CanonicalQuote */
export function normalizeFinnhubQuote(quote: {
  pair?: string;
  price?: number;
  high?: number;
  low?: number;
  open?: number;
  change?: number;
  changePct?: number;
  timestamp?: number;
}): NormalizationResponse<CanonicalQuote> {
  if (!quote.pair || quote.price == null) {
    return {
      ok: false,
      error: "Missing pair or price in Finnhub quote",
      code: "MISSING_FIELD",
      source: "finnhub",
    };
  }

  if (quote.price <= 0) {
    return {
      ok: false,
      error: `Invalid Finnhub price: ${quote.price}`,
      code: "VALIDATION_FAILED",
      source: "finnhub",
    };
  }

  return {
    ok: true,
    data: {
      pair: normalizePair(quote.pair),
      price: quote.price,
      bid: null,
      ask: null,
      change24hPct: quote.changePct ?? 0,
      high24h: quote.high ?? quote.price,
      low24h: quote.low ?? quote.price,
      volume24h: 0, // Finnhub quote doesn't include volume
      quoteVolume24h: null,
      timestamp: quote.timestamp
        ? new Date(quote.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      source: "finnhub",
    },
    source: "finnhub",
    normalizedAt: new Date().toISOString(),
  };
}

// ── DexScreener Normalizer ─────────────────────────────────────────────────

/** Normalizes a DexScreener token response into a CanonicalQuote */
export function normalizeDexScreenerToken(token: {
  baseToken?: { symbol?: string };
  quoteToken?: { symbol?: string };
  priceUsd?: string;
  priceChange?: { h24?: number };
  volume?: { h24?: number };
  liquidity?: { usd?: number };
}): NormalizationResponse<CanonicalQuote> {
  const baseSymbol = token.baseToken?.symbol;
  const quoteSymbol = token.quoteToken?.symbol ?? "USD";

  if (!baseSymbol) {
    return {
      ok: false,
      error: "Missing baseToken.symbol in DexScreener response",
      code: "MISSING_FIELD",
      source: "dexscreener",
    };
  }

  const price = parseFloat(token.priceUsd ?? "0");
  if (isNaN(price) || price <= 0) {
    return {
      ok: false,
      error: `Invalid DexScreener price: ${token.priceUsd}`,
      code: "VALIDATION_FAILED",
      source: "dexscreener",
    };
  }

  const pair = `${baseSymbol}/${quoteSymbol}`;

  return {
    ok: true,
    data: {
      pair,
      price,
      bid: null,
      ask: null,
      change24hPct: token.priceChange?.h24 ?? 0,
      high24h: price, // DexScreener doesn't provide 24h high/low
      low24h: price,
      volume24h: token.volume?.h24 ?? 0,
      quoteVolume24h: null,
      timestamp: new Date().toISOString(),
      source: "dexscreener",
    },
    source: "dexscreener",
    normalizedAt: new Date().toISOString(),
  };
}

// ── TwelveData Normalizer ───────────────────────────────────────────────────

/**
 * Normalizes a TwelveData /quote response into a CanonicalQuote.
 *
 * TwelveData returns numeric fields as strings. Key mappings:
 *   - close → price (last trade price)
 *   - percent_change → change24hPct
 *   - high / low → high24h / low24h (day range)
 *   - volume → volume24h
 *   - timestamp (unix seconds) → ISO 8601
 */
export function normalizeTwelveDataQuote(quote: {
  symbol?: string;
  close?: string;
  high?: string;
  low?: string;
  volume?: string;
  percent_change?: string;
  change?: string;
  open?: string;
  previous_close?: string;
  timestamp?: number;
  currency?: string;
}): NormalizationResponse<CanonicalQuote> {
  if (!quote.symbol || !quote.close) {
    return {
      ok: false,
      error: "Missing symbol or close in TwelveData quote",
      code: "MISSING_FIELD",
      source: "twelvedata",
    };
  }

  const price = parseFloat(quote.close);
  if (isNaN(price) || price <= 0) {
    return {
      ok: false,
      error: `Invalid TwelveData close price: ${quote.close}`,
      code: "VALIDATION_FAILED",
      source: "twelvedata",
    };
  }

  const high = parseFloat(quote.high ?? "0");
  const low = parseFloat(quote.low ?? "0");
  const volume = parseFloat(quote.volume ?? "0");
  const changePct = parseFloat(quote.percent_change ?? "0");

  const pair = normalizePair(quote.symbol);

  return {
    ok: true,
    data: {
      pair,
      price,
      bid: null,
      ask: null,
      change24hPct: isNaN(changePct) ? 0 : changePct,
      high24h: isNaN(high) || high <= 0 ? price : high,
      low24h: isNaN(low) || low <= 0 ? price : low,
      volume24h: isNaN(volume) ? 0 : volume,
      quoteVolume24h: null,
      timestamp: quote.timestamp
        ? new Date(quote.timestamp * 1000).toISOString()
        : new Date().toISOString(),
      source: "twelvedata",
    },
    source: "twelvedata",
    normalizedAt: new Date().toISOString(),
  };
}

// ── Freshness Utilities ─────────────────────────────────────────────────────

import type { Freshness, FreshnessCheck } from "./types";

/**
 * Check data freshness based on age thresholds.
 * @param timestamp ISO 8601 timestamp of the data
 * @param maxAgeSeconds Maximum acceptable age (default: 60s for real-time, 300s for reference)
 */
export function checkFreshness(timestamp: string, maxAgeSeconds: number = 60): FreshnessCheck {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  const ageSeconds = ageMs / 1000;

  let status: Freshness;
  if (ageSeconds < maxAgeSeconds * 0.5) {
    status = "fresh";
  } else if (ageSeconds < maxAgeSeconds) {
    status = "stale";
  } else {
    status = "expired";
  }

  return { status, ageSeconds, maxAgeSeconds };
}

/** Format a freshness check for logging */
export function formatFreshness(check: FreshnessCheck, pair: string): string {
  return `[Freshness] ${pair}: ${check.status} (${Math.round(check.ageSeconds)}s / ${check.maxAgeSeconds}s max)`;
}

// ── Binance Order Book Normalizer ──────────────────────────────────────────

/**
 * Normalizes a Binance depth payload into a CanonicalOrderBook.
 *
 * Binance depth response format:
 *   { "lastUpdateId": 160, "bids": [["0.0024", "10"], ...], "asks": [["0.0026", "100"], ...] }
 */
export function normalizeBinanceOrderBook(
  payload: {
    lastUpdateId?: number;
    bids?: [string, string][];
    asks?: [string, string][];
    symbol?: string;
  },
  pairOverride?: string,
): NormalizationResponse<CanonicalOrderBook> {
  const rawBids = payload.bids ?? [];
  const rawAsks = payload.asks ?? [];

  if (rawBids.length === 0 && rawAsks.length === 0 && !pairOverride) {
    return {
      ok: false,
      error: "Missing bids, asks, or pairOverride in Binance order book payload",
      code: "MISSING_FIELD",
      source: "binance",
    };
  }

  const pair = pairOverride ? normalizePair(pairOverride) : normalizePair(payload.symbol ?? "");

  const bids = rawBids.map(([priceStr, qtyStr]) => ({
    price: parseFloat(priceStr),
    quantity: parseFloat(qtyStr),
  }));

  const asks = rawAsks.map(([priceStr, qtyStr]) => ({
    price: parseFloat(priceStr),
    quantity: parseFloat(qtyStr),
  }));

  const bestBid = bids.length > 0 ? bids[0].price : null;
  const bestAsk = asks.length > 0 ? asks[0].price : null;
  const spread = bestBid !== null && bestAsk !== null ? bestAsk - bestBid : null;
  const midPrice = bestBid !== null && bestAsk !== null ? (bestBid + bestAsk) / 2 : null;

  return {
    ok: true,
    data: {
      pair,
      bids,
      asks,
      bestBid,
      bestAsk,
      spread,
      midPrice,
      timestamp: new Date().toISOString(),
      source: "binance",
    },
    source: "binance",
    normalizedAt: new Date().toISOString(),
  };
}

// ── Binance Kline Normalizer ─────────────────────────────────────────────

/**
 * Normalizes a Binance kline array into a CanonicalCandle.
 *
 * Binance kline format:
 *   [
 *     "1499040000000",        // Open time (ms)
 *     "0.01634000",           // Open
 *     "0.80000000",           // High
 *     "0.01565800",           // Low
 *     "0.01577100",           // Close
 *     "148976.11427815",      // Volume (base)
 *     1499644799999,          // Close time (ms)
 *     "2434.19055334",        // Quote asset volume
 *     308,                     // Number of trades
 *     ...                      // (ignored)
 *   ]
 */
export function normalizeBinanceKline(
  kline: unknown[],
  pair: string,
): NormalizationResponse<CanonicalCandle> {
  if (!Array.isArray(kline) || kline.length < 6) {
    return {
      ok: false,
      error: "Binance kline must be an array with at least 6 elements",
      code: "INVALID_PAYLOAD",
      source: "binance",
    };
  }

  const openTime = Number(kline[0]);
  const open = parseFloat(String(kline[1]));
  const high = parseFloat(String(kline[2]));
  const low = parseFloat(String(kline[3]));
  const close = parseFloat(String(kline[4]));
  const volume = parseFloat(String(kline[5]));
  const quoteVolume = kline.length > 7 ? parseFloat(String(kline[7])) : null;

  if (isNaN(openTime) || isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
    return {
      ok: false,
      error: "Invalid numeric values in Binance kline",
      code: "VALIDATION_FAILED",
      source: "binance",
    };
  }

  return {
    ok: true,
    data: {
      pair: normalizePair(pair),
      openTime: new Date(openTime).toISOString(),
      open,
      high,
      low,
      close,
      volume: isNaN(volume) ? 0 : volume,
      quoteVolume: isNaN(quoteVolume ?? NaN) ? null : quoteVolume,
      source: "binance",
    },
    source: "binance",
    normalizedAt: new Date().toISOString(),
  };
}
