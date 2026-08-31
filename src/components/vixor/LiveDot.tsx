import { cn } from "@/shared/utils";
import React from "react";

interface LiveDotProps {
  color?: "bull" | "bear" | "neutral" | "info";
  size?: number;
  pulse?: boolean;
  label?: string;
  className?: string;
}

const COLOR_MAP = {
  bull: "var(--bullish)",
  bear: "var(--bearish)",
  neutral: "var(--neutral-wait)",
  info: "var(--info)",
};

export const LiveDot = React.forwardRef<HTMLSpanElement, LiveDotProps>(function LiveDot(
  { color = "bull", size = 6, pulse = true, label, className },
  ref,
) {
  const colorValue = COLOR_MAP[color];
  return (
    <span
      ref={ref}
      className={cn("inline-block rounded-full", className)}
      style={{
        width: size,
        height: size,
        background: colorValue,
        animation: pulse ? "vixor-pulse 2s ease-in-out infinite" : undefined,
        boxShadow: `0 0 ${size}px ${colorValue}`,
      }}
      role="status"
      aria-label={label || `Live: ${color}`}
    />
  );
});

export default LiveDot;
