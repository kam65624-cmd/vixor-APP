import type { ReactNode } from "react";
import { cn } from "@/shared/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  ShieldAlert,
  ShieldQuestion,
  ChevronDown,
  BookOpen,
} from "lucide-react";
import { useState } from "react";

// ═══════════════════════════════════════════════
// RECOMMENDATION TYPE
// ═══════════════════════════════════════════════

export type Recommendation = "BUY" | "SELL" | "WAIT";

// ═══════════════════════════════════════════════
// SECTION TITLE
// ═══════════════════════════════════════════════

export function SectionTitle({
  title,
  action,
  subtitle,
}: {
  title: string;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <div className="flex items-end justify-between mb-3">
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

// ═══════════════════════════════════════════════
// RECOMMENDATION BADGE
// ═══════════════════════════════════════════════

export function RecBadge({ rec, size = "sm" }: { rec: Recommendation; size?: "sm" | "lg" }) {
  const map = {
    BUY: {
      bg: "bg-bullish/15",
      border: "border-bullish/40",
      text: "text-bullish",
      Icon: TrendingUp,
    },
    SELL: {
      bg: "bg-bearish/15",
      border: "border-bearish/40",
      text: "text-bearish",
      Icon: TrendingDown,
    },
    WAIT: {
      bg: "bg-neutral-wait/15",
      border: "border-neutral-wait/40",
      text: "text-neutral-wait",
      Icon: Minus,
    },
  } as const;
  const s = map[rec];
  const Icon = s.Icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-lg border",
        s.bg,
        s.border,
        s.text,
        size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]",
      )}
    >
      <Icon className={size === "lg" ? "size-4" : "size-3"} strokeWidth={2.5} />
      {rec}
    </span>
  );
}

// ═══════════════════════════════════════════════
// CONFIDENCE BAR (Legacy - kept for backward compat)
// ═══════════════════════════════════════════════

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-bullish" : value >= 40 ? "bg-neutral-wait" : "bg-bearish";
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div
        className={cn("h-full rounded-full transition-all duration-1000", color)}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════
// STAT
// ═══════════════════════════════════════════════

export function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: "bullish" | "bearish" | "info" | "neutral";
}) {
  const acc =
    accent === "bullish"
      ? "text-bullish"
      : accent === "bearish"
        ? "text-bearish"
        : accent === "info"
          ? "text-info"
          : "text-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("text-mono text-sm font-semibold", acc)}>{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════
// SETUP STRENGTH BADGE (Premium - replaces Confidence %)
// ═══════════════════════════════════════════════

export type SetupStrength = "STRONG" | "MODERATE" | "WEAK";

export function SetupStrengthBadge({
  strength,
  size = "md",
}: {
  strength: SetupStrength;
  size?: "sm" | "md" | "lg";
}) {
  const config = {
    STRONG: {
      label: "Strong Setup",
      icon: Shield,
      className: "strength-strong",
    },
    MODERATE: {
      label: "Moderate Setup",
      icon: ShieldQuestion,
      className: "strength-moderate",
    },
    WEAK: {
      label: "Weak Setup",
      icon: ShieldAlert,
      className: "strength-weak",
    },
  } as const;

  const c = config[strength];
  const Icon = c.icon;
  const sizeClasses =
    size === "lg"
      ? "px-4 py-2 text-sm gap-2"
      : size === "md"
        ? "px-3 py-1.5 text-xs gap-1.5"
        : "px-2 py-1 text-[10px] gap-1";
  const iconSize = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3";

  return (
    <span
      className={cn(
        "inline-flex items-center font-bold rounded-lg border",
        c.className,
        sizeClasses,
      )}
    >
      <Icon className={iconSize} strokeWidth={2} />
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════
// SETUP STRENGTH BAR (Visual indicator)
// ═══════════════════════════════════════════════

export function SetupStrengthBar({ strength }: { strength: SetupStrength }) {
  const segments = strength === "STRONG" ? 3 : strength === "MODERATE" ? 2 : 1;
  const color =
    strength === "STRONG"
      ? "bg-bullish"
      : strength === "MODERATE"
        ? "bg-neutral-wait"
        : "bg-bearish";

  return (
    <div className="flex gap-1">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-all duration-500",
            i <= segments ? color : "bg-muted",
          )}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// BIAS INDICATOR (Professional direction badge)
// ═══════════════════════════════════════════════

export function BiasIndicator({ direction }: { direction: "BULLISH" | "BEARISH" | "NEUTRAL" }) {
  const config = {
    BULLISH: {
      label: "Bullish",
      icon: TrendingUp,
      className: "text-bullish bg-bullish/10 border-bullish/25",
    },
    BEARISH: {
      label: "Bearish",
      icon: TrendingDown,
      className: "text-bearish bg-bearish/10 border-bearish/25",
    },
    NEUTRAL: {
      label: "Neutral",
      icon: Minus,
      className: "text-neutral-wait bg-neutral-wait/10 border-neutral-wait/25",
    },
  } as const;

  const c = config[direction];
  const Icon = c.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider",
        c.className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.5} />
      {c.label}
    </span>
  );
}

// ═══════════════════════════════════════════════
// COLLAPSIBLE SECTION (Professional expandable)
// ═══════════════════════════════════════════════

export function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="terminal-card overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 collapsible-trigger"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="size-4 text-muted-foreground" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          {badge}
        </div>
        <ChevronDown
          className={cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180",
          )}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// SMC GLOSSARY & EDUCATION LAYER
// ═══════════════════════════════════════════════

const SMC_GLOSSARY: Record<string, string> = {
  "Order Block":
    "A consolidation zone where institutional orders were placed before a strong move. Acts as support/resistance on retests.",
  "Fair Value Gap":
    "A 3-candle imbalance where the wicks of the first and third candles don't overlap, indicating rapid price movement and a potential retest zone.",
  FVG: "See Fair Value Gap — a 3-candle imbalance indicating rapid institutional price movement.",
  Liquidity:
    "Areas where stop losses accumulate (above highs for buy-side, below lows for sell-side), often targeted by smart money.",
  BOS: "Break of Structure — when price breaks a previous swing high/low, confirming trend continuation.",
  ChoCh:
    "Change of Character — the first break against the current trend, signaling a potential reversal.",
  CHOCH: "See ChoCh — the first structural break against the current trend direction.",
  ICT: "Inner Circle Trader methodology — a trading approach focusing on institutional order flow, liquidity, and market structure.",
  SMC: "Smart Money Concepts — trading methodology based on following institutional footprints and order flow.",
  Sweep:
    "When price briefly moves beyond a key level to trigger stop losses before reversing in the intended direction.",
  Mitigation:
    "When price returns to an imbalance zone (OB/FVG) and fills it — these often act as high-probability entry areas.",
  "Break of Structure": "See BOS — a break of the previous swing point confirming trend direction.",
  "Change of Character": "See ChoCh — the first structural break against the current trend.",
  Imbalance:
    "An area of rapid price movement where buying/selling was one-sided, leaving a gap in fair value.",
  Premium:
    "Price zone above the 50% fib of a range where smart money sells — not ideal for buying.",
  Discount:
    "Price zone below the 50% fib of a range where smart money buys — ideal for long entries.",
  OB: "See Order Block — a key institutional zone acting as support or resistance.",
  NWOG: "New Week Opening Gap — the gap between Friday's close and Monday's open, often filled during the week.",
  NDOG: "New Day Opening Gap — the gap between the previous day's close and current day's open.",
  BSL: "Buy-Side Liquidity — stop losses resting above highs that attract price upward like a magnet.",
  SSL: "Sell-Side Liquidity — stop losses resting below lows that attract price downward like a magnet.",
  "Equal Highs":
    "Two or more swing highs at approximately the same price level, creating buy-side liquidity above.",
  "Equal Lows":
    "Two or more swing lows at approximately the same price level, creating sell-side liquidity below.",
};

export function getSMCGlossary() {
  return SMC_GLOSSARY;
}

export function highlightSMCTerms(text: string): React.ReactNode[] {
  const terms = Object.keys(SMC_GLOSSARY);
  const regex = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi",
  );
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (terms.some((t) => t.toLowerCase() === part.toLowerCase())) {
      return (
        <span
          key={i}
          className="term-highlight"
          title={SMC_GLOSSARY[terms.find((t) => t.toLowerCase() === part.toLowerCase())!]}
        >
          {part}
        </span>
      );
    }
    return part;
  });
}

export function EducationLayer({ terms }: { terms: string[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const glossary = SMC_GLOSSARY;
  const uniqueTerms = [...new Set(terms.filter((t) => glossary[t]))];

  if (uniqueTerms.length === 0) return null;

  return (
    <div className="terminal-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <BookOpen className="size-4 text-primary" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          SMC Glossary
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {uniqueTerms.map((term) => (
          <button
            key={term}
            onClick={() => setExpanded(expanded === term ? null : term)}
            className={cn(
              "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all duration-150",
              expanded === term
                ? "term-highlight border-primary/30"
                : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/20",
            )}
          >
            {term}
          </button>
        ))}
      </div>
      {expanded && glossary[expanded] && (
        <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="text-xs font-bold text-primary mb-1">{expanded}</div>
          <p className="text-xs text-muted-foreground leading-relaxed">{glossary[expanded]}</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PRICE CELL (Bloomberg-style data display)
// ═══════════════════════════════════════════════

export function PriceCell({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: "bullish" | "bearish" | "neutral" | "muted";
}) {
  const colorMap = {
    bullish: "text-bullish",
    bearish: "text-bearish",
    neutral: "text-neutral-wait",
    muted: "text-muted-foreground",
  };
  const color = accent ? colorMap[accent] : "text-foreground";

  return (
    <div className="flex flex-col items-center gap-1 p-3">
      <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={cn("text-mono text-base font-bold", color)}>{value}</span>
    </div>
  );
}
