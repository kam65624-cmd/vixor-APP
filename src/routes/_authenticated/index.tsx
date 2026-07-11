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
        className={`text-[11px] font-bold font-mono flex items-center gap-0.5 ${isUp ? "text-emerald-400" : "text-red-400"}`}
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
    <div className="relative w-full overflow-hidden border-y border-white/5 bg-[#0b0e14]">
      <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#0b0e14] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#0b0e14] to-transparent z-10 pointer-events-none" />
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
      <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">
        {label}
      </span>
      <span className={`text-sm font-bold font-mono ${color}`}>{value}</span>
      {subtext && <span className="text-[10px] text-foreground/40">{subtext}</span>}
    </div>
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
      className="group relative flex flex-col gap-3 p-4 rounded-2xl border border-white/8 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15 transition-all duration-300 text-left w-full"
    >
      {badge && (
        <span
          className="absolute top-3 right-3 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest"
          style={{
            background: `${accent}22`,
            color: accent,
            border: `1px solid ${accent}44`,
          }}
        >
          {badge}
        </span>
      )}
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{ background: `${accent}18`, border: `1px solid ${accent}33` }}
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
  const color = isBuy ? "#10b981" : isSell ? "#ef4444" : "#6b7280";
  const bg = isBuy ? "#10b98115" : isSell ? "#ef444415" : "#6b728015";

  return (
    <div className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold"
        style={{ background: bg, color, border: `1px solid ${color}33` }}
      >
        {signal.type === "WAIT" ? "—" : isBuy ? "B" : "S"}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-foreground">{signal.token}</div>
        <div className="text-[11px] text-foreground/50 truncate">{signal.reason}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-xs font-bold font-mono" style={{ color }}>
          {signal.confidence}%
        </div>
        <div className="text-[10px] text-foreground/40 font-mono">{signal.price}</div>
      </div>
    </div>
  );
}

// Fear & Greed gauge
function FearGreedGauge({ fearGreed }: { fearGreed: HomeMarketData["fearGreedIndex"] }) {
  if (!fearGreed) return null;
  const { value, label, change } = fearGreed;
  const angle = (value / 100) * 180 - 90; // -90° to 90°
  const color = value >= 60 ? "#10b981" : value >= 40 ? "#f59e0b" : "#ef4444";

  return (
    <div className="flex flex-col items-center gap-2">
      <svg viewBox="0 0 120 70" className="w-28 h-16">
        {/* Background arc */}
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none"
          stroke="rgba(255,255,255,0.06)"
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
            className={`text-[10px] font-mono mt-0.5 ${change > 0 ? "text-emerald-400" : "text-red-400"}`}
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

  return (
    <div className="min-h-screen bg-[#080b10] text-foreground font-sans pb-24">
      {/* ── Top Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <div className="text-[11px] text-foreground/40 font-semibold uppercase tracking-widest">
            {getGreeting()}
          </div>
          <div className="text-lg font-extrabold text-white tracking-tight">
            {displayName}
            {isPremium && (
              <span className="ml-2 text-[10px] font-bold bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full align-middle">
                PRO
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate({ to: "/analyze" as any })}
          className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-bold text-xs px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-emerald-500/20"
        >
          <Scan size={14} />
          Analyze
        </button>
      </div>

      {/* ── Live Market Ticker ─────────────────────────────────────── */}
      {marketData && <MarketTicker data={marketData} />}

      {/* ── Portfolio Stats ────────────────────────────────────────── */}
      {data && (
        <div className="mx-4 mt-4 p-4 rounded-2xl border border-white/8 bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] uppercase tracking-widest text-foreground/40 font-semibold">
              Portfolio Overview
            </span>
            <button
              onClick={() => navigate({ to: "/pnl" as any })}
              className="text-[11px] text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1"
            >
              View all <ChevronRight size={11} />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-4">
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
              color={data.totalPnl >= 0 ? "text-emerald-400" : "text-red-400"}
            />
            <StatCard
              label="Win Rate"
              value={`${data.winRate}%`}
              color={data.winRate >= 50 ? "text-emerald-400" : "text-red-400"}
            />
            <StatCard label="Trades" value={String(data.tradeCount)} color="text-sky-400" />
          </div>
        </div>
      )}

      {/* ── CTA: Analyze Chart ────────────────────────────────────── */}
      <div className="mx-4 mt-4">
        <button
          onClick={() => navigate({ to: "/analyze" as any })}
          className="group relative w-full overflow-hidden rounded-2xl p-5 text-left transition-all duration-300"
          style={{
            background: "linear-gradient(135deg, #10b98120, #059669, #047857)",
            border: "1px solid #10b98140",
          }}
        >
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <Scan size={18} className="text-emerald-300" />
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-widest">
                AI Vision Analysis
              </span>
            </div>
            <div className="text-lg font-extrabold text-white leading-tight">
              Upload a chart.
              <br />
              Get AI-powered SMC/ICT analysis.
            </div>
            <div className="mt-3 flex items-center gap-2 text-emerald-300 text-xs font-bold">
              Start analyzing <ChevronRight size={13} />
            </div>
          </div>
        </button>
      </div>

      {/* ── Features Grid ─────────────────────────────────────────── */}
      <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
        <FeatureCard
          icon={LineChart}
          title="Live Charts"
          desc="TradingView charts for any pair"
          to="/charts"
          accent="#3b82f6"
        />
        <FeatureCard
          icon={Eye}
          title="Discover"
          desc="Find trending tokens & signals"
          badge="LIVE"
          to="/discover"
          accent="#a855f7"
        />
        <FeatureCard
          icon={Bot}
          title="AI Copilot"
          desc="Ask anything about markets"
          to="/copilot"
          accent="#f59e0b"
        />
        <FeatureCard
          icon={TrendingUp}
          title="PnL Tracker"
          desc="Track your trade performance"
          to="/pnl"
          accent="#10b981"
        />
      </div>

      {/* ── Active Signals ─────────────────────────────────────────── */}
      {signals.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
                Active Signals
              </span>
            </div>
            <button
              onClick={() => navigate({ to: "/signals" as any })}
              className="text-[11px] text-foreground/40 hover:text-foreground transition-colors flex items-center gap-1"
            >
              All signals <ChevronRight size={11} />
            </button>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4">
            {signals.slice(0, 3).map((s, i) => (
              <SignalRow key={i} signal={s} />
            ))}
          </div>
        </div>
      )}

      {/* ── Market Sentiment ───────────────────────────────────────── */}
      {marketData?.fearGreedIndex && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={14} className="text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
              Market Sentiment
            </span>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="text-sm font-bold text-foreground/70 mb-1">Fear & Greed Index</div>
              <div className="text-[11px] text-foreground/40">
                Updated daily · measures market emotion
              </div>
              {marketData.fearGreedIndex.value >= 60 ? (
                <div className="mt-2 text-[11px] text-emerald-400 font-semibold">
                  Greed is high — consider taking profits
                </div>
              ) : marketData.fearGreedIndex.value <= 30 ? (
                <div className="mt-2 text-[11px] text-red-400 font-semibold">
                  Extreme fear — potential buying opportunity
                </div>
              ) : null}
            </div>
            <FearGreedGauge fearGreed={marketData.fearGreedIndex} />
          </div>
        </div>
      )}

      {/* ── Recent Activity ────────────────────────────────────────── */}
      {data?.recentActivity && data.recentActivity.length > 0 && (
        <div className="mx-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-purple-400" />
            <span className="text-xs font-bold uppercase tracking-widest text-foreground/60">
              Recent Activity
            </span>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] divide-y divide-white/5">
            {data.recentActivity.slice(0, 4).map((a, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                      a.type === "buy"
                        ? "bg-emerald-400/10 text-emerald-400"
                        : "bg-red-400/10 text-red-400"
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
                      className={`text-xs font-bold font-mono ${a.pnl.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}
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
