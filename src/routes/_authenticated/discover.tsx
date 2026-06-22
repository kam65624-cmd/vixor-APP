"use client";

import { createFileRoute } from "@tanstack/react-router";
import { Search, RefreshCw, ArrowUpDown, Filter, Star, Download, ExternalLink, Heart, Eye } from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";
import { useQuery } from "@tanstack/react-query";

// ── Types ──

interface DiscoverToken {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  change5m: number;
  change1h: number;
  volume24h: number;
  liquidity: number;
  smartMoneyPct: number;
  devWalletPct: number;
  whaleHoldingsPct: number;
  txCount24h: number;
  buys24h: number;
  sells24h: number;
  risk: "low" | "medium" | "high";
  chain: string;
  marketCap: number;
  paid: boolean;
  age: string;
  views: number;
  sparkline: number[];
}

// ── Mock Data ──

function genSparkline(up: boolean): number[] {
  const pts: number[] = [50];
  for (let i = 1; i < 20; i++) {
    pts.push(pts[i - 1] + (up ? 1 : -1) * (Math.random() * 4 - (up ? 1 : -1)));
  }
  return pts;
}

const MOCK_TOKENS: DiscoverToken[] = [
  { symbol: "WIF", name: "dogwifhat", price: 2.45, change24h: 22.1, change5m: 1.2, change1h: 8.5, volume24h: 340_000_000, liquidity: 180_000_000, smartMoneyPct: 55, devWalletPct: 3, whaleHoldingsPct: 42, txCount24h: 28500, buys24h: 16200, sells24h: 12300, risk: "medium", chain: "Solana", marketCap: 2_400_000_000, paid: false, age: "24m", views: 12400, sparkline: genSparkline(true) },
  { symbol: "POPCAT", name: "Popcat", price: 1.23, change24h: 33.7, change5m: 2.1, change1h: 12.3, volume24h: 95_000_000, liquidity: 42_000_000, smartMoneyPct: 48, devWalletPct: 2, whaleHoldingsPct: 38, txCount24h: 18200, buys24h: 11400, sells24h: 6800, risk: "low", chain: "Solana", marketCap: 890_000_000, paid: true, age: "1h", views: 8900, sparkline: genSparkline(true) },
  { symbol: "BONK", name: "Bonk", price: 0.0000289, change24h: -1.5, change5m: -0.3, change1h: -2.1, volume24h: 210_000_000, liquidity: 95_000_000, smartMoneyPct: 35, devWalletPct: 1, whaleHoldingsPct: 28, txCount24h: 45000, buys24h: 22000, sells24h: 23000, risk: "low", chain: "Solana", marketCap: 1_800_000_000, paid: true, age: "5m", views: 4500, sparkline: genSparkline(false) },
  { symbol: "SPX", name: "SPX6900", price: 0.89, change24h: 18.9, change5m: 0.8, change1h: 5.4, volume24h: 56_000_000, liquidity: 28_000_000, smartMoneyPct: 62, devWalletPct: 4, whaleHoldingsPct: 51, txCount24h: 8900, buys24h: 5200, sells24h: 3700, risk: "medium", chain: "Solana", marketCap: 340_000_000, paid: false, age: "2m", views: 3200, sparkline: genSparkline(true) },
  { symbol: "TURBO", name: "Turbo", price: 0.0089, change24h: 45.6, change5m: 3.2, change1h: 15.7, volume24h: 78_000_000, liquidity: 12_000_000, smartMoneyPct: 28, devWalletPct: 8, whaleHoldingsPct: 35, txCount24h: 12400, buys24h: 7800, sells24h: 4600, risk: "high", chain: "Solana", marketCap: 56_000_000, paid: false, age: "1h", views: 6700, sparkline: genSparkline(true) },
  { symbol: "GOAT", name: "GOAT", price: 0.45, change24h: -12.3, change5m: -1.8, change1h: -8.2, volume24h: 185_000_000, liquidity: 65_000_000, smartMoneyPct: 22, devWalletPct: 15, whaleHoldingsPct: 55, txCount24h: 21000, buys24h: 8400, sells24h: 12600, risk: "high", chain: "Solana", marketCap: 450_000_000, paid: true, age: "24m", views: 9100, sparkline: genSparkline(false) },
  { symbol: "MEW", name: "cat in a dogs world", price: 0.012, change24h: 15.4, change5m: 0.6, change1h: 4.2, volume24h: 42_000_000, liquidity: 18_000_000, smartMoneyPct: 58, devWalletPct: 2, whaleHoldingsPct: 40, txCount24h: 15600, buys24h: 9400, sells24h: 6200, risk: "low", chain: "Solana", marketCap: 120_000_000, paid: false, age: "5m", views: 2100, sparkline: genSparkline(true) },
  { symbol: "BRETT", name: "Brett", price: 0.034, change24h: -8.7, change5m: -1.1, change1h: -5.3, volume24h: 67_000_000, liquidity: 35_000_000, smartMoneyPct: 31, devWalletPct: 6, whaleHoldingsPct: 48, txCount24h: 19800, buys24h: 7900, sells24h: 11900, risk: "medium", chain: "Solana", marketCap: 280_000_000, paid: true, age: "2m", views: 5400, sparkline: genSparkline(false) },
  { symbol: "FLOKI", name: "Floki Inu", price: 0.00023, change24h: 7.8, change5m: 0.4, change1h: 3.1, volume24h: 120_000_000, liquidity: 55_000_000, smartMoneyPct: 44, devWalletPct: 2, whaleHoldingsPct: 33, txCount24h: 32000, buys24h: 17800, sells24h: 14200, risk: "low", chain: "Solana", marketCap: 2_100_000_000, paid: true, age: "1h", views: 7800, sparkline: genSparkline(true) },
  { symbol: "MOG", name: "Mog Coin", price: 0.0000012, change24h: 28.3, change5m: 2.5, change1h: 9.8, volume24h: 38_000_000, liquidity: 15_000_000, smartMoneyPct: 65, devWalletPct: 1, whaleHoldingsPct: 52, txCount24h: 7200, buys24h: 4800, sells24h: 2400, risk: "medium", chain: "Solana", marketCap: 92_000_000, paid: false, age: "24m", views: 1800, sparkline: genSparkline(true) },
];

// ── Helpers ──

function fmt(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(n < 0.01 ? 8 : 4)}`;
}
function fmtCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}
function fmtViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// ── Sparkline Component ──

const Sparkline = memo(function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  const w = 80, h = 24, pad = 2;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={points} fill="none" stroke={up ? "#22C55E" : "#EF4444"} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
});

// ── Tabs ──

const TABS = ["Top", "Trending", "Surge", "DEX Screener", "Pump Live"] as const;
const TIMEFRAMES = ["1m", "5m", "30m", "1h"] as const;

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: DiscoverPage,
});

function DiscoverPage() {
  const [activeTab, setActiveTab] = useState<string>("Trending");
  const [activeTime, setActiveTime] = useState<string>("5m");
  const [sortCol, setSortCol] = useState<string>("change24h");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  const { data: tokens = MOCK_TOKENS } = useQuery({
    queryKey: ["discover-tokens"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/discover");
        if (res.ok) return await res.json();
      } catch { /* fallback */ }
      return MOCK_TOKENS;
    },
    refetchInterval: 30_000,
  });

  const handleSort = useCallback((col: string) => {
    if (sortCol === col) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortCol(col); setSortDir("desc"); }
  }, [sortCol]);

  const sorted = [...tokens]
    .filter((t) => !search || t.symbol.toLowerCase().includes(search.toLowerCase()) || t.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortCol as keyof DiscoverToken] as number;
      const bv = b[sortCol as keyof DiscoverToken] as number;
      return sortDir === "desc" ? bv - av : av - bv;
    });

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Filter Bar ── */}
      <div style={{
        display: "flex", alignItems: "center", gap: "4px", padding: "6px 8px",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#121826",
        overflowX: "auto",
      }}>
        {/* Tabs */}
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            fontSize: "11px", fontWeight: 600, padding: "4px 12px", borderRadius: "4px",
            border: "none", cursor: "pointer", whiteSpace: "nowrap",
            color: activeTab === tab ? "#fff" : "#64748b",
            background: activeTab === tab ? "rgba(59,130,246,0.15)" : "transparent",
            borderBottom: activeTab === tab ? "2px solid #3B82F6" : "2px solid transparent",
          }}>{tab}</button>
        ))}

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />

        {/* Timeframes */}
        {TIMEFRAMES.map((tf) => (
          <button key={tf} onClick={() => setActiveTime(tf)} style={{
            fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "3px",
            border: "none", cursor: "pointer",
            color: activeTime === tf ? "#60A5FA" : "#64748b",
            background: activeTime === tf ? "rgba(59,130,246,0.12)" : "transparent",
          }}>{tf}</button>
        ))}

        <div style={{ flex: 1 }} />

        {/* Right controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <div style={{ position: "relative" }}>
            <Search size={12} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
            <input
              value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tokens..."
              style={{
                fontSize: "10px", padding: "4px 8px 4px 26px", borderRadius: "4px", width: "140px",
                background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
                outline: "none",
              }}
            />
          </div>
          <button style={{ padding: "4px", borderRadius: "4px", border: "none", background: "transparent", color: "#64748b", cursor: "pointer" }}><Filter size={13} /></button>
          <button style={{ padding: "4px", borderRadius: "4px", border: "none", background: "transparent", color: "#64748b", cursor: "pointer" }}><Star size={13} /></button>
          <button style={{ padding: "4px", borderRadius: "4px", border: "none", background: "transparent", color: "#64748b", cursor: "pointer" }}><Download size={13} /></button>
          <button onClick={() => {}} style={{ padding: "4px", borderRadius: "4px", border: "none", background: "transparent", color: "#64748b", cursor: "pointer" }}><RefreshCw size={13} /></button>
          <input
            placeholder="Quick Buy 0.0"
            style={{
              fontSize: "10px", padding: "4px 8px", borderRadius: "4px", width: "110px",
              background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)", color: "#fff",
              outline: "none",
            }}
          />
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <TH label="Pair Info" />
              <TH label="Market Cap" onClick={() => handleSort("marketCap")} active={sortCol === "marketCap"} dir={sortDir} />
              <TH label="Liquidity" onClick={() => handleSort("liquidity")} active={sortCol === "liquidity"} dir={sortDir} />
              <TH label="Volume" onClick={() => handleSort("volume24h")} active={sortCol === "volume24h"} dir={sortDir} />
              <TH label="TXNS" onClick={() => handleSort("txCount24h")} active={sortCol === "txCount24h"} dir={sortDir} />
              <TH label="Token Info" />
              <TH label="Action" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.symbol} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer", transition: "background 0.1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Pair Info */}
                <td style={{ padding: "6px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                      width: "28px", height: "28px", borderRadius: "50%",
                      background: t.change24h >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "9px", fontWeight: 800, color: t.change24h >= 0 ? "#22C55E" : "#EF4444",
                      flexShrink: 0,
                    }}>{t.symbol.slice(0, 2)}</div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: "#fff", fontSize: "11px" }}>{t.symbol}</div>
                      <div style={{ fontSize: "9px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "90px" }}>{t.name}</div>
                    </div>
                    <span style={{ fontSize: "9px", color: "#64748b", flexShrink: 0 }}>{t.age}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0, color: "#64748b" }}>
                      <Heart size={10} /><Eye size={10} /><span style={{ fontSize: "9px" }}>{fmtViews(t.views)}</span>
                    </div>
                  </div>
                </td>

                {/* Market Cap + Chart */}
                <td style={{ padding: "6px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sparkline data={t.sparkline} up={t.change24h >= 0} />
                    <div>
                      <div style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: "#fff" }}>{fmt(t.marketCap)}</div>
                      <div style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: t.change24h >= 0 ? "#22C55E" : "#EF4444" }}>
                        {t.change24h >= 0 ? "+" : ""}{t.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                </td>

                {/* Liquidity */}
                <td style={{ padding: "6px 10px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8" }}>{fmt(t.liquidity)}</span>
                </td>

                {/* Volume */}
                <td style={{ padding: "6px 10px" }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: "#94a3b8" }}>{fmt(t.volume24h)}</span>
                </td>

                {/* TXNS */}
                <td style={{ padding: "6px 10px" }}>
                  <div style={{ fontSize: "10px", fontFamily: "monospace" }}>
                    <span style={{ color: "#fff", fontWeight: 600 }}>{fmtCount(t.txCount24h)}</span>
                    <div style={{ display: "flex", gap: "4px", marginTop: "2px" }}>
                      <span style={{ color: "#22C55E" }}>{fmtCount(t.buys24h)}</span>
                      <span style={{ color: "#64748b" }}>/</span>
                      <span style={{ color: "#EF4444" }}>{fmtCount(t.sells24h)}</span>
                    </div>
                  </div>
                </td>

                {/* Token Info */}
                <td style={{ padding: "6px 10px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                    <div style={{ display: "flex", gap: "6px", fontSize: "9px" }}>
                      <span style={{ color: "#64748b" }}>SM</span>
                      <span style={{ color: "#60A5FA", fontWeight: 600 }}>{t.smartMoneyPct}%</span>
                      <span style={{ color: "#64748b" }}>Dev</span>
                      <span style={{ color: t.devWalletPct > 5 ? "#EF4444" : "#94a3b8", fontWeight: 600 }}>{t.devWalletPct}%</span>
                      <span style={{ color: "#64748b" }}>Whale</span>
                      <span style={{ color: t.whaleHoldingsPct > 50 ? "#F59E0B" : "#94a3b8", fontWeight: 600 }}>{t.whaleHoldingsPct}%</span>
                    </div>
                    <span style={{
                      fontSize: "8px", fontWeight: 700, padding: "1px 6px", borderRadius: "3px", width: "fit-content",
                      background: t.paid ? "rgba(34,197,94,0.15)" : "rgba(100,116,139,0.15)",
                      color: t.paid ? "#22C55E" : "#64748b",
                    }}>{t.paid ? "Paid" : "Unpaid"}</span>
                  </div>
                </td>

                {/* Action */}
                <td style={{ padding: "6px 10px" }}>
                  <button style={{
                    fontSize: "10px", fontWeight: 700, padding: "4px 14px", borderRadius: "4px", border: "none",
                    background: "#3B82F6", color: "#fff", cursor: "pointer",
                  }}>Buy</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Table Header Cell ──

function TH({ label, onClick, active, dir }: { label: string; onClick?: () => void; active?: boolean; dir?: "asc" | "desc" }) {
  return (
    <th
      onClick={onClick}
      style={{
        padding: "8px 10px", textAlign: "left", fontWeight: 600, fontSize: "10px",
        color: active ? "#60A5FA" : "#64748b", whiteSpace: "nowrap", cursor: onClick ? "pointer" : "default",
        borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0f1424",
      }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
        {label}
        {active && <ArrowUpDown size={10} style={{ opacity: 0.7 }} />}
      </span>
    </th>
  );
}