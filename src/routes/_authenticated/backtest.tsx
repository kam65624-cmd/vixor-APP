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
import type { BacktestResult } from "@/domains/backtest/engine/types";

export const Route = createFileRoute("/_authenticated/backtest")({
  head: () => ({ meta: [{ title: "Backtest — Vixor" }] }),
  component: BacktestPage,
});

// ── Axiom Design System ──
const S = {
  bg: "#0A0E1A",
  card: "#111827",
  cardBorder: "1px solid rgba(255,255,255,0.06)",
  divider: "1px solid rgba(255,255,255,0.06)",
  text1: "#F0F4FC",
  text2: "#7B8BA8",
  text3: "#4A5568",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  bullish: "#22C55E",
  bearish: "#EF4444",
  warning: "#F59E0B",
  font: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  radius: 8,
  badgeRadius: 6,
} as const;

const cardStyle: React.CSSProperties = {
  background: S.card,
  border: S.cardBorder,
  borderRadius: S.radius,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  fontWeight: 700,
  color: S.text2,
  marginBottom: 6,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  background: S.card,
  border: S.cardBorder,
  color: S.text1,
  borderRadius: S.badgeRadius,
  height: 36,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 14,
  fontFamily: S.mono,
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

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
          commission: form.commission / 100,
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
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24, fontFamily: S.font }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.accent, marginBottom: 2 }}>
              {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text1, margin: 0, letterSpacing: "-0.02em" }}>
              {t("backtest.title") || "Backtest"}
            </h1>
          </div>
        </div>
        <div style={{ ...cardStyle, border: S.cardBorder, padding: 24, textAlign: "center" }}>
          <Loader2 style={{ width: 24, height: 24, color: S.accent, animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 14, color: S.text2 }}>{t("common.loading") || "Loading..."}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24, fontFamily: S.font }}>
      {/* Header + Points Balance */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.accent, marginBottom: 2 }}>
            {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text1, margin: 0, letterSpacing: "-0.02em" }}>{t("backtest.title") || "Backtest"}</h1>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: S.badgeRadius,
          fontSize: 12, fontWeight: 700,
          background: hasEnoughPoints ? "rgba(59,130,246,0.15)" : "rgba(239,68,68,0.1)",
          color: hasEnoughPoints ? S.accentLight : S.bearish,
        }}>
          <Coins style={{ width: 14, height: 14 }} />
          <span>{pointsBalance}</span>
          <span style={{ color: S.text2, fontWeight: 400 }}>{t("common.points") || "pts"}</span>
        </div>
      </div>

      {/* Configuration Card */}
      <div style={{ ...cardStyle, border: S.cardBorder, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <FlaskConical style={{ width: 16, height: 16, color: S.accent }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>
            {t("backtest.configuration") || "Configuration"}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
          {/* Pair */}
          <div>
            <label style={labelStyle}>{t("backtest.tradingPair") || "Trading Pair"}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {PAIRS.slice(0, 5).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setForm((f) => ({ ...f, pair }))}
                  style={{
                    padding: "0 10px", height: 28, borderRadius: S.badgeRadius, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: form.pair === pair ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    color: form.pair === pair ? S.accentLight : S.text2,
                    border: form.pair === pair ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {pair}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
              {PAIRS.slice(5).map((pair) => (
                <button
                  key={pair}
                  onClick={() => setForm((f) => ({ ...f, pair }))}
                  style={{
                    padding: "0 10px", height: 28, borderRadius: S.badgeRadius, fontSize: 11, fontWeight: 700, cursor: "pointer",
                    background: form.pair === pair ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    color: form.pair === pair ? S.accentLight : S.text2,
                    border: form.pair === pair ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {pair}
                </button>
              ))}
            </div>
          </div>

          {/* Timeframe */}
          <div>
            <label style={labelStyle}>{t("backtest.timeframe") || "Timeframe"}</label>
            <div style={{ display: "flex", gap: 6 }}>
              {TIMEFRAMES.map((tf) => (
                <button
                  key={tf}
                  onClick={() => setForm((f) => ({ ...f, timeframe: tf }))}
                  style={{
                    flex: 1, height: 28, borderRadius: S.badgeRadius, fontSize: 11, fontWeight: 700,
                    border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                    background: form.timeframe === tf ? "rgba(59,130,246,0.15)" : S.card,
                    borderColor: form.timeframe === tf ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                    color: form.timeframe === tf ? S.accentLight : S.text2,
                  }}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label style={labelStyle}>{t("backtest.strategy") || "Strategy"}</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STRATEGY_PRESETS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setForm((f) => ({ ...f, strategy: s.id }))}
                  style={{
                    padding: "0 10px", height: 28, borderRadius: S.badgeRadius, fontSize: 11, fontWeight: 700,
                    border: "1px solid", cursor: "pointer",
                    background: form.strategy === s.id ? "rgba(59,130,246,0.15)" : S.card,
                    borderColor: form.strategy === s.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                    color: form.strategy === s.id ? S.accentLight : S.text2,
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Capital + Risk */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            <div>
              <label style={labelStyle}>{t("backtest.initialCapital") || "Initial Capital ($)"}</label>
              <input
                type="number"
                value={form.initialCapital}
                onChange={(e) => setForm((f) => ({ ...f, initialCapital: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t("backtest.risk") || "Risk (%)"}</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="10"
                value={form.riskPercent}
                onChange={(e) => setForm((f) => ({ ...f, riskPercent: Number(e.target.value) }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Date range */}
          <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
            <div>
              <label style={labelStyle}>{t("backtest.startDate") || "Start Date"}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>{t("backtest.endDate") || "End Date"}</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* Cost warning if low balance */}
        {!hasEnoughPoints && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: S.badgeRadius, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <AlertTriangle style={{ width: 16, height: 16, color: S.bearish, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: S.bearish }}>
              {t("backtest.needMorePoints") ||
                `You need ${BACKTEST_COST} points. You have ${pointsBalance}.`}
            </span>
            <a
              href="/premium"
              style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: S.accent, whiteSpace: "nowrap", textDecoration: "none" }}
            >
              {t("premium.getPoints") || "Get Points"}
            </a>
          </div>
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={running || !hasEnoughPoints}
          style={{
            width: "100%", height: 44, borderRadius: S.radius, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            border: "none", cursor: "pointer", opacity: (running || !hasEnoughPoints) ? 0.5 : 1,
            background: hasEnoughPoints ? S.accent : S.text3,
            color: hasEnoughPoints ? "#fff" : S.text2,
            fontFamily: S.font, fontSize: 14,
          }}
        >
          {running ? (
            <>
              <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
              {t("backtest.running") || "Running Backtest..."}
            </>
          ) : (
            <>
              <Play style={{ width: 16, height: 16 }} />
              <span>{t("backtest.runBacktest") || "Run Backtest"}</span>
              <span style={{ fontSize: 12, opacity: 0.75 }}>(-{BACKTEST_COST} pts)</span>
            </>
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ ...cardStyle, borderLeft: "4px solid " + S.bearish, padding: 12 }}>
          <div style={{ fontSize: 12, color: S.bearish }}>{error}</div>
        </div>
      )}

      {/* Results */}
      {result && (
        <>
          {/* Points spent feedback */}
          <div style={{ ...cardStyle, border: S.cardBorder, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: S.text2 }}>
              <Coins style={{ width: 14, height: 14, color: S.accent }} />
              <span>
                -{BACKTEST_COST} {t("common.points") || "pts"}
              </span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: S.accent }}>
              {(result as any).remainingBalance ?? pointsBalance - BACKTEST_COST}{" "}
              {t("common.points") || "pts"} {t("common.remaining") || "remaining"}
            </div>
          </div>

          {/* Metrics Grid */}
          <div style={{ ...cardStyle, border: S.cardBorder, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BarChart3 style={{ width: 16, height: 16, color: S.accent }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>{t("backtest.results") || "Results"}</span>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.text3, marginLeft: "auto", fontFamily: S.mono }}>
                {form.pair} · {form.timeframe}
              </span>
            </div>

            {/* Key metrics */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <MetricCard
                icon={<TrendingUp style={{ width: 16, height: 16, color: S.bullish }} />}
                label={t("backtest.totalPnl") || "Total P&L"}
                value={`$${result.finalEquity.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                sub={`${result.metrics.totalReturn > 0 ? "+" : ""}${result.metrics.totalReturn}%`}
                positive={result.metrics.totalReturn > 0}
              />
              <MetricCard
                icon={<Target style={{ width: 16, height: 16, color: S.accent }} />}
                label={t("backtest.winRate") || "Win Rate"}
                value={`${result.metrics.winRate}%`}
                sub={`${result.metrics.winningTrades}W / ${result.metrics.losingTrades}L`}
                positive={result.metrics.winRate > 50}
              />
              <MetricCard
                icon={<Shield style={{ width: 16, height: 16, color: S.bearish }} />}
                label={t("backtest.maxDrawdown") || "Max Drawdown"}
                value={`${result.metrics.maxDrawdown}%`}
                sub={`$${result.metrics.maxDrawdownAbs.toLocaleString()}`}
                positive={false}
              />
              <MetricCard
                icon={<Activity style={{ width: 16, height: 16, color: S.accent }} />}
                label={t("backtest.sharpeRatio") || "Sharpe Ratio"}
                value={result.metrics.sharpe.toFixed(2)}
                sub={`Sortino: ${result.metrics.sortino.toFixed(2)}`}
                positive={result.metrics.sharpe > 1}
              />
            </div>

            {/* Additional stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 8 }}>
              {[
                { label: t("backtest.profitFactor") || "Profit Factor", value: String(result.metrics.profitFactor), color: S.text1 },
                { label: t("backtest.totalTrades") || "Total Trades", value: String(result.metrics.totalTrades), color: S.text1 },
                { label: t("backtest.expectancy") || "Expectancy", value: `$${result.metrics.expectancy}`, color: S.text1 },
                { label: t("backtest.avgWin") || "Avg Win", value: `$${result.metrics.avgWin}`, color: S.bullish },
                { label: t("backtest.avgLoss") || "Avg Loss", value: `$${result.metrics.avgLoss}`, color: S.bearish },
                { label: t("backtest.cagr") || "CAGR", value: `${result.metrics.cagr}%`, color: S.text1 },
              ].map((stat) => (
                <div key={stat.label} style={{ padding: 8, borderRadius: S.badgeRadius, background: S.bg }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: S.text2, fontWeight: 700 }}>
                    {stat.label}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, fontFamily: S.mono, color: stat.color }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Equity Curve (simplified SVG) */}
          <div style={{ ...cardStyle, border: S.cardBorder, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <TrendingUp style={{ width: 16, height: 16, color: S.accent }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>
                {t("backtest.equityCurve") || "Equity Curve"}
              </span>
            </div>
            <div style={{ width: "100%", height: 192, borderRadius: S.radius, background: S.bg, overflow: "hidden", position: "relative" }}>
              <svg
                viewBox={`0 0 ${result.equityCurve.length * 4} 192`}
                style={{ width: "100%", height: "100%" }}
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
                    stroke={S.text3}
                    strokeOpacity={0.2}
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
                          <stop offset="0%" stopColor={S.accent} stopOpacity={0.3} />
                          <stop offset="100%" stopColor={S.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <path d={`${pathD} L${w},192 L0,192 Z`} fill="url(#eqGrad)" />
                      <path d={pathD} fill="none" stroke={S.accent} strokeWidth={2} />
                    </>
                  );
                })()}
              </svg>
              {/* Y-axis labels */}
              <div style={{ position: "absolute", top: 8, left: 8, fontSize: 9, fontFamily: S.mono, color: S.text3 }}>
                $
                {Math.max(...result.equityCurve.map((p) => p.equity)).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
              <div style={{ position: "absolute", bottom: 8, left: 8, fontSize: 9, fontFamily: S.mono, color: S.text3 }}>
                $
                {Math.min(...result.equityCurve.map((p) => p.equity)).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </div>
            </div>
          </div>

          {/* Trade List */}
          {result.trades.length > 0 && (
            <div style={{ ...cardStyle, border: S.cardBorder, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShoppingBag style={{ width: 16, height: 16, color: S.accent }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>{t("backtest.tradeList") || "Trade List"}</span>
                <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.text3, marginLeft: "auto", fontFamily: S.mono }}>
                  {result.trades.length} trades
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 288, overflowY: "auto" }}>
                {result.trades.map((trade, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                      borderRadius: S.badgeRadius, background: S.bg, fontSize: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, width: 20, textAlign: "center", color: trade.netPnl >= 0 ? S.bullish : S.bearish, fontFamily: S.mono }}>
                      {trade.netPnl >= 0 ? "+" : ""}
                    </span>
                    <span style={{ fontWeight: 700, fontFamily: S.mono, width: 56, textAlign: "right", color: S.text1 }}>
                      ${Math.abs(trade.netPnl).toFixed(0)}
                    </span>
                    <span style={{ color: S.text2, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {trade.tag || trade.exitReason || `#${i + 1}`}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: S.mono, color: S.text3 }}>
                      {trade.durationBars}bars
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      color: trade.netPnl >= 0 ? S.bullish : S.bearish,
                      fontFamily: S.mono,
                    }}>
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
    <div style={{ padding: 12, borderRadius: S.radius, background: S.bg, border: S.cardBorder }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        {icon}
        <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: S.text2, fontWeight: 700 }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, fontFamily: S.mono, color: positive ? S.bullish : S.bearish }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: S.text2 }}>{sub}</div>
    </div>
  );
}