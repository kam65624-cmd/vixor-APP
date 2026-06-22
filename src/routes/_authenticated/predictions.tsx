import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/predictions")({
  head: () => ({ meta: [{ title: "Predictions — Vixor Terminal" }] }),
  component: PredictionsPage,
});

function PredictionsPage() {
  const markets = [
    { question: "Will WIF reach $3.00 by end of week?", yes: "72%", no: "28%", volume: "$45K", endsIn: "2d 14h" },
    { question: "Will BONK be in top 10 Solana tokens by market cap?", yes: "45%", no: "55%", volume: "$23K", endsIn: "5d 8h" },
    { question: "Will SOL price exceed $100 this month?", yes: "38%", no: "62%", volume: "$120K", endsIn: "8d 2h" },
    { question: "Will POPCAT outperform WIF in next 7 days?", yes: "56%", no: "44%", volume: "$18K", endsIn: "1d 20h" },
  ];

  return (
    <div className="w-full h-full" style={{ background: "#0A0E1A", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center gap-2">
          <span className="text-lg">🎯</span>
          <h1 className="text-lg font-bold">Predictions</h1>
          <span className="text-[9px] px-1.5 rounded" style={{ background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>COMING SOON</span>
        </div>
        <p className="text-[11px] mt-0.5" style={{ color: "#7B8BA8" }}>Predict market outcomes and earn rewards</p>
      </div>

      <div className="px-4 py-3 space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 140px)" }}>
        {markets.map((m, i) => {
          const yesPct = parseInt(m.yes);
          return (
            <div key={i} className="rounded-lg p-3" style={{ background: "#111827", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[12px] font-medium mb-3">{m.question}</p>
              {/* Progress bar */}
              <div className="h-6 rounded-md overflow-hidden flex" style={{ background: "rgba(239,68,68,0.2)" }}>
                <div className="flex items-center justify-center" style={{ width: `${yesPct}%`, background: "rgba(34,197,94,0.3)" }}>
                  <span className="text-[10px] font-bold" style={{ color: "#22C55E" }}>YES {m.yes}</span>
                </div>
                <div className="flex items-center justify-center flex-1">
                  <span className="text-[10px] font-bold" style={{ color: "#EF4444" }}>NO {m.no}</span>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[9px]" style={{ color: "#7B8BA8" }}>Volume: {m.volume}</span>
                <span className="text-[9px]" style={{ color: "#4A5568" }}>Ends in {m.endsIn}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
