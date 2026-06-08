import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, AlertTriangle, TrendingUp, TrendingDown, Target, Search, BarChart3, Filter, Clock } from "lucide-react";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listAnalyses } from "@/lib/vixor.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Journal — Vixor" }] }),
  component: Journal,
});

const TABS = ["Overview", "History", "Reports"] as const;

const mockHistory = [
  { id: 1, pair: "XAU/USD", type: "LONG", pnl: "+$840.00", isProfit: true, date: "Today, 14:30", mistake: null, rr: "1:3.2" },
  { id: 2, pair: "GBP/JPY", type: "SHORT", pnl: "-$120.00", isProfit: false, date: "Yesterday, 09:15", mistake: "Revenge Trading", rr: "1:0.5" },
  { id: 3, pair: "EUR/USD", type: "LONG", pnl: "+$210.50", isProfit: true, date: "12 May, 11:00", mistake: null, rr: "1:2.1" },
  { id: 4, pair: "BTC/USD", type: "SHORT", pnl: "-$300.00", isProfit: false, date: "11 May, 16:45", mistake: "FOMO Entry", rr: "1:0.8" },
  { id: 5, pair: "XAU/USD", type: "LONG", pnl: "+$450.00", isProfit: true, date: "10 May, 08:30", mistake: null, rr: "1:2.5" },
];

function Journal() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Overview");
  
  const fetchAnalyses = useServerFn(listAnalyses);
  const analysesQuery = useQuery({ queryKey: ["analyses-journal"], queryFn: () => fetchAnalyses({ data: { limit: 20 } }) });

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <BookOpen className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">Trade Journal</h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Performance Analytics</div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Top Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Win Rate</div>
              <div className="text-xl font-bold font-mono text-bullish">67%</div>
            </div>
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Trades</div>
              <div className="text-xl font-bold font-mono text-foreground">48</div>
            </div>
            <div className="vixor-card p-4">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Profit Factor</div>
              <div className="text-xl font-bold font-mono text-primary">1.8</div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="vixor-card p-4 border-l-4 border-l-bullish">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Best Pair</div>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-base">XAU/USD</span>
                <span className="px-1.5 py-0.5 rounded bg-bullish/10 text-bullish text-[9px] font-bold">+8%</span>
              </div>
            </div>
            <div className="vixor-card p-4 border-l-4 border-l-bearish">
              <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Worst Pair</div>
              <div className="flex items-center gap-2">
                <span className="font-bold font-mono text-base">GBP/JPY</span>
                <span className="px-1.5 py-0.5 rounded bg-bearish/10 text-bearish text-[9px] font-bold">-3%</span>
              </div>
            </div>
          </div>

          {/* Mistake Detector */}
          <div className="vixor-card p-4 border border-neutral-wait/30 bg-neutral-wait/5 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-neutral-wait" />
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="size-4 text-neutral-wait" />
              <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-wait">Mistake Detector</h3>
            </div>
            <div className="text-sm font-medium leading-relaxed">
              <strong className="text-foreground">Revenge Trading Detected.</strong> You've taken 3 consecutive trades on GBP/JPY after hitting your stop loss. Consider taking a 24-hour break from this pair.
            </div>
          </div>
          
          {/* Mini History */}
          <div className="space-y-2 pt-2">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1">Recent Executions</h3>
            {mockHistory.slice(0,3).map(h => <HistoryRow key={h.id} h={h} />)}
          </div>
        </div>
      )}

      {tab === "History" && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {mockHistory.map(h => <HistoryRow key={h.id} h={h} />)}
        </div>
      )}

      {tab === "Reports" && (
        <div className="vixor-card p-8 text-center border-dashed">
          <BarChart3 className="size-10 text-muted-foreground/50 mx-auto mb-3" />
          <h3 className="text-lg font-bold mb-1">Advanced Analytics</h3>
          <p className="text-sm text-muted-foreground">Unlock detailed performance reports and AI trade reviews with Premium.</p>
        </div>
      )}

    </div>
  );
}

function HistoryRow({ h }: { h: any }) {
  return (
    <div className="vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer" style={{ borderLeftColor: h.isProfit ? 'var(--bullish)' : 'var(--bearish)' }}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${h.isProfit ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`}>{h.type}</span>
          <span className="font-bold font-mono text-sm">{h.pair}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
          <span>{h.date}</span>
          {h.mistake && <span className="bg-neutral-wait/10 text-neutral-wait px-1.5 py-0.5 rounded font-bold border border-neutral-wait/20">{h.mistake}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className={`font-bold font-mono text-base ${h.isProfit ? "text-bullish" : "text-bearish"}`}>{h.pnl}</div>
        <div className="text-[10px] font-mono font-bold text-muted-foreground">R:R {h.rr}</div>
      </div>
    </div>
  );
}
