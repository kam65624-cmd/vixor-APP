"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Crosshair,
  ThumbsUp,
  ThumbsDown,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus,
  Wallet,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { scoreOpportunity, submitDecisionFeedback } from "@/domains/copilot/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { HunterSignal } from "@/domains/copilot/types";

// ─── Props ────────────────────────────────────────────────────────────────

export interface HunterScoreCardProps {
  token: string;
  chain: string;
  smartMoneyActivity?: string;
  priceData?: string;
  volumeData?: string;
}

// ─── Signal Style Maps ─────────────────────────────────────────────────────

const signalConfig: Record<
  HunterSignal,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    gradient: string;
    circleColor: string;
    icon: typeof TrendingUp;
  }
> = {
  strong_buy: {
    label: "Strong Buy",
    bg: "bg-emerald-500/10",
    border: "border-bullish/30",
    text: "text-bullish",
    gradient: "from-emerald-500/5 to-emerald-500/10",
    circleColor: "text-bullish",
    icon: TrendingUp,
  },
  buy: {
    label: "Buy",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    text: "text-sky-400",
    gradient: "from-sky-500/5 to-sky-500/10",
    circleColor: "text-sky-500",
    icon: TrendingUp,
  },
  hold: {
    label: "Hold",
    bg: "bg-slate-500/10",
    border: "border-slate-500/30",
    text: "text-slate-400",
    gradient: "from-slate-500/5 to-slate-500/10",
    circleColor: "text-slate-500",
    icon: Minus,
  },
  sell: {
    label: "Sell",
    bg: "bg-red-500/10",
    border: "border-bearish/30",
    text: "text-bearish",
    gradient: "from-red-500/5 to-red-500/10",
    circleColor: "text-bearish",
    icon: TrendingDown,
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

export function HunterScoreCard({
  token,
  chain,
  smartMoneyActivity,
  priceData,
  volumeData,
}: HunterScoreCardProps) {
  const scoreOpportunityFn = useStableServerFn(scoreOpportunity);
  const submitFeedbackFn = useStableServerFn(submitDecisionFeedback);

  const scoreMutation = useMutation({
    mutationFn: (input: {
      token: string;
      chain: string;
      smartMoneyActivity?: string;
      priceData?: string;
      volumeData?: string;
    }) => scoreOpportunityFn({ data: input }),
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: { decisionId: string; feedback: "accepted" | "rejected" }) =>
      submitFeedbackFn({ data: input }),
  });

  useEffect(() => {
    scoreMutation.mutate({
      token,
      chain,
      smartMoneyActivity: smartMoneyActivity ?? "",
      priceData: priceData ?? "",
      volumeData: volumeData ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const response = scoreMutation.data;
  const decisionId = response?.decisionId;
  const score = response?.score;
  const signal = response?.signal;
  const signalStyle = signal ? signalConfig[signal] : null;

  const handleAccept = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "accepted" });
  };

  const handleDismiss = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "rejected" });
  };

  const handleRetry = () => {
    scoreMutation.mutate({
      token,
      chain,
      smartMoneyActivity: smartMoneyActivity ?? "",
      priceData: priceData ?? "",
      volumeData: volumeData ?? "",
    });
  };

  // ─── Score Color Helper ─────────────────────────────────────────────────

  const getScoreColor = (s: number): string => {
    if (s >= 75) return "text-bullish";
    if (s >= 50) return "text-sky-400";
    if (s >= 25) return "text-slate-400";
    return "text-bearish";
  };

  const getScoreLabel = (s: number): string => {
    if (s >= 75) return "Excellent";
    if (s >= 50) return "Good";
    if (s >= 25) return "Fair";
    return "Poor";
  };

  // ─── Loading State ─────────────────────────────────────────────────────

  if (scoreMutation.isPending) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <Crosshair className="size-4 text-primary" />
          </div>
          <div>
            <Skeleton className="h-4 w-28 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="ml-auto">
            <Loader2 className="size-4 text-primary animate-spin" />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        <Separator className="my-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────

  if (scoreMutation.isError) {
    return (
      <div className="rounded-xl border border-bearish/30 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-red-500/10">
            <AlertCircle className="size-4 text-bearish" />
          </div>
          <span className="text-sm font-semibold text-bearish">Score Error</span>
          <button
            onClick={handleRetry}
            className="ml-auto p-1 rounded-md hover:bg-muted transition-colors"
          >
            <RefreshCw className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-bearish">
          {scoreMutation.error?.message || "Failed to score opportunity. Please try again."}
        </p>
      </div>
    );
  }

  // ─── Success State ─────────────────────────────────────────────────────

  if (!response) return null;

  const SignalIcon = signalStyle?.icon ?? Minus;

  return (
    <div
      className={cn(
        "rounded-xl bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300",
        "border border-border/50",
        "bg-gradient-to-br",
        signalStyle?.gradient ?? "from-transparent to-transparent",
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Crosshair className="size-4 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-primary">Smart Money Score</span>
          <span className="text-xs text-muted-foreground">
            {token} · {chain}
          </span>
        </div>
      </div>

      {/* ── Score Circle & Signal ── */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex items-center justify-center size-20 shrink-0">
          <svg className="size-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              stroke="currentColor"
              strokeWidth="5"
              className="text-muted/50"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              fill="none"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${((score ?? 0) / 100) * 213.6} 213.6`}
              className={cn(
                "transition-all duration-700",
                signalStyle?.circleColor ?? "text-muted",
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-bold font-mono", getScoreColor(score ?? 0))}>
              {score ?? 0}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {getScoreLabel(score ?? 0)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          {signalStyle && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 text-[11px] font-semibold px-2.5 py-0.5",
                signalStyle.bg,
                signalStyle.border,
                signalStyle.text,
              )}
            >
              <SignalIcon className="size-3" strokeWidth={2.5} />
              {signalStyle.label}
            </Badge>
          )}
          <div className="text-[11px] text-muted-foreground">
            Confidence: {Math.round(response.confidence * 100)}%
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      {/* ── Reasoning ── */}
      <div className="mb-3">
        <h4 className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
          Analysis
        </h4>
        <p className="text-sm text-primary leading-relaxed">{response.reasoning}</p>
      </div>

      {/* ── Wallets List ── */}
      {response.wallets.length > 0 && (
        <div className="mb-4">
          <h4 className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
            <Wallet className="size-3 inline mr-1 -mt-0.5" />
            Smart Wallets Detected ({response.wallets.length})
          </h4>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {response.wallets.map((wallet, index) => (
              <Badge
                key={index}
                variant="outline"
                className="text-[11px] font-mono text-muted-foreground px-2 py-0.5"
              >
                {wallet.length > 12 ? `${wallet.slice(0, 6)}...${wallet.slice(-4)}` : wallet}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* ── Feedback Buttons ── */}
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
          {feedbackMutation.isSuccess ? "Accepted" : "Helpful"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleDismiss}
          disabled={feedbackMutation.isPending || feedbackMutation.isSuccess}
          className="gap-1.5 text-xs flex-1 border-bearish/30 text-bearish hover:bg-bearish/10 hover:text-bearish"
        >
          <ThumbsDown className="size-3.5" />
          Not Helpful
        </Button>
      </div>
    </div>
  );
}
