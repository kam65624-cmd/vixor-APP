/**
 * VIXOR — CharacterHero
 * =====================
 * Animated hero banner for each character surface (MR.VIGO, DR.DEX, ECHO, MOXI).
 *
 * Renders:
 *  - Character-themed animated gradient background
 *  - Character monogram (2-letter avatar with glow)
 *  - Title + tagline + role description
 *  - Optional quick stats grid
 *
 * Reuses existing CSS tokens (--char-{name}-{dim|border|glow}).
 * CSS keyframes defined in src/styles.css.
 *
 * Usage:
 *   <CharacterHero character="vigo" title="MR.VIGO" subtitle="..." />
 *   <CharacterHero character="dex" title="DR.DEX" subtitle="..." stats={[...]} />
 */

import { type ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import { Search, ShieldCheck, TrendingUp, History, Sparkles, type LucideIcon } from "lucide-react";

// ── Character configuration ──────────────────────────────────────────────

export type CharacterId = "moxi" | "vigo" | "dex" | "echo";

export interface CharacterStat {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  tone?: "bullish" | "bearish" | "neutral";
}

export interface CharacterHeroProps {
  character: CharacterId;
  /** Two-character monogram displayed in the avatar circle */
  monogram?: string;
  /** Large title (e.g. "MR.VIGO") */
  title: string;
  /** One-line tagline below the title */
  subtitle: string;
  /** Longer description paragraph */
  description?: string;
  /** Optional LIVE indicator (default false) */
  live?: boolean;
  /** Optional 2-4 stat tiles to show in the bottom row */
  stats?: CharacterStat[];
  /** Optional right-side CTA slot (e.g. action button) */
  action?: ReactNode;
  /** Compact mode (smaller padding, used in cards) */
  compact?: boolean;
  className?: string;
}

const CHARACTER_META: Record<
  CharacterId,
  {
    name: string;
    role: string;
    defaultIcon: LucideIcon;
    bgClass: string;
    badgeClass: string;
    glowClass: string;
  }
> = {
  moxi: {
    name: "MOXI",
    role: "Orchestrator",
    defaultIcon: Sparkles,
    bgClass: "vx-char-bg-moxi",
    badgeClass: "vx-char-badge vx-char-badge-moxi",
    glowClass: "vx-char-glow vx-char-glow-moxi",
  },
  vigo: {
    name: "MR.VIGO",
    role: "The Investigator",
    defaultIcon: Search,
    bgClass: "vx-char-bg-vigo",
    badgeClass: "vx-char-badge vx-char-badge-vigo",
    glowClass: "vx-char-glow vx-char-glow-vigo",
  },
  dex: {
    name: "DR.DEX",
    role: "The Risk Surgeon",
    defaultIcon: ShieldCheck,
    bgClass: "vx-char-bg-dex",
    badgeClass: "vx-char-badge vx-char-badge-dex",
    glowClass: "vx-char-glow vx-char-glow-dex",
  },
  echo: {
    name: "ECHO",
    role: "The Tracker",
    defaultIcon: History,
    bgClass: "vx-char-bg-echo",
    badgeClass: "vx-char-badge vx-char-badge-echo",
    glowClass: "vx-char-glow vx-char-glow-echo",
  },
};

// ── Main component ──────────────────────────────────────────────────────

export function CharacterHero({
  character,
  monogram,
  title,
  subtitle,
  description,
  live = false,
  stats,
  action,
  compact = false,
  className,
}: CharacterHeroProps) {
  const meta = CHARACTER_META[character];
  const Icon = meta.defaultIcon;
  const monogramText = monogram ?? (meta.name.replace(/[^A-Z]/g, "").slice(0, 2) || "VX");

  return (
    <div
      className={cn(
        "vx-char-bg",
        meta.bgClass,
        "rounded-2xl border",
        compact ? "p-4" : "p-6 md:p-8",
        "border-border bg-card",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4",
          stats && stats.length > 0 ? "md:flex-row md:items-center md:justify-between" : "",
        )}
      >
        {/* ── Left: avatar + text ────────────────────────────────────── */}
        <div className="flex items-start gap-4 min-w-0">
          {/* Avatar circle with glow */}
          <div
            className={cn(
              "relative shrink-0",
              compact ? "w-12 h-12" : "w-16 h-16 md:w-20 md:h-20",
              "rounded-full",
              "flex items-center justify-center",
              "bg-card border-2",
              character === "moxi" && "border-[var(--char-moxi)]",
              character === "vigo" && "border-[var(--char-vigo)]",
              character === "dex" && "border-[var(--char-dex)]",
              character === "echo" && "border-[var(--char-echo)]",
              meta.glowClass,
            )}
          >
            <span
              className={cn(
                "font-black tracking-tight",
                compact ? "text-base" : "text-2xl md:text-3xl",
                character === "moxi" && "text-[var(--char-moxi)]",
                character === "vigo" && "text-[var(--char-vigo)]",
                character === "dex" && "text-[var(--char-dex)]",
                character === "echo" && "text-[var(--char-echo)]",
              )}
            >
              {monogramText}
            </span>
            {/* Tiny icon overlay */}
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-5 h-5 rounded-full",
                "bg-card border-2 border-border",
                "flex items-center justify-center",
              )}
            >
              <Icon
                size={10}
                className={cn(
                  character === "moxi" && "text-[var(--char-moxi)]",
                  character === "vigo" && "text-[var(--char-vigo)]",
                  character === "dex" && "text-[var(--char-dex)]",
                  character === "echo" && "text-[var(--char-echo)]",
                )}
              />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={meta.badgeClass}>
                {live && (
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                )}
                {live ? "LIVE" : meta.role}
              </span>
            </div>
            <h1
              className={cn(
                "font-black tracking-tight leading-none",
                compact ? "text-2xl" : "text-3xl md:text-4xl",
                "text-foreground",
              )}
            >
              {title}
            </h1>
            <p
              className={cn(
                "mt-1 text-muted-foreground",
                compact ? "text-xs" : "text-sm md:text-base",
              )}
            >
              {subtitle}
            </p>
            {description && !compact && (
              <p className="mt-2 text-xs text-muted-foreground/80 max-w-xl leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* ── Right: action ─────────────────────────────────────────── */}
        {action && <div className="shrink-0">{action}</div>}
      </div>

      {/* ── Stats grid ────────────────────────────────────────────── */}
      {stats && stats.length > 0 && (
        <div
          className={cn(
            "mt-5 grid gap-3",
            stats.length === 1 && "grid-cols-1",
            stats.length === 2 && "grid-cols-2",
            stats.length === 3 && "grid-cols-2 md:grid-cols-3",
            stats.length >= 4 && "grid-cols-2 md:grid-cols-4",
          )}
        >
          {stats.map((s, i) => {
            const StatIcon = s.icon ?? TrendingUp;
            const toneColor =
              s.tone === "bullish"
                ? "text-[var(--color-bullish)]"
                : s.tone === "bearish"
                  ? "text-[var(--color-bearish)]"
                  : "text-foreground";
            return (
              <div
                key={i}
                className="rounded-lg bg-card/60 border border-border p-3 backdrop-blur-sm"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <StatIcon size={11} />
                  {s.label}
                </div>
                <div className={cn("mt-1 font-bold text-lg tabular-nums", toneColor)}>
                  {s.value}
                </div>
                {s.hint && (
                  <div className="text-[10px] text-muted-foreground/70 mt-0.5">{s.hint}</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Convenience: empty-state wrapper that uses the same background ───────

export function CharacterBackground({
  character,
  children,
  className,
}: {
  character: CharacterId;
  children: ReactNode;
  className?: string;
}) {
  const meta = CHARACTER_META[character];
  return <div className={cn("vx-char-bg", meta.bgClass, "rounded-xl", className)}>{children}</div>;
}
