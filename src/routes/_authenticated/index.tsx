import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  StatsRow,
  DataRow,
  ScrollArea,
  EmptyState,
  SkeletonRow,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

const QUICK_ACTIONS = [
  { label: "Analyze Chart", icon: "🔬", to: "/analyze" as const, color: "var(--color-bullish)" },
  { label: "Charts", icon: "📊", to: "/charts" as const, color: "var(--color-info)" },
  { label: "Signals", icon: "📡", to: "/signals" as const, color: "var(--color-bullish)" },
  { label: "Copilot", icon: "🤖", to: "/copilot" as const, color: "var(--color-info)" },
  { label: "PnL Tracker", icon: "📈", to: "/pnl" as const, color: "var(--color-bullish)" },
  {
    label: "Settings",
    icon: "⚙️",
    to: "/settings" as const,
    color: "var(--color-muted-foreground)",
  },
];

// ── Sparkline ──────────────────────────────────────────────────────────────
const MiniSpark = memo(function MiniSpark({ up, small }: { up: boolean; small?: boolean }) {
  const w = small ? 48 : 60,
    h = small ? 16 : 20;
  const pts: string[] = [];
  const start = up ? 30 : 70,
    end = up ? 70 : 30;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * w,
      progress = i / 12;
    const base = start + (end - start) * progress;
    const noise = Math.sin(i * 2.3) * 8 + Math.cos(i * 1.7) * 5;
    const y = Math.max(2, Math.min(h - 2, h - base - noise));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={up ? "var(--color-bullish)" : "var(--color-bearish)"}
        strokeWidth="1.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
});

// ── Dashboard Card ─────────────────────────────────────────────────────────
function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: "8px",
        border: `1px solid ${"var(--color-border)"}`,
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  title,
  action,
  icon,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  icon?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderBottom: `1px solid ${"var(--color-border)"}`,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        {icon && <span style={{ fontSize: "13px" }}>{icon}</span>}
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>
          {title}
        </span>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--color-primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {action.label} →
        </button>
      )}
    </div>
  );
}

// ── Holding Row ────────────────────────────────────────────────────────────
function HoldingRow({
  h,
  onClick,
}: {
  h: { symbol: string; value: number; pnlPct: number; up: boolean; amount: number };
  onClick: () => void;
}) {
  const fmt = (n: number) =>
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(2)}K`
        : `$${n.toFixed(2)}`;

  return (
    <DataRow onClick={onClick} leftAccent={h.up ? "var(--color-bullish)" : "var(--color-bearish)"}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              flexShrink: 0,
              background: h.up
                ? `color-mix(in oklab, var(--color-bullish) 8%, transparent)`
                : `color-mix(in oklab, var(--color-bearish) 8%, transparent)`,
              border: `1px solid ${h.up ? `color-mix(in oklab, var(--color-bullish) 19%, transparent)` : `color-mix(in oklab, var(--color-bearish) 19%, transparent)`}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: 800,
              color: h.up ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            {h.symbol.slice(0, 2)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-foreground)" }}>
              {h.symbol}
            </div>
            <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
              {h.amount.toFixed(2)} tokens
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", flexShrink: 0, marginLeft: "8px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--color-foreground)",
            }}
          >
            {fmt(h.value)}
          </div>
          <div
            style={{
              fontSize: "12px",
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: h.up ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            {h.pnlPct >= 0 ? "+" : ""}
            {h.pnlPct.toFixed(1)}%
          </div>
        </div>
      </div>
    </DataRow>
  );
}

// ── Signal Row ─────────────────────────────────────────────────────────────
function SignalRow({
  s,
}: {
  s: { token: string; type: string; reason: string; confidence: number; up?: boolean };
}) {
  const isBuy = s.type === "BUY";
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "7px 12px",
        margin: "3px 4px",
        borderRadius: "6px",
        cursor: "pointer",
        background: isBuy ? `${"var(--color-bullish)"}08` : `${"var(--color-bearish)"}08`,
        border: `1px solid ${isBuy ? `color-mix(in oklab, var(--color-bullish) 10%, transparent)` : `color-mix(in oklab, var(--color-bearish) 10%, transparent)`}`,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.background = isBuy
          ? `${"var(--color-bullish)"}14`
          : `${"var(--color-bearish)"}14`)
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.background = isBuy
          ? `${"var(--color-bullish)"}08`
          : `${"var(--color-bearish)"}08`)
      }
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 800,
            padding: "2px 5px",
            borderRadius: "3px",
            background: isBuy ? `${"var(--color-bullish)"}25` : `${"var(--color-bearish)"}25`,
            color: isBuy ? "var(--color-bullish)" : "var(--color-bearish)",
            flexShrink: 0,
          }}
        >
          {s.type}
        </span>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            flexShrink: 0,
          }}
        >
          {s.token}
        </span>
        <span
          style={{
            fontSize: "12px",
            color: "var(--color-muted-foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {s.reason}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
          marginLeft: "8px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 800,
            fontFamily: "'JetBrains Mono', monospace",
            width: "28px",
            textAlign: "right",
            color: "var(--color-neutral-wait)",
          }}
        >
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
    n >= 1_000_000
      ? `$${(n / 1_000_000).toFixed(2)}M`
      : n >= 1_000
        ? `$${(n / 1_000).toFixed(2)}K`
        : `$${n.toFixed(2)}`;
  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  const nav = useCallback((to: string) => navigate({ to: to as any }), [navigate]);

  return (
    <div
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        minHeight: "100%",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: "6px",
      }}
    >
      {/* ── Stats Bar ── */}
      <StatsRow
        stats={[
          {
            label: "Portfolio",
            value: isLoading ? "..." : fmt(totalValue),
            color: "var(--color-primary)",
            icon: "💰",
            sub: tradeCount > 0 ? `${tradeCount} trades` : undefined,
          },
          {
            label: "PnL",
            value: isLoading ? "..." : pnlFmt(totalPnl),
            color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
            icon: "📈",
            sub:
              totalPnlPct !== undefined && tradeCount > 0
                ? `${totalPnlPct >= 0 ? "+" : ""}${totalPnlPct.toFixed(1)}%`
                : undefined,
          },
          {
            label: "Holdings",
            value: isLoading ? "..." : String(holdings.length),
            color: "var(--color-info)",
            icon: "🏛️",
          },
          {
            label: "Signals",
            value: isLoading ? "..." : String(liveSignals.length),
            color: "var(--color-neutral-wait)",
            icon: "⚡",
          },
        ]}
      />

      {/* ── Portfolio Summary Card ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <div style={{ padding: "14px 12px" }}>
            <div
              style={{
                fontSize: "12px",
                color: "var(--color-muted-foreground)",
                marginBottom: "4px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Total Portfolio Value
            </div>
            <div
              style={{
                fontSize: "24px",
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1,
                color: "var(--color-foreground)",
              }}
            >
              {isLoading ? "..." : fmt(totalValue)}
            </div>
            {tradeCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px" }}>
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                  }}
                >
                  {pnlFmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}
                  {totalPnlPct.toFixed(1)}%)
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                  {tradeCount} trades
                </span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── Quick Actions Grid ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <CardHeader title="Quick Actions" icon="🚀" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "4px",
              padding: "6px",
            }}
          >
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.label}
                onClick={() => nav(a.to)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                  padding: "12px 4px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: "var(--color-card-hover)",
                  border: `1px solid ${"var(--color-border)"}`,
                  color: "var(--color-foreground)",
                  fontSize: "12px",
                  fontWeight: 600,
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    "color-mix(in oklab, var(--color-foreground) 6%, transparent)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--color-card-hover)";
                  e.currentTarget.style.borderColor = "var(--color-border)";
                }}
              >
                <span style={{ fontSize: "18px" }}>{a.icon}</span>
                {a.label}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Live Signals Card ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <CardHeader
            title="Live Signals"
            icon="⚡"
            action={{ label: "All Signals", onClick: () => nav("/signals") }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 12px 0" }}>
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "var(--color-bullish)",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
              AI-Powered
            </span>
          </div>
          <ScrollArea style={{ maxHeight: "220px", padding: "4px 0" }}>
            {isLoading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonRow />
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : liveSignals.length > 0 ? (
              liveSignals.slice(0, 5).map((s) => <SignalRow key={s.token + s.type} s={s} />)
            ) : (
              <EmptyState
                icon="📡"
                title="No Signals"
                message="AI signal generation is in progress. Check back soon."
              />
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* ── Latest Analyses Card ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <CardHeader
            title="Latest Analyses"
            icon="🔬"
            action={{ label: "Analyze", onClick: () => nav("/analyze") }}
          />
          <ScrollArea style={{ maxHeight: "180px" }}>
            {isLoading ? (
              <div style={{ padding: "20px 0" }}>
                <SkeletonRow />
                <SkeletonRow />
              </div>
            ) : liveSignals.length > 0 ? (
              liveSignals.slice(0, 5).map((s, i) => (
                <DataRow key={i} onClick={() => nav("/signals")}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        marginTop: "1px",
                        color: "var(--color-muted-foreground)",
                        flexShrink: 0,
                        width: "14px",
                      }}
                    >
                      {i + 1}.
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--color-muted-foreground)",
                        lineHeight: 1.4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            s.type === "BUY"
                              ? "var(--color-bullish)"
                              : s.type === "SELL"
                                ? "var(--color-bearish)"
                                : "var(--color-neutral-wait)",
                        }}
                      >
                        {s.token}
                      </span>{" "}
                      {s.reason}
                    </span>
                  </div>
                </DataRow>
              ))
            ) : (
              <EmptyState
                icon="🧠"
                title="No Analyses"
                message="Run your first AI analysis to see results here"
              />
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* ── Holdings Card (if user has trades) ── */}
      {holdings.length > 0 && (
        <div style={{ padding: "0 6px" }}>
          <Card>
            <CardHeader
              title="Holdings"
              action={{ label: "View All", onClick: () => nav("/bags") }}
            />
            <ScrollArea style={{ maxHeight: "200px" }}>
              {holdings.map((h) => (
                <HoldingRow key={h.symbol} h={h} onClick={() => nav("/bags")} />
              ))}
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* ── Recent Activity Card ── */}
      {recentActivity.length > 0 && (
        <div style={{ padding: "0 6px" }}>
          <Card>
            <CardHeader
              title="Recent Activity"
              action={{ label: "History", onClick: () => nav("/pnl") }}
            />
            <ScrollArea style={{ maxHeight: "180px" }}>
              {recentActivity.map((a, i) => (
                <DataRow key={i}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flex: 1,
                        minWidth: 0,
                      }}
                    >
                      <span style={{ fontSize: "12px", flexShrink: 0 }}>
                        {a.type === "buy" ? "🟢" : "🔴"}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--color-muted-foreground)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {a.msg}
                      </span>
                    </div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}
                    >
                      {a.pnl && (
                        <span
                          style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            fontFamily: "'JetBrains Mono', monospace",
                            color:
                              a.type === "sell" ? "var(--color-bearish)" : "var(--color-bullish)",
                          }}
                        >
                          {a.pnl}
                        </span>
                      )}
                      <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                        {a.time}
                      </span>
                    </div>
                  </div>
                </DataRow>
              ))}
            </ScrollArea>
          </Card>
        </div>
      )}

      {/* ── Mini Stats Grid ── */}
      <div style={{ padding: "0 6px" }}>
        <Card>
          <CardHeader title="Stats" icon="📊" />
          <div
            style={{ padding: "8px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}
          >
            {[
              { label: "Total Trades", value: String(tradeCount), color: "var(--color-primary)" },
              { label: "Holdings", value: String(holdings.length), color: "var(--color-info)" },
              {
                label: "Signals",
                value: String(liveSignals.length),
                color: "var(--color-neutral-wait)",
              },
              {
                label: "PnL",
                value: pnlFmt(totalPnl),
                color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
              },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: "10px 8px",
                  background: "var(--color-card-hover)",
                  borderRadius: "6px",
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: s.color,
                    marginTop: "2px",
                  }}
                >
                  {isLoading ? "..." : s.value}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
