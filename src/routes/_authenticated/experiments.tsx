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
  ArrowRight,
  CheckCircle2,
  XCircle,
  Coins,
  AlertTriangle,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { THEME, PageLayout, StatsRow, EmptyState, ScrollArea } from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/experiments")({
  head: () => ({ meta: [{ title: "Experiments — Vixor" }] }),
  component: ExperimentsPage,
});

// ── Local style constants using THEME ──

const cardStyle: React.CSSProperties = {
  background: THEME.surface,
  border: `1px solid ${THEME.border}`,
  borderRadius: 8,
};

const labelStyle: React.CSSProperties = {
  fontSize: 10,
  textTransform: "uppercase",
  fontWeight: 700,
  color: THEME.textSecondary,
  marginBottom: 6,
  display: "block",
};

const inputStyle: React.CSSProperties = {
  background: THEME.surface,
  border: `1px solid ${THEME.border}`,
  color: THEME.text,
  borderRadius: 6,
  height: 36,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 14,
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

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
  const grade =
    overall >= 90 ? "A" : overall >= 80 ? "B" : overall >= 70 ? "C" : overall >= 60 ? "D" : "F";
  return { overall, grade, totalReturn, maxDrawdown, sharpe };
}

/** Extract elapsed time in ms from result or from created_at/completed_at timestamps. */
function extractElapsed(
  result: Record<string, unknown> | null,
  createdAt?: string,
  completedAt?: string,
): number | null {
  if (result) {
    const ms = result.elapsedMs as number | undefined;
    if (typeof ms === "number") return ms;
  }
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
  const config: Record<string, { bg: string; color: string; border: string }> = {
    running: { bg: "rgba(16,185,129,0.1)", color: THEME.accentDeep, border: "rgba(16,185,129,0.2)" },
    completed: { bg: "rgba(34,197,94,0.1)", color: THEME.green, border: "rgba(34,197,94,0.2)" },
    failed: { bg: "rgba(239,68,68,0.1)", color: THEME.red, border: "rgba(239,68,68,0.2)" },
    cancelled: { bg: "rgba(255,255,255,0.04)", color: THEME.textSecondary, border: "rgba(255,255,255,0.06)" },
  };
  const c = config[status] || config.cancelled;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 6,
      fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
    }}>
      {status === "running" && <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />}
      {status === "completed" && <CheckCircle2 style={{ width: 12, height: 12 }} />}
      {status === "failed" && <XCircle style={{ width: 12, height: 12 }} />}
      {status}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Experiment card
// ---------------------------------------------------------------------------

function ExperimentCard({ experiment }: { experiment: ExperimentRecord }) {
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
  const elapsedMs = extractElapsed(
    experiment.result,
    experiment.created_at,
    (experiment as any).completed_at,
  );
  const rankedCount = extractRankedCount(experiment.result);

  const gradeColor: Record<string, string> = {
    A: THEME.green,
    B: THEME.accentDeep,
    C: THEME.amber,
    D: THEME.red,
    F: THEME.red,
  };

  const iconBg = experiment.status === "running"
    ? "rgba(16,185,129,0.1)"
    : experiment.status === "completed"
      ? "rgba(34,197,94,0.1)"
      : "rgba(239,68,68,0.1)";

  const iconColor = experiment.status === "running"
    ? THEME.accentDeep
    : experiment.status === "completed"
      ? THEME.green
      : THEME.red;

  return (
    <div style={{ ...cardStyle, border: `1px solid ${THEME.border}`, overflow: "hidden" }}>
      {/* Main row */}
      <div
        style={{ padding: 16, cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <FlaskConical style={{ width: 20, height: 20, color: iconColor }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: THEME.text }}>{experiment.config.name}</div>
              <div style={{ fontSize: 12, color: THEME.textSecondary, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}>
                {experiment.config.assetSymbol} · {experiment.config.timeframe}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={experiment.status} />
            <ChevronDown
              style={{ width: 16, height: 16, color: THEME.textMuted, transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
            />
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
              Created
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.text }}>{formatDate(experiment.created_at)}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
              Generations
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontWeight: 700, color: THEME.text }}>{experiment.config.generations}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
              Population
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.text }}>{experiment.config.populationSize}</div>
          </div>
          <div>
            <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
              Duration
            </div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.text }}>
              {elapsedMs ? `${(elapsedMs / 1000).toFixed(1)}s` : "---"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${THEME.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 12, background: "rgba(10,14,26,0.5)" }}>
          {experiment.status === "completed" && bestScore ? (
            <>
              {/* Score summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Overall Score
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.accentDeep }}>
                      {bestScore.overall}
                    </span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: gradeColor[bestScore.grade] || THEME.textSecondary }}>
                      {bestScore.grade}
                    </span>
                  </div>
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Total Return
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: bestScore.totalReturn > 0 ? THEME.green : THEME.red,
                  }}>
                    {bestScore.totalReturn > 0 ? "+" : ""}
                    {bestScore.totalReturn}%
                  </div>
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Max Drawdown
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.red }}>
                    -{bestScore.maxDrawdown}%
                  </div>
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg, border: `1px solid ${THEME.border}` }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Sharpe Ratio
                  </div>
                  <div style={{
                    fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    color: bestScore.sharpe > 1.5 ? THEME.green : bestScore.sharpe > 1 ? THEME.accentDeep : THEME.red,
                  }}>
                    {bestScore.sharpe}
                  </div>
                </div>
              </div>

              {/* Strategy info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginTop: 8 }}>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Template
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.text }}>
                    {experiment.config.strategyTemplate}
                  </div>
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: THEME.bg }}>
                  <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: THEME.textSecondary, fontWeight: 700 }}>
                    Ranked Strategies
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'JetBrains Mono', ui-monospace, monospace", color: THEME.text }}>{rankedCount}</div>
                </div>
              </div>
            </>
          ) : experiment.status === "running" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: THEME.textSecondary }}>
              <Loader2 style={{ width: 16, height: 16, color: THEME.accentDeep, animation: "spin 1s linear infinite" }} />
              <span>
                {translate("experiments.runningMsg") ||
                  "Experiment is running... Results will appear here once complete."}
              </span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: THEME.red }}>
              <XCircle style={{ width: 16, height: 16 }} />
              <span>
                {translate("experiments.failedMsg") ||
                  "This experiment failed. No results available."}
              </span>
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

const ASSET_SYMBOLS = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "SOL/USDT", "GBP/USD"];

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

  const experiments: ExperimentRecord[] =
    (experimentsQuery.data as ExperimentRecord[] | undefined) ?? [];

  // Polling: refetch every 5 seconds when there's a running experiment
  const hasRunning = experiments.some((e) => e.status === "running");
  useEffect(() => {
    if (!hasRunning) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    }, 5000);
    return () => clearInterval(interval);
  }, [hasRunning, queryClient]);

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
      const msg =
        e instanceof Error
          ? e.message
          : useT("experiments.createFailed") || "Failed to create experiment";
      if (msg.startsWith("INSUFFICIENT_POINTS:")) {
        setCreateError(
          useT("experiments.insufficientPoints") || "Insufficient points to create an experiment.",
        );
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

  return (
    <PageLayout
      title={useT("experiments.title") || "Experiments"}
      badge={useT("signals.vixorIntelligence") || "VIXOR ENGINE"}
      badgeColor={THEME.accentDeep}
      loading={me.isLoading}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
        {/* Points Balance + New Experiment Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 6,
            fontSize: 12, fontWeight: 700,
            background: hasEnoughPoints ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
            color: hasEnoughPoints ? THEME.accent : THEME.red,
          }}>
            <Coins style={{ width: 14, height: 14 }} />
            <span>{pointsBalance}</span>
            <span style={{ color: THEME.textSecondary, fontWeight: 400 }}>{useT("common.points") || "pts"}</span>
          </div>
          <button
            onClick={() => setShowNewForm((prev) => !prev)}
            style={{
              height: 36, padding: "0 12px", borderRadius: 8, background: THEME.accentDeep, color: "#fff",
              fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6,
              border: "none", cursor: "pointer",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            {useT("experiments.newExperiment") || "New Experiment"}
          </button>
        </div>

        {/* New experiment form */}
        {showNewForm && (
          <div style={{ ...cardStyle, border: `1px solid ${THEME.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FlaskConical style={{ width: 16, height: 16, color: THEME.accentDeep }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: THEME.text }}>
                {useT("experiments.newExperiment") || "New Experiment"}
              </span>
              <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: THEME.accentDeep }}>
                -{EXPERIMENT_COST} pts
              </span>
            </div>

            {/* Insufficient points warning */}
            {!hasEnoughPoints && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 12, borderRadius: 6, background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                <AlertTriangle style={{ width: 16, height: 16, color: THEME.red, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: THEME.red }}>
                  {useT("experiments.needMorePoints") ||
                    `You need ${EXPERIMENT_COST} points. You have ${pointsBalance}.`}
                </span>
                <a
                  href="/premium"
                  style={{ marginLeft: "auto", fontSize: 10, fontWeight: 700, color: THEME.accentDeep, whiteSpace: "nowrap", textDecoration: "none" }}
                >
                  {useT("premium.getPoints") || "Get Points"}
                </a>
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>{useT("experiments.experimentName") || "Experiment Name"}</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. SMA Crossover - BTC/USDT"
                style={{ ...inputStyle, fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}
              />
            </div>

            {/* Asset + Timeframe */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div>
                <label style={labelStyle}>{useT("experiments.assetSymbol") || "Asset Symbol"}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ASSET_SYMBOLS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewAsset(s)}
                      style={{
                        padding: "0 10px", height: 28, borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
                        background: newAsset === s ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                        color: newAsset === s ? THEME.accent : THEME.textSecondary,
                        border: newAsset === s ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{useT("experiments.timeframe") || "Timeframe"}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setNewTimeframe(tf)}
                      style={{
                        flex: 1, height: 28, borderRadius: 6, fontSize: 11, fontWeight: 700,
                        border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
                        background: newTimeframe === tf ? "rgba(16,185,129,0.15)" : THEME.surface,
                        borderColor: newTimeframe === tf ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                        color: newTimeframe === tf ? THEME.accent : THEME.textSecondary,
                      }}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Strategy */}
            <div>
              <label style={labelStyle}>{useT("experiments.strategyTemplate") || "Strategy Template"}</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STRATEGY_TEMPLATES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setNewStrategy(s.id)}
                    style={{
                      padding: "0 10px", height: 28, borderRadius: 6, fontSize: 11, fontWeight: 700,
                      border: "1px solid", cursor: "pointer",
                      background: newStrategy === s.id ? "rgba(16,185,129,0.15)" : THEME.surface,
                      borderColor: newStrategy === s.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                      color: newStrategy === s.id ? THEME.accent : THEME.textSecondary,
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generations + Population */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div>
                <label style={labelStyle}>{useT("experiments.generations") || "Generations"}</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newGenerations}
                  onChange={(e) => setNewGenerations(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>{useT("experiments.populationSize") || "Population Size"}</label>
                <input
                  type="number"
                  min={4}
                  max={50}
                  value={newPopulation}
                  onChange={(e) => setNewPopulation(Number(e.target.value))}
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || !hasEnoughPoints}
              style={{
                width: "100%", height: 44, borderRadius: 8, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                border: "none", cursor: "pointer", opacity: (creating || !newName.trim() || !hasEnoughPoints) ? 0.5 : 1,
                background: hasEnoughPoints ? THEME.accentDeep : THEME.textMuted,
                color: hasEnoughPoints ? "#fff" : THEME.textSecondary,
                fontSize: 14,
              }}
            >
              {creating ? (
                <>
                  <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                  {useT("experiments.starting") || "Starting experiment..."}
                </>
              ) : (
                <>
                  <FlaskConical style={{ width: 16, height: 16 }} />
                  <span>{useT("experiments.startExperiment") || "Start Experiment"}</span>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>(-{EXPERIMENT_COST} pts)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Create error */}
        {createError && (
          <div style={{ ...cardStyle, borderLeft: "4px solid " + THEME.red, padding: 12 }}>
            <div style={{ fontSize: 12, color: THEME.red }}>{createError}</div>
          </div>
        )}

        {/* Summary stats */}
        <StatsRow
          stats={[
            {
              label: useT("experiments.totalExperiments") || "Total",
              value: String(experiments.length),
              sub: runningCount > 0 ? `${runningCount} running` : undefined,
              color: runningCount > 0 ? THEME.accentDeep : THEME.text,
            },
            {
              label: useT("experiments.completed") || "Completed",
              value: String(completedCount),
              color: THEME.green,
            },
            {
              label: useT("experiments.bestScore") || "Best Score",
              value: bestOverall ? `${bestOverall.overall}` : "---",
              sub: bestOverall ? bestOverall.grade : undefined,
              color: THEME.accentDeep,
            },
          ]}
        />

        {/* Experiment list */}
        {experiments.length === 0 ? (
          <EmptyState
            icon="🧪"
            title={useT("experiments.noExperiments") || "No experiments yet"}
            message={useT("experiments.noExperimentsDesc") || "Create your first experiment to start optimizing trading strategies."}
          />
        ) : (
          <ScrollArea>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 16px" }}>
              {experiments.map((exp) => <ExperimentCard key={exp.id} experiment={exp} />)}
            </div>
          </ScrollArea>
        )}
      </div>
    </PageLayout>
  );
}