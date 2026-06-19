import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/domains/user/functions";
import { runBacktestServer } from "@/domains/backtest/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { useState, useMemo } from "react";
import {
  FlaskConical,
  Play,
  Loader2,
  TrendingUp,
  TrendingDown,
  Shield,
  Target,
  BarChart3,
  Activity,
  Coins,
  AlertTriangle,
  ShoppingBag,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  BacktestResult,
} from "@/domains/backtest/engine/types";

export const Route = createFileRoute("/_authenticated/backtest")({
  head: () => ({ meta: [{ title: "Backtest — Vixor" }] }),
  component: BacktestPage,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BACKTEST_COST = 10;

const PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "XAU/USD",
  "EUR/USD",
  "GBP/JPY",
  "SOL/USDT",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "BNB/USDT",
];

const TIMEFRAMES = ["5M", "15M", "1H", "4H", "1D"];

const STRATEGY_PRESETS = [
  { id: "sma_crossover", label: "SMA Crossover" },
  { id: "rsi_reversal", label: "RSI Reversal" },
  { id: "breakout", label: "Breakout" },
  { id: "macd_momentum", label: "MACD Momentum" },
];

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface BacktestFormState {
  pair: string;
  timeframe: string;
  strategy: string;
  initialCapital: number;
  riskPercent: number;
  startDate: string;
  endDate: string;
  commission: number;
  slippage: number;
}

const defaultForm: BacktestFormState = {
  pair: "BTC/USDT",
  timeframe: "1H",
  strategy: "sma_crossover",
  initialCapital: 100_000,
  riskPercent: 2,
  startDate: "2024-01-01",
  endDate: "2024-12-31",
  commission: 0.1,
  slippage: 0.05,
};

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function BacktestPage() {
  const { t } = useI18n();
  const fetchMe = useStableServerFn(getMe);
  const runBacktest = useStableServerFn(runBacktestServer);

  const me = useQuery(
    useMemo(
      () => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}), staleTime: 30_000 }),
      [fetchMe],
    ),
  );

  const pointsBalance = me.data?.balance?.balance ?? 0;
  const hasEnoughPoints = pointsBalance >= BACKTEST_COST;

  const [form, setForm] = useState<BacktestFormState>(defaultForm);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const data = await runBacktest({
        data: {
          pair: form.pair,
          timeframe: form.timeframe,
          strategyPreset: form.strategy,
          initialCapital: form.initialCapital,
          riskPercent: form.riskPercent,
          startDate: form.startDate || undefined,
          endDate: form.endDate || undefined,
          commission: form.commission / 100, // UI uses percentage, backend uses fraction
          slippage: form.slippage / 100,
        },
      });
      setResult(data);
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("backtest.failed") || "Backtest failed";
      if (msg.startsWith("INSUFFICIENT_POINTS:")) {
        setError(t("backtest.insufficientPoints") || "Insufficient points to run this backtest.");
      } else {
        setError(msg);
      }
    } finally {
      setRunning(false);
    }
  };

  // Show loading
  if (me.isLoading) {
    return (
      <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t("backtest.title") || "Backtest"}</h1>
          </div>
        </div>
        <div className="vixor-card p-6 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted-foreground">{t("common.loading") || "Loading..."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header + Points Balance */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("backtest.title") || "Backtest"}</h1>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${hasEnoughPoints ? "bg-primary/10 text-primary" : "bg-bearish/10 text-bearish"}`}>
          <Coins className="size-3.5" />
          <span>{pointsBalance}</span>
          <span className="text-muted-foreground font-normal">{t("common.points") || "pts"}</span>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="vixor-card p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <FlaskConical className="size-4 text-primary" />
          <span className="text-sm font-bold">{t("backtest.configuration") || "Configuration"}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Pair */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              {t("backtest.tradingPair") || "Trading Pair"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAIRS.slice(0, 5).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setForm((f) => ({ ...f, pair }))}
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    form.pair === pair
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {PAIRS.slice(5).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setForm((f) => ({ ...f, pair }))}
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                    form.pair === pair
                      ? "bg-primary/10 text-primary border border-primary/30"
                      : "bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              {t("backtest.timeframe") || "Timeframe"}
            </label>
            <div className="flex gap-1.5">
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setForm((f) => ({ ...f, timeframe: tf }))}
                  className={`flex-1 h-7 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center ${
                    form.timeframe === tf
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              {t("backtest.strategy") || "Strategy"}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STRATEGY_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setForm((f) => ({ ...f, strategy: s.id }))}
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all border ${
                    form.strategy === s.id
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capital + Risk */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                {t("backtest.initialCapital") || "Initial Capital ($)"}
              </label>
              <input
                type="number"
                value={form.initialCapital}
                onChange={(e) => setForm((f) => ({ ...f, initialCapital: Number(e.target.value) }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                {t("backtest.risk") || "Risk (%)"}
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={form.riskPercent}
                onChange={(e) => setForm((f) => ({ ...f, riskPercent: Number(e.target.value) }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Date range */}
          <div className="col-span-2 grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                {t("backtest.startDate") || "Start Date"}
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                {t("backtest.endDate") || "End Date"}
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Cost warning if low balance */}
        {!hasEnoughPoints && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-bearish/5 border border-bearish/20">
            <AlertTriangle className="size-4 text-bearish shrink-0" />
            <span className="text-xs text-bearish">
              {t("backtest.needMorePoints") || `You need ${BACKTEST_COST} points. You have ${pointsBalance}.`}
            </span>
            <a href="/premium" className="ml-auto text-[10px] font-bold text-primary whitespace-nowrap">
              {t("premium.getPoints") || "Get Points"}
            </a>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || !hasEnoughPoints}
          className={`w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform disabled:opacity-50 ${hasEnoughPoints ? "gradient-primary text-primary-foreground glow-primary hover:scale-[1.02] active:scale-95" : "bg-muted text-muted-foreground"}`}
        >
          {running ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              {t("backtest.running") || "Running Backtest..."}
            </>
          ) : (
            <>
              <Play className="size-4" />
              <span>{t("backtest.runBacktest") || "Run Backtest"}</span>
              <span className="text-xs opacity-75">(-{BACKTEST_COST} pts)</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="vixor-card p-3 border-l-4 border-l-bearish">
          <div className="text-xs text-bearish">{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Points spent feedback */}
          <div className="vixor-card p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Coins className="size-3.5 text-primary" />
              <span>-{BACKTEST_COST} {t("common.points") || "pts"}</span>
            </div>
            <div className="text-xs font-bold text-primary">
              {(result as any).remainingBalance ?? pointsBalance - BACKTEST_COST} {t("common.points") || "pts"} {t("common.remaining") || "remaining"}
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="vixor-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="size-4 text-primary" />
              <span className="text-sm font-bold">{t("backtest.results") || "Results"}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-auto">
                {form.pair} · {form.timeframe}
              </span>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <MetricCard
                icon={<TrendingUp className="size-4 text-bullish" />}
                label={t("backtest.totalPnl") || "Total P&L"}
                value={`$${result.finalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub={`${result.metrics.totalReturn > 0 ? "+" : ""}${result.metrics.totalReturn}%`}
                positive={result.metrics.totalReturn > 0}
              />
              <MetricCard
                icon={<Target className="size-4 text-primary" />}
                label={t("backtest.winRate") || "Win Rate"}
                value={`${result.metrics.winRate}%`}
                sub={`${result.metrics.winningTrades}W / ${result.metrics.losingTrades}L`}
                positive={result.metrics.winRate > 50}
              />
              <MetricCard
                icon={<Shield className="size-4 text-bearish" />}
                label={t("backtest.maxDrawdown") || "Max Drawdown"}
                value={`${result.metrics.maxDrawdown}%`}
                sub={`$${result.metrics.maxDrawdownAbs.toLocaleString()}`}
                positive={false}
              />
              <MetricCard
                icon={<Activity className="size-4 text-primary" />}
                label={t("backtest.sharpeRatio") || "Sharpe Ratio"}
                value={result.metrics.sharpe.toFixed(2)}
                sub={`Sortino: ${result.metrics.sortino.toFixed(2)}`}
                positive={result.metrics.sharpe > 1}
              />
            </div>

            {/* Additional stats */}
            <div className="grid grid-cols-3 gap-3 mt-2">
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.profitFactor") || "Profit Factor"}
                </div>
                <div className="text-sm font-bold font-mono">{result.metrics.profitFactor}</div>
              </div>
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.totalTrades") || "Total Trades"}
                </div>
                <div className="text-sm font-bold font-mono">{result.metrics.totalTrades}</div>
              </div>
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.expectancy") || "Expectancy"}
                </div>
                <div className="text-sm font-bold font-mono">${result.metrics.expectancy}</div>
              </div>
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.avgWin") || "Avg Win"}
                </div>
                <div className="text-sm font-bold font-mono text-bullish">
                  ${result.metrics.avgWin}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.avgLoss") || "Avg Loss"}
                </div>
                <div className="text-sm font-bold font-mono text-bearish">
                  ${result.metrics.avgLoss}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-background">
                <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                  {t("backtest.cagr") || "CAGR"}
                </div>
                <div className="text-sm font-bold font-mono">{result.metrics.cagr}%</div>
              </div>
            </div>
          </div>

          {/* Equity Curve (simplified SVG) */}
          <div className="vixor-card p-4 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              <span className="text-sm font-bold">{t("backtest.equityCurve") || "Equity Curve"}</span>
            </div>
            <div className="w-full h-48 rounded-xl bg-background overflow-hidden relative">
              <svg
                viewBox={`0 0 ${result.equityCurve.length * 4} 192`}
                className="w-full h-full"
                preserveAspectRatio="none"
              >
                {/* Grid lines */}
                {[0, 1, 2, 3].map((i) => (
                  <line
                    key={i}
                    x1={0}
                    y1={i * 48}
                    x2={result.equityCurve.length * 4}
                    y2={i * 48}
                    stroke="currentColor"
                    className="text-muted-foreground/10"
                    strokeWidth={1}
                  />
                ))}
                {/* Area fill */}
                {(() => {
                  const pts = result.equityCurve;
                  const minEq = Math.min(...pts.map((p) => p.equity));
                  const maxEq = Math.max(...pts.map((p) => p.equity));
                  const range = maxEq - minEq || 1;
                  const w = pts.length * 4;
                  const pathD = pts
                    .map((p, i) => {
                      const x = i * 4;
                      const y = 184 - ((p.equity - minEq) / range) * 176;
                      return `${i === 0 ? "M" : "L"}${x},${y}`;
                    })
                    .join(" ");
                  return (
                    <>
                      <defs>
                        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <path
                        d={`${pathD} L${w},192 L0,192 Z`}
                        fill="url(#eqGrad)"
                      />
                      <path d={pathD} fill="none" stroke="currentColor" className="text-primary" strokeWidth={2} />
                    </>
                  );
                })()}
              </svg>
              {/* Y-axis labels */}
              <div className="absolute top-2 left-2 text-[9px] font-mono text-muted-foreground">
                ${Math.max(...result.equityCurve.map((p) => p.equity)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              <div className="absolute bottom-2 left-2 text-[9px] font-mono text-muted-foreground">
                ${Math.min(...result.equityCurve.map((p) => p.equity)).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Trade List */}
          {result.trades.length > 0 && (
            <div className="vixor-card p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-primary" />
                <span className="text-sm font-bold">{t("backtest.tradeList") || "Trade List"}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-auto">
                  {result.trades.length} trades
                </span>
              </div>
              <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-hide">
                {result.trades.map((trade, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background text-xs"
                  >
                    <span className={`font-bold w-5 text-center ${trade.netPnl >= 0 ? "text-bullish" : "text-bearish"}`}>
                      {trade.netPnl >= 0 ? "+" : ""}
                    </span>
                    <span className="font-bold font-mono w-14 text-right">
                      ${Math.abs(trade.netPnl).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground flex-1 truncate">
                      {trade.tag || trade.exitReason || `#${i + 1}`}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {trade.durationBars}bars
                    </span>
                    <span className={`text-[10px] font-bold ${trade.netPnl >= 0 ? "text-bullish" : "text-bearish"}`}>
                      {trade.rMultiple?.toFixed(1) || "—"}R
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Metric Card
// ---------------------------------------------------------------------------

function MetricCard({
  icon,
  label,
  value,
  sub,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  positive: boolean;
}) {
  return (
    <div className="p-3 rounded-xl bg-background border border-border">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
          {label}
        </span>
      </div>
      <div className={`text-lg font-bold font-mono ${positive ? "text-bullish" : "text-bearish"}`}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{sub}</div>
    </div>
  );
}
