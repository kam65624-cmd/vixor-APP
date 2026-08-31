"use client";

import { useEffect, useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { coachTrade, submitDecisionFeedback } from "@/domains/moxi/agents";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { CoachSentiment, RiskLevel } from "@/domains/moxi/types";

// ─── Props ────────────────────────────────────────────────────────────────

export interface CoachOverlayProps {
  token: string;
  action: "buy" | "sell";
  amount: number;
  chain: string;
  currentPrice: number;
  onClose: () => void;
}

// ─── Style Maps ─────────────────────────────────────────────────────────────

const sentimentConfig: Record<
  CoachSentiment,
  { label: string; bg: string; border: string; text: string; icon: typeof TrendingUp }
> = {
  bullish: {
    label: "Bullish",
    bg: "bg-bullish/10",
    border: "border-bullish/30",
    text: "text-bullish",
    icon: TrendingUp,
  },
  bearish: {
    label: "Bearish",
    bg: "bg-bearish/10",
    border: "border-bearish/30",
    text: "text-bearish",
    icon: TrendingDown,
  },
  neutral: {
    label: "Neutral",
    bg: "bg-muted-foreground/10",
    border: "border-muted-foreground/30",
    text: "text-muted-foreground",
    icon: Minus,
  },
};

const riskConfig: Record<RiskLevel, { label: string; bg: string; border: string; text: string }> = {
  low: {
    label: "Low Risk",
    bg: "bg-bullish/10",
    border: "border-bullish/30",
    text: "text-bullish",
  },
  medium: {
    label: "Medium Risk",
    bg: "bg-[var(--gold)]/10",
    border: "border-neutral-wait/30",
    text: "text-neutral-wait",
  },
  high: {
    label: "High Risk",
    bg: "bg-bearish/10",
    border: "border-bearish/30",
    text: "text-bearish",
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

export function CoachOverlay({
  token,
  action,
  amount,
  chain,
  currentPrice,
  onClose,
}: CoachOverlayProps) {
  const coachTradeFn = useStableServerFn(coachTrade);
  const submitFeedbackFn = useStableServerFn(submitDecisionFeedback);

  const coachMutation = useMutation({
    mutationFn: (input: {
      token: string;
      action: "buy" | "sell";
      amount: number;
      chain: string;
      currentPrice: number;
    }) => coachTradeFn({ data: input }),
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: { decisionId: string; feedback: "accepted" | "rejected" }) =>
      submitFeedbackFn({ data: input }),
  });

  useEffect(() => {
    coachMutation.mutate({ token, action, amount, chain, currentPrice });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const response = coachMutation.data;
  const decisionId = response?.decisionId;
  const sentiment = response?.sentiment;
  const riskLevel = response?.riskLevel;

  const sentimentStyle = sentiment ? sentimentConfig[sentiment] : null;
  const riskStyle = riskLevel ? riskConfig[riskLevel] : null;

  const borderColor =
    riskLevel === "high"
      ? "border-bearish/40"
      : riskLevel === "medium"
        ? "border-neutral-wait/40"
        : riskLevel === "low"
          ? "border-bullish/40"
          : "border-border/50";

  const handleAccept = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "accepted" });
  };

  const handleDismiss = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "rejected" });
    onClose();
  };

  const handleRetry = () => {
    coachMutation.mutate({ token, action, amount, chain, currentPrice });
  };

  // ─── Loading State ──────────────────────────────────────────────────────

  if (coachMutation.isPending) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <MessageSquare className="size-4 text-primary" />
          </div>
          <div>
            <Skeleton className="h-4 w-32 mb-1.5" />
            <Skeleton className="h-3 w-24" />
          </div>
          <div className="ml-auto">
            <Loader2 className="size-4 text-primary animate-spin" />
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Separator className="my-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // ─── Error State ────────────────────────────────────────────────────────

  if (coachMutation.isError) {
    return (
      <div className="rounded-xl border border-bearish/30 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-bearish/10">
            <AlertCircle className="size-4 text-bearish" />
          </div>
          <span className="text-sm font-semibold text-bearish">Coach Error</span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-bearish mb-3">
          {coachMutation.error?.message || "Failed to get coaching advice. Please try again."}
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2 text-xs">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  // ─── Success State ──────────────────────────────────────────────────────

  if (!response) return null;

  const SentimentIcon = sentimentStyle?.icon ?? Minus;

  return (
    <div
      className={cn(
        "rounded-xl bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300",
        "border",
        borderColor,
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <MessageSquare className="size-4 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-primary">Trade Coach</span>
          <span className="text-xs text-muted-foreground">
            {token} · {action.toUpperCase()} · {chain}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Badges ── */}
      <div className="flex items-center gap-2 mb-3">
        {sentimentStyle && (
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 text-xs font-semibold px-2 py-0.5",
              sentimentStyle.bg,
              sentimentStyle.border,
              sentimentStyle.text,
            )}
          >
            <SentimentIcon className="size-3" strokeWidth={2.5} />
            {sentimentStyle.label}
          </Badge>
        )}
        {riskStyle && (
          <Badge
            variant="outline"
            className={cn(
              "gap-1 text-xs font-semibold px-2 py-0.5",
              riskStyle.bg,
              riskStyle.border,
              riskStyle.text,
            )}
          >
            {riskStyle.label}
          </Badge>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="ml-auto text-xs text-muted-foreground px-2 py-0.5">
              {Math.round(response.confidence * 100)}% conf.
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Confidence: {Math.round(response.confidence * 100)}%</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ── Confidence Bar ── */}
      <Progress value={response.confidence * 100} className="h-1.5 mb-4 [&>div]:bg-bullish" />

      {/* ── Comment ── */}
      <div className="mb-4">
        <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
          Analysis
        </h4>
        <p className="text-sm text-primary leading-relaxed">{response.comment}</p>
      </div>

      <Separator className="my-3" />

      {/* ── Suggestion ── */}
      <div className="mb-4">
        <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
          Suggestion
        </h4>
        <p className="text-sm text-secondary leading-relaxed">{response.suggestion}</p>
      </div>

      {/* ── Actions ── */}
      <div className="flex items-center gap-2 pt-1">
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
          {feedbackMutation.isSuccess ? "Accepted" : "Accept"}
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
