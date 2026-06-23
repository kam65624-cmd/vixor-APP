import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { THEME, StatsRow, DataRow, ScrollArea, EmptyState, SkeletonRow } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  { label: "Discover", icon: "🔍", to: "/discover" as const, color: THEME.green },
  { label: "AI Copilot", icon: "🤖", to: "/copilot" as const, color: THEME.purple },
  { label: "Whale Alerts", icon: "🐋", to: "/whale" as const, color: THEME.green },
  { label: "PnL Tracker", icon: "📊", to: "/pnl" as const, color: THEME.green },
  { label: "Alpha Signals", icon: "⚡", to: "/alpha" as const, color: THEME.amber },
  { label: "My Bags", icon: "🏛️", to: "/bags" as const, color: THEME.pink },
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
        stroke={up ? THEME.green : THEME.red}
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
      background: THEME.surface, borderRadius: "8px",
      border: `1px solid ${THEME.border}`, overflow: "hidden", ...style,
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
      padding: "8px 12px", borderBottom: `1px solid ${THEME.border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ fontSize: "11px" }}>{icon}</span>}
        <span style={{ fontSize: "11px", fontWeight: 700, color: THEME.text }}>{title}</span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: "9px", fontWeight: 600, color: THEME.accent,
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
    <DataRow onClick={onClick} leftAccent={h.up ? THEME.green : THEME.red}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div style={{
            width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0,
            background: h.up ? `${THEME.green}15` : `${THEME.red}15`,
            border: `1px solid ${h.up ? `${THEME.green}30` : `${THEME.red}30`}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "8px", fontWeight: 800, color: h.up ? THEME.green : THEME.red,
          }}>
            {h.symbol.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: THEME.text }}>{h.symbol}</div>
            <div style={{ fontSize: "9px", color: THEME.textSecondary }}>
              {h.amount.toFixed(2)} tokens
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: THEME.text }}>
            {fmt(h.value)}
          </div>
          <div style={{
            fontSize: "10px", fontWeight: 600,
            fontFamily: "'JetBrains Mono', monospace",
            color: h.up ? THEME.green : THEME.red,
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
        background: isBuy ? `${THEME.green}08` : `${THEME.red}08`,
        border: `1px solid ${isBuy ? `${THEME.green}18` : `${THEME.red}18`}`,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = isBuy ? `${THEME.green}14` : `${THEME.red}14`)}
      onMouseLeave={(e) => (e.currentTarget.style.background = isBuy ? `${THEME.green}08` : `${THEME.red}08`)}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: "8px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
          background: isBuy ? `${THEME.green}25` : `${THEME.red}25`,
          color: isBuy ? THEME.green : THEME.red, flexShrink: 0,
        }}>{s.type}</span>
        <span style={{ fontSize: "11px", fontWeight: 700, color: THEME.text, flexShrink: 0 }}>{s.token}</span>
        <span style={{ fontSize: "9px", color: THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
        <span style={{ fontSize: "11px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", width: "28px", textAlign: "right", color: THEME.amber }}>
          {s.confidence}%
        </span>
        <MiniSpark up={isBuy} small />
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
    <div style={{ background: THEME.bg, color: THEME.text, minHeight: "100%", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Stats Bar */}
      <StatsRow stats={[
        { label: "Portfolio", value: fmt(totalValue), color: THEME.accent, icon: "💰" },
        { label: "PnL", value: isLoading ? "..." : pnlFmt(totalPnl), color: totalPnl >= 0 ? THEME.green : THEME.red, icon: "📈", sub: totalPnlPct > 0 ? `+${totalPnlPct.toFixed(1)}%` : `${totalPnlPct.toFixed(1)}%` },
        { label: "Trades", value: isLoading ? "..." : String(tradeCount), color: THEME.accent, icon: "📊" },
        { label: "Signals", value: isLoading ? "..." : String(liveSignals.length), color: THEME.amber, icon: "⚡" },
      ]} />

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
              <div style={{ fontSize: "10px", color: THEME.textSecondary, marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Total Portfolio Value
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, color: THEME.text }}>
                {isLoading ? "..." : fmt(totalValue)}
              </div>
              {tradeCount > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                  <span style={{
                    fontSize: "12px", fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: totalPnl >= 0 ? THEME.green : THEME.red,
                  }}>
                    {pnlFmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
                  </span>
                  <span style={{ fontSize: "9px", color: THEME.textMuted }}>{tradeCount} trades</span>
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
                        <span style={{ fontSize: "10px", flexShrink: 0 }}>{a.type === "buy" ? "🟢" : "🔴"}</span>
                        <span style={{ fontSize: "10px", color: THEME.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.msg}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                        {a.pnl && (
                          <span style={{
                            fontSize: "10px", fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: a.type === "sell" ? THEME.red : THEME.green,
                          }}>
                            {a.pnl}
                          </span>
                        )}
                        <span style={{ fontSize: "8px", color: THEME.textMuted }}>{a.time}</span>
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
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: THEME.green, animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "9px", color: THEME.textMuted }}>AI-Powered</span>
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
                    background: THEME.surfaceAlt, border: `1px solid ${THEME.border}`,
                    color: THEME.textSecondary, fontSize: "10px", fontWeight: 500,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = THEME.rowHoverStrong; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = THEME.surfaceAlt; e.currentTarget.style.borderColor = THEME.border; }}
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
                        <span style={{ fontSize: "10px", marginTop: "1px", color: THEME.textMuted, flexShrink: 0, width: "14px" }}>{i + 1}.</span>
                        <span style={{ fontSize: "10px", color: THEME.textSecondary, lineHeight: 1.4 }}>
                          <span style={{ fontWeight: 700, color: s.type === "BUY" ? THEME.green : s.type === "SELL" ? THEME.red : THEME.amber }}>
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
                { label: "Total Trades", value: String(tradeCount), color: THEME.accent },
                { label: "Holdings", value: String(holdings.length), color: THEME.purple },
                { label: "Signals", value: String(liveSignals.length), color: THEME.amber },
                { label: "PnL", value: pnlFmt(totalPnl), color: totalPnl >= 0 ? THEME.green : THEME.red },
              ].map((s) => (
                <div key={s.label} style={{
                  padding: "10px 8px", background: THEME.surfaceAlt, borderRadius: "6px", textAlign: "center",
                }}>
                  <div style={{ fontSize: "8px", color: THEME.textMuted, textTransform: "uppercase", letterSpacing: "0.05em" }}>
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