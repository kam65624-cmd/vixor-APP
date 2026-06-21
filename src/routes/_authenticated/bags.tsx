import { createFileRoute } from "@tanstack/react-router";
import { memo } from "react";

export const Route = createFileRoute("/_authenticated/bags")({
  head: () => ({ meta: [{ title: "Bags — Vixor Terminal" }] }),
  component: BagsPage,
});

interface Bag {
  token: string;
  symbol: string;
  chain: string;
  amount: string;
  avgEntry: number;
  currentPrice: number;
  value: string;
  pnl: string;
  pnlPct: number;
  allocation: number;
}

const MY_BAGS: Bag[] = [
  { token: "dogwifhat", symbol: "WIF", chain: "Solana", amount: "2,500", avgEntry: 2.10, currentPrice: 2.45, value: "$6,125", pnl: "+$875", pnlPct: 16.7, allocation: 28 },
  { token: "Popcat", symbol: "POPCAT", chain: "Solana", amount: "8,000", avgEntry: 0.95, currentPrice: 1.23, value: "$9,840", pnl: "+$2,240", pnlPct: 29.5, allocation: 45 },
  { token: "Bonk", symbol: "BONK", chain: "Solana", amount: "150M", avgEntry: 0.0000305, currentPrice: 0.0000289, value: "$4,335", pnl: "-$240", pnlPct: -5.2, allocation: 20 },
  { token: "SPX6900", symbol: "SPX", chain: "Solana", amount: "1,200", avgEntry: 0.78, currentPrice: 0.89, value: "$1,068", pnl: "+$132", pnlPct: 14.1, allocation: 5 },
  { token: "Mog Coin", symbol: "MOG", chain: "Solana", amount: "5B", avgEntry: 0.0000025, currentPrice: 0.0000023, value: "$2,975", pnl: "-$1,025", pnlPct: -8.0, allocation: 13 },
];

const TOTAL = { value: "$22,343", pnl: "+$1,982", pnlPct: "+9.7%" };

function BagsPage() {
  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎒</span>
          <h1 className="text-lg font-bold">My Bags</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Your current token holdings and performance</p>
      </div>

      {/* Total Value */}
      <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#111827" }}>
          <div className="text-[9px]" style={{ color: "#4A5568" }}>Portfolio Value</div>
          <div className="text-lg font-bold font-mono">{TOTAL.value}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#111827" }}>
          <div className="text-[9px]" style={{ color: "#4A5568" }}>Total PnL</div>
          <div className="text-lg font-bold font-mono" style={{ color: "#22C55E" }}>{TOTAL.pnl}</div>
        </div>
        <div className="px-3 py-2 rounded-lg" style={{ background: "#111827" }}>
          <div className="text-[9px]" style={{ color: "#4A5568" }}>Total Return</div>
          <div className="text-lg font-bold font-mono" style={{ color: "#22C55E" }}>{TOTAL.pnlPct}</div>
        </div>
      </div>

      {/* Bags List */}
      <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <span className="text-[11px] font-bold">{MY_BAGS.length} Holdings</span>
      </div>

      <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
        {MY_BAGS.map((bag) => (
          <BagCard key={bag.symbol} bag={bag} />
        ))}
      </div>
    </div>
  );
}

const BagCard = memo(function BagCard({ bag }: { bag: Bag }) {
  const isPos = bag.pnlPct >= 0;
  const color = isPos ? "#22C55E" : "#EF4444";

  return (
    <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full"
          style={{ width: "32px", height: "32px", background: "rgba(59,130,246,0.12)", fontSize: "10px", fontWeight: 800, color: "#60A5FA" }}
        >
          {bag.symbol.slice(0, 2)}
        </div>
        <div>
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold">{bag.symbol}</span>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>{bag.chain}</span>
          </div>
          <div className="text-[9px]" style={{ color: "#7B8BA8" }}>{bag.amount} tokens · avg ${bag.avgEntry < 0.001 ? bag.avgEntry.toFixed(8) : bag.avgEntry.toFixed(4)}</div>
        </div>
      </div>
      <div className="text-right">
        <div className="text-[12px] font-bold font-mono">{bag.value}</div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[10px] font-mono font-bold" style={{ color }}>{bag.pnl}</span>
          <span className="text-[9px] font-mono font-bold" style={{ color }}>{isPos ? "+" : ""}{bag.pnlPct}%</span>
        </div>
        <div className="mt-0.5">
          <div className="h-1 rounded-full overflow-hidden" style={{ width: "60px", background: "rgba(255,255,255,0.05)" }}>
            <div className="h-full rounded-full" style={{ width: `${bag.allocation}%`, background: color }} />
          </div>
        </div>
      </div>
    </div>
  );
});
