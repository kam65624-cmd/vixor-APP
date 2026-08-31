"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Brain } from "lucide-react";
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
import { AnalystReportPanel } from "@/components/vixor/AnalystReportPanel";
import { PageLayout, ScrollArea } from "@/components/vixor/PageLayout";
import { CSS_VARS } from "./constants";
import { TodayTab } from "./TodayTab";
import { HistoryTab } from "./HistoryTab";

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
    { items: DailyLoop[]; total: number; hasMore: boolean } | undefined;
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
