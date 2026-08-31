// ── AgentResponseLayout — Shared layout for AI agent response panels ────
// Extracted common pattern from HunterScoreCard, CoachOverlay, GovernorRiskPanel, AnalystReportPanel
// Reduces duplication from ~80% to a single shared component.

import type { ReactNode } from "react";

interface AgentResponseLayoutProps {
  /** Agent icon (e.g. Crosshair, Shield, MessageSquare, BarChart3) */
  icon: ReactNode;
  /** Agent name shown as header */
  title: string;
  /** Primary score/value */
  score?: number;
  /** Label under the score (e.g. "STRONG BUY", "HIGH RISK") */
  scoreLabel?: string;
  /** Color class for the score */
  scoreColor?: string;
  /** Optional badge (e.g. decision style) */
  badge?: ReactNode;
  /** Confidence percentage (0-1) */
  confidence?: number;
  /** Reason section content */
  reason?: string;
  /** Suggestion section content */
  suggestion?: string;
  /** Additional content rendered after suggestion */
  children?: ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Error message */
  error?: string | null;
  /** On retry callback */
  onRetry?: () => void;
}

export function AgentResponseLayout({
  icon,
  title,
  score,
  scoreLabel,
  scoreColor,
  badge,
  confidence,
  reason,
  suggestion,
  children,
  loading,
  error,
  onRetry,
}: AgentResponseLayoutProps) {
  return (
    <div className="space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: "var(--color-primary)/10" }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground">{title}</div>
          {confidence != null && (
            <div className="text-xs text-muted-foreground">
              Confidence: {Math.round(confidence * 100)}%
            </div>
          )}
        </div>
        {badge}
      </div>

      {/* ── Score ── */}
      {score != null && (
        <div className="flex items-end gap-3">
          <span className={`text-2xl font-bold font-mono ${scoreColor ?? ""}`}>{score}</span>
          {scoreLabel && (
            <span className="text-xs uppercase tracking-widest text-muted-foreground mb-0.5">
              {scoreLabel}
            </span>
          )}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-destructive">{error}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-medium text-destructive underline"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* ── Reason ── */}
      {reason && !loading && !error && (
        <div className="mb-3">
          <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
            Reason
          </h4>
          <p className="text-sm text-primary leading-relaxed">{reason}</p>
        </div>
      )}

      {/* ── Suggestion ── */}
      {suggestion && !loading && !error && (
        <div className="mb-4">
          <h4 className="text-xs uppercase tracking-widest font-bold text-muted-foreground mb-1.5">
            Suggestion
          </h4>
          <p className="text-sm text-secondary leading-relaxed">{suggestion}</p>
        </div>
      )}

      {/* ── Children ── */}
      {children}
    </div>
  );
}
