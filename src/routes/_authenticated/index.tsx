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
      className="bg-white/5 animate-pulse rounded-full"
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height,
      }}
    />
  );
}

function CardSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <Card className="p-5 flex flex-col gap-4 mx-4">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} width={i === 0 ? "40%" : "70%"} height={16} />
      ))}
    </Card>
  );
}

// ── Card Wrapper ───────────────────────────────────────────────────────────

function Card({ children, style, className = "" }: { children: React.ReactNode; style?: React.CSSProperties; className?: string }) {
  return (
    <div
      className={`bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:bg-white/10 ${className}`}
      style={style}
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
    <div className="flex items-center justify-between px-5 pt-5 pb-3">
      <span className="text-[14px] font-bold text-foreground tracking-wide">
        {title}
      </span>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[12px] font-bold text-primary hover:text-white transition-colors bg-transparent border-none cursor-pointer py-1"
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
    <div className="relative w-full border-y border-white/5 bg-white/[0.02] overflow-hidden">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      <div className="flex gap-8 py-3 px-4 overflow-x-auto scrollbar-none items-center market-ticker">
        {data.tickers.map((t) => (
          <div key={t.symbol} className="flex items-center gap-2.5 flex-shrink-0 group cursor-pointer">
            <span className="text-[13px] font-bold text-foreground/90 group-hover:text-white transition-colors">
              {t.symbol}
            </span>
            <span className="text-[13px] font-semibold font-mono text-foreground/80">
              ${t.price >= 1 ? t.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : t.price.toFixed(4)}
            </span>
            <span className={`text-[12px] font-bold font-mono flex items-center gap-1 ${t.change24h >= 0 ? "text-bullish" : "text-bearish"}`}>
              <TrendArrow direction={t.change24h >= 0 ? "up" : "down"} size={12} />
              {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
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
    <div className="px-5 pt-4 pb-1">
      <div className="text-[13px] text-muted-foreground/80 font-semibold tracking-wide uppercase">
        {getDateString()}
      </div>
      <div className="text-[26px] font-extrabold text-foreground mt-1 leading-tight tracking-tight">
        {getGreeting()}, <span className="text-white">{displayName}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-4">
        <span className="bg-white/10 px-3 py-1.5 rounded-full text-[12px] font-bold text-white/90 border border-white/5 backdrop-blur-sm">
          {isPremium ? "💎 Premium" : `${points} points`}
        </span>
        {signalCount > 0 && (
          <span className="bg-bullish/10 text-bullish px-3 py-1.5 rounded-full text-[12px] font-bold flex items-center gap-2 border border-bullish/20 shadow-[0_0_10px_rgba(14,203,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-bullish animate-pulse shadow-[0_0_8px_rgba(14,203,129,0.8)]" />
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
    <div className="mx-4 relative group">
      {/* Subtle animated glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-bullish/20 rounded-2xl blur-xl opacity-40 group-hover:opacity-60 transition duration-500 pointer-events-none" />
      
      <div className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[12px] text-white/60 uppercase tracking-widest font-bold mb-1.5">
                Portfolio Value
              </div>
              <div className="text-[36px] font-extrabold font-mono tracking-tight text-white leading-none drop-shadow-sm">
                {isLoading ? "..." : fmt(totalValue)}
              </div>
            </div>
            {tradeCount > 0 && (
              <div className="text-right">
                <div className="text-[12px] text-white/60 uppercase tracking-widest font-bold mb-1.5">
                  Total PnL
                </div>
                <div className="text-[20px] font-black font-mono leading-none drop-shadow-sm" style={{ color: pnlColor(totalPnl) }}>
                  {pnlFmt(totalPnl)}
                </div>
                <div className="text-[13px] font-bold font-mono bg-white/10 inline-block px-2 py-0.5 rounded-md mt-2 shadow-inner" style={{ color: pnlColor(totalPnl) }}>
                  {totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 mt-8 pt-5 border-t border-white/10">
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
                value: tradeCount > 0 ? (totalPnl >= 0 ? "+" : "") + (totalPnl / tradeCount).toFixed(1) + "%" : "—",
                color: pnlColor(totalPnl / Math.max(tradeCount, 1)),
              },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-[12px] text-white/50 font-semibold mb-1.5 whitespace-nowrap">
                  {s.label}
                </div>
                <div className="text-[15px] font-bold font-mono" style={{ color: s.color }}>
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── 4. Primary CTA ─────────────────────────────────────────────────────────

function PrimaryCTA({ onClick }: { onClick: () => void }) {
  return (
    <div className="mx-4">
      <button
        onClick={onClick}
        className="w-full min-h-[60px] rounded-2xl bg-gradient-to-r from-bullish to-[#0b9c65] border border-bullish/40 text-white font-bold text-[16px] flex items-center justify-center gap-3 px-5 py-3 cursor-pointer transition-all duration-300 hover:scale-[0.98] active:scale-95 shadow-[0_4px_20px_rgba(14,203,129,0.25)] hover:shadow-[0_4px_25px_rgba(14,203,129,0.4)]"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
          <circle cx="12" cy="13" r="3" />
        </svg>
        <div className="text-left">
          <div className="leading-tight font-extrabold text-[15px]">Analyze Chart with AI</div>
          <div className="text-[12px] font-semibold text-white/80 mt-0.5">
            SMC / ICT / Liquidity Analysis
          </div>
        </div>
      </button>
    </div>
  );
}

// ── 5. Quick Actions ───────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: "Discover", icon: "🔍", to: "/discover" as const, desc: "Browse markets" },
  { label: "Copilot", icon: "🤖", to: "/copilot" as const, desc: "AI assistant" },
  { label: "PnL Tracker", icon: "📈", to: "/pnl" as const, desc: "Performance" },
];

function QuickActionsGrid({ nav }: { nav: (to: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3 mx-4">
      {QUICK_ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => nav(a.to)}
          className="flex flex-col items-center justify-center gap-2.5 p-4 rounded-2xl cursor-pointer bg-white/5 border border-white/10 text-foreground min-h-[96px] transition-all duration-300 hover:bg-white/10 hover:border-primary/40 hover:-translate-y-1 group shadow-lg"
        >
          <span className="text-[28px] group-hover:scale-110 transition-transform duration-300">{a.icon}</span>
          <span className="text-[13px] font-bold tracking-wide">{a.label}</span>
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
    <Card className="mx-4">
      <SectionHeader
        title="Active Signals"
        action={{ label: "View All", onClick: () => nav("/signals") }}
      />
      <div className="px-4 pb-4 flex flex-col gap-3">
        {displaySignals.map((s, i) => (
          <div
            key={i}
            className="flex items-center gap-4 p-3.5 rounded-xl bg-black/20 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            onClick={() => nav("/signals")}
          >
            <SignalBadge signal={(s.type as any) || "WAIT"} size="sm" variant="icon-only" />
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-bold text-foreground group-hover:text-white transition-colors">
                {s.token}
              </div>
              <div className="text-[12px] font-medium text-muted-foreground truncate mt-0.5">
                {s.reason}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div
                className="text-[14px] font-bold font-mono"
                style={{
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
              <div className="text-[12px] font-medium text-muted-foreground font-mono mt-0.5">
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
    <Card className="mx-4">
      <SectionHeader title="Watchlist" />
      <div className="px-2 pb-2 flex flex-col gap-1">
        {items.slice(0, 5).map((item) => {
          const sym = item.symbol || item.pair?.split("/")[0] || "???";
          return (
            <button
              key={item.id}
              onClick={() => nav(`/token/${sym}`)}
              className="flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer bg-transparent border-none text-foreground w-full text-left hover:bg-white/10 transition-colors group"
            >
              <span className="text-[14px] font-bold group-hover:text-white transition-colors">{sym}</span>
              <span className="text-[12px] font-medium text-muted-foreground group-hover:text-white/80 transition-colors">
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
    <Card className="mx-4">
      <SectionHeader title="Market Sentiment" />
      <div className="px-5 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[12px] text-muted-foreground font-bold uppercase tracking-widest mb-2">
              Fear & Greed Index
            </div>
            <div className="flex items-baseline gap-3">
              <span
                className="text-[40px] font-black font-mono leading-none tracking-tighter"
                style={{ color: fgiColor }}
              >
                {fearGreed.value}
              </span>
              <span className="text-[15px] font-extrabold uppercase tracking-widest" style={{ color: fgiColor }}>
                {fearGreed.label}
              </span>
            </div>
            {fearGreed.change !== 0 && (
              <div
                className="text-[13px] font-bold font-mono mt-3 flex items-center gap-2"
                style={{ color: pnlColor(fearGreed.change) }}
              >
                <TrendArrow direction={fearGreed.change >= 0 ? "up" : "down"} size={14} />
                {fearGreed.change >= 0 ? "+" : ""}
                {fearGreed.change} vs yesterday
              </div>
            )}
          </div>
          <div className="w-4 h-24 rounded-full bg-black/40 relative overflow-hidden flex-shrink-0 shadow-inner border border-white/5">
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-all duration-1000 ease-out"
              style={{
                height: `${fearGreed.value}%`,
                background: `linear-gradient(to top, var(--color-bearish), var(--color-info), var(--color-bullish))`,
                boxShadow: `0 0 10px ${fgiColor}80`,
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
    <Card className="mx-4">
      <SectionHeader
        title="Recent Trades"
        action={{ label: "View All", onClick: () => nav("/pnl") }}
      />
      <div className="px-4 pb-4">
        {trades.slice(0, 3).map((t, i) => (
          <div
            key={i}
            className={`flex items-center justify-between py-3.5 ${
              i < Math.min(trades.length, 3) - 1 ? "border-b border-white/5" : ""
            }`}
          >
            <div className="flex items-center gap-3.5 flex-1 min-w-0">
              <div className={`p-2 rounded-full flex items-center justify-center ${t.type === 'buy' ? 'bg-bullish/15 text-bullish' : 'bg-bearish/15 text-bearish'}`}>
                <TrendArrow direction={t.type === "buy" ? "up" : "down"} size={14} />
              </div>
              <span className="text-[13px] font-bold text-foreground/90 truncate">
                {t.msg}
              </span>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0 ml-4">
              {t.pnl && (
                <span
                  className="text-[14px] font-bold font-mono"
                  style={{ color: t.type === "sell" ? "var(--color-bearish)" : "var(--color-bullish)" }}
                >
                  {t.pnl}
                </span>
              )}
              <span className="text-[12px] font-medium text-muted-foreground">{t.time}</span>
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
      <Card className="mx-4 p-5">
        <div className="flex items-center gap-3 mb-4">
          <SkeletonLine width={32} height={32} />
          <SkeletonLine width={140} height={18} />
        </div>
        <SkeletonLine width="100%" height={14} />
        <div className="h-2" />
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
    <Card className="mx-4">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 border-b border-white/5">
        <MoxiAvatar size={28} variant="default" />
        <span className="text-[15px] font-bold text-foreground tracking-wide">
          MOXI Insights
        </span>
      </div>
      <div className="px-4 py-4 flex flex-col gap-3">
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
              className="flex gap-4 items-start p-4 rounded-xl cursor-pointer text-left w-full transition-all duration-300 hover:brightness-110 active:scale-[0.99] border border-white/5 shadow-lg"
              style={{
                background: `color-mix(in srgb, ${color} 6%, transparent)`,
                borderColor: `color-mix(in srgb, ${color} 20%, transparent)`,
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner"
                style={{ background: `color-mix(in srgb, ${color} 15%, transparent)` }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-bold text-foreground mb-1.5 flex items-center gap-2 justify-between">
                  <span className="truncate">{insight.title}</span>
                  <span className="text-[12px] text-muted-foreground font-semibold flex-shrink-0">
                    {timeAgo(insight.detectedAt)}
                  </span>
                </div>
                <div className="text-[13px] font-medium text-foreground/80 leading-relaxed line-clamp-2">
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
    <div className="bg-background text-foreground min-h-screen font-sans flex flex-col gap-6 pb-[calc(80px+env(safe-area-inset-bottom,0px))]">
      {/* Pulse animation for live dot & scrollbar hiding */}
      <style>{`
        .market-ticker::-webkit-scrollbar { display: none; }
      `}</style>

      {/* 1. Market Ticker Bar */}
      {marketQuery.isLoading ? (
        <div className="px-4 py-2 border-y border-white/5 bg-white/[0.02]">
          <SkeletonLine width={200} height={16} />
        </div>
      ) : (
        <MarketTickerBar data={marketData} />
      )}

      {/* 2. Contextual Greeting */}
      {meQuery.isLoading ? (
        <div className="px-5 pt-4">
          <SkeletonLine width={200} height={28} />
          <div className="mt-4">
            <SkeletonLine width={140} height={18} />
          </div>
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
