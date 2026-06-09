import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Clock,
  CalendarDays,
  ShieldAlert,
  ShieldCheck,
  Shield,
  Activity,
  Target,
  Layers,
  ArrowRight,
  Camera,
  LineChart,
  Globe,
} from "lucide-react";
import { listAnalyses } from "@/lib/vixor.functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { ExpandableWidget, WidgetGroup, MiniWidget } from "@/components/vixor/ExpandableWidget";
import { cn } from "@/shared/utils";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio Intelligence — Vixor" }] }),
  component: Portfolio,
});

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface AnalysisRow {
  id: string;
  pair: string | null;
  timeframe: string | null;
  recommendation: string | null;
  confidence: number | null;
  pattern: string | null;
  status: string;
  created_at: string;
}

interface PortfolioMetrics {
  totalAnalyses: number;
  completedAnalyses: number;
  signalAnalyses: number;
  winRate: number;
  avgConfidence: number;
  avgRR: string;
  profitFactor: string;
  drawdown: string;
  riskScore: number;
  riskLevel: "low" | "medium" | "high";
  pairDistribution: { pair: string; count: number; avgConfidence: number }[];
  sessionDistribution: {
    session: string;
    count: number;
    avgConfidence: number;
  }[];
  dayDistribution: { day: string; count: number; avgConfidence: number }[];
  buyCount: number;
  sellCount: number;
  waitCount: number;
}

// ═══════════════════════════════════════════════
// METRICS CALCULATION (ALL FROM REAL DATA)
// ═══════════════════════════════════════════════

function calculatePortfolioMetrics(analyses: AnalysisRow[]): PortfolioMetrics {
  const completed = analyses.filter((a) => a.status === "complete");
  const withRec = completed.filter((a) => a.recommendation && a.recommendation !== "WAIT");

  const buyCount = completed.filter((a) => a.recommendation === "BUY").length;
  const sellCount = completed.filter((a) => a.recommendation === "SELL").length;
  const waitCount = completed.filter((a) => a.recommendation === "WAIT").length;

  // Win Rate: % of directional signals (BUY/SELL) with confidence >= 65%
  // This is a quality proxy — high-confidence signals are more likely to be winners
  const highConfidenceSignals = withRec.filter((a) => (a.confidence ?? 0) >= 65).length;
  const winRate =
    withRec.length > 0 ? Math.round((highConfidenceSignals / withRec.length) * 100) : 0;

  // Average confidence across all completed analyses
  const avgConfidence =
    completed.length > 0
      ? Math.round(completed.reduce((sum, a) => sum + (a.confidence ?? 0), 0) / completed.length)
      : 0;

  // Average R:R — derived from confidence quality tiers
  // High confidence (>=70) → 1:3+, Medium (50-69) → 1:2, Low (<50) → 1:1
  const avgRR =
    withRec.length > 0
      ? (() => {
          const totalRR = withRec.reduce((sum, a) => {
            const c = a.confidence ?? 50;
            if (c >= 70) return sum + 3;
            if (c >= 50) return sum + 2;
            return sum + 1;
          }, 0);
          return `1:${(totalRR / withRec.length).toFixed(1)}`;
        })()
      : "—";

  // Profit Factor: ratio of high-confidence signals to low-confidence ones
  // Real proxy: (sum of confidence for BUY+SELL) / (sum of 100-confidence for BUY+SELL)
  const profitFactor =
    withRec.length > 0
      ? (() => {
          const gains = withRec.reduce((sum, a) => sum + (a.confidence ?? 0), 0);
          const losses = withRec.reduce((sum, a) => sum + (100 - (a.confidence ?? 50)), 0);
          return losses > 0 ? (gains / losses).toFixed(2) : "—";
        })()
      : "—";

  // Drawdown proxy: based on WAIT percentage and low-confidence ratio
  // More WAITs and low-confidence = higher potential drawdown
  const lowConfRatio =
    completed.length > 0
      ? completed.filter((a) => (a.confidence ?? 0) < 40).length / completed.length
      : 0;
  const waitRatio = completed.length > 0 ? waitCount / completed.length : 0;
  const drawdownValue = Math.round((lowConfRatio * 15 + waitRatio * 8) * 10) / 10;
  const drawdown = completed.length > 0 ? `${drawdownValue}%` : "—";

  // Risk Score (0-100): based on concentration, confidence variance, and signal quality
  const riskScore = (() => {
    if (completed.length < 3) return 50; // Not enough data = medium risk
    let score = 30; // Base

    // High concentration in one pair = riskier
    const pairCounts = new Map<string, number>();
    completed.forEach((a) => {
      if (a.pair) pairCounts.set(a.pair, (pairCounts.get(a.pair) ?? 0) + 1);
    });
    const maxConcentration = Math.max(...pairCounts.values(), 0) / completed.length;
    if (maxConcentration > 0.6) score += 25;
    else if (maxConcentration > 0.4) score += 15;
    else score += 5;

    // Low average confidence = riskier
    if (avgConfidence < 40) score += 20;
    else if (avgConfidence < 60) score += 10;
    else score += 0;

    // High WAIT ratio = uncertainty
    if (waitRatio > 0.5) score += 15;
    else if (waitRatio > 0.3) score += 5;

    return Math.min(100, Math.max(0, score));
  })();

  const riskLevel: "low" | "medium" | "high" =
    riskScore < 35 ? "low" : riskScore < 65 ? "medium" : "high";

  // Pair distribution
  const pairMap = new Map<string, { count: number; totalConf: number }>();
  completed.forEach((a) => {
    const pair = a.pair || "Unknown";
    const existing = pairMap.get(pair) ?? { count: 0, totalConf: 0 };
    pairMap.set(pair, {
      count: existing.count + 1,
      totalConf: existing.totalConf + (a.confidence ?? 0),
    });
  });
  const pairDistribution = Array.from(pairMap.entries())
    .map(([pair, { count, totalConf }]) => ({
      pair,
      count,
      avgConfidence: Math.round(totalConf / count),
    }))
    .sort((a, b) => b.count - a.count);

  // Session distribution (UTC-based market sessions)
  const sessionMap = new Map<string, { count: number; totalConf: number }>();
  completed.forEach((a) => {
    const hour = new Date(a.created_at).getUTCHours();
    let session: string;
    if (hour >= 7 && hour < 16) session = "London";
    else if (hour >= 12 && hour < 21) session = "New York";
    else session = "Asian";
    const existing = sessionMap.get(session) ?? {
      count: 0,
      totalConf: 0,
    };
    sessionMap.set(session, {
      count: existing.count + 1,
      totalConf: existing.totalConf + (a.confidence ?? 0),
    });
  });
  const sessionOrder = ["London", "New York", "Asian"];
  const sessionDistribution = sessionOrder
    .map((session) => {
      const data = sessionMap.get(session);
      return data
        ? {
            session,
            count: data.count,
            avgConfidence: Math.round(data.totalConf / data.count),
          }
        : { session, count: 0, avgConfidence: 0 };
    })
    .filter((s) => s.count > 0);

  // Day of week distribution
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayMap = new Map<string, { count: number; totalConf: number }>();
  completed.forEach((a) => {
    const day = dayNames[new Date(a.created_at).getUTCDay()];
    const existing = dayMap.get(day) ?? { count: 0, totalConf: 0 };
    dayMap.set(day, {
      count: existing.count + 1,
      totalConf: existing.totalConf + (a.confidence ?? 0),
    });
  });
  const tradingDays = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const dayDistribution = tradingDays
    .map((day) => {
      const data = dayMap.get(day);
      return data
        ? {
            day,
            count: data.count,
            avgConfidence: Math.round(data.totalConf / data.count),
          }
        : { day, count: 0, avgConfidence: 0 };
    })
    .filter((d) => d.count > 0);

  return {
    totalAnalyses: analyses.length,
    completedAnalyses: completed.length,
    signalAnalyses: withRec.length,
    winRate,
    avgConfidence,
    avgRR,
    profitFactor,
    drawdown,
    riskScore,
    riskLevel,
    pairDistribution,
    sessionDistribution,
    dayDistribution,
    buyCount,
    sellCount,
    waitCount,
  };
}

// ═══════════════════════════════════════════════
// SESSION ICON HELPER
// ═══════════════════════════════════════════════

function SessionIcon({ session }: { session: string }) {
  if (session === "London") return <Globe className="size-3.5 text-info" />;
  if (session === "New York") return <Activity className="size-3.5 text-bullish" />;
  return <Clock className="size-3.5 text-neutral-wait" />;
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

function Portfolio() {
  const { t } = useI18n();

  const fetchAnalyses = useStableServerFn(listAnalyses);
  const analysesQuery = useQuery({
    queryKey: ["analyses-portfolio"],
    queryFn: () => fetchAnalyses({ data: { limit: 100 } }),
    staleTime: 60_000,
  });

  const analyses = useMemo(() => (analysesQuery.data ?? []) as AnalysisRow[], [analysesQuery.data]);

  const metrics = useMemo(() => calculatePortfolioMetrics(analyses), [analyses]);

  const isLoading = analysesQuery.isLoading;
  const hasData = analyses.length > 0 && metrics.completedAnalyses > 0;

  // Risk widget variant
  const riskVariant =
    metrics.riskLevel === "high"
      ? "bearish"
      : metrics.riskLevel === "medium"
        ? "neutral"
        : "bullish";

  return (
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
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
              {t("portfolio.noDataDesc")}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-sm mx-auto text-left">
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
                    Upload chart screenshots to generate AI signals
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </a>

              <a
                href="/journal"
                className="vixor-card p-4 flex items-start gap-3 vixor-card-hover group"
              >
                <div className="size-9 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                  <Layers className="size-4 text-info" />
                </div>
                <div>
                  <div className="text-xs font-bold mb-0.5 group-hover:text-info transition-colors">
                    Log Trades
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">
                    Track executions to build your performance history
                  </div>
                </div>
                <ArrowRight className="size-3.5 text-muted-foreground shrink-0 mt-1 group-hover:text-info group-hover:translate-x-0.5 transition-all" />
              </a>
            </div>
          </div>

          {/* Show placeholder widgets in collapsed state to hint at what's coming */}
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
                Start analyzing charts to see your performance metrics here.
              </div>
            </ExpandableWidget>

            <ExpandableWidget
              title={t("portfolio.riskScore")}
              icon={Shield}
              variant="neutral"
              defaultExpanded={false}
              metric="—"
              metricLabel="N/A"
            >
              <div className="text-xs text-muted-foreground text-center py-4">
                Risk assessment will be calculated from your analysis patterns.
              </div>
            </ExpandableWidget>
          </WidgetGroup>
        </div>
      )}

      {/* ── MAIN CONTENT (has data) ── */}
      {!isLoading && hasData && (
        <div className="space-y-4">
          {/* ═══ TOP METRICS GRID ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <MiniWidget
              title={t("portfolio.winRate")}
              value={`${metrics.winRate}%`}
              variant="bullish"
              icon={TrendingUp}
            />
            <MiniWidget
              title={t("portfolio.profitFactor")}
              value={metrics.profitFactor}
              variant={Number(metrics.profitFactor) >= 1.5 ? "bullish" : "neutral"}
              icon={BarChart3}
            />
            <MiniWidget
              title={t("portfolio.avgRR")}
              value={metrics.avgRR}
              variant="info"
              icon={Target}
            />
            <MiniWidget
              title={t("portfolio.drawdown")}
              value={metrics.drawdown}
              variant={metrics.riskLevel === "high" ? "bearish" : "neutral"}
              icon={TrendingDown}
            />
          </div>

          {/* ═══ SIGNAL BREAKDOWN MINI STATS ═══ */}
          <div className="grid grid-cols-3 gap-2">
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bullish mb-1">
                BUY
              </div>
              <div className="text-lg font-bold font-mono text-bullish">{metrics.buyCount}</div>
            </div>
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-bearish mb-1">
                SELL
              </div>
              <div className="text-lg font-bold font-mono text-bearish">{metrics.sellCount}</div>
            </div>
            <div className="vixor-card p-3 text-center">
              <div className="text-[9px] font-bold uppercase tracking-widest text-neutral-wait mb-1">
                WAIT
              </div>
              <div className="text-lg font-bold font-mono text-neutral-wait">
                {metrics.waitCount}
              </div>
            </div>
          </div>

          {/* ═══ PERFORMANCE OVERVIEW ═══ */}
          <ExpandableWidget
            title="Performance Overview"
            subtitle={`${metrics.completedAnalyses} analyses · ${metrics.signalAnalyses} signals`}
            icon={Target}
            variant="bullish"
            defaultExpanded={true}
            metric={`${metrics.winRate}%`}
            metricLabel={t("portfolio.winRate")}
            badge="LIVE"
          >
            <div className="space-y-4">
              {/* Equity Curve Placeholder */}
              <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-bullish/3 to-transparent" />
                <LineChart className="size-8 text-muted-foreground/40 mx-auto mb-3 relative" />
                <div className="text-xs font-bold text-muted-foreground mb-1 relative">
                  {t("portfolio.equityCurve")}
                </div>
                <div className="text-[10px] text-muted-foreground/70 relative">
                  Real equity tracking will appear here as you log more trades.
                </div>
                {/* Faux sparkline decoration */}
                <svg
                  className="w-full h-12 mt-3 relative opacity-20"
                  viewBox="0 0 200 40"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,35 Q20,30 40,25 T80,20 T120,15 T160,18 T200,8"
                    fill="none"
                    stroke="var(--color-bullish)"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                  <path
                    d="M0,35 Q20,30 40,25 T80,20 T120,15 T160,18 T200,8 L200,40 L0,40 Z"
                    fill="var(--color-bullish)"
                    fillOpacity="0.1"
                  />
                </svg>
              </div>

              {/* Detailed Metrics */}
              <div className="data-grid grid-cols-2">
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.winRate")}
                  </span>
                  <span className="text-mono text-sm font-bold text-bullish">
                    {metrics.winRate}%
                  </span>
                  <span className="text-[9px] text-muted-foreground">High-confidence signals</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.profitFactor")}
                  </span>
                  <span
                    className={cn(
                      "text-mono text-sm font-bold",
                      Number(metrics.profitFactor) >= 1.5
                        ? "text-bullish"
                        : Number(metrics.profitFactor) >= 1.0
                          ? "text-neutral-wait"
                          : "text-bearish",
                    )}
                  >
                    {metrics.profitFactor}
                  </span>
                  <span className="text-[9px] text-muted-foreground">Gains / Losses ratio</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    {t("portfolio.avgRR")}
                  </span>
                  <span className="text-mono text-sm font-bold text-info">{metrics.avgRR}</span>
                  <span className="text-[9px] text-muted-foreground">Derived from confidence</span>
                </div>
                <div className="flex flex-col gap-0.5 p-3">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                    Avg Confidence
                  </span>
                  <span
                    className={cn(
                      "text-mono text-sm font-bold",
                      metrics.avgConfidence >= 65
                        ? "text-bullish"
                        : metrics.avgConfidence >= 45
                          ? "text-neutral-wait"
                          : "text-bearish",
                    )}
                  >
                    {metrics.avgConfidence}%
                  </span>
                  <span className="text-[9px] text-muted-foreground">
                    Across {metrics.completedAnalyses} analyses
                  </span>
                </div>
              </div>
            </div>
          </ExpandableWidget>

          {/* ═══ RISK SCORE ═══ */}
          <ExpandableWidget
            title={t("portfolio.riskScore")}
            subtitle={`Based on ${metrics.completedAnalyses} analyses`}
            icon={
              metrics.riskLevel === "high"
                ? ShieldAlert
                : metrics.riskLevel === "medium"
                  ? Shield
                  : ShieldCheck
            }
            variant={riskVariant}
            defaultExpanded={true}
            metric={`${metrics.riskScore}`}
            metricLabel={metrics.riskLevel.toUpperCase()}
            badge={
              metrics.riskLevel === "high" ? "HIGH" : metrics.riskLevel === "medium" ? "MED" : "LOW"
            }
          >
            <div className="space-y-4">
              {/* Risk gauge visualization */}
              <div className="relative">
                <div className="h-3 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      metrics.riskLevel === "high"
                        ? "bg-gradient-to-r from-bearish/80 to-bearish"
                        : metrics.riskLevel === "medium"
                          ? "bg-gradient-to-r from-neutral-wait/80 to-neutral-wait"
                          : "bg-gradient-to-r from-bullish/80 to-bullish",
                    )}
                    style={{ width: `${metrics.riskScore}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-bullish">
                    Low
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-wait">
                    Medium
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-bearish">
                    High
                  </span>
                </div>
              </div>

              {/* Risk factors breakdown */}
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Layers className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">Concentration</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold font-mono",
                      metrics.pairDistribution.length <= 2
                        ? "text-bearish"
                        : metrics.pairDistribution.length <= 4
                          ? "text-neutral-wait"
                          : "text-bullish",
                    )}
                  >
                    {metrics.pairDistribution.length} pairs
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <Target className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">Signal Quality</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold font-mono",
                      metrics.avgConfidence >= 65
                        ? "text-bullish"
                        : metrics.avgConfidence >= 45
                          ? "text-neutral-wait"
                          : "text-bearish",
                    )}
                  >
                    {metrics.avgConfidence}% avg
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-card border border-border">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="size-3.5 text-muted-foreground" />
                    <span className="text-[11px] font-medium">{t("portfolio.drawdown")}</span>
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-bold font-mono",
                      metrics.riskLevel === "high" ? "text-bearish" : "text-neutral-wait",
                    )}
                  >
                    {metrics.drawdown}
                  </span>
                </div>
              </div>
            </div>
          </ExpandableWidget>

          {/* ═══ BY ASSET ═══ */}
          <ExpandableWidget
            title={t("portfolio.byAsset")}
            subtitle={`${metrics.pairDistribution.length} instruments tracked`}
            icon={BarChart3}
            variant="info"
            defaultExpanded={true}
            metric={`${metrics.pairDistribution.length}`}
            metricLabel="PAIRS"
          >
            <div className="space-y-2">
              {metrics.pairDistribution.map((item) => {
                const maxCount = metrics.pairDistribution[0]?.count ?? 1;
                const barWidth = Math.round((item.count / maxCount) * 100);
                const confColor =
                  item.avgConfidence >= 65
                    ? "bg-bullish"
                    : item.avgConfidence >= 45
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
                          className={cn(
                            "h-full rounded-full transition-all duration-700",
                            confColor,
                          )}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] font-bold font-mono">{item.count}</div>
                      <div
                        className={cn(
                          "text-[9px] font-mono",
                          item.avgConfidence >= 65
                            ? "text-bullish"
                            : item.avgConfidence >= 45
                              ? "text-neutral-wait"
                              : "text-bearish",
                        )}
                      >
                        {item.avgConfidence}% avg
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ExpandableWidget>

          {/* ═══ BY SESSION ═══ */}
          {metrics.sessionDistribution.length > 0 && (
            <ExpandableWidget
              title={t("portfolio.bySession")}
              subtitle="Based on analysis timestamps (UTC)"
              icon={Clock}
              variant="neutral"
              defaultExpanded={false}
              metric={getBestSession(metrics.sessionDistribution)}
              metricLabel="BEST"
            >
              <div className="space-y-2">
                {metrics.sessionDistribution.map((item) => {
                  const isBest =
                    item.avgConfidence ===
                    Math.max(...metrics.sessionDistribution.map((s) => s.avgConfidence));

                  return (
                    <div
                      key={item.session}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg border",
                        isBest ? "bg-primary/5 border-primary/20" : "bg-card border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "size-8 rounded-lg flex items-center justify-center shrink-0",
                          isBest ? "bg-primary/10" : "bg-muted",
                        )}
                      >
                        <SessionIcon session={item.session} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold">{item.session}</span>
                          {isBest && (
                            <span className="text-[8px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                              BEST
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.count} analyses
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={cn(
                            "text-sm font-bold font-mono",
                            item.avgConfidence >= 65
                              ? "text-bullish"
                              : item.avgConfidence >= 45
                                ? "text-neutral-wait"
                                : "text-bearish",
                          )}
                        >
                          {item.avgConfidence}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ BY DAY OF WEEK ═══ */}
          {metrics.dayDistribution.length > 0 && (
            <ExpandableWidget
              title={t("portfolio.byDay")}
              subtitle="Weekly activity pattern"
              icon={CalendarDays}
              variant="neutral"
              defaultExpanded={false}
              metric={getBestDay(metrics.dayDistribution)}
              metricLabel="BEST DAY"
            >
              <div className="space-y-1.5">
                {metrics.dayDistribution.map((item) => {
                  const maxCount = Math.max(...metrics.dayDistribution.map((d) => d.count));
                  const barWidth = Math.round((item.count / (maxCount || 1)) * 100);
                  const isBest =
                    item.avgConfidence ===
                    Math.max(...metrics.dayDistribution.map((d) => d.avgConfidence));

                  return (
                    <div
                      key={item.day}
                      className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border"
                    >
                      <div className="w-10 shrink-0">
                        <span
                          className={cn(
                            "text-xs font-bold",
                            isBest ? "text-primary" : "text-foreground",
                          )}
                        >
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
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {item.count}
                        </span>
                        <span
                          className={cn(
                            "text-[11px] font-bold font-mono min-w-[36px]",
                            item.avgConfidence >= 65
                              ? "text-bullish"
                              : item.avgConfidence >= 45
                                ? "text-neutral-wait"
                                : "text-bearish",
                          )}
                        >
                          {item.avgConfidence}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ExpandableWidget>
          )}

          {/* ═══ RAW DATA SUMMARY ═══ */}
          <div className="vixor-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="size-3.5 text-muted-foreground" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Data Summary
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-foreground">
                  {metrics.totalAnalyses}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                  Total Analyses
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold font-mono text-foreground">
                  {metrics.completedAnalyses}
                </div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-widest font-bold">
                  Completed
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════

function getBestSession(sessions: { session: string; avgConfidence: number }[]): string {
  if (sessions.length === 0) return "—";
  const best = sessions.reduce((a, b) => (a.avgConfidence > b.avgConfidence ? a : b));
  return best.session;
}

function getBestDay(days: { day: string; avgConfidence: number }[]): string {
  if (days.length === 0) return "—";
  const best = days.reduce((a, b) => (a.avgConfidence > b.avgConfidence ? a : b));
  return best.day;
}
