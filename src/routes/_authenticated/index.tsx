import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  ArrowUpRight,
  Newspaper,
  Bell,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useMemo, memo } from "react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

// ── Mock Data ──────────────────────────────────────────────────────────────

const TOP_TOKENS = [
  { symbol: "WIF", name: "dogwifhat", price: "$2.45", change: "+22.1%", positive: true, volume: "$340M" },
  { symbol: "POPCAT", name: "Popcat", price: "$1.23", change: "+33.7%", positive: true, volume: "$95M" },
  { symbol: "BONK", name: "Bonk", price: "$0.0000289", change: "-1.5%", positive: false, volume: "$210M" },
  { symbol: "SPX", name: "SPX6900", price: "$0.89", change: "+18.9%", positive: true, volume: "$56M" },
  { symbol: "TURBO", name: "Turbo", price: "$0.0089", change: "+45.6%", positive: true, volume: "$78M" },
  { symbol: "GOAT", name: "GOAT", price: "$0.45", change: "-12.3%", positive: false, volume: "$185M" },
];

const TRENDING_NEWS = [
  { title: "WIF breaks $2.50 resistance — next target $3.20", time: "2m ago", hot: true },
  { title: "Smart money accumulates 5M SPX tokens in 24h", time: "15m ago", hot: true },
  { title: "BONK community vote for new burn mechanism", time: "30m ago", hot: false },
  { title: "POPCAT listed on major CEX — volume surges 500%", time: "45m ago", hot: true },
  { title: "Solana DEX volume hits $2B daily record", time: "1h ago", hot: false },
];

const LIVE_SIGNALS = [
  { token: "MEW", type: "BUY", reason: "Volume spike + smart money entry", confidence: 82, time: "3m ago" },
  { token: "BRETT", type: "SELL", reason: "Whale distribution detected", confidence: 71, time: "8m ago" },
  { token: "FLOKI", type: "BUY", reason: "Social sentiment turning bullish", confidence: 65, time: "12m ago" },
  { token: "GOAT", type: "SELL", reason: "Dev wallet activity increasing", confidence: 78, time: "18m ago" },
];

const MARKET_STATS = [
  { label: "SOL Price", value: "$73.60", change: "+2.4%", positive: true },
  { label: "DEX Volume", value: "$2.1B", change: "+15.3%", positive: true },
  { label: "Active Wallets", value: "1.2M", change: "+8.7%", positive: true },
  { label: "New Tokens", value: "2,847", change: "-3.2%", positive: false },
  { label: "Gas (gwei)", value: "25", change: "-12%", positive: true },
  { label: "Fear & Greed", value: "72", change: "+5", positive: true },
];

// ── Page Component ──────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="w-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Market Stats Ticker ── */}
      <div
        className="flex items-center gap-1 px-3 py-2 overflow-x-auto no-scrollbar"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0D1117" }}
      >
        {MARKET_STATS.map((stat) => (
          <div
            key={stat.label}
            className="flex items-center gap-2 px-3 py-1 rounded-lg flex-shrink-0"
            style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <span className="text-[9px]" style={{ color: "#4A5568" }}>{stat.label}</span>
            <span className="text-[11px] font-bold font-mono">{stat.value}</span>
            <span className="text-[9px] font-mono" style={{ color: stat.positive ? "#22C55E" : "#EF4444" }}>
              {stat.change}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main Grid Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
        {/* ── Left Column: Top Tokens + Trending ── */}
        <div className="flex flex-col" style={{ background: "#0A0E1A" }}>
          {/* Top Movers */}
          <SectionHeader title="🔥 Top Movers" icon={<Flame className="size-4" style={{ color: "#F59E0B" }} />} />
          <div className="px-2">
            {TOP_TOKENS.map((token) => (
              <TokenMiniRow key={token.symbol} token={token} onClick={() => navigate({ to: "/discover" })} />
            ))}
          </div>

          {/* Trending News */}
          <SectionHeader title="📰 Trending" icon={<Newspaper className="size-4" style={{ color: "#3B82F6" }} />} />
          <div className="px-3 pb-3 space-y-2">
            {TRENDING_NEWS.map((news, i) => (
              <div key={i} className="flex items-start gap-2 cursor-pointer" onClick={() => navigate({ to: "/pulse" })}>
                {news.hot && <span className="text-[10px] mt-0.5">🔥</span>}
                <div className="flex-1">
                  <p className="text-[11px] leading-relaxed" style={{ color: "#C8D1E0" }}>{news.title}</p>
                  <span className="text-[9px]" style={{ color: "#4A5568" }}>{news.time}</span>
                </div>
                <ChevronRight className="size-3 flex-shrink-0 mt-1" style={{ color: "#4A5568" }} />
              </div>
            ))}
          </div>
        </div>

        {/* ── Center Column: Live Signals + Chart ── */}
        <div className="flex flex-col" style={{ background: "#0A0E1A" }}>
          <SectionHeader title="⚡ Live Signals" icon={<Zap className="size-4" style={{ color: "#F59E0B" }} />} subtitle="AI-powered trading signals" />
          <div className="px-3 pb-3 space-y-2">
            {LIVE_SIGNALS.map((signal) => (
              <SignalCard key={signal.token + signal.time} signal={signal} />
            ))}
          </div>

          {/* Quick Actions */}
          <SectionHeader title="🎯 Quick Actions" />
          <div className="px-3 pb-3 grid grid-cols-2 gap-2">
            {[
              { label: "Discover Tokens", icon: "🔍", to: "/discover" },
              { label: "AI Copilot", icon: "🤖", to: "/copilot" },
              { label: "Portfolio", icon: "💼", to: "/portfolio" },
              { label: "Whale Alerts", icon: "🐋", to: "/whale" },
              { label: "PnL Tracker", icon: "📈", to: "/pnl" },
              { label: "Alpha Signals", icon: "⚡", to: "/alpha" },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate({ to: action.to as any })}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-medium text-left transition-colors"
                style={{
                  background: "#111827",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#C8D1E0",
                }}
              >
                <span className="text-sm">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Right Column: Portfolio Summary + Activity ── */}
        <div className="flex flex-col" style={{ background: "#0A0E1A" }}>
          <SectionHeader title="💼 Portfolio" subtitle="24h Overview" />
          <div className="px-3 pb-3 space-y-2">
            <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total Value</div>
              <div className="text-xl font-bold font-mono">$22,343</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-mono font-bold" style={{ color: "#22C55E" }}>+$1,982 (+9.7%)</span>
                <span className="text-[9px]" style={{ color: "#4A5568" }}>24h</span>
              </div>
            </div>

            {/* Top Holdings */}
            {[
              { symbol: "POPCAT", value: "$9,840", change: "+29.5%", pct: 45 },
              { symbol: "WIF", value: "$6,125", change: "+16.7%", pct: 28 },
              { symbol: "BONK", value: "$4,335", change: "-5.2%", pct: 20 },
            ].map((h) => (
              <div key={h.symbol} className="flex items-center justify-between px-2 py-1.5 rounded-lg" style={{ background: "#111827" }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-full" style={{ width: "24px", height: "24px", background: "rgba(59,130,246,0.12)", fontSize: "8px", fontWeight: 800, color: "#60A5FA" }}>
                    {h.symbol.slice(0, 2)}
                  </div>
                  <span className="text-[11px] font-bold">{h.symbol}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono">{h.value}</span>
                  <span className="text-[9px] font-mono" style={{ color: h.change.startsWith("+") ? "#22C55E" : "#EF4444" }}>{h.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <SectionHeader title="🔔 Recent Activity" icon={<Bell className="size-4" style={{ color: "#3B82F6" }} />} />
          <div className="px-3 pb-3 space-y-1.5">
            {[
              { msg: "Bought 500 WIF at $2.40", time: "2h ago", type: "buy" },
              { msg: "Sold 1M GOAT at $0.45", time: "5h ago", type: "sell" },
              { msg: "Received referral bonus: +500 pts", time: "8h ago", type: "reward" },
              { msg: "Alpha signal: POPCAT breakout", time: "12h ago", type: "signal" },
            ].map((a, i) => (
              <div key={i} className="flex items-center justify-between py-1 px-2 rounded" style={{ background: "#111827" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[10px]">
                    {a.type === "buy" ? "🟢" : a.type === "sell" ? "🔴" : a.type === "signal" ? "⚡" : "🏆"}
                  </span>
                  <span className="text-[10px]">{a.msg}</span>
                </div>
                <span className="text-[8px]" style={{ color: "#4A5568" }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon, subtitle }: { title: string; icon?: React.ReactNode; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-[11px] font-bold">{title}</span>
        {subtitle && <span className="text-[9px]" style={{ color: "#4A5568" }}>{subtitle}</span>}
      </div>
      <ChevronRight className="size-3" style={{ color: "#4A5568" }} />
    </div>
  );
}

// ── Token Mini Row ──────────────────────────────────────────────────────────

const TokenMiniRow = memo(function TokenMiniRow({ token, onClick }: { token: typeof TOP_TOKENS[0]; onClick: () => void }) {
  return (
    <div
      className="flex items-center justify-between px-2 py-2 rounded-lg cursor-pointer transition-colors"
      style={{ background: "#111827", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: "26px", height: "26px", background: "rgba(59,130,246,0.12)", fontSize: "8px", fontWeight: 800, color: "#60A5FA" }}
        >
          {token.symbol.slice(0, 2)}
        </div>
        <div>
          <span className="text-[11px] font-bold">{token.symbol}</span>
          <span className="text-[9px] ml-1" style={{ color: "#4A5568" }}>{token.name}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono font-bold">{token.price}</span>
        <span className="text-[10px] font-mono font-bold" style={{ color: token.positive ? "#22C55E" : "#EF4444" }}>
          {token.change}
        </span>
      </div>
    </div>
  );
});

// ── Signal Card ──────────────────────────────────────────────────────────────

const SignalCard = memo(function SignalCard({ signal }: { signal: typeof LIVE_SIGNALS[0] }) {
  const isBuy = signal.type === "BUY";
  return (
    <div
      className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors"
      style={{
        background: isBuy ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
        border: `1px solid ${isBuy ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-[8px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: isBuy ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)", color: isBuy ? "#22C55E" : "#EF4444" }}
        >
          {signal.type}
        </span>
        <span className="text-[11px] font-bold">{signal.token}</span>
        <span className="text-[10px]" style={{ color: "#7B8BA8" }}>— {signal.reason}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold" style={{ color: "#F59E0B" }}>{signal.confidence}%</span>
        <span className="text-[8px]" style={{ color: "#4A5568" }}>{signal.time}</span>
      </div>
    </div>
  );
});
