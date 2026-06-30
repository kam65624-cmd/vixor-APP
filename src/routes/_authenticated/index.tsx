import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMe } from "@/domains/user/functions";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — AI Chart Analysis" }] }),
  component: HomePage,
});

// ── Quick Actions ──────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label: "Analyze Chart",
    icon: "🔬",
    to: "/analyze" as const,
    color: "var(--color-bullish)",
    desc: "AI-powered SMC/ICT",
  },
  {
    label: "Charts",
    icon: "📊",
    to: "/charts" as const,
    color: "var(--color-info)",
    desc: "Live market charts",
  },
  {
    label: "Signals",
    icon: "📡",
    to: "/signals" as const,
    color: "var(--color-bullish)",
    desc: "AI trade signals",
  },
  {
    label: "Copilot",
    icon: "🤖",
    to: "/copilot" as const,
    color: "var(--color-info)",
    desc: "AI assistant",
  },
  {
    label: "PnL Tracker",
    icon: "📈",
    to: "/pnl" as const,
    color: "var(--color-bullish)",
    desc: "Track performance",
  },
  {
    label: "Settings",
    icon: "⚙️",
    to: "/settings" as const,
    color: "var(--color-muted-foreground)",
    desc: "Preferences",
  },
];

// ── Card Components ────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: "10px",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const fetchMe = useStableServerFn(getMe);

  const dashQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard({}),
    staleTime: 30_000,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({}),
    staleTime: 60_000,
  });

  const data = dashQuery.data;
  const isLoading = dashQuery.isLoading;
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;
  const recentActivity = data?.recentActivity ?? [];

  const user = meQuery.data;
  const displayName = user?.profile?.display_name || user?.profile?.username || "Trader";
  const points = user?.balance.balance ?? 0;
  const isPremium = !!user?.isPremium;

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
        gap: 8,
        padding: "0 8px 32px",
      }}
    >
      {/* ── Welcome Banner ── */}
      <div
        style={{
          padding: "16px 16px 14px",
          background: "linear-gradient(135deg, color-mix(in oklab, var(--color-bullish) 12%, transparent), color-mix(in oklab, var(--color-primary) 8%, transparent))",
          borderRadius: "12px",
          border: "1px solid color-mix(in oklab, var(--color-bullish) 20%, transparent)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>
              Welcome back, {displayName}
            </div>
            <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 2 }}>
              {isPremium ? "✨ Premium Member" : `${points} points available`}
            </div>
          </div>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "color-mix(in oklab, var(--color-primary) 12%, transparent)",
              border: "1px solid color-mix(in oklab, var(--color-primary) 20%, transparent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              fontWeight: 800,
              color: "var(--color-primary)",
            }}
          >
            {displayName.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* ── Portfolio Summary (compact) ── */}
      <Card>
        <div style={{ padding: "14px 14px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  fontWeight: 600,
                }}
              >
                Total Portfolio
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  lineHeight: 1.1,
                  color: "var(--color-foreground)",
                  marginTop: 2,
                }}
              >
                {isLoading ? "..." : fmt(totalValue)}
              </div>
            </div>
            {tradeCount > 0 && (
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted-foreground)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    fontWeight: 600,
                  }}
                >
                  PnL
                </div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                    marginTop: 2,
                  }}
                >
                  {pnlFmt(totalPnl)}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: totalPnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                  }}
                >
                  {totalPnlPct >= 0 ? "+" : ""}
                  {totalPnlPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
          {tradeCount > 0 && (
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: "var(--color-muted-foreground)",
              }}
            >
              {tradeCount} total trades
            </div>
          )}
        </div>
      </Card>

      {/* ── Quick Actions (Primary CTA) ── */}
      <Card>
        <div
          style={{
            padding: "10px 14px 8px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            Quick Actions
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
            padding: 8,
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
                gap: 4,
                padding: "14px 4px 12px",
                borderRadius: 8,
                cursor: "pointer",
                background: "var(--color-card-hover)",
                border: "1px solid var(--color-border)",
                color: "var(--color-foreground)",
                fontSize: 12,
                fontWeight: 600,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background =
                  "color-mix(in oklab, var(--color-foreground) 6%, transparent)";
                e.currentTarget.style.borderColor = "color-mix(in oklab, var(--color-foreground) 10%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-card-hover)";
                e.currentTarget.style.borderColor = "var(--color-border)";
              }}
            >
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <span style={{ lineHeight: 1.2 }}>{a.label}</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 500,
                  color: "var(--color-muted-foreground)",
                  lineHeight: 1.2,
                }}
              >
                {a.desc}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* ── AI Analysis CTA ── */}
      <Card>
        <div style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                background: "color-mix(in oklab, var(--color-bullish) 15%, transparent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                flexShrink: 0,
              }}
            >
              🔬
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>
                AI Chart Analysis
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  marginTop: 2,
                  lineHeight: 1.4,
                }}
              >
                Upload any chart and get instant SMC/ICT analysis with order blocks, FVGs, and liquidity zones.
              </div>
            </div>
          </div>
          <button
            onClick={() => nav("/analyze")}
            style={{
              width: "100%",
              height: 44,
              borderRadius: 8,
              background: "var(--color-bullish)",
              color: "var(--color-foreground)",
              fontWeight: 700,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              border: "none",
              cursor: "pointer",
              marginTop: 12,
            }}
          >
            Start Analyzing
          </button>
        </div>
      </Card>

      {/* ── Recent Activity (compact, only if data exists) ── */}
      {recentActivity.length > 0 && (
        <Card>
          <div
            style={{
              padding: "10px 14px 8px",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
              Recent Activity
            </span>
            <button
              onClick={() => nav("/pnl")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "var(--color-primary)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              View All →
            </button>
          </div>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {recentActivity.slice(0, 4).map((a, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  borderBottom:
                    i < recentActivity.slice(0, 4).length - 1
                      ? "1px solid color-mix(in oklab, var(--color-foreground) 4%, transparent)"
                      : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span style={{ fontSize: 13, flexShrink: 0 }}>
                    {a.type === "buy" ? "🟢" : "🔴"}
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-muted-foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {a.msg}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0, marginLeft: 8 }}>
                  {a.pnl && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        fontFamily: "'JetBrains Mono', monospace",
                        color: a.type === "sell" ? "var(--color-bearish)" : "var(--color-bullish)",
                      }}
                    >
                      {a.pnl}
                    </span>
                  )}
                  <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Account Stats (compact grid) ── */}
      <Card>
        <div
          style={{
            padding: "10px 14px 8px",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
            Account
          </span>
        </div>
        <div
          style={{
            padding: 8,
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 6,
          }}
        >
          {[
            { label: "Points", value: String(points), color: "var(--color-primary)" },
            { label: "Trades", value: String(tradeCount), color: "var(--color-info)" },
            {
              label: "Status",
              value: isPremium ? "Premium" : "Free",
              color: isPremium ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                padding: "12px 8px",
                background: "var(--color-card-hover)",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  fontWeight: 600,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: s.color,
                  marginTop: 2,
                }}
              >
                {isLoading && s.label === "Trades" ? "..." : s.value}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
