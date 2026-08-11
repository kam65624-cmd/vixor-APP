// ============================================================================
// VIXOR V2 — Canonical Market Data Types (Data Foundation)
// ============================================================================
//
// These types define the canonical (provider-agnostic) representations for
// market data flowing through VIXOR. All provider adapters MUST normalize
// their output to these types before passing data to domain engines.
//
// Contract: PROVIDER → ADAPTER → NORMALIZER → CANONICAL MODEL → DOMAIN
//
// No provider-specific structure may leak past the normalization boundary.
// ============================================================================

// ── Asset Identity ─────────────────────────────────────────────────────────

/** Canonical asset identifier — resolves symbol ambiguity across providers */
export interface AssetId {
  /** Canonical symbol, e.g. "BTC", "ETH", "SOL" */
  symbol: string;
  /** Display name, e.g. "Bitcoin" */
  name: string;
  /** Blockchain or exchange context, e.g. "solana", "ethereum", "binance" */
  chain?: string;
  /** CoinGecko ID for cross-reference */
  coingeckoId?: string;
  /** Token mint address (Solana) or contract address (EVM) */
  address?: string;
}

// ── Price Types ─────────────────────────────────────────────────────────────

/** Canonical quote — the unified price representation */
export interface CanonicalQuote {
  /** Normalized pair, e.g. "BTC/USDT" */
  pair: string;
  /** Mid-price or last trade price */
  price: number;
  /** Best bid price (null if unavailable) */
  bid: number | null;
  /** Best ask price (null if unavailable) */
  ask: number | null;
  /** 24h change in percent */
  change24hPct: number;
  /** 24h high */
  high24h: number;
  /** 24h low */
  low24h: number;
  /** 24h base volume */
  volume24h: number;
  /** 24h quote volume (in stablecoin) */
  quoteVolume24h: number | null;
  /** ISO 8601 timestamp of the quote */
  timestamp: string;
  /** Provider that supplied this quote */
  source: PriceSource;
}

/** Supported price sources */
export type PriceSource =
  "binance" | "dexscreener" | "finnhub" | "twelvedata" | "helius" | "cache" | "unknown";

// ── Candle / OHLCV ─────────────────────────────────────────────────────────

/** Canonical candlestick */
export interface CanonicalCandle {
  pair: string;
  /** Candle open time as ISO 8601 */
  openTime: string;
  open: number;
  high: number;
  low: number;
  close: number;
  /** Base volume */
  volume: number;
  /** Quote volume (in stablecoin) if available */
  quoteVolume: number | null;
  source: PriceSource;
}

// ── Market Snapshot ─────────────────────────────────────────────────────────

/** A complete market snapshot for a single asset */
export interface MarketSnapshot {
  asset: AssetId;
  quote: CanonicalQuote;
  candles?: CanonicalCandle[];
  /** When this snapshot was assembled (ISO 8601) */
  fetchedAt: string;
  /** Data freshness — seconds since the quote timestamp */
  ageSeconds: number;
}

// ── Freshness ───────────────────────────────────────────────────────────────

/** Freshness classification for cached data */
export type Freshness = "fresh" | "stale" | "expired" | "unknown";

/** Freshness check result */
export interface FreshnessCheck {
  status: Freshness;
  /** Age in seconds */
  ageSeconds: number;
  /** Maximum acceptable age in seconds */
  maxAgeSeconds: number;
}

// ── Provider Health ─────────────────────────────────────────────────────────

/** Health status of a data provider */
export type ProviderHealthStatus = "healthy" | "degraded" | "down" | "unknown";

export interface ProviderHealth {
  provider: PriceSource;
  status: ProviderHealthStatus;
  /** Last successful response timestamp (ISO 8601) */
  lastSuccessAt: string | null;
  /** Last error timestamp (ISO 8601) */
  lastErrorAt: string | null;
  /** Consecutive failure count */
  consecutiveFailures: number;
  /** Average response time in ms */
  avgResponseMs: number | null;
}

// ── Normalization Result ────────────────────────────────────────────────────

/** Result of normalizing a provider response */
export interface NormalizationResult<T> {
  ok: true;
  data: T;
  source: PriceSource;
  normalizedAt: string;
}

export interface NormalizationError {
  ok: false;
  error: string;
  code: "INVALID_PAYLOAD" | "MISSING_FIELD" | "PROVIDER_ERROR" | "VALIDATION_FAILED";
  source: PriceSource;
}

export type NormalizationResponse<T> = NormalizationResult<T> | NormalizationError;
