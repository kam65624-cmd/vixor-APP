import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/alpha")({
  head: () => ({ meta: [{ title: "Alpha — Vixor Terminal" }] }),
  component: AlphaPage,
});

interface AlphaSignal {
  id: string;
  token: string;
  chain: string;
  type: "accumulation" | "launch" | "breakout" | "narrativeshift";
  confidence: number;
  description: string;
  timeframe: string;
  entry: string;
  target: string;
  risk: "low" | "medium" | "high";
  timestamp: string;
}

const ALPHA_SIGNALS: AlphaSignal[] = [
  {
    id: "1", token: "WIF", chain: "Solana", type: "breakout", confidence: 87,
    description: "Breaking out of 4H consolidation with increasing volume. Smart money wallets accumulating since 48h.",
    timeframe: "4H", entry: "$2.40", target: "$3.20 (+33%)", risk: "medium", timestamp: "5m ago",
  },
  {
    id: "2", token: "SPX", chain: "Solana", type: "accumulation", confidence: 72,
    description: "3 new whale wallets accumulated 5M tokens in the past 24h. Pattern suggests impending pump.",
    timeframe: "24H", entry: "$0.85", target: "$1.40 (+65%)", risk: "low", timestamp: "15m ago",
  },
  {
    id: "3", token: "MEW", chain: "Solana", type: "launch", confidence: 65,
    description: "New token with burned dev wallet (92%). Community growing fast on X. Early entry opportunity.",
    timeframe: "1W", entry: "$0.008", target: "$0.025 (+212%)", risk: "high", timestamp: "30m ago",
  },
  {
    id: "4", token: "BONK", chain: "Solana", type: "narrativeshift", confidence: 58,
    description: "Narrative shifting from dog coins to cat coins. BONK may see rotation out as capital moves.",
    timeframe: "1D", entry: "SHORT", target: "$0.000025 (-13%)", risk: "medium", timestamp: "45m ago",
  },
  {
    id: "5", token: "POPCAT", chain: "Solana", type: "breakout", confidence: 81,
    description: "Volume 3x average, price above all EMAs. Strong momentum with minimal resistance to $2.00.",
    timeframe: "1H", entry: "$1.20", target: "$2.00 (+67%)", risk: "medium", timestamp: "1h ago",
  },
];

function AlphaPage() {
  const [selectedType, setSelectedType] = useState<string>("all");

  const filtered = selectedType === "all"
    ? ALPHA_SIGNALS
    : ALPHA_SIGNALS.filter((s) => s.type === selectedType);

  return (
    <div  style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">⚡</span>
          <h1 className="text-lg font-bold">Alpha Signals</h1>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
            AI-Powered
          </span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>AI-detected trading opportunities before the crowd</p>
      </div>

      {/* Filter */}
      <div className="px-4 py-2 flex items-center gap-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {["all", "accumulation", "breakout", "launch", "narrativeshift"].map((t) => (
          <button
            key={t}
            onClick={() => setSelectedType(t)}
            className="px-2 py-0.5 rounded text-[10px] font-semibold capitalize transition-colors"
            style={{
              background: selectedType === t ? "rgba(245,158,11,0.15)" : "transparent",
              color: selectedType === t ? "#F59E0B" : "#7B8BA8",
            }}
          >
            {t === "narrativeshift" ? "Narrative" : t}
          </button>
        ))}
      </div>

      {/* Signals */}
      <div className="overflow-y-auto px-4 py-3 space-y-3" style={{ maxHeight: "calc(100vh - 160px)" }}>
        {filtered.map((signal) => (
          <AlphaCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}

const AlphaCard = memo(function AlphaCard({ signal }: { signal: AlphaSignal }) {
  const riskColors = {
    low: { bg: "rgba(34,197,94,0.08)", color: "#22C55E" },
    medium: { bg: "rgba(245,158,11,0.08)", color: "#F59E0B" },
    high: { bg: "rgba(239,68,68,0.08)", color: "#EF4444" },
  }[signal.risk];

  const typeLabels = {
    accumulation: "🧱 Accumulation",
    breakout: "🚀 Breakout",
    launch: "🆕 New Launch",
    narrativeshift: "🔄 Narrative Shift",
  }[signal.type];

  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{signal.token}</span>
          <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(255,255,255,0.05)", color: "#7B8BA8" }}>
            {signal.chain}
          </span>
          <span className="text-[9px]">{typeLabels}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px]" style={{ color: "#F59E0B" }}>Confidence</div>
            <div className="text-sm font-bold font-mono" style={{ color: "#F59E0B" }}>{signal.confidence}%</div>
          </div>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed mb-2" style={{ color: "#C8D1E0" }}>
        {signal.description}
      </p>

      <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>Entry</span>
            <div className="text-[11px] font-bold font-mono" style={{ color: "#60A5FA" }}>{signal.entry}</div>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>Target</span>
            <div className="text-[11px] font-bold font-mono" style={{ color: "#22C55E" }}>{signal.target}</div>
          </div>
          <div>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>Timeframe</span>
            <div className="text-[11px] font-bold">{signal.timeframe}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[8px] px-1.5 rounded font-bold"
            style={{ background: riskColors.bg, color: riskColors.color }}
          >
            {signal.risk.toUpperCase()}
          </span>
          <span className="text-[9px]" style={{ color: "#4A5568" }}>{signal.timestamp}</span>
        </div>
      </div>
    </div>
  );
});
