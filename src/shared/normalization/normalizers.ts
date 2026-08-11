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

import type { CanonicalQuote, CanonicalCandle, NormalizationResponse, PriceSource } from "./types";

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
