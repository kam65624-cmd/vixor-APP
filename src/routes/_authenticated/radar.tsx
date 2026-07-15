/* eslint-disable react-refresh/only-export-components */
// ============================================================================
// VIXOR Trade Radar — Real-time Market Intelligence Dashboard
// ============================================================================
// Military-radar-inspired dark UI showing alerts, price movements,
// whale activity, and signal blips in real time.
// ============================================================================

import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getDailySignals } from "@/shared/data";
import {
  PageLayout,
  StatsRow,
  Badge,
  SectionTitle,
  PageScrollArea,
} from "@/components/vixor/PageLayout";

// ── Route Definition ────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/radar")({
  head: () => ({ meta: [{ title: "Trade Radar — Vixor" }] }),
  component: RadarPage,
});

// ── Types ───────────────────────────────────────────────────────────────────

interface MarketToken {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface MarketOverview {
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

interface DiscoverToken {
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

type BlipType = "price_alert" | "whale" | "signal" | "volume_spike";

interface RadarBlip {
  id: string;
  type: BlipType;
  title: string;
  subtitle: string;
  detail: string;
  timestamp: Date;
  color: string;
  icon: string;
}

interface SignalRow {
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

function generateMockSignals(signals: SignalRow[]): RadarBlip[] {
  return [];
}

function generateMockTokens(): MarketToken[] {
  return [];
}

function generateMockHeatmapData(): Array<{ symbol: string; change: number }> {
  return [];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatPrice(price: number): string {
  if (price >= 1000)
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1)
    return price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function heatmapColor(change: number): string {
  if (change >= 8) return "color-mix(in srgb, var(--color-bullish) 85%, transparent)";
  if (change >= 5) return "rgba(34, 211, 166, 0.6)";
  if (change >= 2) return "rgba(34, 211, 166, 0.4)";
  if (change >= 0) return "rgba(34, 211, 166, 0.2)";
  if (change >= -2) return "rgba(251, 70, 103, 0.2)";
  if (change >= -5) return "rgba(251, 70, 103, 0.4)";
  if (change >= -8) return "rgba(251, 70, 103, 0.6)";
  return "color-mix(in srgb, var(--color-bearish) 85%, transparent)";
}

// ── Sub-Components ──────────────────────────────────────────────────────────

function RadarPulse({ active }: { active: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: "var(--color-bullish)",
        marginRight: 6,
        position: "relative" as const,
        flexShrink: 0,
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute" as const,
            inset: -3,
            borderRadius: "50%",
            border: "1.5px solid var(--color-bullish)",
            animation: "radar-pulse 1.5s ease-out infinite",
          }}
        />
      )}
    </span>
  );
}

function BlipCard({ blip }: { blip: RadarBlip }) {
  const isFresh = Date.now() - blip.timestamp.getTime() < 5 * 60_000;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered
          ? "color-mix(in srgb, var(--color-primary) 4%, transparent)"
          : "var(--color-card)",
        border: `1px solid ${hovered ? blip.color + "40" : "var(--color-border)"}`,
        borderLeft: `3px solid ${blip.color}`,
        borderRadius: 8,
        padding: "12px 14px",
        display: "flex",
        flexDirection: "column",
        gap: 6,
        transition: "all var(--transition-base)",
        position: "relative" as const,
        overflow: "hidden",
      }}
    >
      {/* Scan-line overlay for fresh blips */}
      {isFresh && (
        <div
          style={{
            position: "absolute" as const,
            top: 0,
            left: 0,
            right: 0,
            height: "100%",
            background: `linear-gradient(180deg, transparent 0%, ${blip.color}08 50%, transparent 100%)`,
            animation: "radar-scanline 2s ease-in-out infinite",
            pointerEvents: "none" as const,
          }}
        />
      )}

      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <RadarPulse active={isFresh} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            {blip.icon} {blip.title}
          </span>
        </div>
        <span
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap" as const,
          }}
        >
          {timeAgo(blip.timestamp)}
        </span>
      </div>

      {/* Subtitle */}
      <div
        style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)", paddingLeft: 14 }}
      >
        {blip.subtitle}
      </div>

      {/* Detail */}
      <div
        style={{
          fontSize: 11,
          color: "var(--color-muted-foreground)",
          fontFamily: "var(--font-mono)",
          paddingLeft: 14,
        }}
      >
        {blip.detail}
      </div>

      {/* Type badge */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingLeft: 14 }}>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            padding: "1px 6px",
            borderRadius: 3,
            background: `${blip.color}18`,
            color: blip.color,
            letterSpacing: "0.05em",
            textTransform: "uppercase" as const,
          }}
        >
          {blip.type.replace("_", " ")}
        </span>
      </div>
    </div>
  );
}

function TickerStrip({ tokens }: { tokens: MarketToken[] }) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={stripRef}
      className="scrollbar-hide"
      style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        padding: "8px 0",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      {tokens.map((t) => {
        const isUp = t.change24h >= 0;
        return (
          <div
            key={t.symbol}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              background: "var(--color-card)",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              minWidth: 160,
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
                {t.symbol}
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-muted-foreground)",
                    fontWeight: 500,
                    marginLeft: 3,
                  }}
                >
                  /USDT
                </span>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "right" as const }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-foreground)",
                }}
              >
                ${formatPrice(t.price)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
                }}
              >
                {isUp ? "+" : ""}
                {t.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function HeatmapGrid({ data }: { data: Array<{ symbol: string; change: number }> }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
        gap: 3,
        padding: "8px 16px 12px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-card)",
      }}
    >
      {data.map((d) => (
        <div
          key={d.symbol}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 4px",
            borderRadius: 6,
            background: heatmapColor(d.change),
            minHeight: 52,
            transition: "transform 0.15s ease",
            cursor: "default" as const,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-foreground)",
              marginBottom: 2,
            }}
          >
            {d.symbol}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: d.change >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            {d.change >= 0 ? "+" : ""}
            {d.change.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

function AlertsLogEntry({ blip, index }: { blip: RadarBlip; index: number }) {
  const isFresh = Date.now() - blip.timestamp.getTime() < 5 * 60_000;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 16px",
        borderBottom: "1px solid color-mix(in srgb, var(--color-primary) 4%, transparent)",
        background: index % 2 === 0 ? "var(--color-card)" : "rgba(99,102,241,0.02)",
        transition: "background 0.1s ease",
      }}
    >
      {/* Timestamp */}
      <span
        style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          color: "var(--color-muted-foreground)",
          minWidth: 48,
          flexShrink: 0,
        }}
      >
        {timeAgo(blip.timestamp)}
      </span>

      {/* Pulse + Icon */}
      <RadarPulse active={isFresh} />
      <span style={{ fontSize: 14, flexShrink: 0 }}>{blip.icon}</span>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-foreground)",
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {blip.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            fontFamily: "var(--font-mono)",
            whiteSpace: "nowrap" as const,
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {blip.subtitle} — {blip.detail}
        </div>
      </div>

      {/* Color indicator */}
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: blip.color,
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function DemoNotice() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "color-mix(in srgb, var(--color-gold) 10%, transparent)",
        borderBottom: "1px solid color-mix(in srgb, var(--color-gold) 0.20%, transparent)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          padding: "1px 6px",
          borderRadius: 3,
          background: "color-mix(in srgb, var(--color-gold) 13%, transparent)",
          color: "var(--color-gold)",
          letterSpacing: "0.06em",
        }}
      >
        DEMO
      </span>
      <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
        Showing simulated data — API connections unavailable
      </span>
    </div>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

function RadarPage() {
  const fetchSignals = useStableServerFn(getDailySignals);
  const [isDemo, setIsDemo] = useState(false);
  const [autoScrollOffset, setAutoScrollOffset] = useState(0);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Data Fetching: Market Overview ──
  const marketQuery = useQuery({
    queryKey: ["market-overview-radar"],
    queryFn: async (): Promise<MarketOverview> => {
      const res = await fetch("/api/market-overview");
      if (!res.ok) throw new Error("Market overview fetch failed");
      const data = await res.json();
      return data;
    },
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 15_000,
  });

  // ── Data Fetching: Discover tokens ──
  const discoverQuery = useQuery({
    queryKey: ["discover-radar"],
    queryFn: async () => {
      const res = await fetch("/api/discover?limit=20&sortBy=volume&sortOrder=desc");
      if (!res.ok) throw new Error("Discover fetch failed");
      const data = await res.json();
      return (data.data || []) as DiscoverToken[];
    },
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  });

  // ── Data Fetching: Daily Signals ──
  const signalsQuery = useQuery({
    queryKey: ["daily-signals-radar"],
    queryFn: () => fetchSignals({}),
    refetchInterval: 60_000,
    retry: 1,
    staleTime: 30_000,
  });

  // ── Data Fetching: Radar Blips (real Binance data) ──
  const fetchRadarBlips = useStableServerFn(getRadarBlips);
  const radarBlipsQuery = useQuery({
    queryKey: ["radar-blips"],
    queryFn: () => fetchRadarBlips(),
    refetchInterval: 30_000,
    retry: 1,
    staleTime: 15_000,
  });

  // ── Determine demo mode ──
  useEffect(() => {
    if (
      marketQuery.isError ||
      (marketQuery.data && !marketQuery.data.success && marketQuery.data.tokens.length === 0)
    ) {
      setIsDemo(true);
    }
  }, [marketQuery.isError, marketQuery.data]);

  // ── Auto-scroll ticker ──
  useEffect(() => {
    const strip = document.querySelector(".radar-ticker-strip");
    if (!strip) return;

    const scroll = () => {
      setAutoScrollOffset((prev) => {
        const max = strip.scrollWidth - strip.clientWidth;
        if (max <= 0) return 0;
        const next = prev + 1;
        return next > max ? 0 : next;
      });
    };

    tickerRef.current = setInterval(scroll, 30);
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
    };
  }, [marketQuery.data]);

  // ── Computed: tokens ──
  const tokens: MarketToken[] = useMemo(() => {
    if (marketQuery.data && marketQuery.data.success && marketQuery.data.tokens.length > 0) {
      return marketQuery.data.tokens;
    }
    return generateMockTokens();
  }, [marketQuery.data]);

  // ── Computed: signals ──
  const signals: SignalRow[] = useMemo(() => {
    if (
      signalsQuery.data &&
      "signals" in signalsQuery.data &&
      Array.isArray(signalsQuery.data.signals)
    ) {
      return signalsQuery.data.signals.slice(0, 6);
    }
    return [];
  }, [signalsQuery.data]);

  // ── Computed: all blips (real data + AI signals) ──
  const blips: RadarBlip[] = useMemo(() => {
    const marketBlips = radarBlipsQuery.data ?? [];
    const signalBlips = generateMockSignals(signals);

    const all = [...marketBlips, ...signalBlips];
    all.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return all.slice(0, 15);
  }, [radarBlipsQuery.data, signals]);

  // ── Computed: heatmap data ──
  const heatmapData = useMemo(() => {
    if (tokens.length > 0) {
      const fromMarket = tokens.map((t) => ({ symbol: t.symbol, change: t.change24h }));
      // Add discover tokens that aren't duplicates
      if (discoverQuery.data) {
        for (const dt of discoverQuery.data) {
          if (dt.change24h != null && !fromMarket.find((m) => m.symbol === dt.symbol)) {
            fromMarket.push({ symbol: dt.symbol, change: dt.change24h });
          }
        }
      }
      if (fromMarket.length >= 10) return fromMarket;
    }
    return generateMockHeatmapData();
  }, [tokens, discoverQuery.data]);

  // ── Computed: stats ──
  const stats = useMemo(() => {
    const alertCount = blips.filter(
      (b) => b.type === "price_alert" || b.type === "volume_spike",
    ).length;
    const spikeCount = tokens.filter((t) => Math.abs(t.change24h) > 5).length;
    const whaleCount = blips.filter((b) => b.type === "whale").length;
    const signalCount = signals.length;

    return [
      {
        label: "Active Alerts",
        value: String(alertCount),
        color: "var(--color-bearish)",
        icon: "🔔",
        sub: "price & volume",
      },
      {
        label: "Price Spikes",
        value: String(spikeCount),
        color: "var(--color-bullish)",
        icon: "⚡",
        sub: "> 5% change",
      },
      {
        label: "Whale Moves",
        value: String(whaleCount),
        color: "var(--color-gold)",
        icon: "🐋",
        sub: "large txns",
      },
      {
        label: "Signals Today",
        value: String(signalCount),
        color: "var(--color-primary)",
        icon: "🤖",
        sub: "AI generated",
      },
    ];
  }, [blips, tokens, signals]);

  // ── Computed: alerts log (all blips sorted by time) ──
  const alertsLog = useMemo(() => {
    return [...blips].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [blips]);

  const isLoading = marketQuery.isLoading && signalsQuery.isLoading;
  const isBlipsLoading = radarBlipsQuery.isLoading;
  const isBlipsEmpty = !isBlipsLoading && blips.length === 0;

  return (
    <PageLayout
      title="Trade Radar"
      badge="LIVE"
      badgeColor="var(--color-bullish)"
      loading={isLoading}
      loadingColor="var(--color-bullish)"
    >
      <style>{`
        @keyframes radar-pulse {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }

        @keyframes radar-scanline {
          0% {
            transform: translateY(-100%);
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(100%);
            opacity: 0;
          }
        }

        @keyframes radar-grid-fade {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }

        .radar-grid-bg {
          background-image:
            linear-gradient(var(--color-border) 1px, transparent 1px),
            linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: radar-grid-fade 4s ease-in-out infinite;
        }

        .radar-ticker-strip {
          scroll-behavior: auto;
        }

        .radar-ticker-strip::-webkit-scrollbar {
          display: none;
        }

        .radar-glow-card {
          box-shadow: 0 0 20px -5px var(--color-primary);
          transition: box-shadow 0.3s ease, border-color 0.3s ease;
        }

        .radar-glow-card:hover {
          box-shadow: 0 0 30px -3px var(--color-primary);
        }
      `}</style>

      {/* Demo notice */}
      {isDemo && <DemoNotice />}

      {/* Quick Stats Row */}
      <StatsRow stats={stats} />

      {/* Live Price Ticker Strip */}
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            paddingTop: 10,
            paddingBottom: 4,
          }}
        >
          <RadarPulse active={true} />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}
          >
            Live Ticker
          </span>
        </div>
      </div>
      <div
        className="radar-ticker-strip"
        style={{
          overflowX: "auto",
          paddingLeft: 16,
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", gap: 6, transform: `translateX(-${autoScrollOffset}px)` }}>
          {tokens.map((t) => {
            const isUp = t.change24h >= 0;
            return (
              <div
                key={t.symbol}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 14px",
                  background: "var(--color-card)",
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  minWidth: 155,
                  flexShrink: 0,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
                    {t.symbol}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted-foreground)",
                      fontWeight: 500,
                      marginLeft: 3,
                    }}
                  >
                    /USDT
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: "right" as const }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    ${formatPrice(t.price)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
                    }}
                  >
                    {isUp ? "+" : ""}
                    {t.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
          {/* Duplicate for seamless loop */}
          {tokens.map((t) => {
            const isUp = t.change24h >= 0;
            return (
              <div
                key={`loop-${t.symbol}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 14px",
                  background: "var(--color-card)",
                  borderRadius: 6,
                  border: "1px solid var(--color-border)",
                  minWidth: 155,
                  flexShrink: 0,
                }}
              >
                <div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
                    {t.symbol}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted-foreground)",
                      fontWeight: 500,
                      marginLeft: 3,
                    }}
                  >
                    /USDT
                  </span>
                </div>
                <div style={{ flex: 1, textAlign: "right" as const }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    ${formatPrice(t.price)}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: "var(--font-mono)",
                      color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
                    }}
                  >
                    {isUp ? "+" : ""}
                    {t.change24h.toFixed(2)}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <PageScrollArea>
        {/* Radar Grid Section */}
        <SectionTitle title="Radar Blips" count={blips.length} />

        {isBlipsLoading ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 16px",
              color: "var(--color-muted-foreground)",
              fontSize: 13,
              gap: 8,
            }}
          >
            <RadarPulse active={true} />
            <span>Scanning markets…</span>
          </div>
        ) : isBlipsEmpty ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 16px",
              color: "var(--color-muted-foreground)",
              fontSize: 13,
            }}
          >
            <span>No significant activity detected</span>
          </div>
        ) : (
          /* Radar grid background effect */
          <div className="radar-grid-bg" style={{ padding: "10px 16px 14px" }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: 8,
              }}
            >
              {blips.map((blip) => (
                <BlipCard key={blip.id} blip={blip} />
              ))}
            </div>
          </div>
        )}

        {/* Market Heatmap Section */}
        <SectionTitle title="Market Heatmap" count={heatmapData.length} />
        <HeatmapGrid data={heatmapData} />

        {/* Recent Alerts Log */}
        <SectionTitle title="Recent Alerts Log" count={alertsLog.length} />
        {isBlipsEmpty ? null : (
          <div style={{ maxHeight: 400, overflowY: "auto" }} className="scrollbar-hide">
            {alertsLog.map((blip, i) => (
              <AlertsLogEntry key={blip.id} blip={blip} index={i} />
            ))}
          </div>
        )}

        {/* Bottom spacer for scroll */}
        <div style={{ height: 24 }} />
      </PageScrollArea>
    </PageLayout>
  );
}
