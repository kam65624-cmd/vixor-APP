"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Target,
  Layers,
  ArrowRight,
  LineChart,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  X,
  DollarSign,
  Activity,
  Loader2,
  Camera,
  Save,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { listTrades, createTrade, updateTrade, getTradeStats, getEquityCurve } from "@/domains/trades/functions";
import type { Trade, TradeStats, TradeDirection, EquityCurvePoint } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { ExpandableWidget, WidgetGroup, MiniWidget } from "@/components/vixor/ExpandableWidget";
import { cn } from "@/shared/utils";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio Intelligence — Vixor" }] }),
  component: Portfolio,
});

// ═══════════════════════════════════════════════
// PAIRS (for the trade form)
// ═══════════════════════════════════════════════
const PAIRS = [
  "XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "GBPJPY",
  "BTCUSD", "ETHUSD", "SOLUSD", "AUDUSD", "NZDUSD",
  "USDCAD", "USDCHF", "EURGBP", "EURJPY",
];

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

function Portfolio() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [showNewTradeDialog, setShowNewTradeDialog] = useState(false);
  const [closeTradeDialog, setCloseTradeDialog] = useState<Trade | null>(null);

  // Stable server fn refs
  const fetchStats = useStableServerFn(getTradeStats);
  const fetchCurve = useStableServerFn(getEquityCurve);
  const fetchOpenTrades = useStableServerFn(listTrades);
  const fetchRecentTrades = useStableServerFn(listTrades);
  const createTradeFn = useStableServerFn(createTrade);
  const updateTradeFn = useStableServerFn(updateTrade);

  // Queries
  const statsQuery = useQuery({
    queryKey: ["trade-stats"],
    queryFn: () => fetchStats({}),
    staleTime: 30_000,
  });

  const curveQuery = useQuery({
    queryKey: ["equity-curve"],
    queryFn: () => fetchCurve({}),
    staleTime: 30_000,
  });

  const openTradesQuery = useQuery({
    queryKey: ["open-trades"],
    queryFn: () => fetchOpenTrades({ data: { status: "open", limit: 50 } }),
    staleTime: 15_000,
  });

  const recentTradesQuery = useQuery({
    queryKey: ["recent-closed-trades"],
    queryFn: () => fetchRecentTrades({ data: { status: "closed", limit: 20 } }),
    staleTime: 30_000,
  });

  const stats = statsQuery.data as TradeStats | undefined;
  const curve = (curveQuery.data ?? []) as EquityCurvePoint[];
  const openTrades = (openTradesQuery.data ?? []) as Trade[];
  const recentTrades = (recentTradesQuery.data ?? []) as Trade[];

  const isLoading = statsQuery.isLoading;
  const hasData = (stats?.closedTrades ?? 0) > 0 || (stats?.totalTrades ?? 0) > 0;

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: { pair: string; direction: TradeDirection; entry_price: number; quantity?: number | null; stop_loss?: number | null; take_profit?: number | null; notes?: string | null; tags?: string[]; strategy?: string | null; analysis_id?: string | null }) => createTradeFn({ data }),
    onSuccess: () => {
      setShowNewTradeDialog(false);
      queryClient.invalidateQueries({ queryKey: ["trade-stats"] });
      queryClient.invalidateQueries({ queryKey: ["equity-curve"] });
      queryClient.invalidateQueries({ queryKey: ["open-trades"] });
      queryClient.invalidateQueries({ queryKey: ["recent-closed-trades"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: (data: { tradeId: string; exit_price: number; status: "closed"; exit_date: string }) => updateTradeFn({ data }),
    onSuccess: () => {
      setCloseTradeDialog(null);
      queryClient.invalidateQueries({ queryKey: ["trade-stats"] });
      queryClient.invalidateQueries({ queryKey: ["equity-curve"] });
      queryClient.invalidateQueries({ queryKey: ["open-trades"] });
      queryClient.invalidateQueries({ queryKey: ["recent-closed-trades"] });
    },
  });

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["trade-stats"] });
    queryClient.invalidateQueries({ queryKey: ["equity-curve"] });
    queryClient.invalidateQueries({ queryKey: ["open-trades"] });
    queryClient.invalidateQueries({ queryKey: ["recent-closed-trades"] });
  }, [queryClient]);

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <BarChart3 className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">{t("portfolio.title")}</h1>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              {t("portfolio.subtitle")}
            </div>
          </div>
        </div>

        {/* New Trade Button */}
        <button
          onClick={() => setShowNewTradeDialog(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg gradient-primary text-primary-foreground text-xs font-bold glow-primary transition-transform active:scale-95"
        >
          <Plus className="size-3.5" />
          <span className="hidden sm:inline">New Trade</span>
        </button>
      </div>

      {/* ── LOADING STATE ── */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="vixor-card p-4 h-24 shimmer" />
            ))}
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="vixor-card h-40 shimmer" />
          ))}
        </div>
      )}

      {/* ── EMPTY / ONBOARDING STATE ── */}
      {!isLoading && !hasData && (
        <div className="space-y-5">
          <div className="vixor-card p-8 text-center border-dashed border-2">
            <div className="size-16 rounded-2xl bg-primary/5 border border-primary/15 flex items-center justify-center mx-auto mb-5">
              <LineChart className="size-7 text-primary/60" />
            </div>
            <h2 className="text-lg font-bold mb-2">{t("portfolio.noData")}</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed mb-6">
              Start logging your trades to see real performance metrics, equity curves, and trade breakdowns here.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto text-left">
              <button
                onClick={() => setShowNewTradeDialog(true)}
                className="vixor-card p-4 flex items-start gap-3 vixor-card-hover group"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Plus className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold mb-0.5 group-hover:text-primary transition-colors">
                    Log a Trade
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Record your first trade to start tracking performance
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </button>

              <a
                href="/analyze"
                className="vixor-card p-4 flex items-start gap-3 vixor-card-hover group"
              >
                <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Camera className="size-4 text-primary" />
                </div>
                <div>
                  <div className="text-xs font-bold mb-0.5 group-hover:text-primary transition-colors">
                    Analyze Charts
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Get AI signals then save them as trades
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>

          <WidgetGroup title="Coming Soon">
            <ExpandableWidget
              title="Performance Overview"
              icon={Target}
              variant="bullish"
              defaultExpanded={false}
              metric="—"
              metricLabel={t("portfolio.winRate")}
            >
              <div className="text-xs text-muted-foreground text-center py-4">
                Log your first trade to see real performance metrics.
              </div>
            </ExpandableWidget>
          </WidgetGroup>
        </div>
      )}

      {/* ── MAIN CONTENT (has data) ── */}
      {!isLoading && hasData && stats && (
        <div className="space-y-4">
          {/* ═══ TOP METRICS GRID ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <MiniWidget
              title={t("portfolio.winRate")}
              value={`${stats.winRate}%`}
              variant={stats.winRate >= 50 ? "bullish" : "bearish"}
              icon={TrendingUp}
            />
            <MiniWidget
              title="Total P&L"
              value={formatPnl(stats.totalPnl)}
              variant={stats.totalPnl >= 0 ? "bullish" : "bearish"}
              icon={DollarSign}
            />
            <MiniWidget
              title={t("portfolio.profitFactor")}
              value={stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "—"}
              variant={(stats.profitFactor ?? 0) >= 1.5 ? "bullish" : (stats.profitFactor ?? 0) >= 1 ? "neutral" : "bearish"}
              icon={BarChart3}
            />
            <MiniWidget
              title="Avg R"
              value={stats.avgRMultiple !== null ? `${stats.avgRMultiple}R` : "—"}
              variant={(stats.avgRMultiple ?? 0) >= 1 ? "bullish" : (stats.avgRMultiple ?? 0) >= 0 ? "neutral" : "bearish"}
              icon={Target}
            />
          </div>

          {/* ═══ SECONDARY STATS ROW ═══ */}
          <div className="grid grid-cols-3 gap-2">
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bullish mb-1">
                WINS
              </div>
              <div className="text-lg font-bold font-mono text-bullish">{stats.winCount}</div>
            </div>
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bearish mb-1">
                LOSSES
              </div>
              <div className="text-lg font-bold font-mono text-bearish">{stats.lossCount}</div>
            </div>
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-wait mb-1">
                MAX DD
              </div>
              <div className="text-lg font-bold font-mono text-neutral-wait">
                {stats.maxDrawdown > 0 ? formatPnl(-stats.maxDrawdown) : "$0"}
              </div>
            </div>
          </div>

          {/* ═══ PERFORMANCE OVERVIEW ═══ */}
          <ExpandableWidget
            title="Performance Overview"
            subtitle={`${stats.closedTrades} closed trades · ${stats.totalTrades} total`}
            icon={Target}
            variant="bullish"
            defaultExpanded={true}
            metric={`${stats.winRate}%`}
            metricLabel={t("portfolio.winRate")}
            badge="REAL"
          >
            <div className="space-y-4">
              {/* Equity Curve */}
              {curve.length >= 2 ? (
                <div className="rounded-lg border border-border bg-card-hover p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {t("portfolio.equityCurve")}
                    </span>
                    <span className={cn(
                      "text-xs font-mono font-bold",
                      curve[curve.length - 1]?.cumulative_pnl >= 0 ? "text-bullish" : "text-bearish"
                    )}>
                      {formatPnl(curve[curve.length - 1]?.cumulative_pnl ?? 0)}
                    </span>
                  </div>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={curve} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pnlGradientPos" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-bullish)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-bullish)" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="pnlGradientNeg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--color-bearish)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--color-bearish)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                          tickFormatter={(v: string) => v.slice(5)}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "var(--color-card)",
                            border: "1px solid var(--color-border)",
                            borderRadius: "8px",
                            fontSize: "11px",
                          }}
                          formatter={(value: number) => [formatPnl(value), "Cumulative P&L"]}
                        />
                        <ReferenceLine y={0} stroke="var(--color-muted-foreground)" strokeDasharray="3 3" />
                        <Area
                          type="monotone"
                          dataKey="cumulative_pnl"
                          stroke={curve[curve.length - 1]?.cumulative_pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"}
                          fill={curve[curve.length - 1]?.cumulative_pnl >= 0 ? "url(#pnlGradientPos)" : "url(#pnlGradientNeg)"}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, strokeWidth: 0 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center">
                  <LineChart className="size-8 text-muted-foreground/40 mx-auto mb-3" />
                  <div className="text-xs font-bold text-muted-foreground mb-1">
                    {t("portfolio.equityCurve")}
                  </div>
                  <div className="text-[10px] text-muted-foreground/70">
                    Close at least 2 trades to see your equity curve.
                  </div>
                </div>
              )}

              {/* Detailed Metrics */}
              <div className="data-grid grid-cols-2">
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.winRate")}
                  </span>
                  <span className="text-mono text-sm font-bold text-bullish">
                    {stats.winRate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground">{stats.winCount}W / {stats.lossCount}L</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.profitFactor")}
                  </span>
                  <span
                    className={cn(
                      "text-mono text-sm font-bold",
                      (stats.profitFactor ?? 0) >= 1.5
                        ? "text-bullish"
                        : (stats.profitFactor ?? 0) >= 1.0
                          ? "text-neutral-wait"
                          : "text-bearish",
                    )}
                  >
                    {stats.profitFactor !== null ? stats.profitFactor.toFixed(2) : "—"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Gross profit / |Gross loss|</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Avg R-Multiple
                  </span>
                  <span className="text-mono text-sm font-bold text-info">
                    {stats.avgRMultiple !== null ? `${stats.avgRMultiple}R` : "—"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Risk-adjusted returns</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.drawdown")}
                  </span>
                  <span className="text-mono text-sm font-bold text-bearish">
                    {stats.maxDrawdown > 0 ? formatPnl(-stats.maxDrawdown) : "$0"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Peak-to-trough decline</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Avg P&L / Trade
                  </span>
                  <span className={cn(
                    "text-mono text-sm font-bold",
                    stats.avgPnl >= 0 ? "text-bullish" : "text-bearish",
                  )}>
                    {formatPnl(stats.avgPnl)}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Per closed trade</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Avg Hold Time
                  </span>
                  <span className="text-mono text-sm font-bold text-foreground">
                    {stats.avgHoldingTimeHours !== null ? formatDuration(stats.avgHoldingTimeHours) : "—"}
                  </span>
                  <span className="text-[9px] text-muted-foreground">From entry to exit</span>
                </div>
              </div>

              {/* Best / Worst */}
              {(stats.bestTrade || stats.worstTrade) && (
                <div className="grid grid-cols-2 gap-2">
                  {stats.bestTrade && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bullish/5 border border-bullish/20">
                      <ArrowUpRight className="size-3.5 text-bullish shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-bullish">Best Trade</div>
                        <div className="text-xs font-bold font-mono text-bullish truncate">
                          {formatPnl(stats.bestTrade.pnl)} · {stats.bestTrade.pair}
                        </div>
                      </div>
                    </div>
                  )}
                  {stats.worstTrade && (
                    <div className="flex items-center gap-2 p-2.5 rounded-lg bg-bearish/5 border border-bearish/20">
                      <ArrowDownRight className="size-3.5 text-bearish shrink-0" />
                      <div className="min-w-0">
                        <div className="text-[9px] font-bold uppercase tracking-widest text-bearish">Worst Trade</div>
                        <div className="text-xs font-bold font-mono text-bearish truncate">
                          {formatPnl(stats.worstTrade.pnl)} · {stats.worstTrade.pair}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ExpandableWidget>

          {/* ═══ OPEN POSITIONS ═══ */}
          <ExpandableWidget
            title="Open Positions"
            subtitle={`${openTrades.length} active`}
            icon={Activity}
            variant="info"
            defaultExpanded={openTrades.length > 0}
            metric={`${openTrades.length}`}
            metricLabel="OPEN"
            badge={openTrades.length > 0 ? "ACTIVE" : undefined}
          >
            {openTrades.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                No open positions. Click "New Trade" to log one.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin">
                {openTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border"
                  >
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      trade.direction === "long" ? "bg-bullish/10" : "bg-bearish/10",
                    )}>
                      {trade.direction === "long" ? (
                        <ArrowUpRight className="size-4 text-bullish" />
                      ) : (
                        <ArrowDownRight className="size-4 text-bearish" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">{trade.pair}</span>
                        <span className={cn(
                          "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                          trade.direction === "long"
                            ? "bg-bullish/15 text-bullish"
                            : "bg-bearish/15 text-bearish",
                        )}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        Entry: {trade.entry_price}
                        {trade.stop_loss && ` · SL: ${trade.stop_loss}`}
                        {trade.take_profit && ` · TP: ${trade.take_profit}`}
                      </div>
                    </div>
                    <button
                      onClick={() => setCloseTradeDialog(trade)}
                      className="text-[10px] font-bold uppercase px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors shrink-0"
                    >
                      Close
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ExpandableWidget>

          {/* ═══ BY PAIR ═══ */}
          {stats.winRateByPair.length > 0 && (
            <ExpandableWidget
              title={t("portfolio.byAsset")}
              subtitle={`${stats.winRateByPair.length} instruments tracked`}
              icon={BarChart3}
              variant="info"
              defaultExpanded={true}
              metric={`${stats.winRateByPair.length}`}
              metricLabel="PAIRS"
            >
              <div className="space-y-2">
                {stats.winRateByPair.map((item) => {
                  const maxCount = stats.winRateByPair[0]?.count ?? 1;
                  const barWidth = Math.round((item.count / maxCount) * 100);
                  const confColor =
                    item.winRate >= 55
                      ? "bg-bullish"
                      : item.winRate >= 40
                        ? "bg-neutral-wait"
                        : "bg-bearish";

                  return (
                    <div
                      key={item.pair}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
                    >
                      <div className="w-20 shrink-0">
                        <div className="text-xs font-bold font-mono truncate">{item.pair}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn("h-full rounded-full transition-all duration-700", confColor)}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[11px] font-bold font-mono">{item.count}</div>
                        <div className={cn(
                          "text-[9px] font-mono",
                          item.winRate >= 55
                            ? "text-bullish"
                            : item.winRate >= 40
                              ? "text-neutral-wait"
                              : "text-bearish",
                        )}>
                          {item.winRate}% WR
                        </div>
                        <div className={cn(
                          "text-[9px] font-mono",
                          item.totalPnl >= 0 ? "text-bullish" : "text-bearish",
                        )}>
                          {formatPnl(item.totalPnl)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ BY DIRECTION ═══ */}
          {stats.winRateByDirection.length > 0 && (
            <ExpandableWidget
              title="By Direction"
              subtitle="Long vs Short breakdown"
              icon={Layers}
              variant="neutral"
              defaultExpanded={false}
            >
              <div className="space-y-2">
                {stats.winRateByDirection.map((item) => (
                  <div
                    key={item.direction}
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card border-border"
                  >
                    <div className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      item.direction === "long" ? "bg-bullish/10" : "bg-bearish/10",
                    )}>
                      {item.direction === "long" ? (
                        <ArrowUpRight className="size-4 text-bullish" />
                      ) : (
                        <ArrowDownRight className="size-4 text-bearish" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{item.direction.toUpperCase()}</div>
                      <div className="text-[10px] text-muted-foreground">{item.count} trades</div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={cn(
                        "text-sm font-bold font-mono",
                        item.winRate >= 55 ? "text-bullish" : item.winRate >= 40 ? "text-neutral-wait" : "text-bearish",
                      )}>
                        {item.winRate}%
                      </div>
                      <div className={cn(
                        "text-[10px] font-mono",
                        item.totalPnl >= 0 ? "text-bullish" : "text-bearish",
                      )}>
                        {formatPnl(item.totalPnl)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ BY DAY OF WEEK ═══ */}
          {stats.winRateByDay.length > 0 && (
            <ExpandableWidget
              title={t("portfolio.byDay")}
              subtitle="Weekly performance pattern"
              icon={CalendarDays}
              variant="neutral"
              defaultExpanded={false}
              metric={getBestDay(stats.winRateByDay)}
              metricLabel="BEST DAY"
            >
              <div className="space-y-1.5">
                {stats.winRateByDay.map((item) => {
                  const maxCount = Math.max(...stats.winRateByDay.map((d) => d.count));
                  const barWidth = Math.round((item.count / (maxCount || 1)) * 100);
                  const isBest =
                    item.winRate === Math.max(...stats.winRateByDay.map((d) => d.winRate));

                  return (
                    <div
                      key={item.day}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
                    >
                      <div className="w-10 shrink-0">
                        <span className={cn("text-xs font-bold", isBest ? "text-primary" : "text-foreground")}>
                          {item.day}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all duration-700",
                              isBest ? "bg-primary" : "bg-muted-foreground/40",
                            )}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                      <div className="shrink-0 text-right flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground font-mono">{item.count}</span>
                        <span className={cn(
                          "text-[11px] font-bold font-mono min-w-[36px]",
                          item.winRate >= 55 ? "text-bullish" : item.winRate >= 40 ? "text-neutral-wait" : "text-bearish",
                        )}>
                          {item.winRate}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ RECENT TRADES ═══ */}
          {recentTrades.length > 0 && (
            <ExpandableWidget
              title="Recent Trades"
              subtitle={`Last ${Math.min(recentTrades.length, 20)} closed trades`}
              icon={Clock}
              variant="neutral"
              defaultExpanded={true}
            >
              <div className="space-y-1.5 max-h-96 overflow-y-auto scrollbar-thin">
                {recentTrades.map((trade) => (
                  <div
                    key={trade.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
                  >
                    <div className={cn(
                      "size-7 rounded-lg flex items-center justify-center shrink-0",
                      trade.direction === "long" ? "bg-bullish/10" : "bg-bearish/10",
                    )}>
                      {trade.direction === "long" ? (
                        <ArrowUpRight className="size-3.5 text-bullish" />
                      ) : (
                        <ArrowDownRight className="size-3.5 text-bearish" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono">{trade.pair}</span>
                        <span className={cn(
                          "text-[8px] font-bold uppercase px-1 py-0.5 rounded",
                          trade.direction === "long"
                            ? "bg-bullish/15 text-bullish"
                            : "bg-bearish/15 text-bearish",
                        )}>
                          {trade.direction.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        {trade.entry_price} → {trade.exit_price ?? "—"}
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className={cn(
                        "text-xs font-bold font-mono",
                        (trade.pnl ?? 0) >= 0 ? "text-bullish" : "text-bearish",
                      )}>
                        {formatPnl(trade.pnl ?? 0)}
                      </div>
                      {trade.r_multiple !== null && (
                        <div className={cn(
                          "text-[9px] font-mono",
                          trade.r_multiple >= 1 ? "text-bullish" : trade.r_multiple >= 0 ? "text-neutral-wait" : "text-bearish",
                        )}>
                          {trade.r_multiple >= 0 ? "+" : ""}{trade.r_multiple.toFixed(2)}R
                        </div>
                      )}
                      <div className="text-[9px] text-muted-foreground font-mono">
                        {trade.exit_date ? new Date(trade.exit_date).toLocaleDateString() : "—"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ DATA SUMMARY ═══ */}
          <div className="vixor-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Data Summary
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-foreground">{stats.totalTrades}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Total</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-bullish">{stats.closedTrades}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Closed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-info">{openTrades.length}</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">Open</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── NEW TRADE DIALOG ── */}
      <NewTradeDialog
        open={showNewTradeDialog}
        onOpenChange={setShowNewTradeDialog}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* ── CLOSE TRADE DIALOG ── */}
      {closeTradeDialog && (
        <CloseTradeDialog
          trade={closeTradeDialog}
          open={!!closeTradeDialog}
          onOpenChange={(open) => { if (!open) setCloseTradeDialog(null); }}
          onSubmit={(exitPrice) => closeMutation.mutate({
            tradeId: closeTradeDialog.id,
            exit_price: exitPrice,
            status: "closed",
            exit_date: new Date().toISOString(),
          })}
          isLoading={closeMutation.isPending}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// NEW TRADE DIALOG
// ═══════════════════════════════════════════════

function NewTradeDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    pair: string;
    direction: TradeDirection;
    entry_price: number;
    quantity?: number | null;
    stop_loss?: number | null;
    take_profit?: number | null;
    notes?: string | null;
    strategy?: string | null;
  }) => void;
  isLoading: boolean;
}) {
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const [notes, setNotes] = useState("");
  const [strategy, setStrategy] = useState("");

  const handleSubmit = useCallback(() => {
    if (!entryPrice || !pair) return;
    onSubmit({
      pair,
      direction,
      entry_price: parseFloat(entryPrice),
      quantity: quantity ? parseFloat(quantity) : null,
      stop_loss: stopLoss ? parseFloat(stopLoss) : null,
      take_profit: takeProfit ? parseFloat(takeProfit) : null,
      notes: notes || null,
      strategy: strategy || null,
    });
  }, [pair, direction, entryPrice, quantity, stopLoss, takeProfit, notes, strategy, onSubmit]);

  // Reset form when dialog opens
  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (nextOpen) {
      setPair("XAUUSD");
      setDirection("long");
      setEntryPrice("");
      setQuantity("");
      setStopLoss("");
      setTakeProfit("");
      setNotes("");
      setStrategy("");
    }
    onOpenChange(nextOpen);
  }, [onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="size-4 text-primary" />
            New Trade
          </DialogTitle>
          <DialogDescription>
            Log a new trade entry. You can close it later from the open positions list.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Pair */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Pair</label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Direction</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDirection("long")}
                className={cn(
                  "h-10 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors",
                  direction === "long"
                    ? "bg-bullish/15 border-bullish/40 text-bullish"
                    : "bg-card-hover border-border text-muted-foreground hover:border-bullish/30",
                )}
              >
                <ArrowUpRight className="size-3.5" />
                Long
              </button>
              <button
                onClick={() => setDirection("short")}
                className={cn(
                  "h-10 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-colors",
                  direction === "short"
                    ? "bg-bearish/15 border-bearish/40 text-bearish"
                    : "bg-card-hover border-border text-muted-foreground hover:border-bearish/30",
                )}
              >
                <ArrowDownRight className="size-3.5" />
                Short
              </button>
            </div>
          </div>

          {/* Entry Price & Quantity */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Entry Price *</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Quantity</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="1"
                className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* SL & TP */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Stop Loss</label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="—"
                className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Take Profit</label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="—"
                className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Strategy</label>
            <input
              type="text"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="e.g., Breakout, Mean Reversion"
              maxLength={100}
              className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Trade rationale, observations..."
              rows={2}
              maxLength={5000}
              className="w-full px-3 py-2 bg-card-hover border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={!entryPrice || isLoading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              entryPrice && !isLoading
                ? "gradient-primary text-primary-foreground glow-primary active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5" />
            )}
            Open Trade
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// CLOSE TRADE DIALOG
// ═══════════════════════════════════════════════

function CloseTradeDialog({
  trade,
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: {
  trade: Trade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (exitPrice: number) => void;
  isLoading: boolean;
}) {
  const [exitPrice, setExitPrice] = useState(trade.exit_price?.toString() ?? "");

  const handleSubmit = useCallback(() => {
    if (!exitPrice) return;
    onSubmit(parseFloat(exitPrice));
  }, [exitPrice, onSubmit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <X className="size-4 text-bearish" />
            Close Trade
          </DialogTitle>
          <DialogDescription>
            Close {trade.pair} {trade.direction} position entered at {trade.entry_price}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Trade summary */}
          <div className="vixor-card p-3 flex items-center gap-3">
            <div className={cn(
              "size-8 rounded-lg flex items-center justify-center shrink-0",
              trade.direction === "long" ? "bg-bullish/10" : "bg-bearish/10",
            )}>
              {trade.direction === "long" ? (
                <ArrowUpRight className="size-4 text-bullish" />
              ) : (
                <ArrowDownRight className="size-4 text-bearish" />
              )}
            </div>
            <div>
              <div className="text-xs font-bold font-mono">{trade.pair} · {trade.direction.toUpperCase()}</div>
              <div className="text-[10px] text-muted-foreground font-mono">
                Entry: {trade.entry_price}
                {trade.stop_loss && ` · SL: ${trade.stop_loss}`}
                {trade.take_profit && ` · TP: ${trade.take_profit}`}
              </div>
            </div>
          </div>

          {/* Exit price */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">Exit Price *</label>
            <input
              type="number"
              step="any"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleSubmit}
            disabled={!exitPrice || isLoading}
            className={cn(
              "flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all",
              exitPrice && !isLoading
                ? "bg-bearish/20 text-bearish border border-bearish/40 hover:bg-bearish/30 active:scale-95"
                : "bg-muted text-muted-foreground cursor-not-allowed",
            )}
          >
            {isLoading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <X className="size-3.5" />
            )}
            Close Trade
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function formatPnl(value: number): string {
  const prefix = value >= 0 ? "+" : "";
  return `${prefix}$${Math.abs(value).toFixed(2)}`;
}

function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${Math.round(hours * 10) / 10}h`;
  const days = Math.round((hours / 24) * 10) / 10;
  return `${days}d`;
}

function getBestDay(days: { day: string; winRate: number }[]): string {
  if (days.length === 0) return "—";
  const best = days.reduce((a, b) => (a.winRate > b.winRate ? a : b));
  return best.day;
}
