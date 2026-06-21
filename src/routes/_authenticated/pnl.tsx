import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";

export const Route = createFileRoute("/_authenticated/pnl")({
  head: () => ({ meta: [{ title: "PnL — Vixor Terminal" }] }),
  component: PnLPage,
});

interface TradeEntry {
  id: string;
  token: string;
  chain: string;
  type: "long" | "short";
  entryPrice: number;
  exitPrice: number;
  size: string;
  pnl: string;
  pnlPct: number;
  duration: string;
  timestamp: string;
}

const TRADE_HISTORY: TradeEntry[] = [
  { id: "1", token: "WIF", chain: "Solana", type: "long", entryPrice: 2.10, exitPrice: 2.65, size: "$5K", pnl: "+$1,310", pnlPct: 26.2, duration: "4h 22m", timestamp: "2h ago" },
  { id: "2", token: "GOAT", chain: "Solana", type: "long", entryPrice: 0.52, exitPrice: 0.45, size: "$3K", pnl: "-$404", pnlPct: -13.5, duration: "1h 45m", timestamp: "5h ago" },
  { id: "3", token: "POPCAT", chain: "Solana", type: "long", entryPrice: 0.95, exitPrice: 1.35, size: "$2K", pnl: "+$842", pnlPct: 42.1, duration: "6h 10m", timestamp: "8h ago" },
  { id: "4", token: "BONK", chain: "Solana", type: "short", entryPrice: 0.0000305, exitPrice: 0.0000282, size: "$4K", pnl: "+$301", pnlPct: 7.5, duration: "2h 30m", timestamp: "12h ago" },
  { id: "5", token: "SPX", chain: "Solana", type: "long", entryPrice: 0.78, exitPrice: 0.92, size: "$1.5K", pnl: "+$269", pnlPct: 17.9, duration: "3h 55m", timestamp: "1d ago" },
  { id: "6", token: "MEW", chain: "Solana", type: "long", entryPrice: 0.0072, exitPrice: 0.0061, size: "$2.5K", pnl: "-$382", pnlPct: -15.3, duration: "8h 20m", timestamp: "1d ago" },
  { id: "7", token: "TURBO", chain: "Solana", type: "long", entryPrice: 0.0065, exitPrice: 0.0098, size: "$1K", pnl: "+$508", pnlPct: 50.8, duration: "12h 45m", timestamp: "2d ago" },
  { id: "8", token: "FLOKI", chain: "Solana", type: "long", entryPrice: 0.000165, exitPrice: 0.000192, size: "$3K", pnl: "+$491", pnlPct: 16.4, duration: "5h 30m", timestamp: "2d ago" },
];

const PNL_STATS = {
  totalPnl: "+$2,935",
  totalPnlPct: "+14.7%",
  winRate: "62.5%",
  totalTrades: "47",
  avgWin: "+$610",
  avgLoss: "-$393",
  profitFactor: "1.85",
  bestTrade: "+$1,310 (+26.2%)",
  worstTrade: "-$404 (-13.5%)",
};

function PnLPage() {
  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">📈</span>
          <h1 className="text-lg font-bold">PnL Tracker</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Track your trading performance and analyze your edge</p>
      </div>

      {/* Stats Grid */}
      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-4 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {[
          { label: "Total PnL", value: PNL_STATS.totalPnl, sub: PNL_STATS.totalPnlPct, color: "#22C55E" },
          { label: "Win Rate", value: PNL_STATS.winRate, sub: `${PNL_STATS.totalTrades} trades`, color: "#3B82F6" },
          { label: "Profit Factor", value: PNL_STATS.profitFactor, sub: `Avg Win: ${PNL_STATS.avgWin}`, color: "#F59E0B" },
          { label: "Best Trade", value: PNL_STATS.bestTrade.split(" ")[0], sub: PNL_STATS.bestTrade.split(" ").slice(1).join(" "), color: "#22C55E" },
        ].map((s) => (
          <div key={s.label} className="px-3 py-2 rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="text-[9px]" style={{ color: "#4A5568" }}>{s.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Trade History */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-bold">Recent Trades</span>
        <span className="text-[10px]" style={{ color: "#4A5568" }}>Last 30 days</span>
      </div>

      {/* Table Header */}
      <div className="px-4 py-1.5 flex items-center text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ width: "80px" }}>Token</div>
        <div style={{ width: "50px" }}>Type</div>
        <div style={{ width: "70px" }} className="text-right">Entry</div>
        <div style={{ width: "70px" }} className="text-right">Exit</div>
        <div style={{ width: "50px" }} className="text-right">Size</div>
        <div style={{ width: "80px" }} className="text-right">PnL</div>
        <div style={{ width: "60px" }} className="text-right">PnL %</div>
        <div style={{ width: "70px" }} className="text-right">Duration</div>
      </div>

      <div className="overflow-y-auto px-4" style={{ maxHeight: "calc(100vh - 340px)" }}>
        {TRADE_HISTORY.map((trade) => (
          <TradeRow key={trade.id} trade={trade} />
        ))}
      </div>
    </div>
  );
}

const TradeRow = memo(function TradeRow({ trade }: { trade: TradeEntry }) {
  const isPositive = trade.pnlPct >= 0;
  const color = isPositive ? "#22C55E" : "#EF4444";

  return (
    <div
      className="flex items-center px-0 py-2 text-[11px] font-mono"
      style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}
    >
      <div style={{ width: "80px" }}>
        <span className="font-bold">{trade.token}</span>
        <span className="text-[9px] ml-1" style={{ color: "#4A5568" }}>{trade.chain}</span>
      </div>
      <div style={{ width: "50px" }}>
        <span
          className="text-[9px] font-bold px-1 rounded"
          style={{ background: trade.type === "long" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)", color }}
        >
          {trade.type.toUpperCase()}
        </span>
      </div>
      <div className="text-right" style={{ width: "70px", color: "#7B8BA8" }}>${trade.entryPrice.toFixed(trade.entryPrice < 0.001 ? 10 : 4)}</div>
      <div className="text-right" style={{ width: "70px", color: "#7B8BA8" }}>${trade.exitPrice.toFixed(trade.exitPrice < 0.001 ? 10 : 4)}</div>
      <div className="text-right" style={{ width: "50px", color: "#7B8BA8" }}>{trade.size}</div>
      <div className="text-right font-bold" style={{ width: "80px", color }}>{trade.pnl}</div>
      <div className="text-right font-bold" style={{ width: "60px", color }}>{isPositive ? "+" : ""}{trade.pnlPct}%</div>
      <div className="text-right" style={{ width: "70px", color: "#4A5568" }}>{trade.duration}</div>
    </div>
  );
});
