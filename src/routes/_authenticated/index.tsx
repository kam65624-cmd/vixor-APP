import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getMe,
  listAnalyses,
  getMarketPrices,
  getDailySignals,
  listAlerts,
  getMarketNews,
} from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Camera,
  Activity,
  Zap,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  ChevronRight,
  TrendingUp,
  Bell,
} from "lucide-react";
import { useMemo } from "react";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import { useRenderGuard } from "@/hooks/use-render-guard";
import { RecBadge } from "@/components/vixor/atoms";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Command Center — Vixor" }] }),
  component: CommandCenter,
});

function CommandCenter() {
  useRenderGuard("CommandCenter");
  const navigate = useNavigate();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchMe = useStableServerFn(getMe);
  const fetchRecent = useStableServerFn(listAnalyses);
  const fetchPrices = useStableServerFn(getMarketPrices);
  const fetchSignals = useStableServerFn(getDailySignals);
  const fetchAlerts = useStableServerFn(listAlerts);
  const fetchNews = useStableServerFn(getMarketNews);

  const me = useQuery(useMemo(() => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}) }), [fetchMe]));
  const recent = useQuery(useMemo(() => ({ queryKey: ["analyses", 5] as const, queryFn: () => fetchRecent({ data: { limit: 5 } }), staleTime: 60_000 }), [fetchRecent]));
  const prices = useQuery(useMemo(() => ({
    queryKey: ["market-prices"] as const,
    queryFn: () => fetchPrices({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  }), [fetchPrices]));
  const signals = useQuery(useMemo(() => ({
    queryKey: ["daily-signals"] as const,
    queryFn: () => fetchSignals({ data: {} }),
    staleTime: 120_000,
  }), [fetchSignals]));
  const alerts = useQuery(useMemo(() => ({
    queryKey: ["alerts-dashboard"] as const,
    queryFn: () => fetchAlerts({ data: {} }),
    staleTime: 30_000,
  }), [fetchAlerts]));
  const news = useQuery(useMemo(() => ({
    queryKey: ["market-news-forex"] as const,
    queryFn: () => fetchNews({ data: { category: "forex" } }),
    staleTime: 60_000,
    refetchInterval: 120_000,
  }), [fetchNews]));

  const name = me.data?.profile?.display_name?.split(" ")[0] || "Trader";
  const xp = (me.data?.profile as any)?.xp ?? 1250;
  const isPremium = !!me.data?.isPremium;

  // Active alerts count
  const activeAlerts = (alerts.data ?? []).filter((a: any) => a.status === "active");

  // Top BUY/SELL signals
  const topSignals = (signals.data ?? [])
    .filter((s: any) => s.recommendation !== "WAIT")
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* 1. TOP SECTION */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {new Date().getHours() < 12 ? "Good Morning" : new Date().getHours() < 17 ? "Good Afternoon" : "Good Evening"}, Trader
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {name} <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPremium && (
            <div className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest glow-primary">
              PRO
            </div>
          )}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-[10px] font-bold text-foreground">
            <Zap className="size-3 text-info" /> {xp} pts
          </div>
        </div>
      </div>

      {/* 2. QUICK ANALYZE CTA */}
      <div
        onClick={() => navigate({ to: "/analyze" })}
        className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group active:scale-[0.98] transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#059669]/90 to-[#064e3b]/90" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative flex items-center justify-between">
          <div>
            <Sparkles className="size-5 text-emerald-200 mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Analyze Your Chart</h2>
            <p className="text-xs text-emerald-100 font-medium opacity-90">
              SMC and ICT-powered signal in seconds
            </p>
          </div>
          <div className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="size-5 text-white" />
          </div>
        </div>
      </div>

      {/* 3. MARKET PULSE — Real Data */}
      <div className="vixor-card p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Market Pulse
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              Live
            </span>
          </div>
        </div>

        {prices.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border shimmer h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {(prices.data ?? []).map((p: any) => (
              <a
                key={p.pair}
                href={`/charts?symbol=${p.symbol}`}
                className="p-3 rounded-xl bg-card border border-border vixor-card-hover block"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-foreground">{p.pair}</div>
                  {p.source && (p.source.includes("binance") || p.source.includes("twelvedata")) ? (
                    <span className="text-[8px] font-bold text-primary bg-primary/10 px-1 py-0.5 rounded">LIVE</span>
                  ) : p.source && p.source.includes("cache") ? (
                    <span className="text-[8px] font-bold text-amber-600 bg-amber-500/10 px-1 py-0.5 rounded">CACHED</span>
                  ) : p.source && p.source.includes("ESTIMATED") ? (
                    <span className="text-[8px] font-bold text-red-500 bg-red-500/10 px-1 py-0.5 rounded">EST</span>
                  ) : p.source && p.source.includes("exchangerate-api") ? (
                    <span className="text-[8px] font-bold text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded">DELAYED</span>
                  ) : (
                    <span className="text-[8px] font-bold text-muted-foreground bg-muted px-1 py-0.5 rounded">EST</span>
                  )}
                </div>
                <div className="font-mono text-sm font-semibold mb-1.5">
                  $
                  {Number(p.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4,
                  })}
                </div>
                <div
                  className={`flex items-center gap-1 text-[10px] font-bold ${
                    (p.change24h ?? 0) >= 0 ? "text-bullish" : "text-bearish"
                  }`}
                >
                  {(p.change24h ?? 0) >= 0 ? (
                    <ArrowUpRight className="size-3" />
                  ) : (
                    <ArrowDownRight className="size-3" />
                  )}
                  {(p.change24h ?? 0) >= 0 ? "+" : ""}
                  {(p.change24h ?? 0).toFixed(2)}%
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      {/* 4. DAILY SIGNALS — Real Data */}
      {topSignals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Today's Signals
              </h3>
            </div>
            <a
              href="/signals"
              className="text-[10px] font-bold text-primary flex items-center hover:underline"
            >
              View All <ChevronRight className="size-3" />
            </a>
          </div>
          <div className="space-y-2">
            {topSignals.map((signal: any) => {
              const isBuy = signal.recommendation === "BUY";
              return (
                <a
                  key={signal.id}
                  href={`/charts?symbol=BINANCE:${signal.pair.replace("/", "")}`}
                  className="vixor-card p-3.5 flex items-center gap-3 vixor-card-hover block"
                >
                  <div
                    className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isBuy ? "bg-bullish/10" : "bg-bearish/10"
                    }`}
                  >
                    {isBuy ? (
                      <TrendingUp className="size-4 text-bullish" />
                    ) : (
                      <ArrowDownRight className="size-4 text-bearish" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-sm">{signal.pair}</span>
                      <RecBadge rec={signal.recommendation} />
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      Entry:{" "}
                      {signal.entry
                        ? Number(signal.entry).toLocaleString(undefined, {
                            maximumFractionDigits: 2,
                          })
                        : "—"}
                      {" · "}
                      {signal.timeframe}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-sm font-bold font-mono">{signal.confidence}%</div>
                    <div className="w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full ${isBuy ? "bg-bullish" : "bg-bearish"}`}
                        style={{ width: `${signal.confidence}%` }}
                      />
                    </div>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. AI DAILY FOCUS */}
      <div className="vixor-card p-4 border-l-4 border-l-primary relative overflow-hidden">
        <div className="absolute right-0 top-0 size-32 bg-primary/5 blur-2xl rounded-full" />
        <div className="flex items-center gap-2 mb-2 relative">
          <Zap className="size-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            AI Daily Focus
          </span>
        </div>
        <p className="text-sm font-medium text-foreground leading-relaxed relative">
          {topSignals.length > 0
            ? `Top signal: ${topSignals[0].pair} shows a ${topSignals[0].recommendation} setup at ${topSignals[0].confidence}% confidence. ${topSignals[0].pattern || "Multiple confluences detected."} Monitor your active alerts for trigger notifications.`
            : "No signals generated yet today. Generate daily signals from the Signals page or set price alerts from Charts."}
        </p>
      </div>

      {/* 6. HIGH IMPACT EVENTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-bearish" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              High Impact Events
            </h3>
          </div>
        </div>
        <div className="vixor-card p-6 text-center">
          <div className="size-12 rounded-full bg-bearish/5 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="size-5 text-muted-foreground/30" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">
            No high-impact events scheduled today. Check back later for updates.
          </p>
        </div>
      </div>

      {/* 7. ACTIVE ALERTS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Bell className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Active Alerts
            </h3>
          </div>
          <a
            href="/charts"
            className="text-[10px] font-bold text-primary flex items-center hover:underline"
          >
            View All <ChevronRight className="size-3" />
          </a>
        </div>

        {activeAlerts.length === 0 ? (
          <div className="vixor-card p-4 text-center">
            <Bell className="size-6 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">No active alerts</div>
            <a href="/charts" className="text-xs text-primary font-bold mt-1 inline-block">
              Set one from Charts →
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {activeAlerts.slice(0, 3).map((alert: any) => (
              <div key={alert.id} className="vixor-card p-3.5">
                <div className="flex items-center gap-3">
                  <div
                    className={`size-8 rounded-lg flex items-center justify-center ${
                      alert.condition === "above" || alert.condition === "crosses_up"
                        ? "bg-bullish/10"
                        : "bg-bearish/10"
                    }`}
                  >
                    {alert.condition === "above" || alert.condition === "crosses_up" ? (
                      <ArrowUpRight className="size-4 text-bullish" />
                    ) : (
                      <ArrowDownRight className="size-4 text-bearish" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-sm font-mono">{alert.pair}</div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {alert.condition === "above"
                        ? "Above"
                        : alert.condition === "below"
                          ? "Below"
                          : alert.condition === "crosses_up"
                            ? "Crosses up"
                            : "Crosses down"}{" "}
                      $
                      {Number(alert.target_price).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  </div>
                  <div className="px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase">
                    Active
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 8. MARKET NEWS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Newspaper className="size-4 text-muted-foreground" />
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Market News
            </h3>
          </div>
        </div>
        {news.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="vixor-card p-3.5 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="h-4 w-14 rounded bg-muted shimmer" />
                    <span className="h-3 w-10 rounded bg-muted shimmer" />
                  </div>
                  <div className="h-4 w-full rounded bg-muted shimmer mb-1" />
                  <div className="h-4 w-3/4 rounded bg-muted shimmer" />
                </div>
                <div className="size-14 rounded-lg bg-muted shimmer shrink-0" />
              </div>
            ))}
          </div>
        ) : !news.data || news.data.length === 0 ? (
          <div className="vixor-card p-6 text-center">
            <Newspaper className="size-6 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-xs text-muted-foreground">No market news available right now</div>
          </div>
        ) : (
          <div className="space-y-2">
            {news.data.slice(0, 3).map((item: any) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="vixor-card p-3.5 flex items-start gap-3 active:scale-[0.98] transition-transform cursor-pointer hover:border-primary/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {formatTimeAgo(item.time)}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold leading-snug line-clamp-2">{item.title}</h4>
                </div>
                <div className="size-14 rounded-lg bg-card-hover border border-border shrink-0 flex items-center justify-center overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt=""
                      className="size-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <Newspaper className="size-5 text-muted-foreground/30" />
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Subcomponents

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
