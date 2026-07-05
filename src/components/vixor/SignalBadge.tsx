import { cn } from "@/shared/utils";
import { withAlpha } from "@/shared/color-utils";

export type SignalKind =
  | "BUY"
  | "SELL"
  | "WAIT"
  | "STRONG_BUY"
  | "STRONG_SELL";

interface SignalConfig {
  label: string;
  short: string;
  color: string;
  bg: string;
  icon: string;
}

const SIGNAL_CONFIG: Record<SignalKind, SignalConfig> = {
  STRONG_BUY: {
    label: "STRONG BUY",
    short: "\u25B2 BUY",
    color: "var(--bullish)",
    bg: "var(--bullish-bg)",
    icon: "\u25B2\u25B2",
  },
  BUY: {
    label: "BUY",
    short: "BUY",
    color: "var(--bullish)",
    bg: "var(--bullish-bg)",
    icon: "\u25B2",
  },
  WAIT: {
    label: "WAIT",
    short: "WAIT",
    color: "var(--neutral-wait)",
    bg: "var(--neutral-wait-bg)",
    icon: "\u25C6",
  },
  SELL: {
    label: "SELL",
    short: "SELL",
    color: "var(--bearish)",
    bg: "var(--bearish-bg)",
    icon: "\u25BC",
  },
  STRONG_SELL: {
    label: "STRONG SELL",
    short: "\u25BC SELL",
    color: "var(--bearish)",
    bg: "var(--bearish-bg)",
    icon: "\u25BC\u25BC",
  },
};

interface SignalBadgeProps {
  signal: SignalKind;
  size?: "sm" | "md" | "lg";
  variant?: "full" | "short" | "icon-only";
  showIcon?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: "text-[10px] px-1.5 py-0.5",
  md: "text-[11px] px-2 py-[3px]",
  lg: "text-sm px-2.5 py-1",
};

export function SignalBadge({
  signal,
  size = "md",
  variant = "full",
  showIcon = true,
  className,
}: SignalBadgeProps) {
  const c = SIGNAL_CONFIG[signal];
  const label =
    variant === "short" ? c.short : variant === "icon-only" ? "" : c.label;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-mono font-medium uppercase tracking-wide whitespace-nowrap",
        SIZE_CLASSES[size],
        className,
      )}
      style={{
        background: c.bg,
        color: c.color,
        border: `1px solid ${withAlpha(c.color, 0.20)}`,
      }}
      role="status"
      aria-label={`Signal: ${c.label}`}
    >
      {showIcon && (
        <span aria-hidden="true" className="leading-none">
          {c.icon}
        </span>
      )}
      {label && <span>{label}</span>}
    </span>
  );
}

export default SignalBadge;