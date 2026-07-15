import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData, getHomeMarketData } from "@/shared/data";
import type { HomeMarketData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getMe } from "@/domains/user/functions";
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
  return `$${p.toFixed(6)}`;
}

function formatVolume(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(2)}K`;
  return `$${v.toFixed(0)}`;
}

// ─── Components ───────────────────────────────────────────────────────────────

// Live Ticker Strip
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
    <div className="flex items-center gap-2 px-4 py-2 shrink-0">
      <span className="text-xs font-bold text-foreground/80">{symbol}</span>
      <span className="text-xs font-mono font-semibold text-foreground">{fmtPrice(price)}</span>
      <span
        className={`text-[11px] font-bold font-mono flex items-center gap-0.5 ${isUp ? "text-bullish" : "text-bearish"}`}
      >
        {isUp ? "+" : ""}
        {change24h.toFixed(2)}%
      </span>
    </div>
  );
});

const MarketTicker = memo(function MarketTicker({ data }: { data?: HomeMarketData }) {
  if (!data?.tickers?.length) return null;
  const repeated = [...data.tickers, ...data.tickers, ...data.tickers];

  return (
    <div className="relative w-full overflow-hidden border-y border-white/5 bg-[var(--color-card)]">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[var(--color-card)] to-transparent z-10 pointer-events-none" />
      <div
        className="flex animate-ticker"
        style={{
          animation: "ticker 30s linear infinite",
        }}
      >
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

// Stats bar card
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
      <span className="vx-stat-label">{label}</span>
      <span className={`vx-stat-value ${color}`}>{value}</span>
      {subtext && <span className="vx-stat-sub">{subtext}</span>}
    </div>
  );
}

// Market overview stat pill
function MarketStatPill({
  icon: Icon,
  label,
  value,
  accent = "var(--color-primary)",
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div
      className="vx-card flex-1 flex items-center gap-3 p-3.5"
      style={{
        borderColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{
          background: `color-mix(in srgb, ${accent} 8%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 15%, transparent)`,
        }}
      >
        <Icon size={16} style={{ color: accent }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-foreground/40">
          {label}
        </div>
        <div className="text-sm font-bold font-mono text-foreground truncate">{value}</div>
      </div>
    </div>
  );
}

// Top Mover card
function MoverCard({
  item,
  isGainer,
}: {
  item: { symbol: string; price: number; change24h: number };
  isGainer: boolean;
}) {
  const navigate = useNavigate();
  const color = isGainer ? "text-bullish" : "text-bearish";
  const bgColor = isGainer ? "bg-bullish/5" : "bg-bearish/5";
  const borderColor = isGainer ? "border-bullish/10" : "border-bearish/10";

  return (
    <button
      onClick={() => navigate({ to: "/charts" as any })}
      className={`flex items-center justify-between p-3 rounded-xl border ${bgColor} ${borderColor} hover:border-opacity-30 transition-all w-full text-left`}
    >
      <div>
        <div className="text-sm font-bold text-foreground">{item.symbol}</div>
        <div className="text-[11px] text-muted-foreground font-mono">{fmtPrice(item.price)}</div>
      </div>
      <div className={`text-sm font-bold font-mono ${color}`}>
        {item.change24h >= 0 ? "+" : ""}
        {item.change24h.toFixed(2)}%
      </div>
    </button>
  );
}

// Feature card
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
      className="vx-card vx-card-interactive vx-card-hover group relative flex flex-col gap-3 p-4 text-left w-full"
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{
            background: `color-mix(in srgb, ${accent} 8%, transparent)`,
            color: accent,
            border: `1px solid color-mix(in srgb, ${accent} 19%, transparent)`,
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: `color-mix(in srgb, ${accent} 9%, transparent)`,
          border: `1px solid color-mix(in srgb, ${accent} 20%, transparent)`,
        }}
      >
        <Icon size={17} style={{ color: accent }} />
      </div>
      <div>
        <div className="text-sm font-bold text-foreground group-hover:text-white transition-colors">
          {title}
        </div>
        <div className="text-[11px] text-foreground/50 mt-0.5 leading-relaxed">{desc}</div>
      </div>
      <ChevronRight
        size={14}
        className="text-foreground/30 group-hover:text-foreground/70 group-hover:translate-x-1 transition-all mt-auto self-end"
      />
    </button>
  );
}

// Signal row
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
        <div className="text-sm font-bold text-foreground">{signal.token}</div>
        <div className="text-[11px] text-foreground/50 whitespace-normal leading-snug mt-0.5">
          {signal.reason}
        </div>
      </div>
      <div className="text-right shrink-0 flex flex-col items-end justify-center">
        <div className="text-sm font-bold font-mono leading-none mb-1" style={{ color }}>
          {signal.confidence}%
        </div>
        <div className="text-[10px] text-foreground/40 font-mono leading-none">{signal.price}</div>
      </div>
    </div>
  );
}

// Fear & Greed gauge
function FearGreedGauge({ fearGreed }: { fearGreed: HomeMarketData["fearGreedIndex"] }) {
  if (!fearGreed) return null;
  const { value, label, change } = fearGreed;
  const angle = (value / 100) * 180 - 90; // -90° to 90°
  const color =
    value >= 60
      ? "var(--color-bullish)"
      : value >= 40
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 70" className="w-28 h-16">
        {/* Background arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="color-mix(in srgb, var(--color-foreground) 6%, transparent)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 157.08} 157.08`}
          style={{ filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
        {/* Needle */}
        <line
          x1="60"
          y1="60"
          x2={60 + 35 * Math.cos(((angle - 90) * Math.PI) / 180)}
          y2={60 + 35 * Math.sin(((angle - 90) * Math.PI) / 180)}
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r="3" fill={color} />
        {/* Labels */}
        <text x="8" y="68" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">
          0
        </text>
        <text x="105" y="68" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="monospace">
          100
        </text>
      </svg>
      <div className="text-center">
        <div className="text-2xl font-black font-mono" style={{ color }}>
          {value}
        </div>
        <div className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
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

// ─── Main Page ─────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);
  const fetchMe = useStableServerFn(getMe);
  const fetchMarket = useStableServerFn(getHomeMarketData);

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
    refetchInterval: 60_000,
  });

  const data = dashQuery.data;
  const user = meQuery.data;
  const displayName = user?.profile?.display_name || user?.profile?.username || "Trader";
  const isPremium = !!user?.isPremium;
  const marketData = marketQuery.data;
  const signals = dashQuery.data?.liveSignals ?? [];
  const hasTrades = !!data && (data.tradeCount ?? 0) > 0;
  const overview = marketData?.marketOverview ?? undefined;

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-foreground font-sans pb-24">
      {/* ── Section 1: Top Header ─────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <div className="text-[11px] text-foreground/40 font-semibold uppercase tracking-widest">
            {getGreeting()}
          </div>
          <div className="text-lg font-extrabold text-white tracking-tight">
            {displayName}
            {isPremium && (
              <span className="ml-2 text-[10px] font-bold bg-gold/10 text-gold border border-gold/20 px-2 py-0.5 rounded-full align-middle">
                PRO
              </span>
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
      {marketData && <MarketTicker data={marketData} />}

      {/* ── Section 3: Market Overview Stats Bar ─────────────────── */}
      {overview && (
        <div className="mx-4 mt-4 flex gap-3 vx-stagger">
          <MarketStatPill
            icon={Activity}
            label="24h Volume"
            value={formatVolume(overview.totalVolume)}
            accent="var(--color-primary)"
          />
          <MarketStatPill
            icon={Crown}
            label="BTC Dominance"
            value={`${overview.btcDominance.toFixed(1)}%`}
            accent="var(--color-gold)"
          />
          <MarketStatPill
            icon={Globe}
            label="Active Pairs"
            value={String(marketData?.tickers?.length ?? 8)}
            accent="var(--color-bullish)"
          />
        </div>
      )}

      {/* ── Section 4: Top Movers ────────────────────────────────── */}
      {overview && (overview.topGainers?.length || overview.topLosers?.length) && (
        <div className="mx-4 mt-4">
          <div className="vx-section-header mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary" />
              <span className="vx-section-title">Top Movers</span>
            </div>
            <button
              onClick={() => navigate({ to: "/discover" as any })}
              className="vx-section-action"
            >
              Discover <ChevronRight size={11} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {/* Top Gainers */}
            <div className="vx-card p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-bullish mb-2.5 flex items-center gap-1.5">
                <TrendingUp size={11} />
                Top Gainers
              </div>
              <div className="flex flex-col gap-2">
                {(overview.topGainers ?? []).slice(0, 3).map((item) => (
                  <MoverCard key={item.symbol} item={item} isGainer />
                ))}
                {(!overview.topGainers || overview.topGainers.length === 0) && (
                  <div className="text-[11px] text-foreground/30 py-2 text-center">Loading...</div>
                )}
              </div>
            </div>
            {/* Top Losers */}
            <div className="vx-card p-3">
              <div className="text-[10px] font-bold uppercase tracking-widest text-bearish mb-2.5 flex items-center gap-1.5">
                <TrendingUp size={11} className="rotate-180" />
                Top Losers
              </div>
              <div className="flex flex-col gap-2">
                {(overview.topLosers ?? []).slice(0, 3).map((item) => (
                  <MoverCard key={item.symbol} item={item} isGainer={false} />
                ))}
                {(!overview.topLosers || overview.topLosers.length === 0) && (
                  <div className="text-[11px] text-foreground/30 py-2 text-center">Loading...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Section 5: Portfolio Overview (conditional) ──────────── */}
      {hasTrades && data && (
        <div className="mx-4 mt-4 vx-card p-4 vx-stagger">
          <div className="vx-section-header mb-4">
            <span className="vx-section-title">Portfolio Overview</span>
            <button onClick={() => navigate({ to: "/pnl" as any })} className="vx-section-action">
              View all <ChevronRight size={11} />
            </button>
          </div>
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

      {/* ── Section 6: AI Analysis CTA ───────────────────────────── */}
      <div className="mx-4 mt-4 vx-stagger">
        <button
          onClick={() => navigate({ to: "/analyze" as any })}
          className="vx-card vx-card-interactive vx-card-hover group relative w-full p-5 text-left overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, color-mix(in srgb, var(--color-bullish) 12%, transparent), var(--color-bullish), #1a8f7f)",
            border: "1px solid color-mix(in srgb, var(--color-bullish) 25%, transparent)",
            boxShadow: "0 0 32px -8px var(--color-bullish)",
          }}
        >
          <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-bullish/5 group-hover:scale-125 transition-transform duration-700" />
          <div className="absolute -left-4 -bottom-4 w-24 h-24 rounded-full bg-bullish/5 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Scan size={18} className="text-bullish" />
              <span className="text-xs font-bold text-bullish uppercase tracking-widest">
                AI Vision Analysis
              </span>
            </div>
            <div className="text-lg font-extrabold text-white leading-tight">
              Upload a chart.
              <br />
              Get AI-powered SMC/ICT analysis.
            </div>
            <div className="mt-3 flex items-center gap-2 text-bullish text-xs font-bold">
              Start analyzing <ChevronRight size={13} />
            </div>
          </div>
        </button>
      </div>

      {/* ── Section 7: Features Grid (6 cards) ───────────────────── */}
      <div className="mx-4 mt-4 vx-stagger grid grid-cols-2 gap-3">
        <FeatureCard
          icon={LineChart}
          title="Live Charts"
          desc="TradingView charts for any pair"
          to="/charts"
          accent="var(--color-primary)"
        />
        <FeatureCard
          icon={Eye}
          title="Discover"
          desc="Find trending tokens & signals"
          badge="LIVE"
          to="/discover"
          accent="var(--color-primary)"
        />
        <FeatureCard
          icon={Bot}
          title="AI Copilot"
          desc="Ask anything about markets"
          to="/copilot"
          accent="var(--color-gold)"
        />
        <FeatureCard
          icon={TrendingUp}
          title="PnL Tracker"
          desc="Track your trade performance"
          to="/pnl"
          accent="var(--color-bullish)"
        />
        <FeatureCard
          icon={Radio}
          title="Radar"
          desc="Real-time market intelligence"
          badge="LIVE"
          to="/radar"
          accent="var(--color-bullish)"
        />
        <FeatureCard
          icon={Zap}
          title="Signals"
          desc="AI-powered trade signals"
          to="/signals"
          accent="var(--color-gold)"
        />
      </div>

      {/* ── Section 8: Active Signals (conditional) ──────────────── */}
      {signals.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="vx-section-header mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-[var(--gold)]" />
              <span className="vx-section-title">Active Signals</span>
            </div>
            <button
              onClick={() => navigate({ to: "/signals" as any })}
              className="vx-section-action"
            >
              All signals <ChevronRight size={11} />
            </button>
          </div>
          <div className="vx-stagger">
            <div className="vx-card px-4">
              {signals.slice(0, 3).map((s, i) => (
                <SignalRow key={i} signal={s} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Section 9: Fear & Greed (conditional) ────────────────── */}
      {marketData?.fearGreedIndex && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
              Market Sentiment
            </span>
          </div>
          <div className="vx-card p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground/70 mb-1">Fear & Greed Index</div>
              <div className="text-[11px] text-foreground/40">
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

      {/* ── Section 10: Recent Activity (conditional) ────────────── */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-primary" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
              Recent Activity
            </span>
          </div>
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
                  <span className="text-xs text-foreground/70 font-medium truncate max-w-[160px]">
                    {a.msg}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  {a.pnl && (
                    <div
                      className={`text-xs font-bold font-mono ${a.pnl.startsWith("+") ? "text-bullish" : "text-bearish"}`}
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
    </div>
  );
}
