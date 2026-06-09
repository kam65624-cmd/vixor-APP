import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Calculator, Info } from "lucide-react";
import { useMemo, useState } from "react";
import { Stat } from "@/components/vixor/atoms";

export const Route = createFileRoute("/_authenticated/lot-calculator")({
  head: () => ({ meta: [{ title: "Lot Calculator — Vixor" }] }),
  component: LotCalc,
});

function LotCalc() {
  const [accountSize, setAccountSize] = useState(10000);
  const [riskPct, setRiskPct] = useState(1);
  const [entry, setEntry] = useState(67420);
  const [stop, setStop] = useState(66100);
  const [pair, setPair] = useState("BTC/USDT");

  const result = useMemo(() => {
    const riskAmount = accountSize * (riskPct / 100);
    const stopDistance = Math.abs(entry - stop);
    const lot = stopDistance > 0 ? riskAmount / stopDistance : 0;
    const positionValue = lot * entry;
    return { riskAmount, stopDistance, lot, positionValue };
  }, [accountSize, riskPct, entry, stop]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link to="/profile" className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"><ArrowLeft className="size-4"/></Link>
        <h1 className="font-semibold">Lot calculator</h1>
        <div className="size-9"/>
      </div>

      <div className="vixor-card p-5 text-center">
        <div className="size-14 rounded-2xl bg-info/15 mx-auto flex items-center justify-center mb-2">
          <Calculator className="size-6 text-info"/>
        </div>
        <h2 className="font-bold">Size your trade like a pro</h2>
        <p className="text-xs text-muted-foreground">Risk-based position sizing</p>
      </div>

      <div className="vixor-card p-4 space-y-4">
        <Field label="Trading pair" value={pair} onChange={setPair}/>
        <Field label="Account size ($)" type="number" value={accountSize} onChange={v => setAccountSize(Number(v))}/>
        <div>
          <label className="text-xs uppercase tracking-wide text-muted-foreground">Risk per trade · {riskPct}%</label>
          <input type="range" min="0.5" max="5" step="0.5" value={riskPct} onChange={e => setRiskPct(Number(e.target.value))}
            className="w-full mt-2 accent-primary"/>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entry" type="number" value={entry} onChange={v => setEntry(Number(v))}/>
          <Field label="Stop loss" type="number" value={stop} onChange={v => setStop(Number(v))}/>
        </div>
      </div>

      {/* Result */}
      <div className="vixor-card p-5 relative overflow-hidden">
        <div className="absolute inset-0 gradient-bullish opacity-50"/>
        <div className="relative">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Recommended lot size</div>
          <div className="text-4xl font-bold text-mono mt-1">{result.lot.toFixed(4)}</div>
          <div className="text-xs text-muted-foreground mt-1">units of {pair.split("/")[0]}</div>
        </div>
      </div>

      <div className="vixor-card p-4 grid grid-cols-3 gap-3">
        <Stat label="Risk amount" value={`$${result.riskAmount.toFixed(2)}`} accent="bearish"/>
        <Stat label="Stop distance" value={result.stopDistance.toFixed(2)} accent="info"/>
        <Stat label="Position value" value={`$${result.positionValue.toFixed(0)}`} accent="bullish"/>
      </div>

      <div className="flex items-center gap-2 p-3 rounded-xl bg-info/10 border border-info/30">
        <Info className="size-4 text-info shrink-0"/>
        <span className="text-xs text-muted-foreground">1% risk per trade is widely considered safe. Adjust to your tolerance.</span>
      </div>
    </div>
  );
}

function Field({ label, value, type = "text", onChange }: { label: string; value: string | number; type?: string; onChange: (v: any) => void }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)}
        className="w-full mt-1.5 h-11 px-3 rounded-xl bg-muted border border-border text-sm text-mono font-semibold outline-none focus:border-primary"/>
    </div>
  );
}
