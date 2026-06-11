// ============================================================================
// Vixor Price Fetcher — Fetches real-time prices from free APIs
// ============================================================================
//
// Supports:
//   - Crypto pairs (Binance API)
//   - Forex pairs (Exchange rate APIs or Finnhub)
//   - Commodities (Finnhub or fallback)
//
// Used by the alert-checker cron and the dashboard market pulse widget.
//
// Caching: Uses the unified cache layer (Upstash Redis / in-memory fallback)
// for persistent caching across serverless function invocations.
// ============================================================================

import { cache, CACHE_KEYS, CACHE_TTL, getKlinesTtl } from "@/shared/cache";
import { AssetRegistry, POPULAR_PAIRS, TIMEFRAMES } from "@/shared/asset-registry";

export interface PriceResult {
  symbol: string;
  pair: string;
  price: number;
  change24h?: number;
  source: string;
  timestamp: number;
}

/** A single OHLCV bar used in klines data */
export interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Symbol mappings are now centralized in the Asset Registry.
// Use AssetRegistry.binanceSymbol(pair) and AssetRegistry.isCrypto(pair) etc.

// REMOVED: FALLBACK_PRICES — we never fabricate prices. If no real data, return null.

// ── Cache is now handled by the unified cache layer (src/lib/cache.ts) ──
// Price data → cache key: vixor:price:{pair}, TTL: 60s
// Klines data → cache key: vixor:klines:{pair}:{interval}, TTL: 60s/300s

/**
 * Determine if a pair is crypto (Binance) or forex/commodity
 */
/**
 * Determine if a pair is crypto (Binance) or forex/commodity
 * Delegates to Asset Registry for single source of truth.
 */
function isCryptoPair(pair: string): boolean {
  return AssetRegistry.isCrypto(pair);
}

function isForexPair(pair: string): boolean {
  return AssetRegistry.isForex(pair);
}

/**
 * Fetch current price for a crypto pair from Binance
 * With retry logic for better reliability on serverless environments
 */
async function fetchBinancePrice(pair: string): Promise<PriceResult | null> {
  const binanceSymbol = AssetRegistry.binanceSymbol(pair);
  if (!binanceSymbol) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Get current price + 24h stats in one request
      const statsRes = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(12000) },
      );
      if (!statsRes.ok) {
        if (attempt === 0) continue; // Retry once
        return null;
      }
      const statsData = await statsRes.json();
      const price = parseFloat(statsData.lastPrice);
      const change24h = parseFloat(statsData.priceChangePercent);
      if (isNaN(price)) {
        if (attempt === 0) continue;
        return null;
      }

      return {
        symbol: `BINANCE:${binanceSymbol}`,
        pair,
        price,
        change24h: isNaN(change24h) ? undefined : change24h,
        source: "binance",
        timestamp: Date.now(),
      };
    } catch (err) {
      if (attempt === 0) {
        console.warn(
          `[PriceFetcher] Binance fetch retry for ${pair}:`,
          err instanceof Error ? err.message : String(err),
        );
        continue; // Retry once
      }
      console.warn(
        `[PriceFetcher] Binance fetch failed for ${pair}:`,
        err instanceof Error ? err.message : String(err),
      );
      return null;
    }
  }
  return null;
}

/**
 * Fetch current price for a forex pair using TwelveData Exchange Rate API (primary)
 * Also fetches 24h change percentage
 * Falls back to exchangerate-api.com if TwelveData fails
 */
async function fetchForexPrice(pair: string): Promise<PriceResult | null> {
  const asset = AssetRegistry.find(pair);
  if (!asset) return null;
  const forexSymbol = asset.symbols.finnhub || pair.replace("/", "");

  // ── Primary: TwelveData Exchange Rate API (1 credit, most accurate) ──
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { fetchExchangeRate } = await import("@/domains/market/server/twelvedata");
      const result = await fetchExchangeRate(pair);
      if (result && result.rate > 0) {
        // Try to get 24h change from TwelveData time_series (1 credit)
        let change24h: number | undefined;
        try {
          const apiKey = process.env.TWELVEDATA_API_KEY;
          const tdSymbol = AssetRegistry.twelveDataSymbol(pair) || pair;
          if (apiKey) {
            const tsRes = await fetch(
              `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(tdSymbol)}&interval=1day&outputsize=2&apikey=${apiKey}`,
              { signal: AbortSignal.timeout(10000) },
            );
            if (tsRes.ok) {
              const tsData = await tsRes.json();
              if (tsData.values && tsData.values.length >= 2) {
                const currentClose = parseFloat(tsData.values[0].close);
                const prevClose = parseFloat(tsData.values[1].close);
                if (!isNaN(currentClose) && !isNaN(prevClose) && prevClose > 0) {
                  change24h = ((currentClose - prevClose) / prevClose) * 100;
                }
              }
            }
          }
        } catch {
          // Non-fatal — change data is optional
        }

        return {
          symbol: `FX:${forexSymbol}`,
          pair,
          price: result.rate,
          change24h,
          source: "twelvedata",
          timestamp: result.timestamp * 1000,
        };
      }
    } catch {
      if (attempt === 0) continue; // Retry once
    }
  }

  // ── Fallback: ExchangeRate API ──
  try {
    const base = asset.base;
    const quote = asset.quote;
    const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok) {
      const data = await res.json();
      const rate = data.rates?.[quote];
      if (rate) {
        return {
          symbol: `FX:${forexSymbol}`,
          pair,
          price: parseFloat(rate),
          source: "exchangerate-api",
          timestamp: Date.now(),
        };
      }
    }
  } catch {
    // Non-fatal
  }

  return null;
}

/**
 * Fetch current price for XAU/USD (Gold) — TwelveData primary with retry
 */
async function fetchGoldPrice(): Promise<PriceResult | null> {
  // ── Primary: TwelveData Exchange Rate API ──
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { fetchExchangeRate } = await import("@/domains/market/server/twelvedata");
      const result = await fetchExchangeRate("XAU/USD");
      if (result && result.rate > 0) {
        // Try to get 24h change
        let change24h: number | undefined;
        try {
          const apiKey = process.env.TWELVEDATA_API_KEY;
          if (apiKey) {
            const tsRes = await fetch(
              `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=2&apikey=${apiKey}`,
              { signal: AbortSignal.timeout(10000) },
            );
            if (tsRes.ok) {
              const tsData = await tsRes.json();
              if (tsData.values && tsData.values.length >= 2) {
                const currentClose = parseFloat(tsData.values[0].close);
                const prevClose = parseFloat(tsData.values[1].close);
                if (!isNaN(currentClose) && !isNaN(prevClose) && prevClose > 0) {
                  change24h = ((currentClose - prevClose) / prevClose) * 100;
                }
              }
            }
          }
        } catch {
          // Non-fatal
        }

        return {
          symbol: "OANDA:XAUUSD",
          pair: "XAU/USD",
          price: result.rate,
          change24h,
          source: "twelvedata",
          timestamp: result.timestamp * 1000,
        };
      }
    } catch {
      if (attempt === 0) continue; // Retry
    }
  }

  return null;
}

/**
 * Get a cached price for a pair, or return null if no cache exists.
 * Uses the unified cache layer (Redis / in-memory).
 */
async function getCachedPrice(pair: string): Promise<PriceResult | null> {
  try {
    const cached = await cache.get<{ price: number; change24h: number; timestamp: number }>(
      CACHE_KEYS.price(pair),
    );
    if (!cached) return null;

    const ageMs = Date.now() - cached.timestamp;
    const ageMinutes = Math.floor(ageMs / 60000);
    const ageHours = Math.floor(ageMinutes / 60);
    const ageDesc = ageHours > 0 ? `${ageHours}h ${ageMinutes % 60}m ago` : `${ageMinutes}m ago`;

    console.log(`[PriceFetcher] Using cached price for ${pair} (last real price ${ageDesc})`);

    return {
      symbol: pair.includes("USDT")
        ? `BINANCE:${pair.replace("/", "")}`
        : `FX:${pair.replace("/", "")}`,
      pair,
      price: cached.price,
      change24h: cached.change24h,
      source: `cache (${ageDesc})`,
      timestamp: cached.timestamp,
    };
  } catch (err) {
    console.warn(
      `[PriceFetcher] Cache read failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Store a successfully fetched price in the cache.
 * Uses the unified cache layer (Redis / in-memory) with 60s TTL.
 */
async function cachePrice(pair: string, price: number, change24h: number): Promise<void> {
  try {
    await cache.set(
      CACHE_KEYS.price(pair),
      { price, change24h: change24h ?? 0, timestamp: Date.now() },
      CACHE_TTL.PRICE,
    );
  } catch (err) {
    console.warn(
      `[PriceFetcher] Cache write failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
  }
}

/**
 * When APIs are unavailable AND no cache exists, return null.
 * NEVER fabricate prices. UI should show "—" or "Price unavailable" instead.
 */
function getEstimatedFallbackPrice(pair: string): PriceResult | null {
  console.warn(
    `[PriceFetcher] ⚠️ No real price available for ${pair}. Returning null — UI should show unavailable state.`,
  );
  return null;
}

/**
 * Fetch price from Twelve Data batch quote endpoint.
 * Supports all pairs (crypto, forex, commodities).
 * Returns null if the API key is not configured or the call fails.
 */
async function fetchTwelveDataQuote(pair: string): Promise<PriceResult | null> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) {
    console.warn(`[PriceFetcher] Twelve Data quote: no API key configured`);
    return null;
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(pair)}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(10000) },
    );
    if (!res.ok) {
      console.warn(`[PriceFetcher] Twelve Data quote API returned ${res.status} for ${pair}`);
      return null;
    }

    const data = await res.json();
    if (data.status === "error") {
      console.warn(`[PriceFetcher] Twelve Data quote error for ${pair}: ${data.message}`);
      return null;
    }

    const price = parseFloat(data.close);
    if (isNaN(price) || price <= 0) {
      console.warn(`[PriceFetcher] Twelve Data quote: invalid price for ${pair}: ${data.close}`);
      return null;
    }

    const change24h = parseFloat(data.percent_change);
    const symbol = data.symbol || pair;

    return {
      symbol,
      pair,
      price,
      change24h: isNaN(change24h) ? undefined : change24h,
      source: "twelvedata-quote",
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn(
      `[PriceFetcher] Twelve Data quote fetch failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Main entry point: fetch the current price for a given pair.
 * Tries real APIs first, then cached price, then estimated fallback.
 */
export async function fetchPrice(pair: string): Promise<PriceResult | null> {
  // Special case for Gold
  if (pair === "XAU/USD") {
    const result = await fetchGoldPrice();
    if (result) {
      await cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      await cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = await getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Crypto pairs
  if (isCryptoPair(pair)) {
    const result = await fetchBinancePrice(pair);
    if (result) {
      await cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source (supports crypto too)
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      await cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = await getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Forex pairs
  if (isForexPair(pair)) {
    const result = await fetchForexPrice(pair);
    if (result) {
      await cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      await cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = await getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Unknown pair — try Twelve Data quote anyway
  const tdResult = await fetchTwelveDataQuote(pair);
  if (tdResult) {
    await cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
    return tdResult;
  }
  const cached = await getCachedPrice(pair);
  if (cached) return cached;
  return getEstimatedFallbackPrice(pair);
}

/**
 * Fetch prices for multiple pairs in parallel.
 */
export async function fetchPrices(pairs: string[]): Promise<PriceResult[]> {
  const results = await Promise.allSettled(pairs.map(fetchPrice));
  return results
    .filter((r): r is PromiseFulfilledResult<PriceResult | null> => r.status === "fulfilled")
    .map((r) => r.value)
    .filter((v): v is PriceResult => v !== null);
}

/**
 * Fetch OHLCV candle data from Binance for crypto pairs.
 * Returns array of [openTime, open, high, low, close, volume]
 * Results are cached with the unified cache layer (Redis / in-memory).
 */
export async function fetchBinanceKlines(
  pair: string,
  interval: string = "1h",
  limit: number = 200,
): Promise<
  Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
> {
  const binanceSymbol = AssetRegistry.binanceSymbol(pair);
  if (!binanceSymbol) return [];

  // Map timeframe strings to Binance interval format using the registry
  const tf = TIMEFRAMES.find((t) => t.key === interval);
  const binanceInterval = tf?.binanceInterval || "1h";

  // ── Check cache first ──
  const ttlMs = getKlinesTtl(interval);
  try {
    const cached = await cache.get<KlineBar[]>(CACHE_KEYS.klines(pair, interval));
    if (cached && cached.length > 0) {
      console.log(
        `[PriceFetcher] Using cached Binance klines for ${pair}:${interval} (${cached.length} bars)`,
      );
      return cached.slice(-limit);
    }
  } catch {
    // Cache read failed — proceed to API
  }

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const result = data.map((k: unknown[]) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));

    // Store in cache
    if (result.length > 0) {
      try {
        await cache.set(CACHE_KEYS.klines(pair, interval), result, ttlMs);
      } catch {
        // Non-fatal — cache write failure shouldn't block
      }
    }

    return result;
  } catch (err) {
    console.warn(
      `[PriceFetcher] Binance klines fetch failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * Popular pairs for quick access — re-exported from Asset Registry
 * (Kept as export for backward compatibility)
 */
export { POPULAR_PAIRS } from "@/shared/asset-registry";

/**
 * Fetch OHLCV candle data from TwelveData API for forex/commodity pairs.
 * Returns array of OHLCV bars with time, open, high, low, close, volume.
 * Results are cached with the unified cache layer (Redis / in-memory).
 */
export async function fetchTwelveDataKlines(
  pair: string,
  interval: string = "1h",
  outputsize: number = 200,
): Promise<
  Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>
> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return [];

  // Symbol mapping now handled by Asset Registry
  const symbol = AssetRegistry.twelveDataSymbol(pair);
  if (!symbol) return [];

  // Map timeframe to TwelveData interval using the registry
  const tf = TIMEFRAMES.find((t) => t.key === interval);
  const tdInterval = tf?.twelveDataInterval || "1h";

  // ── Check cache first ──
  const ttlMs = getKlinesTtl(interval);
  try {
    const cached = await cache.get<KlineBar[]>(CACHE_KEYS.klines(pair, interval));
    if (cached && cached.length > 0) {
      console.log(
        `[PriceFetcher] Using cached TwelveData klines for ${pair}:${interval} (${cached.length} bars)`,
      );
      return cached.slice(-outputsize);
    }
  } catch {
    // Cache read failed — proceed to API
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(15000) },
    );
    if (!res.ok) {
      console.warn(
        `[PriceFetcher] TwelveData klines API returned ${res.status} for ${pair}/${interval}`,
      );
      return [];
    }

    const data = await res.json();
    if (data.status === "error") {
      console.warn(`[PriceFetcher] TwelveData klines error for ${pair}: ${data.message}`);
      return [];
    }
    if (!data.values || !Array.isArray(data.values)) {
      console.warn(`[PriceFetcher] TwelveData klines: no values array for ${pair}/${interval}`);
      return [];
    }

    const result = data.values
      .filter((v: any) => v.open && v.high && v.low && v.close)
      .map((v: any) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: parseFloat(v.open),
        high: parseFloat(v.high),
        low: parseFloat(v.low),
        close: parseFloat(v.close),
        volume: parseFloat(v.volume || "0"),
      }))
      .reverse(); // TwelveData returns newest first, we need oldest first

    // Store in cache
    if (result.length > 0) {
      try {
        await cache.set(CACHE_KEYS.klines(pair, interval), result, ttlMs);
      } catch {
        // Non-fatal — cache write failure shouldn't block
      }
    }

    return result;
  } catch (err) {
    console.warn(
      `[PriceFetcher] TwelveData klines fetch failed for ${pair}:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}
