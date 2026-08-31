import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getDashboardData } from "@/shared/data";
import { useLivePrices } from "@/shared/market-data/use-live-prices";
import {
  PageLayout,
  PageScrollArea,
  StatsRow,
  PageSectionTitle,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";
import { BarChart2, TrendingUp, TrendingDown, ChevronRight, Zap, Activity } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Trader Dashboard — VIXOR" }] }),
  component: TraderDashboard,
});

// ── Mock Data ──────────────────────────────────────────────────────────────────

const RECENT_TRADES = [
  { id: "t1", pair: "BTC/USDT", dir: "LONG", pnl: +420, pnlPct: +2.1, time: "14:32" },
  { id: "t2", pair: "ETH/USDT", dir: "SHORT", pnl: -85, pnlPct: -0.9, time: "13:15" },
  { id: "t3", pair: "SOL/USDT", dir: "LONG", pnl: +310, pnlPct: +4.3, time: "11:50" },
  { id: "t4", pair: "BNB/USDT", dir: "LONG", pnl: +178, pnlPct: +1.6, time: "10:22" },
  { id: "t5", pair: "XRP/USDT", dir: "SHORT", pnl: -42, pnlPct: -0.5, time: "09:05" },
];

const QUICK_ACTIONS = [
  { id: "chart", label: "Open Chart", icon: BarChart2, path: "/trade/chart" },
  { id: "signals", label: "View Signals", icon: Activity, path: "/trade/signals" },
  { id: "pnl", label: "Track PnL", icon: TrendingUp, path: "/trade/pnl" },
  { id: "desk", label: "Trade Desk", icon: Zap, path: "/trade/" },
];

const DAILY_CHALLENGE = {
  title: "Execute 3 profitable trades today",
  progress: 2,
  total: 3,
  xp: 150,
  desc: "2 of 3 targets completed",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function pnlColor(val: number) {
  return val >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";
}

function pnlSign(val: number) {
  return val >= 0 ? "+" : "";
}

function formatMoney(val: number) {
  return `${pnlSign(val)}$${Math.abs(val).toLocaleString()}`;
}

// ── Component ──────────────────────────────────────────────────────────────────

function TraderDashboard() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const [goldPulse, setGoldPulse] = useState(false);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-vixor"],
    queryFn: () => fetchDashboard({}),
    staleTime: 30_000,
  });

  // Live prices
  const { getPrice } = useLivePrices({
    pairs: ["BTC/USDT", "ETH/USDT", "SOL/USDT"],
  });
  const btc = getPrice("BTC/USDT");
  const eth = getPrice("ETH/USDT");
  const sol = getPrice("SOL/USDT");

  // Subtle gold pulse animation on mount
  useEffect(() => {
    const t = setTimeout(() => setGoldPulse(true), 800);
    return () => clearTimeout(t);
  }, []);

  const stats = [
    {
      label: "Portfolio",
      value: "$24,830",
      color: "var(--color-foreground)",
      sub: "Total Value",
      icon: "💼",
    },
    {
      label: "Daily PnL",
      value: "+$781",
      color: "var(--color-bullish)",
      sub: "+3.24%",
      icon: "📈",
    },
    {
      label: "Win Rate",
      value: "72%",
      color: "var(--gold, #F0C419)",
      sub: "Last 30 trades",
      icon: "🎯",
    },
    {
      label: "Positions",
      value: "3",
      color: "var(--color-foreground)",
      sub: "Active now",
      icon: "⚡",
    },
  ];

  const marketPairs = [
    {
      pair: "BTC/USDT",
      price: btc?.price ?? "94,230",
      change: btc?.change24h ?? +2.4,
      symbol: "₿",
    },
    {
      pair: "ETH/USDT",
      price: eth?.price ?? "3,285",
      change: eth?.change24h ?? -0.8,
      symbol: "Ξ",
    },
    {
      pair: "SOL/USDT",
      price: sol?.price ?? "184.50",
      change: sol?.change24h ?? +5.2,
      symbol: "◎",
    },
  ];

  return (
    <PageLayout
      title="TRADER DASHBOARD"
      badge="ACTIVE"
      badgeColor="var(--gold, #F0C419)"
      loading={dashboardQuery.isLoading}
    >
      {/* Stats Row */}
      <StatsRow stats={stats} />

      <PageScrollArea>
        {/* ── Market Brief ──────────────────────────────────────────────────── */}
        <PageSectionTitle title="Market Brief" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "1px",
            background: "var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {marketPairs.map((m) => {
            const isUp = Number(m.change) >= 0;
            return (
              <div
                key={m.pair}
                style={{
                  background: "var(--color-card)",
                  padding: "10px 12px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                    letterSpacing: "0.04em",
                    marginBottom: "4px",
                  }}
                >
                  {m.symbol} {m.pair}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: "var(--color-foreground)",
                    marginBottom: "3px",
                  }}
                >
                  ${typeof m.price === "number" ? m.price.toLocaleString() : m.price}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                  }}
                >
                  {isUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {pnlSign(Number(m.change))}{Math.abs(Number(m.change)).toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Daily Challenge ───────────────────────────────────────────────── */}
        <PageSectionTitle title="Daily Challenge" />
        <div
          style={{
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
            padding: "14px 16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: "10px",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                  marginBottom: "3px",
                }}
              >
                {DAILY_CHALLENGE.title}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                {DAILY_CHALLENGE.desc}
              </div>
            </div>
            <div
              style={{
                background: "color-mix(in srgb, var(--gold, #F0C419) 12%, transparent)",
                border: "1px solid color-mix(in srgb, var(--gold, #F0C419) 30%, transparent)",
                borderRadius: "8px",
                padding: "4px 10px",
                textAlign: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  fontFamily: "var(--font-mono)",
                  color: "var(--gold, #F0C419)",
                }}
              >
                +{DAILY_CHALLENGE.xp}
              </div>
              <div
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: "var(--gold, #F0C419)",
                  letterSpacing: "0.06em",
                }}
              >
                XP
              </div>
            </div>
          </div>
          {/* Progress Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                flex: 1,
                height: "6px",
                background: "var(--color-border)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${(DAILY_CHALLENGE.progress / DAILY_CHALLENGE.total) * 100}%`,
                  height: "100%",
                  background: "var(--gold, #F0C419)",
                  borderRadius: "3px",
                  transition: "width 0.6s ease",
                }}
              />
            </div>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                fontFamily: "var(--font-mono)",
                color: "var(--gold, #F0C419)",
                whiteSpace: "nowrap",
              }}
            >
              {DAILY_CHALLENGE.progress}/{DAILY_CHALLENGE.total}
            </span>
          </div>
        </div>

        {/* ── Recent Trades ─────────────────────────────────────────────────── */}
        <PageSectionTitle title="Recent Trades" count={RECENT_TRADES.length} />
        {RECENT_TRADES.map((trade) => (
          <DataRow key={trade.id} leftAccent={trade.pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
              }}
            >
              {/* Left: pair + direction */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {trade.pair}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                    <PageBadge
                      label={trade.dir}
                      color={trade.dir === "LONG" ? "var(--color-bullish)" : "var(--color-bearish)"}
                      small
                    />
                    <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                      {trade.time}
                    </span>
                  </div>
                </div>
              </div>
              {/* Right: PnL */}
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: 700,
                    fontFamily: "var(--font-mono)",
                    color: pnlColor(trade.pnl),
                  }}
                >
                  {formatMoney(trade.pnl)}
                </div>
                <div
                  style={{
                    fontSize: "11px",
                    fontFamily: "var(--font-mono)",
                    color: pnlColor(trade.pnlPct),
                    marginTop: "2px",
                  }}
                >
                  {pnlSign(trade.pnlPct)}{Math.abs(trade.pnlPct).toFixed(1)}%
                </div>
              </div>
            </div>
          </DataRow>
        ))}

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <PageSectionTitle title="Quick Actions" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1px",
            background: "var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action.id}
              id={`quick-action-${action.id}`}
              onClick={() => navigate({ to: action.path as Parameters<typeof navigate>[0]["to"] })}
              style={{
                background: "var(--color-card)",
                border: "none",
                padding: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                minHeight: "56px",
                transition: "background 0.15s ease",
                textAlign: "left",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-card-hover)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--color-card)";
              }}
            >
              <action.icon size={16} color="var(--gold, #F0C419)" />
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "var(--color-foreground)",
                  flex: 1,
                }}
              >
                {action.label}
              </span>
              <ChevronRight size={14} color="var(--color-muted-foreground)" />
            </button>
          ))}
        </div>

        {/* Bottom clearance for nav bar */}
        <div style={{ height: "28px" }} />
      </PageScrollArea>
    </PageLayout>
  );
}

export default TraderDashboard;
