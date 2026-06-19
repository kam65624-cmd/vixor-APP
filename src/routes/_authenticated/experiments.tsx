import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/domains/user/functions";
import { listExperiments, createExperiment } from "@/domains/experiment/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { useState, useMemo, useEffect } from "react";
import {
  FlaskConical,
  Plus,
  Loader2,
  Crown,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Target,
  BarChart3,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({ meta: [{ title: "Experiments — Vixor" }] }),
  component: ExperimentsPage,
});

// ---------------------------------------------------------------------------
// Types for UI display
// ---------------------------------------------------------------------------

type ExperimentStatus = "running" | "completed" | "failed" | "cancelled";

/** Shape returned from Supabase `experiments` table via listExperiments. */
interface ExperimentRecord {
  id: string;
  user_id: string;
  config: {
    name: string;
    assetSymbol: string;
    timeframe: string;
    strategyTemplate: string;
    generations: number;
    populationSize: number;
    createdAt: string;
  };
  result: Record<string, unknown> | null;
  status: ExperimentStatus;
  created_at: string;
  completed_at: string | null;
}

/** Derived best-score summary from the experiment result. */
interface BestScoreSummary {
  overall: number;
  grade: string;
  totalReturn: number;
  maxDrawdown: number;
  sharpe: number;
}

/** Extract a BestScoreSummary from the serialized experiment result. */
function extractBestScore(result: Record<string, unknown> | null): BestScoreSummary | null {
  if (!result) return null;
  const best = result.bestStrategy as Record<string, unknown> | undefined;
  if (!best || !best.score) return null;
  const summary = best.summary as Record<string, unknown> | undefined;
  const overall = typeof best.score === "number" ? best.score : 0;
  const totalReturn = (summary?.totalReturn as number) ?? 0;
  const maxDrawdown = (summary?.maxDrawdown as number) ?? 0;
  const sharpe = (summary?.sharpe as number) ?? 0;
  const grade = overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "F";
  return { overall, grade, totalReturn, maxDrawdown, sharpe };
}

/** Extract elapsed time in ms from result. */
function extractElapsed(result: Record<string, unknown> | null): number | null {
  if (!result) return null;
  const ms = result.elapsedMs as number | undefined;
  return typeof ms === "number" ? ms : null;
}

/** Extract ranked strategies count from result. */
function extractRankedCount(result: Record<string, unknown> | null): number {
  if (!result) return 0;
  const arr = result.rankedStrategies as unknown[] | undefined;
  return Array.isArray(arr) ? arr.length : 0;
}

// ---------------------------------------------------------------------------
// Premium wall
// ---------------------------------------------------------------------------

function PremiumWall() {
  const { t } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Crown className="size-8 text-primary" />
      </div>
      <h2 className="text-xl font-bold tracking-tight">{t("premium.upgradeNow") || "Premium Feature"}</h2>
      <p className="text-sm text-muted-foreground text-center max-w-sm">
        Strategy experiments use AI-powered evolution to discover optimal
        parameters. Upgrade to premium to unlock this feature.
      </p>
      <a
        href="/premium"
        className="mt-2 px-6 h-11 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform"
      >
        <Crown className="size-4" />
        <span>{t("premium.upgradeNow") || "Upgrade Now"}</span>
        <ArrowRight className="size-4" />
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ExperimentStatus }) {
  switch (status) {
    case "running":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
          <Loader2 className="size-3 animate-spin" />
          Running
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bullish/10 text-bullish border border-bullish/20">
          <CheckCircle2 className="size-3" />
          Completed
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bearish/10 text-bearish border border-bearish/20">
          <XCircle className="size-3" />
          Failed
        </span>
      );
  }
}

// ---------------------------------------------------------------------------
// Experiment card
// ---------------------------------------------------------------------------

function ExperimentCard({
  experiment,
}: {
  experiment: ExperimentRecord;
}) {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const bestScore = extractBestScore(experiment.result);
  const elapsedMs = extractElapsed(experiment.result);
  const rankedCount = extractRankedCount(experiment.result);

  const gradeColor: Record<string, string> = {
    A: "text-bullish",
    B: "text-primary",
    C: "text-yellow-500",
    D: "text-bearish",
    F: "text-bearish",
  };

  return (
    <div className="vixor-card overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Main row */}
      <div
        className="p-4 cursor-pointer hover:bg-card-hover/50 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div
              className={`size-10 rounded-xl flex items-center justify-center ${
                experiment.status === "running"
                  ? "bg-primary/10"
                  : experiment.status === "completed"
                    ? "bg-bullish/10"
                    : "bg-bearish/10"
              }`}
            >
              <FlaskConical
                className={`size-5 ${
                  experiment.status === "running"
                    ? "text-primary"
                    : experiment.status === "completed"
                      ? "text-bullish"
                      : "text-bearish"
                }`}
              />
            </div>
            <div>
              <div className="font-bold text-sm">{experiment.config.name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {experiment.config.assetSymbol} · {experiment.config.timeframe}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={experiment.status} />
            <ChevronDown
              className={`size-4 text-muted-foreground transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>

        {/* Quick stats row */}
        <div className="grid grid-cols-4 gap-3">
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Created
            </div>
            <div className="text-[11px] font-mono">{formatDate(experiment.created_at)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Generations
            </div>
            <div className="text-[11px] font-mono font-bold">
              {experiment.config.generations}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Population
            </div>
            <div className="text-[11px] font-mono">{experiment.config.populationSize}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Duration
            </div>
            <div className="text-[11px] font-mono">
              {elapsedMs
                ? `${(elapsedMs / 1000).toFixed(1)}s`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-background/50 animate-in fade-in slide-in-from-top-1 duration-200">
          {experiment.status === "completed" && bestScore ? (
            <>
              {/* Score summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Overall Score
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-primary">
                      {bestScore.overall}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        gradeColor[bestScore.grade] || "text-muted-foreground"
                      }`}
                    >
                      {bestScore.grade}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Total Return
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      bestScore.totalReturn > 0 ? "text-bullish" : "text-bearish"
                    }`}
                  >
                    {bestScore.totalReturn > 0 ? "+" : ""}
                    {bestScore.totalReturn}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Max Drawdown
                  </div>
                  <div className="text-lg font-bold font-mono text-bearish">
                    -{bestScore.maxDrawdown}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Sharpe Ratio
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      bestScore.sharpe > 1.5
                        ? "text-bullish"
                        : bestScore.sharpe > 1
                          ? "text-primary"
                          : "text-bearish"
                    }`}
                  >
                    {bestScore.sharpe}
                  </div>
                </div>
              </div>

              {/* Strategy info */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Template
                  </div>
                  <div className="text-xs font-bold font-mono">{experiment.config.strategyTemplate}</div>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Ranked Strategies
                  </div>
                  <div className="text-xs font-bold font-mono">{rankedCount}</div>
                </div>
              </div>
            </>
          ) : experiment.status === "running" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Experiment is running… Results will appear here once complete.</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-bearish">
              <XCircle className="size-4" />
              <span>This experiment failed. No results available.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// New experiment dialog content
// ---------------------------------------------------------------------------

const STRATEGY_TEMPLATES = [
  { id: "sma_crossover", label: "SMA Crossover" },
  { id: "rsi_reversal", label: "RSI Reversal" },
  { id: "breakout", label: "Breakout" },
  { id: "macd_momentum", label: "MACD Momentum" },
];

const ASSET_SYMBOLS = [
  "BTC/USDT",
  "ETH/USDT",
  "XAU/USD",
  "EUR/USD",
  "SOL/USDT",
  "GBP/USD",
];

const TIMEFRAMES = ["1H", "4H", "1D"];

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

function ExperimentsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fetchMe = useStableServerFn(getMe);
  const fetchExperiments = useStableServerFn(listExperiments);
  const createExp = useStableServerFn(createExperiment);

  const me = useQuery(
    useMemo(
      () => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}), staleTime: 30_000 }),
      [fetchMe],
    ),
  );

  const isPremium = !!me.data?.isPremium;

  // Fetch real experiments from server
  const experimentsQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["experiments"] as const,
        queryFn: () => fetchExperiments({}),
        staleTime: 10_000,
        // Poll every 5 seconds when there's a running experiment
        refetchInterval: experiments.some((e: ExperimentRecord) => e.status === "running") ? 5_000 : false,
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [fetchExperiments],
    ),
  );

  const experiments: ExperimentRecord[] = (experimentsQuery.data as ExperimentRecord[] | undefined) ?? [];

  // Polling flag derived from experiments list
  const hasRunning = experiments.some((e) => e.status === "running");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // New experiment form state
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAsset, setNewAsset] = useState("BTC/USDT");
  const [newTimeframe, setNewTimeframe] = useState("1H");
  const [newStrategy, setNewStrategy] = useState("sma_crossover");
  const [newGenerations, setNewGenerations] = useState(5);
  const [newPopulation, setNewPopulation] = useState(12);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const { id } = await createExp({
        data: {
          name: newName.trim(),
          assetSymbol: newAsset,
          timeframe: newTimeframe,
          strategyTemplate: newStrategy,
          generations: newGenerations,
          populationSize: newPopulation,
        },
      });
      // Optimistic: immediately invalidate to refetch the list (which now includes the new row)
      await queryClient.invalidateQueries({ queryKey: ["experiments"] });
      setShowNewForm(false);
      setNewName("");
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : t("experiments.createFailed") || "Failed to create experiment");
    } finally {
      setCreating(false);
    }
  };

  // Summary stats
  const completedCount = experiments.filter((e) => e.status === "completed").length;
  const runningCount = experiments.filter((e) => e.status === "running").length;
  const bestScore = experiments
    .map((e) => extractBestScore(e.result))
    .filter((s): s is BestScoreSummary => s !== null)
    .sort((a, b) => b.overall - a.overall)[0];

  // Show loading while checking premium status
  if (me.isLoading) {
    return (
      <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t("experiments.title") || "Experiments"}</h1>
          </div>
        </div>
        <div className="vixor-card p-6 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted-foreground">{t("common.loading") || "Loading…"}</div>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{t("experiments.title") || "Experiments"}</h1>
          </div>
        </div>
        <PremiumWall />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
            {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t("experiments.title") || "Experiments"}</h1>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="h-9 px-3 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <Plus className="size-3.5" />
          {t("experiments.newExperiment") || "New Experiment"}
        </button>
      </div>

      {/* New experiment form */}
      {showNewForm && (
        <div className="vixor-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <span className="text-sm font-bold">{t("experiments.newExperiment") || "New Experiment"}</span>
          </div>

          {/* Name */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Experiment Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SMA Crossover — BTC/USDT"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Asset + Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                Asset Symbol
              </label>
              <div className="flex flex-wrap gap-1.5">
                {ASSET_SYMBOLS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setNewAsset(s)}
                    className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                      newAsset === s
                        ? "bg-primary/10 text-primary border border-primary/30"
                        : "bg-muted text-muted-foreground border border-border"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                Timeframe
              </label>
              <div className="flex gap-1.5">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setNewTimeframe(tf)}
                    className={`flex-1 h-7 rounded-lg text-[11px] font-bold transition-all border flex items-center justify-center ${
                      newTimeframe === tf
                        ? "bg-primary text-primary-foreground border-primary glow-primary"
                        : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Strategy */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              Strategy Template
            </label>
            <div className="flex flex-wrap gap-1.5">
              {STRATEGY_TEMPLATES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setNewStrategy(s.id)}
                  className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all border ${
                    newStrategy === s.id
                      ? "bg-primary text-primary-foreground border-primary glow-primary"
                      : "bg-card border-border text-muted-foreground hover:bg-card-hover"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generations + Population */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                Generations
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={newGenerations}
                onChange={(e) => setNewGenerations(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                Population Size
              </label>
              <input
                type="number"
                min={4}
                max={50}
                value={newPopulation}
                onChange={(e) => setNewPopulation(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50"
          >
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Creating Experiment…
              </>
            ) : (
              <>
                <FlaskConical className="size-4" />
                {t("experiments.startExperiment") || "Start Experiment"}
              </>
            )}
          </button>
        </div>
      )}

      {/* Create error */}
      {createError && (
        <div className="vixor-card p-3 border-l-4 border-l-bearish">
          <div className="text-xs text-bearish">{createError}</div>
        </div>
      )}

      {/* Summary stats */}
      <div className="vixor-card p-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="p-2 rounded-lg bg-background">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Total Experiments
            </div>
            <div className="text-lg font-bold font-mono">{experiments.length}</div>
            {runningCount > 0 && (
              <div className="text-[10px] text-primary font-bold">{runningCount} running</div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-background">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Completed
            </div>
            <div className="text-lg font-bold font-mono text-bullish">{completedCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-background">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Best Score
            </div>
            <div className="text-lg font-bold font-mono text-primary">
              {bestScore ? (
                <>
                  {bestScore.overall}
                  <span className="text-xs text-muted-foreground ml-1">{bestScore.grade}</span>
                </>
              ) : (
                "—"
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Experiment list */}
      <div className="space-y-3">
        {experiments.length === 0 ? (
          <div className="vixor-card p-6 text-center">
            <FlaskConical className="size-8 text-muted-foreground/30 mx-auto mb-2" />
            <div className="text-sm text-muted-foreground mb-2">No experiments yet</div>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary"
            >
              <Plus className="size-3.5 inline mr-1" />
              Create Your First Experiment
            </button>
          </div>
        ) : (
          experiments.map((exp) => <ExperimentCard key={exp.id} experiment={exp} />)
        )}
      </div>
    </div>
  );
}
