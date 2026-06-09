import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Recommendation } from "@/lib/vixor-mock";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-3">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

export function RecBadge({ rec, size = "sm" }: { rec: Recommendation; size?: "sm" | "lg" }) {
  const map = {
    BUY: { bg: "bg-bullish/15", border: "border-bullish/40", text: "text-bullish", Icon: TrendingUp },
    SELL: { bg: "bg-bearish/15", border: "border-bearish/40", text: "text-bearish", Icon: TrendingDown },
    WAIT: { bg: "bg-neutral-wait/15", border: "border-neutral-wait/40", text: "text-neutral-wait", Icon: Minus },
  } as const;
  const s = map[rec];
  const Icon = s.Icon;
  return (
    <span className={cn(
      "inline-flex items-center gap-1 font-semibold rounded-lg border",
      s.bg, s.border, s.text,
      size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"
    )}>
      <Icon className={size === "lg" ? "size-4" : "size-3"} strokeWidth={2.5} />
      {rec}
    </span>
  );
}

export function ConfidenceBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-bullish" : value >= 40 ? "bg-neutral-wait" : "bg-bearish";
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={cn("h-full rounded-full transition-all duration-1000", color)} style={{ width: `${value}%` }} />
    </div>
  );
}

export function Stat({ label, value, accent }: { label: string; value: ReactNode; accent?: "bullish" | "bearish" | "info" | "neutral" }) {
  const acc = accent === "bullish" ? "text-bullish" : accent === "bearish" ? "text-bearish" : accent === "info" ? "text-info" : "text-foreground";
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn("text-mono text-sm font-semibold", acc)}>{value}</span>
    </div>
  );
}
