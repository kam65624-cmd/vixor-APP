import { createFileRoute } from "@tanstack/react-router";
import { LayoutDashboard, Target, Shield, Calculator, Activity, ArrowUpRight, ArrowDownRight, TrendingUp } from "lucide-react";
import { useState, useMemo } from "react";

export const Route = createFileRoute("/_authenticated/trade-desk")({
  head: () => ({ meta: [{ title: "Trade Desk — Vixor" }] }),
  component: TradeDesk,
});

const mockPositions = [
  { pair: "XAU/USD", type: "LONG", entry: 2348.50, current: 2354.20, sl: 2331.00, tp: 2389.00, pnl: "+$1,240.45", isProfit: true, progress: 72 },
  { pair: "EUR/USD", type: "SHORT", entry: 1.0842, current: 1.0865, sl: 1.0880, tp: 1.0750, pnl: "-$210.12", isProfit: false, progress: 18 },
];

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"];
const PIP_SIZES: Record<string, number> = { "EURUSD": 0.0001, "GBPUSD": 0.0001, "USDJPY": 0.01, "XAUUSD": 0.1, "BTCUSD": 1 };
const LOT_SIZES: Record<string, number> = { "EURUSD": 100000, "GBPUSD": 100000, "USDJPY": 100000, "XAUUSD": 100, "BTCUSD": 1 };

function TradeDesk() {
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [slPips, setSlPips] = useState("30");
  const [pair, setPair] = useState("XAUUSD");

  const result = useMemo(() => {
    const bal = parseFloat(balance) || 0;
    const risk = parseFloat(riskPct) || 0;
    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const lotSize = LOT_SIZES[pair] || 100000;

    if (bal <= 0 || risk <= 0 || sl <= 0) return null;

    const riskAmount = bal * (risk / 100);
    const pipValue = pipSize * lotSize;
    const lots = riskAmount / (sl * pipValue);

    return {
      lots: lots.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      riskLevel: risk <= 1 ? "LOW" : risk <= 2 ? "MEDIUM" : "HIGH"
    };
  }, [balance, riskPct, slPips, pair]);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <LayoutDashboard className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Trade Desk</h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Institutional Execution</div>
        </div>
      </div>

      {/* RISK CALCULATOR */}
      <div className="vixor-card p-5 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-4 text-primary" />
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Risk Calculator</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Trading Pair</label>
            <select value={pair} onChange={e => setPair(e.target.value)} className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors cursor-pointer">
              {PAIRS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Balance ($)</label>
            <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Risk %</label>
            <input type="number" step="0.1" value={riskPct} onChange={e => setRiskPct(e.target.value)} className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Stop Loss (Pips/Points)</label>
            <input type="number" value={slPips} onChange={e => setSlPips(e.target.value)} className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="bg-card-hover p-4 rounded-xl border border-border text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Recommended Lot Size</div>
          <div className="text-3xl font-bold font-mono text-primary mb-2">
            {result ? result.lots : "0.00"}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-mono text-muted-foreground font-bold">Risk: ${result?.riskAmount || "0.00"}</span>
            {result && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${result.riskLevel === "LOW" ? "bg-bullish/10 text-bullish" : result.riskLevel === "MEDIUM" ? "bg-neutral-wait/10 text-neutral-wait" : "bg-bearish/10 text-bearish"}`}>
                {result.riskLevel} RISK
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ACTIVE POSITIONS */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">Active Positions</h2>
        </div>
        
        <div className="space-y-3">
          {mockPositions.map((p, i) => (
            <div key={i} className={`vixor-card p-4 relative overflow-hidden border-l-4 ${p.isProfit ? "border-l-bullish" : "border-l-bearish"}`}>
              {/* Progress Bar Top Line */}
              <div className="absolute top-0 inset-x-0 h-0.5 bg-card-hover">
                <div className={`h-full ${p.isProfit ? "bg-bullish" : "bg-bearish"}`} style={{ width: `${p.progress}%` }} />
              </div>
              
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.isProfit ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`}>
                      {p.type}
                    </span>
                    <span className="font-bold font-mono text-base">{p.pair}</span>
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">Entry: {p.entry}</div>
                </div>
                <div className="text-right">
                  <div className={`font-bold font-mono text-lg ${p.isProfit ? "text-bullish" : "text-bearish"}`}>
                    {p.pnl}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">Curr: {p.current}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button className="h-10 rounded-lg bg-card-hover border border-border text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors">
                  Modify SL/TP
                </button>
                <button className={`h-10 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${p.isProfit ? "bg-bullish/10 text-bullish hover:bg-bullish/20 border border-bullish/20" : "bg-bearish/10 text-bearish hover:bg-bearish/20 border border-bearish/20"}`}>
                  Close Position
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
