import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getMe,
  getMarketPrices,
  getDailySignals,
  listAlerts,
  getMarketNews,
  getDefaultWatchlist,
  getEconomicCalendar,
} from "@/lib/vixor.functions";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles,
  Camera,
  Activity,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  TrendingUp,
  Bell,
  Crosshair,
  CalendarClock,
  Eye,
  Target,
  MessageSquare,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useMemo } from "react";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useRenderGuard } from "@/shared/hooks/use-render-guard";
import { RecBadge } from "@/components/vixor/atoms";
import {
  ExpandableWidget,
  MiniWidget,
  WidgetGroup,
  type WidgetVariant,
} from "@/components/vixor/ExpandableWidget";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({ meta: [{ title: "Mission Control — Vixor" }] }),
  component: MissionControl,
});

function MissionControl() {
  useRenderGuard("MissionControl");
  const navigate = useNavigate();
  const { t } = useI18n();

  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetchMe = useStableServerFn(getMe);
  const fetchPrices = useStableServerFn(getMarketPrices);
  const fetchSignals = useStableServerFn(getDailySignals);
  const fetchAlerts = useStableServerFn(listAlerts);
  const fetchNews = useStableServerFn(getMarketNews);
  const fetchWatchlist = useStableServerFn(getDefaultWatchlist);
  const fetchCalendar = useStableServerFn(getEconomicCalendar);

  const me = useQuery(
    useMemo(() => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}) }), [fetchMe]),
  );
  const prices = useQuery(
    useMemo(
      () => ({
        queryKey: ["market-prices"] as const,
        queryFn: () => fetchPrices({}),
        staleTime: 30_000,
        refetchInterval: 60_000,
      }),
      [fetchPrices],
    ),
  );
  const signals = useQuery(
    useMemo(
      () => ({
        queryKey: ["daily-signals"] as const,
        queryFn: () => fetchSignals({ data: {} }),
        staleTime: 120_000,
      }),
      [fetchSignals],
    ),
  );
  const alerts = useQuery(
    useMemo(
      () => ({
        queryKey: ["alerts-dashboard"] as const,
        queryFn: () => fetchAlerts({ data: {} }),
        staleTime: 30_000,
      }),
      [fetchAlerts],
    ),
  );
  const news = useQuery(
    useMemo(
      () => ({
        queryKey: ["market-news-forex"] as const,
        queryFn: () => fetchNews({ data: { category: "forex" } }),
        staleTime: 60_000,
        refetchInterval: 120_000,
      }),
      [fetchNews],
    ),
  );
  const watchlist = useQuery(
    useMemo(
      () => ({
        queryKey: ["default-watchlist"] as const,
        queryFn: () => fetchWatchlist({}),
        staleTime: 30_000,
      }),
      [fetchWatchlist],
    ),
  );
  const calendar = useQuery(
    useMemo(
      () => ({
        queryKey: ["economic-calendar"] as const,
        queryFn: () => fetchCalendar({ data: { days: 7 } }),
        staleTime: 300_000,
        refetchInterval: 600_000,
      }),
      [fetchCalendar],
    ),
  );

  const name = me.data?.profile?.display_name?.split(" ")[0] || t("dashboard.trader");
  const xp = (me.data?.profile as any)?.total_xp ?? (me.data?.profile as any)?.xp ?? 0;
  const isPremium = !!me.data?.isPremium;

  // Active alerts
  const activeAlerts = (alerts.data ?? []).filter((a: any) => a.status === "active");

  // All non-WAIT signals sorted by confidence
  const allSignals = (signals.data ?? [])
    .filter((s: any) => s.recommendation !== "WAIT")
    .sort((a: any, b: any) => (b.confidence ?? 0) - (a.confidence ?? 0));
  const topSignals = allSignals.slice(0, 3);

  // Determine top signal variant for hero widget
  const topSignal: any = allSignals[0] ?? null;
  const heroVariant: WidgetVariant = topSignal
    ? topSignal.recommendation === "BUY"
      ? "bullish"
      : "bearish"
    : "neutral";

  // AI suggestion text based on signals/alerts state
  const aiSuggestion = topSignal
    ? `${topSignal.pair} ${topSignal.recommendation} @ ${topSignal.confidence}% — ${t("dashboard.suggestedAction")}`
    : activeAlerts.length > 0
      ? t("dashboard.todayPlan")
      : t("dashboard.whatShouldIDo");

  return (
    <div className="space-y-5 pb-6 animate-in fade-in duration-500">
      {/* ═══════════════════════════════════════════
          1. GREETING HEADER
          ═══════════════════════════════════════════ */}
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {new Date().getHours() < 12
              ? t("dashboard.greeting.morning")
              : new Date().getHours() < 17
                ? t("dashboard.greeting.afternoon")
                : t("dashboard.greeting.evening")}
            , {t("dashboard.trader")}
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            {name} <span className="animate-wave origin-bottom-right inline-block">👋</span>
          </h1>
          <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed max-w-xs">
            {aiSuggestion}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          {isPremium && (
            <div className="px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest glow-primary">
              PRO
            </div>
          )}
          {xp > 0 && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-[10px] font-bold text-foreground">
              <Zap className="size-3 text-info" /> {xp} pts
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          2. DAILY ACTION CENTER (Hero Widget)
          ═══════════════════════════════════════════ */}
      <ExpandableWidget
        title={t("dashboard.dailyAction")}
        subtitle={
          topSignal ? `${topSignal.pair} · ${topSignal.timeframe}` : t("dashboard.noSignalsTitle")
        }
        icon={Target}
        variant={heroVariant}
        badge={topSignal ? topSignal.recommendation : undefined}
        metric={topSignal ? `${topSignal.confidence}%` : undefined}
        metricLabel={topSignal ? t("signals.confidence") : undefined}
        defaultExpanded={false}
      >
        {topSignal ? (
          <div className="space-y-4">
            {/* Signal details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("signals.entry")}
                </span>
                <span className="text-sm font-mono font-bold text-foreground">
                  {topSignal.entry
                    ? Number(topSignal.entry).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("signals.stopLoss")}
                </span>
                <span className="text-sm font-mono font-bold text-bearish">
                  {topSignal.stop_loss
                    ? Number(topSignal.stop_loss).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  {t("signals.takeProfit")}
                </span>
                <span className="text-sm font-mono font-bold text-bullish">
                  {topSignal.take_profit
                    ? Number(topSignal.take_profit).toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                      })
                    : "—"}
                </span>
              </div>
            </div>

            {/* Pattern / Reason */}
            {topSignal.pattern && (
              <div className="text-xs text-muted-foreground leading-relaxed">
                {topSignal.pattern}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <a
                href={`/charts?symbol=BINANCE:${topSignal.pair.replace("/", "")}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Eye className="size-3" /> {t("dashboard.viewCharts")}
              </a>
              <button
                onClick={() => navigate({ to: "/analyze", search: { screenshot: undefined, pair: undefined } })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-card border border-border hover:bg-card-hover transition-colors"
              >
                <Camera className="size-3" /> {t("dashboard.analyzeNow")}
              </button>
              <button
                onClick={() => navigate({ to: "/copilot" })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-card border border-border hover:bg-card-hover transition-colors"
              >
                <MessageSquare className="size-3" /> {t("dashboard.askCopilot")}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t("dashboard.noSignalsDesc")}
            </p>
            <button
              onClick={() => navigate({ to: "/signals" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Sparkles className="size-3.5" /> {t("dashboard.generateSignals")}
            </button>
          </div>
        )}
      </ExpandableWidget>

      {/* ═══════════════════════════════════════════
          3. MARKET PULSE GRID
          ═══════════════════════════════════════════ */}
      <WidgetGroup
        title={t("dashboard.marketPulse")}
        icon={Activity}
        action={
          <div className="flex items-center gap-1.5">
            <div className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-bold text-primary uppercase tracking-widest">
              {t("dashboard.live")}
            </span>
          </div>
        }
      >
        {prices.isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-3 rounded-xl bg-card border border-border shimmer h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {(prices.data ?? []).map((p: any) => {
              const change = p.change24h ?? 0;
              const variant: WidgetVariant = change >= 0 ? "bullish" : "bearish";
              return (
                <a key={p.pair} href={`/charts?symbol=${p.symbol || p.pair}`} className="block">
                  <MiniWidget
                    title={p.pair}
                    value={`$${Number(p.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4,
                    })}`}
                    variant={variant}
                    icon={change >= 0 ? TrendingUp : ArrowDownRight}
                    className="hover:bg-card-hover transition-colors"
                  />
                </a>
              );
            })}
          </div>
        )}
      </WidgetGroup>

      {/* ═══════════════════════════════════════════
          4. WATCHLIST QUICK VIEW
          ═══════════════════════════════════════════ */}
      <ExpandableWidget
        title={t("dashboard.watchlistQuick")}
        subtitle={
          (watchlist.data as any)?.items?.length > 0
            ? t("dashboard.watchlistItems", { count: (watchlist.data as any).items.length })
            : t("dashboard.addPairs")
        }
        icon={Eye}
        variant="info"
        defaultExpanded={false}
      >
        {watchlist.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-muted shimmer" />
            ))}
          </div>
        ) : !(watchlist.data as any)?.items || (watchlist.data as any).items.length === 0 ? (
          <div className="space-y-3">
            {/* Show popular pairs as suggestions */}
            <div className="grid grid-cols-2 gap-2">
              {["EUR/USD", "GBP/USD", "XAU/USD", "BTC/USDT"].map((pair) => (
                <div
                  key={pair}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border"
                >
                  <Crosshair className="size-3 text-muted-foreground" />
                  <span className="text-xs font-mono font-bold text-foreground">{pair}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate({ to: "/discover" })}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-info/10 text-info border border-info/20 hover:bg-info/20 transition-colors"
            >
              <Eye className="size-3.5" /> {t("dashboard.buildWatchlist")}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {(watchlist.data as any).items.slice(0, 6).map((item: any) => {
              const priceData = (prices.data ?? []).find((p: any) => p.pair === item.pair);
              const change = priceData?.change24h ?? 0;
              const isPositive = change >= 0;
              return (
                <a
                  key={item.id}
                  href={`/charts?symbol=BINANCE:${item.pair.replace("/", "")}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold font-mono text-xs">{item.pair}</span>
                      <span className="text-[8px] font-bold px-1 py-0.5 rounded bg-primary/10 text-primary capitalize">
                        {item.category}
                      </span>
                    </div>
                    {priceData && (
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        ${Number(priceData.price).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: item.pair?.includes("JPY") ? 2 : 4,
                        })}
                      </div>
                    )}
                  </div>
                  {priceData && (
                    <div className="text-right shrink-0">
                      <div
                        className={`text-xs font-bold font-mono ${isPositive ? "text-bullish" : "text-bearish"}`}
                      >
                        {isPositive ? "+" : ""}{change.toFixed(2)}%
                      </div>
                    </div>
                  )}
                </a>
              );
            })}
            <button
              onClick={() => navigate({ to: "/discover" })}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-primary hover:underline"
            >
              {t("dashboard.viewAll")} <ChevronRight className="size-3" />
            </button>
          </div>
        )}
      </ExpandableWidget>

      {/* ═══════════════════════════════════════════
          DESKTOP TWO-COLUMN LAYOUT
          Signals + Alerts side by side on lg
          ═══════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-5 lg:space-y-0">
        {/* ═══════════════════════════════════════════
            5. TODAY'S SIGNALS
            ═══════════════════════════════════════════ */}
        <ExpandableWidget
          title={t("dashboard.todaysSignals")}
          subtitle={
            allSignals.length > 0
              ? t("dashboard.signalCount", { count: allSignals.length })
              : undefined
          }
          icon={Sparkles}
          variant={
            topSignal ? (topSignal.recommendation === "BUY" ? "bullish" : "bearish") : "neutral"
          }
          badge={allSignals.length > 0 ? `${allSignals.length}` : undefined}
          defaultExpanded={false}
        >
          {signals.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-lg bg-muted shimmer" />
              ))}
            </div>
          ) : allSignals.length === 0 ? (
            <div className="py-4 text-center">
              <Sparkles className="size-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("dashboard.noSignalsTitle")}</p>
              <button
                onClick={() => navigate({ to: "/signals" })}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t("dashboard.generateSignals")} <ChevronRight className="size-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {allSignals.map((signal: any) => {
                const isBuy = signal.recommendation === "BUY";
                return (
                  <a
                    key={signal.id}
                    href={`/charts?symbol=BINANCE:${signal.pair.replace("/", "")}`}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div
                      className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
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
                        <span className="font-bold font-mono text-xs">{signal.pair}</span>
                        <RecBadge rec={signal.recommendation} />
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {t("signals.entry")}:{" "}
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
                      <div className="text-xs font-bold font-mono">{signal.confidence}%</div>
                      <div className="w-10 h-1 bg-muted rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full ${isBuy ? "bg-bullish" : "bg-bearish"}`}
                          style={{ width: `${signal.confidence}%` }}
                        />
                      </div>
                    </div>
                  </a>
                );
              })}
              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => navigate({ to: "/signals" })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                >
                  <Sparkles className="size-3" /> {t("dashboard.viewAll")}
                </button>
                <button
                  onClick={() => navigate({ to: "/analyze", search: { screenshot: undefined, pair: undefined } })}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-card border border-border hover:bg-card-hover transition-colors"
                >
                  <Camera className="size-3" /> {t("dashboard.analyzeNow")}
                </button>
              </div>
            </div>
          )}
        </ExpandableWidget>

        {/* ═══════════════════════════════════════════
            8. ACTIVE ALERTS
            ═══════════════════════════════════════════ */}
        <ExpandableWidget
          title={t("dashboard.activeAlerts")}
          subtitle={
            activeAlerts.length > 0
              ? t("dashboard.alertCount", { count: activeAlerts.length })
              : undefined
          }
          icon={Bell}
          variant={activeAlerts.length > 0 ? "warning" : "neutral"}
          badge={activeAlerts.length > 0 ? `${activeAlerts.length}` : undefined}
          defaultExpanded={false}
        >
          {alerts.isLoading ? (
            <div className="space-y-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted shimmer" />
              ))}
            </div>
          ) : activeAlerts.length === 0 ? (
            <div className="py-4 text-center">
              <Bell className="size-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("dashboard.noActiveAlerts")}</p>
              <button
                onClick={() => navigate({ to: "/charts", search: { symbol: "BINANCE:BTCUSDT" } })}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                {t("dashboard.setAlert")} <ChevronRight className="size-3" />
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {activeAlerts.slice(0, 5).map((alert: any) => {
                const isUp = alert.condition === "above" || alert.condition === "crosses_up";
                return (
                  <div
                    key={alert.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
                  >
                    <div
                      className={`size-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isUp ? "bg-bullish/10" : "bg-bearish/10"
                      }`}
                    >
                      {isUp ? (
                        <ArrowUpRight className="size-3.5 text-bullish" />
                      ) : (
                        <ArrowDownRight className="size-3.5 text-bearish" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs font-mono">{alert.pair}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {alert.condition === "above"
                          ? t("common.above")
                          : alert.condition === "below"
                            ? t("common.below")
                            : alert.condition === "crosses_up"
                              ? t("common.crossesUp")
                              : t("common.crossesDown")}{" "}
                        $
                        {Number(alert.target_price).toLocaleString(undefined, {
                          maximumFractionDigits: 2,
                        })}
                      </div>
                    </div>
                    <div className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-primary/10 text-primary uppercase">
                      {t("dashboard.active")}
                    </div>
                  </div>
                );
              })}
              <button
                onClick={() => navigate({ to: "/charts", search: { symbol: "BINANCE:BTCUSDT" } })}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
              >
                <Bell className="size-3" /> {t("dashboard.setAlert")}
              </button>
            </div>
          )}
        </ExpandableWidget>
      </div>

      {/* ═══════════════════════════════════════════
          DESKTOP TWO-COLUMN LAYOUT
          AI Focus + Calendar side by side on lg
          ═══════════════════════════════════════════ */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-4 space-y-5 lg:space-y-0">
        {/* ═══════════════════════════════════════════
            6. AI DAILY FOCUS
            ═══════════════════════════════════════════ */}
        <ExpandableWidget
          title={t("dashboard.aiDailyFocus")}
          subtitle={t("dashboard.todayPlan")}
          icon={Zap}
          variant="info"
          defaultExpanded={false}
        >
          <div className="space-y-3">
            <p className="text-xs text-foreground/90 leading-relaxed">
              {topSignals.length > 0
                ? `${t("dashboard.topSignal")}: ${topSignals[0].pair} ${topSignals[0].recommendation} @ ${topSignals[0].confidence}% ${t("signals.confidence").toLowerCase()}. ${topSignals[0].pattern || "Multiple confluences detected."} ${activeAlerts.length > 0 ? `${activeAlerts.length} ${t("dashboard.activeAlerts").toLowerCase()} ${t("dashboard.active").toLowerCase()}.` : ""}`
                : t("dashboard.noSignalsYet")}
            </p>
            <button
              onClick={() => navigate({ to: "/copilot" })}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold bg-info/10 text-info border border-info/20 hover:bg-info/20 transition-colors"
            >
              <MessageSquare className="size-3" /> {t("dashboard.askCopilot")}
            </button>
          </div>
        </ExpandableWidget>

        {/* ═══════════════════════════════════════════
            7. ECONOMIC CALENDAR PREVIEW (Real Data)
            ═══════════════════════════════════════════ */}
        <ExpandableWidget
          title={t("dashboard.calendarTitle")}
          subtitle={t("dashboard.calendarSubtitle")}
          icon={CalendarClock}
          variant="warning"
          badge={(() => {
            const todayEvents = (calendar.data ?? []).filter((e: any) => {
              const d = new Date(e.date);
              const now = new Date();
              return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
            });
            const highCount = todayEvents.filter((e: any) => e.impact === "high").length;
            return highCount > 0 ? `${highCount} 🔴` : undefined;
          })()}
          defaultExpanded={false}
        >
          {calendar.isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 rounded-lg bg-muted shimmer" />
              ))}
            </div>
          ) : !(calendar.data ?? []).length ? (
            <div className="py-4 text-center">
              <CalendarClock className="size-6 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">{t("dashboard.noEventsToday")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {(calendar.data ?? [])
                .filter((e: any) => {
                  const d = new Date(e.date);
                  const now = new Date();
                  return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
                })
                .slice(0, 5)
                .map((evt: any) => {
                  const eventDate = new Date(evt.date);
                  const isToday = (() => {
                    const now = new Date();
                    return eventDate.getDate() === now.getDate() && eventDate.getMonth() === now.getMonth();
                  })();
                  const timeStr = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const flagMap: Record<string, string> = { US: "🇺🇸", EU: "🇪🇺", UK: "🇬🇧", JP: "🇯🇵", AU: "🇦🇺", CA: "🇨🇦", CH: "🇨🇭", NZ: "🇳🇿" };
                  const impactColor = evt.impact === "high" ? "bg-bearish/15 text-bearish border-bearish/40" : evt.impact === "medium" ? "bg-neutral-wait/15 text-neutral-wait border-neutral-wait/40" : "bg-muted text-muted-foreground border-border";
                  return (
                    <div
                      key={evt.id}
                      className="flex items-center gap-2.5 p-2.5 rounded-lg bg-card border border-border"
                      style={evt.impact === "high" ? { borderInlineStartColor: "var(--color-bearish)", borderInlineStartWidth: "3px" } : undefined}
                    >
                      <span className="text-base shrink-0">{flagMap[evt.country] || "🌍"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold truncate">{evt.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] text-muted-foreground font-mono">{evt.currency}</span>
                          <span className="text-[10px] text-muted-foreground">·</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{timeStr}</span>
                          {!isToday && (
                            <>
                              <span className="text-[10px] text-muted-foreground">·</span>
                              <span className="text-[10px] text-muted-foreground">{eventDate.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${impactColor}`}>
                        {evt.impact === "high" ? t("discover.high") : evt.impact === "medium" ? t("discover.medium") : t("discover.low")}
                      </span>
                      <div className="flex flex-col items-end shrink-0 text-[9px] font-mono">
                        {evt.actual && <span className="text-foreground">{evt.actual}</span>}
                        {evt.forecast && <span className="text-muted-foreground">F: {evt.forecast}</span>}
                      </div>
                    </div>
                  );
                })}
              <a
                href="/discover"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-primary hover:underline"
              >
                {t("dashboard.viewCalendar")} <ChevronRight className="size-3" />
              </a>
            </div>
          )}
        </ExpandableWidget>
      </div>

      {/* ═══════════════════════════════════════════
          9. MARKET NEWS
          ═══════════════════════════════════════════ */}
      <ExpandableWidget
        title={t("dashboard.marketNews")}
        subtitle={
          news.data && news.data.length > 0
            ? t("dashboard.newsCount", { count: news.data.length })
            : undefined
        }
        icon={Newspaper}
        variant="neutral"
        defaultExpanded={false}
      >
        {news.isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start gap-3 p-2">
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-3 w-20 rounded bg-muted shimmer" />
                  <div className="h-4 w-full rounded bg-muted shimmer" />
                  <div className="h-4 w-3/4 rounded bg-muted shimmer" />
                </div>
                <div className="size-12 rounded-lg bg-muted shimmer shrink-0" />
              </div>
            ))}
          </div>
        ) : !news.data || news.data.length === 0 ? (
          <div className="py-4 text-center">
            <Newspaper className="size-6 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{t("dashboard.noMarketNews")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {news.data.slice(0, 5).map((item: any) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-2.5 rounded-lg bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      {item.source}
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground">
                      {formatTimeAgo(item.time, t)}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold leading-snug line-clamp-2">{item.title}</h4>
                </div>
                <div className="size-11 rounded-lg bg-card-hover border border-border shrink-0 flex items-center justify-center overflow-hidden">
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
                    <Newspaper className="size-4 text-muted-foreground/30" />
                  )}
                </div>
              </a>
            ))}
            <a
              href="/discover"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-bold text-primary hover:underline"
            >
              {t("dashboard.viewAll")} <ChevronRight className="size-3" />
            </a>
          </div>
        )}
      </ExpandableWidget>

      {/* ═══════════════════════════════════════════
          QUICK ANALYZE CTA (bottom)
          ═══════════════════════════════════════════ */}
      <div
        onClick={() => navigate({ to: "/analyze", search: { screenshot: undefined, pair: undefined } })}
        className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group active:scale-[0.98] transition-all"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#059669]/90 to-[#064e3b]/90" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative flex items-center justify-between">
          <div>
            <Sparkles className="size-5 text-emerald-200 mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">{t("dashboard.analyzeChart")}</h2>
            <p className="text-xs text-emerald-100 font-medium opacity-90">
              {t("dashboard.smcIct")}
            </p>
          </div>
          <div className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Camera className="size-5 text-white" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DAILY LOOP CTA
          ═══════════════════════════════════════════ */}
      <a
        href="/daily-loop"
        className="relative overflow-hidden rounded-2xl p-5 cursor-pointer group active:scale-[0.98] transition-all block"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#FF9800]/90 to-[#E65100]/90" />
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />

        <div className="relative flex items-center justify-between">
          <div>
            <Flame className="size-5 text-amber-200 mb-3" />
            <h2 className="text-xl font-bold text-white mb-1">Daily Loop</h2>
            <p className="text-xs text-amber-100 font-medium opacity-90">
              Build consistency with your daily trading routine
            </p>
          </div>
          <div className="size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Target className="size-5 text-white" />
          </div>
        </div>
      </a>
    </div>
  );
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function formatTimeAgo(
  timestamp: number,
  t?: (key: string, params?: Record<string, string | number>) => string,
) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t ? t("common.justNow") : "Just now";
  if (mins < 60) return t ? t("common.mAgo", { mins }) : `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t ? t("common.hAgo", { hours }) : `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return t ? t("common.dAgo", { days }) : `${days}d ago`;
}
