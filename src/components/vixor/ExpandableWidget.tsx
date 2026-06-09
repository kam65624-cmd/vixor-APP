"use client";

import { type ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

// ═══════════════════════════════════════════════
// VARIANT CONFIGURATION
// ═══════════════════════════════════════════════

export type WidgetVariant =
  | "bullish"
  | "bearish"
  | "neutral"
  | "info"
  | "warning"
  | "aggressive";

interface VariantConfig {
  /** Color value for the inline-start border (uses CSS logical property for RTL) */
  borderColor: string;
  /** Tailwind text color class for icons */
  textColor: string;
  /** Tailwind gradient-from class for header background */
  gradientFrom: string;
  /** Tailwind background class for badge tinting */
  badgeBg: string;
  /** Tailwind border class for badge */
  badgeBorder: string;
}

const VARIANT_MAP: Record<WidgetVariant, VariantConfig> = {
  bullish: {
    borderColor: "var(--color-bullish)",
    textColor: "text-bullish",
    gradientFrom: "from-bullish/5",
    badgeBg: "bg-bullish/15",
    badgeBorder: "border-bullish/40",
  },
  bearish: {
    borderColor: "var(--color-bearish)",
    textColor: "text-bearish",
    gradientFrom: "from-bearish/5",
    badgeBg: "bg-bearish/15",
    badgeBorder: "border-bearish/40",
  },
  neutral: {
    borderColor: "var(--color-neutral-wait)",
    textColor: "text-neutral-wait",
    gradientFrom: "from-neutral-wait/5",
    badgeBg: "bg-neutral-wait/15",
    badgeBorder: "border-neutral-wait/40",
  },
  info: {
    borderColor: "var(--color-info)",
    textColor: "text-info",
    gradientFrom: "from-info/5",
    badgeBg: "bg-info/15",
    badgeBorder: "border-info/40",
  },
  warning: {
    borderColor: "var(--color-neutral-wait)",
    textColor: "text-neutral-wait",
    gradientFrom: "from-neutral-wait/5",
    badgeBg: "bg-neutral-wait/15",
    badgeBorder: "border-neutral-wait/40",
  },
  aggressive: {
    borderColor: "#FF9800",
    textColor: "text-[#FF9800]",
    gradientFrom: "from-[#FF9800]/5",
    badgeBg: "bg-[#FF9800]/15",
    badgeBorder: "border-[#FF9800]/40",
  },
};

// ═══════════════════════════════════════════════
// EXPANDABLE WIDGET
// ═══════════════════════════════════════════════

export interface ExpandableWidgetProps {
  /** Header title (always visible) */
  title: string;
  /** Optional subtitle below the title */
  subtitle?: string;
  /** Optional icon component rendered in the header */
  icon?: React.ComponentType<{ className?: string }>;
  /** Visual variant controlling the left border color and tinting */
  variant?: WidgetVariant;
  /** Badge element (e.g. "BUY", "SELL", "POSITIVE") */
  badge?: ReactNode;
  /** Key metric value (e.g. "85%", "1:3.2", "$1,240") */
  metric?: string;
  /** Label for the metric (e.g. "Confidence", "R:R", "P&L") */
  metricLabel?: string;
  /** Content visible when expanded */
  children: ReactNode;
  /** Whether the widget starts expanded */
  defaultExpanded?: boolean;
  /** Callback when the widget is expanded */
  onExpand?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Use smaller padding for list-style items */
  compact?: boolean;
}

export function ExpandableWidget({
  title,
  subtitle,
  icon: Icon,
  variant = "bullish",
  badge,
  metric,
  metricLabel,
  children,
  defaultExpanded = false,
  onExpand,
  className,
  compact = false,
}: ExpandableWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = useCallback(() => {
    const next = !isExpanded;
    setIsExpanded(next);
    if (next && onExpand) {
      onExpand();
    }
  }, [isExpanded, onExpand]);

  const cfg = VARIANT_MAP[variant];

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border border-border bg-card",
        "shadow-[0_4px_24px_-8px_oklch(0_0_0/0.1)]",
        "transition-shadow duration-200",
        "hover:shadow-[0_4px_24px_-8px_oklch(0_0_0/0.18)]",
        className,
      )}
      style={{
        borderInlineStartColor: cfg.borderColor,
        borderInlineStartWidth: "3px",
      }}
    >
      {/* ── Header ── */}
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "collapsible-trigger w-full flex items-center justify-between gap-3 text-left",
          "bg-gradient-to-r to-transparent",
          cfg.gradientFrom,
          compact ? "px-3 py-2.5" : "px-4 py-3.5",
        )}
        aria-expanded={isExpanded}
      >
        {/* Left: Icon + Title + Subtitle */}
        <div className="flex items-center gap-2.5 min-w-0">
          {Icon && (
            <Icon
              className={cn(
                "shrink-0",
                cfg.textColor,
                compact ? "size-4" : "size-4.5",
              )}
            />
          )}
          <div className="min-w-0">
            <span
              className={cn(
                "block font-semibold leading-tight truncate",
                compact ? "text-xs" : "text-sm",
              )}
            >
              {title}
            </span>
            {subtitle && (
              <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5 truncate">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        {/* Right: Badge + Metric + Chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          {badge && (
            <span
              className={cn(
                "inline-flex items-center font-bold rounded-md border",
                cfg.badgeBg,
                cfg.badgeBorder,
                cfg.textColor,
                compact ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-[11px]",
              )}
            >
              {badge}
            </span>
          )}
          {metric && (
            <div className="flex flex-col items-end">
              <span
                className={cn(
                  "font-mono font-bold leading-tight text-mono",
                  cfg.textColor,
                  compact ? "text-xs" : "text-sm",
                )}
              >
                {metric}
              </span>
              {metricLabel && (
                <span className="text-[10px] text-muted-foreground leading-tight">
                  {metricLabel}
                </span>
              )}
            </div>
          )}
          <ChevronDown
            className={cn(
              "size-4 text-muted-foreground transition-transform duration-300 ease-in-out shrink-0",
              isExpanded && "rotate-180",
            )}
          />
        </div>
      </button>

      {/* ── Expandable Content ── */}
      <div
        className={cn(
          "transition-[max-height,opacity] duration-300 ease-in-out",
          isExpanded
            ? "max-h-[1000px] opacity-100"
            : "max-h-0 opacity-0 overflow-hidden",
        )}
        aria-hidden={!isExpanded}
      >
        <div
          className={cn(
            "animate-in fade-in slide-in-from-top-1 duration-300",
            compact ? "px-3 pb-3 pt-1" : "px-4 pb-4 pt-2",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MINI WIDGET (compact inline version)
// ═══════════════════════════════════════════════

export interface MiniWidgetProps {
  title: string;
  value: string;
  variant?: WidgetVariant;
  icon?: React.ComponentType<{ className?: string }>;
  onClick?: () => void;
  className?: string;
}

export function MiniWidget({
  title,
  value,
  variant = "bullish",
  icon: Icon,
  onClick,
  className,
}: MiniWidgetProps) {
  const cfg = VARIANT_MAP[variant];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-md border border-border bg-card",
        "px-3 py-2 text-left transition-colors duration-150",
        onClick && "cursor-pointer hover:bg-card-hover",
        className,
      )}
      style={{
        borderInlineStartColor: cfg.borderColor,
        borderInlineStartWidth: "2px",
      }}
    >
      {Icon && <Icon className={cn("size-3.5 shrink-0", cfg.textColor)} />}
      <span className="text-[11px] text-muted-foreground truncate flex-1">
        {title}
      </span>
      <span
        className={cn(
          "text-xs font-mono font-bold text-mono shrink-0",
          cfg.textColor,
        )}
      >
        {value}
      </span>
    </button>
  );
}

// ═══════════════════════════════════════════════
// WIDGET GROUP (grouping container)
// ═══════════════════════════════════════════════

export interface WidgetGroupProps {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  /** Optional action slot (e.g. "View All" link) */
  action?: ReactNode;
  className?: string;
}

export function WidgetGroup({
  title,
  icon: Icon,
  children,
  action,
  className,
}: WidgetGroupProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Group header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </h3>
        </div>
        {action}
      </div>

      {/* Group content */}
      <div className="space-y-2">{children}</div>
    </div>
  );
}
