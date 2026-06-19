import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@/domains/user/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { useState, useMemo } from "react";
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
import type { ExperimentConfig, ExperimentResult } from "@/domains/experiment/runner";
import type { GenerationStats, Individual } from "@/domains/experiment/evolution";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({ meta: [{ title: "Experiments — Vixor" }] }),
  component: ExperimentsPage,
});

// ---------------------------------------------------------------------------
// Types for UI display
// ---------------------------------------------------------------------------

type ExperimentStatus = "running" | "completed" | "failed";

interface ExperimentRecord {
  id: string;
  name: string;
  status: ExperimentStatus;
  createdAt: string;
  assetSymbol: string;
  timeframe: string;
  generations: number;
  populationSize: number;
  strategyTemplate: string;
  /** Best score summary (null if not completed) */
  bestScore: {
    overall: number;
    grade: string;
    totalReturn: number;
    maxDrawdown: number;
    sharpe: number;
  } | null;
  /** Generation-by-generation stats */
  generationStats: GenerationStats[] | null;
  /** Top ranked strategies count */
  rankedCount: number;
  elapsedMs: number | null;
}

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const MOCK_EXPERIMENTS: ExperimentRecord[] = [
  {
    id: "exp_001",
    name: "SMA Crossover — BTC/USDT",
    status: "completed",
    createdAt: "2024-12-15T10:30:00Z",
    assetSymbol: "BTC/USDT",
    timeframe: "1H",
    generations: 5,
    populationSize: 12,
    strategyTemplate: "sma_crossover",
    bestScore: {
      overall: 87.4,
      grade: "B",
      totalReturn: 32.1,
      maxDrawdown: 6.8,
      sharpe: 1.92,
    },
    generationStats: [
      { generation: 0, bestScore: 62.1, avgScore: 45.3, population: [] },
      { generation: 1, bestScore: 71.5, avgScore: 52.8, population: [] },
      { generation: 2, bestScore: 79.3, avgScore: 61.2, population: [] },
      { generation: 3, bestScore: 84.6, avgScore: 67.5, population: [] },
      { generation: 4, bestScore: 87.4, avgScore: 72.1, population: [] },
    ],
    rankedCount: 24,
    elapsedMs: 18420,
  },
  {
    id: "exp_002",
    name: "RSI Reversal — ETH/USDT",
    status: "completed",
    createdAt: "2024-12-14T08:15:00Z",
    assetSymbol: "ETH/USDT",
    timeframe: "4H",
    generations: 3,
    populationSize: 10,
    strategyTemplate: "rsi_reversal",
    bestScore: {
      overall: 72.1,
      grade: "C",
      totalReturn: 18.4,
      maxDrawdown: 11.2,
      sharpe: 1.35,
    },
    generationStats: [
      { generation: 0, bestScore: 55.0, avgScore: 38.7, population: [] },
      { generation: 1, bestScore: 64.3, avgScore: 48.1, population: [] },
      { generation: 2, bestScore: 72.1, avgScore: 56.9, population: [] },
    ],
    rankedCount: 15,
    elapsedMs: 12350,
  },
  {
    id: "exp_003",
    name: "Breakout — XAU/USD",
    status: "running",
    createdAt: "2024-12-16T14:00:00Z",
    assetSymbol: "XAU/USD",
    timeframe: "1D",
    generations: 5,
    populationSize: 15,
    strategyTemplate: "breakout",
    bestScore: null,
    generationStats: null,
    rankedCount: 0,
    elapsedMs: null,
  },
  {
    id: "exp_004",
    name: "MACD Momentum — EUR/USD",
    status: "failed",
    createdAt: "2024-12-13T16:45:00Z",
    assetSymbol: "EUR/USD",
    timeframe: "1H",
    generations: 2,
    populationSize: 8,
    strategyTemplate: "macd_momentum",
    bestScore: null,
    generationStats: null,
    rankedCount: 0,
    elapsedMs: 5200,
  },
  {
    id: "exp_005",
    name: "SMA Crossover — SOL/USDT",
    status: "completed",
    createdAt: "2024-12-12T09:20:00Z",
    assetSymbol: "SOL/USDT",
    timeframe: "4H",
    generations: 4,
    populationSize: 12,
    strategyTemplate: "sma_crossover",
    bestScore: {
      overall: 91.2,
      grade: "A",
      totalReturn: 45.7,
      maxDrawdown: 5.2,
      sharpe: 2.14,
    },
    generationStats: [
      { generation: 0, bestScore: 68.9, avgScore: 51.2, population: [] },
      { generation: 1, bestScore: 78.4, avgScore: 59.6, population: [] },
      { generation: 2, bestScore: 85.7, avgScore: 65.3, population: [] },
      { generation: 3, bestScore: 91.2, avgScore: 71.8, population: [] },
    ],
    rankedCount: 28,
    elapsedMs: 21500,
  },
];

async function createExperimentMock(config: {
  name: string;
  assetSymbol: string;
  timeframe: string;
  strategyTemplate: string;
  generations: number;
  populationSize: number;
}): Promise<ExperimentRecord> {
  // TODO: wire to real server function
  await new Promise((r) => setTimeout(r, 800));
  return {
    id: `exp_${String(Date.now()).slice(-6)}`,
    name: config.name,
    status: "running",
    createdAt: new Date().toISOString(),
    assetSymbol: config.assetSymbol,
    timeframe: config.timeframe,
    generations: config.generations,
    populationSize: config.populationSize,
    strategyTemplate: config.strategyTemplate,
    bestScore: null,
    generationStats: null,
    rankedCount: 0,
    elapsedMs: null,
  };
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
              <div className="font-bold text-sm">{experiment.name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {experiment.assetSymbol} · {experiment.timeframe}
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
            <div className="text-[11px] font-mono">{formatDate(experiment.createdAt)}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Generations
            </div>
            <div className="text-[11px] font-mono font-bold">
              {experiment.generationStats
                ? `${experiment.generationStats.length}/${experiment.generations}`
                : experiment.generations}
            </div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Population
            </div>
            <div className="text-[11px] font-mono">{experiment.populationSize}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
              Duration
            </div>
            <div className="text-[11px] font-mono">
              {experiment.elapsedMs
                ? `${(experiment.elapsedMs / 1000).toFixed(1)}s`
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border p-4 space-y-3 bg-background/50 animate-in fade-in slide-in-from-top-1 duration-200">
          {experiment.status === "completed" && experiment.bestScore ? (
            <>
              {/* Score summary */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Overall Score
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold font-mono text-primary">
                      {experiment.bestScore.overall}
                    </span>
                    <span
                      className={`text-lg font-bold ${
                        gradeColor[experiment.bestScore.grade] || "text-muted-foreground"
                      }`}
                    >
                      {experiment.bestScore.grade}
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Total Return
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      experiment.bestScore.totalReturn > 0 ? "text-bullish" : "text-bearish"
                    }`}
                  >
                    {experiment.bestScore.totalReturn > 0 ? "+" : ""}
                    {experiment.bestScore.totalReturn}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Max Drawdown
                  </div>
                  <div className="text-lg font-bold font-mono text-bearish">
                    -{experiment.bestScore.maxDrawdown}%
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-background border border-border">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Sharpe Ratio
                  </div>
                  <div
                    className={`text-lg font-bold font-mono ${
                      experiment.bestScore.sharpe > 1.5
                        ? "text-bullish"
                        : experiment.bestScore.sharpe > 1
                          ? "text-primary"
                          : "text-bearish"
                    }`}
                  >
                    {experiment.bestScore.sharpe}
                  </div>
                </div>
              </div>

              {/* Generation progress chart (simplified bars) */}
              {experiment.generationStats && experiment.generationStats.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground mb-2">
                    Generation Progress
                  </div>
                  <div className="flex items-end gap-1.5 h-16">
                    {experiment.generationStats.map((gen) => (
                      <div
                        key={gen.generation}
                        className="flex-1 flex flex-col items-center gap-0.5"
                      >
                        <div className="text-[8px] font-mono text-muted-foreground">
                          {gen.bestScore?.toFixed(0)}
                        </div>
                        <div
                          className="w-full rounded-t-md gradient-primary glow-primary"
                          style={{
                            height: `${((gen.bestScore ?? 0) / 100) * 100}%`,
                            minHeight: 4,
                          }}
                        />
                        <div className="text-[8px] font-mono text-muted-foreground">
                          G{gen.generation}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Average score line hint */}
                  <div className="flex gap-1.5 mt-1">
                    {experiment.generationStats.map((gen) => (
                      <div key={gen.generation} className="flex-1 flex justify-center">
                        <div className="text-[8px] font-mono text-muted-foreground/50">
                          avg: {gen.avgScore?.toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Strategy info */}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Template
                  </div>
                  <div className="text-xs font-bold font-mono">{experiment.strategyTemplate}</div>
                </div>
                <div className="p-2 rounded-lg bg-background">
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">
                    Ranked Strategies
                  </div>
                  <div className="text-xs font-bold font-mono">{experiment.rankedCount}</div>
                </div>
              </div>
            </>
          ) : experiment.status === "running" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Experiment is running… Generations will appear here once complete.</span>
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
  const fetchMe = useStableServerFn(getMe);

  const me = useQuery(
    useMemo(
      () => ({ queryKey: ["me"] as const, queryFn: () => fetchMe({}), staleTime: 30_000 }),
      [fetchMe],
    ),
  );

  const isPremium = !!me.data?.isPremium;

  // Local state: experiment list (mock) + new experiment form
  const [experiments, setExperiments] = useState<ExperimentRecord[]>(MOCK_EXPERIMENTS);
  const [showNewForm, setShowNewForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // New experiment form state
  const [newName, setNewName] = useState("");
  const [newAsset, setNewAsset] = useState("BTC/USDT");
  const [newTimeframe, setNewTimeframe] = useState("1H");
  const [newStrategy, setNewStrategy] = useState("sma_crossover");
  const [newGenerations, setNewGenerations] = useState(5);
  const [newPopulation, setNewPopulation] = useState(12);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const exp = await createExperimentMock({
        name: newName.trim(),
        assetSymbol: newAsset,
        timeframe: newTimeframe,
        strategyTemplate: newStrategy,
        generations: newGenerations,
        populationSize: newPopulation,
      });
      setExperiments((prev) => [exp, ...prev]);
      setShowNewForm(false);
      setNewName("");
    } catch {
      // ignore for now
    } finally {
      setCreating(false);
    }
  };

  // Summary stats
  const completedCount = experiments.filter((e) => e.status === "completed").length;
  const runningCount = experiments.filter((e) => e.status === "running").length;
  const bestScore = experiments
    .filter((e) => e.bestScore !== null)
    .sort((a, b) => (b.bestScore?.overall ?? 0) - (a.bestScore?.overall ?? 0))[0]?.bestScore;

  // Show loading while checking premium status
  if (me.isLoading) {
    return (
      <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-end justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">
              {t("signals.vixorIntelligence") || "VIXOR ENGINE"}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
          </div>
        </div>
        <div className="vixor-card p-6 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Loading…</div>
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
            <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
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
          <h1 className="text-2xl font-bold tracking-tight">Experiments</h1>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="h-9 px-3 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary flex items-center gap-1.5 hover:scale-[1.02] active:scale-95 transition-transform"
        >
          <Plus className="size-3.5" />
          New Experiment
        </button>
      </div>

      {/* New experiment form */}
      {showNewForm && (
        <div className="vixor-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-primary" />
            <span className="text-sm font-bold">New Experiment</span>
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
                Start Experiment
              </>
            )}
          </button>
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
