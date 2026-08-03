import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData, getHomeMarketData } from "@/shared/data";
import type { HomeMarketData, HomeTickerItem } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMe } from "@/domains/user/functions";
import { useLivePrices } from "@/shared/market-data";
import { LiveDot } from "@/components/vixor/LiveDot";
import { MoxiCharacter3D } from "@/components/vixor/MoxiCharacter3D";
import { MOXI_QUICK_ACTIONS } from "@/domains/moxi/types";
import {
  TrendingUp,
  Bot,
  Zap,
  ChevronRight,
  LineChart,
  Eye,
  Radio,
  Activity,
  Globe,
  Crown,
  RefreshCw,
  Shield,
  Sparkles,
  Send,
  Target,
  Bell,
  PieChart,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — AI Trading Terminal" }] }),
  component: HomePage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getMoxiGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Burning the midnight oil? Let me check what moved while you slept.";
  if (h < 12) return "Markets are waking up. Here is what I am watching right now.";
  if (h < 17) return "Session is active. Let me catch you up on the moves.";
  return "Wrapping up the session. Here is your end-of-day brief.";
}

function fmtPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  if (p >= 0.001) return `$${p.toFixed(6)}`;
  return `$${p.toFixed(8)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(0)}`;
}

// ─── Skeleton Shimmer ────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-white/[0.04] rounded-lg ${className}`} />;
}

// ─── Icon map for quick action prompts ────────────────────────────────────────

const QUICK_ACTION_ICONS: Record<string, React.ElementType> = {
  Activity,
  Radio,
  Target,
  Bell,
  PieChart,
  Sparkles,
};

// ─── Live Ticker Strip ───────────────────────────────────────────────────────

const TickerItem = memo(function TickerItem({
  symbol,
  price,
  change24h,
}: {
  symbol: string;
  price: number;
  change24h: number;
}) {
  const isUp = change24h >= 0;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 shrink-0">
      <span className="text-xs font-bold text-foreground/70 tracking-wide">{symbol}</span>
      <span className="text-xs font-mono font-semibold text-foreground/90">{fmtPrice(price)}</span>
      <span
        className={`text-xs font-bold font-mono flex items-center gap-0.5 ${isUp ? "text-bullish" : "text-bearish"}`}
      >
        {isUp ? "+" : ""}
        {change24h.toFixed(2)}%
      </span>
    </div>
  );
});

const MarketTicker = memo(function MarketTicker({
  data,
  isLoading,
}: {
  data?: HomeMarketData;
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="w-full border-y border-white/5 bg-[var(--color-card)] py-2">
        <div className="flex gap-6 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-28 shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.tickers?.length) return null;
  const repeated = [...data.tickers, ...data.tickers, ...data.tickers];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/5 bg-[var(--color-card)]">
      <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
      <div className="flex animate-ticker" style={{ animation: "ticker 40s linear infinite" }}>
        {repeated.map((t, i) => (
          <TickerItem key={`${t.symbol}-${i}`} {...t} />
        ))}
      </div>
      <style>{`
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
      `}</style>
    </div>
  );
});

// ─── Market Stat Pill ─────────────────────────────────────────────────────────

function MarketStatPill({
  icon: Icon,
  label,
  value,
  accent = "var(--color-primary)",
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value?: string;
  accent?: string;
  isLoading?: boolean;
}) {
  return (
    <div
      className="flex-1 flex items-center gap-2.5 p-3 rounded-xl"
      style={{
        background: `color-mix(in srgb, ${accent} 6%, var(--color-card))`,
        border: `1px solid color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
      >
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-xs font-semibold uppercase tracking-wider text-foreground/35">
          {label}
        </div>
        {isLoading ? (
          <Skeleton className="h-4 w-16 mt-0.5" />
        ) : (
          <div className="text-[13px] font-bold font-mono text-foreground truncate">
            {value || "—"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top Mover Mini Card ─────────────────────────────────────────────────────

function MoverMini({
  item,
  isGainer,
  livePrice,
}: {
  item: HomeTickerItem;
  isGainer: boolean;
  livePrice?: { price: number; change24h: number };
}) {
  const navigate = useNavigate();
  const price = livePrice?.price ?? item.price;
  const change = livePrice?.change24h ?? item.change24h;
  const isUp = change >= 0;

  return (
    <button
      onClick={() => navigate({ to: "/discover" as any })}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors text-left"
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
        style={{
          background: isUp ? "var(--bullish-bg)" : "var(--bearish-bg)",
          color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
          border: `1px solid ${isUp ? "var(--bullish-border)" : "var(--bearish-border)"}`,
        }}
      >
        {item.symbol.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-foreground/90">{item.symbol}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold font-mono text-foreground/80">{fmtPrice(price)}</div>
        <div
          className={`text-[10px] font-bold font-mono ${isUp ? "text-bullish" : "text-bearish"}`}
        >
          {isUp ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  to,
  accent = "var(--color-primary)",
  badge,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  to: string;
  accent?: string;
  badge?: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: to as any })}
      className="vx-card vx-card-interactive group relative w-full p-3.5 text-left overflow-hidden"
    >
      {badge && (
        <span
          className="absolute top-2.5 right-2.5 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded-md"
          style={{
            background: `color-mix(in srgb, ${accent} 12%, transparent)`,
            color: accent,
            border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-2.5"
        style={{
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
        }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
        {title}
      </div>
      <div className="text-[11px] text-foreground/40 mt-0.5">{desc}</div>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOXI Hero Section
// ══════════════════════════════════════════════════════════════════════════════

function MoxiHero({
  userName,
  onSendPrompt,
}: {
  userName: string;
  onSendPrompt: (prompt: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onSendPrompt(trimmed);
    setInputValue("");
  }, [inputValue, onSendPrompt]);

  return (
    <div
      className="mx-4 mt-4 relative overflow-hidden rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(145deg, color-mix(in srgb, var(--color-primary) 10%, var(--color-card)), color-mix(in srgb, var(--color-primary) 3%, var(--color-card)))",
        border: "1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)",
        boxShadow: "0 0 60px -20px var(--color-primary)",
      }}
    >
      {/* Background glow */}
      <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-primary/[0.04] pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full bg-primary/[0.03] pointer-events-none" />

      {/* MOAI Greeting */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-extrabold text-white">MOXI</span>
            <LiveDot size={6} />
          </div>
          <div className="text-[13px] text-foreground/60 leading-relaxed">{getMoxiGreeting()}</div>
          <div className="text-xs text-foreground/30 mt-1">
            {getGreeting()}, <span className="text-foreground/50 font-semibold">{userName}</span>
          </div>
        </div>
      </div>

      {/* Chat Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask MOXI anything about the market..."
          className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl px-4 py-3 pr-11 text-[13px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/30 focus:bg-white/[0.06] transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Quick Prompt Chips */}
      <div className="relative flex flex-wrap gap-2 mt-3">
        {MOXI_QUICK_ACTIONS.slice(0, 4).map((action) => {
          const ActionIcon = QUICK_ACTION_ICONS[action.icon] || Sparkles;
          return (
            <button
              key={action.id}
              onClick={() => onSendPrompt(action.prompt)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.05] hover:bg-white/[0.07] hover:border-white/[0.08] transition-all text-left"
            >
              <ActionIcon size={11} className="text-primary/60" />
              <span className="text-[11px] text-foreground/50 font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════════════════════

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const fetchMe = useStableServerFn(getMe);
  const fetchMarket = useStableServerFn(getHomeMarketData);

  // Live WebSocket prices for ticker
  const { getPrice } = useLivePrices({
    pairs: [
      "BTC/USDT",
      "ETH/USDT",
      "SOL/USDT",
      "BNB/USDT",
      "XRP/USDT",
      "DOGE/USDT",
      "ADA/USDT",
      "AVAX/USDT",
      "DOT/USDT",
      "LINK/USDT",
    ],
  });

  const dashQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard({}),
    staleTime: 30_000,
    retry: 1,
  });

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({}),
    staleTime: 60_000,
    retry: 1,
  });

  const marketQuery = useQuery({
    queryKey: ["home-market"],
    queryFn: () => fetchMarket({ data: undefined }),
    staleTime: 60_000,
    refetchInterval: 60_000,
    retry: 2,
  });

  const marketData = marketQuery.data;
  const user = meQuery.data;
  const overview = marketData?.marketOverview ?? undefined;

  const getLivePriceForSymbol = useCallback(
    (symbol: string) => {
      const binanceSymbol = `${symbol}USDT`;
      const live = getPrice(binanceSymbol);
      if (live) return { price: live.price, change24h: live.change24h };
      return undefined;
    },
    [getPrice],
  );

  // Handle MOXI prompt — opens MOXI chat via speech bubble
  const handleMoxiPrompt = useCallback(
    (prompt: string) => {
      // MOXI interaction is handled via the 3D character speech bubble on the home page
      // For now, navigate to analyze page with the prompt as a query
      if (prompt) {
        navigate({ to: "/analyze", search: { q: prompt } } as any);
      }
    },
    [navigate],
  );

  const userName = user?.profile?.display_name || user?.profile?.username || "Trader";

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-foreground font-sans pb-28">
      {/* ── 3D MOXI Side Character ──────────────────────────── */}
      <MoxiCharacter3D onChatOpen={() => handleMoxiPrompt("")} />

      {/* ── MOXI Hero ──────────────────────────────────────────── */}
      <MoxiHero userName={userName} onSendPrompt={handleMoxiPrompt} />

      {/* ── Live Market Ticker Strip ────────────────────────────── */}
      <div className="mt-4">
        <MarketTicker data={marketData} isLoading={marketQuery.isLoading} />
      </div>

      {/* ── Market Overview Stats ───────────────────────────────── */}
      <div className="mx-4 mt-4 flex gap-2.5">
        <MarketStatPill
          icon={Activity}
          label="24h Vol"
          value={overview ? formatVolume(overview.totalVolume) : undefined}
          accent="var(--color-primary)"
          isLoading={marketQuery.isLoading}
        />
        <MarketStatPill
          icon={Crown}
          label="BTC Dom"
          value={
            overview && overview.btcDominance > 0
              ? `${overview.btcDominance.toFixed(1)}%`
              : undefined
          }
          accent="var(--color-gold)"
          isLoading={marketQuery.isLoading}
        />
        <MarketStatPill
          icon={Globe}
          label="Fear & Greed"
          value={
            marketData?.fearGreedIndex
              ? `${marketData.fearGreedIndex.value} — ${marketData.fearGreedIndex.label}`
              : undefined
          }
          accent={
            (marketData?.fearGreedIndex?.value ?? 50) >= 60
              ? "var(--color-bullish)"
              : (marketData?.fearGreedIndex?.value ?? 50) <= 30
                ? "var(--color-bearish)"
                : "var(--color-primary)"
          }
          isLoading={marketQuery.isLoading}
        />
      </div>

      {/* ── Top Movers (compact) ──────────────────────────────── */}
      {overview && (overview.topGainers?.length || overview.topLosers?.length) && (
        <div className="mx-4 mt-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
                Top Movers
              </span>
            </div>
            <button
              onClick={() => navigate({ to: "/discover" as any })}
              className="flex items-center gap-1 text-[11px] text-foreground/30 hover:text-primary font-semibold transition-colors"
            >
              Discover <ChevronRight size={11} />
            </button>
          </div>
          <div className="vx-card divide-y divide-[var(--color-border)]">
            {(overview.topGainers ?? []).slice(0, 2).map((item) => (
              <MoverMini
                key={`g-${item.symbol}`}
                item={item}
                isGainer
                livePrice={getLivePriceForSymbol(item.symbol)}
              />
            ))}
            {(overview.topLosers ?? []).slice(0, 2).map((item) => (
              <MoverMini
                key={`l-${item.symbol}`}
                item={item}
                isGainer={false}
                livePrice={getLivePriceForSymbol(item.symbol)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions Grid ─────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <div className="flex items-center gap-2 mb-2.5">
          <Zap size={14} className="text-primary" />
          <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">
            Quick Actions
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2.5">
          <FeatureCard
            icon={LineChart}
            title="Charts"
            desc="Live trading"
            to="/charts"
            badge="LIVE"
          />
          <FeatureCard
            icon={Eye}
            title="Discover"
            desc="Trending tokens"
            to="/discover"
            badge="LIVE"
          />
          <FeatureCard
            icon={Bot}
            title="MOXI AI"
            desc="Market intel"
            to="/alpha"
            accent="var(--color-gold)"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Signals"
            desc="AI signals"
            to="/signals"
            accent="var(--color-gold)"
          />
          <FeatureCard
            icon={Radio}
            title="Radar"
            desc="Market intel"
            to="/radar"
            badge="LIVE"
            accent="var(--color-bullish)"
          />
          <FeatureCard
            icon={Shield}
            title="PnL"
            desc="Track trades"
            to="/pnl"
            accent="var(--color-bullish)"
          />
        </div>
      </div>

      {/* ── Market Error Fallback ──────────────────────────────── */}
      {marketQuery.isError && !marketData && (
        <div className="mx-4 mt-4 vx-card p-5 text-center">
          <RefreshCw size={20} className="text-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-foreground/40 font-medium">Unable to load market data</p>
          <button
            onClick={() => marketQuery.refetch()}
            className="vx-btn vx-btn-sm vx-btn-primary mt-3"
          >
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}
    </div>
  );
}
