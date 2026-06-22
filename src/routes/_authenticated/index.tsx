import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Flame, Zap, Bell, ChevronRight, Bot, BarChart3, Briefcase, TrendingUp, Activity } from "lucide-react";
import { memo, useState } from "react";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

// ── Data ──────────────────────────────────────────────────────────────

const HOLDINGS = [
  { symbol: "POPCAT", name: "Popcat", pct: 29.5, amount: "59,840", change: "+29.5%", up: true },
  { symbol: "WIF", name: "dogwifhat", pct: 16.7, amount: "96,125", change: "+16.7%", up: true },
  { symbol: "BONK", name: "Bonk", pct: 8.2, amount: "34,335", change: "-5.2%", up: false },
];

const ACTIVITY = [
  { msg: "Bought 500 WIF at $2.40", time: "2h ago", type: "buy" as const },
  { msg: "Sold 1M GOAT at $0.45", time: "5h ago", type: "sell" as const },
  { msg: "Received referral bonus: +500 pts", time: "8h ago", type: "reward" as const },
  { msg: "Alpha signal: POPCAT breakout", time: "12h ago", type: "signal" as const },
];

const SIGNALS = [
  { token: "MEW", type: "BUY" as const, reason: "Volume spike + smart money entry", confidence: 82 },
  { token: "BRETT", type: "SELL" as const, reason: "Whale distribution detected", confidence: 71 },
  { token: "FLOKI", type: "BUY" as const, reason: "Social sentiment turning bullish", confidence: 65 },
  { token: "GOAT", type: "SELL" as const, reason: "Dev wallet activity increasing", confidence: 78 },
];

const MOVERS = [
  { symbol: "WIF", price: "$2.45", change: "+22.1%", up: true },
  { symbol: "POPCAT", price: "$1.23", change: "+33.7%", up: true },
  { symbol: "BONK", price: "$0.0000289", change: "-1.5%", up: false },
  { symbol: "SPX", price: "$0.89", change: "+18.9%", up: true },
  { symbol: "TURBO", price: "$0.0089", change: "+45.6%", up: true },
  { symbol: "GOAT", price: "$0.45", change: "-12.3%", up: false },
];

const TRENDING = [
  { title: "WIF breaks $2.50 resistance — next target $3.20", time: "2m ago" },
  { title: "Smart money accumulates 5M SPX tokens in 24h", time: "15m ago" },
  { title: "BONK community vote for new burn mechanism", time: "30m ago" },
  { title: "POPCAT listed on major CEX — volume surges 500%", time: "45m ago" },
  { title: "Solana DEX volume hits $2B daily record", time: "1h ago" },
];

const QUICK_ACTIONS = [
  { label: "AI Copilot", icon: <Bot size={14} />, to: "/copilot" },
  { label: "Discover Tokens", icon: <Activity size={14} />, to: "/discover" },
  { label: "Whale Alerts", icon: <span style={{ fontSize: "14px" }}>&#128011;</span>, to: "/whale" },
  { label: "Portfolio", icon: <Briefcase size={14} />, to: "/portfolio" },
  { label: "Alpha Signals", icon: <Zap size={14} />, to: "/alpha" },
  { label: "PnL Tracker", icon: <TrendingUp size={14} />, to: "/pnl" },
];

// ── Styles ────────────────────────────────────────────────────────────

const S = {
  panel: { background: "#1a1f2e", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" },
  panelHead: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  panelTitle: { fontSize: "12px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "6px" },
  panelSub: { fontSize: "10px", color: "#64748b" },
  row: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" },
  rowHover: { background: "rgba(255,255,255,0.02)" },
  green: "#22C55E",
  red: "#EF4444",
  muted: "#64748b",
  secondary: "#94a3b8",
  blue: "#3B82F6",
};

// ── Page ──────────────────────────────────────────────────────────────

function HomePage() {
  const navigate = useNavigate();
  const [portfolioTab, setPortfolioTab] = useState<"overview" | "portfolio">("overview");

  return (
    <div style={{ padding: "8px", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", maxWidth: "100%" }}>

        {/* ═══════════════════════════════════════════════════════════
            LEFT COLUMN — Portfolio
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ ...S.panel, display: "flex", flexDirection: "column" }}>
          {/* Tabs */}
          <div style={{ ...S.panelHead, gap: "8px" }}>
            <div style={{ display: "flex", gap: "0" }}>
              {(["overview", "portfolio"] as const).map((tab) => (
                <button key={tab} onClick={() => setPortfolioTab(tab)} style={{
                  fontSize: "11px", fontWeight: 600, padding: "4px 12px",
                  color: portfolioTab === tab ? "#fff" : S.muted,
                  background: portfolioTab === tab ? "rgba(59,130,246,0.15)" : "transparent",
                  border: "none", borderBottom: portfolioTab === tab ? "2px solid #3B82F6" : "2px solid transparent",
                  cursor: "pointer", textTransform: "capitalize",
                }}>{tab}</button>
              ))}
            </div>
            <span style={{ fontSize: "10px", color: S.muted }}>$74.83</span>
          </div>

          {/* Portfolio Value */}
          <div style={{ padding: "12px" }}>
            <div style={{ fontSize: "10px", color: S.muted, marginBottom: "4px" }}>Total Value</div>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#fff", fontFamily: "monospace", lineHeight: 1 }}>$22,343</div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span style={{ fontSize: "12px", fontWeight: 700, color: S.green, fontFamily: "monospace" }}>+$1,982 (+9.7%)</span>
              <span style={{ fontSize: "9px", color: S.muted }}>24h</span>
            </div>
          </div>

          {/* Holdings */}
          <div style={{ flex: 1 }}>
            {HOLDINGS.map((h) => (
              <div key={h.symbol} style={S.row} onClick={() => navigate({ to: "/bags" })}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "28px", height: "28px", borderRadius: "50%",
                    background: "rgba(59,130,246,0.12)", display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "9px", fontWeight: 800, color: "#60A5FA",
                  }}>{h.symbol.slice(0, 2)}</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{h.symbol}</div>
                    <div style={{ fontSize: "9px", color: S.muted }}>{h.pct}% {h.amount}</div>
                  </div>
                </div>
                <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", color: h.up ? S.green : S.red }}>{h.change}</span>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ ...S.panelHead, padding: "8px 12px" }}>
              <div style={{ ...S.panelTitle, fontSize: "11px" }}>
                <Bell size={13} style={{ color: S.blue }} /> Recent Activity
              </div>
            </div>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ ...S.row, padding: "6px 12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "8px" }}>
                    {a.type === "buy" ? "\uD83D\uDFE2" : a.type === "sell" ? "\uD83D\uDD34" : a.type === "signal" ? "\u26A1" : "\uD83C\uDFC6"}
                  </span>
                  <span style={{ fontSize: "10px", color: S.secondary }}>{a.msg}</span>
                </div>
                <span style={{ fontSize: "8px", color: S.muted }}>{a.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            CENTER COLUMN — Live Signals + Quick Actions
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Signals Panel */}
          <div style={{ ...S.panel, flex: 1 }}>
            <div style={S.panelHead}>
              <div style={{ ...S.panelTitle }}>
                <Zap size={14} style={{ color: "#F59E0B" }} /> Live Signals
              </div>
              <span style={{ ...S.panelSub }}>AI-powered trading signals</span>
            </div>
            <div style={{ padding: "6px" }}>
              {SIGNALS.map((s) => {
                const isBuy = s.type === "BUY";
                return (
                  <div key={s.token} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "8px 10px", marginBottom: "4px", borderRadius: "6px", cursor: "pointer",
                    background: isBuy ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${isBuy ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)"}`,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: "9px", fontWeight: 800, padding: "2px 6px", borderRadius: "3px",
                        background: isBuy ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                        color: isBuy ? S.green : S.red,
                      }}>{s.type}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff", flexShrink: 0 }}>{s.token}</span>
                      <span style={{ fontSize: "10px", color: S.secondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                      <button style={{
                        fontSize: "9px", fontWeight: 700, padding: "3px 10px", borderRadius: "4px", border: "none",
                        background: isBuy ? S.green : S.red, color: "#fff", cursor: "pointer",
                      }}>{s.type}</button>
                      <span style={{ fontSize: "11px", fontWeight: 800, color: "#F59E0B", width: "28px", textAlign: "right" }}>{s.confidence}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div style={{ ...S.panel }}>
            <div style={S.panelHead}>
              <div style={{ ...S.panelTitle }}>
                <Zap size={14} style={{ color: "#F59E0B" }} /> Quick Actions
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", padding: "8px" }}>
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} onClick={() => navigate({ to: a.to as any })} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "10px 4px", borderRadius: "6px", cursor: "pointer",
                  background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.06)",
                  color: S.secondary, fontSize: "10px", fontWeight: 500,
                  transition: "all 0.15s",
                }}>
                  <span style={{ color: "#60A5FA" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            RIGHT COLUMN — Top Movers + Trending
            ═══════════════════════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {/* Top Movers */}
          <div style={{ ...S.panel, flex: 1 }}>
            <div style={S.panelHead}>
              <div style={{ ...S.panelTitle }}>
                <Flame size={14} style={{ color: "#F59E0B" }} /> Top Movers
              </div>
            </div>
            {MOVERS.map((m) => (
              <div key={m.symbol} style={S.row} onClick={() => navigate({ to: "/discover" })}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: m.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 800, color: m.up ? S.green : S.red,
                  }}>{m.symbol.slice(0, 2)}</div>
                  <span style={{ fontSize: "11px", fontWeight: 700, color: "#fff" }}>{m.symbol}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: S.secondary }}>{m.price}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", color: m.up ? S.green : S.red }}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trending */}
          <div style={{ ...S.panel, flex: 1 }}>
            <div style={S.panelHead}>
              <div style={{ ...S.panelTitle }}>
                <Flame size={14} style={{ color: "#F59E0B" }} /> Trending
              </div>
            </div>
            {TRENDING.map((t, i) => (
              <div key={i} style={{ ...S.row, padding: "6px 12px" }} onClick={() => navigate({ to: "/pulse" })}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", flex: 1 }}>
                  <span style={{ fontSize: "10px", marginTop: "1px", color: S.muted }}>{i + 1}.</span>
                  <span style={{ fontSize: "10px", color: S.secondary, lineHeight: 1.4 }}>{t.title}</span>
                </div>
                <span style={{ fontSize: "8px", color: S.muted, flexShrink: 0, marginLeft: "6px" }}>{t.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}