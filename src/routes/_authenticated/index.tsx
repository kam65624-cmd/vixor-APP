import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getDashboardData,
  getHomeMarketData,
  getDailySignals,
  getWatchlistData,
  getMoxiInsights,
} from "@/shared/data";
import type { HomeMarketData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMe } from "@/domains/user/functions";
import { LiveDot } from "@/components/vixor/LiveDot";
import { MiniSparkline } from "@/components/vixor/MiniSparkline";
import { SignalBadge } from "@/components/vixor/SignalBadge";
import { TrendArrow } from "@/components/vixor/TrendArrow";
import { MoxiAvatar } from "@/components/vixor/MoxiAvatar";
import { AlertTriangle, Info, Zap, ShieldAlert, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — AI Chart Analysis" }] }),
  component: HomePage,
});

// ── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000
      ? `$${(n / 1_000).toFixed(2)}K`
      : `$${n.toFixed(2)}`;

const pnlColor = (n: number) => (n >= 0 ? "var(--color-bullish)" : "var(--color-bearish)");

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getDateString(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// ── Skeleton Components ────────────────────────────────────────────────────

function SkeletonLine({
  width = "100%",
  height = 16,
}: {
  width?: string | number;
  height?: number;
}) {
  return (
    <div
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height,
        borderRadius: height / 2,
        background: "var(--color-muted)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function CardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "40%" : "70%"} />
      ))}
    </div>
  );
}

// ── Card Wrapper ───────────────────────────────────────────────────────────

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: "12px",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────

function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px 8px",
      }}
    >
      <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
        {title}
      </span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "var(--color-primary)",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px 0",
          }}
        >
          {action.label} &rarr;
        </button>
      )}
    </div>
  );
}

// ── 1. Market Ticker Bar ───────────────────────────────────────────────────

const MarketTickerBar = memo(function MarketTickerBar({ data }: { data?: HomeMarketData }) {
  if (!data?.tickers?.length) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: 12,
        padding: "8px 16px",
        overflowX: "auto",
        scrollbarWidth: "none",
        msOverflowStyle: "none",
      }}
      className="market-ticker"
    >
      {data.tickers.map((t) => (
        <div
          key={t.symbol}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
            {t.symbol}
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: "var(--color-foreground)",
            }}
          >
            $
            {t.price >= 1
              ? t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })
              : t.price.toFixed(4)}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              fontFamily: "'JetBrains Mono', monospace",
              color: pnlColor(t.change24h),
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <TrendArrow direction={t.change24h >= 0 ? "up" : "down"} size={10} />
            {t.change24h >= 0 ? "+" : ""}
            {t.change24h.toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  );
});

// ── 2. Contextual Greeting ─────────────────────────────────────────────────

function GreetingSection({
  displayName,
  points,
  isPremium,
  signalCount,
}: {
  displayName: string;
  points: number;
  isPremium: boolean;
  signalCount: number;
}) {
  return (
    <div style={{ padding: "0 16px" }}>
      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 8 }}>
        {getDateString()}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          color: "var(--color-foreground)",
          marginTop: 2,
          lineHeight: 1.2,
        }}
      >
        {getGreeting()}, {displayName}
      </div>
      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)", marginTop: 4 }}>
        {isPremium ? "Premium Member" : `${points} points`}
        {signalCount > 0 && (
          <span style={{ marginLeft: 8, color: "var(--color-bullish)" }}>
            {signalCount} active signal{signalCount > 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}

// ── 3. Portfolio Hero Card ─────────────────────────────────────────────────

function PortfolioHeroCard({
  totalValue,
  totalPnl,
  totalPnlPct,
  tradeCount,
  winRate,
  assetCount,
  isLoading,
}: {
  totalValue: number;
  totalPnl: number;
  totalPnlPct: number;
  tradeCount: number;
  winRate: number;
  assetCount: number;
  isLoading: boolean;
}) {
  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  return (
    <Card>
      <div style={{ padding: "16px" }}>
        {/* Top: Total Value + PnL */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
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
              Portfolio Value
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1.1,
                color: "var(--color-foreground)",
                marginTop: 4,
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
                Total PnL
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: pnlColor(totalPnl),
                  marginTop: 4,
                }}
              >
                {pnlFmt(totalPnl)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: pnlColor(totalPnl),
                }}
              >
                {totalPnlPct >= 0 ? "+" : ""}
                {totalPnlPct.toFixed(1)}%
              </div>
            </div>
          )}
        </div>

        {/* Bottom: Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 8,
            marginTop: 14,
            padding: "10px 0 0",
            borderTop: "1px solid var(--color-border)",
          }}
        >
          {[
            {
              label: "Win Rate",
              value: `${winRate}%`,
              color: winRate >= 50 ? "var(--color-bullish)" : "var(--color-bearish)",
            },
            { label: "Trades", value: String(tradeCount), color: "var(--color-info)" },
            { label: "Assets", value: String(assetCount), color: "var(--color-primary)" },
            {
              label: "Avg PnL",
              value:
                tradeCount > 0
                  ? (totalPnl >= 0 ? "+" : "") + (totalPnl / tradeCount).toFixed(1) + "%"
                  : "—",
              color: pnlColor(totalPnl / Math.max(tradeCount, 1)),
            },
          ].map((s) => (
            <div key={s.label}>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  fontWeight: 500,
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: s.color,
                  marginTop: 2,
                }}
              >
                {s.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// ── 4. Primary CTA ─────────────────────────────────────────────────────────

function PrimaryCTA({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        minHeight: 56,
        borderRadius: 12,
        background: "var(--gradient-bullish)",
        border: "1px solid color-mix(in srgb, var(--color-bullish) 30%, transparent)",
        color: "white",
        fontWeight: 700,
        fontSize: 15,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        cursor: "pointer",
        padding: "14px 20px",
        transition: "transform 0.15s, box-shadow 0.15s",
        boxShadow: "0 4px 20px color-mix(in srgb, var(--color-bullish) 20%, transparent)",
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = "scale(0.98)";
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
        <circle cx="12" cy="13" r="3" />
      </svg>
      <div style={{ textAlign: "left" }}>
        <div style={{ lineHeight: 1.2 }}>Analyze Chart with AI</div>
        <div style={{ fontSize: 12, fontWeight: 500, opacity: 0.85, marginTop: 2 }}>
          SMC / ICT / Liquidity Analysis
        </div>
      </div>
    </button>
  );
}

// ── 5. Quick Actions (reduced to 3) ────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Discover", icon: "🔍", to: "/discover" as const, desc: "Browse markets" },
  { label: "Copilot", icon: "🤖", to: "/copilot" as const, desc: "AI assistant" },
  { label: "PnL Tracker", icon: "📈", to: "/pnl" as const, desc: "Performance" },
];

function QuickActionsGrid({ nav }: { nav: (to: string) => void }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 8,
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
            gap: 6,
            padding: "16px 8px 14px",
            borderRadius: 10,
            cursor: "pointer",
            background: "var(--color-card-hover)",
            border: "1px solid var(--color-border)",
            color: "var(--color-foreground)",
            minHeight: 44,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor =
              "color-mix(in srgb, var(--color-primary) 30%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--color-border)";
          }}
        >
          <span style={{ fontSize: 24 }}>{a.icon}</span>
          <span style={{ fontSize: 12, fontWeight: 600 }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── 6. Active Signals ──────────────────────────────────────────────────────

function ActiveSignalsSection({
  signals,
  nav,
}: {
  signals: Array<{
    token: string;
    type: string;
    reason: string;
    confidence: number;
    price: string;
  }>;
  nav: (to: string) => void;
}) {
  if (!signals.length) return null;

  const displaySignals = signals.slice(0, 2);

  return (
    <Card>
      <SectionHeader
        title="Active Signals"
        action={{ label: "View All", onClick: () => nav("/signals") }}
      />
      <div style={{ padding: "0 12px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
        {displaySignals.map((s, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px",
              borderRadius: 10,
              background: "var(--color-card-hover)",
              border: "1px solid var(--color-border)",
            }}
          >
            <SignalBadge signal={(s.type as any) || "WAIT"} size="sm" variant="icon-only" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--color-foreground)" }}>
                {s.token}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.reason}
              </div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', monospace",
                  color:
                    s.type === "BUY" || s.type === "STRONG_BUY"
                      ? "var(--color-bullish)"
                      : s.type === "SELL" || s.type === "STRONG_SELL"
                        ? "var(--color-bearish)"
                        : "var(--color-muted-foreground)",
                }}
              >
                {s.confidence}%
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--color-muted-foreground)",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                {s.price}
              </div>
            </div>
            <LiveDot
              color={
                s.type === "BUY" || s.type === "STRONG_BUY"
                  ? "bull"
                  : s.type === "SELL" || s.type === "STRONG_SELL"
                    ? "bear"
                    : "neutral"
              }
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 7. Watchlist Section ───────────────────────────────────────────────────

function WatchlistSection({
  items,
  nav,
}: {
  items: Array<{
    id: string;
    symbol: string | null;
    pair: string | null;
  }>;
  nav: (to: string) => void;
}) {
  if (!items.length) return null;

  return (
    <Card>
      <SectionHeader title="Watchlist" />
      <div
        style={{
          padding: "0 12px 12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {items.slice(0, 5).map((item) => {
          const sym = item.symbol || item.pair?.split("/")[0] || "???";
          return (
            <button
              key={item.id}
              onClick={() => nav(`/token/${sym}`)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 8px",
                borderRadius: 8,
                cursor: "pointer",
                background: "transparent",
                border: "none",
                color: "var(--color-foreground)",
                width: "100%",
                minHeight: 44,
                textAlign: "left",
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600 }}>{sym}</span>
              <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
                {item.pair || sym}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── 8. Market Sentiment ────────────────────────────────────────────────────

function MarketSentimentCard({ fearGreed }: { fearGreed: HomeMarketData["fearGreedIndex"] }) {
  if (!fearGreed) return null;

  const fgiColor =
    fearGreed.value >= 60
      ? "var(--color-bullish)"
      : fearGreed.value <= 40
        ? "var(--color-bearish)"
        : "var(--color-info)";

  return (
    <Card>
      <SectionHeader title="Market Sentiment" />
      <div style={{ padding: "0 16px 14px" }}>
        {/* Fear & Greed Gauge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", fontWeight: 500 }}>
              Fear & Greed Index
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: fgiColor,
                  lineHeight: 1,
                }}
              >
                {fearGreed.value}
              </span>
              <span style={{ fontSize: 13, fontWeight: 600, color: fgiColor }}>
                {fearGreed.label}
              </span>
            </div>
            {fearGreed.change !== 0 && (
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: "'JetBrains Mono', monospace",
                  color: pnlColor(fearGreed.change),
                  marginTop: 2,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <TrendArrow direction={fearGreed.change >= 0 ? "up" : "down"} size={10} />
                {fearGreed.change >= 0 ? "+" : ""}
                {fearGreed.change} vs yesterday
              </div>
            )}
          </div>
          {/* Simple bar gauge */}
          <div
            style={{
              width: 8,
              height: 48,
              borderRadius: 4,
              background: "var(--color-muted)",
              position: "relative",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: `${fearGreed.value}%`,
                borderRadius: 4,
                background: `linear-gradient(to top, var(--color-bearish), var(--color-info), var(--color-bullish))`,
                transition: "height 0.5s ease",
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── 9. Recent Trades ───────────────────────────────────────────────────────

function RecentTradesSection({
  trades,
  nav,
}: {
  trades: Array<{ msg: string; time: string; type: "buy" | "sell"; pnl: string }>;
  nav: (to: string) => void;
}) {
  if (!trades.length) return null;

  return (
    <Card>
      <SectionHeader
        title="Recent Trades"
        action={{ label: "View All", onClick: () => nav("/pnl") }}
      />
      <div style={{ padding: "0 12px 8px" }}>
        {trades.slice(0, 3).map((t, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 4px",
              borderBottom:
                i < Math.min(trades.length, 3) - 1 ? "1px solid var(--color-border)" : "none",
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
              <TrendArrow direction={t.type === "buy" ? "up" : "down"} size={12} />
              <span
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {t.msg}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
                marginLeft: 8,
              }}
            >
              {t.pnl && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    fontFamily: "'JetBrains Mono', monospace",
                    color: t.type === "sell" ? "var(--color-bearish)" : "var(--color-bullish)",
                  }}
                >
                  {t.pnl}
                </span>
              )}
              <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>{t.time}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── 10. MOXI Insights Section ──────────────────────────────────────────

const INSIGHT_ICONS: Record<string, typeof AlertTriangle> = {
  risk_warning: ShieldAlert,
  signal_update: TrendingUp,
  market_shift: Zap,
  price_alert: AlertTriangle,
  opportunity: Info,
};

const INSIGHT_COLORS: Record<string, string> = {
  critical: "var(--color-bearish)",
  warning: "#FCD535",
  info: "var(--color-primary)",
};

function MoxiInsightsSection({
  insights,
  isLoading,
  nav,
}: {
  insights: Array<{
    type: string;
    title: string;
    body: string;
    severity: string;
    pair?: string;
    detectedAt: string;
  }>;
  isLoading: boolean;
  nav: (to: string) => void;
}) {
  if (isLoading) {
    return (
      <Card style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <SkeletonLine width={28} height={28} />
          <SkeletonLine width={120} height={16} />
        </div>
        <SkeletonLine width="100%" height={14} />
        <SkeletonLine width="80%" height={14} />
      </Card>
    );
  }

  if (!insights || insights.length === 0) return null;

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  return (
    <Card>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "14px 16px 10px",
        }}
      >
        <MoxiAvatar size={24} variant="default" />
        <SectionHeader title="MOXI Insights" />
      </div>
      <div style={{ padding: "0 16px 14px", display: "flex", flexDirection: "column", gap: 8 }}>
        {insights.map((insight, i) => {
          const Icon = INSIGHT_ICONS[insight.type] || Info;
          const color = INSIGHT_COLORS[insight.severity] || "var(--color-primary)";
          return (
            <button
              key={`${insight.type}-${insight.pair || i}`}
              onClick={() => {
                if (insight.pair) nav(`/token/${insight.pair}`);
                else nav("/copilot");
              }}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "10px 12px",
                borderRadius: 10,
                border: `1px solid ${color}22`,
                background: `${color}08`,
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                color: "var(--color-foreground)",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: `${color}18`,
                  flexShrink: 0,
                }}
              >
                <Icon size={14} style={{ color }} />
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--color-foreground)",
                    marginBottom: 2,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  {insight.title}
                  <span
                    style={{
                      fontSize: 10,
                      color: "var(--color-muted-foreground)",
                      fontWeight: 400,
                    }}
                  >
                    {timeAgo(insight.detectedAt)}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--color-muted-foreground)",
                    lineHeight: 1.5,
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {insight.body.replace(/\*\*/g, "").replace(/`/g, "")}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const fetchMe = useStableServerFn(getMe);
  const fetchMarket = useStableServerFn(getHomeMarketData);
  const fetchSignals = useStableServerFn(getDailySignals);
  const fetchWatchlist = useStableServerFn(getWatchlistData);

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

  const marketQuery = useQuery({
    queryKey: ["home-market"],
    queryFn: () => fetchMarket({ data: undefined }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const signalsQuery = useQuery({
    queryKey: ["home-signals"],
    queryFn: () => fetchSignals({}),
    staleTime: 60_000,
  });

  const watchlistQuery = useQuery({
    queryKey: ["home-watchlist"],
    queryFn: () => fetchWatchlist({}),
    staleTime: 60_000,
  });

  const fetchMoxi = useStableServerFn(getMoxiInsights);
  const moxiQuery = useQuery({
    queryKey: ["moxi-insights"],
    queryFn: () => fetchMoxi({}),
    staleTime: 90_000,
    refetchInterval: 180_000,
  });

  const data = dashQuery.data;
  const isLoading = dashQuery.isLoading;
  const user = meQuery.data;
  const displayName = user?.profile?.display_name || user?.profile?.username || "Trader";
  const points = user?.balance.balance ?? 0;
  const isPremium = !!user?.isPremium;

  const marketData = marketQuery.data;
  const signalsData = signalsQuery.data?.signals || [];
  const watchlistItems =
    (watchlistQuery.data as any)?.watchlistItems || (watchlistQuery.data as any)?.items || [];

  // Extract live signals from dashboard
  const liveSignals = data?.liveSignals ?? [];

  const nav = useMemo(() => (to: string) => navigate({ to: to as any }), [navigate]);

  return (
    <div
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
        minHeight: "100%",
        fontFamily: "'Inter', system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingBottom: "calc(60px + env(safe-area-inset-bottom, 0px))",
      }}
    >
      {/* Pulse animation for live dot */}
      <style>{`
        .market-ticker::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 1. Market Ticker Bar */}
      {marketQuery.isLoading ? (
        <div style={{ padding: "8px 16px" }}>
          <SkeletonLine width={200} height={14} />
        </div>
      ) : (
        <MarketTickerBar data={marketData} />
      )}

      {/* 2. Contextual Greeting */}
      {meQuery.isLoading ? (
        <div style={{ padding: "0 16px" }}>
          <SkeletonLine width={180} height={20} />
          <SkeletonLine width={120} height={14} />
        </div>
      ) : (
        <GreetingSection
          displayName={displayName}
          points={points}
          isPremium={isPremium}
          signalCount={liveSignals.length}
        />
      )}

      {/* 3. Portfolio Hero Card */}
      {isLoading ? (
        <CardSkeleton rows={3} />
      ) : (
        <PortfolioHeroCard
          totalValue={data?.totalValue ?? 0}
          totalPnl={data?.totalPnl ?? 0}
          totalPnlPct={data?.totalPnlPct ?? 0}
          tradeCount={data?.tradeCount ?? 0}
          winRate={data?.winRate ?? 0}
          assetCount={data?.assetCount ?? 0}
          isLoading={isLoading}
        />
      )}

      {/* 4. Primary CTA */}
      <PrimaryCTA onClick={() => nav("/analyze")} />

      {/* 5. Quick Actions */}
      <QuickActionsGrid nav={nav} />

      {/* 6. Active Signals */}
      {signalsQuery.isLoading ? (
        <CardSkeleton rows={2} />
      ) : liveSignals.length > 0 ? (
        <ActiveSignalsSection signals={liveSignals} nav={nav} />
      ) : null}

      {/* 7. Watchlist */}
      {watchlistQuery.isLoading ? (
        <CardSkeleton rows={3} />
      ) : watchlistItems.length > 0 ? (
        <WatchlistSection items={watchlistItems} nav={nav} />
      ) : null}

      {/* 8. Market Sentiment */}
      {marketQuery.isLoading ? (
        <CardSkeleton rows={2} />
      ) : (
        <MarketSentimentCard fearGreed={marketData?.fearGreedIndex ?? null} />
      )}

      {/* 9. Recent Trades */}
      {isLoading ? (
        <CardSkeleton rows={3} />
      ) : (data?.recentActivity?.length ?? 0) > 0 ? (
        <RecentTradesSection trades={data?.recentActivity ?? []} nav={nav} />
      ) : null}

      {/* 10. MOXI Insights */}
      <MoxiInsightsSection
        insights={moxiQuery.data ?? []}
        isLoading={moxiQuery.isLoading}
        nav={nav}
      />
    </div>
  );
}
