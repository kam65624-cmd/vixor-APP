import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/domains/user/functions";
import { listExperiments, createExperiment } from "@/domains/experiment/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { useState, useMemo } from "react";
import {
  FlaskConical,
  Plus,
  Loader2,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Coins,
  AlertTriangle,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({ meta: [{ title: "Experiments — Vixor" }] }),
  component: ExperimentsPage,
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXPERIMENT_COST = 25;

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

/** Extract elapsed time in ms from result or from created_at/completed_at timestamps. */
function extractElapsed(
  result: Record<string, unknown> | null,
  createdAt?: string,
  completedAt?: string,
): number | null {
  // First try elapsedMs from result
  if (result) {
    const ms = result.elapsedMs as number | undefined;
    if (typeof ms === "number") return ms;
  }
  // Fallback: calculate from timestamps
  if (createdAt && completedAt) {
    const diff = new Date(completedAt).getTime() - new Date(createdAt).getTime();
    return diff > 0 ? diff : null;
  }
  return null;
}

/** Extract ranked strategies count from result. */
function extractRankedCount(result: Record<string, unknown> | null): number {
  if (!result) return 0;
  const arr = result.rankedStrategies as unknown[] | undefined;
  return Array.isArray(arr) ? arr.length : 0;
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
          {status}
        </span>
      );
    case "completed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bullish/10 text-bullish border border-bullish/20">
          <CheckCircle2 className="size-3" />
          {status}
        </span>
      );
    case "failed":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-bearish/10 text-bearish border border-bearish/20">
          <XCircle className="size-3" />
          {status}
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-muted text-muted-foreground border border-border">
          {status}
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
  const { t: translate } = useI18n();
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
  const elapsedMs = extractElapsed(experiment.result, experiment.created_at, (experiment as any).completed_at);
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
                : "---"}
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
              <span>{translate("experiments.runningMsg") || "Experiment is running... Results will appear here once complete."}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-bearish">
              <XCircle className="size-4" />
              <span>{translate("experiments.failedMsg") || "This experiment failed. No results available."}</span>
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
  const { t: useT } = useI18n();
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

  const pointsBalance = me.data?.balance?.balance ?? 0;
  const hasEnoughPoints = pointsBalance >= EXPERIMENT_COST;

  // Fetch real experiments from server
  const experimentsQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["experiments"] as const,
        queryFn: () => fetchExperiments({}),
        staleTime: 10_000,
      }),
      [fetchExperiments],
    ),
  );

  const experiments: ExperimentRecord[] = (experimentsQuery.data as ExperimentRecord[] | undefined) ?? [];

  // Polling: refetch every 5 seconds when there's a running experiment
  const hasRunning = experiments.some((e) => e.status === "running");
  useMemo(() => {
    if (hasRunning) {
      const interval = setInterval(() => {
        queryClient.invalidateQueries({ queryKey: ["experiments"] });
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [hasRunning]);

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
      await createExp({
        data: {
          name: newName.trim(),
          assetSymbol: newAsset,
          timeframe: newTimeframe,
          strategyTemplate: newStrategy,
          generations: newGenerations,
          populationSize: newPopulation,
        },
      });
      // Invalidate to refetch with the new experiment
      await queryClient.invalidateQueries({ queryKey: ["experiments"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      setShowNewForm(false);
      setNewName("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : useT("experiments.createFailed") || "Failed to create experiment";
      if (msg.startsWith("INSUFFICIENT_POINTS:")) {
        setCreateError(useT("experiments.insufficientPoints") || "Insufficient points to create an experiment.");
      } else {
        setCreateError(msg);
      }
    } finally {
      setCreating(false);
    }
  };

  // Summary stats
  const completedCount = experiments.filter((e) => e.status === "completed").length;
  const runningCount = experiments.filter((e) => e.status === "running").length;
  const bestOverall = experiments
    .map((e) => extractBestScore(e.result))
    .filter((s): s is BestScoreSummary => s !== null)
    .sort((a, b) => b.overall - a.overall)[0];

  // Show loading
  if (me.isLoading) {
    return (
      <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {useT("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">{useT("experiments.title") || "Experiments"}</h1>
          </div>
        </div>
        <div className="vixor-card p-6 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted-foreground">{useT("common.loading") || "Loading..."}</div>
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
            {useT("signals.vixorIntelligence") || "VIXOR ENGINE"}
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{useT("experiments.title") || "Experiments"}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${hasEnoughPoints ? "bg-primary/10 text-primary" : "bg-bearish/10 text-bearish"}`}>
            <Coins className="size-3.5" />
            <span>{pointsBalance}</span>
            <span className="text-muted-foreground font-normal">{useT("common.points") || "pts"}</span>
          </div>
          <button
            onClick={() => setShowNewForm(!showNewForm)}
            className="h-9 px-3 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-transform"
          >
            <Plus className="size-3.5" />
            {useT("experiments.newExperiment") || "New Experiment"}
          </button>
        </div>
      </div>

      {/* New experiment form */}
      {showNewForm && (
        <div className="vixor-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <span className="text-sm font-bold">{useT("experiments.newExperiment") || "New Experiment"}</span>
            <span className="ml-auto text-[10px] font-bold text-primary">-{EXPERIMENT_COST} pts</span>
          </div>

          {/* Insufficient points warning */}
          {!hasEnoughPoints && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-bearish/5 border border-bearish/20">
              <AlertTriangle className="size-4 text-bearish shrink-0" />
              <span className="text-xs text-bearish">
                {useT("experiments.needMorePoints") || `You need ${EXPERIMENT_COST} points. You have ${pointsBalance}.`}
              </span>
              <a href="/premium" className="ml-auto text-[10px] font-bold text-primary whitespace-nowrap">
                {useT("premium.getPoints") || "Get Points"}
              </a>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
              {useT("experiments.experimentName") || "Experiment Name"}
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. SMA Crossover - BTC/USDT"
              className="w-full h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Asset + Timeframe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">
                {useT("experiments.assetSymbol") || "Asset Symbol"}
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
                {useT("experiments.timeframe") || "Timeframe"}
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
              {useT("experiments.strategyTemplate") || "Strategy Template"}
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
                {useT("experiments.generations") || "Generations"}
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
                {useT("experiments.populationSize") || "Population Size"}
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
            disabled={creating || !newName.trim() || !hasEnoughPoints}
            className={`w-full h-11 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform disabled:opacity-50 ${hasEnoughPoints ? "gradient-primary text-primary-foreground glow-primary hover:scale-[1.02] active:scale-95" : "bg-muted text-muted-foreground"}`}
          >
            {creating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {useT("experiments.starting") || "Starting experiment..."}
              </>
            ) : (
              <>
                <FlaskConical className="size-4" />
                <span>{useT("experiments.startExperiment") || "Start Experiment"}</span>
                <span className="text-xs opacity-75">(-{EXPERIMENT_COST} pts)</span>
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
              {useT("experiments.totalExperiments") || "Total"}
            </div>
            <div className="text-lg font-bold font-mono">{experiments.length}</div>
            {runningCount > 0 && (
              <div className="text-[10px] text-primary font-bold">{runningCount} running</div>
            )}
          </div>
          <div className="p-2 rounded-lg bg-background">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              {useT("experiments.completed") || "Completed"}
            </div>
            <div className="text-lg font-bold font-mono text-bullish">{completedCount}</div>
          </div>
          <div className="p-2 rounded-lg bg-background">
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              {useT("experiments.bestScore") || "Best Score"}
            </div>
            <div className="text-lg font-bold font-mono text-primary">
              {bestOverall ? (
                <>
                  {bestOverall.overall}
                  <span className="text-xs text-muted-foreground ml-1">{bestOverall.grade}</span>
                </>
              ) : (
                "---"
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
            <div className="text-sm text-muted-foreground mb-2">{useT("experiments.noExperiments") || "No experiments yet. Create one to get started."}</div>
            <button
              onClick={() => setShowNewForm(true)}
              className="px-4 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary"
            >
              <Plus className="size-3.5 inline mr-1" />
              {useT("experiments.createFirst") || "Create Your First Experiment"}
            </button>
          </div>
        ) : (
          experiments.map((exp) => <ExperimentCard key={exp.id} experiment={exp} />)
        )}
      </div>
    </div>
  );
}
