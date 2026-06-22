import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/perpetuals")({
  head: () => ({ meta: [{ title: "Perpetuals — Vixor Terminal" }] }),
  component: PerpetualsPage,
});

function PerpetualsPage() {
  const pairs = [
    { pair: "SOL/USDC", price: "$73.60", change: "+2.4%", vol: "$245M", oi: "$89M", funding: "0.01%" },
    { pair: "WIF/USDC", price: "$2.45", change: "+22.1%", vol: "$78M", oi: "$34M", funding: "0.05%" },
    { pair: "BONK/USDC", price: "$0.0000289", change: "-1.5%", vol: "$45M", oi: "$18M", funding: "-0.02%" },
    { pair: "POPCAT/USDC", price: "$1.23", change: "+33.7%", vol: "$32M", oi: "$12M", funding: "0.08%" },
    { pair: "JUP/USDC", price: "$0.89", change: "+4.2%", vol: "$28M", oi: "$15M", funding: "0.01%" },
    { pair: "RAY/USDC", price: "$2.15", change: "-0.8%", vol: "$22M", oi: "$9M", funding: "0.00%" },
  ];

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">♾️</span>
          <h1 className="text-lg font-bold">Perpetuals</h1>
          <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>COMING SOON</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Trade perpetual futures on Solana memecoins with leverage</p>
      </div>

      {/* Table */}
      <div className="px-4 py-1.5 flex items-center text-[9px] font-bold uppercase tracking-wider" style={{ color: "#4A5568", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ width: "120px" }}>Pair</div>
        <div className="text-right" style={{ width: "100px" }}>Price</div>
        <div className="text-right" style={{ width: "80px" }}>24h Change</div>
        <div className="text-right" style={{ width: "80px" }}>Volume</div>
        <div className="text-right" style={{ width: "80px" }}>Open Interest</div>
        <div className="text-right" style={{ width: "80px" }}>Funding</div>
      </div>

      <div className="overflow-y-auto px-4">
        {pairs.map((p) => (
          <div key={p.pair} className="flex items-center py-2.5 text-[11px] font-mono" style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
            <div style={{ width: "120px" }} className="font-bold">{p.pair}</div>
            <div className="text-right" style={{ width: "100px", color: "#F0F4FC" }}>{p.price}</div>
            <div className="text-right font-bold" style={{ width: "80px", color: p.change.startsWith("+") ? "#22C55E" : "#EF4444" }}>{p.change}</div>
            <div className="text-right" style={{ width: "80px", color: "#7B8BA8" }}>{p.vol}</div>
            <div className="text-right" style={{ width: "80px", color: "#7B8BA8" }}>{p.oi}</div>
            <div className="text-right" style={{ width: "80px", color: parseFloat(p.funding) >= 0 ? "#22C55E" : "#EF4444" }}>{p.funding}</div>
          </div>
        ))}
      </div>

      <div className="px-4 py-8 text-center">
        <span className="text-xs" style={{ color: "#4A5568" }}>Perpetual trading coming soon — Stay tuned!</span>
      </div>
    </div>
  );
}
