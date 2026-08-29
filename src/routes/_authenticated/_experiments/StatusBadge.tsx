import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import type { ExperimentStatus } from "./constants";

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

export function StatusBadge({ status }: { status: ExperimentStatus }) {
  const config: Record<string, { bg: string; color: string; border: string }> = {
    running: {
      bg: "rgba(16,185,129,0.1)",
      color: "var(--color-bullish)",
      border: "rgba(16,185,129,0.2)",
    },
    completed: {
      bg: "rgba(34,197,94,0.1)",
      color: "var(--color-bullish)",
      border: "rgba(34,197,94,0.2)",
    },
    failed: {
      bg: "rgba(239,68,68,0.1)",
      color: "var(--color-bearish)",
      border: "rgba(239,68,68,0.2)",
    },
    cancelled: {
      bg: "rgba(255,255,255,0.04)",
      color: "var(--color-muted-foreground)",
      border: "rgba(255,255,255,0.06)",
    },
  };
  const c = config[status] || config.cancelled;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 6,
        fontSize: 10,
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
      }}
    >
      {status === "running" && (
        <Loader2 style={{ width: 12, height: 12, animation: "spin 1s linear infinite" }} />
      )}
      {status === "completed" && <CheckCircle2 style={{ width: 12, height: 12 }} />}
      {status === "failed" && <XCircle style={{ width: 12, height: 12 }} />}
      {status}
    </span>
  );
}
