/* eslint-disable react-refresh/only-export-components */
// ============================================================================
// VIXOR Trade Radar — Real-time Market Intelligence Dashboard
// ============================================================================
// Military-radar-inspired dark UI showing alerts, price movements,
// whale activity, and signal blips in real time.
// ============================================================================

import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getDailySignals } from "@/shared/data";
import { PageLayout, StatsRow, SectionTitle, PageScrollArea } from "@/components/vixor/PageLayout";
import { getRadarBlips } from "./server-fn";

import type { MarketToken, MarketOverview, DiscoverToken, SignalRow, RadarBlip } from "./server-fn";
import {
  generateMockSignals,
  generateMockTokens,
  generateMockHeatmapData,
  formatPrice,
} from "./helpers";
import { RadarPulse } from "./RadarPulse";
import { BlipCard } from "./BlipCard";
import { HeatmapGrid } from "./HeatmapGrid";
import { AlertsLogEntry } from "./AlertsLogEntry";
import { DemoNotice } from "./DemoNotice";

export { getRadarBlips };

// ── Main Page ───────────────────────────────────────────────────────────────

export function RadarPage() {
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
