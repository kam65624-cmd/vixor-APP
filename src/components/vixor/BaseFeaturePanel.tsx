import { cn } from "@/shared/utils";
import React from "react";
import { withAlpha } from "@/shared/color-utils";

interface FeatureMetric {
  label: string;
  value: string | number;
  color?: string;
}

interface BaseFeaturePanelProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  status?: "active" | "warning" | "danger" | "neutral";
  metrics?: FeatureMetric[];
  children?: React.ReactNode;
  className?: string;
}

const STATUS_COLORS = {
  active: "var(--bullish)",
  warning: "var(--neutral-wait)",
  danger: "var(--bearish)",
  neutral: "var(--info)",
};

export function BaseFeaturePanel({
  title,
  subtitle,
  icon,
  status = "neutral",
  metrics = [],
  children,
  className,
}: BaseFeaturePanelProps) {
  const statusColor = STATUS_COLORS[status];
  return (
    <div
      className={cn("rounded-md border p-4", className)}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{
              background: withAlpha(statusColor, 0.12),
              color: statusColor,
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            {title}
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor }}
              aria-hidden="true"
            />
          </div>
          {subtitle && (
            <p className="mt-0.5 truncate text-xs" style={{ color: "var(--text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Metrics grid */}
      {metrics.length > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          {metrics.map((m, i) => (
            <div
              key={i}
              className="rounded-md border p-2"
              style={{
                background: "var(--surface-2)",
                borderColor: "var(--border)",
              }}
            >
              <div
                className="text-xs uppercase tracking-wide"
                style={{ color: "var(--text-secondary)" }}
              >
                {m.label}
              </div>
              <div
                className="font-mono text-sm font-medium tabular-nums"
                style={{ color: m.color || "var(--text-primary)" }}
              >
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Body */}
      {children}
    </div>
  );
}

export default BaseFeaturePanel;
