"use client";

// createFileRoute not needed in component file from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sun,
  Clock,
  Moon,
  Flame,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  Lightbulb,
  Target,
  Brain,
  History,
} from "lucide-react";
import {
  getTodayLoop,
  updateMorningPrep,
  updateSessionTracking,
  updateEodReview,
  getLoopHistory,
  getStreak,
} from "@/domains/daily-loop/functions";
import type {
  DailyLoop,
  MarketBias,
  EmotionalState,
  TradingSession,
} from "@/domains/daily-loop/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { ExpandableWidget } from "@/components/vixor/ExpandableWidget";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { AnalystReportPanel } from "@/components/vixor/AnalystReportPanel";
import { PageLayout, ScrollArea, EmptyState } from "@/components/vixor/PageLayout";

// ═══════════════════════════════════════════════
// SHARED STYLE CONSTANTS
// ═══════════════════════════════════════════════

// Gradient endpoint — darker shade of "var(--color-bullish)" for depth
const GREEN_DARK = "#059669";

const CSS_VARS: React.CSSProperties = {
  "--color-primary": "var(--color-bullish)",
  "--color-primary-foreground": "var(--color-foreground)",
  "--color-muted": "rgba(255,255,255,0.05)",
  "--color-muted-foreground": "var(--color-muted-foreground)",
  "--color-card": "var(--color-card)",
  "--color-card-hover": "rgba(124,155,196,0.06)",
  "--color-border": "var(--color-border)",
  "--color-bullish": "var(--color-bullish)",
  "--color-bearish": "var(--color-bearish)",
  "--color-neutral-wait": "var(--color-neutral-wait)",
  "--color-info": "var(--color-bullish)",
  "--color-foreground": "var(--color-foreground)",
  "--gradient-primary": `linear-gradient(135deg, ${"var(--color-bullish)"}, ${GREEN_DARK})`,
  "--shadow-glow": `0 0 20px ${"var(--color-bullish)"}4D`,
} as React.CSSProperties;

const CARD_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 12,
};

const GRADIENT_BTN_STYLE: React.CSSProperties = {
  background: `linear-gradient(135deg, ${"var(--color-bullish)"}, ${GREEN_DARK})`,
  color: "var(--color-foreground)",
  boxShadow: `0 0 20px ${"var(--color-bullish)"}4D`,
};

const INPUT_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 12,
  outline: "none",
  width: "100%",
};

const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: "none",
  height: 80,
};

const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "block",
  marginBottom: 8,
};

const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

// ═══════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════

function biasColors(bias: MarketBias | undefined | null): { bg: string; text: string; border: string } {
  if (bias === "bullish") return { bg: `${"var(--color-bullish)"}26`, text: "var(--color-bullish)", border: `${"var(--color-bullish)"}66` };
  if (bias === "bearish") return { bg: `${"var(--color-bearish)"}26`, text: "var(--color-bearish)", border: `${"var(--color-bearish)"}66` };
  return { bg: `${"var(--color-neutral-wait)"}26`, text: "var(--color-neutral-wait)", border: `${"var(--color-neutral-wait)"}66` };
}

// ═══════════════════════════════════════════════
// EMOTIONAL STATE CONFIG
// ═══════════════════════════════════════════════

const EMOTIONAL_STATES: {
  value: EmotionalState;
  emoji: string;
  label: string;
  color: { bg: string; text: string; border: string };
}[] = [
  {
    value: "disciplined",
    emoji: "💪",
    label: "Disciplined",
    color: { bg: `${"var(--color-bullish)"}26`, text: "var(--color-bullish)", border: `${"var(--color-bullish)"}66` },
  },
  {
    value: "calm",
    emoji: "🧘",
    label: "Calm",
    color: { bg: `${"var(--color-bullish)"}26`, text: "var(--color-bullish)", border: `${"var(--color-bullish)"}66` },
  },
  {
    value: "anxious",
    emoji: "😰",
    label: "Anxious",
    color: { bg: `${"var(--color-neutral-wait)"}26`, text: "var(--color-neutral-wait)", border: `${"var(--color-neutral-wait)"}66` },
  },
  {
    value: "fomo",
    emoji: "🏃",
    label: "FOMO",
    color: { bg: `${"var(--color-neutral-wait)"}26`, text: "var(--color-neutral-wait)", border: `${"var(--color-neutral-wait)"}66` },
  },
  {
    value: "revenge",
    emoji: "🔥",
    label: "Revenge",
    color: { bg: `${"var(--color-bearish)"}26`, text: "var(--color-bearish)", border: `${"var(--color-bearish)"}66` },
  },
  {
    value: "tired",
    emoji: "😴",
    label: "Tired",
    color: { bg: "var(--color-card-hover)", text: "var(--color-muted-foreground)", border: "var(--color-border)" },
  },
];

// ═══════════════════════════════════════════════
// SESSION CONFIG
// ═══════════════════════════════════════════════

const SESSIONS: {
  key: TradingSession;
  label: string;
  hours: string;
  startHour: number;
  endHour: number;
}[] = [
  { key: "london", label: "London", hours: "8:00–16:00 UTC", startHour: 8, endHour: 16 },
  { key: "ny", label: "New York", hours: "13:00–22:00 UTC", startHour: 13, endHour: 22 },
  { key: "asian", label: "Asian", hours: "0:00–8:00 UTC", startHour: 0, endHour: 8 },
];

function getActiveSession(): TradingSession | null {
  const hour = new Date().getUTCHours();
  for (const s of SESSIONS) {
    if (hour >= s.startHour && hour < s.endHour) return s.key;
  }
  return null;
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════

export function DailyLoopPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");
  const [historyPage, setHistoryPage] = useState(1);
  const HISTORY_PAGE_SIZE = 10;

  // Stable server fn refs
  const fetchTodayLoop = useStableServerFn(getTodayLoop);
  const fetchHistory = useStableServerFn(getLoopHistory);
  const fetchStreak = useStableServerFn(getStreak);
  const morningPrepFn = useStableServerFn(updateMorningPrep);
  const sessionFn = useStableServerFn(updateSessionTracking);
  const eodFn = useStableServerFn(updateEodReview);

  // Queries
  const loopQuery = useQuery({
    queryKey: ["daily-loop-today"],
    queryFn: () => fetchTodayLoop({}),
    staleTime: 15_000,
  });

  const historyQuery = useQuery({
    queryKey: ["daily-loop-history", historyPage],
    queryFn: () =>
      fetchHistory({
        data: {
          limit: HISTORY_PAGE_SIZE,
          offset: (historyPage - 1) * HISTORY_PAGE_SIZE,
        },
      }),
    staleTime: 60_000,
    enabled: activeTab === "history",
  });

  const streakQuery = useQuery({
    queryKey: ["daily-loop-streak"],
    queryFn: () => fetchStreak({}),
    staleTime: 30_000,
  });

  const loop = loopQuery.data as DailyLoop | undefined;
  const streak = streakQuery.data;
  const historyRaw = historyQuery.data as
    | { items: DailyLoop[]; total: number; hasMore: boolean }
    | undefined;
  const history = historyRaw?.items ?? [];
  const historyTotal = historyRaw?.total ?? 0;
  const isLoading = loopQuery.isLoading;

  // Invalidate all daily-loop queries
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["daily-loop-today"] });
    queryClient.invalidateQueries({ queryKey: ["daily-loop-history"] });
    queryClient.invalidateQueries({ queryKey: ["daily-loop-streak"] });
  }, [queryClient]);

  // Morning prep mutation
  const morningMutation = useMutation({
    mutationFn: (data: {
      loopId: string;
      market_bias: MarketBias;
      key_levels: string;
      watchlist_reviewed: boolean;
    }) => morningPrepFn({ data }),
    onSuccess: invalidateAll,
  });

  // Session mutation
  const sessionMutation = useMutation({
    mutationFn: (data: {
      loopId: string;
      session: TradingSession;
      traded: boolean;
      notes: string;
    }) => sessionFn({ data }),
    onSuccess: invalidateAll,
  });

  // EOD mutation
  const eodMutation = useMutation({
    mutationFn: (data: {
      loopId: string;
      emotional_state: EmotionalState;
      lessons_learned: string;
      tomorrow_plan: string;
      daily_pnl?: number | null;
      trades_taken?: number;
      rules_followed?: number;
      rules_broken?: number;
    }) => eodFn({ data }),
    onSuccess: invalidateAll,
  });

  return (
    <PageLayout
      title="Daily Loop"
      badge="ROUTINE BUILDER"
      badgeColor={"var(--color-bullish)"}
      tabs={["Today", "History"]}
      activeTab={activeTab === "today" ? "Today" : "History"}
      onTabChange={(tab) => setActiveTab(tab === "Today" ? "today" : "history")}
    >
      <div style={CSS_VARS}>
        <ScrollArea>
          <div
            style={{
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              paddingBottom: "32px",
            }}
          >
            {activeTab === "today" ? (
              <TodayTab
                loop={loop}
                isLoading={isLoading}
                streak={streak}
                history={history}
                morningMutation={morningMutation}
                sessionMutation={sessionMutation}
                eodMutation={eodMutation}
              />
            ) : (
              <HistoryTab
                history={history}
                isLoading={historyQuery.isLoading}
                streak={streak}
                page={historyPage}
                pageSize={HISTORY_PAGE_SIZE}
                total={historyTotal}
                onPageChange={setHistoryPage}
              />
            )}

            {/* ── WEEKLY BEHAVIORAL REPORT (Analyst Agent) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
                <Brain size={14} style={{ color: "var(--color-bullish)" }} />
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  AI Behavioral Report
                </span>
              </div>
              <AnalystReportPanel />
            </div>
          </div>
        </ScrollArea>
      </div>
    </PageLayout>
  );
}

// ═══════════════════════════════════════════════
// TODAY TAB
// ═══════════════════════════════════════════════

function TodayTab({
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
          <div
            key={i}
            className="shimmer"
            style={{ ...CARD_STYLE, height: 160 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* ── PROGRESS BAR ── */}
      <div style={{ ...CARD_STYLE, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={SECTION_LABEL_STYLE}>Today&apos;s Progress</span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
            background: "rgba(255,255,255,0.05)",
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

// ═══════════════════════════════════════════════
// STREAK WIDGET
// ═══════════════════════════════════════════════

function StreakWidget({
  streak,
  history,
}: {
  streak:
    | { current_streak: number; longest_streak: number; last_completed_date: string | null }
    | null
    | undefined;
  history: DailyLoop[];
}) {
  const currentStreak = streak?.current_streak ?? 0;
  const longestStreak = streak?.longest_streak ?? 0;

  // Generate last 30 days heatmap
  const heatmapDays = useMemo(() => {
    const days = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const loop = history.find((l) => l.date === dateStr);
      const completion = loop?.completion_percentage ?? 0;
      days.push({
        date: dateStr,
        day: d.toLocaleDateString([], { weekday: "short" }),
        completion,
      });
    }
    return days;
  }, [history]);

  return (
    <div style={{ ...CARD_STYLE, padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Flame
            size={14}
            style={{ color: currentStreak > 0 ? "var(--color-neutral-wait)" : "var(--color-muted-foreground)" }}
          />
          <span style={SECTION_LABEL_STYLE}>Streak</span>
        </div>
        {currentStreak > 0 && (
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-neutral-wait)" }}>
            🔥 {currentStreak} day{currentStreak !== 1 ? "s" : ""} in a row!
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-foreground)",
            }}
          >
            {currentStreak}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Current</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-bullish)",
            }}
          >
            {longestStreak}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Longest</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-bullish)",
            }}
          >
            {history.filter((l) => l.completion_percentage >= 100).length}
          </div>
          <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9 }}>Completed</div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ ...SECTION_LABEL_STYLE, fontSize: 9, marginBottom: 8 }}>Last 30 Days</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(10, 1fr)",
            gap: 4,
          }}
        >
          {heatmapDays.map((day) => {
            const bg =
              day.completion >= 100
                ? "var(--color-bullish)"
                : day.completion >= 66
                  ? `${"var(--color-bullish)"}99`
                  : day.completion >= 33
                    ? `${"var(--color-bullish)"}4D`
                    : "rgba(255,255,255,0.05)";
            return (
              <div
                key={day.date}
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: bg,
                }}
                title={`${day.date}: ${day.completion}%`}
              />
            );
          })}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            justifyContent: "flex-end",
            marginTop: 4,
          }}
        >
          <span style={{ fontSize: 8, color: "var(--color-muted-foreground)" }}>Less</span>
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "rgba(255,255,255,0.05)" }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `${"var(--color-bullish)"}4D` }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, background: `${"var(--color-bullish)"}99` }} />
          <div style={{ width: 10, height: 10, borderRadius: 3, background: "var(--color-bullish)" }} />
          <span style={{ fontSize: 8, color: "var(--color-muted-foreground)" }}>More</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PHASE 1: MORNING PREP
// ═══════════════════════════════════════════════

function MorningPrepPhase({
  loop,
  isCompleted,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isCompleted: boolean;
  isSaving: boolean;
  onSubmit: (data: {
    market_bias: MarketBias;
    key_levels: string;
    watchlist_reviewed: boolean;
  }) => void;
}) {
  const [bias, setBias] = useState<MarketBias>((loop?.market_bias as MarketBias) ?? "neutral");
  const [keyLevels, setKeyLevels] = useState(loop?.key_levels ?? "");
  const [watchlistReviewed, setWatchlistReviewed] = useState(loop?.watchlist_reviewed ?? false);

  const handleSubmit = useCallback(() => {
    if (!loop) return;
    onSubmit({ market_bias: bias, key_levels: keyLevels, watchlist_reviewed: watchlistReviewed });
  }, [loop, bias, keyLevels, watchlistReviewed, onSubmit]);

  return (
    <ExpandableWidget
      title="Morning Prep"
      subtitle={isCompleted ? "Completed ✓" : "Set your daily bias & levels"}
      icon={Sun}
      variant={isCompleted ? "bullish" : "info"}
      defaultExpanded={!isCompleted}
      badge={isCompleted ? "DONE" : undefined}
    >
      {isCompleted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={SECTION_LABEL_STYLE}>Market Bias:</span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                border: `1px solid ${biasColors(loop?.market_bias).border}`,
                background: biasColors(loop?.market_bias).bg,
                color: biasColors(loop?.market_bias).text,
              }}
            >
              {loop?.market_bias === "bullish"
                ? "📈 Bullish"
                : loop?.market_bias === "bearish"
                  ? "📉 Bearish"
                  : "↔️ Neutral"}
            </span>
          </div>
          {loop?.key_levels && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Key Levels</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.key_levels}
              </p>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={12} style={{ color: "var(--color-bullish)" }} />
            <span style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
              Watchlist {loop?.watchlist_reviewed ? "reviewed" : "not reviewed"}
            </span>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Market Bias */}
          <div>
            <label style={LABEL_STYLE}>Market Bias</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {([
                { value: "bullish" as MarketBias, emoji: "📈", label: "Bullish" },
                { value: "bearish" as MarketBias, emoji: "📉", label: "Bearish" },
                { value: "neutral" as MarketBias, emoji: "↔️", label: "Neutral" },
              ] as const).map((opt) => {
                const colors = biasColors(opt.value);
                const isSelected = bias === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setBias(opt.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? colors.border : "var(--color-border)"}`,
                      fontSize: 12,
                      fontWeight: 700,
                      background: isSelected ? colors.bg : "var(--color-card)",
                      color: isSelected ? colors.text : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{opt.emoji}</span>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Key Levels */}
          <div>
            <label style={LABEL_STYLE}>Key Support / Resistance Levels</label>
            <textarea
              value={keyLevels}
              onChange={(e) => setKeyLevels(e.target.value)}
              placeholder="e.g. S: 1.0850, 1.0820 | R: 1.0900, 1.0940"
              style={TEXTAREA_STYLE}
            />
          </div>

          {/* Watchlist Reviewed */}
          <button
            type="button"
            onClick={() => setWatchlistReviewed(!watchlistReviewed)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            {watchlistReviewed ? (
              <CheckCircle2 size={14} style={{ color: "var(--color-bullish)" }} />
            ) : (
              <Circle size={14} style={{ color: "var(--color-muted-foreground)" }} />
            )}
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: watchlistReviewed ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              }}
            >
              Watchlist Reviewed
            </span>
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              ...GRADIENT_BTN_STYLE,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "transform 0.15s ease",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            {isSaving ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Sun size={12} />
            )}
            Complete Morning Prep
          </button>
        </div>
      )}
    </ExpandableWidget>
  );
}

// ═══════════════════════════════════════════════
// PHASE 2: SESSION TRACKING
// ═══════════════════════════════════════════════

function SessionTrackingPhase({
  loop,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isSaving: boolean;
  onSubmit: (data: { session: TradingSession; traded: boolean; notes: string }) => void;
}) {
  const activeSession = getActiveSession();
  const [savingSession, setSavingSession] = useState<TradingSession | null>(null);

  const handleSessionToggle = useCallback(
    (session: TradingSession, traded: boolean, notes: string) => {
      setSavingSession(session);
      onSubmit({ session, traded, notes });
    },
    [onSubmit],
  );

  return (
    <ExpandableWidget
      title="Session Tracking"
      subtitle="Track your trading sessions"
      icon={Clock}
      variant="info"
      defaultExpanded={true}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SESSIONS.map((session) => {
          const tradedField = `${session.key}_session_traded` as keyof DailyLoop;
          const notesField = `${session.key}_session_notes` as keyof DailyLoop;
          const isTraded = (loop?.[tradedField] as boolean) ?? false;
          const notes = (loop?.[notesField] as string) ?? "";
          const isActive = activeSession === session.key;

          return (
            <SessionCard
              key={session.key}
              session={session}
              isActive={isActive}
              isTraded={isTraded}
              notes={notes}
              isSaving={isSaving && savingSession === session.key}
              onToggle={(traded, notesVal) => handleSessionToggle(session.key, traded, notesVal)}
            />
          );
        })}
      </div>
    </ExpandableWidget>
  );
}

function SessionCard({
  session,
  isActive,
  isTraded,
  notes,
  isSaving,
  onToggle,
}: {
  session: { key: TradingSession; label: string; hours: string };
  isActive: boolean;
  isTraded: boolean;
  notes: string;
  isSaving: boolean;
  onToggle: (traded: boolean, notes: string) => void;
}) {
  const [localNotes, setLocalNotes] = useState(notes);
  const [localTraded, setLocalTraded] = useState(isTraded);

  // Sync from props
  useMemo(() => {
    setLocalNotes(notes);
    setLocalTraded(isTraded);
  }, [isTraded, notes]);

  const handleSave = useCallback(() => {
    onToggle(localTraded, localNotes);
  }, [localTraded, localNotes, onToggle]);

  return (
    <div
      style={{
        borderRadius: 8,
        border: `1px solid ${isActive ? `${"var(--color-bullish)"}66` : "var(--color-border)"}`,
        background: isActive ? `${"var(--color-bullish)"}0D` : "var(--color-card)",
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Clock
            size={12}
            style={{ color: isActive ? "var(--color-bullish)" : "var(--color-muted-foreground)" }}
          />
          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>{session.label}</span>
          <span
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {session.hours}
          </span>
        </div>
        {isActive && (
          <span
            style={{
              fontSize: 8,
              fontWeight: 700,
              textTransform: "uppercase",
              padding: "2px 6px",
              borderRadius: 4,
              background: `${"var(--color-bullish)"}26`,
              color: "var(--color-bullish)",
              border: `1px solid ${"var(--color-bullish)"}4D`,
              animation: "pulse 2s ease-in-out infinite",
            }}
          >
            ACTIVE
          </span>
        )}
      </div>

      {/* Did you trade toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={SECTION_LABEL_STYLE}>Did you trade?</span>
        <button
          onClick={() => setLocalTraded(!localTraded)}
          style={{
            padding: "4px 12px",
            borderRadius: 6,
            fontSize: 10,
            fontWeight: 700,
            border: `1px solid ${
              localTraded ? `${"var(--color-bullish)"}66` : "var(--color-border)"
            }`,
            background: localTraded ? `${"var(--color-bullish)"}26` : "var(--color-card)",
            color: localTraded ? "var(--color-bullish)" : "var(--color-muted-foreground)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          {localTraded ? "✓ Yes" : "No"}
        </button>
      </div>

      {/* Notes */}
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder={`Notes for ${session.label} session...`}
        style={{
          ...INPUT_STYLE,
          borderRadius: 6,
          fontSize: 11,
          padding: "8px 10px",
          height: 56,
        }}
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 6,
          fontSize: 10,
          fontWeight: 700,
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          color: "var(--color-foreground)",
          cursor: isSaving ? "not-allowed" : "pointer",
          transition: "all 0.15s ease",
          opacity: isSaving ? 0.5 : 1,
        }}
      >
        {isSaving ? (
          <Loader2 size={10} style={{ animation: "spin 1s linear infinite" }} />
        ) : (
          <CheckCircle2 size={10} />
        )}
        Save {session.label} Session
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════
// PHASE 3: EOD REVIEW
// ═══════════════════════════════════════════════

function EodReviewPhase({
  loop,
  isCompleted,
  isSaving,
  onSubmit,
}: {
  loop: DailyLoop | undefined;
  isCompleted: boolean;
  isSaving: boolean;
  onSubmit: (data: {
    emotional_state: EmotionalState;
    lessons_learned: string;
    tomorrow_plan: string;
    daily_pnl?: number | null;
    trades_taken?: number;
    rules_followed?: number;
    rules_broken?: number;
  }) => void;
}) {
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(
    loop?.emotional_state ?? "calm",
  );
  const [lessons, setLessons] = useState(loop?.lessons_learned ?? "");
  const [tomorrowPlan, setTomorrowPlan] = useState(loop?.tomorrow_plan ?? "");
  const [dailyPnl, setDailyPnl] = useState(loop?.daily_pnl?.toString() ?? "");
  const [tradesTaken, setTradesTaken] = useState(loop?.trades_taken?.toString() ?? "0");
  const [rulesFollowed, setRulesFollowed] = useState(loop?.rules_followed?.toString() ?? "0");
  const [rulesBroken, setRulesBroken] = useState(loop?.rules_broken?.toString() ?? "0");

  const handleSubmit = useCallback(() => {
    onSubmit({
      emotional_state: emotionalState,
      lessons_learned: lessons,
      tomorrow_plan: tomorrowPlan,
      daily_pnl: dailyPnl ? parseFloat(dailyPnl) : null,
      trades_taken: parseInt(tradesTaken) || 0,
      rules_followed: parseInt(rulesFollowed) || 0,
      rules_broken: parseInt(rulesBroken) || 0,
    });
  }, [
    emotionalState,
    lessons,
    tomorrowPlan,
    dailyPnl,
    tradesTaken,
    rulesFollowed,
    rulesBroken,
    onSubmit,
  ]);

  return (
    <ExpandableWidget
      title="End of Day Review"
      subtitle={isCompleted ? "Completed ✓" : "Reflect on your trading day"}
      icon={Moon}
      variant={isCompleted ? "bullish" : "neutral"}
      defaultExpanded={!isCompleted}
      badge={isCompleted ? "DONE" : undefined}
    >
      {isCompleted ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loop?.daily_pnl != null && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={SECTION_LABEL_STYLE}>Daily P&L</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: loop.daily_pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
                }}
              >
                {loop.daily_pnl >= 0 ? "+" : ""}${Number(loop.daily_pnl).toFixed(2)}
              </span>
            </div>
          )}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: "var(--color-foreground)",
                }}
              >
                {loop?.trades_taken ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Trades</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: "var(--color-bullish)",
                }}
              >
                {loop?.rules_followed ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Rules ✓</div>
            </div>
            <div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: "var(--color-bearish)",
                }}
              >
                {loop?.rules_broken ?? 0}
              </div>
              <div style={{ fontSize: 9, color: "var(--color-muted-foreground)" }}>Rules ✗</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={SECTION_LABEL_STYLE}>Mood:</span>
            <span style={{ fontSize: 12, color: "var(--color-foreground)" }}>
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.emoji}{" "}
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.label}
            </span>
          </div>
          {loop?.lessons_learned && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Lessons</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.lessons_learned}
              </p>
            </div>
          )}
          {loop?.tomorrow_plan && (
            <div>
              <span style={{ ...LABEL_STYLE, marginBottom: 4 }}>Tomorrow&apos;s Plan</span>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.6 }}>
                {loop.tomorrow_plan}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Daily P&L */}
          <div>
            <label style={LABEL_STYLE}>Daily P&L</label>
            <input
              type="number"
              step="0.01"
              value={dailyPnl}
              onChange={(e) => setDailyPnl(e.target.value)}
              placeholder="0.00"
              style={{ ...INPUT_STYLE, fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
            />
          </div>

          {/* Trades / Rules */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
            }}
          >
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Trades</label>
              <input
                type="number"
                min="0"
                value={tradesTaken}
                onChange={(e) => setTradesTaken(e.target.value)}
                style={{ ...INPUT_STYLE, borderRadius: 6, padding: "8px 10px", fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Rules ✓</label>
              <input
                type="number"
                min="0"
                value={rulesFollowed}
                onChange={(e) => setRulesFollowed(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: "var(--color-bullish)",
                }}
              />
            </div>
            <div>
              <label style={{ ...LABEL_STYLE, fontSize: 9, marginBottom: 4 }}>Rules ✗</label>
              <input
                type="number"
                min="0"
                value={rulesBroken}
                onChange={(e) => setRulesBroken(e.target.value)}
                style={{
                  ...INPUT_STYLE,
                  borderRadius: 6,
                  padding: "8px 10px",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  color: "var(--color-bearish)",
                }}
              />
            </div>
          </div>

          {/* Emotional State */}
          <div>
            <label style={LABEL_STYLE}>How are you feeling?</label>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {EMOTIONAL_STATES.map((state) => {
                const isSelected = emotionalState === state.value;
                return (
                  <button
                    key={state.value}
                    onClick={() => setEmotionalState(state.value)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 4,
                      padding: "8px",
                      borderRadius: 8,
                      border: `1px solid ${isSelected ? state.color.border : "var(--color-border)"}`,
                      fontSize: 10,
                      fontWeight: 700,
                      background: isSelected ? state.color.bg : "var(--color-card)",
                      color: isSelected ? state.color.text : "var(--color-muted-foreground)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span>{state.emoji}</span>
                    {state.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <label style={LABEL_STYLE}>
              <Lightbulb size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              Lessons Learned
            </label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What did you learn today?"
              style={TEXTAREA_STYLE}
            />
          </div>

          {/* Tomorrow's Plan */}
          <div>
            <label style={LABEL_STYLE}>
              <Brain size={10} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
              Tomorrow&apos;s Plan
            </label>
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="What will you focus on tomorrow?"
              style={TEXTAREA_STYLE}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            style={{
              ...GRADIENT_BTN_STYLE,
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              border: "none",
              cursor: isSaving ? "not-allowed" : "pointer",
              transition: "transform 0.15s ease",
              opacity: isSaving ? 0.5 : 1,
            }}
          >
            {isSaving ? (
              <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <Moon size={12} />
            )}
            Complete EOD Review
          </button>
        </div>
      )}
    </ExpandableWidget>
  );
}

// ═══════════════════════════════════════════════
// HISTORY TAB
// ═══════════════════════════════════════════════

function HistoryTab({
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
          <div
            key={i}
            className="shimmer"
            style={{ ...CARD_STYLE, height: 64 }}
          />
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
                : { bg: "rgba(255,255,255,0.05)", text: "var(--color-muted-foreground)" };

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
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
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
                        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                        color: loop.daily_pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
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
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          color: "var(--color-foreground)",
                        }}
                      >
                        {loop.trades_taken}
                      </div>
                      <div style={{ fontSize: 8, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                        Trades
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          color: "var(--color-bullish)",
                        }}
                      >
                        {loop.rules_followed}
                      </div>
                      <div style={{ fontSize: 8, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                        Rules ✓
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          color: "var(--color-bearish)",
                        }}
                      >
                        {loop.rules_broken}
                      </div>
                      <div style={{ fontSize: 8, color: "var(--color-muted-foreground)", textTransform: "uppercase" }}>
                        Rules ✗
                      </div>
                    </div>
                  </div>
                  {loop.key_levels && (
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
                        Key Levels:
                      </span>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {loop.key_levels}
                      </p>
                    </div>
                  )}
                  {loop.lessons_learned && (
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
                        Lessons:
                      </span>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", marginTop: 2 }}>
                        {loop.lessons_learned}
                      </p>
                    </div>
                  )}
                  {loop.tomorrow_plan && (
                    <div>
                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "var(--color-muted-foreground)" }}>
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