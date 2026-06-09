import { createFileRoute } from "@tanstack/react-router";
import { Search, Plus, Bell, Layers, Sparkles } from "lucide-react";
import { watchlist } from "@/lib/vixor-mock";
import { SectionTitle } from "@/components/vixor/atoms";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: Charts,
});

const timeframes = ["1m","5m","15m","1H","4H","1D","1W"];

function Charts() {
  const [tf, setTf] = useState("4H");
  const [sym, setSym] = useState(watchlist[0]);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-card border border-border">
          <Search className="size-4 text-muted-foreground" />
          <input placeholder="Search pair…" className="bg-transparent flex-1 text-sm outline-none" />
        </div>
        <button className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
          <Plus className="size-4" />
        </button>
      </div>

      {/* Symbol header */}
      <div className="vixor-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground">{sym.pair}</div>
            <div className="text-3xl font-bold text-mono">${sym.price.toLocaleString()}</div>
            <div className={`text-sm font-semibold text-mono ${sym.change >= 0 ? "text-bullish" : "text-bearish"}`}>
              {sym.change >= 0 ? "+" : ""}{sym.change}%
            </div>
          </div>
          <button className="size-9 rounded-xl bg-muted flex items-center justify-center">
            <Bell className="size-4" />
          </button>
        </div>

        {/* Mock chart */}
        <div className="h-44 mt-3">
          <svg className="w-full h-full" viewBox="0 0 400 180" preserveAspectRatio="none">
            <defs>
              <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="oklch(0.72 0.17 162)" stopOpacity="0.4"/>
                <stop offset="100%" stopColor="oklch(0.72 0.17 162)" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {[40,80,120].map(y => <line key={y} x1="0" x2="400" y1={y} y2={y} stroke="oklch(1 0 0 / 0.05)" />)}
            <path d="M 0 140 L 30 130 L 60 135 L 90 110 L 120 115 L 150 90 L 180 100 L 210 70 L 240 80 L 270 50 L 300 65 L 330 40 L 360 55 L 400 35 L 400 180 L 0 180 Z" fill="url(#cg)"/>
            <path d="M 0 140 L 30 130 L 60 135 L 90 110 L 120 115 L 150 90 L 180 100 L 210 70 L 240 80 L 270 50 L 300 65 L 330 40 L 360 55 L 400 35" fill="none" stroke="oklch(0.72 0.17 162)" strokeWidth="2"/>
          </svg>
        </div>

        <div className="flex items-center gap-1 mt-3 overflow-x-auto scrollbar-hide">
          {timeframes.map(t => (
            <button key={t} onClick={() => setTf(t)}
              className={`px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition ${tf === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {t}
            </button>
          ))}
          <div className="flex-1" />
          <button className="size-8 rounded-md bg-muted flex items-center justify-center">
            <Layers className="size-4 text-muted-foreground" />
          </button>
        </div>

        <button className="mt-3 w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary">
          <Sparkles className="size-4" /> Analyze this chart
        </button>
      </div>

      {/* Watchlist */}
      <div>
        <SectionTitle title="Watchlist" />
        <div className="vixor-card divide-y divide-border">
          {watchlist.map(w => (
            <button key={w.pair} onClick={() => setSym(w)} className="w-full p-3 flex items-center gap-3 vixor-card-hover">
              <div className="size-9 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-mono">
                {w.pair.split("/")[0].slice(0,3)}
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm text-mono">{w.pair}</div>
                <div className="text-xs text-muted-foreground">Live</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-mono">${w.price.toLocaleString()}</div>
                <div className={`text-xs text-mono ${w.change >= 0 ? "text-bullish" : "text-bearish"}`}>
                  {w.change >= 0 ? "+" : ""}{w.change}%
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
