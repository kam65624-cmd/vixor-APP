import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

// ── SOL Price Hook ──
function useSolPrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [change, setChange] = useState<number | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const fetchPrice = async () => {
      try {
        const res = await fetch("/api/sol-price");
        const data = await res.json();
        if (!cancelled) { setPrice(data.price); setChange(data.change24h); }
      } catch { /* keep last known */ }
    };
    fetchPrice();
    const interval = setInterval(fetchPrice, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);
  return { price, change };
}

// ── Data ──

const HOLDINGS = [
  { symbol: "POPCAT", name: "Popcat", pct: 44.1, amount: "8,000", value: "$9,840", pnl: "+$2,240", changePct: 29.5, up: true },
  { symbol: "WIF", name: "dogwifhat", pct: 27.4, amount: "2,500", value: "$6,125", pnl: "+$875", changePct: 16.7, up: true },
  { symbol: "BONK", name: "Bonk", pct: 19.4, amount: "150M", value: "$4,335", pnl: "-$240", changePct: -5.2, up: false },
  { symbol: "SPX", name: "SPX6900", pct: 4.8, amount: "1,200", value: "$1,068", pnl: "+$132", changePct: 14.1, up: true },
  { symbol: "MOG", name: "Mog Coin", pct: 4.3, amount: "5B", value: "$2,975", pnl: "-$1,025", changePct: -8.0, up: false },
];

const SIGNALS = [
  { token: "MEW", type: "BUY" as const, reason: "Volume spike + smart money entry detected", confidence: 82, price: "$0.012", change: "+15.4%" },
  { token: "BRETT", type: "SELL" as const, reason: "Whale distribution — 3 top holders selling", confidence: 71, price: "$0.034", change: "-8.7%" },
  { token: "FLOKI", type: "BUY" as const, reason: "Social sentiment 85% bullish, CEX listing rumor", confidence: 65, price: "$0.00023", change: "+7.8%" },
  { token: "GOAT", type: "SELL" as const, reason: "Dev wallet activity increasing, risk elevated", confidence: 78, price: "$0.45", change: "-12.3%" },
  { token: "WIF", type: "BUY" as const, reason: "Break above $2.50 resistance, next target $3.20", confidence: 87, price: "$2.45", change: "+22.1%" },
];

const MOVERS = [
  { symbol: "TURBO", name: "Turbo", price: "$0.0089", change: "+45.6%", up: true, volume: "$78M" },
  { symbol: "POPCAT", name: "Popcat", price: "$1.23", change: "+33.7%", up: true, volume: "$95M" },
  { symbol: "MOG", name: "Mog Coin", price: "$0.0000012", change: "+28.3%", up: true, volume: "$38M" },
  { symbol: "WIF", name: "dogwifhat", price: "$2.45", change: "+22.1%", up: true, volume: "$340M" },
  { symbol: "SPX", name: "SPX6900", price: "$0.89", change: "+18.9%", up: true, volume: "$56M" },
  { symbol: "MEW", name: "cat in a dogs world", price: "$0.012", change: "+15.4%", up: true, volume: "$42M" },
  { symbol: "FLOKI", name: "Floki Inu", price: "$0.00023", change: "+7.8%", up: true, volume: "$120M" },
  { symbol: "GOAT", name: "GOAT", price: "$0.45", change: "-12.3%", up: false, volume: "$185M" },
];

const TRENDING = [
  { title: "WIF breaks $2.50 resistance — next target $3.20", time: "2m ago", hot: true },
  { title: "Smart money accumulates 5M SPX tokens in 24h", time: "15m ago", hot: true },
  { title: "POPCAT listed on major CEX — volume surges 500%", time: "45m ago", hot: false },
  { title: "Solana DEX volume hits $2B daily record", time: "1h ago", hot: false },
  { title: "BONK community vote for new burn mechanism", time: "2h ago", hot: false },
  { title: "TURBO launched on Raydium — 10x in 4 hours", time: "3h ago", hot: false },
];

const ACTIVITY = [
  { msg: "Bought 2,500 WIF at $2.10", time: "2h ago", type: "buy" as const, pnl: "+$875" },
  { msg: "Sold 5B GOAT at $0.45", time: "5h ago", type: "sell" as const, pnl: "-$404" },
  { msg: "Bought 8,000 POPCAT at $0.95", time: "8h ago", type: "buy" as const, pnl: "+$2,240" },
  { msg: "Received referral bonus: +500 pts", time: "12h ago", type: "reward" as const, pnl: "" },
  { msg: "Alpha signal: WIF breakout above $2.50", time: "1d ago", type: "signal" as const, pnl: "" },
];

const QUICK_ACTIONS = [
  { label: "Discover", icon: "\uD83D\uDD0D", to: "/discover", color: "#3B82F6" },
  { label: "AI Copilot", icon: "\uD83E\uDD16", to: "/copilot", color: "#8B5CF6" },
  { label: "Whale Alerts", icon: "\uD83D\uDC0B", to: "/whale", color: "#3B82F6" },
  { label: "PnL Tracker", icon: "\uD83D\uDCC8", to: "/pnl", color: "#22C55E" },
  { label: "Alpha Signals", icon: "\u26A1", to: "/alpha", color: "#F59E0B" },
  { label: "My Bags", icon: "\uD83C\uDF92", to: "/bags", color: "#EC4899" },
];

// ── Colors ──

const C = {
  bg: "#0f1424",
  surface: "#161b2e",
  surfaceLight: "#1a2035",
  surfaceHover: "#1e2438",
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.04)",
  text: "#F0F4FC",
  textSecondary: "#7B8BA8",
  textTertiary: "#4A5568",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  green: "#22C55E",
  red: "#EF4444",
  yellow: "#F59E0B",
  purple: "#8B5CF6",
};

// ── Sparkline ──

const MiniSpark = memo(function MiniSpark({ up, small }: { up: boolean; small?: boolean }) {
  const w = small ? 48 : 60;
  const h = small ? 16 : 20;
  const pts: string[] = [];
  const start = up ? 30 : 70;
  const end = up ? 70 : 30;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * w;
    const progress = i / 12;
    const base = start + (end - start) * progress;
    const noise = (Math.sin(i * 2.3) * 8 + Math.cos(i * 1.7) * 5);
    const y = Math.max(2, Math.min(h - 2, h - base - noise));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={up ? C.green : C.red} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});

// ── Page ──

function HomePage() {
  const navigate = useNavigate();
  const sol = useSolPrice();
  const solUp = (sol.change ?? 0) >= 0;

  return (
    <div style={{ padding: "6px 8px", fontFamily: "'Inter', system-ui, sans-serif", color: C.text, minHeight: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>

        {/* ═══════════════════════════════════════════
            LEFT COLUMN — Portfolio
            ═══════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Portfolio Value Card */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", color: C.textSecondary, marginBottom: "4px" }}>Total Portfolio</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", color: C.text, lineHeight: 1 }}>$22,343</div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                  <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: C.green }}>+$1,982 (+9.7%)</span>
                  <span style={{ fontSize: "9px", color: C.textTertiary }}>24h</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "9px", color: C.textTertiary }}>SOL</div>
                <div style={{ fontSize: "12px", fontWeight: 700, fontFamily: "monospace", color: solUp ? C.green : C.red }}>
                  {sol.price ? `$${sol.price.toFixed(2)}` : "..."}
                  {sol.change != null && <span> {solUp ? "+" : ""}{sol.change.toFixed(1)}%</span>}
                </div>
                <div style={{ fontSize: "9px", color: C.textTertiary, marginTop: "2px" }}>Balance: 12.45 SOL</div>
              </div>
            </div>
          </div>

          {/* Holdings */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Holdings</span>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/bags" })}>View All →</span>
            </div>
            {HOLDINGS.map((h) => (
              <div key={h.symbol} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "7px 10px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
                transition: "background 0.1s",
              }} onClick={() => navigate({ to: "/bags" })}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{
                    width: "26px", height: "26px", borderRadius: "50%",
                    background: h.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "8px", fontWeight: 800, color: h.up ? C.green : C.red,
                    flexShrink: 0, border: `1px solid ${h.up ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)"}`,
                  }}>{h.symbol.slice(0, 2)}</div>
                  <div>
                    <div style={{ fontSize: "11px", fontWeight: 700 }}>{h.symbol}</div>
                    <div style={{ fontSize: "9px", color: C.textSecondary }}>{h.amount} · {h.pct}%</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{h.value}</div>
                  <div style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: h.up ? C.green : C.red }}>
                    {h.pnl}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Activity */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Recent Activity</span>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/pnl" })}>History →</span>
            </div>
            {ACTIVITY.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", flexShrink: 0 }}>
                    {a.type === "buy" ? "\uD83D\uDFE2" : a.type === "sell" ? "\uD83D\uDD34" : a.type === "signal" ? "\u26A1" : "\uD83C\uDFC6"}
                  </span>
                  <span style={{ fontSize: "10px", color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {a.pnl && <span style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: a.type === "sell" ? C.red : C.green }}>{a.pnl}</span>}
                  <span style={{ fontSize: "8px", color: C.textTertiary }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            CENTER COLUMN — Signals + Quick Actions
            ═══════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Live Signals */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>\u26A1</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Live Signals</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "9px", color: C.textTertiary }}>AI-Powered</span>
              </div>
            </div>
            <div style={{ padding: "4px" }}>
              {SIGNALS.map((s) => {
                const isBuy = s.type === "BUY";
                return (
                  <div key={s.token} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "7px 8px", marginBottom: "3px", borderRadius: "6px", cursor: "pointer",
                    background: isBuy ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)",
                    border: `1px solid ${isBuy ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
                    transition: "background 0.15s",
                  }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = isBuy ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = isBuy ? "rgba(34,197,94,0.04)" : "rgba(239,68,68,0.04)")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: "8px", fontWeight: 800, padding: "2px 5px", borderRadius: "3px",
                        background: isBuy ? "rgba(34,197,94,0.2)" : "rgba(239,68,68,0.2)",
                        color: isBuy ? C.green : C.red, flexShrink: 0,
                      }}>{s.type}</span>
                      <span style={{ fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>{s.token}</span>
                      <span style={{ fontSize: "9px", color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.reason}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, marginLeft: "8px" }}>
                      <span style={{ fontSize: "11px", fontWeight: 800, fontFamily: "monospace", width: "28px", textAlign: "right", color: C.yellow }}>{s.confidence}%</span>
                      <MiniSpark up={isBuy} small />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Quick Actions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", padding: "6px" }}>
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} onClick={() => navigate({ to: a.to as any })} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "10px 4px", borderRadius: "6px", cursor: "pointer",
                  background: C.surfaceLight, border: `1px solid ${C.border}`,
                  color: C.textSecondary, fontSize: "10px", fontWeight: 500,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.surfaceLight; e.currentTarget.style.borderColor = `rgba(255,255,255,0.06)`; }}
                >
                  <span style={{ fontSize: "16px" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════
            RIGHT COLUMN — Movers + Trending
            ═══════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {/* Top Movers */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>\uD83D\uDD25</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Top Movers</span>
              </div>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/discover" })}>Discover →</span>
            </div>
            {MOVERS.map((m) => (
              <div key={m.symbol} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "6px 10px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
              }}
                onClick={() => navigate({ to: "/discover" })}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: "24px", height: "24px", borderRadius: "50%",
                    background: m.up ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "7px", fontWeight: 800, color: m.up ? C.green : C.red, flexShrink: 0,
                  }}>{m.symbol.slice(0, 2)}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "11px", fontWeight: 700 }}>{m.symbol}</div>
                    <div style={{ fontSize: "9px", color: C.textTertiary }}>{m.volume}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontSize: "10px", fontFamily: "monospace", color: C.textSecondary }}>{m.price}</span>
                  <span style={{ fontSize: "10px", fontWeight: 700, fontFamily: "monospace", color: m.up ? C.green : C.red }}>{m.change}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Trending */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>\uD83D\uDCA0</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Trending</span>
              </div>
            </div>
            {TRENDING.map((t, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "6px",
                padding: "6px 10px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
              }}
                onClick={() => navigate({ to: "/pulse" })}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "10px", marginTop: "1px", color: C.textTertiary, flexShrink: 0, width: "14px" }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", color: C.textSecondary, lineHeight: 1.4, display: "flex", alignItems: "center", gap: "4px" }}>
                    {t.title}
                    {t.hot && <span style={{ fontSize: "7px", fontWeight: 700, padding: "1px 4px", borderRadius: "2px", background: "rgba(239,68,68,0.15)", color: C.red, flexShrink: 0 }}>HOT</span>}
                  </span>
                </div>
                <span style={{ fontSize: "8px", color: C.textTertiary, flexShrink: 0 }}>{t.time}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}