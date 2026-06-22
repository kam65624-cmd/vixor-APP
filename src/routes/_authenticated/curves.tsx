import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/curves")({
  head: () => ({ meta: [{ title: "Bonding Curves — Vixor" }] }),
  component: CurvesPage,
});

// ── Types ──

interface BondingToken {
  id: string;
  symbol: string;
  name: string;
  progress: number; // 0-100, % complete to Raydium
  marketCap: string;
  holders: number;
  timeLeft: string;
  createdAgo: string;
  volume: string;
  buys24h: number;
  sells24h: number;
  devSold: number; // % dev sold
  status: "active" | "completed" | "rug";
  k: number; // bonding curve constant
}

// ── Mock Data ──

const BONDING_TOKENS: BondingToken[] = [
  { id: "1", symbol: "FIREBIRD", name: "Firebird", progress: 42, marketCap: "$89K", holders: 342, timeLeft: "~3.2h", createdAgo: "28m ago", volume: "$124K", buys24h: 890, sells24h: 210, devSold: 2, status: "active", k: 0.48 },
  { id: "2", symbol: "SPARKY", name: "Sparky AI", progress: 67, marketCap: "$156K", holders: 578, timeLeft: "~1.8h", createdAgo: "45m ago", volume: "$342K", buys24h: 1520, sells24h: 890, devSold: 3, status: "active", k: 0.67 },
  { id: "3", symbol: "PEPE2.0", name: "Pepe Two Point Oh", progress: 88, marketCap: "$245K", holders: 1205, timeLeft: "~28m", createdAgo: "1h 12m ago", volume: "$890K", buys24h: 4200, sells24h: 3100, devSold: 1, status: "active", k: 0.88 },
  { id: "4", symbol: "LAMBO", name: "Lambo Speed", progress: 93, marketCap: "$312K", holders: 1834, timeLeft: "~12m", createdAgo: "2h 5m ago", volume: "$1.2M", buys24h: 6800, sells24h: 5200, devSold: 0, status: "active", k: 0.93 },
  { id: "5", symbol: "SOLKITTY", name: "SolKitty", progress: 97, marketCap: "$389K", holders: 2456, timeLeft: "~5m", createdAgo: "2h 48m ago", volume: "$2.1M", buys24h: 9200, sells24h: 7100, devSold: 0, status: "active", k: 0.97 },
  { id: "6", symbol: "ROCKET", name: "Rocket Fuel", progress: 31, marketCap: "$45K", holders: 189, timeLeft: "~4.5h", createdAgo: "12m ago", volume: "$67K", buys24h: 340, sells24h: 120, devSold: 4, status: "active", k: 0.31 },
  { id: "7", symbol: "MELTDOWN", name: "Meltdown", progress: 55, marketCap: "$178K", holders: 723, timeLeft: "~2.1h", createdAgo: "1h 30m ago", volume: "$456K", buys24h: 2100, sells24h: 1400, devSold: 2, status: "active", k: 0.55 },
  { id: "8", symbol: "GHOSTDAO", name: "Ghost DAO", progress: 100, marketCap: "$520K", holders: 3200, timeLeft: "Complete", createdAgo: "4h ago", volume: "$3.4M", buys24h: 12000, sells24h: 8500, devSold: 0, status: "completed", k: 1.0 },
  { id: "9", symbol: "ZEROX", name: "ZeroX Protocol", progress: 22, marketCap: "$28K", holders: 95, timeLeft: "~5.8h", createdAgo: "5m ago", volume: "$32K", buys24h: 145, sells24h: 45, devSold: 8, status: "active", k: 0.22 },
  { id: "10", symbol: "PUFFIN", name: "Puffin Inu", progress: 100, marketCap: "$145K", holders: 680, timeLeft: "Rugged", createdAgo: "1h 45m ago", volume: "$289K", buys24h: 900, sells24h: 4200, devSold: 85, status: "rug", k: 1.0 },
];

const FILTERS = ["All", "New", "Near Complete", "Completed"] as const;

// ── Page Component ──

function CurvesPage() {
  const [filter, setFilter] = useState<string>("All");

  const filtered = filter === "All"
    ? BONDING_TOKENS
    : filter === "New"
      ? BONDING_TOKENS.filter(t => t.progress < 50)
      : filter === "Near Complete"
        ? BONDING_TOKENS.filter(t => t.progress >= 80 && t.progress < 100)
        : BONDING_TOKENS.filter(t => t.progress >= 100);

  return (
    <div style={{ width: "100%", height: "100%", background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>📈</span>
          <h1 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Bonding Curves</h1>
          <span style={{ fontSize: "10px", padding: "2px 10px", borderRadius: "12px", background: "rgba(34,197,94,0.15)", color: "#22C55E", fontWeight: 700, letterSpacing: "0.05em" }}>● LIVE</span>
        </div>
        <p style={{ fontSize: "11px", marginTop: "2px", color: "#7B8BA8", margin: 0 }}>Monitor pump.fun bonding curves — find early entries before Raydium</p>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Active Curves", value: "342", color: "#3B82F6" },
          { label: "New Launches (1h)", value: "47", color: "#22C55E" },
          { label: "New Launches (24h)", value: "891", color: "#22C55E" },
          { label: "Avg Time to Raydium", value: "2.4h", color: "#F59E0B" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "8px 12px", borderRadius: "8px", background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: "9px", color: "#4A5568" }}>{s.label}</div>
            <div style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "8px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: "10px", fontWeight: 600, padding: "4px 12px", borderRadius: "6px",
              border: "none", cursor: "pointer", whiteSpace: "nowrap",
              color: filter === f ? "#60A5FA" : "#7B8BA8",
              background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
              borderBottom: filter === f ? "2px solid #3B82F6" : "2px solid transparent",
              marginBottom: "-8px",
              transition: "all 0.15s",
            }}
          >
            {f}{f === "Near Complete" ? ` (${BONDING_TOKENS.filter(t => t.progress >= 80 && t.progress < 100).length})` : f === "New" ? ` (${BONDING_TOKENS.filter(t => t.progress < 50).length})` : f === "Completed" ? ` (${BONDING_TOKENS.filter(t => t.progress >= 100).length})` : ""}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontSize: "9px", color: "#4A5568", fontFamily: "monospace" }}>Auto-refresh: 15s</span>
      </div>

      {/* Table */}
      <div style={{ overflowY: "auto", maxHeight: "calc(100vh - 250px)" }}>
        {/* Column Headers */}
        <div style={{ display: "flex", alignItems: "center", padding: "6px 16px", fontSize: "9px", fontWeight: 600, color: "#4A5568", textTransform: "uppercase", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.04)", background: "#161b2e" }}>
          <div style={{ width: "110px" }}>Token</div>
          <div style={{ width: "160px" }}>Progress</div>
          <div style={{ width: "80px", textAlign: "right" }}>Market Cap</div>
          <div style={{ width: "60px", textAlign: "right" }}>Holders</div>
          <div style={{ width: "70px", textAlign: "right" }}>Time Left</div>
          <div style={{ width: "80px", textAlign: "right" }}>Volume</div>
          <div style={{ width: "70px", textAlign: "right" }}>TXNS</div>
          <div style={{ width: "60px", textAlign: "right" }}>Dev</div>
          <div style={{ width: "60px", textAlign: "right" }}>Status</div>
        </div>
        {filtered.map((token) => (
          <BondingRow key={token.id} token={token} />
        ))}
      </div>
    </div>
  );
}

// ── Helpers ──

function getProgressColor(pct: number, status: string): { bar: string; bg: string; text: string } {
  if (status === "rug") return { bar: "#EF4444", bg: "rgba(239,68,68,0.15)", text: "#EF4444" };
  if (status === "completed") return { bar: "#60A5FA", bg: "rgba(96,165,250,0.15)", text: "#60A5FA" };
  if (pct < 50) return { bar: "#22C55E", bg: "rgba(34,197,94,0.15)", text: "#22C55E" };
  if (pct < 80) return { bar: "#F59E0B", bg: "rgba(245,158,11,0.15)", text: "#F59E0B" };
  if (pct < 95) return { bar: "#3B82F6", bg: "rgba(59,130,246,0.15)", text: "#3B82F6" };
  return { bar: "#EF4444", bg: "rgba(239,68,68,0.15)", text: "#EF4444" };
}

function getStatusConfig(status: string): { bg: string; color: string; label: string } {
  switch (status) {
    case "completed": return { bg: "rgba(96,165,250,0.12)", color: "#60A5FA", label: "RAYDIUM" };
    case "rug": return { bg: "rgba(239,68,68,0.12)", color: "#EF4444", label: "RUGGED" };
    default: return { bg: "rgba(34,197,94,0.12)", color: "#22C55E", label: "ACTIVE" };
  }
}

// ── Row Component ──

const BondingRow = memo(function BondingRow({ token }: { token: BondingToken }) {
  const colors = getProgressColor(token.progress, token.status);
  const statusCfg = getStatusConfig(token.status);
  const isRug = token.status === "rug";

  return (
    <div
      style={{
        display: "flex", alignItems: "center", padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        cursor: "pointer", transition: "background 0.1s",
        background: isRug ? "rgba(239,68,68,0.03)" : "transparent",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isRug ? "rgba(239,68,68,0.03)" : "transparent"; }}
    >
      {/* Token */}
      <div style={{ width: "110px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{
          width: "30px", height: "30px", borderRadius: "50%",
          background: colors.bg, display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "9px", fontWeight: 800, color: colors.text, flexShrink: 0,
        }}>{token.symbol.slice(0, 2)}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: isRug ? "#EF4444" : "#F0F4FC" }}>{token.symbol}</div>
          <div style={{ fontSize: "8px", color: "#4A5568", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70px" }}>{token.name}</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: "160px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "3px" }}>
          <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", color: colors.text }}>{token.progress.toFixed(1)}%</span>
          <span style={{ fontSize: "8px", color: "#4A5568" }}>K={token.k}</span>
        </div>
        <div style={{ height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ height: "100%", borderRadius: "3px", width: `${Math.min(token.progress, 100)}%`, background: colors.bar, transition: "width 0.3s" }} />
        </div>
        <div style={{ fontSize: "8px", color: "#4A5568", marginTop: "2px" }}>Created {token.createdAgo}</div>
      </div>

      {/* Market Cap */}
      <div style={{ width: "80px", textAlign: "right", fontSize: "11px", fontWeight: 700, fontFamily: "monospace" }}>{token.marketCap}</div>

      {/* Holders */}
      <div style={{ width: "60px", textAlign: "right", fontSize: "11px", fontWeight: 600, fontFamily: "monospace", color: "#7B8BA8" }}>{token.holders.toLocaleString()}</div>

      {/* Time Left */}
      <div style={{ width: "70px", textAlign: "right", fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: token.progress >= 95 && token.status === "active" ? "#EF4444" : "#F59E0B" }}>{token.timeLeft}</div>

      {/* Volume */}
      <div style={{ width: "80px", textAlign: "right", fontSize: "10px", fontFamily: "monospace", color: "#7B8BA8" }}>{token.volume}</div>

      {/* TXNS */}
      <div style={{ width: "70px", textAlign: "right", fontSize: "10px", fontFamily: "monospace" }}>
        <span style={{ color: "#22C55E" }}>{(token.buys24h / 1000).toFixed(1)}K</span>
        <span style={{ color: "#4A5568" }}>/</span>
        <span style={{ color: "#EF4444" }}>{(token.sells24h / 1000).toFixed(1)}K</span>
      </div>

      {/* Dev Sold */}
      <div style={{ width: "60px", textAlign: "right" }}>
        <span style={{
          fontSize: "10px", fontWeight: 700, fontFamily: "monospace",
          color: token.devSold > 10 ? "#EF4444" : token.devSold > 5 ? "#F59E0B" : "#22C55E",
        }}>{token.devSold}%</span>
      </div>

      {/* Status */}
      <div style={{ width: "60px", textAlign: "right" }}>
        <span style={{
          fontSize: "8px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px",
          background: statusCfg.bg, color: statusCfg.color,
        }}>{statusCfg.label}</span>
      </div>
    </div>
  );
});