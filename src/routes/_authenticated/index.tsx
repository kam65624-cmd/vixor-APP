import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { StatsRow, DataRow, ScrollArea, EmptyState, SkeletonRow } from "@/components/vixor/PageLayout";

// ── Market Overview Types ──────────────────────────────────────────────────
interface MarketToken {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
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
    marketSentiment: string;
  };
}

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  { label: "Discover", icon: "🔍", to: "/discover" as const, color: "var(--color-bullish)" },
  { label: "AI Copilot", icon: "🤖", to: "/copilot" as const, color: "var(--color-info)" },
  { label: "Whale Alerts", icon: "🐋", to: "/whale" as const, color: "var(--color-bullish)" },
  { label: "PnL Tracker", icon: "📊", to: "/pnl" as const, color: "var(--color-bullish)" },
  { label: "Alpha Signals", icon: "⚡", to: "/alpha" as const, color: "var(--color-neutral-wait)" },
  { label: "My Bags", icon: "🏛️", to: "/bags" as const, color: "var(--color-bearish)" },
];

// ── Sparkline ──────────────────────────────────────────────────────────────
const MiniSpark = memo(function MiniSpark({ up, small }: { up: boolean; small?: boolean }) {
  const w = small ? 48 : 60, h = small ? 16 : 20;
  const pts: string[] = [];
  const start = up ? 30 : 70, end = up ? 70 : 30;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * w, progress = i / 12;
    const base = start + (end - start) * progress;
    const noise = Math.sin(i * 2.3) * 8 + Math.cos(i * 1.7) * 5;
    const y = Math.max(2, Math.min(h - 2, h - base - noise));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline
        points={pts.join(" ")} fill="none"
        stroke={up ? "var(--color-bullish)" : "var(--color-bearish)"}
        strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"
      />
    </svg>
  );
});

// ── Dashboard Card ─────────────────────────────────────────────────────────
function Card({
  children, style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: "var(--color-card)", borderRadius: "8px",
      border: `1px solid ${"var(--color-border)"}`, overflow: "hidden", ...style,
    }}>
      {children}
    </div>
  );
}

function CardHeader({
  title, action, icon,
}: { title: string; action?: { label: string; onClick: () => void }; icon?: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 12px", borderBottom: `1px solid ${"var(--color-border)"}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ fontSize: "13px" }}>{icon}</span>}
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{title}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: "12px", fontWeight: 600, color: "var(--color-primary)",
            background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}

// ── Holding Row ────────────────────────────────────────────────────────────
function HoldingRow({ h, onClick }: { h: { symbol: string; value: number; pnlPct: number; up: boolean; amount: number }; onClick: () => void }) {
  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K` : `$${n.toFixed(2)}`;

  return (
    <DataRow onClick={onClick} leftAccent={h.up ? "var(--color-bullish)" : "var(--color-bearish)"}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
            background: h.up ? `color-mix(in oklab, var(--color-bullish) 8%, transparent)` : `color-mix(in oklab, var(--color-bearish) 8%, transparent)`,
            border: `1px solid ${h.up ? `color-mix(in oklab, var(--color-bullish) 19%, transparent)` : `color-mix(in oklab, var(--color-bearish) 19%, transparent)`}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "12px", fontWeight: 800, color: h.up ? "var(--color-bullish)" : "var(--color-bearish)",
          }}>
            {h.symbol.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{h.symbol}</div>
            <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
              {h.amount.toFixed(2)} tokens
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
          <div style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-foreground)" }}>
            {fmt(h.value)}
          </div>
          <div style={{
            fontSize: "12px", fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: h.up ? "var(--color-bullish)" : "var(--color-bearish)",
          }}>
            {h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%
          </div>
        </div>
      </div>
    </DataRow>
  );
}

// ── Signal Row ─────────────────────────────────────────────────────────────
function SignalRow({ s }: { s: { token: string; type: string; reason: string; confidence: number; up?: boolean } }) {
  const isBuy = s.type === "BUY";
  return (
    <div
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "7px 12px", margin: "3px 4px", borderRadius: "6px", cursor: "pointer",
        background: isBuy ? `${"var(--color-bullish)"}08` : `${"var(--color-bearish)"}08`,
        border: `1px solid ${isBuy ? `color-mix(in oklab, var(--color-bullish) 10%, transparent)` : `color-mix(in oklab, var(--color-bearish) 10%, transparent)`}`,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = isBuy ? `${"var(--color-bullish)"}14` : `${"var(--color-bearish)"}14`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = isBuy ? `${"var(--color-bullish)"}08` : `${"var(--color-bearish)"}08`)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: "12px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
          background: isBuy ? `${"var(--color-bullish)"}25` : `${"var(--color-bearish)"}25`,
          color: isBuy ? "var(--color-bullish)" : "var(--color-bearish)", flexShrink: 0,
        }}>{s.type}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)", flexShrink: 0 }}>{s.token}</span>
        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
        <span style={{ fontSize: "13px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", width: "28px", textAlign: "right", color: "var(--color-neutral-wait)" }}>
          {s.confidence}%
        </span>
        <MiniSpark up={isBuy} small />
      </div>
    </div>
  );
}

// ── Market Token Row ────────────────────────────────────────────────────
function MarketTokenRow({ t }: { t: MarketToken }) {
  const isUp = t.change24h >= 0;
  const color = isUp ? "var(--color-bullish)" : "var(--color-bearish)";
  const fmtPrice = (p: number) => {
    if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
    if (p >= 1) return `$${p.toFixed(2)}`;
    if (p >= 0.0001) return `$${p.toFixed(6)}`;
    return `$${p.toFixed(8)}`;
  };
  const fmtVol = (v: number) => {
    if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
    if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `$${(v / 1_000).toFixed(1)}K`;
    return `$${v.toFixed(0)}`;
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "7px 12px", borderBottom: "1px solid var(--color-border)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%", flexShrink: 0,
          background: `color-mix(in oklab, ${color} 10%, transparent)`,
          border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "12px", fontWeight: 800, color,
        }}>
          {t.symbol.slice(0, 2)}
        </div>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>{t.symbol}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: "var(--color-foreground)" }}>
          {fmtPrice(t.price)}
        </span>
        <span style={{ fontSize: "12px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color, width: "48px", textAlign: "right" }}>
          {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
        </span>
        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)", width: "52px", textAlign: "right" }}>
          {fmtVol(t.volume24h)}
        </span>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────
function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);

  const dashQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard({}),
    staleTime: 30_000,
  });

  // ── Market Overview ──
  const marketQuery = useQuery<MarketOverview>({
    queryKey: ["market-overview"],
    queryFn: async () => {
      const res = await fetch("/api/market-overview");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  const marketData = marketQuery.data;

  const data = dashQuery.data;
  const isLoading = dashQuery.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;
  const recentActivity = data?.recentActivity ?? [];
  const liveSignals = data?.liveSignals ?? [];

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K` : `$${n.toFixed(2)}`;
  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  const nav = useCallback((to: string) => navigate({ to: to as any }), [navigate]);

  return (
    <div style={{ background: "var(--color-background)", color: "var(--color-foreground)", minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Stats Bar — show market data when portfolio is empty */}
      <StatsRow stats={[
        { label: tradeCount > 0 ? "Portfolio" : "BTC", value: tradeCount > 0 ? fmt(totalValue) : (marketData?.stats ? `$${marketData.stats.btcPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "..."), color: "var(--color-primary)", icon: tradeCount > 0 ? "💰" : "₿", sub: tradeCount > 0 ? undefined : (marketData?.stats ? `${marketData.stats.btcChange >= 0 ? "+" : ""}${marketData.stats.btcChange.toFixed(1)}%` : undefined) },
        { label: tradeCount > 0 ? "PnL" : "ETH", value: tradeCount > 0 ? (isLoading ? "..." : pnlFmt(totalPnl)) : (marketData?.stats ? `$${marketData.stats.ethPrice.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "..."), color: tradeCount > 0 ? (totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)") : ((marketData?.stats?.ethChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"), icon: "📈", sub: tradeCount > 0 ? (totalPnlPct > 0 ? `+${totalPnlPct.toFixed(1)}%` : `${totalPnlPct.toFixed(1)}%`) : (marketData?.stats ? `${marketData.stats.ethChange >= 0 ? "+" : ""}${marketData.stats.ethChange.toFixed(1)}%` : undefined) },
        { label: tradeCount > 0 ? "Trades" : "SOL", value: tradeCount > 0 ? (isLoading ? "..." : String(tradeCount)) : (marketData?.stats ? `$${marketData.stats.solPrice.toFixed(2)}` : "..."), color: tradeCount > 0 ? "var(--color-primary)" : ((marketData?.stats?.solChange ?? 0) >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"), icon: "📊", sub: tradeCount > 0 ? undefined : (marketData?.stats ? `${marketData.stats.solChange >= 0 ? "+" : ""}${marketData.stats.solChange.toFixed(1)}%` : undefined) },
        { label: "Signals", value: isLoading ? "..." : String(liveSignals.length), color: "var(--color-neutral-wait)", icon: "⚡" },
      ]} />

      {/* ── Market Overview Card (always visible) ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <CardHeader title="Market Overview" icon="🌍" action={{ label: "Discover", onClick: () => nav("/discover") }} />
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {marketQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} style={{ padding: "6px 12px" }}><SkeletonRow /></div>
                ))
              : marketData?.tokens && marketData.tokens.length > 0
                ? marketData.tokens.map((t) => <MarketTokenRow key={t.symbol} t={t} />)
                : <div style={{ padding: "20px 12px", textAlign: "center" }}>
                    <EmptyState icon="🌍" title="Market Unavailable" message="Unable to fetch market data. Pull down to retry." />
                  </div>
              }
          </div>
        </Card>
      </div>

      {/* 3-Column Grid — responsive: 3 cols desktop, 1 col mobile */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "6px", padding: "6px",
      }}>
        {/* ── Column 1: Portfolio + Holdings + Activity ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Portfolio Summary */}
          <Card>
            <div style={{ padding: "14px 12px" }}>
              <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: "var(--color-foreground)" }}>
                {isLoading ? "..." : fmt(totalValue)}
              </div>
              {tradeCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                  }}>
                    {pnlFmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>{tradeCount} trades</span>
                </div>
              )}
            </div>
          </Card>

          {/* Holdings */}
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHeader title="Holdings" action={{ label: "View All", onClick: () => nav("/bags") }} />
            <ScrollArea style={{ flex: 1 }}>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
                : holdings.length > 0
                  ? holdings.map((h) => <HoldingRow key={h.symbol} h={h} onClick={() => nav("/bags")} />)
                  : (
                    <div style={{ padding: "24px 12px", textAlign: "center" }}>
                      <EmptyState icon="🏛️" title="No Holdings" message="Start trading to see your holdings here" />
                    </div>
                  )
              }
            </ScrollArea>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader title="Recent Activity" action={{ label: "History", onClick: () => nav("/pnl") }} />
            <ScrollArea style={{ maxHeight: "200px" }}>
              {isLoading ? null : recentActivity.length > 0
                ? recentActivity.map((a, i) => (
                  <DataRow key={i}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: "12px", flexShrink: 0 }}>{a.type === "buy" ? "🟢" : "🔴"}</span>
                        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.msg}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        {a.pnl && (
                          <span style={{
                            fontSize: "12px", fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: a.type === "sell" ? "var(--color-bearish)" : "var(--color-bullish)",
                          }}>
                            {a.pnl}
                          </span>
                        )}
                        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>{a.time}</span>
                      </div>
                    </div>
                  </DataRow>
                ))
                : <EmptyState icon="📋" title="No Activity" message="Your recent trades and actions will appear here" />
              }
            </ScrollArea>
          </Card>
        </div>

        {/* ── Column 2: Signals + Quick Actions ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Live Signals */}
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title="Live Signals"
              icon="⚡"
              action={{ label: "All Signals", onClick: () => nav("/signals") }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 12px 0" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-bullish)", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>AI-Powered</span>
            </div>
            <ScrollArea style={{ flex: 1, padding: "4px 0" }}>
              {isLoading
                ? <div style={{ padding: "30px 0" }}><SkeletonRow /><SkeletonRow /><SkeletonRow /></div>
                : liveSignals.length > 0
                  ? liveSignals.map((s) => <SignalRow key={s.token + s.type} s={s} />)
                  : <EmptyState icon="📡" title="No Signals" message="AI signal generation is in progress. Check back soon." />
              }
            </ScrollArea>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader title="Quick Actions" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", padding: "6px" }}>
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label} onClick={() => nav(a.to)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                    padding: "10px 4px", borderRadius: "6px", cursor: "pointer",
                    background: "var(--color-card-hover)", border: `1px solid ${"var(--color-border)"}`,
                    color: "var(--color-muted-foreground)", fontSize: "12px", fontWeight: 500,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "color-mix(in oklab, var(--color-foreground) 6%, transparent)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card-hover)"; e.currentTarget.style.borderColor = "var(--color-border)"; }}
                >
                  <span style={{ fontSize: "16px" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* ── Column 3: Analyses + Stats ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Latest Analyses */}
          <Card style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <CardHeader
              title="Latest Analyses"
              icon="🔬"
              action={{ label: "Analyze", onClick: () => nav("/analyze") }}
            />
            <ScrollArea style={{ flex: 1 }}>
              {isLoading
                ? <div style={{ padding: "20px 0" }}><SkeletonRow /><SkeletonRow /></div>
                : liveSignals.length > 0
                  ? liveSignals.map((s, i) => (
                    <DataRow key={i} onClick={() => nav("/signals")}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                        <span style={{ fontSize: "12px", marginTop: "1px", color: "var(--color-muted-foreground)", flexShrink: 0, width: "14px" }}>{i + 1}.</span>
                        <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)", lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700, color: s.type === "BUY" ? "var(--color-bullish)" : s.type === "SELL" ? "var(--color-bearish)" : "var(--color-neutral-wait)" }}>
                            {s.token}
                          </span>{" "}{s.reason}
                        </span>
                      </div>
                    </DataRow>
                  ))
                  : <EmptyState icon="🧠" title="No Analyses" message="Run your first AI analysis to see results here" />
              }
            </ScrollArea>
          </Card>

          {/* Mini Stats Grid */}
          <Card>
            <CardHeader title="Stats" icon="📊" />
            <div style={{ padding: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {[
                { label: "Total Trades", value: String(tradeCount), color: "var(--color-primary)" },
                { label: "Holdings", value: String(holdings.length), color: "var(--color-info)" },
                { label: "Signals", value: String(liveSignals.length), color: "var(--color-neutral-wait)" },
                { label: "PnL", value: pnlFmt(totalPnl), color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)" },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "10px 8px", background: "var(--color-card-hover)", borderRadius: "6px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                    {s.label}
                  </div>
                  <div style={{
                    fontSize: "14px", fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace", color: s.color, marginTop: "2px",
                  }}>
                    {isLoading ? "..." : s.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}