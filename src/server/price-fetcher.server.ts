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

// Known price ranges for fallback
const FALLBACK_PRICES: Record<string, { price: number; volatility: number }> = {
  "BTC/USDT": { price: 68000, volatility: 0.03 },
  "ETH/USDT": { price: 3700, volatility: 0.028 },
  "SOL/USDT": { price: 170, volatility: 0.04 },
  "XAU/USD": { price: 2340, volatility: 0.012 },
  "EUR/USD": { price: 1.085, volatility: 0.005 },
  "GBP/USD": { price: 1.27, volatility: 0.006 },
  "USD/JPY": { price: 157.5, volatility: 0.007 },
  "GBP/JPY": { price: 200.3, volatility: 0.008 },
  "AUD/USD": { price: 0.665, volatility: 0.006 },
  "NZD/USD": { price: 0.615, volatility: 0.007 },
  "USD/CAD": { price: 1.37, volatility: 0.005 },
  "USD/CHF": { price: 0.89, volatility: 0.005 },
};

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
 */
async function fetchBinancePrice(pair: string): Promise<PriceResult | null> {
  const binanceSymbol = BINANCE_SYMBOLS[pair];
  if (!binanceSymbol) return null;

  try {
    // Get current price
    const priceRes = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!priceRes.ok) return null;
    const priceData = await priceRes.json();
    const price = parseFloat(priceData.price);
    if (isNaN(price)) return null;

    // Get 24h change
    let change24h: number | undefined;
    try {
      const statsRes = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        change24h = parseFloat(statsData.priceChangePercent);
      }
    } catch {
      // Non-fatal
    }

    return {
      symbol: `BINANCE:${binanceSymbol}`,
      pair,
      price,
      change24h,
      source: "binance",
      timestamp: Date.now(),
    };
  } catch (err) {
    console.warn(`[PriceFetcher] Binance fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Fetch current price for a forex pair from free APIs
 */
async function fetchForexPrice(pair: string): Promise<PriceResult | null> {
  const forexSymbol = FOREX_SYMBOLS[pair];
  if (!forexSymbol) return null;

  // Try Finnhub first (if API key available)
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/forex/rates?base=${forexSymbol.slice(0, 3)}&token=${finnhubKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        const quote = data.quote?.[forexSymbol.slice(3)];
        if (quote) {
          return {
            symbol: `FX:${forexSymbol}`,
            pair,
            price: parseFloat(quote),
            source: "finnhub",
            timestamp: Date.now(),
          };
        }
      }
    } catch {
      // Non-fatal, try fallback
    }
  }

  // Try exchange rate API as fallback
  try {
    const base = forexSymbol.slice(0, 3);
    const quote = forexSymbol.slice(3);
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { signal: AbortSignal.timeout(8000) }
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
 * Fetch current price for XAU/USD (Gold)
 */
async function fetchGoldPrice(): Promise<PriceResult | null> {
  // Try Finnhub for commodity
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=OANDA:XAU_USD&token=${finnhubKey}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.c && data.c > 0) {
          return {
            symbol: "OANDA:XAUUSD",
            pair: "XAU/USD",
            price: data.c,
            change24h: data.dp,
            source: "finnhub",
            timestamp: Date.now(),
          };
        }
      }
    } catch {
      // Non-fatal
    }
  }

  return null;
}

/**
 * Generate a deterministic fallback price for when APIs are unavailable
 */
function getFallbackPrice(pair: string): PriceResult {
  const config = FALLBACK_PRICES[pair];
  const basePrice = config?.price ?? 100;
  const vol = config?.volatility ?? 0.02;
  
  // Deterministic "current" price based on time of day
  const now = new Date();
  const timeSeed = now.getHours() * 60 + now.getMinutes();
  const variation = Math.sin(timeSeed * 0.1) * vol * basePrice;
  const price = basePrice + variation;

  return {
    symbol: pair.includes("USDT") ? `BINANCE:${pair.replace("/", "")}` : `FX:${pair.replace("/", "")}`,
    pair,
    price: Number(price.toFixed(pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT") || pair.includes("USD") ? 2 : 4)),
    change24h: Number((Math.sin(timeSeed * 0.05) * 2).toFixed(2)),
    source: "fallback",
    timestamp: Date.now(),
  };
}

/**
 * Main entry point: fetch the current price for a given pair.
 * Tries real APIs first, falls back to deterministic prices.
 */
export async function fetchPrice(pair: string): Promise<PriceResult> {
  // Special case for Gold
  if (pair === "XAU/USD") {
    const result = await fetchGoldPrice();
    if (result) return result;
    return getFallbackPrice(pair);
  }

  // Crypto pairs
  if (isCryptoPair(pair)) {
    const result = await fetchBinancePrice(pair);
    if (result) return result;
    return getFallbackPrice(pair);
  }

  // Forex pairs
  if (isForexPair(pair)) {
    const result = await fetchForexPrice(pair);
    if (result) return result;
    return getFallbackPrice(pair);
  }

  // Unknown pair, use fallback
  return getFallbackPrice(pair);
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
