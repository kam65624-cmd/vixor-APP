import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { memo } from "react";
import { getPortfolioData, getTradeHistory, getJournalEntries } from "@/shared/data";
import { cn } from "@/shared/utils";

export const Route = createFileRoute("/_authenticated/bags")({
  head: () => ({ meta: [{ title: "Bags — Vixor Terminal" }] }),
  component: BagsPage,
});

interface Bag {
  symbol: string;
  name: string;
  chain: string;
  amount: string;
  avgEntry: number;
  currentPrice: number;
  value: string;
  pnl: string;
  pnlPct: number;
  allocation: number;
}

function BagsPage() {
  const navigate = useNavigate();
  const { holdings, totalValue, totalPnl, totalPnlPct } = useQuery({
    queryKey: ["portfolio-data", userId: "me"],
    queryFn: getPortfolioData,
  });

  const trades = useQuery({
    queryKey: ["trade-history", userId: "me"],
    queryFn: getTradeHistory,
  });

  const journal = useQuery({
    queryKey: ["journal-entries", userId: "me"],
    queryFn: getJournalEntries,
  });

  const isLoading = !holdings && !trades && !journal;

  const hasData = holdings && holdings.length > 0 || trades.length > 0;

  return (
    <div style={{ background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100%" }}>
      {/* Header */}
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎒</span>
          <h1 className="text-lg font-bold">My Bags</h1>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>
          {hasData ? `${holdings.length} holdings from ${trades.length}+ trades` : "Connect your wallet to see real data"}
        </p>
      </div>

      {!isLoading && hasData ? (
        <>
          {/* Total Value */}
          <div className="px-4 py-3 grid grid-cols-3 gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Portfolio Value</div>
              <div className="text-xl font-bold font-mono">{`$${totalValue}`}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total PnL</div>
              <div className="text-lg font-bold font-mono" style={{ color: "#22C55E" }}>{totalPnl}</div>
            </div>
            <div className="px-3 py-2 rounded-lg" style={{ background: "#161b2e" }}>
              <div className="text-[9px]" style={{ color: "#4A5568" }}>Total Return</div>
              <div className="text-lg font-bold font-mono" style={{ color: totalPnlPct >= 0 ? "#22C55E" : "#EF4444" }}>{totalPnlPct}</div>
            </div>
          </div>

          {/* Holdings List */}
          <div className="px-4 py-2 flex items-center justify-between" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[11px] font-bold">{holdings.length} Holdings</span>
          </div>

          <div className="overflow-y-auto px-4 py-2 space-y-2" style={{ maxHeight: "calc(100vh - 260px)" }}>
            {holdings.map((bag) => (
              <BagCard key={bag.symbol} bag={bag} />
            ))}
          </div>
        </>
      ) : (
        <div className="px-4 py-2 flex flex-col items-center justify-center gap-3" style={{ padding: "40px 0" }}>
          <span style={{ fontSize: "24px", fontWeight: 700, color: "#7B8BA8" }}>🎒</span>
          <p style={{ fontSize: "11px", color: "#7B8BA8", textAlign: "center" }}>
            Connect your wallet to see real holdings
          </p>
          <button
            onClick={() => navigate({ to: "/wallet-web3" })}
            style={{
              padding: "10px 24px", borderRadius: "8px", border: "none", cursor: "pointer",
              background: "rgba(59,130,246,0.12)", color: "#60A5FA",
              fontSize: "11px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif",
            }}>
            Connect Wallet
          </button>
        </div>
      )}
    </div>
  );
}

function BagCard({ bag }: { bag: Bag }) {
  const isPos = bag.pnlPct >= 0;
  const color = isPos ? "#22C55E" : "#EF4444";
  return (
    <div
      className="flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer"
      style={{
        background: "#161b2e", border: "1px solid rgba(255,255,255,0.06)",
        transition: "background 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "#1e2438"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "#161b2e"; }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          style={{
            width: "32px", height: "32px", borderRadius: "50%",
            background: `rgba(59,130,246,0.12)`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "10px", fontWeight: 800, color,
            flexShrink: 0,
          }}>
            {bag.symbol.slice(0, 2)}
          </div>
        <div style={{ minWidth: 0 }}>
          <div className="flex items-center gap-1">
            <span className="text-[12px] font-bold">{bag.symbol}</span>
            <span className="text-[9px]" style={{ color: "#4A5568" }}>{bag.chain}</span>
          </div>
          <div className="text-[9px]" style={{ color: "#7B8BA8" }}>
            {bag.amount} tokens · avg ${bag.avgEntry < 0.001 ? bag.avgEntry.toFixed(8) : bag.avgEntry.toFixed(4)}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-[12px] font-bold font-mono">{bag.value}</div>
          <div className="flex items-center gap-2 justify-end">
            <span className="text-[10px] font-mono font-bold" style={{ color }}>{bag.pnl}</span>
            <span className="text-[9px] font-mono font-bold" style={{ color }}>{isPos ? "+" : ""}{bag.pnlPct}%</span>
          </div>
          <div className="mt-0.5">
            <div className="h-1 rounded-full overflow-hidden" style={{ width: `${bag.allocation}%`, background: color }} />
          </div>
        </div>
      </div>
    </div>
  );
}