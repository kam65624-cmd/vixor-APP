import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMe } from "@/domains/user/functions";
import { listExperiments, createExperiment } from "@/domains/experiment/functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { useState, useMemo, useEffect } from "react";
import { FlaskConical, Plus, Loader2, Coins, AlertTriangle } from "lucide-react";
import { PageLayout, StatsRow, EmptyState, ScrollArea } from "@/components/vixor/PageLayout";

import {
  cardStyle,
  labelStyle,
  inputStyle,
  EXPERIMENT_COST,
  STRATEGY_TEMPLATES,
  ASSET_SYMBOLS,
  TIMEFRAMES,
  extractBestScore,
} from "./constants";
import type { ExperimentRecord, BestScoreSummary } from "./constants";
import { ExperimentCard } from "./ExperimentCard";

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export function ExperimentsPage() {
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
          : t("experiments.createFailed") || "Failed to create experiment";
      if (msg.startsWith("INSUFFICIENT_POINTS:")) {
        setCreateError(
          t("experiments.insufficientPoints") || "Insufficient points to create an experiment.",
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
      title={t("experiments.title") || "Experiments"}
      badge={t("signals.vixorIntelligence") || "VIXOR ENGINE"}
      badgeColor={"var(--color-bullish)"}
      loading={me.isLoading}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24 }}>
        {/* Points Balance + New Experiment Button */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              background: hasEnoughPoints ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
              color: hasEnoughPoints ? "var(--color-primary)" : "var(--color-bearish)",
            }}
          >
            <Coins style={{ width: 14, height: 14 }} />
            <span>{pointsBalance}</span>
            <span style={{ color: "var(--color-muted-foreground)", fontWeight: 400 }}>
              {t("common.points") || "pts"}
            </span>
          </div>
          <button
            onClick={() => setShowNewForm((prev) => !prev)}
            style={{
              height: 36,
              padding: "0 12px",
              borderRadius: 8,
              background: "var(--color-bullish)",
              color: "#fff",
              fontSize: 12,
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              cursor: "pointer",
            }}
          >
            <Plus style={{ width: 14, height: 14 }} />
            {t("experiments.newExperiment") || "New Experiment"}
          </button>
        </div>

        {/* New experiment form */}
        {showNewForm && (
          <div
            style={{
              ...cardStyle,
              border: `1px solid ${"var(--color-border)"}`,
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <FlaskConical style={{ width: 16, height: 16, color: "var(--color-bullish)" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--color-foreground)" }}>
                {t("experiments.newExperiment") || "New Experiment"}
              </span>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: 10,
                  fontWeight: 700,
                  color: "var(--color-bullish)",
                }}
              >
                -{EXPERIMENT_COST} pts
              </span>
            </div>

            {/* Insufficient points warning */}
            {!hasEnoughPoints && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 12,
                  borderRadius: 6,
                  background: "rgba(239,68,68,0.05)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                <AlertTriangle
                  style={{ width: 16, height: 16, color: "var(--color-bearish)", flexShrink: 0 }}
                />
                <span style={{ fontSize: 12, color: "var(--color-bearish)" }}>
                  {t("experiments.needMorePoints") ||
                    `You need ${EXPERIMENT_COST} points. You have ${pointsBalance}.`}
                </span>
                <a
                  href="/premium"
                  style={{
                    marginLeft: "auto",
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--color-bullish)",
                    whiteSpace: "nowrap",
                    textDecoration: "none",
                  }}
                >
                  {t("premium.getPoints") || "Get Points"}
                </a>
              </div>
            )}

            {/* Name */}
            <div>
              <label style={labelStyle}>
                {t("experiments.experimentName") || "Experiment Name"}
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. SMA Crossover - BTC/USDT"
                style={{
                  ...inputStyle,
                  fontFamily: "var(--font-sans)",
                }}
              />
            </div>

            {/* Asset + Timeframe */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              <div>
                <label style={labelStyle}>{t("experiments.assetSymbol") || "Asset Symbol"}</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {ASSET_SYMBOLS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setNewAsset(s)}
                      style={{
                        padding: "0 10px",
                        height: 28,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                        background:
                          newAsset === s ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.04)",
                        color:
                          newAsset === s ? "var(--color-primary)" : "var(--color-muted-foreground)",
                        border:
                          newAsset === s
                            ? "1px solid rgba(16,185,129,0.3)"
                            : "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>{t("experiments.timeframe") || "Timeframe"}</label>
                <div style={{ display: "flex", gap: 6 }}>
                  {TIMEFRAMES.map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setNewTimeframe(tf)}
                      style={{
                        flex: 1,
                        height: 28,
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        border: "1px solid",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        background:
                          newTimeframe === tf ? "rgba(16,185,129,0.15)" : "var(--color-card)",
                        borderColor:
                          newTimeframe === tf ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                        color:
                          newTimeframe === tf
                            ? "var(--color-primary)"
                            : "var(--color-muted-foreground)",
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
              <label style={labelStyle}>
                {t("experiments.strategyTemplate") || "Strategy Template"}
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {STRATEGY_TEMPLATES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setNewStrategy(s.id)}
                    style={{
                      padding: "0 10px",
                      height: 28,
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      border: "1px solid",
                      cursor: "pointer",
                      background:
                        newStrategy === s.id ? "rgba(16,185,129,0.15)" : "var(--color-card)",
                      borderColor:
                        newStrategy === s.id ? "rgba(16,185,129,0.3)" : "rgba(255,255,255,0.06)",
                      color:
                        newStrategy === s.id
                          ? "var(--color-primary)"
                          : "var(--color-muted-foreground)",
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
                <label style={labelStyle}>{t("experiments.generations") || "Generations"}</label>
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
                <label style={labelStyle}>
                  {t("experiments.populationSize") || "Population Size"}
                </label>
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
                width: "100%",
                height: 44,
                borderRadius: 8,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                border: "none",
                cursor: "pointer",
                opacity: creating || !newName.trim() || !hasEnoughPoints ? 0.5 : 1,
                background: hasEnoughPoints
                  ? "var(--color-bullish)"
                  : "var(--color-muted-foreground)",
                color: hasEnoughPoints ? "#fff" : "var(--color-muted-foreground)",
                fontSize: 14,
              }}
            >
              {creating ? (
                <>
                  <Loader2
                    style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }}
                  />
                  {t("experiments.starting") || "Starting experiment..."}
                </>
              ) : (
                <>
                  <FlaskConical style={{ width: 16, height: 16 }} />
                  <span>{t("experiments.startExperiment") || "Start Experiment"}</span>
                  <span style={{ fontSize: 12, opacity: 0.75 }}>(-{EXPERIMENT_COST} pts)</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Create error */}
        {createError && (
          <div
            style={{ ...cardStyle, borderLeft: "4px solid " + "var(--color-bearish)", padding: 12 }}
          >
            <div style={{ fontSize: 12, color: "var(--color-bearish)" }}>{createError}</div>
          </div>
        )}

        {/* Summary stats */}
        <StatsRow
          stats={[
            {
              label: t("experiments.totalExperiments") || "Total",
              value: String(experiments.length),
              sub: runningCount > 0 ? `${runningCount} running` : undefined,
              color: runningCount > 0 ? "var(--color-bullish)" : "var(--color-foreground)",
            },
            {
              label: t("experiments.completed") || "Completed",
              value: String(completedCount),
              color: "var(--color-bullish)",
            },
            {
              label: t("experiments.bestScore") || "Best Score",
              value: bestOverall ? `${bestOverall.overall}` : "---",
              sub: bestOverall ? bestOverall.grade : undefined,
              color: "var(--color-bullish)",
            },
          ]}
        />

        {/* Experiment list */}
        {experiments.length === 0 ? (
          <EmptyState
            icon="🧪"
            title={t("experiments.noExperiments") || "No experiments yet"}
            message={
              t("experiments.noExperimentsDesc") ||
              "Create your first experiment to start optimizing trading strategies."
            }
          />
        ) : (
          <ScrollArea>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "0 0 16px" }}>
              {experiments.map((exp) => (
                <ExperimentCard key={exp.id} experiment={exp} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </PageLayout>
  );
}
