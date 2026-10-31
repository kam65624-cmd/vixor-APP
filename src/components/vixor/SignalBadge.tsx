import { cn } from "@/shared/utils";
import { withAlpha } from "@/shared/color-utils";

// Machine-readable signal identifiers (legacy data format, kept for DB/API
// compatibility — see Stage 1 scope decision S1-1). Human-facing labels are
// rendered as neutral research language by SIGNAL_CONFIG below.
export type SignalKind = "BUY" | "SELL" | "WAIT" | "STRONG_BUY" | "STRONG_SELL";

interface SignalConfig {
  label: string;
  short: string;
  color: string;
  bg: string;
  icon: string;
}

// Stage 1 scope decision (S1-1, TASK 38): VIXOR presents research signals in
// neutral research language (bullish/bearish/neutral), never as BUY/SELL
// trading instructions. Machine-readable SignalKind values are historical
// identifiers only.
const SIGNAL_CONFIG: Record<SignalKind, SignalConfig> = {
  STRONG_BUY: {
    label: "STRONG BULLISH",
    short: "\u25B2 BULLISH",
    color: "var(--bullish)",
    bg: "var(--bullish-bg)",
    icon: "\u25B2\u25B2",
  },
  BUY: {
    label: "BULLISH",
    short: "BULLISH",
    color: "var(--bullish)",
    bg: "var(--bullish-bg)",
    icon: "\u25B2",
  },
  WAIT: {
    label: "NEUTRAL",
    short: "NEUTRAL",
    color: "var(--neutral-wait)",
    bg: "var(--neutral-wait-bg)",
    icon: "\u25C6",
  },
  SELL: {
    label: "BEARISH",
    short: "BEARISH",
    color: "var(--bearish)",
    bg: "var(--bearish-bg)",
    icon: "\u25BC",
  },
  STRONG_SELL: {
    label: "STRONG BEARISH",
    short: "\u25BC BEARISH",
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
  sm: "text-xs px-1.5 py-0.5",
  md: "text-xs px-2 py-[3px]",
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
  const label = variant === "short" ? c.short : variant === "icon-only" ? "" : c.label;

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
        border: `1px solid ${withAlpha(c.color, 0.2)}`,
      }}
      role="status"
      aria-label={`Research signal: ${c.label}`}
    >
      {showIcon && (
        <span aria-hidden="true" className="leading-none">
          {c.icon}
        </span>
      )}
      {label && <span>{label}</span>}
      {/* research framing — no trade instruction (S1-1) */}
    </span>
  );
}

export default SignalBadge;
