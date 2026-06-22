import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Trading Signals — Vixor" }] }),
  component: SignalsPage,
});

interface Signal {
  id: string;
  token: string;
  type: "BUY" | "SELL" | "STRONG BUY" | "STRONG SELL";
  confidence: number;
  entry: string;
  target: string;
  stopLoss: string;
  risk: "low" | "medium" | "high";
  timeframe: string;
  reason: string;
  timestamp: string;
  price: string;
  change: string;
}

const SIGNALS: Signal[] = [
  { id: "1", token: "WIF", type: "STRONG BUY", confidence: 87, entry: "$2.40", target: "$3.20", stopLoss: "$2.15", risk: "medium", timeframe: "4H", reason: "Breaking 4H consolidation + smart money accumulation", timestamp: "5m ago", price: "$2.45", change: "+22.1%" },
  { id: "2", token: "POPCAT", type: "BUY", confidence: 81, entry: "$1.20", target: "$2.00", stopLoss: "$1.05", risk: "medium", timeframe: "1H", reason: "Volume 3x avg, above all EMAs, strong momentum", timestamp: "15m ago", price: "$1.23", change: "+33.7%" },
  { id: "3", token: "SPX", type: "BUY", confidence: 72, entry: "$0.85", target: "$1.40", stopLoss: "$0.72", risk: "low", timeframe: "24H", reason: "3 whale wallets accumulated 5M tokens in 24h", timestamp: "30m ago", price: "$0.89", change: "+18.9%" },
  { id: "4", token: "GOAT", type: "STRONG SELL", confidence: 78, entry: "SHORT", target: "$0.32", stopLoss: "$0.55", risk: "high", timeframe: "1D", reason: "Dev wallet activity + whale distribution phase", timestamp: "45m ago", price: "$0.45", change: "-12.3%" },
  { id: "5", token: "BRETT", type: "SELL", confidence: 71, entry: "SHORT", target: "$0.025", stopLoss: "$0.042", risk: "medium", timeframe: "4H", reason: "3 top holders selling, declining volume", timestamp: "1h ago", price: "$0.034", change: "-8.7%" },
  { id: "6", token: "MEW", type: "BUY", confidence: 65, entry: "$0.008", target: "$0.025", stopLoss: "$0.006", risk: "high", timeframe: "1W", reason: "New token with burned dev wallet, community growing", timestamp: "2h ago", price: "$0.012", change: "+15.4%" },
  { id: "7", token: "FLOKI", type: "BUY", confidence: 65, entry: "$0.00020", target: "$0.00035", stopLoss: "$0.00016", risk: "low", timeframe: "1D", reason: "Social sentiment 85% bullish, CEX listing rumor", timestamp: "2h ago", price: "$0.00023", change: "+7.8%" },
  { id: "8", token: "BONK", type: "SELL", confidence: 58, entry: "SHORT", target: "$0.000025", stopLoss: "$0.000033", risk: "medium", timeframe: "1D", reason: "Narrative rotation from dog to cat coins", timestamp: "3h ago", price: "$0.0000289", change: "-1.5%" },
  { id: "9", token: "TURBO", type: "BUY", confidence: 70, entry: "$0.007", target: "$0.015", stopLoss: "$0.005", risk: "high", timeframe: "4H", reason: "Explosive volume, breaking out of 2-week range", timestamp: "4h ago", price: "$0.0089", change: "+45.6%" },
  { id: "10", token: "MOG", type: "BUY", confidence: 62, entry: "$0.000001", target: "$0.000003", stopLoss: "$0.0000008", risk: "medium", timeframe: "1W", reason: "Smart money re-accumulating after pullback", timestamp: "5h ago", price: "$0.0000012", change: "+28.3%" },
];

function SignalsPage() {
  const [filter, setFilter] = useState("All");
  const filters = ["All", "Buy", "Sell", "Strong Buy", "Strong Sell"];

  const filtered = filter === "All"
    ? SIGNALS
    : SIGNALS.filter((s) => s.type === filter.toUpperCase());

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#128640;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Trading Signals</span>
          <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", background: "rgba(139,92,246,0.15)", color: "#A78BFA", fontWeight: 700 }}>AI-POWERED</span>
        </div>
        <p style={{ fontSize: "10px", color: "#7B8BA8", marginTop: "4px" }}>AI-detected trading opportunities with confidence scores</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Active Signals", value: "10", color: "#3B82F6" },
          { label: "Buy Signals", value: "7", color: "#22C55E" },
          { label: "Sell Signals", value: "3", color: "#EF4444" },
          { label: "Avg Confidence", value: "71%", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#161b2e", borderRadius: "6px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "#4A5568" }}>{s.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "4px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer",
            color: filter === f ? "#fff" : "#7B8BA8",
            background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
            borderBottom: filter === f ? "2px solid #3B82F6" : "2px solid transparent",
          }}>{f}</button>
        ))}
      </div>

      {/* Signal Cards */}
      <div style={{ padding: "4px 8px" }}>
        {filtered.map((s) => <SignalCard key={s.id} signal={s} />)}
      </div>
    </div>
  );
}

const SignalCard = memo(function SignalCard({ signal: s }: { signal: Signal }) {
  const isBuy = s.type.includes("BUY");
  const isStrong = s.type.includes("STRONG");
  const riskColors = { low: { bg: "rgba(34,197,94,0.06)", color: "#22C55E" }, medium: { bg: "rgba(245,158,11,0.06)", color: "#F59E0B" }, high: { bg: "rgba(239,68,68,0.06)", color: "#EF4444" } }[s.risk];

  return (
    <div style={{
      margin: "4px 0", padding: "10px 12px", borderRadius: "8px", cursor: "pointer",
      background: isBuy ? riskColors.bg : "rgba(239,68,68,0.06)",
      border: `1px solid ${isBuy ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
      transition: "background 0.15s",
    }}
      onMouseEnter={(e) => (e.currentTarget.style.background = isBuy ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = isBuy ? riskColors.bg : "rgba(239,68,68,0.06)")}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            fontSize: "8px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
            background: isBuy ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
            color: isBuy ? "#22C55E" : "#EF4444",
          }}>{s.type}</span>
          <span style={{ fontSize: "12px", fontWeight: 700 }}>{s.token}</span>
          <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>{s.price}</span>
          <span style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 600, color: isBuy ? "#22C55E" : "#EF4444" }}>{s.change}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{
            fontSize: "8px", fontWeight: 700, padding: "1px 5px", borderRadius: "3px",
            background: `${riskColors.color}15`, color: riskColors.color,
          }}>{s.risk.toUpperCase()}</span>
          <span style={{ fontSize: "9px", color: "#4A5568" }}>{s.timestamp}</span>
        </div>
      </div>
      <p style={{ fontSize: "10px", color: "#7B8BA8", marginBottom: "8px", lineHeight: 1.4 }}>{s.reason}</p>
      <div style={{ display: "flex", gap: "16px" }}>
        <div><span style={{ fontSize: "8px", color: "#4A5568" }}>Entry</span><div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#60A5FA" }}>{s.entry}</div></div>
        <div><span style={{ fontSize: "8px", color: "#4A5568" }}>Target</span><div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#22C55E" }}>{s.target}</div></div>
        <div><span style={{ fontSize: "8px", color: "#4A5568" }}>Stop Loss</span><div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#EF4444" }}>{s.stopLoss}</div></div>
        <div><span style={{ fontSize: "8px", color: "#4A5568" }}>TF</span><div style={{ fontSize: "11px", fontWeight: 700 }}>{s.timeframe}</div></div>
        <div style={{ marginLeft: "auto" }}><span style={{ fontSize: "8px", color: "#4A5568" }}>Confidence</span><div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: "#F59E0B" }}>{s.confidence}%</div></div>
      </div>
    </div>
  );
});