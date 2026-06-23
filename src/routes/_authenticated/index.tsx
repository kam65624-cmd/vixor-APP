import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Vixor — Solana Meme Coin Terminal" }] }),
  component: HomePage,
});

const C = {
  bg: "#121212", surface: "#1E1E1E", surfaceLight: "#1a2035", surfaceHover: "#1e2438",
  border: "rgba(255,255,255,0.06)", borderLight: "rgba(255,255,255,0.04)",
  text: "#FFFFFF", textSecondary: "#9CA3AF", textTertiary: "#6B7280",
  blue: "#10B981", blueLight: "#34D399", green: "#22C55E", red: "#EF4444",
  yellow: "#F59E0B", purple: "#8B5CF6",
};

const QUICK_ACTIONS = [
  { label: "Discover", icon: "\uD83D\uDD0D", to: "/discover" as const, color: "#10B981" },
  { label: "AI Copilot", icon: "\uD83E\uDD16", to: "/copilot" as const, color: "#8B5CF6" },
  { label: "Whale Alerts", icon: "\uD83D\uDC0B", to: "/whale" as const, color: "#10B981" },
  { label: "PnL Tracker", icon: "\uD83D\uDCC8", to: "/pnl" as const, color: "#22C55E" },
  { label: "Alpha Signals", icon: "\u26A1", to: "/alpha" as const, color: "#F59E0B" },
  { label: "My Bags", icon: "\uD83C\uDF92", to: "/bags" as const, color: "#EC4899" },
];

const MiniSpark = memo(function MiniSpark({ up, small }: { up: boolean; small?: boolean }) {
  const w = small ? 48 : 60, h = small ? 16 : 20;
  const pts: string[] = [];
  const start = up ? 30 : 70, end = up ? 70 : 30;
  for (let i = 0; i <= 12; i++) {
    const x = (i / 12) * w, progress = i / 12;
    const base = start + (end - start) * progress;
    const noise = Math.sin(i * 2.3) * 8 + Math.cos(i * 1.7) * 5;
    const y = Math.max(2, Math.min(h - 2, h - base - noise));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} style={{ flexShrink: 0 }}>
      <polyline points={pts.join(" ")} fill="none" stroke={up ? C.green : C.red} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});

function HomePage() {
  const navigate = useNavigate();
  const fetchDashboard = useStableServerFn(getDashboardData);

  const dashQuery = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard({}),
    staleTime: 30_000,
  });

  const data = dashQuery.data;
  const isLoading = dashQuery.isLoading;
  const holdings = data?.holdings ?? [];
  const totalValue = data?.totalValue ?? 0;
  const totalPnl = data?.totalPnl ?? 0;
  const totalPnlPct = data?.totalPnlPct ?? 0;
  const tradeCount = data?.tradeCount ?? 0;
  const recentActivity = data?.recentActivity ?? [];
  const liveSignals = data?.liveSignals ?? [];

  const fmt = (n: number) =>
    n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(2)}K` : `$${n.toFixed(2)}`;
  const pnlFmt = (n: number) => (n >= 0 ? `+$${n.toFixed(2)}` : `-$${Math.abs(n).toFixed(2)}`);

  return (
    <div style={{ padding: "6px 8px", fontFamily: "'Inter', system-ui, sans-serif", color: C.text, minHeight: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
        {/* LEFT COLUMN — Portfolio */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, padding: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: "10px", color: C.textSecondary, marginBottom: "4px" }}>Total Portfolio</div>
                <div style={{ fontSize: "22px", fontWeight: 800, fontFamily: "monospace", lineHeight: 1 }}>{fmt(totalValue)}</div>
                {tradeCount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, fontFamily: "monospace", color: totalPnl >= 0 ? C.green : C.red }}>
                      {pnlFmt(totalPnl)} ({totalPnlPct >= 0 ? "+" : ""}{totalPnlPct.toFixed(1)}%)
                    </span>
                    <span style={{ fontSize: "9px", color: C.textTertiary }}>{tradeCount} trades</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Holdings</span>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/bags" })}>View All →</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ padding: "30px 0" }}>
                <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : holdings.length > 0 ? holdings.map((h) => (
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
                    <div style={{ fontSize: "9px", color: C.textSecondary }}>{h.amount.toFixed(2)} tokens</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, fontFamily: "monospace" }}>{fmt(h.value)}</div>
                  <div style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: h.up ? C.green : C.red }}>
                    {h.pnlPct >= 0 ? "+" : ""}{h.pnlPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            )) : (
              <div style={{ padding: "20px 10px", textAlign: "center", color: C.textTertiary, fontSize: "11px" }}>
                No trades yet. <span style={{ color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/trade-desk" })}>Start trading →</span>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Recent Activity</span>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/pnl" })}>History →</span>
            </div>
            {isLoading ? null : recentActivity.length > 0 ? recentActivity.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px", borderBottom: `1px solid ${C.borderLight}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", flexShrink: 0 }}>
                    {a.type === "buy" ? "\uD83D\uDFE2" : "\uD83D\uDD34"}
                  </span>
                  <span style={{ fontSize: "10px", color: C.textSecondary, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.msg}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  {a.pnl && <span style={{ fontSize: "10px", fontWeight: 600, fontFamily: "monospace", color: a.type === "sell" ? C.red : C.green }}>{a.pnl}</span>}
                  <span style={{ fontSize: "8px", color: C.textTertiary }}>{a.time}</span>
                </div>
              </div>
            )) : (
              <div style={{ padding: "16px 10px", textAlign: "center", color: C.textTertiary, fontSize: "11px" }}>
                No activity yet
              </div>
            )}
          </div>
        </div>

        {/* CENTER COLUMN — Signals + Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
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
              {isLoading ? (
                <div className="flex items-center justify-center" style={{ padding: "30px 0" }}>
                  <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                </div>
              ) : liveSignals.length > 0 ? liveSignals.map((s) => {
                const isBuy = s.type === "BUY";
                return (
                  <div key={s.token + s.type} style={{
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
              }) : (
                <div style={{ padding: "30px 10px", textAlign: "center", color: C.textTertiary, fontSize: "11px" }}>
                  No signals available yet
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontSize: "11px", fontWeight: 700 }}>Quick Actions</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "4px", padding: "6px" }}>
              {QUICK_ACTIONS.map((a) => (
                <button key={a.label} onClick={() => navigate({ to: a.to })} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                  padding: "10px 4px", borderRadius: "6px", cursor: "pointer",
                  background: C.surfaceLight, border: `1px solid ${C.border}`,
                  color: C.textSecondary, fontSize: "10px", fontWeight: 500,
                  transition: "all 0.15s",
                }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = C.surfaceHover; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = C.surfaceLight; e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)"; }}
                >
                  <span style={{ fontSize: "16px" }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Trending from signals */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>\uD83D\uDCA0</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Latest Analyses</span>
              </div>
              <span style={{ fontSize: "9px", color: C.blueLight, cursor: "pointer" }} onClick={() => navigate({ to: "/analyze" as any })}>Analyze →</span>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center" style={{ padding: "30px 0" }}>
                <div style={{ width: 24, height: 24, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#10B981", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : liveSignals.length > 0 ? liveSignals.map((s, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "6px",
                padding: "8px 10px", borderBottom: `1px solid ${C.borderLight}`, cursor: "pointer",
              }}
                onClick={() => navigate({ to: "/signals" })}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <span style={{ fontSize: "10px", marginTop: "1px", color: C.textTertiary, flexShrink: 0, width: "14px" }}>{i + 1}.</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: "10px", color: C.textSecondary, lineHeight: 1.4 }}>
                    <span style={{ fontWeight: 700, color: s.type === "BUY" ? C.green : s.type === "SELL" ? C.red : C.yellow }}>{s.token}</span>
                    {" "}{s.reason}
                  </span>
                </div>
              </div>
            )) : (
              <div style={{ padding: "30px 10px", textAlign: "center", color: C.textTertiary, fontSize: "11px" }}>
                Run an analysis to see results here
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: C.surface, borderRadius: "8px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", padding: "8px 10px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontSize: "12px" }}>\uD83D\uDCCA</span>
                <span style={{ fontSize: "11px", fontWeight: 700 }}>Stats</span>
              </div>
            </div>
            <div style={{ padding: "8px 10px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              {[
                { label: "Total Trades", value: String(tradeCount), color: C.blue },
                { label: "Holdings", value: String(holdings.length), color: C.purple },
                { label: "Signals", value: String(liveSignals.length), color: C.yellow },
                { label: "PnL", value: pnlFmt(totalPnl), color: totalPnl >= 0 ? C.green : C.red },
              ].map((s) => (
                <div key={s.label} style={{ padding: "8px", background: C.surfaceLight, borderRadius: "6px" }}>
                  <div style={{ fontSize: "8px", color: C.textTertiary, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</div>
                  <div style={{ fontSize: "14px", fontWeight: 800, fontFamily: "monospace", color: s.color, marginTop: "2px" }}>{isLoading ? "..." : s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}