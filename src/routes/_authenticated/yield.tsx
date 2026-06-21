import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/yield")({
  head: () => ({ meta: [{ title: "Yield — Vixor Terminal" }] }),
  component: YieldPage,
});

function YieldPage() {
  const pools = [
    { protocol: "Raydium LP", pair: "SOL/WIF", apy: "45.2%", tvl: "$12M", risk: "Medium" },
    { protocol: "Orca Whirlpool", pair: "SOL/POPCAT", apy: "67.8%", tvl: "$5M", risk: "High" },
    { protocol: "Meteora DLMM", pair: "SOL/BONK", apy: "23.1%", tvl: "$18M", risk: "Low" },
    { protocol: "Raydium LP", pair: "SOL/SPX", apy: "34.5%", tvl: "$3M", risk: "Medium" },
    { protocol: "Kamino Finance", pair: "USDC/SOL", apy: "12.3%", tvl: "$45M", risk: "Low" },
  ];

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🌾</span>
          <h1 className="text-lg font-bold">Yield</h1>
          <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>COMING SOON</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Find the best yield opportunities across Solana DeFi</p>
      </div>

      <div className="px-4 py-1.5 flex items-center text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: "120px" }}>Protocol</div>
        <div style={{ width: "100px" }}>Pair</div>
        <div className="text-right" style={{ width: "80px" }}>APY</div>
        <div className="text-right" style={{ width: "80px" }}>TVL</div>
        <div className="text-right" style={{ width: "60px" }}>Risk</div>
      </div>

      <div className="overflow-y-auto px-4">
        {pools.map((p) => (
          <div key={p.protocol + p.pair} className="flex items-center py-2.5 text-[11px]" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: "120px" }} className="font-bold">{p.protocol}</div>
            <div style={{ width: "100px" }} className="font-mono">{p.pair}</div>
            <div className="text-right font-mono font-bold" style={{ width: "80px", color: "#22C55E" }}>{p.apy}</div>
            <div className="text-right font-mono" style={{ width: "80px", color: "#7B8BA8" }}>{p.tvl}</div>
            <div className="text-right" style={{ width: "60px" }}>
              <span className="text-[9px] font-bold" style={{ color: p.risk === "Low" ? "#22C55E" : p.risk === "Medium" ? "#F59E0B" : "#EF4444" }}>{p.risk}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
