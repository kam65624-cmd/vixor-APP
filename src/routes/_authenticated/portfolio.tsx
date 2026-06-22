import { createFileRoute } from "@tanstack/react-router";
import { memo, useState } from "react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio — Vixor" }] }),
  component: PortfolioPage,
});

const HOLDINGS = [
  { symbol: "POPCAT", name: "Popcat", amount: "8,000", avgEntry: 0.95, currentPrice: 1.23, value: 9840, pnl: 2240, pnlPct: 29.5, allocation: 44.1, up: true },
  { symbol: "WIF", name: "dogwifhat", amount: "2,500", avgEntry: 2.10, currentPrice: 2.45, value: 6125, pnl: 875, pnlPct: 16.7, allocation: 27.4, up: true },
  { symbol: "BONK", name: "Bonk", amount: "150M", avgEntry: 0.0000305, currentPrice: 0.0000289, value: 4335, pnl: -240, pnlPct: -5.2, allocation: 19.4, up: false },
  { symbol: "SPX", name: "SPX6900", amount: "1,200", avgEntry: 0.78, currentPrice: 0.89, value: 1068, pnl: 132, pnlPct: 14.1, allocation: 4.8, up: true },
  { symbol: "MOG", name: "Mog Coin", amount: "5B", avgEntry: 0.0000025, currentPrice: 0.0000023, value: 975, pnl: -125, pnlPct: -8.0, allocation: 4.3, up: false },
];

function PortfolioPage() {
  const [tab, setTab] = useState<"holdings" | "history">("holdings");
  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#128188;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Portfolio</span>
        </div>
      </div>

      {/* Total Value */}
      <div style={{ padding: "16px 12px", background: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(96,165,250,0.04) 100%)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: "10px", color: "#7B8BA8" }}>Total Portfolio Value</div>
        <div style={{ fontSize: "32px", fontWeight: 800, fontFamily: "monospace", lineHeight: 1.1, marginTop: "4px" }}>$22,343</div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
          <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "monospace", color: "#22C55E" }}>+$1,982 (+9.7%)</span>
          <span style={{ fontSize: "9px", color: "#4A5568" }}>24h</span>
        </div>
        {/* Allocation Bar */}
        <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", marginTop: "12px", gap: "2px" }}>
          <div style={{ width: "44.1%", background: "#3B82F6", borderRadius: "2px" }} />
          <div style={{ width: "27.4%", background: "#60A5FA", borderRadius: "2px" }} />
          <div style={{ width: "19.4%", background: "#F59E0B", borderRadius: "2px" }} />
          <div style={{ width: "4.8%", background: "#22C55E", borderRadius: "2px" }} />
          <div style={{ width: "4.3%", background: "#EF4444", borderRadius: "2px" }} />
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Total PnL", value: "+$2,882", color: "#22C55E" },
          { label: "Win Rate", value: "62.5%", color: "#3B82F6" },
          { label: "Best Trade", value: "+$2,240", color: "#22C55E" },
          { label: "Avg Hold", value: "4.2h", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ background: "#161b2e", borderRadius: "6px", padding: "8px 10px", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "9px", color: "#4A5568" }}>{s.label}</div>
            <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: s.color, marginTop: "2px" }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "0", padding: "0 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["holdings", "history"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontSize: "11px", fontWeight: 600, padding: "8px 16px", border: "none", cursor: "pointer",
            color: tab === t ? "#fff" : "#7B8BA8",
            background: "transparent",
            borderBottom: tab === t ? "2px solid #3B82F6" : "2px solid transparent",
            textTransform: "capitalize",
          }}>{t}</button>
        ))}
      </div>

      {/* Table Header */}
      <div style={{ display: "flex", alignItems: "center", padding: "6px 12px", fontSize: "9px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ flex: 2 }}>Token</div>
        <div style={{ flex: 1, textAlign: "right" }}>Avg Entry</div>
        <div style={{ flex: 1, textAlign: "right" }}>Current</div>
        <div style={{ flex: 1, textAlign: "right" }}>Value</div>
        <div style={{ flex: 1, textAlign: "right" }}>PnL</div>
        <div style={{ flex: 0.8, textAlign: "right" }}>Alloc</div>
      </div>

      {/* Holdings */}
      <div style={{ padding: "0 12px" }}>
        {HOLDINGS.map((h) => (
          <div key={h.symbol} style={{
            display: "flex", alignItems: "center", padding: "8px 0",
            borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div style={{ flex: 2, display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "50%",
                background: h.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "8px", fontWeight: 800, color: h.up ? "#22C55E" : "#EF4444", flexShrink: 0,
              }}>{h.symbol.slice(0, 2)}</div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700 }}>{h.symbol}</div>
                <div style={{ fontSize: "9px", color: "#4A5568" }}>{h.amount}</div>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "right", fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>
              ${h.avgEntry < 0.001 ? h.avgEntry.toFixed(8) : h.avgEntry.toFixed(4)}
            </div>
            <div style={{ flex: 1, textAlign: "right", fontSize: "10px", fontFamily: "monospace", fontWeight: 600 }}>
              ${h.currentPrice < 0.001 ? h.currentPrice.toFixed(8) : h.currentPrice.toFixed(4)}
            </div>
            <div style={{ flex: 1, textAlign: "right", fontSize: "11px", fontFamily: "monospace", fontWeight: 600 }}>
              ${h.value.toLocaleString()}
            </div>
            <div style={{ flex: 1, textAlign: "right" }}>
              <div style={{ fontSize: "10px", fontFamily: "monospace", fontWeight: 700, color: h.up ? "#22C55E" : "#EF4444" }}>
                {h.up ? "+" : ""}${h.pnl.toLocaleString()}
              </div>
              <div style={{ fontSize: "9px", fontFamily: "monospace", color: h.up ? "#22C55E" : "#EF4444" }}>
                {h.up ? "+" : ""}{h.pnlPct}%
              </div>
            </div>
            <div style={{ flex: 0.8, textAlign: "right", fontSize: "10px", color: "#7B8BA8" }}>{h.allocation}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}