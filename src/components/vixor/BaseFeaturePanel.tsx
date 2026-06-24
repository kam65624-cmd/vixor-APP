import { cn } from "@/shared/utils";
import React from "react";

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
  active: "var(--bullish, #10B981)",
  warning: "var(--neutral-wait, #F59E0B)",
  danger: "var(--bearish, #EF4444)",
  neutral: "var(--info, #06B6D4)",
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
        background: "var(--surface, #1A1A1A)",
        borderColor: "var(--border, rgba(255,255,255,0.06))",
      }}
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-3">
        {icon && (
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
            style={{
              background: `color-mix(in srgb, ${statusColor} 12%, transparent)`,
              color: statusColor,
            }}
          >
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-primary, #FFFFFF)" }}
          >
            {title}
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: statusColor }}
              aria-hidden="true"
            />
          </div>
          {subtitle && (
            <p
              className="mt-0.5 truncate text-[11px]"
              style={{ color: "var(--text-secondary, #9CA3AF)" }}
            >
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
                background: "var(--surface-2, #1E1E1E)",
                borderColor: "var(--border, rgba(255,255,255,0.06))",
              }}
            >
              <div
                className="text-[10px] uppercase tracking-wide"
                style={{ color: "var(--text-secondary, #9CA3AF)" }}
              >
                {m.label}
              </div>
              <div
                className="font-mono text-sm font-medium tabular-nums"
                style={{ color: m.color || "var(--text-primary, #FFFFFF)" }}
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