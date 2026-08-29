"use client";

import { useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { DailyLoop } from "@/domains/daily-loop/types";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { EmptyState } from "@/components/vixor/PageLayout";
import { StreakWidget } from "./StreakWidget";
import { CARD_STYLE, EMOTIONAL_STATES, biasColors } from "./constants";

// ═══════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════

export function HistoryTab({
  history,
  isLoading,
  streak,
  page,
  pageSize,
  total,
  onPageChange,
}: {
  history: DailyLoop[];
  isLoading: boolean;
  streak:
    | { current_streak: number; longest_streak: number; last_completed_date: string | null }
    | null
    | undefined;
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (p: number) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="shimmer" style={{ ...CARD_STYLE, height: 64 }} />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <EmptyState
        icon="📋"
        title="No History Yet"
        message="Complete your first daily loop to start building your track record."
      />
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Streak widget (compact) */}
      <StreakWidget streak={streak} history={history} />

      {/* Loop list */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
          maxHeight: 384,
          overflowY: "auto",
        }}
        className="scrollbar-hide"
      >
        {history.map((loop) => {
          const isExpanded = expandedId === loop.id;
          const date = new Date(loop.date);
          const dateStr = date.toLocaleDateString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
          const emotion = EMOTIONAL_STATES.find((e) => e.value === loop.emotional_state);
          const completionColors =
            loop.completion_percentage >= 100
              ? { bg: `${"var(--color-bullish)"}26`, text: "var(--color-bullish)" }
              : loop.completion_percentage >= 50
                ? { bg: `${"var(--color-bullish)"}26`, text: "var(--color-bullish)" }
                : {
                    bg: "color-mix(in srgb, var(--color-foreground) 5%, transparent)",
                    text: "var(--color-muted-foreground)",
                  };

          return (
            <div key={loop.id} style={{ ...CARD_STYLE, overflow: "hidden" }}>
              <button
                onClick={() => setExpandedId(isExpanded ? null : loop.id)}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 12,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-foreground)",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: completionColors.bg,
                    }}
                  >
                    {loop.completion_percentage >= 100 ? (
                      <CheckCircle2 size={14} style={{ color: "var(--color-bullish)" }} />
                    ) : (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        {loop.completion_percentage}%
                      </span>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {dateStr}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                      {loop.market_bias && (
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 700,
                            padding: "2px 4px",
                            borderRadius: 4,
                            background: biasColors(loop.market_bias).bg,
                            color: biasColors(loop.market_bias).text,
                          }}
                        >
                          {loop.market_bias.toUpperCase()}
                        </span>
                      )}
                      {emotion && <span style={{ fontSize: 10 }}>{emotion.emoji}</span>}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {loop.daily_pnl != null && (
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "var(--font-mono)",
                        color:
                          loop.daily_pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                      }}
                    >
                      {loop.daily_pnl >= 0 ? "+" : ""}${Number(loop.daily_pnl).toFixed(2)}
                    </span>
                  )}
                  <ChevronRight
                    size={12}
                    style={{
                      color: "var(--color-muted-foreground)",
                      transition: "transform 0.15s ease",
                      transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                    }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div
                  style={{
                    padding: "0 12px 12px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    borderTop: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3, 1fr)",
                      gap: 8,
                      textAlign: "center",
                      paddingTop: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-foreground)",
                        }}
                      >
                        {loop.trades_taken}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color: "var(--color-muted-foreground)",
                          textTransform: "uppercase",
                        }}
                      >
                        Trades
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-bullish)",
                        }}
                      >
                        {loop.rules_followed}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color: "var(--color-muted-foreground)",
                          textTransform: "uppercase",
                        }}
                      >
                        Rules ✓
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "var(--font-mono)",
                          color: "var(--color-bearish)",
                        }}
                      >
                        {loop.rules_broken}
                      </div>
                      <div
                        style={{
                          fontSize: 8,
                          color: "var(--color-muted-foreground)",
                          textTransform: "uppercase",
                        }}
                      >
                        Rules ✗
                      </div>
                    </div>
                  </div>
                  {loop.key_levels && (
                    <div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        Key Levels:
                      </span>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {loop.key_levels}
                      </p>
                    </div>
                  )}
                  {loop.lessons_learned && (
                    <div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        Lessons:
                      </span>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {loop.lessons_learned}
                      </p>
                    </div>
                  )}
                  {loop.tomorrow_plan && (
                    <div>
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: "var(--color-muted-foreground)",
                        }}
                      >
                        Tomorrow:
                      </span>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {loop.tomorrow_plan}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {total > pageSize && (
        <PaginationBar page={page} pageSize={pageSize} total={total} onPageChange={onPageChange} />
      )}
    </div>
  );
}
