import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/trackers")({
  head: () => ({ meta: [{ title: "Trackers — Vixor Terminal" }] }),
  component: TrackersPage,
});

function TrackersPage() {
  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📊</span>
          <h1 className="text-lg font-bold">Trackers</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Monitor top wallets, smart money flows, and market movers</p>
      </div>

      <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
        {/* Smart Money Wallets */}
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span>🧠</span>
            <span className="text-[12px] font-bold">Smart Money Wallets</span>
          </div>
          {["7xKXtg2...3nPB — WIF, POPCAT, BONK (+12.4% this week)", "4pHDkCK...8vW2 — SPX, MEW, TURBO (+8.2% this week)", "Dj8sN2m...4eLk — SOL staking, LP positions (+3.1% this week)"].map((w, i) => (
            <div key={i} className="flex items-center gap-2 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[9px] font-mono px-1.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#60A5FA" }}>#{i + 1}</span>
              <span className="text-[11px] font-mono">{w}</span>
            </div>
          ))}
        </div>

        {/* Top Traders */}
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span>🏆</span>
            <span className="text-[12px] font-bold">Top Traders (24h)</span>
          </div>
          {[
            { rank: 1, wallet: "Hn2vE7c...6wPj", pnl: "+$142K", winRate: "78%" },
            { rank: 2, wallet: "Bn4TEvx...9kR3", pnl: "+$98K", winRate: "72%" },
            { rank: 3, wallet: "Kx9mN3d...7tRq", pnl: "+$85K", winRate: "68%" },
          ].map((t) => (
            <div key={t.rank} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold px-1.5 rounded" style={{ background: t.rank === 1 ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)", color: t.rank === 1 ? "#F59E0B" : "#7B8BA8" }}>#{t.rank}</span>
                <span className="text-[11px] font-mono">{t.wallet}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono font-bold" style={{ color: "#22C55E" }}>{t.pnl}</span>
                <span className="text-[9px]" style={{ color: "#7B8BA8" }}>{t.winRate} WR</span>
              </div>
            </div>
          ))}
        </div>

        {/* Token Watchlist */}
        <div className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="flex items-center gap-2 mb-3">
            <span>👀</span>
            <span className="text-[12px] font-bold">Watchlist</span>
          </div>
          {[
            { symbol: "WIF", price: "$2.45", change: "+22.1%" },
            { symbol: "POPCAT", price: "$1.23", change: "+33.7%" },
            { symbol: "SPX", price: "$0.89", change: "+18.9%" },
          ].map((t) => (
            <div key={t.symbol} className="flex items-center justify-between py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span className="text-[12px] font-bold">{t.symbol}</span>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono">{t.price}</span>
                <span className="text-[10px] font-mono" style={{ color: "#22C55E" }}>{t.change}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
