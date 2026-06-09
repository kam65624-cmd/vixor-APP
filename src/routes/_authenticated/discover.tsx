import { createFileRoute } from "@tanstack/react-router";
import { Compass, Search, Flame, ArrowUpRight, ArrowDownRight, Layers, BarChart2, ExternalLink } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMarketNews, getMarketPrices, getDailySignals } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import { Skeleton } from "@/components/ui/skeleton";
import { RecBadge } from "@/components/vixor/atoms";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: Discover,
});

const TABS = ["discover.watchlist", "discover.scanner", "discover.news", "discover.heatmap"] as const;

function DiscoverNews() {
  const { t } = useI18n();
  const fetchMarketNews = useStableServerFn(getMarketNews);

  const [category, setCategory] = useState<"forex" | "general" | "crypto" | "merger">("forex");

  const { data: news = [], isLoading, error } = useQuery(useMemo(() => ({
    queryKey: ["marketNews", category] as const,
    queryFn: () => fetchMarketNews({ data: { category } }),
    refetchInterval: 60_000,
    staleTime: 30_000,
  }), [fetchMarketNews, category]));

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
            {cat === "merger" ? t("discover.merger") : cat === "forex" ? t("discover.forex") : cat === "crypto" ? t("discover.crypto") : t("discover.general")}
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
          {t("discover.failedToLoadNews")}
        </div>
      ) : news.length === 0 ? (
        <div className="vixor-card p-6 text-center text-muted-foreground text-sm">
          {t("discover.noNewsArticles")}
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
                  {t("discover.readFullArticle")} <ExternalLink className="size-3" />
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

function DiscoverWatchlist() {
  const { t } = useI18n();
  const fetchPrices = useStableServerFn(getMarketPrices);
  const { data: prices = [], isLoading } = useQuery(useMemo(() => ({
    queryKey: ["market-prices"] as const,
    queryFn: () => fetchPrices({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  }), [fetchPrices]));

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="vixor-card p-4 flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-8 w-16 rounded" />
            </div>
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <Search className="size-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">{t("discover.noMarketData")}</div>
        </div>
      ) : (
        prices.map((p: any) => (
          <div key={p.pair} className="vixor-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors">
            <div>
              <div className="font-bold text-lg font-mono">{p.pair}</div>
              <div className="text-sm font-medium font-mono text-muted-foreground">
                $
                {Number(p.price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4,
                })}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(p.change24h ?? 0) >= 0 ? (
                <ArrowUpRight className="size-4 text-bullish" />
              ) : (
                <ArrowDownRight className="size-4 text-bearish" />
              )}
              <div className={`text-sm font-bold font-mono px-2 py-1 rounded ${
                (p.change24h ?? 0) >= 0 ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"
              }`}>
                {(p.change24h ?? 0) >= 0 ? "+" : ""}{(p.change24h ?? 0).toFixed(2)}%
              </div>
            </div>
          </div>
        ))
      )}

      <button className="w-full h-12 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2">
        <Search className="size-4" /> {t("discover.addToWatchlist")}
      </button>
    </div>
  );
}

function DiscoverScanner() {
  const { t } = useI18n();
  const fetchSignals = useStableServerFn(getDailySignals);
  const { data: signals = [], isLoading } = useQuery(useMemo(() => ({
    queryKey: ["daily-signals"] as const,
    queryFn: () => fetchSignals({ data: {} }),
    staleTime: 120_000,
  }), [fetchSignals]));

  const activeSignals = signals.filter((s: any) => s.recommendation !== "WAIT");

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-3 mb-2">
        <button className="h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 border border-primary/20"><Flame className="size-4"/> {t("discover.hotBreakouts")}</button>
        <button className="h-10 rounded-lg bg-card text-muted-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border"><Layers className="size-4"/> {t("discover.volumeSpikes")}</button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="vixor-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : activeSignals.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <Flame className="size-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">{t("discover.noActiveSignals")}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{t("discover.signalsDaily")}</div>
        </div>
      ) : (
        activeSignals.map((s: any) => {
          const isBuy = s.recommendation === "BUY";
          return (
            <div key={s.id} className="vixor-card p-4 border-l-4" style={{ borderLeftColor: isBuy ? "var(--color-bullish)" : "var(--color-bearish)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg font-mono">{s.pair}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">{s.timeframe}</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <RecBadge rec={s.recommendation} />
                <span className="text-muted-foreground font-medium">{s.confidence}% {t("signals.confidence").toLowerCase()}</span>
                <a href={`/charts?symbol=BINANCE:${s.pair.replace("/", "")}`} className="ml-auto text-xs font-bold text-primary hover:underline">{t("discover.analyze")}</a>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DiscoverHeatmap() {
  const { t } = useI18n();
  const fetchPrices = useStableServerFn(getMarketPrices);
  const { data: prices = [], isLoading } = useQuery(useMemo(() => ({
    queryKey: ["market-prices"] as const,
    queryFn: () => fetchPrices({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  }), [fetchPrices]));

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">{t("discover.marketHeatmap")}</h3>
          <p className="text-[10px] text-muted-foreground">{t("discover.24hChange")}</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-bullish" /> {t("discover.gain")}</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-bearish" /> {t("discover.loss")}</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-lg h-20 shimmer" />
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <BarChart2 className="size-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">{t("discover.noHeatmapData")}</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {prices.map((p: any) => {
            const change = p.change24h ?? 0;
            const isPositive = change >= 0;
            const intensity = Math.min(Math.abs(change) / 3, 1);
            return (
              <div
                key={p.pair}
                className={`rounded-lg p-3 text-center border transition-all cursor-pointer hover:scale-[1.02] ${
                  isPositive
                    ? "bg-bullish/5 border-bullish/20 hover:border-bullish/40"
                    : "bg-bearish/5 border-bearish/20 hover:border-bearish/40"
                }`}
                style={{
                  backgroundColor: isPositive
                    ? `rgba(34, 197, 94, ${0.05 + intensity * 0.2})`
                    : `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,
                }}
              >
                <div className="font-bold text-xs font-mono mb-1">{p.pair}</div>
                <div className={`text-sm font-bold font-mono ${isPositive ? "text-bullish" : "text-bearish"}`}>
                  {isPositive ? "+" : ""}{change.toFixed(2)}%
                </div>
                <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                  ${Number(p.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="vixor-card p-4 flex flex-col items-center justify-center text-center border-dashed">
        <BarChart2 className="size-6 text-muted-foreground/30 mb-2" />
        <div className="text-xs text-muted-foreground font-medium">{t("discover.interactiveHeatmapSoon")}</div>
        <div className="text-[10px] text-muted-foreground">With sector analysis & historical comparison</div>
      </div>
    </div>
  );
}

function Discover() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("discover.watchlist");

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="size-6 text-primary" /> {t("discover.marketExplorer")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("discover.whatsMoving")}</p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="size-4 text-muted-foreground" />
        </div>
        <input 
          type="text" 
          placeholder={t("discover.searchPlaceholder")} 
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl">
        {TABS.map(tabKey => (
          <button key={tabKey} onClick={() => setTab(tabKey)}
            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-all ${tab === tabKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === "discover.watchlist" && <DiscoverWatchlist />}
      {tab === "discover.scanner" && <DiscoverScanner />}
      {tab === "discover.news" && <DiscoverNews />}
      {tab === "discover.heatmap" && <DiscoverHeatmap />}
    </div>
  );
}

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
