import { useState } from "react";
import { FlaskConical, Loader2, XCircle, ChevronDown } from "lucide-react";
import { useI18n } from "@/shared/i18n";
import { cardStyle } from "./constants";
import type { ExperimentRecord } from "./constants";
import { extractBestScore, extractElapsed, extractRankedCount } from "./constants";
import { StatusBadge } from "./StatusBadge";

// ---------------------------------------------------------------------------
// Experiment card
// ---------------------------------------------------------------------------

export function ExperimentCard({ experiment }: { experiment: ExperimentRecord }) {
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
    A: "var(--color-bullish)",
    B: "var(--color-bullish)",
    C: "var(--color-neutral-wait)",
    D: "var(--color-bearish)",
    F: "var(--color-bearish)",
  };

  const iconBg =
    experiment.status === "running"
      ? "rgba(16,185,129,0.1)"
      : experiment.status === "completed"
        ? "rgba(34,197,94,0.1)"
        : "rgba(239,68,68,0.1)";

  const iconColor =
    experiment.status === "running"
      ? "var(--color-bullish)"
      : experiment.status === "completed"
        ? "var(--color-bullish)"
        : "var(--color-bearish)";

  return (
    <div style={{ ...cardStyle, border: `1px solid ${"var(--color-border)"}`, overflow: "hidden" }}>
      {/* Main row */}
      <div
        style={{ padding: 16, cursor: "pointer" }}
        onClick={() => setExpanded(!expanded)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.02)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.background = "transparent";
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 8,
                background: iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <FlaskConical style={{ width: 20, height: 20, color: iconColor }} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "var(--color-foreground)" }}>
                {experiment.config.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--color-muted-foreground)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {experiment.config.assetSymbol} · {experiment.config.timeframe}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <StatusBadge status={experiment.status} />
            <ChevronDown
              style={{
                width: 16,
                height: 16,
                color: "var(--color-muted-foreground)",
                transition: "transform 200ms",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            />
          </div>
        </div>

        {/* Quick stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          <div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-muted-foreground)",
                fontWeight: 700,
              }}
            >
              Created
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--color-foreground)",
              }}
            >
              {formatDate(experiment.created_at)}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-muted-foreground)",
                fontWeight: 700,
              }}
            >
              Generations
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                fontWeight: 700,
                color: "var(--color-foreground)",
              }}
            >
              {experiment.config.generations}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-muted-foreground)",
                fontWeight: 700,
              }}
            >
              Population
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--color-foreground)",
              }}
            >
              {experiment.config.populationSize}
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--color-muted-foreground)",
                fontWeight: 700,
              }}
            >
              Duration
            </div>
            <div
              style={{
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--color-foreground)",
              }}
            >
              {elapsedMs ? `${(elapsedMs / 1000).toFixed(1)}s` : "---"}
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            borderTop: `1px solid ${"var(--color-border)"}`,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            background: "rgba(10,14,26,0.5)",
          }}
        >
          {experiment.status === "completed" && bestScore ? (
            <>
              {/* Score summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: "var(--color-background)",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Overall Score
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color: "var(--color-bullish)",
                      }}
                    >
                      {bestScore.overall}
                    </span>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: gradeColor[bestScore.grade] || "var(--color-muted-foreground)",
                      }}
                    >
                      {bestScore.grade}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: "var(--color-background)",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Total Return
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color:
                        bestScore.totalReturn > 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                    }}
                  >
                    {bestScore.totalReturn > 0 ? "+" : ""}
                    {bestScore.totalReturn}%
                  </div>
                </div>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: "var(--color-background)",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Max Drawdown
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-bearish)",
                    }}
                  >
                    -{bestScore.maxDrawdown}%
                  </div>
                </div>
                <div
                  style={{
                    padding: 8,
                    borderRadius: 6,
                    background: "var(--color-background)",
                    border: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Sharpe Ratio
                  </div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color:
                        bestScore.sharpe > 1.5
                          ? "var(--color-bullish)"
                          : bestScore.sharpe > 1
                            ? "var(--color-bullish)"
                            : "var(--color-bearish)",
                    }}
                  >
                    {bestScore.sharpe}
                  </div>
                </div>
              </div>

              {/* Strategy info */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <div style={{ padding: 8, borderRadius: 6, background: "var(--color-background)" }}>
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Template
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {experiment.config.strategyTemplate}
                  </div>
                </div>
                <div style={{ padding: 8, borderRadius: 6, background: "var(--color-background)" }}>
                  <div
                    style={{
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--color-muted-foreground)",
                      fontWeight: 700,
                    }}
                  >
                    Ranked Strategies
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      color: "var(--color-foreground)",
                    }}
                  >
                    {rankedCount}
                  </div>
                </div>
              </div>
            </>
          ) : experiment.status === "running" ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "var(--color-muted-foreground)",
              }}
            >
              <Loader2
                style={{
                  width: 16,
                  height: 16,
                  color: "var(--color-bullish)",
                  animation: "spin 1s linear infinite",
                }}
              />
              <span>
                {translate("experiments.runningMsg") ||
                  "Experiment is running... Results will appear here once complete."}
              </span>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
                color: "var(--color-bearish)",
              }}
            >
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
