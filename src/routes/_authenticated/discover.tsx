import { createFileRoute } from "@tanstack/react-router";
import { Compass, Search, Flame, ArrowUpRight, ArrowDownRight, Layers, BarChart2, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMarketNews } from "@/lib/vixor.functions";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: Discover,
});

const TABS = ["Watchlist", "Scanner", "News", "Heatmap"] as const;

const mockScanner = [
  { pair: "GBP/JPY", signal: "Breakout", time: "1H", up: true },
  { pair: "SPX500", signal: "Trend Cont.", time: "4H", up: true },
  { pair: "USDCAD", signal: "Reversal", time: "1D", up: false },
];

const mockWatchlist = [
  { pair: "XAU/USD", price: "2368.10", change: "+1.2%", chart: [2, 3, 5, 4, 7, 6, 8] },
  { pair: "EUR/USD", price: "1.0845", change: "-0.3%", chart: [8, 7, 5, 6, 4, 3, 2] },
  { pair: "BTC/USD", price: "64230", change: "+4.5%", chart: [1, 2, 4, 3, 6, 8, 9] },
];

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function DiscoverNews() {
  const fetchMarketNews = useServerFn(getMarketNews);
  const [category, setCategory] = useState<"forex" | "general" | "crypto" | "merger">("forex");

  const { data: news = [], isLoading, error } = useQuery({
    queryKey: ["marketNews", category],
    queryFn: () => fetchMarketNews({ data: { category } }),
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Category Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(["forex", "general", "crypto", "merger"] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap border transition-all ${
              category === cat
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "merger" ? "M&A" : cat}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="vixor-card p-4 flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="vixor-card p-6 text-center text-muted-foreground text-sm">
          Failed to load news. Please try again.
        </div>
      ) : news.length === 0 ? (
        <div className="vixor-card p-6 text-center text-muted-foreground text-sm">
          No news articles found for this category.
        </div>
      ) : (
        <div className="space-y-3">
          {news.map(item => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="vixor-card p-4 flex gap-4 hover:border-primary/50 transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded capitalize">
                      {item.source}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(item.time)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                    {item.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary mt-2">
                  Read full article <ExternalLink className="size-3" />
                </div>
              </div>
              {item.image && (
                <div className="size-20 rounded-lg overflow-hidden shrink-0 border border-border bg-muted">
                  <img
                    src={item.image}
                    alt=""
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function Discover() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Watchlist");

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="size-6 text-primary" /> Market Explorer
        </h1>
        <p className="text-sm text-muted-foreground mt-1">What's moving right now?</p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="size-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder="Search pairs, stocks, crypto..." 
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t}
          </button>
        ))}
      </div>

      {/* Watchlist Tab */}
      {tab === "Watchlist" && (
        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {mockWatchlist.map(w => (
            <div key={w.pair} className="vixor-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors">
              <div>
                <div className="font-bold text-lg text-mono">{w.pair}</div>
                <div className="text-sm font-medium text-muted-foreground">{w.price}</div>
              </div>
              
              {/* Mini Sparkline Mock */}
              <div className="w-20 h-8 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
                {w.chart.map((h, i) => (
                  <div key={i} className={`flex-1 rounded-t-sm ${w.change.startsWith("+") ? "bg-bullish" : "bg-bearish"}`} style={{ height: `${h * 10}%` }} />
                ))}
              </div>

              <div className={`text-sm font-bold text-mono px-2 py-1 rounded ${w.change.startsWith("+") ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`}>
                {w.change}
              </div>
            </div>
          ))}
          
          <button className="w-full h-12 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
            <Search className="size-4" /> Add to Watchlist
          </button>
        </div>
      )}

      {/* Scanner Tab */}
      {tab === "Scanner" && (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <button className="h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 border border-primary/20"><Flame className="size-4"/> Hot Breakouts</button>
            <button className="h-10 rounded-lg bg-card text-muted-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border"><Layers className="size-4"/> Volume Spikes</button>
          </div>
          
          {mockScanner.map(s => (
            <div key={s.pair} className="vixor-card p-4 border-l-4" style={{ borderLeftColor: s.up ? "var(--color-bullish)" : "var(--color-bearish)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg text-mono">{s.pair}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">{s.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                {s.up ? <ArrowUpRight className="size-4 text-bullish"/> : <ArrowDownRight className="size-4 text-bearish"/>}
                <span>{s.signal} detected</span>
                <button className="ml-auto text-xs font-bold text-primary hover:underline">Analyze</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* News Tab */}
      {tab === "News" && (
        <DiscoverNews />
      )}

      {/* Heatmap Tab */}
      {tab === "Heatmap" && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="vixor-card p-4 flex flex-col items-center justify-center h-64 text-center">
            <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart2 className="size-8 text-primary" />
            </div>
            <h3 className="font-bold text-lg mb-1">Interactive Heatmap</h3>
            <p className="text-sm text-muted-foreground mb-4">Visualize market strength across sectors in real-time.</p>
            <button className="px-6 h-10 rounded-lg gradient-primary text-primary-foreground font-bold text-sm glow-primary">Unlock Feature</button>
          </div>
        </div>
      )}

    </div>
  );
}
