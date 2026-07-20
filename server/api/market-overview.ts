/**
 * @module server/api/market-overview
 * @description GET endpoint for top crypto market data.
 * Returns BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX prices.
 * Primary: Binance API → Fallback: CoinGecko API.
 * No authentication required — public endpoint.
 */

import { defineEventHandler } from "h3";
import { cache, CACHE_TTL } from "@/shared/cache";
import { withRateLimit } from "../utils/with-rate-limit";
import { handlePreflight } from "./_security";

const CACHE_KEY = "market-overview";

const FALLBACK_STATS = {
  totalVolume: 0,
  btcPrice: 0,
  btcChange: 0,
  solPrice: 0,
  solChange: 0,
  ethPrice: 0,
  ethChange: 0,
  marketSentiment: "neutral" as const,
};

// ── Binance fetch ──────────────────────────────────────────────────────
async function fetchFromBinance() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  const response = await fetch(
    "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22XRPUSDT%22,%22DOGEUSDT%22,%22ADAUSDT%22,%22AVAXUSDT%22%5D",
    { signal: controller.signal, headers: { Accept: "application/json" } },
  );
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`Binance HTTP ${response.status}`);

  interface BinanceTicker {
    symbol: string;
    lastPrice: string;
    priceChangePercent: string;
    quoteVolume: string;
    highPrice: string;
    lowPrice: string;
  }

  const tickers = (await response.json()) as BinanceTicker[];

  const tokens = tickers.map((t) => ({
    symbol: t.symbol.replace("USDT", ""),
    price: parseFloat(t.lastPrice),
    change24h: parseFloat(t.priceChangePercent),
    volume24h: parseFloat(t.quoteVolume),
    high24h: parseFloat(t.highPrice),
    low24h: parseFloat(t.lowPrice),
  }));

  tokens.sort((a, b) => b.volume24h - a.volume24h);

  const totalVolume = tokens.reduce((s, t) => s + t.volume24h, 0);
  const btc = tokens.find((t) => t.symbol === "BTC");
  const sol = tokens.find((t) => t.symbol === "SOL");
  const eth = tokens.find((t) => t.symbol === "ETH");

  return {
    success: true as const,
    tokens,
    stats: {
      ...FALLBACK_STATS,
      totalVolume,
      btcPrice: btc?.price ?? 0,
      btcChange: btc?.change24h ?? 0,
      solPrice: sol?.price ?? 0,
      solChange: sol?.change24h ?? 0,
      ethPrice: eth?.price ?? 0,
      ethChange: eth?.change24h ?? 0,
      marketSentiment:
        btc && btc.change24h > 0 ? "bullish" : btc && btc.change24h < -1 ? "bearish" : "neutral",
    },
  };
}

// ── CoinGecko fallback ─────────────────────────────────────────────────
async function fetchFromCoinGecko() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6_000);

  const response = await fetch(
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,binancecoin,ripple,dogecoin,cardano,avalanche-2&order=market_cap_desc&per_page=20&page=1&sparkline=false&price_change_percentage=24h",
    { signal: controller.signal, headers: { Accept: "application/json" } },
  );
  clearTimeout(timeout);

  if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);

  interface CoinGeckoCoin {
    symbol: string;
    current_price: number;
    price_change_percentage_24h: number | null;
    total_volume: number;
    high_24h: number;
    low_24h: number;
  }

  const coins = (await response.json()) as CoinGeckoCoin[];

  const symbolMap: Record<string, string> = {
    binancecoin: "BNB",
    ripple: "XRP",
    "avalanche-2": "AVAX",
  };

  const tokens = coins.map((c) => ({
    symbol: symbolMap[c.symbol] ?? c.symbol.toUpperCase(),
    price: c.current_price,
    change24h: c.price_change_percentage_24h ?? 0,
    volume24h: c.total_volume,
    high24h: c.high_24h,
    low24h: c.low_24h,
  }));

  tokens.sort((a, b) => b.volume24h - a.volume24h);

  const totalVolume = tokens.reduce((s, t) => s + t.volume24h, 0);
  const btc = tokens.find((t) => t.symbol === "BTC");
  const sol = tokens.find((t) => t.symbol === "SOL");
  const eth = tokens.find((t) => t.symbol === "ETH");

  return {
    success: true as const,
    tokens,
    stats: {
      ...FALLBACK_STATS,
      totalVolume,
      btcPrice: btc?.price ?? 0,
      btcChange: btc?.change24h ?? 0,
      solPrice: sol?.price ?? 0,
      solChange: sol?.change24h ?? 0,
      ethPrice: eth?.price ?? 0,
      ethChange: eth?.change24h ?? 0,
      marketSentiment:
        btc && btc.change24h > 0 ? "bullish" : btc && btc.change24h < -1 ? "bearish" : "neutral",
    },
  };
}

// ── Main handler with Redis cache ────────────────────────────────────
const handler = defineEventHandler(async (event) => {
  if (handlePreflight(event)) return;

  // 1. Check Redis cache first
  const cached = await cache.get(CACHE_KEY);
  if (cached) return { ...cached, cached: true };

  // 2. Try CoinGecko first (rich data), then Binance as fallback
  for (const [name, fetcher] of [
    ["CoinGecko", fetchFromCoinGecko],
    ["Binance", fetchFromBinance],
  ] as const) {
    try {
      const result = await fetcher();
      await cache.set(CACHE_KEY, result, CACHE_TTL.MARKET_PRICES);
      return result;
    } catch (err) {
      console.warn(`[market-overview] ${name} failed:`, err instanceof Error ? err.message : err);
    }
  }

  // Both sources failed — return safe defaults (never null stats)
  console.error("[market-overview] All data sources failed");
  return {
    success: false,
    tokens: [],
    stats: { ...FALLBACK_STATS },
    error: "All data sources unavailable",
  };
});

export default withRateLimit(handler, { maxRequests: 120, windowSec: 60 });
