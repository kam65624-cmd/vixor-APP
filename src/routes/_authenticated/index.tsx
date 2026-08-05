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
import { Card, CardGradientOverlay } from "@/components/ui/card";
import { MOXI_QUICK_ACTIONS } from "@/domains/moxi/types";
import { AnimatedNumber } from "@/components/vixor/animations/AnimatedNumber";
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
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Compass,
  Signal,
  Wallet,
} from "lucide-react";
import { motion } from "framer-motion";

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
      <div className="w-full border-y border-[var(--color-border-subtle)] bg-[var(--color-card)] py-2">
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
    <div className="relative w-full overflow-hidden border-y border-[var(--color-border-subtle)] bg-[var(--color-card)]">
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

// ─── Market Stat Pill — V6 Premium ──────────────────────────────────────────

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
    <div className="flex-1 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 transition-all hover:border-primary/20 hover:shadow-[var(--shadow-card-glow)]">
      <CardGradientOverlay />
      <div className="relative flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `color-mix(in srgb, ${accent} 10%, transparent)` }}
        >
          <Icon size={14} style={{ color: accent }} />
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            {label}
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-16 mt-1" />
          ) : (
            <div className="text-[14px] font-bold font-mono text-foreground truncate mt-0.5">
              {value || "—"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Top Mover Mini Card — V6 Enhanced ──────────────────────────────────────

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
      className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left w-full"
    >
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-[10px] font-bold"
        style={{
          background: isUp ? "var(--bullish-bg)" : "var(--bearish-bg)",
          color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
          border: `1px solid ${isUp ? "var(--bullish-border)" : "var(--bearish-border)"}`,
        }}
      >
        {item.symbol.slice(0, 2)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-bold text-foreground">{item.symbol}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold font-mono text-foreground/80">{fmtPrice(price)}</div>
        <div
          className={`text-[10px] font-bold font-mono flex items-center justify-end gap-0.5 ${isUp ? "text-bullish" : "text-bearish"}`}
        >
          {isUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
          {isUp ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      </div>
    </button>
  );
}

// ─── Feature Card — V6 Premium with hover glow ─────────────────────────────

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
    <motion.button
      onClick={() => navigate({ to: to as any })}
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={"vx-card group relative w-full p-4 text-left overflow-hidden rounded-2xl"}
      style={{
        background: "color-mix(in srgb, " + accent + " 6%, var(--color-card))",
        border: "1px solid color-mix(in srgb, " + accent + " 15%, transparent)",
        cursor: "pointer",
      }}
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-lg z-10"
          style={{
            background: "color-mix(in srgb, " + accent + " 12%, transparent)",
            color: accent,
            border: "1px solid color-mix(in srgb, " + accent + " 20%, transparent)",
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform duration-200 group-hover:scale-110"
        style={{
          background: "color-mix(in srgb, " + accent + " 10%, transparent)",
          border: "1px solid color-mix(in srgb, " + accent + " 15%, transparent)",
          boxShadow: "0 0 20px color-mix(in srgb, " + accent + " 8%, transparent)",
        }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="relative z-10 text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
        {title}
      </div>
      <div className="relative z-10 text-[11px] text-muted-foreground mt-0.5">{desc}</div>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MOXI Hero Section — V6 Premium Glassmorphism
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
    <div className="mx-4 mt-4 relative overflow-hidden rounded-2xl p-5 vx-hero-gradient">
      {/* Background glow orbs — enhanced V6 */}
      <div
        className="absolute -right-20 -top-20 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(99, 102, 241, 0.12) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute -left-12 -bottom-12 w-40 h-40 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(139, 92, 246, 0.08) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(240, 185, 11, 0.04) 0%, transparent 70%)",
        }}
      />

      {/* MOXI Greeting */}
      <div className="relative flex items-center gap-2.5 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className="text-base font-extrabold text-white"
              style={{
                background: "var(--gradient-hero)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MOXI
            </span>
            <LiveDot size={6} />
            <span className="text-[10px] font-bold uppercase tracking-[0.1em] px-2 py-0.5 rounded-lg bg-white/[0.06] border border-white/[0.08] text-foreground/50">
              AI
            </span>
          </div>
          <div className="text-[13px] text-foreground/60 leading-relaxed">{getMoxiGreeting()}</div>
          <div className="text-xs text-foreground/30 mt-1.5">
            {getGreeting()}, <span className="text-foreground/50 font-semibold">{userName}</span>
          </div>
        </div>
      </div>

      {/* Chat Input — V6 glassmorphic */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Ask MOXI anything about the market..."
          className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 pr-11 text-[13px] text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/30 focus:bg-white/[0.07] focus:shadow-[var(--shadow-glow)] transition-all"
        />
        <button
          onClick={handleSubmit}
          disabled={!inputValue.trim()}
          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-primary/20 text-primary hover:bg-primary/30 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <Send size={14} />
        </button>
      </div>

      {/* Quick Prompt Chips — V6 refined */}
      <div className="relative flex flex-wrap gap-2 mt-3">
        {MOXI_QUICK_ACTIONS.slice(0, 4).map((action) => {
          const ActionIcon = QUICK_ACTION_ICONS[action.icon] || Sparkles;
          return (
            <button
              key={action.id}
              onClick={() => onSendPrompt(action.prompt)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all text-left"
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

// ─── Artistic Insight Card — V6 Premium with gradients, glow orbs, actions ──

function InsightCard({
  title,
  description,
  type,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  type: "bullish" | "bearish" | "neutral" | "alert";
  actionLabel?: string;
  onAction?: () => void;
}) {
  const config = {
    bullish: {
      color: "var(--color-bullish)",
      gradient: "from-[rgba(34,211,166,0.1)] via-transparent to-transparent",
      borderColor: "rgba(34,211,166,0.2)",
      glowColor: "rgba(34,211,166,0.15)",
      Icon: TrendingUp,
      badge: "BULLISH",
    },
    bearish: {
      color: "var(--color-bearish)",
      gradient: "from-[rgba(251,70,103,0.1)] via-transparent to-transparent",
      borderColor: "rgba(251,70,103,0.2)",
      glowColor: "rgba(251,70,103,0.15)",
      Icon: ArrowDownRight,
      badge: "BEARISH",
    },
    neutral: {
      color: "var(--color-primary)",
      gradient: "from-[rgba(99,102,241,0.1)] via-transparent to-transparent",
      borderColor: "rgba(99,102,241,0.2)",
      glowColor: "rgba(99,102,241,0.15)",
      Icon: Bot,
      badge: "NEUTRAL",
    },
    alert: {
      color: "var(--color-neutral-wait)",
      gradient: "from-[rgba(245,158,11,0.1)] via-transparent to-transparent",
      borderColor: "rgba(245,158,11,0.2)",
      glowColor: "rgba(245,158,11,0.15)",
      Icon: AlertTriangle,
      badge: "ALERT",
    },
  };

  const c = config[type];
  const TypeIcon = c.Icon;

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className={"relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br " + c.gradient}
      style={{ border: "1px solid " + c.borderColor, boxShadow: "0 8px 40px " + c.glowColor }}
    >
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-[60px] animate-pulse pointer-events-none"
        style={{ background: c.glowColor }}
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className="p-2.5 rounded-2xl"
              style={{
                background: "color-mix(in srgb, " + c.color + " 12%, transparent)",
                border: "1px solid " + c.borderColor,
                boxShadow: "0 0 24px " + c.glowColor,
              }}
            >
              <TypeIcon size={18} style={{ color: c.color, strokeWidth: 2.2 }} />
            </div>
            <div>
              <h4 className="text-[13px] font-bold text-foreground">{title}</h4>
              <span className="text-[10px] flex items-center gap-1" style={{ color: c.color }}>
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: c.color }}
                />
                {type === "bullish"
                  ? "Strong signal"
                  : type === "alert"
                    ? "High alert"
                    : "Monitoring"}
              </span>
            </div>
          </div>
          <span
            className="px-3 py-1 text-[10px] font-bold rounded-full"
            style={{
              background: "color-mix(in srgb, " + c.color + " 12%, transparent)",
              color: c.color,
              border: "1px solid " + c.borderColor,
            }}
          >
            {c.badge}
          </span>
        </div>
        <p
          className="text-[12px] leading-relaxed"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {description}
        </p>
        {actionLabel && (
          <motion.button
            onClick={onAction}
            whileTap={{ scale: 0.95 }}
            className="mt-4 px-5 py-2 text-[11px] font-bold rounded-xl flex items-center gap-2 cursor-pointer"
            style={{ background: c.color, color: "white", boxShadow: "0 4px 20px " + c.glowColor }}
          >
            <Zap size={12} />
            {actionLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
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

  // Handle MOXI prompt
  const handleMoxiPrompt = useCallback(
    (prompt: string) => {
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

      {/* ── Market Overview Stats — V6 Premium Cards ─────────────── */}
      <div className="mx-4 mt-5 flex gap-3">
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

      {/* ── AI Insight Cards — V6 Premium ────────────────────────── */}
      <div className="mx-4 mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
        <InsightCard
          title="Market Momentum Detected"
          description="Strong buying pressure across SOL ecosystem. Volume surge 180% above 24h average."
          type="bullish"
          actionLabel="Analyze"
          onAction={() => handleMoxiPrompt("Analyze SOL ecosystem momentum")}
        />
        <InsightCard
          title="Whale Activity Alert"
          description="Large transfers detected on ETH. Monitor for potential market impact in next 4-8 hours."
          type="alert"
          actionLabel="Track"
          onAction={() => navigate({ to: "/pulse" })}
        />
      </div>

      {/* ── Top Movers — V6 Card ──────────────────────────────────── */}
      {overview && (overview.topGainers?.length || overview.topLosers?.length) && (
        <div className="mx-4 mt-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                Top Movers
              </span>
            </div>
            <button
              onClick={() => navigate({ to: "/discover" as any })}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary font-semibold transition-colors"
            >
              Discover <ChevronRight size={11} />
            </button>
          </div>
          <Card
            variant="default"
            padding="none"
            className="divide-y divide-[var(--color-border-subtle)]"
          >
            {(overview.topGainers ?? []).slice(0, 3).map((item) => (
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
          </Card>
        </div>
      )}

      {/* ── Quick Actions Grid — V6 Premium ─────────────────────────── */}
      <div className="mx-4 mt-5">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-primary" />
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            Quick Actions
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureCard
            icon={Compass}
            title="Discover"
            desc="Trending tokens"
            to="/discover"
            accent="var(--color-primary)"
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
            icon={Signal}
            title="Signals"
            desc="AI signals"
            to="/signals"
            accent="var(--color-gold)"
          />
          <FeatureCard
            icon={Wallet}
            title="Wallet"
            desc="Connect & trade"
            to="/wallet-web3"
            accent="var(--color-primary)"
          />
          <FeatureCard
            icon={LineChart}
            title="Charts"
            desc="Live trading"
            to="/charts"
            accent="var(--color-bullish)"
            badge="LIVE"
          />
          <FeatureCard
            icon={Radio}
            title="Radar"
            desc="Market scanner"
            to="/radar"
            accent="var(--color-bullish)"
            badge="LIVE"
          />
          <FeatureCard
            icon={PieChart}
            title="PnL"
            desc="Track trades"
            to="/pnl"
            accent="var(--color-primary)"
          />
          <FeatureCard
            icon={Crown}
            title="Premium"
            desc="Pro analytics"
            to="/premium"
            accent="var(--color-gold)"
          />
        </div>
      </div>

      {/* ── Premium Upgrade Card — V6 Gold Glow ──────────────────────── */}
      <div className="mx-4 mt-5">
        <Card variant="premium" className="flex items-center justify-between">
          <CardGradientOverlay />
          <div className="relative flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[var(--gold-bg)] border border-[var(--gold-border)]">
              <Crown size={18} className="text-[var(--color-gold)]" />
            </div>
            <div>
              <h3 className="text-[13px] font-bold text-foreground">Premium</h3>
              <p className="text-[11px] text-muted-foreground">Exclusive signals & analytics</p>
            </div>
          </div>
          <button
            onClick={() => navigate({ to: "/premium" })}
            className="relative px-4 py-2 bg-[var(--color-gold)] text-black text-[11px] font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[var(--shadow-gold-glow)]"
          >
            Upgrade
          </button>
        </Card>
      </div>

      {/* ── Market Error Fallback ──────────────────────────────── */}
      {marketQuery.isError && !marketData && (
        <div className="mx-4 mt-5 vx-card p-5 text-center">
          <RefreshCw size={20} className="text-foreground/20 mx-auto mb-2" />
          <p className="text-xs text-muted-foreground font-medium">Unable to load market data</p>
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
