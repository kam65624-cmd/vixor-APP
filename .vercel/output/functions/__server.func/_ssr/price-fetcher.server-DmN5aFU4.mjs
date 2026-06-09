const BINANCE_SYMBOLS = {
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
  "DOT/USDT": "DOTUSDT"
};
const FOREX_SYMBOLS = {
  "EUR/USD": "EURUSD",
  "GBP/USD": "GBPUSD",
  "USD/JPY": "USDJPY",
  "GBP/JPY": "GBPJPY",
  "AUD/USD": "AUDUSD",
  "NZD/USD": "NZDUSD",
  "USD/CAD": "USDCAD",
  "USD/CHF": "USDCHF",
  "EUR/GBP": "EURGBP",
  "EUR/JPY": "EURJPY"
};
const FALLBACK_PRICES = {
  "BTC/USDT": { price: 68e3, volatility: 0.03 },
  "ETH/USDT": { price: 3700, volatility: 0.028 },
  "SOL/USDT": { price: 170, volatility: 0.04 },
  "XAU/USD": { price: 2340, volatility: 0.012 },
  "EUR/USD": { price: 1.085, volatility: 5e-3 },
  "GBP/USD": { price: 1.27, volatility: 6e-3 },
  "USD/JPY": { price: 157.5, volatility: 7e-3 },
  "GBP/JPY": { price: 200.3, volatility: 8e-3 },
  "AUD/USD": { price: 0.665, volatility: 6e-3 },
  "NZD/USD": { price: 0.615, volatility: 7e-3 },
  "USD/CAD": { price: 1.37, volatility: 5e-3 },
  "USD/CHF": { price: 0.89, volatility: 5e-3 }
};
function isCryptoPair(pair) {
  return pair in BINANCE_SYMBOLS || pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL");
}
function isForexPair(pair) {
  return pair in FOREX_SYMBOLS;
}
async function fetchBinancePrice(pair) {
  const binanceSymbol = BINANCE_SYMBOLS[pair];
  if (!binanceSymbol) return null;
  try {
    const priceRes = await fetch(
      `https://api.binance.com/api/v3/ticker/price?symbol=${binanceSymbol}`,
      { signal: AbortSignal.timeout(8e3) }
    );
    if (!priceRes.ok) return null;
    const priceData = await priceRes.json();
    const price = parseFloat(priceData.price);
    if (isNaN(price)) return null;
    let change24h;
    try {
      const statsRes = await fetch(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSymbol}`,
        { signal: AbortSignal.timeout(8e3) }
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        change24h = parseFloat(statsData.priceChangePercent);
      }
    } catch {
    }
    return {
      symbol: `BINANCE:${binanceSymbol}`,
      pair,
      price,
      change24h,
      source: "binance",
      timestamp: Date.now()
    };
  } catch (err) {
    console.warn(`[PriceFetcher] Binance fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return null;
  }
}
async function fetchForexPrice(pair) {
  const forexSymbol = FOREX_SYMBOLS[pair];
  if (!forexSymbol) return null;
  try {
    const { fetchExchangeRate } = await import("./twelvedata.server-CsSmrfI3.mjs");
    const result = await fetchExchangeRate(pair);
    if (result && result.rate > 0) {
      return {
        symbol: `FX:${forexSymbol}`,
        pair,
        price: result.rate,
        source: "twelvedata",
        timestamp: result.timestamp * 1e3
      };
    }
  } catch {
  }
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/forex/rates?base=${forexSymbol.slice(0, 3)}&token=${finnhubKey}`,
        { signal: AbortSignal.timeout(8e3) }
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
            timestamp: Date.now()
          };
        }
      }
    } catch {
    }
  }
  try {
    const base = forexSymbol.slice(0, 3);
    const quote = forexSymbol.slice(3);
    const res = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${base}`,
      { signal: AbortSignal.timeout(8e3) }
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
          timestamp: Date.now()
        };
      }
    }
  } catch {
  }
  return null;
}
async function fetchGoldPrice() {
  try {
    const { fetchExchangeRate } = await import("./twelvedata.server-CsSmrfI3.mjs");
    const result = await fetchExchangeRate("XAU/USD");
    if (result && result.rate > 0) {
      return {
        symbol: "OANDA:XAUUSD",
        pair: "XAU/USD",
        price: result.rate,
        source: "twelvedata",
        timestamp: result.timestamp * 1e3
      };
    }
  } catch {
  }
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const res = await fetch(
        `https://finnhub.io/api/v1/quote?symbol=OANDA:XAU_USD&token=${finnhubKey}`,
        { signal: AbortSignal.timeout(8e3) }
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
            timestamp: Date.now()
          };
        }
      }
    } catch {
    }
  }
  return null;
}
function getFallbackPrice(pair) {
  const config = FALLBACK_PRICES[pair];
  const basePrice = config?.price ?? 100;
  const vol = config?.volatility ?? 0.02;
  const now = /* @__PURE__ */ new Date();
  const timeSeed = now.getHours() * 60 + now.getMinutes();
  const variation = Math.sin(timeSeed * 0.1) * vol * basePrice;
  const price = basePrice + variation;
  return {
    symbol: pair.includes("USDT") ? `BINANCE:${pair.replace("/", "")}` : `FX:${pair.replace("/", "")}`,
    pair,
    price: Number(price.toFixed(pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT") || pair.includes("USD") ? 2 : 4)),
    change24h: Number((Math.sin(timeSeed * 0.05) * 2).toFixed(2)),
    source: "fallback",
    timestamp: Date.now()
  };
}
async function fetchPrice(pair) {
  if (pair === "XAU/USD") {
    const result = await fetchGoldPrice();
    if (result) return result;
    return getFallbackPrice(pair);
  }
  if (isCryptoPair(pair)) {
    const result = await fetchBinancePrice(pair);
    if (result) return result;
    return getFallbackPrice(pair);
  }
  if (isForexPair(pair)) {
    const result = await fetchForexPrice(pair);
    if (result) return result;
    return getFallbackPrice(pair);
  }
  return getFallbackPrice(pair);
}
async function fetchPrices(pairs) {
  const results = await Promise.allSettled(pairs.map(fetchPrice));
  return results.filter((r) => r.status === "fulfilled").map((r) => r.value);
}
async function fetchBinanceKlines(pair, interval = "1h", limit = 200) {
  const binanceSymbol = BINANCE_SYMBOLS[pair];
  if (!binanceSymbol) return [];
  const intervalMap = {
    "1M": "1m",
    "5M": "5m",
    "15M": "15m",
    "30M": "30m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w"
  };
  const binanceInterval = intervalMap[interval] || "1h";
  try {
    const res = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=${binanceInterval}&limit=${limit}`,
      { signal: AbortSignal.timeout(15e3) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((k) => ({
      time: Math.floor(Number(k[0]) / 1e3),
      open: parseFloat(String(k[1])),
      high: parseFloat(String(k[2])),
      low: parseFloat(String(k[3])),
      close: parseFloat(String(k[4])),
      volume: parseFloat(String(k[5]))
    }));
  } catch (err) {
    console.warn(`[PriceFetcher] Binance klines fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}
const POPULAR_PAIRS = [
  { pair: "BTC/USDT", icon: "₿" },
  { pair: "ETH/USDT", icon: "Ξ" },
  { pair: "XAU/USD", icon: "Au" },
  { pair: "EUR/USD", icon: "€" },
  { pair: "GBP/JPY", icon: "£" },
  { pair: "SOL/USDT", icon: "◎" }
];
async function fetchTwelveDataKlines(pair, interval = "1h", outputsize = 200) {
  const apiKey = process.env.TWELVEDATA_API_KEY;
  if (!apiKey) return [];
  const symbolMap = {
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
    "EUR/JPY": "EUR/JPY"
  };
  const symbol = symbolMap[pair];
  if (!symbol) return [];
  const intervalMap = {
    "1M": "1min",
    "5M": "5min",
    "15M": "15min",
    "30M": "30min",
    "1H": "1h",
    "4H": "4h",
    "1D": "1day",
    "1W": "1week"
  };
  const tdInterval = intervalMap[interval] || "1h";
  try {
    const res = await fetch(
      `https://api.twelvedata.com/time_series?symbol=${encodeURIComponent(symbol)}&interval=${tdInterval}&outputsize=${outputsize}&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(15e3) }
    );
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.values || !Array.isArray(data.values)) return [];
    return data.values.filter((v) => v.open && v.high && v.low && v.close).map((v) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1e3),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseFloat(v.volume || "0")
    })).reverse();
  } catch (err) {
    console.warn(`[PriceFetcher] TwelveData fetch failed for ${pair}:`, err instanceof Error ? err.message : String(err));
    return [];
  }
}
export {
  POPULAR_PAIRS,
  fetchBinanceKlines,
  fetchPrice,
  fetchPrices,
  fetchTwelveDataKlines
};
