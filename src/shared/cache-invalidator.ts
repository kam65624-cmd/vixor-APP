// ============================================================================
// Vixor Cache Invalidation — Utilities for targeted cache invalidation
// ============================================================================
//
// Provides functions to invalidate specific cache entries or groups of entries.
// Used when data changes and the cache needs to be refreshed.
//
// Usage:
//   import { invalidatePriceCache, invalidateAllCache } from "@/shared/cache-invalidator";
//   await invalidatePriceCache("BTC/USDT");
//   await invalidateAllCache();
// ============================================================================

import { cache, CACHE_KEYS } from "@/shared/cache";

/**
 * Invalidate the cached price data for a specific pair.
 * Use this when a fresh price fetch is needed immediately.
 */
export async function invalidatePriceCache(pair: string): Promise<void> {
  await cache.delete(CACHE_KEYS.price(pair));
  console.log(`[CacheInvalidator] Invalidated price cache for ${pair}`);
}

/**
 * Invalidate all price data across all known pairs.
 * Use this when market conditions change dramatically (e.g., flash crash).
 */
export async function invalidateAllPriceCache(): Promise<void> {
  const knownPairs = [
    "BTC/USDT",
    "ETH/USDT",
    "SOL/USDT",
    "BNB/USDT",
    "XRP/USDT",
    "ADA/USDT",
    "DOGE/USDT",
    "AVAX/USDT",
    "DOT/USDT",
    "XAU/USD",
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "GBP/JPY",
    "AUD/USD",
    "NZD/USD",
    "USD/CAD",
    "USD/CHF",
    "EUR/GBP",
    "EUR/JPY",
  ];

  await Promise.allSettled(knownPairs.map((pair) => cache.delete(CACHE_KEYS.price(pair))));

  // Also invalidate the aggregated market prices cache
  await cache.delete(CACHE_KEYS.marketPrices());

  console.log(`[CacheInvalidator] Invalidated all price cache (${knownPairs.length} pairs)`);
}

/**
 * Invalidate the cached klines data for a specific pair and interval.
 * Use this when a fresh candle fetch is needed immediately.
 */
export async function invalidateKlinesCache(pair: string, interval: string): Promise<void> {
  await cache.delete(CACHE_KEYS.klines(pair, interval));
  console.log(`[CacheInvalidator] Invalidated klines cache for ${pair}:${interval}`);
}

/**
 * Invalidate the cached news data for a specific category.
 * Use this when fresh news is needed immediately.
 */
export async function invalidateNewsCache(category: string): Promise<void> {
  await cache.delete(CACHE_KEYS.news(category));
  console.log(`[CacheInvalidator] Invalidated news cache for category "${category}"`);
}

/**
 * Invalidate the aggregated market prices cache.
 * Use this when the dashboard needs fresh price data.
 */
export async function invalidateMarketPricesCache(): Promise<void> {
  await cache.delete(CACHE_KEYS.marketPrices());
  console.log(`[CacheInvalidator] Invalidated market prices cache`);
}

/**
 * Nuclear option — invalidate ALL vixor cache entries.
 * Use this sparingly, only when a full refresh is absolutely necessary.
 */
export async function invalidateAllCache(): Promise<void> {
  // Invalidate all known individual caches
  const knownPairs = [
    "BTC/USDT",
    "ETH/USDT",
    "SOL/USDT",
    "BNB/USDT",
    "XRP/USDT",
    "ADA/USDT",
    "DOGE/USDT",
    "AVAX/USDT",
    "DOT/USDT",
    "XAU/USD",
    "EUR/USD",
    "GBP/USD",
    "USD/JPY",
    "GBP/JPY",
    "AUD/USD",
    "NZD/USD",
    "USD/CAD",
    "USD/CHF",
    "EUR/GBP",
    "EUR/JPY",
  ];

  const knownIntervals = ["1M", "5M", "15M", "30M", "1H", "4H", "1D", "1W"];
  const newsCategories = ["general", "forex", "crypto"];

  const invalidations: Promise<void>[] = [];

  // Prices
  for (const pair of knownPairs) {
    invalidations.push(cache.delete(CACHE_KEYS.price(pair)));
  }

  // Klines
  for (const pair of knownPairs) {
    for (const interval of knownIntervals) {
      invalidations.push(cache.delete(CACHE_KEYS.klines(pair, interval)));
    }
  }

  // News
  for (const category of newsCategories) {
    invalidations.push(cache.delete(CACHE_KEYS.news(category)));
  }

  // Market prices
  invalidations.push(cache.delete(CACHE_KEYS.marketPrices()));

  await Promise.allSettled(invalidations);
  console.log(`[CacheInvalidator] 🧹 Invalidated ALL cache entries (${invalidations.length} keys)`);
}
