"use client";

import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  X,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { cn } from "@/shared/utils";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { assessRisk, submitDecisionFeedback } from "@/domains/copilot/functions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import type { RiskDecisionType } from "@/domains/copilot/types";

// ─── Props ────────────────────────────────────────────────────────────────

export interface GovernorRiskPanelProps {
  action: "buy" | "sell";
  token: string;
  amount: number;
  currentPrice: number;
  portfolioValue: number;
  onClose: () => void;
}

// ─── Decision Style Maps ──────────────────────────────────────────────────

const decisionConfig: Record<
  RiskDecisionType,
  {
    label: string;
    bg: string;
    border: string;
    text: string;
    panelBorder: string;
    progressColor: string;
    icon: typeof ShieldCheck;
  }
> = {
  allow: {
    label: "Allow",
    bg: "bg-bullish/10",
    border: "border-bullish/30",
    text: "text-bullish",
    panelBorder: "border-bullish/40",
    progressColor: "[&>div]:bg-bullish",
    icon: ShieldCheck,
  },
  warn: {
    label: "Warning",
    bg: "bg-[var(--gold)]/10",
    border: "border-neutral-wait/30",
    text: "text-neutral-wait",
    panelBorder: "border-neutral-wait/40",
    progressColor: "[&>div]:bg-[var(--gold)]",
    icon: AlertTriangle,
  },
  block: {
    label: "Blocked",
    bg: "bg-bearish/10",
    border: "border-bearish/30",
    text: "text-bearish",
    panelBorder: "border-bearish/40",
    progressColor: "[&>div]:bg-bearish",
    icon: Ban,
  },
};

// ─── Component ─────────────────────────────────────────────────────────────

export function GovernorRiskPanel({
  action,
  token,
  amount,
  currentPrice,
  portfolioValue,
  onClose,
}: GovernorRiskPanelProps) {
  const assessRiskFn = useStableServerFn(assessRisk);
  const submitFeedbackFn = useStableServerFn(submitDecisionFeedback);

  const riskMutation = useMutation({
    mutationFn: (input: {
      action: "buy" | "sell";
      token: string;
      amount: number;
      currentPrice: number;
      portfolioValue: number;
    }) => assessRiskFn({ data: input }),
  });

  const feedbackMutation = useMutation({
    mutationFn: (input: { decisionId: string; feedback: "accepted" | "rejected" }) =>
      submitFeedbackFn({ data: input }),
  });

  useEffect(() => {
    riskMutation.mutate({ action, token, amount, currentPrice, portfolioValue });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const response = riskMutation.data;
  const decisionId = response?.decisionId;
  const decision = response?.decision;
  const riskScore = response?.riskScore;
  const decisionStyle = decision ? decisionConfig[decision] : null;

  const handleAccept = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "accepted" });
  };

  const handleOverride = () => {
    if (decisionId) feedbackMutation.mutate({ decisionId, feedback: "rejected" });
    onClose();
  };

  const handleRetry = () => {
    riskMutation.mutate({ action, token, amount, currentPrice, portfolioValue });
  };

  // ─── Risk Score Color Helper ──────────────────────────────────────────

  const getRiskScoreColor = (score: number): string => {
    if (score <= 30) return "text-bullish";
    if (score <= 60) return "text-neutral-wait";
    return "text-bearish";
  };

  const getRiskLabel = (score: number): string => {
    if (score <= 30) return "Low";
    if (score <= 60) return "Medium";
    return "High";
  };

  // ─── Loading State ─────────────────────────────────────────────────────

  if (riskMutation.isPending) {
    return (
      <div className="rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
            <Shield className="size-4 text-primary" />
          </div>
          <div>
            <Skeleton className="h-4 w-36 mb-1.5" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="ml-auto">
            <Loader2 className="size-4 text-primary animate-spin" />
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <Skeleton className="size-20 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-6 w-16 rounded-md" />
          </div>
        </div>

        <Separator className="my-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    );
  }

  // ─── Error State ───────────────────────────────────────────────────────

  if (riskMutation.isError) {
    return (
      <div className="rounded-xl border border-bearish/30 bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="flex items-center justify-center size-8 rounded-lg bg-bearish/10">
            <AlertCircle className="size-4 text-bearish" />
          </div>
          <span className="text-sm font-semibold text-bearish">Risk Assessment Error</span>
          <button
            onClick={onClose}
            className="ml-auto p-1 rounded-md hover:bg-muted transition-colors"
          >
            <X className="size-3.5 text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-bearish mb-3">
          {riskMutation.error?.message || "Failed to assess trade risk. Please try again."}
        </p>
        <Button variant="outline" size="sm" onClick={handleRetry} className="gap-2 text-xs">
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      </div>
    );
  }

  // ─── Success State ─────────────────────────────────────────────────────

  if (!response) return null;

  const DecisionIcon = decisionStyle?.icon ?? ShieldAlert;

  return (
    <div
      className={cn(
        "rounded-xl bg-card/80 backdrop-blur-sm shadow-lg shadow-black/20 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300",
        "border",
        decisionStyle?.panelBorder ?? "border-border/50",
      )}
    >
      {/* ── Header ── */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary/10">
          <Shield className="size-4 text-primary" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold text-primary">Risk Governor</span>
          <span className="text-xs text-muted-foreground">
            {token} · {action.toUpperCase()}
          </span>
        </div>
        <button
          onClick={onClose}
          className="ml-auto p-1 rounded-md hover:bg-muted transition-colors"
        >
          <X className="size-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* ── Risk Score Gauge ── */}
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
              strokeDasharray={`${((riskScore ?? 0) / 100) * 213.6} 213.6`}
              className={cn(
                "transition-all duration-700",
                (riskScore ?? 0) <= 30
                  ? "text-bullish"
                  : (riskScore ?? 0) <= 60
                    ? "text-neutral-wait"
                    : "text-bearish",
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-xl font-bold font-mono", getRiskScoreColor(riskScore ?? 0))}>
              {riskScore ?? 0}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
              {getRiskLabel(riskScore ?? 0)}
            </span>
          </div>
        </div>

        <div className="flex-1 space-y-2">
          <Progress
            value={riskScore ?? 0}
            className={cn("h-2", decisionStyle?.progressColor ?? "")}
          />
          {decisionStyle && (
            <Badge
              variant="outline"
              className={cn(
                "gap-1.5 text-[11px] font-semibold px-2.5 py-0.5",
                decisionStyle.bg,
                decisionStyle.border,
                decisionStyle.text,
              )}
            >
              <DecisionIcon className="size-3" strokeWidth={2.5} />
              {decisionStyle.label}
            </Badge>
          )}
          <div className="text-[11px] text-muted-foreground">
            Confidence: {Math.round(response.confidence * 100)}%
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      {/* ── Reason ── */}
      <div className="mb-3">
        <h4 className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
          Reason
        </h4>
        <p className="text-sm text-primary leading-relaxed">{response.reason}</p>
      </div>

      {/* ── Suggestion ── */}
      <div className="mb-4">
        <h4 className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
          Suggestion
        </h4>
        <p className="text-sm text-secondary leading-relaxed">{response.suggestion}</p>
      </div>

      {/* ── Risk Profile Summary ── */}
      {response.riskProfile && (
        <div className="rounded-lg bg-muted/40 border border-border/30 p-3 mb-4">
          <h4 className="text-[11px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
            Your Risk Profile
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Style:</span>{" "}
              <span className="text-primary font-medium">{response.riskProfile.style}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tolerance:</span>{" "}
              <span className="text-primary font-medium">{response.riskProfile.tolerance}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Weakness:</span>{" "}
              <span className="text-primary font-medium">{response.riskProfile.weakness}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Strength:</span>{" "}
              <span className="text-primary font-medium">{response.riskProfile.strength}</span>
            </div>
          </div>
        </div>
      )}

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
            <CheckCircle2 className="size-3.5" />
          )}
          {feedbackMutation.isSuccess ? "Accepted" : "Accept Advice"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleOverride}
          disabled={feedbackMutation.isPending || feedbackMutation.isSuccess}
          className="gap-1.5 text-xs flex-1 border-neutral-wait/30 text-neutral-wait hover:bg-neutral-wait/10 hover:text-neutral-wait"
        >
          <ShieldAlert className="size-3.5" />
          Override
        </Button>
      </div>
    </div>
  );
}
