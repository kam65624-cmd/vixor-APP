/**
 * @module server/api/market-overview
 * @description GET endpoint for top crypto market data.
 * Returns BTC, ETH, SOL, BNB, XRP, DOGE, ADA, AVAX prices from Binance.
 * No authentication required — public endpoint.
 */

import { defineEventHandler } from "h3";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export default defineEventHandler(async () => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);

    const response = await fetch(
      "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22XRPUSDT%22,%22DOGEUSDT%22,%22ADAUSDT%22,%22AVAXUSDT%22%5D",
      { signal: controller.signal, headers: { Accept: "application/json" } },
    );

    clearTimeout(timeout);

    if (!response.ok) {
      return { success: false, tokens: [], stats: null, error: `Binance API error: ${response.status}` };
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
      success: true,
      tokens,
      stats: {
        totalVolume,
        btcPrice: btc?.price ?? 0,
        btcChange: btc?.change24h ?? 0,
        solPrice: sol?.price ?? 0,
        solChange: sol?.change24h ?? 0,
        ethPrice: eth?.price ?? 0,
        ethChange: eth?.change24h ?? 0,
        marketSentiment: btc && btc.change24h > 0 ? "bullish" : btc && btc.change24h < -1 ? "bearish" : "neutral",
      },
    };
  } catch (err) {
    console.error("[market-overview] Error:", err instanceof Error ? err.message : err);
    return { success: false, tokens: [], stats: null, error: "Failed to fetch market data" };
  }
});