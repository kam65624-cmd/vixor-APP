import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useEffect, useState, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData, getHomeMarketData } from "@/shared/data";
import type { HomeMarketData, HomeTickerItem } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMe } from "@/domains/user/functions";
import { useLivePrices } from "@/shared/market-data";
import { LiveDot } from "@/components/vixor/LiveDot";
import {
  TrendingUp,
  BarChart2,
  Scan,
  Bot,
  Zap,
  ChevronRight,
  LineChart,
  Eye,
  AlertCircle,
  Radio,
  Activity,
  Globe,
  Crown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — AI Chart Analysis" }] }),
  component: HomePage,
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
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

function MarketCardSkeleton() {
  return (
    <div className="vx-card p-3.5 flex items-center gap-3">
      <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-3.5 w-14" />
        <Skeleton className="h-3 w-24" />
      </div>
      <div className="text-right space-y-2">
        <Skeleton className="h-3.5 w-20 ml-auto" />
        <Skeleton className="h-3 w-14 ml-auto" />
      </div>
    </div>
  );
}

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
      <span className="text-[11px] font-bold text-foreground/70 tracking-wide">{symbol}</span>
      <span className="text-[11px] font-mono font-semibold text-foreground/90">
        {fmtPrice(price)}
      </span>
      <span
        className={`text-[10px] font-bold font-mono flex items-center gap-0.5 ${isUp ? "text-bullish" : "text-bearish"}`}
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
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
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

// ─── Market Overview Stat Pill ───────────────────────────────────────────────

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
        style={{
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
        }}
      >
        <Icon size={14} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-[9px] font-semibold uppercase tracking-wider text-foreground/35">
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

// ─── Crypto List Item ────────────────────────────────────────────────────────

const CryptoListItem = memo(function CryptoListItem({
  item,
  livePrice,
  rank,
  onClick,
}: {
  item: HomeTickerItem;
  livePrice?: { price: number; change24h: number };
  rank: number;
  onClick?: () => void;
}) {
  const price = livePrice?.price ?? item.price;
  const change = livePrice?.change24h ?? item.change24h;
  const isUp = change >= 0;

  return (
    <button
      onClick={onClick}
      className="vx-card vx-card-interactive w-full flex items-center gap-3 p-3 text-left group"
    >
      {/* Rank */}
      <span className="text-[11px] font-mono text-foreground/25 w-5 text-right shrink-0">
        {rank}
      </span>

      {/* Icon placeholder */}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold"
        style={{
          background: isUp ? "var(--bullish-bg)" : "var(--bearish-bg)",
          color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
          border: `1px solid ${isUp ? "var(--bullish-border)" : "var(--bearish-border)"}`,
        }}
      >
        {item.symbol.slice(0, 2)}
      </div>

      {/* Symbol + Volume */}
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
          {item.symbol}
          <span className="text-[10px] text-foreground/30 font-normal ml-1.5">/USDT</span>
        </div>
        <div className="text-[10px] text-foreground/35 font-mono mt-0.5">
          Vol {formatVolume(item.volume24h || 0)}
        </div>
      </div>

      {/* Price + Change */}
      <div className="text-right shrink-0">
        <div className="text-[13px] font-bold font-mono text-foreground/90">{fmtPrice(price)}</div>
        <div
          className={`text-[11px] font-bold font-mono mt-0.5 flex items-center justify-end gap-0.5 ${isUp ? "text-bullish" : "text-bearish"}`}
        >
          {isUp ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {isUp ? "+" : ""}
          {change.toFixed(2)}%
        </div>
      </div>
    </button>
  );
});

// ─── Top Mover Card ──────────────────────────────────────────────────────────

function MoverCard({
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
      onClick={() => navigate({ to: "/charts" as any })}
      className={`flex items-center justify-between p-3 rounded-xl border transition-all w-full text-left hover:scale-[1.01] active:scale-[0.99] ${
        isGainer
          ? "bg-bullish/[0.04] border-bullish/[0.08] hover:border-bullish/20"
          : "bg-bearish/[0.04] border-bearish/[0.08] hover:border-bearish/20"
      }`}
    >
      <div>
        <div className="text-[13px] font-bold text-foreground">{item.symbol}</div>
        <div className="text-[10px] text-muted-foreground font-mono">{fmtPrice(price)}</div>
      </div>
      <div
        className={`text-[13px] font-bold font-mono flex items-center gap-0.5 ${
          isUp ? "text-bullish" : "text-bearish"
        }`}
      >
        {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {isUp ? "+" : ""}
        {change.toFixed(2)}%
      </div>
    </button>
  );
}

// ─── Signal Row ──────────────────────────────────────────────────────────────

function SignalRow({
  signal,
}: {
  signal: { token: string; type: string; confidence: number; reason: string; price: string };
}) {
  const isBuy = signal.type === "BUY" || signal.type === "STRONG_BUY";
  const isSell = signal.type === "SELL" || signal.type === "STRONG_SELL";
  const color = isBuy ? "var(--color-bullish)" : isSell ? "var(--color-bearish)" : "#6b7280";
  const bg = isBuy
    ? "var(--bullish-bg)"
    : isSell
      ? "var(--bearish-bg)"
      : "color-mix(in srgb, var(--color-foreground) 5%, transparent)";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
        style={{
          background: bg,
          color,
          border: "1px solid color-mix(in srgb, var(--color-foreground) 8%, transparent)",
        }}
      >
        {signal.type === "WAIT" ? "—" : isBuy ? "B" : "S"}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <div className="text-[13px] font-bold text-foreground">{signal.token}</div>
        <div className="text-[11px] text-foreground/50 whitespace-normal leading-snug mt-0.5">
          {signal.reason}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        <div className="text-[13px] font-bold font-mono leading-none mb-1" style={{ color }}>
          {signal.confidence}%
        </div>
        <div className="text-[10px] text-foreground/40 font-mono leading-none">{signal.price}</div>
      </div>
    </div>
  );
}

// ─── Fear & Greed Gauge ──────────────────────────────────────────────────────

function FearGreedGauge({ fearGreed }: { fearGreed: HomeMarketData["fearGreedIndex"] }) {
  if (!fearGreed) return null;
  const { value, label, change } = fearGreed;
  const color =
    value >= 60
      ? "var(--color-bullish)"
      : value >= 40
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg viewBox="0 0 120 70" className="w-24 h-14">
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="color-mix(in srgb, var(--color-foreground) 6%, transparent)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157.08} 157.08`}
          style={{ filter: `drop-shadow(0 0 6px ${color}60)` }}
        />
        <text x="8" y="68" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">
          0
        </text>
        <text x="105" y="68" fill="rgba(255,255,255,0.2)" fontSize="7" fontFamily="monospace">
          100
        </text>
      </svg>
      <div className="text-center">
        <div className="text-xl font-black font-mono" style={{ color }}>
          {value}
        </div>
        <div className="text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
          {label}
        </div>
        {change !== 0 && (
          <div
            className={`text-[10px] font-mono mt-0.5 ${change > 0 ? "text-bullish" : "text-bearish"}`}
          >
            {change > 0 ? "+" : ""}
            {change} vs yesterday
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Feature Card ────────────────────────────────────────────────────────────

function FeatureCard({
  icon: Icon,
  title,
  desc,
  badge,
  to,
  accent,
}: {
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
  to: string;
  accent: string;
}) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate({ to: to as any })}
      className="vx-card vx-card-interactive group relative flex flex-col gap-2.5 p-3.5 text-left w-full hover:scale-[1.01] active:scale-[0.99] transition-transform"
    >
      {badge && (
        <span
          className="absolute top-2.5 right-2.5 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-widest"
          style={{
            background: `color-mix(in srgb, ${accent} 10%, transparent)`,
            color: accent,
            border: `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center"
        style={{
          background: `color-mix(in srgb, ${accent} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 18%, transparent)`,
        }}
      >
        <Icon size={15} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-[13px] font-bold text-foreground group-hover:text-white transition-colors">
          {title}
        </div>
        <div className="text-[10px] text-foreground/45 mt-0.5 leading-relaxed">{desc}</div>
      </div>
    </button>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color = "text-foreground",
  subtext,
}: {
  label: string;
  value: string;
  color?: string;
  subtext?: string;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-foreground/35">
        {label}
      </span>
      <span className={`text-[15px] font-bold font-mono ${color}`}>{value}</span>
      {subtext && <span className="text-[10px] text-foreground/30 font-mono">{subtext}</span>}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

function SectionHeader({
  icon: IconComp,
  title,
  action,
  onAction,
  accent = "var(--color-primary)",
  live,
}: {
  icon?: React.ElementType;
  title: string;
  action?: string;
  onAction?: () => void;
  accent?: string;
  live?: boolean;
}) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {IconComp && <IconComp size={14} style={{ color: accent }} />}
        <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
          {title}
        </span>
        {live && <LiveDot size={6} />}
      </div>
      {action && onAction && (
        <button
          onClick={onAction}
          className="flex items-center gap-1 text-[11px] text-foreground/35 hover:text-foreground/60 transition-colors font-medium"
        >
          {action} <ChevronRight size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const fetchMe = useStableServerFn(getMe);
  const fetchMarket = useStableServerFn(getHomeMarketData);

  // Live WebSocket prices for ticker overlay
  const { getPrice, status: wsStatus } = useLivePrices({
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

  // Server data queries
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

  const data = dashQuery.data;
  const user = meQuery.data;
  const marketData = marketQuery.data;
  const signals = dashQuery.data?.liveSignals ?? [];
  const hasTrades = !!data && (data.tradeCount ?? 0) > 0;
  const overview = marketData?.marketOverview ?? undefined;
  const isLoading = marketQuery.isLoading || dashQuery.isLoading;

  // Merge live WS prices into ticker data
  const getLivePriceForSymbol = useCallback(
    (symbol: string) => {
      const binanceSymbol = `${symbol}USDT`;
      const live = getPrice(binanceSymbol);
      if (live) return { price: live.price, change24h: live.change24h };
      return undefined;
    },
    [getPrice],
  );

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-foreground font-sans pb-28">
      {/* ── Section 1: Top Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <div className="text-[10px] text-foreground/35 font-semibold uppercase tracking-widest">
            {getGreeting()}
          </div>
          <div className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            {meQuery.isLoading ? (
              <Skeleton className="h-6 w-24" />
            ) : (
              <>
                {user?.profile?.display_name || user?.profile?.username || "Trader"}
                {user?.isPremium && (
                  <span className="text-[9px] font-bold bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full">
                    PRO
                  </span>
                )}
              </>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate({ to: "/analyze" as any })}
          className="vx-btn vx-btn-bullish vx-btn-sm"
        >
          <Scan size={14} />
          Analyze
        </button>
      </div>

      {/* ── Section 2: Live Market Ticker Strip ──────────────────── */}
      <MarketTicker data={marketData} isLoading={marketQuery.isLoading} />

      {/* ── Section 3: Market Overview Stats Bar ─────────────────── */}
      <div className="mx-4 mt-4 flex gap-2.5">
        <MarketStatPill
          icon={Activity}
          label="24h Volume"
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
          label="Coins"
          value={marketData ? String(marketData.tickers?.length ?? 0) : undefined}
          accent="var(--color-bullish)"
          isLoading={marketQuery.isLoading}
        />
      </div>

      {/* ── Section 4: Top Movers ────────────────────────────────── */}
      {overview && (overview.topGainers?.length || overview.topLosers?.length) ? (
        <div className="mx-4 mt-4">
          <SectionHeader
            icon={TrendingUp}
            title="Top Movers"
            action="Discover"
            onAction={() => navigate({ to: "/discover" as any })}
            live
          />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="vx-card p-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bullish mb-2 flex items-center gap-1.5">
                <ArrowUpRight size={10} />
                Gainers
              </div>
              <div className="flex flex-col gap-2">
                {(overview.topGainers ?? []).slice(0, 3).map((item) => (
                  <MoverCard
                    key={item.symbol}
                    item={item}
                    isGainer
                    livePrice={getLivePriceForSymbol(item.symbol)}
                  />
                ))}
              </div>
            </div>
            <div className="vx-card p-3">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bearish mb-2 flex items-center gap-1.5">
                <ArrowDownRight size={10} />
                Losers
              </div>
              <div className="flex flex-col gap-2">
                {(overview.topLosers ?? []).slice(0, 3).map((item) => (
                  <MoverCard
                    key={item.symbol}
                    item={item}
                    isGainer={false}
                    livePrice={getLivePriceForSymbol(item.symbol)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : marketQuery.isLoading ? (
        <div className="mx-4 mt-4">
          <Skeleton className="h-4 w-28 mb-3" />
          <div className="grid grid-cols-2 gap-2.5">
            <div className="vx-card p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
            <div className="vx-card p-3 space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* ── Section 5: Live Crypto Prices ────────────────────────── */}
      <div className="mx-4 mt-4">
        <SectionHeader
          icon={LineChart}
          title="Live Prices"
          action="Charts"
          onAction={() => navigate({ to: "/charts" as any })}
          accent="var(--color-primary)"
          live
        />
        <div className="flex flex-col gap-1.5">
          {marketQuery.isLoading
            ? Array.from({ length: 8 }).map((_, i) => <MarketCardSkeleton key={i} />)
            : marketData?.tickers?.map((item, i) => (
                <CryptoListItem
                  key={item.symbol}
                  item={item}
                  rank={i + 1}
                  livePrice={getLivePriceForSymbol(item.symbol)}
                  onClick={() => navigate({ to: "/charts" as any })}
                />
              ))}
        </div>
        {marketQuery.isError && (
          <div className="vx-card p-4 text-center mt-2">
            <RefreshCw size={16} className="text-foreground/30 mx-auto mb-2" />
            <p className="text-[12px] text-foreground/40">Unable to load market data</p>
            <button
              onClick={() => marketQuery.refetch()}
              className="text-[11px] text-primary font-semibold mt-2 hover:underline"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* ── Section 6: Fear & Greed ──────────────────────────────── */}
      {marketData?.fearGreedIndex && (
        <div className="mx-4 mt-4">
          <div className="vx-card p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-[9px] font-bold uppercase tracking-widest text-foreground/35 mb-1">
                Market Sentiment
              </div>
              <div className="text-[13px] font-bold text-foreground/70 mb-1.5">
                Fear & Greed Index
              </div>
              <div className="text-[11px] text-foreground/35">
                Updated daily · measures market emotion
              </div>
              {marketData.fearGreedIndex.value >= 60 ? (
                <div className="mt-2 text-[11px] text-bullish font-semibold">
                  Greed is high — consider taking profits
                </div>
              ) : marketData.fearGreedIndex.value <= 30 ? (
                <div className="mt-2 text-[11px] text-bearish font-semibold">
                  Extreme fear — potential buying opportunity
                </div>
              ) : null}
            </div>
            <FearGreedGauge fearGreed={marketData.fearGreedIndex} />
          </div>
        </div>
      )}

      {/* ── Section 7: Portfolio Overview (conditional) ──────────── */}
      {hasTrades && data && (
        <div className="mx-4 mt-4 vx-card p-4">
          <SectionHeader
            title="Portfolio"
            action="View all"
            onAction={() => navigate({ to: "/pnl" as any })}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              label="Value"
              value={
                data.totalValue >= 1000
                  ? `$${(data.totalValue / 1000).toFixed(1)}K`
                  : `$${data.totalValue.toFixed(0)}`
              }
              color="text-white"
            />
            <StatCard
              label="PnL"
              value={
                data.totalPnl >= 0
                  ? `+$${data.totalPnl.toFixed(0)}`
                  : `-$${Math.abs(data.totalPnl).toFixed(0)}`
              }
              color={data.totalPnl >= 0 ? "text-bullish" : "text-bearish"}
            />
            <StatCard
              label="Win Rate"
              value={`${data.winRate}%`}
              color={data.winRate >= 50 ? "text-bullish" : "text-bearish"}
            />
            <StatCard label="Trades" value={String(data.tradeCount)} color="text-primary" />
          </div>
        </div>
      )}

      {/* ── Section 8: AI Analysis CTA ───────────────────────────── */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate({ to: "/analyze" as any })}
          className="vx-card vx-card-interactive group relative w-full p-5 text-left overflow-hidden hover:scale-[1.005] active:scale-[0.995] transition-transform"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-primary) 15%, var(--color-card)), var(--color-card))",
            border: "1px solid color-mix(in srgb, var(--color-primary) 20%, transparent)",
            boxShadow: "0 0 40px -12px var(--color-primary)",
          }}
        >
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-primary/[0.04] group-hover:scale-125 transition-transform duration-700" />
          <div className="relative flex items-start gap-4">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-primary-glow))",
              }}
            >
              <Sparkles size={20} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs font-bold text-primary uppercase tracking-widest">
                  AI Vision Analysis
                </span>
                <span className="text-[8px] font-bold bg-primary/10 text-primary border border-primary/15 px-1.5 py-0.5 rounded-full">
                  SMC/ICT
                </span>
              </div>
              <div className="text-[15px] font-extrabold text-white leading-tight">
                Upload a chart. Get AI-powered analysis.
              </div>
              <div className="mt-2.5 flex items-center gap-1.5 text-primary text-[11px] font-bold">
                Start analyzing{" "}
                <ChevronRight
                  size={12}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </div>
            </div>
          </div>
        </button>
      </div>

      {/* ── Section 9: Quick Actions Grid ────────────────────────── */}
      <div className="mx-4 mt-4">
        <SectionHeader icon={Zap} title="Quick Actions" />
        <div className="grid grid-cols-3 gap-2.5">
          <FeatureCard
            icon={LineChart}
            title="Charts"
            desc="Live trading charts"
            to="/charts"
            accent="var(--color-primary)"
            badge="LIVE"
          />
          <FeatureCard
            icon={Eye}
            title="Discover"
            desc="Trending tokens"
            to="/discover"
            accent="var(--color-primary)"
            badge="LIVE"
          />
          <FeatureCard
            icon={Bot}
            title="AI Copilot"
            desc="Ask anything"
            to="/copilot"
            accent="var(--color-gold)"
          />
          <FeatureCard
            icon={TrendingUp}
            title="Signals"
            desc="AI trade signals"
            to="/signals"
            accent="var(--color-gold)"
          />
          <FeatureCard
            icon={Radio}
            title="Radar"
            desc="Market intel"
            to="/radar"
            accent="var(--color-bullish)"
            badge="LIVE"
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

      {/* ── Section 10: Active Signals (conditional) ─────────────── */}
      {signals.length > 0 && (
        <div className="mx-4 mt-4">
          <SectionHeader
            icon={Zap}
            title="Active Signals"
            action="All signals"
            onAction={() => navigate({ to: "/signals" as any })}
            accent="var(--color-gold)"
          />
          <div className="vx-card px-4">
            {signals.slice(0, 3).map((s, i) => (
              <SignalRow key={i} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* ── Section 11: Recent Activity (conditional) ────────────── */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="mx-4 mt-4">
          <SectionHeader icon={BarChart2} title="Recent Activity" />
          <div className="vx-card divide-y divide-[var(--color-border)]">
            {data.recentActivity.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      a.type === "buy" ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"
                    }`}
                  >
                    {a.type === "buy" ? "↑" : "↓"}
                  </div>
                  <span className="text-[12px] text-foreground/70 font-medium truncate max-w-[160px]">
                    {a.msg}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  {a.pnl && (
                    <div
                      className={`text-[12px] font-bold font-mono ${a.pnl.startsWith("+") ? "text-bullish" : "text-bearish"}`}
                    >
                      {a.pnl}
                    </div>
                  )}
                  <div className="text-[10px] text-foreground/30">{a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Section 12: Market Data Error Fallback ───────────────── */}
      {marketQuery.isError && !marketData && (
        <div className="mx-4 mt-4 vx-card p-6 text-center">
          <AlertCircle size={24} className="text-foreground/20 mx-auto mb-3" />
          <p className="text-[13px] text-foreground/50 font-medium">Unable to load market data</p>
          <p className="text-[11px] text-foreground/30 mt-1">
            Check your internet connection and try again
          </p>
          <button
            onClick={() => marketQuery.refetch()}
            className="vx-btn vx-btn-sm vx-btn-primary mt-4"
          >
            <RefreshCw size={13} />
            Retry
          </button>
        </div>
      )}
    </div>
  );
}
