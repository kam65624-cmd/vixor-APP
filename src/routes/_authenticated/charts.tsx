import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: ChartsPage,
});

const PAIRS = [
  { pair: "WIF/SOL", price: "0.00612", change: "+22.1%", up: true },
  { pair: "POPCAT/SOL", price: "0.00308", change: "+33.7%", up: true },
  { pair: "BONK/SOL", price: "0.00000072", change: "-1.5%", up: false },
];

const TIMEFRAMES = ["1m", "5m", "15m", "1H", "4H", "1D"] as const;

const INDICATORS = [
  { name: "RSI (14)", value: "62.4", signal: "Neutral", color: "#F59E0B" },
  { name: "MACD", value: "0.0023", signal: "Bullish", color: "#22C55E" },
  { name: "Volume", value: "340M", signal: "Above Avg", color: "#22C55E" },
  { name: "MA 20", value: "$2.18", signal: "Above", color: "#22C55E" },
  { name: "MA 50", value: "$1.95", signal: "Above", color: "#22C55E" },
  { name: "BB Width", value: "12.4%", signal: "Expanding", color: "#3B82F6" },
];

function ChartsPage() {
  const [activePair, setActivePair] = useState(0);
  const [activeTf, setActiveTf] = useState<string>("4H");

  const p = PAIRS[activePair];

  // Generate fake chart grid
  const gridLines = Array.from({ length: 8 }, (_, i) => i * 12.5);

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC", display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header + Pair Selector */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#128200;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Charts</span>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {PAIRS.map((pair, i) => (
            <button key={pair.pair} onClick={() => setActivePair(i)} style={{
              fontSize: "10px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer",
              color: activePair === i ? "#fff" : "#7B8BA8",
              background: activePair === i ? "rgba(59,130,246,0.15)" : "transparent",
              borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>{pair.pair}</button>
          ))}
        </div>
      </div>

      {/* Price + Timeframes */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "20px", fontWeight: 800, fontFamily: "monospace" }}>${p.price}</span>
          <span style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: p.up ? "#22C55E" : "#EF4444" }}>{p.change}</span>
        </div>
        <div style={{ display: "flex", gap: "2px" }}>
          {TIMEFRAMES.map((tf) => (
            <button key={tf} onClick={() => setActiveTf(tf)} style={{
              fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px", border: "none", cursor: "pointer",
              color: activeTf === tf ? "#60A5FA" : "#7B8BA8",
              background: activeTf === tf ? "rgba(59,130,246,0.12)" : "transparent",
            }}>{tf}</button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div style={{ flex: 1, position: "relative", minHeight: "280px", background: "#0c101e", margin: "0" }}>
        {/* Grid Lines */}
        {gridLines.map((pct) => (
          <div key={pct} style={{
            position: "absolute", top: `${pct}%`, left: 0, right: 0,
            height: "1px", background: "rgba(255,255,255,0.03)",
          }} />
        ))}
        {/* Vertical Grid */}
        {Array.from({ length: 10 }, (_, i) => (
          <div key={i} style={{
            position: "absolute", left: `${(i + 1) * 9}%`, top: 0, bottom: 0,
            width: "1px", background: "rgba(255,255,255,0.03)",
          }} />
        ))}
        {/* Fake price line */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22C55E" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M 0 70 Q 50 60, 100 55 T 200 40 T 300 50 T 400 35 T 500 25 T 600 30 T 700 20 T 800 25 T 900 15 T 1000 10" fill="none" stroke="#22C55E" strokeWidth="1.5" />
          <path d="M 0 70 Q 50 60, 100 55 T 200 40 T 300 50 T 400 35 T 500 25 T 600 30 T 700 20 T 800 25 T 900 15 T 1000 10 V 400 H 0 Z" fill="url(#chartGrad)" />
          {/* Volume bars */}
          {[35, 50, 30, 65, 45, 80, 55, 40, 70, 60, 45, 75, 50, 85, 55, 40, 65, 70, 50, 60].map((h, i) => (
            <rect key={i} x={i * 50} y={400 - h * 3} width={i % 2 === 0 ? 45 : 45} height={h * 3} fill={i % 2 === 0 ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.1)"} />
          ))}
        </svg>
        {/* Current price line */}
        <div style={{ position: "absolute", top: "15px", left: 0, right: 0, height: "1px", background: "rgba(59,130,246,0.4)" }}>
          <span style={{ position: "absolute", right: "8px", top: "-16px", fontSize: "9px", fontFamily: "monospace", fontWeight: 700, color: "#3B82F6", background: "rgba(59,130,246,0.2)", padding: "2px 6px", borderRadius: "3px" }}>
            ${p.price}
          </span>
        </div>
        {/* Y-axis prices */}
        <div style={{ position: "absolute", right: "4px", top: 0, bottom: 0, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "10px 0" }}>
          {["$2.60", "$2.45", "$2.30", "$2.15", "$2.00", "$1.85", "$1.70", "$1.55"].map((p) => (
            <span key={p} style={{ fontSize: "8px", fontFamily: "monospace", color: "#4A5568" }}>{p}</span>
          ))}
        </div>
      </div>

      {/* Key Levels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Resistance 2", value: "$2.65", color: "#EF4444" },
          { label: "Resistance 1", value: "$2.50", color: "#F59E0B" },
          { label: "Support 1", value: "$2.15", color: "#22C55E" },
          { label: "Support 2", value: "$1.95", color: "#22C55E" },
        ].map((l) => (
          <div key={l.label} style={{ background: "#161b2e", borderRadius: "6px", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "8px", color: "#4A5568" }}>{l.label}</div>
            <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: l.color }}>{l.value}</div>
          </div>
        ))}
      </div>

      {/* Indicators */}
      <div style={{ padding: "8px 12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, marginBottom: "6px" }}>Technical Indicators</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px" }}>
          {INDICATORS.map((ind) => (
            <div key={ind.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 8px", background: "#161b2e", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div>
                <div style={{ fontSize: "9px", color: "#7B8BA8" }}>{ind.name}</div>
                <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{ind.value}</div>
              </div>
              <span style={{ fontSize: "8px", fontWeight: 700, padding: "2px 6px", borderRadius: "3px", background: `${ind.color}15`, color: ind.color }}>{ind.signal}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}