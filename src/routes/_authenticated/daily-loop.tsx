"use client";

import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sun,
  Clock,
  Moon,
  Flame,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  Circle,
  Loader2,
  Calendar,
  ArrowRight,
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
import { ExpandableWidget, MiniWidget, WidgetGroup } from "@/components/vixor/ExpandableWidget";
import { cn } from "@/shared/utils";

export const Route = createFileRoute("/_authenticated/daily-loop")({
  head: () => ({ meta: [{ title: "Daily Loop — Vixor" }] }),
  component: DailyLoopPage,
});

// ═══════════════════════════════════════════════
// EMOTIONAL STATE CONFIG
// ═══════════════════════════════════════════════
const EMOTIONAL_STATES: { value: EmotionalState; emoji: string; label: string; color: string }[] = [
  { value: "disciplined", emoji: "💪", label: "Disciplined", color: "bg-bullish/15 text-bullish border-bullish/40" },
  { value: "calm", emoji: "🧘", label: "Calm", color: "bg-info/15 text-info border-info/40" },
  { value: "anxious", emoji: "😰", label: "Anxious", color: "bg-neutral-wait/15 text-neutral-wait border-neutral-wait/40" },
  { value: "fomo", emoji: "🏃", label: "FOMO", color: "bg-[#FF9800]/15 text-[#FF9800] border-[#FF9800]/40" },
  { value: "revenge", emoji: "🔥", label: "Revenge", color: "bg-bearish/15 text-bearish border-bearish/40" },
  { value: "tired", emoji: "😴", label: "Tired", color: "bg-muted text-muted-foreground border-border" },
];

// ═══════════════════════════════════════════════
// SESSION CONFIG
// ═══════════════════════════════════════════════
const SESSIONS: { key: TradingSession; label: string; hours: string; startHour: number; endHour: number }[] = [
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

function DailyLoopPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"today" | "history">("today");

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
    queryKey: ["daily-loop-history"],
    queryFn: () => fetchHistory({ data: { limit: 30 } }),
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
  const history = (historyQuery.data ?? []) as DailyLoop[];
  const isLoading = loopQuery.isLoading;

  // Invalidate all daily-loop queries
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["daily-loop-today"] });
    queryClient.invalidateQueries({ queryKey: ["daily-loop-history"] });
    queryClient.invalidateQueries({ queryKey: ["daily-loop-streak"] });
  }, [queryClient]);

  // Morning prep mutation
  const morningMutation = useMutation({
    mutationFn: (data: { loopId: string; market_bias: MarketBias; key_levels: string; watchlist_reviewed: boolean }) =>
      morningPrepFn({ data }),
    onSuccess: invalidateAll,
  });

  // Session mutation
  const sessionMutation = useMutation({
    mutationFn: (data: { loopId: string; session: TradingSession; traded: boolean; notes: string }) =>
      sessionFn({ data }),
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
    <div className="space-y-5 pb-6 animate-in fade-in duration-500">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-card border border-border flex items-center justify-center">
            <Target className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight leading-none">Daily Loop</h1>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
              Build consistency, one day at a time
            </div>
          </div>
        </div>
      </div>

      {/* ── TAB SWITCHER ── */}
      <div className="flex gap-1 p-1 rounded-lg bg-card border border-border">
        {(["today", "history"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === tab
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab === "today" ? "Today" : "History"}
          </button>
        ))}
      </div>

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
        <HistoryTab history={history} isLoading={historyQuery.isLoading} streak={streak} />
      )}
    </div>
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
  streak: { current_streak: number; longest_streak: number; last_completed_date: string | null } | null | undefined;
  history: DailyLoop[];
  morningMutation: any;
  sessionMutation: any;
  eodMutation: any;
}) {
  // ── Progress calculation ──
  const phases = [
    { label: "Morning Prep", done: loop?.morning_prep_completed ?? false },
    { label: "Session Tracking", done: !!(loop?.london_session_traded || loop?.ny_session_traded || loop?.asian_session_traded || loop?.london_session_notes || loop?.ny_session_notes || loop?.asian_session_notes) },
    { label: "EOD Review", done: loop?.eod_review_completed ?? false },
  ];
  const completedPhases = phases.filter((p) => p.done).length;
  const progressPct = loop?.completion_percentage ?? 0;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="vixor-card h-40 shimmer" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── PROGRESS BAR ── */}
      <div className="vixor-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Today's Progress
          </span>
          <span className="text-sm font-bold font-mono text-primary">{progressPct}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden mb-3">
          <div
            className="h-full rounded-full bg-primary transition-all duration-700"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          {phases.map((phase, i) => (
            <div key={phase.label} className="flex items-center gap-1.5">
              {phase.done ? (
                <CheckCircle2 className="size-4 text-primary" />
              ) : (
                <Circle className="size-4 text-muted-foreground/40" />
              )}
              <span
                className={cn(
                  "text-[10px] font-bold",
                  phase.done ? "text-primary" : "text-muted-foreground",
                )}
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
  streak: { current_streak: number; longest_streak: number; last_completed_date: string | null } | null | undefined;
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
    <div className="vixor-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className={cn("size-4", currentStreak > 0 ? "text-[#FF9800]" : "text-muted-foreground")} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Streak
          </span>
        </div>
        {currentStreak > 0 && (
          <span className="text-xs font-bold text-[#FF9800]">
            🔥 {currentStreak} day{currentStreak !== 1 ? "s" : ""} in a row!
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-foreground">{currentStreak}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Current
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-primary">{longestStreak}</div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Longest
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold font-mono text-bullish">
            {history.filter((l) => l.completion_percentage >= 100).length}
          </div>
          <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
            Completed
          </div>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="space-y-1">
        <div className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
          Last 30 Days
        </div>
        <div className="grid grid-cols-10 gap-1">
          {heatmapDays.map((day) => {
            const intensity =
              day.completion >= 100
                ? "bg-primary"
                : day.completion >= 66
                  ? "bg-primary/60"
                  : day.completion >= 33
                    ? "bg-primary/30"
                    : "bg-muted";
            return (
              <div
                key={day.date}
                className={cn("size-4 rounded-sm", intensity)}
                title={`${day.date}: ${day.completion}%`}
              />
            );
          })}
        </div>
        <div className="flex items-center gap-2 justify-end mt-1">
          <span className="text-[8px] text-muted-foreground">Less</span>
          <div className="size-2.5 rounded-sm bg-muted" />
          <div className="size-2.5 rounded-sm bg-primary/30" />
          <div className="size-2.5 rounded-sm bg-primary/60" />
          <div className="size-2.5 rounded-sm bg-primary" />
          <span className="text-[8px] text-muted-foreground">More</span>
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
  onSubmit: (data: { market_bias: MarketBias; key_levels: string; watchlist_reviewed: boolean }) => void;
}) {
  const [bias, setBias] = useState<MarketBias>(loop?.market_bias as MarketBias ?? "neutral");
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
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Market Bias:
            </span>
            <span
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-md border",
                loop?.market_bias === "bullish"
                  ? "bg-bullish/15 text-bullish border-bullish/40"
                  : loop?.market_bias === "bearish"
                    ? "bg-bearish/15 text-bearish border-bearish/40"
                    : "bg-neutral-wait/15 text-neutral-wait border-neutral-wait/40",
              )}
            >
              {loop?.market_bias === "bullish" ? "📈 Bullish" : loop?.market_bias === "bearish" ? "📉 Bearish" : "↔️ Neutral"}
            </span>
          </div>
          {loop?.key_levels && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Key Levels
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed">{loop.key_levels}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-3.5 text-primary" />
            <span className="text-xs text-muted-foreground">
              Watchlist {loop?.watchlist_reviewed ? "reviewed" : "not reviewed"}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Market Bias */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Market Bias
            </label>
            <div className="grid grid-cols-3 gap-2">
              {([
                { value: "bullish" as MarketBias, emoji: "📈", label: "Bullish", color: "bg-bullish/15 text-bullish border-bullish/40" },
                { value: "bearish" as MarketBias, emoji: "📉", label: "Bearish", color: "bg-bearish/15 text-bearish border-bearish/40" },
                { value: "neutral" as MarketBias, emoji: "↔️", label: "Neutral", color: "bg-neutral-wait/15 text-neutral-wait border-neutral-wait/40" },
              ]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBias(opt.value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg border text-xs font-bold transition-all",
                    bias === opt.value
                      ? opt.color
                      : "bg-card border-border text-muted-foreground hover:bg-card-hover",
                  )}
                >
                  <span>{opt.emoji}</span>
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Key Levels */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Key Support / Resistance Levels
            </label>
            <textarea
              value={keyLevels}
              onChange={(e) => setKeyLevels(e.target.value)}
              placeholder="e.g. S: 1.0850, 1.0820 | R: 1.0900, 1.0940"
              className="w-full rounded-lg bg-card border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          {/* Watchlist Reviewed */}
          <button
            type="button"
            onClick={() => setWatchlistReviewed(!watchlistReviewed)}
            className="flex items-center gap-2"
          >
            {watchlistReviewed ? (
              <CheckCircle2 className="size-4 text-primary" />
            ) : (
              <Circle className="size-4 text-muted-foreground" />
            )}
            <span className={cn("text-xs font-bold", watchlistReviewed ? "text-primary" : "text-muted-foreground")}>
              Watchlist Reviewed
            </span>
          </button>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-xs font-bold glow-primary transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Sun className="size-3.5" />
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
      <div className="space-y-3">
        {SESSIONS.map((session) => {
          const tradedField = `${session.key}_session_traded` as keyof DailyLoop;
          const notesField = `${session.key}_session_notes` as keyof DailyLoop;
          const isTraded = loop?.[tradedField] as boolean ?? false;
          const notes = loop?.[notesField] as string ?? "";
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
      className={cn(
        "rounded-lg border p-3 space-y-2.5",
        isActive ? "border-primary/40 bg-primary/5" : "border-border bg-card",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className={cn("size-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
          <span className="text-xs font-bold">{session.label}</span>
          <span className="text-[10px] text-muted-foreground font-mono">{session.hours}</span>
        </div>
        {isActive && (
          <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 animate-pulse">
            ACTIVE
          </span>
        )}
      </div>

      {/* Did you trade toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Did you trade?
        </span>
        <button
          onClick={() => setLocalTraded(!localTraded)}
          className={cn(
            "px-3 py-1 rounded-md text-[10px] font-bold border transition-colors",
            localTraded
              ? "bg-bullish/15 text-bullish border-bullish/40"
              : "bg-card border-border text-muted-foreground",
          )}
        >
          {localTraded ? "✓ Yes" : "No"}
        </button>
      </div>

      {/* Notes */}
      <textarea
        value={localNotes}
        onChange={(e) => setLocalNotes(e.target.value)}
        placeholder={`Notes for ${session.label} session...`}
        className="w-full rounded-md bg-card border border-border px-2.5 py-2 text-[11px] text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-14"
      />

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold bg-card border border-border hover:bg-card-hover transition-colors disabled:opacity-50"
      >
        {isSaving ? (
          <Loader2 className="size-3 animate-spin" />
        ) : (
          <CheckCircle2 className="size-3" />
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
  const [emotionalState, setEmotionalState] = useState<EmotionalState>(loop?.emotional_state ?? "calm");
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
  }, [emotionalState, lessons, tomorrowPlan, dailyPnl, tradesTaken, rulesFollowed, rulesBroken, onSubmit]);

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
        <div className="space-y-3">
          {loop?.daily_pnl != null && (
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Daily P&L
              </span>
              <span
                className={cn(
                  "text-sm font-bold font-mono",
                  loop.daily_pnl >= 0 ? "text-bullish" : "text-bearish",
                )}
              >
                {(loop.daily_pnl >= 0 ? "+" : "")}${Number(loop.daily_pnl).toFixed(2)}
              </span>
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-sm font-bold font-mono">{loop?.trades_taken ?? 0}</div>
              <div className="text-[9px] text-muted-foreground">Trades</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-bullish">{loop?.rules_followed ?? 0}</div>
              <div className="text-[9px] text-muted-foreground">Rules ✓</div>
            </div>
            <div>
              <div className="text-sm font-bold font-mono text-bearish">{loop?.rules_broken ?? 0}</div>
              <div className="text-[9px] text-muted-foreground">Rules ✗</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Mood:
            </span>
            <span className="text-xs">
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.emoji}{" "}
              {EMOTIONAL_STATES.find((e) => e.value === loop?.emotional_state)?.label}
            </span>
          </div>
          {loop?.lessons_learned && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Lessons
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed">{loop.lessons_learned}</p>
            </div>
          )}
          {loop?.tomorrow_plan && (
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Tomorrow's Plan
              </span>
              <p className="text-xs text-foreground/90 leading-relaxed">{loop.tomorrow_plan}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Daily P&L */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              Daily P&L
            </label>
            <input
              type="number"
              step="0.01"
              value={dailyPnl}
              onChange={(e) => setDailyPnl(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg bg-card border border-border px-3 py-2.5 text-xs font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {/* Trades / Rules */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Trades
              </label>
              <input
                type="number"
                min="0"
                value={tradesTaken}
                onChange={(e) => setTradesTaken(e.target.value)}
                className="w-full rounded-md bg-card border border-border px-2.5 py-2 text-xs font-mono text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Rules ✓
              </label>
              <input
                type="number"
                min="0"
                value={rulesFollowed}
                onChange={(e) => setRulesFollowed(e.target.value)}
                className="w-full rounded-md bg-card border border-border px-2.5 py-2 text-xs font-mono text-bullish focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">
                Rules ✗
              </label>
              <input
                type="number"
                min="0"
                value={rulesBroken}
                onChange={(e) => setRulesBroken(e.target.value)}
                className="w-full rounded-md bg-card border border-border px-2.5 py-2 text-xs font-mono text-bearish focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>

          {/* Emotional State */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              How are you feeling?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {EMOTIONAL_STATES.map((state) => (
                <button
                  key={state.value}
                  onClick={() => setEmotionalState(state.value)}
                  className={cn(
                    "flex items-center justify-center gap-1 px-2 py-2 rounded-lg border text-[10px] font-bold transition-all",
                    emotionalState === state.value
                      ? state.color
                      : "bg-card border-border text-muted-foreground hover:bg-card-hover",
                  )}
                >
                  <span>{state.emoji}</span>
                  {state.label}
                </button>
              ))}
            </div>
          </div>

          {/* Lessons Learned */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              <Lightbulb className="size-3 inline mr-1" />
              Lessons Learned
            </label>
            <textarea
              value={lessons}
              onChange={(e) => setLessons(e.target.value)}
              placeholder="What did you learn today?"
              className="w-full rounded-lg bg-card border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          {/* Tomorrow's Plan */}
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
              <Brain className="size-3 inline mr-1" />
              Tomorrow's Plan
            </label>
            <textarea
              value={tomorrowPlan}
              onChange={(e) => setTomorrowPlan(e.target.value)}
              placeholder="What will you focus on tomorrow?"
              className="w-full rounded-lg bg-card border border-border px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none h-20"
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg gradient-primary text-primary-foreground text-xs font-bold glow-primary transition-transform active:scale-95 disabled:opacity-50"
          >
            {isSaving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Moon className="size-3.5" />
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
}: {
  history: DailyLoop[];
  isLoading: boolean;
  streak: { current_streak: number; longest_streak: number; last_completed_date: string | null } | null | undefined;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="vixor-card h-16 shimmer" />
        ))}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="vixor-card p-8 text-center border-dashed border-2">
        <History className="size-8 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-sm font-bold text-foreground mb-1">No History Yet</h3>
        <p className="text-xs text-muted-foreground">Complete your first daily loop to start building your track record.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Streak widget (compact) */}
      <StreakWidget streak={streak} history={history} />

      {/* Loop list */}
      <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
        {history.map((loop) => {
          const isExpanded = expandedId === loop.id;
          const date = new Date(loop.date);
          const dateStr = date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
          const emotion = EMOTIONAL_STATES.find((e) => e.value === loop.emotional_state);

          return (
            <div
              key={loop.id}
              className="vixor-card overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : loop.id)}
                className="w-full flex items-center justify-between p-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "size-8 rounded-lg flex items-center justify-center shrink-0",
                      loop.completion_percentage >= 100
                        ? "bg-bullish/15"
                        : loop.completion_percentage >= 50
                          ? "bg-primary/15"
                          : "bg-muted",
                    )}
                  >
                    {loop.completion_percentage >= 100 ? (
                      <CheckCircle2 className="size-4 text-bullish" />
                    ) : (
                      <span className="text-[9px] font-bold font-mono text-muted-foreground">
                        {loop.completion_percentage}%
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold truncate">{dateStr}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {loop.market_bias && (
                        <span
                          className={cn(
                            "text-[8px] font-bold px-1 py-0.5 rounded",
                            loop.market_bias === "bullish"
                              ? "bg-bullish/15 text-bullish"
                              : loop.market_bias === "bearish"
                                ? "bg-bearish/15 text-bearish"
                                : "bg-neutral-wait/15 text-neutral-wait",
                          )}
                        >
                          {loop.market_bias.toUpperCase()}
                        </span>
                      )}
                      {emotion && (
                        <span className="text-[10px]">{emotion.emoji}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {loop.daily_pnl != null && (
                    <span
                      className={cn(
                        "text-xs font-bold font-mono",
                        loop.daily_pnl >= 0 ? "text-bullish" : "text-bearish",
                      )}
                    >
                      {(loop.daily_pnl >= 0 ? "+" : "")}${Number(loop.daily_pnl).toFixed(2)}
                    </span>
                  )}
                  <ChevronRight
                    className={cn(
                      "size-3.5 text-muted-foreground transition-transform",
                      isExpanded && "rotate-90",
                    )}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 pt-0 space-y-2 border-t border-border">
                  <div className="grid grid-cols-3 gap-2 text-center pt-2">
                    <div>
                      <div className="text-xs font-bold font-mono">{loop.trades_taken}</div>
                      <div className="text-[8px] text-muted-foreground uppercase">Trades</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-bullish">{loop.rules_followed}</div>
                      <div className="text-[8px] text-muted-foreground uppercase">Rules ✓</div>
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono text-bearish">{loop.rules_broken}</div>
                      <div className="text-[8px] text-muted-foreground uppercase">Rules ✗</div>
                    </div>
                  </div>
                  {loop.key_levels && (
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Key Levels:</span>
                      <p className="text-[11px] text-foreground/90 mt-0.5">{loop.key_levels}</p>
                    </div>
                  )}
                  {loop.lessons_learned && (
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Lessons:</span>
                      <p className="text-[11px] text-foreground/90 mt-0.5">{loop.lessons_learned}</p>
                    </div>
                  )}
                  {loop.tomorrow_plan && (
                    <div>
                      <span className="text-[9px] font-bold uppercase text-muted-foreground">Tomorrow:</span>
                      <p className="text-[11px] text-foreground/90 mt-0.5">{loop.tomorrow_plan}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
