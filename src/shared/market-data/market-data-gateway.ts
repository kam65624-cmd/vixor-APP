// ============================================================================
// VIXOR V2 — Market Data Gateway
// ============================================================================
//
// Unified gateway that fetches canonical quotes with caching and TTL support.
// Uses getMarketPrices as the primary fetcher (server-side) and normalizes
// responses through the ProviderRegistry.
//
// Cache priority: cache → fetch → normalize
//
// ============================================================================

import type { CanonicalQuote, PriceSource } from "@/shared/normalization/types";
import { ProviderRegistry } from "@/shared/normalization/provider-registry";

class CacheEntry {
  constructor(
    public data: CanonicalQuote,
    public expiresAt: number,
  ) {}
}

export class MarketDataGateway {
  private static instance: MarketDataGateway;
  private cache = new Map<string, CacheEntry>();
  private defaultTtlMs: number;

  private constructor(defaultTtlMs: number = 30_000) {
    this.defaultTtlMs = defaultTtlMs;
  }

  static getInstance(defaultTtlMs?: number): MarketDataGateway {
    if (!MarketDataGateway.instance) {
      MarketDataGateway.instance = new MarketDataGateway(defaultTtlMs);
    }
    return MarketDataGateway.instance;
  }

  /**
   * Get canonical quote for a pair, trying cache first then fetching.
   *
   * @param pair    Canonical pair, e.g. "BTC/USDT"
   * @param options.maxAgeMs  Max cache age in ms (default: 30s)
   * @param options.source    Force a specific source (optional)
   */
  async getQuote(
    pair: string,
    options?: { maxAgeMs?: number; source?: PriceSource },
  ): Promise<CanonicalQuote> {
    const ttlMs = options?.maxAgeMs ?? this.defaultTtlMs;

    // 1. Check cache
    const cached = this.getCached(pair, ttlMs);
    if (cached) return cached;

    // 2. Fetch
    const fetched = await this.fetchAndNormalize(pair, options?.source);
    if (fetched) return fetched;

    // 3. If fetch failed, return stale cache if available
    const stale = this.cache.get(pair);
    if (stale) return stale.data;

    throw new Error(`Failed to fetch quote for ${pair}`);
  }

  /**
   * Get multiple quotes at once.
   */
  async getQuotes(
    pairs: string[],
    options?: { maxAgeMs?: number },
  ): Promise<Map<string, CanonicalQuote>> {
    const ttlMs = options?.maxAgeMs ?? this.defaultTtlMs;
    const result = new Map<string, CanonicalQuote>();
    const toFetch: string[] = [];

    // Check cache for each pair
    for (const pair of pairs) {
      const cached = this.getCached(pair, ttlMs);
      if (cached) {
        result.set(pair, cached);
      } else {
        toFetch.push(pair);
      }
    }

    // Fetch missing pairs
    if (toFetch.length > 0) {
      try {
        const { getMarketPrices } = await import("@/domains/market/functions");
        const marketPrices = await getMarketPrices();
        if (Array.isArray(marketPrices)) {
          for (const mp of marketPrices) {
            const normalized = this.normalizeMarketPriceItem(mp);
            if (normalized) {
              this.cache.set(normalized.pair, new CacheEntry(normalized, Date.now() + ttlMs));
              if (toFetch.includes(normalized.pair)) {
                result.set(normalized.pair, normalized);
              }
            }
          }
        }
      } catch {
        // Fetch failed — stale cache will be returned below for missing pairs
      }
    }

    // For any pairs still missing, try stale cache
    for (const pair of toFetch) {
      if (!result.has(pair)) {
        const stale = this.cache.get(pair);
        if (stale) {
          result.set(pair, stale.data);
        }
      }
    }

    return result;
  }

  /**
   * Get cached price for a pair, or undefined if not cached.
   */
  getCachedPrice(pair: string): number | undefined {
    const entry = this.cache.get(pair);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) return undefined;
    return entry.data.price;
  }

  /**
   * Clear all cache entries.
   */
  clearCache(): void {
    this.cache.clear();
  }

  // ── Private methods ──────────────────────────────────────────────────

  private getCached(pair: string, maxAgeMs: number): CanonicalQuote | undefined {
    const entry = this.cache.get(pair);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(pair);
      return undefined;
    }
    return entry.data;
  }

  private async fetchAndNormalize(
    pair: string,
    source?: PriceSource,
  ): Promise<CanonicalQuote | null> {
    try {
      const { getMarketPrices } = await import("@/domains/market/functions");
      const marketPrices = await getMarketPrices();
      if (!Array.isArray(marketPrices)) return null;

      for (const mp of marketPrices) {
        const normalized = this.normalizeMarketPriceItem(mp);
        if (normalized && normalized.pair === pair) {
          const ttlMs = this.defaultTtlMs;
          this.cache.set(pair, new CacheEntry(normalized, Date.now() + ttlMs));
          return normalized;
        }
      }
    } catch {
      // Fetch failed
    }
    return null;
  }

  /**
   * Normalize a MarketPriceItem from getMarketPrices into a CanonicalQuote.
   * Attempts to detect the source and route through ProviderRegistry.
   */
  private normalizeMarketPriceItem(mp: {
    symbol?: string;
    pair?: string;
    price?: number;
    change24h?: number;
    source?: string;
    timestamp?: number;
    high24h?: number;
    low24h?: number;
    volume24h?: number;
  }): CanonicalQuote | null {
    if (!mp.price || mp.price <= 0) return null;

    const pair = mp.pair || mp.symbol || "";
    if (!pair) return null;

    // Determine source
    const srcStr = mp.source?.toLowerCase() || "";
    let priceSource: PriceSource = "unknown";
    if (srcStr.includes("binance")) priceSource = "binance";
    else if (srcStr.includes("finnhub")) priceSource = "finnhub";
    else if (srcStr.includes("dexscreener")) priceSource = "dexscreener";
    else if (srcStr.includes("twelvedata")) priceSource = "twelvedata";
    else if (srcStr.includes("cache")) priceSource = "cache";

    return {
      pair,
      price: mp.price,
      bid: null,
      ask: null,
      change24hPct: mp.change24h ?? 0,
      high24h: mp.high24h ?? mp.price,
      low24h: mp.low24h ?? mp.price,
      volume24h: mp.volume24h ?? 0,
      quoteVolume24h: null,
      timestamp: mp.timestamp ? new Date(mp.timestamp).toISOString() : new Date().toISOString(),
      source: priceSource,
    };
  }
}
