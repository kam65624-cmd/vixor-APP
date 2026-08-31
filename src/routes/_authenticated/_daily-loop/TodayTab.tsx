"use client";

import { CheckCircle2, Circle } from "lucide-react";
import type { DailyLoop } from "@/domains/daily-loop/types";
import { CARD_STYLE, SECTION_LABEL_STYLE } from "./constants";
import { StreakWidget } from "./StreakWidget";
import { MorningPrepPhase } from "./MorningPrepPhase";
import { SessionTrackingPhase } from "./SessionTrackingPhase";
import { EodReviewPhase } from "./EodReviewPhase";

// ═══════════════════════════════════════════════
// TODAY TAB
// ═══════════════════════════════════════════════

export function TodayTab({
  loop,
  isLoading,
  streak,
  history,
  morningMutation,
  sessionMutation,
  eodMutation,
}: {
  loop: DailyLoop | undefined;
  isLoading: boolean;
  streak:
    | { current_streak: number; longest_streak: number; last_completed_date: string | null }
    | null
    | undefined;
  history: DailyLoop[];
  morningMutation: any;
  sessionMutation: any;
  eodMutation: any;
}) {
  // ── Progress calculation ──
  const phases = [
    { label: "Morning Prep", done: loop?.morning_prep_completed ?? false },
    {
      label: "Session Tracking",
      done: !!(
        loop?.london_session_traded ||
        loop?.ny_session_traded ||
        loop?.asian_session_traded ||
        loop?.london_session_notes ||
        loop?.ny_session_notes ||
        loop?.asian_session_notes
      ),
    },
    { label: "EOD Review", done: loop?.eod_review_completed ?? false },
  ];
  const completedPhases = phases.filter((p) => p.done).length;
  const progressPct = loop?.completion_percentage ?? 0;

  if (isLoading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="shimmer" style={{ ...CARD_STYLE, height: 160 }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── PROGRESS BAR ── */}
      <div style={{ ...CARD_STYLE, padding: 16 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <span style={SECTION_LABEL_STYLE}>Today&apos;s Progress</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              color: "var(--color-bullish)",
            }}
          >
            {progressPct}%
          </span>
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 9999,
            background: "color-mix(in srgb, var(--color-foreground) 5%, transparent)",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 9999,
              background: "var(--color-bullish)",
              transition: "width 0.7s ease",
              width: `${progressPct}%`,
            }}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {phases.map((phase) => (
            <div key={phase.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {phase.done ? (
                <CheckCircle2 size={14} style={{ color: "var(--color-bullish)" }} />
              ) : (
                <Circle size={14} style={{ color: "rgba(156,163,175,0.4)" }} />
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: phase.done ? "var(--color-bullish)" : "var(--color-muted-foreground)",
                }}
              >
                {phase.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── STREAK WIDGET ── */}
      <StreakWidget streak={streak} history={history} />

      {/* ── PHASE 1: MORNING PREP ── */}
      <MorningPrepPhase
        loop={loop}
        isCompleted={loop?.morning_prep_completed ?? false}
        isSaving={morningMutation.isPending}
        onSubmit={(data) => morningMutation.mutate({ loopId: loop!.id, ...data })}
      />

      {/* ── PHASE 2: SESSION TRACKING ── */}
      <SessionTrackingPhase
        loop={loop}
        isSaving={sessionMutation.isPending}
        onSubmit={(data) => sessionMutation.mutate({ loopId: loop!.id, ...data })}
      />

      {/* ── PHASE 3: EOD REVIEW ── */}
      <EodReviewPhase
        loop={loop}
        isCompleted={loop?.eod_review_completed ?? false}
        isSaving={eodMutation.isPending}
        onSubmit={(data) => eodMutation.mutate({ loopId: loop!.id, ...data })}
      />
    </div>
  );
}
