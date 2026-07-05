import { cn } from "@/shared/utils";
import { LiveDot } from "./LiveDot";
import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  trend?: number;
  color?: string;
  live?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(function StatCard(
  { label, value, sub, trend, color, live, icon, className },
  ref,
) {
  const trendColor =
    trend === undefined ? undefined : trend >= 0 ? "var(--bullish)" : "var(--bearish)";

  return (
    <div
      ref={ref}
      className={cn("rounded-md border p-3 transition-colors", className)}
      style={{
        background: "var(--surface)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mb-1.5 flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
        {icon && <span className="text-[11px]">{icon}</span>}
        <span className="text-[11px] font-medium uppercase tracking-wide">{label}</span>
        {live && <LiveDot color="bull" />}
      </div>
      <div
        className="font-mono text-xl font-medium tabular-nums"
        style={{ color: color || "var(--text-primary)" }}
      >
        {value}
      </div>
      <div className="mt-1 flex items-center gap-2">
        {trend !== undefined && (
          <span className="font-mono text-xs tabular-nums" style={{ color: trendColor }}>
            {trend >= 0 ? "+" : ""}
            {trend.toFixed(2)}%
          </span>
        )}
        {sub && (
          <span className="text-[11px]" style={{ color: "var(--text-secondary)" }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
});

export default StatCard;
