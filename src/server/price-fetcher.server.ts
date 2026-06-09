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
// ============================================================================

export interface PriceResult {
  symbol: string;
  pair: string;
  price: number;
  change24h?: number;
  source: string;
  timestamp: number;
}

// Map user-friendly pair names to Binance symbols
const BINANCE_SYMBOLS: Record<string, string> = {
  "BTC/USDT": "BTCUSDT",
  "ETH/USDT": "ETHUSDT",
  "SOL/USDT": "SOLUSDT",
  "BTC/USD": "BTCUSDT",
  "ETH/USD": "ETHUSDT",
  "SOL/USD": "SOLUSDT",
  "BNB/USDT": "BNBUSDT",
  "XRP/USDT": "XRPUSDT",
  "ADA/USDT": "ADAUSDT",
  "DOGE/USDT": "DOGEUSDT",
  "AVAX/USDT": "AVAXUSDT",
  "DOT/USDT": "DOTUSDT",
};

// Forex pair to Finnhub symbol mapping
const FOREX_SYMBOLS: Record<string, string> = {
  "EUR/USD": "EURUSD",
  "GBP/USD": "GBPUSD",
  "USD/JPY": "USDJPY",
  "GBP/JPY": "GBPJPY",
  "AUD/USD": "AUDUSD",
  "NZD/USD": "NZDUSD",
  "USD/CAD": "USDCAD",
  "USD/CHF": "USDCHF",
  "EUR/GBP": "EURGBP",
  "EUR/JPY": "EURJPY",
};

// Known price ranges for ESTIMATED fallback (only used when no cache exists)
const FALLBACK_PRICES: Record<string, { price: number; volatility: number }> = {
  "BTC/USDT": { price: 105000, volatility: 0.03 },
  "ETH/USDT": { price: 2600, volatility: 0.028 },
  "SOL/USDT": { price: 170, volatility: 0.04 },
  "XAU/USD": { price: 3300, volatility: 0.012 },
  "EUR/USD": { price: 1.13, volatility: 0.005 },
  "GBP/USD": { price: 1.34, volatility: 0.006 },
  "USD/JPY": { price: 145, volatility: 0.007 },
  "GBP/JPY": { price: 195, volatility: 0.008 },
  "AUD/USD": { price: 0.665, volatility: 0.006 },
  "NZD/USD": { price: 0.615, volatility: 0.007 },
  "USD/CAD": { price: 1.37, volatility: 0.005 },
  "USD/CHF": { price: 0.89, volatility: 0.005 },
};

// ── Price Cache: stores last successfully fetched price for each pair ──
const priceCache = new Map<string, { price: number; change24h: number; timestamp: number }>();

// ── Klines Cache: stores fetched kline data with TTL ──
const klinesCache = new Map<string, { data: Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>; timestamp: number }>();

/**
 * Determine if a pair is crypto (Binance) or forex/commodity
 */
function isCryptoPair(pair: string): boolean {
  return pair in BINANCE_SYMBOLS || pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL");
}

function isForexPair(pair: string): boolean {
  return pair in FOREX_SYMBOLS;
}

/**
 * Fetch current price for a crypto pair from Binance
 * With retry logic for better reliability on serverless environments
 */
async function fetchBinancePrice(pair: string): Promise<PriceResult | null> {
  const binanceSymbol = BINANCE_SYMBOLS[pair];
  if (!binanceSymbol) return null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // Get current price + 24h stats in one request
      const statsRes = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(12000) }
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
        console.warn(`[PriceFetcher] Binance fetch retry for ${pair}:`, err instanceof Error ? err.message : String(err));
        continue; // Retry once
      }
      console.warn(`[PriceFetcher] Binance fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
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
  const forexSymbol = FOREX_SYMBOLS[pair];
  if (!forexSymbol) return null;

  // ── Primary: TwelveData Exchange Rate API (1 credit, most accurate) ──
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const { fetchExchangeRate } = await import("@/server/twelvedata.server");
      const result = await fetchExchangeRate(pair);
      if (result && result.rate > 0) {
        // Try to get 24h change from TwelveData time_series (1 credit)
        let change24h: number | undefined;
        try {
          const apiKey = process.env.TWELVEDATA_API_KEY;
          if (apiKey) {
            const tsRes = await fetch(
              `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(pair)}&interval=1day&outputsize=2&apikey=${apiKey}`,
              { signal: AbortSignal.timeout(10000) }
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
    const base = forexSymbol.slice(0, 3);
    const quote = forexSymbol.slice(3);
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { signal: AbortSignal.timeout(10000) }
    );
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
      const { fetchExchangeRate } = await import("@/server/twelvedata.server");
      const result = await fetchExchangeRate("XAU/USD");
      if (result && result.rate > 0) {
        // Try to get 24h change
        let change24h: number | undefined;
        try {
          const apiKey = process.env.TWELVEDATA_API_KEY;
          if (apiKey) {
            const tsRes = await fetch(
              `https://api.twelvedata.com/time_series?symbol=XAU/USD&interval=1day&outputsize=2&apikey=${apiKey}`,
              { signal: AbortSignal.timeout(10000) }
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
 * Cache is populated whenever a real API call succeeds.
 */
function getCachedPrice(pair: string): PriceResult | null {
  const cached = priceCache.get(pair);
  if (!cached) return null;

  const ageMs = Date.now() - cached.timestamp;
  const ageMinutes = Math.floor(ageMs / 60000);
  const ageHours = Math.floor(ageMinutes / 60);
  const ageDesc = ageHours > 0 ? `${ageHours}h ${ageMinutes % 60}m ago` : `${ageMinutes}m ago`;

  console.log(`[PriceFetcher] Using cached price for ${pair} (last real price ${ageDesc})`);

  return {
    symbol: pair.includes("USDT") ? `BINANCE:${pair.replace("/", "")}` : `FX:${pair.replace("/", "")}`,
    pair,
    price: cached.price,
    change24h: cached.change24h,
    source: `cache (${ageDesc})`,
    timestamp: cached.timestamp,
  };
}

/**
 * Store a successfully fetched price in the cache.
 */
function cachePrice(pair: string, price: number, change24h: number): void {
  priceCache.set(pair, { price, change24h: change24h ?? 0, timestamp: Date.now() });
}

/**
 * Generate a deterministic ESTIMATED fallback price for when APIs are unavailable AND no cache exists.
 * This is clearly marked as ESTIMATED so users know the price is not real.
 */
function getEstimatedFallbackPrice(pair: string): PriceResult {
  const config = FALLBACK_PRICES[pair];
  const basePrice = config?.price ?? 100;

  console.warn(`[PriceFetcher] ⚠️ No real price available for ${pair}. Returning ESTIMATED fallback price. This should be investigated.`);

  return {
    symbol: pair.includes("USDT") ? `BINANCE:${pair.replace("/", "")}` : `FX:${pair.replace("/", "")}`,
    pair,
    price: basePrice,
    change24h: 0,
    source: "ESTIMATED — no real data available",
    timestamp: Date.now(),
  };
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
      { signal: AbortSignal.timeout(10000) }
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
    console.warn(`[PriceFetcher] Twelve Data quote fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Main entry point: fetch the current price for a given pair.
 * Tries real APIs first, then cached price, then estimated fallback.
 */
export async function fetchPrice(pair: string): Promise<PriceResult> {
  // Special case for Gold
  if (pair === "XAU/USD") {
    const result = await fetchGoldPrice();
    if (result) {
      cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Crypto pairs
  if (isCryptoPair(pair)) {
    const result = await fetchBinancePrice(pair);
    if (result) {
      cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source (supports crypto too)
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Forex pairs
  if (isForexPair(pair)) {
    const result = await fetchForexPrice(pair);
    if (result) {
      cachePrice(pair, result.price, result.change24h ?? 0);
      return result;
    }
    // Try Twelve Data quote as additional source
    const tdResult = await fetchTwelveDataQuote(pair);
    if (tdResult) {
      cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
      return tdResult;
    }
    // Try cached price
    const cached = getCachedPrice(pair);
    if (cached) return cached;
    // Last resort: estimated fallback
    return getEstimatedFallbackPrice(pair);
  }

  // Unknown pair — try Twelve Data quote anyway
  const tdResult = await fetchTwelveDataQuote(pair);
  if (tdResult) {
    cachePrice(pair, tdResult.price, tdResult.change24h ?? 0);
    return tdResult;
  }
  const cached = getCachedPrice(pair);
  if (cached) return cached;
  return getEstimatedFallbackPrice(pair);
}

/**
 * Fetch prices for multiple pairs in parallel.
 */
export async function fetchPrices(pairs: string[]): Promise<PriceResult[]> {
  const results = await Promise.allSettled(pairs.map(fetchPrice));
  return results
    .filter((r): r is PromiseFulfilledResult<PriceResult> => r.status === "fulfilled")
    .map(r => r.value);
}

/**
 * Fetch OHLCV candle data from Binance for crypto pairs.
 * Returns array of [openTime, open, high, low, close, volume]
 */
export async function fetchBinanceKlines(
  pair: string,
  interval: string = "1h",
  limit: number = 200,
): Promise<Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>> {
  const binanceSymbol = BINANCE_SYMBOLS[pair];
  if (!binanceSymbol) return [];

  // Map timeframe strings to Binance interval format
  const intervalMap: Record<string, string> = {
    "1M": "1m",
    "5M": "5m",
    "15M": "15m",
    "30M": "30m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w",
  };
  const binanceInterval = intervalMap[interval] || "1h";

  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((k: unknown[]) => ({
      time: Math.floor(Number(k[0]) / 1000),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5])),
    }));
  } catch (err) {
    console.warn(`[PriceFetcher] Binance klines fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Popular pairs for quick access
 */
export const POPULAR_PAIRS = [
  { pair: "BTC/USDT", icon: "₿" },
  { pair: "ETH/USDT", icon: "Ξ" },
  { pair: "XAU/USD", icon: "Au" },
  { pair: "EUR/USD", icon: "€" },
  { pair: "GBP/JPY", icon: "£" },
  { pair: "SOL/USDT", icon: "◎" },
];

/**
 * Fetch OHLCV candle data from TwelveData API for forex/commodity pairs.
 * Returns array of OHLCV bars with time, open, high, low, close, volume.
 * Results are cached in-memory with TTL to prevent redundant API calls.
 */
export async function fetchTwelveDataKlines(
  pair: string,
  interval: string = "1h",
  outputsize: number = 200,
): Promise<Array<{ time: number; open: number; high: number; low: number; close: number; volume: number }>> {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return [];

  // Map pair to TwelveData symbol format
  const symbolMap: Record<string, string> = {
    "XAU/USD": "XAU/USD",
    "EUR/USD": "EUR/USD",
    "GBP/USD": "GBP/USD",
    "USD/JPY": "USD/JPY",
    "GBP/JPY": "GBP/JPY",
    "AUD/USD": "AUD/USD",
    "NZD/USD": "NZD/USD",
    "USD/CAD": "USD/CAD",
    "USD/CHF": "USD/CHF",
    "EUR/GBP": "EUR/GBP",
    "EUR/JPY": "EUR/JPY",
  };

  const symbol = symbolMap[pair];
  if (!symbol) return [];

  // Map timeframe to TwelveData interval
  const intervalMap: Record<string, string> = {
    "1M": "1min",
    "5M": "5min",
    "15M": "15min",
    "30M": "30min",
    "1H": "1h",
    "4H": "4h",
    "1D": "1day",
    "1W": "1week",
  };
  const tdInterval = intervalMap[interval] || "1h";

  // ── Check cache first ──
  const cacheKey = `${pair}:${interval}`;
  const cached = klinesCache.get(cacheKey);
  // TTL: 60s for timeframes <= 1H, 300s for 4H+
  const ttlMs = (interval === "4H" || interval === "1D" || interval === "1W") ? 300_000 : 60_000;
  if (cached && (Date.now() - cached.timestamp) < ttlMs) {
    console.log(`[PriceFetcher] Using cached klines for ${cacheKey} (age: ${Math.floor((Date.now() - cached.timestamp) / 1000)}s)`);
    // Return cached data, possibly sliced to requested outputsize
    return cached.data.slice(-outputsize);
  }

  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(15000) }
    );
    if (!res.ok) {
      console.warn(`[PriceFetcher] TwelveData klines API returned ${res.status} for ${pair}/${interval}`);
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
      klinesCache.set(cacheKey, { data: result, timestamp: Date.now() });
    }

    return result;
  } catch (err) {
    console.warn(`[PriceFetcher] TwelveData klines fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}
