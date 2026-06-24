// ============================================================================
// VIXOR Market Overview API Route
// ============================================================================
// GET /api/market-overview
//
// Returns top crypto prices and 24h changes for the Home page.
// Uses Binance public API (no auth required).
// ============================================================================

import { createAPIFileRoute } from "@tanstack/react-start/api";

interface BinanceTicker {
  symbol: string;
  lastPrice: string;
  priceChangePercent: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

export const APIRoute = createAPIFileRoute({
  GET: async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8_000);

      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/24hr?symbols=%5B%22BTCUSDT%22,%22ETHUSDT%22,%22SOLUSDT%22,%22BNBUSDT%22,%22XRPUSDT%22,%22DOGEUSDT%22,%22ADAUSDT%22,%22AVAXUSDT%22%22%5D",
        { signal: controller.signal, headers: { Accept: "application/json" } },
      );

      clearTimeout(timeout);

      if (!response.ok) {
        // Fallback to individual calls
        return Response.json(await fetchIndividual());
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

      // Sort by volume
      tokens.sort((a, b) => b.volume24h - a.volume24h);

      // Calculate aggregate stats
      const totalVolume = tokens.reduce((s, t) => s + t.volume24h, 0);
      const btc = tokens.find((t) => t.symbol === "BTC");
      const sol = tokens.find((t) => t.symbol === "SOL");
      const eth = tokens.find((t) => t.symbol === "ETH");
      const topGainer = [...tokens].sort((a, b) => b.change24h - a.change24h)[0];
      const topLoser = [...tokens].sort((a, b) => a.change24h - b.change24h)[0];

      return Response.json({
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
          topGainer: topGainer ? { symbol: topGainer.symbol, change: topGainer.change24h } : null,
          topLoser: topLoser ? { symbol: topLoser.symbol, change: topLoser.change24h } : null,
          marketSentiment: btc && btc.change24h > 0 ? "bullish" : btc && btc.change24h < -1 ? "bearish" : "neutral",
        },
      });
    } catch (err) {
      console.error("[Market Overview API]", err);

      // Return cached/fallback data
      return Response.json({
        success: false,
        tokens: [],
        stats: {
          totalVolume: 0,
          btcPrice: 0,
          btcChange: 0,
          solPrice: 0,
          solChange: 0,
          ethPrice: 0,
          ethChange: 0,
          topGainer: null,
          topLoser: null,
          marketSentiment: "neutral",
        },
        error: err instanceof Error ? err.message : "Failed to fetch market data",
      });
    }
  },
});

// ── Fallback: fetch individual tickers ──────────────────────────────────

async function fetchIndividual() {
  const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT"];
  const tokens = [];

  for (const sym of symbols) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`, {
        signal: AbortSignal.timeout(5_000),
      });
      if (res.ok) {
        const t = (await res.json()) as BinanceTicker;
        tokens.push({
          symbol: t.symbol.replace("USDT", ""),
          price: parseFloat(t.lastPrice),
          change24h: parseFloat(t.priceChangePercent),
          volume24h: parseFloat(t.quoteVolume),
          high24h: parseFloat(t.highPrice),
          low24h: parseFloat(t.lowPrice),
        });
      }
    } catch {
      // Skip failed individual fetches
    }
  }

  const totalVolume = tokens.reduce((s, t) => s + t.volume24h, 0);
  const btc = tokens.find((t) => t.symbol === "BTC");

  return {
    success: tokens.length > 0,
    tokens,
    stats: {
      totalVolume,
      btcPrice: btc?.price ?? 0,
      btcChange: btc?.change24h ?? 0,
      solPrice: tokens.find((t) => t.symbol === "SOL")?.price ?? 0,
      solChange: tokens.find((t) => t.symbol === "SOL")?.change24h ?? 0,
      ethPrice: tokens.find((t) => t.symbol === "ETH")?.price ?? 0,
      ethChange: tokens.find((t) => t.symbol === "ETH")?.change24h ?? 0,
      topGainer: null,
      topLoser: null,
      marketSentiment: "neutral" as const,
    },
  };
}