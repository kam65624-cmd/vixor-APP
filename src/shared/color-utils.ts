/**
 * Safari-compatible color utilities.
 *
 * `color-mix()` is unsupported in Safari < 16.2. This module provides
 * pure `rgba()` / `rgb()` equivalents for all `color-mix()` calls in the
 * production codebase. No runtime DOM access — uses pre-mapped dark-theme
 * RGB values so it works in SSR and server functions too.
 *
 * Light-mode accuracy is a best-effort approximation; the Telegram WebApp
 * target is Chromium-only, so dark-mode values are the critical path.
 */

// ── Dark theme RGB values (primary) ────────────────────────────────────────────

const DARK_RGB: Record<string, [number, number, number]> = {
  "--color-bullish": [14, 203, 129],
  "--color-bearish": [246, 70, 93],
  "--color-neutral-wait": [245, 158, 11],
  "--color-foreground": [250, 250, 250],
  "--color-muted-foreground": [156, 163, 175],
  "--color-info": [124, 155, 196],
};

// ── Light theme RGB values (secondary, best-effort) ───────────────────────────

const LIGHT_RGB: Record<string, [number, number, number]> = {
  "--color-bullish": [5, 150, 105],
  "--color-bearish": [220, 38, 38],
  "--color-neutral-wait": [217, 119, 6],
  "--color-foreground": [17, 24, 39],
  "--color-muted-foreground": [107, 114, 128],
  "--color-info": [90, 127, 166],
};

// Dark card background: --card = rgba(0, 0, 0, 0.35) → approximate solid #12141A
const CARD_DARK: [number, number, number] = [18, 20, 26];
// Light card background
const CARD_LIGHT: [number, number, number] = [255, 255, 255];

/** Strip `var(...)` wrapper and return the bare CSS variable name. */
function stripVar(cssVar: string): string {
  const m = cssVar.match(/^var\((.+)\)$/);
  return m ? m[1] : cssVar;
}

/** Resolve a CSS variable to its RGB tuple. SSR-safe (no DOM). */
function resolveRGB(cssVar: string): [number, number, number] | null {
  const key = stripVar(cssVar);
  // Check for dark/light preference. Default to dark for SSR.
  let isDark = true;
  if (typeof document !== "undefined") {
    isDark = document.documentElement.classList.contains("dark");
  }
  return (isDark ? DARK_RGB : LIGHT_RGB)[key] ?? null;
}

/** Create an rgba() string at a given alpha (0-1).
 *  Replaces: `color-mix(in oklab, var(--x) N%, transparent)` → `rgba(r,g,b,N/100)`
 */
export function withAlpha(cssVar: string, alpha: number): string {
  const rgb = resolveRGB(cssVar);
  if (rgb) return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${alpha})`;
  // Unknown var — fall back to color-mix for modern browsers
  return `color-mix(in oklab, ${cssVar} ${Math.round(alpha * 100)}%, transparent)`;
}

/** Blend a CSS variable color with the card background at a given alpha.
 *  Replaces: `color-mix(in oklab, var(--x) N%, var(--color-card))` → `rgb(r,g,b)`
 */
export function blendWithCard(cssVar: string, alpha: number): string {
  const rgb = resolveRGB(cssVar);
  if (!rgb) return `color-mix(in oklab, ${cssVar} ${Math.round(alpha * 100)}%, var(--color-card))`;

  let isDark = true;
  if (typeof document !== "undefined") {
    isDark = document.documentElement.classList.contains("dark");
  }
  const card = isDark ? CARD_DARK : CARD_LIGHT;

  // Simple linear blend: result = card + alpha * (color - card)
  const r = Math.round(card[0] + alpha * (rgb[0] - card[0]));
  const g = Math.round(card[1] + alpha * (rgb[1] - card[1]));
  const b = Math.round(card[2] + alpha * (rgb[2] - card[2]));
  return `rgb(${r},${g},${b})`;
}