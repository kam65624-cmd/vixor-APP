// ============================================================================
// VIXOR Price Resolver — Source Priority & Conflict Prevention
// ============================================================================
//
// Architecture:
//   1. Each data source has a confidence score (0.0–1.0)
//   2. When multiple sources provide the same pair, the resolver picks
//      the highest-confidence source. If timestamps differ by >5s,
//      the more recent source wins regardless of confidence.
//   3. Source switches are logged for observability.
//
// Source Confidence Hierarchy:
//   Binance WS:    1.00  (real-time, direct exchange)
//   Binance REST:  0.95  (real-time, direct exchange)
//   DexScreener:   0.85  (real-time, aggregated DEX)
//   TwelveData:    0.80  (REST, 15-30s delayed)
//   Finnhub:       0.75  (REST, ~15s delayed)
//   Cache:         0.50  (stale data)
//
// ============================================================================

import type { LivePrice } from "./binance-ws";

// ── Types ───────────────────────────────────────────────────────────────────

export type PriceSource =
  | "binance-ws"
  | "binance-rest"
  | "dexscreener"
  | "twelvedata"
  | "finnhub"
  | "exchangerate-api"
  | "cache";

export interface ResolvedPrice {
  pair: string;
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  open24h: number;
  timestamp: number;
  source: PriceSource;
  confidence: number;
}

interface CandidatePrice {
  pair: string;
  symbol: string;
  price: number;
  change24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  open24h: number;
  timestamp: number;
  source: PriceSource;
  confidence: number;
}

// ── Source Confidence Map ───────────────────────────────────────────────────

const SOURCE_CONFIDENCE: Record<PriceSource, number> = {
  "binance-ws": 1.00,
  "binance-rest": 0.95,
  dexscreener: 0.85,
  twelvedata: 0.80,
  finnhub: 0.75,
  "exchangerate-api": 0.60,
  cache: 0.50,
};

// ── Price Resolver ──────────────────────────────────────────────────────────

/**
 * Singleton price resolver that prevents data conflicts between sources.
 *
 * For each pair, it tracks the last accepted source and timestamp.
 * When a new price arrives, it's accepted if:
 *   a) It's from a higher-confidence source, OR
 *   b) It's >5 seconds more recent than the current price, OR
 *   c) No price exists yet for this pair
 */
class PriceResolverSingleton {
  private resolved = new Map<string, CandidatePrice>();
  private switchLog: Array<{ pair: string; from: PriceSource; to: PriceSource; ts: number }> = [];
  private maxLogSize = 200;

  /**
   * Submit a price candidate. Returns the resolved price after conflict resolution.
   * Only accepts the new price if it passes the priority/timestamp check.
   */
  resolve(candidate: CandidatePrice): ResolvedPrice {
    const key = candidate.pair || candidate.symbol;
    const existing = this.resolved.get(key);

    // No existing price — accept immediately
    if (!existing) {
      this.resolved.set(key, candidate);
      return this.toResolved(candidate);
    }

    const timeDiff = candidate.timestamp - existing.timestamp;
    const isMoreRecent = timeDiff > 5000; // >5 seconds newer
    const isHigherConfidence = candidate.confidence > existing.confidence;

    // Reject if lower confidence AND not significantly more recent
    if (!isHigherConfidence && !isMoreRecent) {
      return this.toResolved(existing);
    }

    // Accept the new price
    if (candidate.source !== existing.source) {
      this.logSwitch(key, existing.source, candidate.source);
    }
    this.resolved.set(key, candidate);
    return this.toResolved(candidate);
  }

  /** Get the currently resolved price for a pair, or undefined */
  get(pair: string): ResolvedPrice | undefined {
    const candidate = this.resolved.get(pair);
    return candidate ? this.toResolved(candidate) : undefined;
  }

  /** Get all currently resolved prices */
  getAll(): ResolvedPrice[] {
    return Array.from(this.resolved.values()).map((c) => this.toResolved(c));
  }

  /** Get all resolved prices as a Map keyed by symbol */
  getMap(): Map<string, ResolvedPrice> {
    const map = new Map<string, ResolvedPrice>();
    for (const candidate of this.resolved.values()) {
      const key = candidate.symbol || candidate.pair;
      map.set(key, this.toResolved(candidate));
    }
    return map;
  }

  /** Remove a resolved price (e.g., on disconnect) */
  remove(pair: string): void {
    this.resolved.delete(pair);
  }

  /** Clear all resolved prices */
  clear(): void {
    this.resolved.clear();
  }

  /** Get recent source switches for observability */
  getSwitchLog(): typeof this.switchLog {
    return this.switchLog;
  }

  /** Number of currently resolved pairs */
  get size(): number {
    return this.resolved.size;
  }

  // ── Internal ────────────────────────────────────────────────────────────

  private toResolved(c: CandidatePrice): ResolvedPrice {
    return {
      pair: c.pair,
      symbol: c.symbol,
      price: c.price,
      change24h: c.change24h,
      high24h: c.high24h,
      low24h: c.low24h,
      volume24h: c.volume24h,
      quoteVolume24h: c.quoteVolume24h,
      open24h: c.open24h,
      timestamp: c.timestamp,
      source: c.source,
      confidence: c.confidence,
    };
  }

  private logSwitch(pair: string, from: PriceSource, to: PriceSource): void {
    const entry = { pair, from, to, ts: Date.now() };
    this.switchLog.push(entry);
    if (this.switchLog.length > this.maxLogSize) {
      this.switchLog.shift();
    }
  }
}

// ── Singleton Export ────────────────────────────────────────────────────────

export const PriceResolver = new PriceResolverSingleton();

// ── Helpers ─────────────────────────────────────────────────────────────────

/** Get the confidence score for a source */
export function getSourceConfidence(source: PriceSource): number {
  return SOURCE_CONFIDENCE[source] ?? 0.5;
}

/** Convert a BinanceWS LivePrice to a resolver candidate */
export function binanceWsToCandidate(lp: LivePrice): CandidatePrice {
  return {
    pair: lp.pair,
    symbol: lp.symbol,
    price: lp.price,
    change24h: lp.change24h,
    high24h: lp.high24h,
    low24h: lp.low24h,
    volume24h: lp.volume24h,
    quoteVolume24h: lp.quoteVolume24h,
    open24h: lp.open24h,
    timestamp: lp.timestamp,
    source: "binance-ws",
    confidence: SOURCE_CONFIDENCE["binance-ws"],
  };
}

/** Convert a server-side price fetcher result to a resolver candidate */
export function serverPriceToCandidate(
  pair: string,
  price: number,
  source: PriceSource,
  extra: { change24h?: number; high24h?: number; low24h?: number; volume24h?: number; timestamp?: number },
): CandidatePrice {
  return {
    pair,
    symbol: pair.replace("/", ""),
    price,
    change24h: extra.change24h ?? 0,
    high24h: extra.high24h ?? 0,
    low24h: extra.low24h ?? 0,
    volume24h: extra.volume24h ?? 0,
    quoteVolume24h: 0,
    open24h: 0,
    timestamp: extra.timestamp ?? Date.now(),
    source,
    confidence: SOURCE_CONFIDENCE[source] ?? 0.5,
  };
}
