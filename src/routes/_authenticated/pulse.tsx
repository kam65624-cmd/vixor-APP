import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  BarChart3,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/pulse")({
  head: () => ({ meta: [{ title: "Pulse — Vixor Terminal" }] }),
  component: PulsePage,
});

// ── Mock Data ──────────────────────────────────────────────────────────────

interface PulseSignal {
  id: string;
  type: "volume_spike" | "whale_move" | "social_trend" | "price_breakout" | "smart_money";
  token: string;
  chain: string;
  message: string;
  severity: "high" | "medium" | "low";
  timestamp: string;
  change: number;
}

const PULSE_SIGNALS: PulseSignal[] = [
  { id: "1", type: "whale_move", token: "WIF", chain: "Solana", message: "Whale transferred 2.5M WIF ($6.1M) to new wallet", severity: "high", timestamp: "2m ago", change: 5.2 },
  { id: "2", type: "volume_spike", token: "POPCAT", chain: "Solana", message: "Volume 5x higher than 24h average", severity: "high", timestamp: "5m ago", change: 33.7 },
  { id: "3", type: "smart_money", token: "BONK", chain: "Solana", message: "Smart money accumulation detected — 3 new wallets added", severity: "medium", timestamp: "8m ago", change: -1.5 },
  { id: "4", type: "social_trend", token: "TURBO", chain: "Solana", message: "Trending on X — 12K mentions in last hour", severity: "medium", timestamp: "12m ago", change: 45.6 },
  { id: "5", type: "price_breakout", token: "SPX", chain: "Solana", message: "Broke above key resistance at $0.85", severity: "high", timestamp: "15m ago", change: 18.9 },
  { id: "6", type: "volume_spike", token: "BRETT", chain: "Solana", message: "DEX volume surging — possible pump incoming", severity: "low", timestamp: "20m ago", change: -7.8 },
  { id: "7", type: "whale_move", token: "MOG", chain: "Solana", message: "Top holder sold 500M tokens — distribution phase", severity: "high", timestamp: "25m ago", change: 5.2 },
  { id: "8", type: "smart_money", token: "GOAT", chain: "Solana", message: "Smart money exiting — risk level elevated", severity: "high", timestamp: "30m ago", change: -12.3 },
  { id: "9", type: "social_trend", token: "FLOKI", chain: "Solana", message: "Community sentiment turning bullish — 85% positive", severity: "medium", timestamp: "35m ago", change: 12.4 },
  { id: "10", type: "price_breakout", token: "MEW", chain: "Solana", message: "New 24h high — momentum strong", severity: "medium", timestamp: "40m ago", change: 45.6 },
];

const MARKET_STATS = [
  { label: "Total Volume (24h)", value: "$4.2B", change: 12.3, icon: "📊" },
  { label: "Active Traders", value: "145K", change: 8.1, icon: "👥" },
  { label: "New Tokens", value: "2,847", change: -3.2, icon: "🆕" },
  { label: "Gas Price (SOL)", value: "0.00025", change: -15.4, icon: "⛽" },
  { label: "Whale Transactions", value: "1,234", change: 22.5, icon: "🐋" },
  { label: "Social Mentions", value: "89K", change: 45.2, icon: "💬" },
];

// ── Page Component ─────────────────────────────────────────────────────────

function PulsePage() {
  const [filter, setFilter] = useState<string>("all");

  const filteredSignals = filter === "all"
    ? PULSE_SIGNALS
    : PULSE_SIGNALS.filter((s) => s.type === filter || (filter === "high" && s.severity === "high"));

  return (
    <div  style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="size-5" style={{ color: "#3B82F6" }} />
            <h1 className="text-lg font-bold">Pulse</h1>
            <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>
              ● LIVE
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: "#4A5568" }}>Updates every 10s</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Real-time market intelligence — whale moves, volume spikes, social trends</p>
      </div>

      {/* Market Stats Bar */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {MARKET_STATS.map((stat) => {
            const isPos = stat.change >= 0;
            return (
              <div
                key={stat.label}
                className="px-3 py-2 rounded-lg"
                style={{ background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px]">{stat.icon}</span>
                  <span className="text-[9px]" style={{ color: "#4A5568" }}>{stat.label}</span>
                </div>
                <div className="text-sm font-bold font-mono">{stat.value}</div>
                <div className="text-[9px] font-mono" style={{ color: isPos ? "#22C55E" : "#EF4444" }}>
                  {isPos ? "+" : ""}{stat.change}%
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 flex items-center gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["all", "high", "whale_move", "volume_spike", "smart_money", "social_trend", "price_breakout"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors"
            style={{
              background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
              color: filter === f ? "#60A5FA" : "#7B8BA8",
              border: filter === f ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
            }}
          >
            {f === "all" ? "All" : f.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Signal Feed */}
      <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 280px)" }}>
        {filteredSignals.map((signal) => (
          <SignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}

// ── Signal Card ─────────────────────────────────────────────────────────────

const SignalCard = memo(function SignalCard({ signal }: { signal: PulseSignal }) {
  const isPositive = signal.change >= 0;
  const severityConfig = {
    high: { bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.2)", color: "#EF4444" },
    medium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", color: "#F59E0B" },
    low: { bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.2)", color: "#3B82F6" },
  }[signal.severity];

  const typeIcons = {
    volume_spike: <BarChart3 className="size-4" />,
    whale_move: <Globe className="size-4" />,
    social_trend: <Zap className="size-4" />,
    price_breakout: <TrendingUp className="size-4" />,
    smart_money: <Activity className="size-4" />,
  }[signal.type];

  return (
    <div
      className="flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors"
      style={{
        background: severityConfig.bg,
        border: `1px solid ${severityConfig.border}`,
      }}
    >
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-lg"
        style={{ width: "36px", height: "36px", background: "rgba(255,255,255,0.05)", color: severityConfig.color }}
      >
        {typeIcons}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-bold">{signal.token}</span>
            <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#7B8BA8" }}>
              {signal.chain}
            </span>
            <span
              className="text-[8px] px-1 rounded font-bold"
              style={{ background: `${severityConfig.color}20`, color: severityConfig.color }}
            >
              {signal.severity.toUpperCase()}
            </span>
          </div>
          <span className="text-[10px] font-mono" style={{ color: isPositive ? "#22C55E" : "#EF4444" }}>
            {isPositive ? "+" : ""}{signal.change}%
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#C8D1E0" }}>{signal.message}</p>
        <span className="text-[9px]" style={{ color: "#4A5568" }}>{signal.timestamp}</span>
      </div>
    </div>
  );
});
