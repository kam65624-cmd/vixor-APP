// ============================================================================
// VIXOR — CharacterGuide
// ============================================================================
//
// Unified character guidance card. One component, six presentation states,
// reused on every character-led surface (Home, Discover, Investigate, Risk,
// Echo) so each character looks and behaves identically everywhere.
//
// State matrix (VIXOR v2 Character System spec):
// ┌──────────┬─────────────────────────────┬────────────┬────────────────┐
// │ state    │ shows                       │ aria-busy  │ action         │
// ├──────────┼─────────────────────────────┼────────────┼────────────────┤
// │ idle     │ tagline / intro             │ no         │ optional       │
// │ loading  │ "gathering signals…"        │ yes        │ hidden         │
// │ ready    │ guidance message            │ no         │ shown          │
// │ working  │ progress message            │ yes        │ hidden         │
// │ success  │ confirmation message        │ no         │ optional       │
// │ error    │ failure message + retry     │ no         │ retry / opt.   │
// └──────────┴─────────────────────────────┴────────────┴────────────────┘
//
// A11y contract:
//   - State changes are announced via a polite live region (role="status").
//   - Async states set aria-busy on the card root.
//   - Actions are real <a> / <button> elements with visible focus rings.
//
// Colors always resolve through the canonical --char-* tokens via
// @/shared/characters — never pass hex literals to this component.
//
// Copy (tagline, description, state messages, actions) resolves through the
// i18n layer via @/shared/characters-i18n. Outside an I18nProvider (unit
// tests) it deterministically falls back to the canonical bridge copy.
// ============================================================================

import { AlertTriangle, CheckCircle2, Loader2, Sparkles, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

import { characterMonogram, getCharacterPresentation, type CharacterId } from "@/shared/characters";
import { useCharacterStrings, useGuideStrings } from "@/shared/characters-i18n";
import { cn } from "@/shared/utils/cn";

export type CharacterGuideState = "idle" | "loading" | "ready" | "working" | "success" | "error";

const BUSY_STATES: ReadonlySet<CharacterGuideState> = new Set(["loading", "working"]);

const STATE_ICONS: Record<CharacterGuideState, LucideIcon | null> = {
  idle: null,
  loading: null,
  ready: Sparkles,
  working: null,
  success: CheckCircle2,
  error: AlertTriangle,
};

export interface CharacterGuideAction {
  label: string;
  /** Renders an <a>; takes precedence over onClick when both are set. */
  href?: string;
  /** Renders a <button>. */
  onClick?: () => void;
}

export interface CharacterGuideProps {
  character: CharacterId;
  state?: CharacterGuideState;
  /** Overrides the default/derived state message. */
  message?: string;
  /** Primary action (CTA). Hidden automatically in async states. */
  action?: CharacterGuideAction;
  /** Rendered in the error state; pairs with the retry button. */
  onRetry?: () => void;
  /** Compact card: name + tagline/status only, no long-form copy. */
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function CharacterGuide({
  character,
  state = "idle",
  message,
  action,
  onRetry,
  compact = false,
  className,
  style,
}: CharacterGuideProps) {
  const char = getCharacterPresentation(character);
  const strings = useCharacterStrings(character);
  const guide = useGuideStrings();
  const Icon = char.icon;
  const StateIcon = STATE_ICONS[state];
  const busy = BUSY_STATES.has(state);
  // "idle" has no message — the tagline stands in (same contract as P0).
  const stateMessage = state === "idle" ? undefined : guide[state];
  const text = message ?? stateMessage ?? strings.tagline;

  // In non-compact idle the tagline already appears in the header — rendering
  // the live region too would duplicate copy and double-announce for screen
  // readers. The status line appears for: explicit messages, async/terminal
  // states, and the compact variant (where the tagline is hidden).
  const showStatus = state !== "idle" || compact || Boolean(message);

  const actionVisible =
    state === "error" ? Boolean(onRetry) || Boolean(action) : !busy && Boolean(action);

  const stateColor =
    state === "error"
      ? "var(--color-danger, #ef4444)"
      : state === "success"
        ? "var(--color-success, #10b981)"
        : char.colorVar;

  return (
    <section
      data-character={char.id}
      data-state={state}
      aria-busy={busy}
      aria-label={guide.ariaLabel(strings.name)}
      className={cn(
        "rounded-2xl border p-5 transition-colors",
        "focus-within:outline-2 focus-within:outline-offset-2",
        className,
      )}
      style={{
        background: char.glowVar,
        borderColor: char.borderVar,
        outlineColor: char.colorVar,
        ...style,
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold"
            style={{ background: char.dimVar, color: char.colorVar }}
          >
            {characterMonogram(char.id)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide" style={{ color: char.colorVar }}>
                {strings.name}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                style={{ background: char.dimVar, color: char.colorVar }}
              >
                {strings.role}
              </span>
            </div>
            {!compact && (
              <p
                className="mt-0.5 text-xs font-medium"
                style={{ color: "var(--color-muted-foreground)" }}
              >
                {strings.tagline}
              </p>
            )}
          </div>
        </div>
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ background: char.dimVar }}
          aria-hidden="true"
        >
          <Icon size={16} style={{ color: char.colorVar }} />
        </div>
      </div>

      {/* State message — polite live region so screen readers announce changes */}
      {showStatus && (
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "flex items-center gap-2 text-sm leading-relaxed",
            compact ? "mt-2" : "mt-4",
          )}
          style={{ color: state === "idle" ? "var(--color-muted-foreground)" : stateColor }}
        >
          {state === "loading" || state === "working" ? (
            <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />
          ) : (
            StateIcon && <StateIcon size={14} className="shrink-0" aria-hidden="true" />
          )}
          {text}
        </p>
      )}

      {/* Long-form description (guide surfaces only) */}
      {!compact && state === "idle" && (
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {strings.description}
        </p>
      )}

      {/* Actions */}
      {actionVisible && (
        <div className="mt-4 flex items-center gap-2">
          {state === "error" && onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                background: char.dimVar,
                color: char.colorVar,
                border: `1px solid ${char.borderVar}`,
              }}
            >
              {guide.retry}
            </button>
          )}
          {action && action.href && (
            <a
              href={action.href}
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                background: char.dimVar,
                color: char.colorVar,
                border: `1px solid ${char.borderVar}`,
              }}
            >
              {action.label}
            </a>
          )}
          {action && !action.href && (
            <button
              type="button"
              onClick={action.onClick}
              className="rounded-lg px-3.5 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{
                background: char.dimVar,
                color: char.colorVar,
                border: `1px solid ${char.borderVar}`,
              }}
            >
              {action.label}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
