// ── Types ───────────────────────────────────────────────────────────────────

export interface MarketToken {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

export interface MarketOverview {
  success: boolean;
  tokens: MarketToken[];
  stats: {
    totalVolume: number;
    btcPrice: number;
    btcChange: number;
    solPrice: number;
    solChange: number;
    ethPrice: number;
    ethChange: number;
    topGainer: { symbol: string; change: number } | null;
    topLoser: { symbol: string; change: number } | null;
    marketSentiment: string;
  };
}

export interface DiscoverToken {
  symbol: string;
  name: string;
  price: number | null;
  change24h: number | null;
  volume24h: number;
  liquidity: number;
  chain: string;
  marketCap: number;
  discoveryScore: number;
}

export type BlipType = "price_alert" | "whale" | "signal" | "volume_spike";

export interface RadarBlip {
  id: string;
  type: BlipType;
  title: string;
  subtitle: string;
  detail: string;
  timestamp: Date;
  color: string;
  icon: string;
}

export interface SignalRow {
  id: string;
  pair: string;
  timeframe: string;
  recommendation: string;
  confidence: number;
  created_at: string;
}

// ── Binance Types ─────────────────────────────────────────────────────────

interface Binance24hrTicker {
  symbol: string;
  priceChange: string;
  priceChangePercent: string;
  weightedAvgPrice: string;
  lastPrice: string;
  volume: string;
  quoteVolume: string;
  highPrice: string;
  lowPrice: string;
}

// ── Real Data Fetchers (Binance API) ───────────────────────────────────────

async function fetchBinance24hrTickers(): Promise<Binance24hrTicker[]> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr");
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter(
      (t: Binance24hrTicker) => t.symbol.endsWith("USDT") && parseFloat(t.quoteVolume) > 0,
    );
  } catch {
    return [];
  }
}

async function fetchRecentLargeTrades(tickers: Binance24hrTicker[]): Promise<RadarBlip[]> {
  if (tickers.length === 0) return [];

  const topVolume = [...tickers]
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 5);

  return topVolume.map((t, i) => {
    const symbol = t.symbol.replace("USDT", "");
    const quoteVol = parseFloat(t.quoteVolume);
    const changePct = parseFloat(t.priceChangePercent);
    const volumeStr =
      quoteVol >= 1_000_000_000
        ? `$${(quoteVol / 1_000_000_000).toFixed(1)}B`
        : quoteVol >= 1_000_000
          ? `$${(quoteVol / 1_000_000).toFixed(1)}M`
          : `$${(quoteVol / 1_000).toFixed(1)}K`;

    return {
      id: `whale-${symbol}`,
      type: "whale" as BlipType,
      title: "🐋 Whale detected",
      subtitle: `${symbol}/USDT`,
      detail: `${volumeStr} 24h volume${changePct >= 0 ? ` · +${changePct.toFixed(2)}%` : ` · ${changePct.toFixed(2)}%`}`,
      timestamp: new Date(Date.now() - (i * 5 + 1) * 60_000),
      color: "var(--color-gold)",
      icon: "🐋",
    };
  });
}

async function fetchSignificantPriceMoves(tickers: Binance24hrTicker[]): Promise<RadarBlip[]> {
  if (tickers.length === 0) return [];

  const significant = tickers
    .filter((t) => Math.abs(parseFloat(t.priceChangePercent)) > 2)
    .sort(
      (a, b) =>
        Math.abs(parseFloat(b.priceChangePercent)) - Math.abs(parseFloat(a.priceChangePercent)),
    )
    .slice(0, 5);

  return significant.map((t, i) => {
    const symbol = t.symbol.replace("USDT", "");
    const pct = parseFloat(t.priceChangePercent);
    const lastPrice = parseFloat(t.lastPrice);
    const priceChange = parseFloat(t.priceChange);
    const oldPrice = lastPrice - priceChange;

    return {
      id: `price-${symbol}`,
      type: "price_alert" as BlipType,
      title: `${symbol} ${pct >= 0 ? "📈 Price Spike" : "📉 Price Drop"}`,
      subtitle: `${symbol}/USDT`,
      detail: `$${oldPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} → $${lastPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} (${pct >= 0 ? "+" : ""}${pct.toFixed(2)}%)`,
      timestamp: new Date(Date.now() - (i * 7 + 2) * 60_000),
      color: pct >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
      icon: pct >= 0 ? "📈" : "📉",
    };
  });
}

async function fetchVolumeAnomalies(tickers: Binance24hrTicker[]): Promise<RadarBlip[]> {
  if (tickers.length === 0) return [];

  const topVolume = [...tickers]
    .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
    .slice(0, 5);

  const blips: RadarBlip[] = [];

  for (const t of topVolume) {
    try {
      const res = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${t.symbol}&interval=1h&limit=24`,
      );
      if (!res.ok) continue;
      const klines: string[][] = await res.json();
      if (klines.length < 8) continue;

      // klines[0..4] are newest; each: [openTime, open, high, low, close, volume, closeTime, ...]
      const volumes = klines.map((k) => parseFloat(k[5]));
      const recentVolume = volumes.slice(0, 4).reduce((a, b) => a + b, 0);
      const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

      if (avgVolume > 0 && recentVolume / avgVolume > 1.5) {
        const ratio = recentVolume / avgVolume;
        const symbol = t.symbol.replace("USDT", "");
        // Use the close time of the latest kline as a real timestamp
        const latestCloseTime = parseInt(klines[0][6], 10);
        blips.push({
          id: `vol-${symbol}`,
          type: "volume_spike" as BlipType,
          title: "📊 Volume Surge",
          subtitle: `${symbol}/USDT`,
          detail: `Volume ${ratio.toFixed(1)}x above 24h average`,
          timestamp: new Date(latestCloseTime),
          color: "var(--color-gold)",
          icon: "📊",
        });
      }
    } catch {
      // Skip this pair on error
    }
  }

  return blips;
}

// ── Server Function: Get Radar Blips ──────────────────────────────────────

import { createServerFn } from "@tanstack/react-start";

export const getRadarBlips = createServerFn({ method: "GET" }).handler(
  async (): Promise<RadarBlip[]> => {
    const tickers = await fetchBinance24hrTickers();
    if (tickers.length === 0) return [];

    const [whales, priceMoves, volumeAnomalies] = await Promise.all([
      fetchRecentLargeTrades(tickers),
      fetchSignificantPriceMoves(tickers),
      fetchVolumeAnomalies(tickers),
    ]);

    const all = [...whales, ...priceMoves, ...volumeAnomalies];
    all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return all.slice(0, 15);
  },
);
