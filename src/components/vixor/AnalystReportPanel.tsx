"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Brain,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  AlertCircle,
  BarChart3,
  Lightbulb,
  Activity,
  BookOpen,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { generateWeeklyReport, submitDecisionFeedback } from "@/domains/copilot/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ─── Props ────────────────────────────────────────────────────────────────

export interface AnalystReportPanelProps {
  onRefresh?: () => void;
}

// ─── Section Icon Maps ────────────────────────────────────────────────────

const sectionIcons = {
  stats: BarChart3,
  patterns: Activity,
  recommendations: Lightbulb,
  learning: BookOpen,
} as const;

// ─── Component ─────────────────────────────────────────────────────────────

export function AnalystReportPanel({ onRefresh }: AnalystReportPanelProps) {
  const generateReportFn = useStableServerFn(generateWeeklyReport);
  const submitFeedbackFn = useStableServerFn(submitDecisionFeedback);

  const reportMutation = useMutation({
    mutationFn: () => generateReportFn({ data: {} }),
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: { decisionId: string; feedback: "accepted" | "rejected" }) =>
      submitFeedbackFn({ data: input }),
  });

  useEffect(() => {
    reportMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const response = reportMutation.data;
  const decisionId = response?.decisionId;

  const handleRefresh = () => {
    reportMutation.mutate();
    onRefresh?.();
  };

  const handleAccept = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "accepted" });
  };

  const handleDismiss = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "rejected" });
  };

  // ─── Render Report Section ─────────────────────────────────────────────

  const renderSection = (title: string, iconKey: keyof typeof sectionIcons, content: string) => {
    const Icon = sectionIcons[iconKey];
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className="size-3.5 text-muted-foreground" />
          <h4 className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
            {title}
          </h4>
        </div>
        <div className="text-sm text-primary leading-relaxed whitespace-pre-line pl-5">
          {content}
        </div>
      </div>
    );
  };

  // ─── Loading State ─────────────────────────────────────────────────────

  if (reportMutation.isPending) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-5">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <Brain className="size-4 text-primary" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="ml-auto">
            <Loader2 className="size-4 text-primary animate-spin" />
          </div>
        </div>

        {/* Stats summary skeleton */}
        <div className="space-y-3 mb-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4 mb-1" />
          <Skeleton className="h-4 w-5/6" />
        </div>

        <Separator className="my-3" />

        <div className="space-y-3 mb-4">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-2/3" />
        </div>

        <Separator className="my-3" />

        <div className="space-y-3 mb-4">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        <Separator className="my-3" />

        <div className="space-y-3">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-4 w-full mb-1" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────

  if (reportMutation.isError) {
    return (
      <div className="rounded-xl border border-bearish/30 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-bearish/10">
            <AlertCircle className="size-4 text-bearish" />
          </div>
          <span className="text-sm font-semibold text-bearish">Report Error</span>
        </div>
        <p className="text-xs text-bearish mb-3">
          {reportMutation.error?.message || "Failed to generate weekly report. Please try again."}
        </p>
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 text-xs">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  // ─── Success State ────────────────────────────────────────────────────

  if (!response) return null;

  return (
    <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Brain className="size-4 text-primary" />
        </div>
        <div>
          <span className="text-sm font-semibold text-primary">Weekly Behavioral Report</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-muted-foreground">AI-generated insights</span>
            <Badge variant="outline" className="text-[10px] text-muted-foreground px-1.5 py-0">
              {Math.round(response.confidence * 100)}% conf.
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleRefresh}
          disabled={reportMutation.isPending}
          className="ml-auto size-8"
        >
          <RefreshCw
            className={cn(
              "size-3.5 text-muted-foreground",
              reportMutation.isPending && "animate-spin",
            )}
          />
        </Button>
      </div>

      {/* ── Tabbed Content ── */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-4 h-8 bg-muted/50">
          <TabsTrigger value="overview" className="text-[11px] px-3 h-7">
            Overview
          </TabsTrigger>
          <TabsTrigger value="patterns" className="text-[11px] px-3 h-7">
            Patterns
          </TabsTrigger>
          <TabsTrigger value="resources" className="text-[11px] px-3 h-7">
            Resources
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview" className="space-y-4 mt-0">
          {renderSection("Stats Summary", "stats", response.statsSummary)}

          <Separator className="my-3" />

          {renderSection("Recommendations", "recommendations", response.recommendations)}
        </TabsContent>

        {/* ── Patterns Tab ── */}
        <TabsContent value="patterns" className="mt-0">
          {renderSection("Behavioral Patterns", "patterns", response.behavioralPatterns)}
        </TabsContent>

        {/* ── Resources Tab ── */}
        <TabsContent value="resources" className="mt-0">
          {renderSection("Learning Resources", "learning", response.learningResources)}
        </TabsContent>
      </Tabs>

      <Separator className="my-4" />

      {/* ── Feedback Buttons ── */}
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleAccept}
          disabled={feedbackMutation.isPending || feedbackMutation.isSuccess}
          className="gap-1.5 text-xs flex-1 border-bullish/30 text-bullish hover:bg-bullish/10 hover:text-bullish"
        >
          {feedbackMutation.isPending ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <ThumbsUp className="size-3.5" />
          )}
          {feedbackMutation.isSuccess ? "Accepted" : "Accept Insights"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          disabled={feedbackMutation.isPending || feedbackMutation.isSuccess}
          className="gap-1.5 text-xs flex-1 border-bearish/30 text-bearish hover:bg-bearish/10 hover:text-bearish"
        >
          <ThumbsDown className="size-3.5" />
          Dismiss
        </Button>
      </div>
    </div>
  );
}
