#!/usr/bin/env python3
"""Phase A2+A3 combined: Replace THEME with quoted CSS vars + add DataRow a11y.
This is the definitive replacement for PageLayout.tsx."""
import re

filepath = '/home/z/my-project/src/components/vixor/PageLayout.tsx'
with open(filepath) as f:
    content = f.read()

# ── Step 1: Add KeyboardEvent import (A3) ──
content = content.replace(
    'import type { ReactNode } from "react";',
    'import type { ReactNode, KeyboardEvent } from "react";'
)

# ── Step 2: Replace THEME constant definition with comment (A2) ──
theme_block = '''// ── Design Tokens — DexScreener-style dark palette ─────────────────────
export const THEME = {
  // Backgrounds
  bg: "#121212",
  surface: "#1A1A1A",
  surfaceAlt: "#1E1E1E",
  headerBg: "#121212",
  tabBarBg: "#161616",
  rowHover: "rgba(255,255,255,0.03)",
  rowHoverStrong: "rgba(255,255,255,0.06)",

  // Borders
  border: "rgba(255,255,255,0.06)",
  borderLight: "rgba(255,255,255,0.04)",
  borderAccent: "rgba(52,211,153,0.15)",

  // Text
  text: "#FFFFFF",
  textSecondary: "#9CA3AF",
  textMuted: "#6B7280",
  textFaint: "#374151",

  // Semantic colors
  green: "#10B981",
  red: "#EF4444",
  accent: "#34D399",
  accentDeep: "#10B981",
  amber: "#F59E0B",
  purple: "#8B5CF6",
  pink: "#EC4899",
  cyan: "#06B6D4",
  orange: "#F97316",
} as const;'''

content = content.replace(theme_block, '''// ── Design Tokens ─────────────────────────────────────────────────────────
// All colors now use CSS custom properties defined in styles.css.
// This enables proper dark/light theme switching.''')

# ── Step 3: THEME.* → "var(--xxx)" with proper quoting ──
# Map each THEME.key to its CSS var string replacement
THEME_TO_CSS = {
    "THEME.bg": '"var(--color-background)"',
    "THEME.surface": '"var(--color-card)"',
    "THEME.surfaceAlt": '"var(--color-card-hover)"',
    "THEME.headerBg": '"var(--color-background)"',
    "THEME.tabBarBg": '"var(--color-muted)"',
    "THEME.rowHover": '"color-mix(in oklab, var(--color-foreground) 3%, transparent)"',
    "THEME.rowHoverStrong": '"color-mix(in oklab, var(--color-foreground) 6%, transparent)"',
    "THEME.border": '"var(--color-border)"',
    "THEME.borderLight": '"color-mix(in oklab, var(--color-foreground) 4%, transparent)"',
    "THEME.borderAccent": '"color-mix(in oklab, var(--color-primary) 15%, transparent)"',
    "THEME.text": '"var(--color-foreground)"',
    "THEME.textSecondary": '"var(--color-muted-foreground)"',
    "THEME.textMuted": '"var(--color-muted-foreground)"',
    "THEME.textFaint": '"color-mix(in oklab, var(--color-foreground) 25%, transparent)"',
    "THEME.green": '"var(--color-bullish)"',
    "THEME.red": '"var(--color-bearish)"',
    "THEME.accent": '"var(--color-primary)"',
    "THEME.accentDeep": '"var(--color-bullish)"',
    "THEME.amber": '"var(--color-neutral-wait)"',
    "THEME.purple": '"var(--color-info)"',
    "THEME.pink": '"var(--color-bearish)"',
    "THEME.cyan": '"var(--color-info)"',
    "THEME.orange": '"var(--color-neutral-wait)"',
}

# Replace longest keys first to avoid partial matches
for key, val in sorted(THEME_TO_CSS.items(), key=lambda x: -len(x[0])):
    content = content.replace(key, val)

# ── Step 4: Handle ${"var(--color-xxx)"}YY patterns (template literal alpha) ──
# e.g., `${"var(--color-primary)"}`15 should become `color-mix(in oklab, var(--color-primary) 8%, transparent)`
# But these are tricky. For now, handle the common patterns:
content = content.replace('${"var(--color-primary)"}18', 'color-mix(in oklab, var(--color-primary) 10%, transparent)')
content = content.replace('${"var(--color-primary)"}15', 'color-mix(in oklab, var(--color-primary) 8%, transparent)')
content = content.replace('${"var(--color-bullish)"}18', 'color-mix(in oklab, var(--color-bullish) 10%, transparent)')
content = content.replace('${"var(--color-bullish)"}15', 'color-mix(in oklab, var(--color-bullish) 8%, transparent)')
content = content.replace('${"var(--color-bearish)"}18', 'color-mix(in oklab, var(--color-bearish) 10%, transparent)')
content = content.replace('${"var(--color-bearish)"}15', 'color-mix(in oklab, var(--color-bearish) 8%, transparent)')
content = content.replace('${"var(--color-neutral-wait)"}18', 'color-mix(in oklab, var(--color-neutral-wait) 10%, transparent)')
content = content.replace('${"var(--color-neutral-wait)"}15', 'color-mix(in oklab, var(--color-neutral-wait) 8%, transparent)')
content = content.replace('${"var(--color-info)"}18', 'color-mix(in oklab, var(--color-info) 10%, transparent)')
content = content.replace('${"var(--color-info)"}15', 'color-mix(in oklab, var(--color-info) 8%, transparent)')
content = content.replace('${"var(--color-primary)"}10', 'color-mix(in oklab, var(--color-primary) 6%, transparent)')
content = content.replace('${"var(--color-bullish)"}10', 'color-mix(in oklab, var(--color-bullish) 6%, transparent)')

# ── Step 5: Add DataRow accessibility (A3) ──
# Find the DataRow component and add onKeyDown + role + tabIndex
old_datarow = '''export const DataRow = memo(function DataRow({
  children,
  onClick,
  leftAccent,
  style: customStyle,
}: {
  children: ReactNode;
  onClick?: () => void;
  leftAccent?: string;
  style?: Record<string, unknown>;
}) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{'''

new_datarow = '''export const DataRow = memo(function DataRow({
  children,
  onClick,
  leftAccent,
  style: customStyle,
}: {
  children: ReactNode;
  onClick?: () => void;
  leftAccent?: string;
  style?: Record<string, unknown>;
}) {
  const [hovered, setHovered] = useState(false);

  const handleMouseEnter = useCallback(() => setHovered(true), []);
  const handleMouseLeave = useCallback(() => setHovered(false), []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  return (
    <div
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={onClick ? handleKeyDown : undefined}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      style={{'''

content = content.replace(old_datarow, new_datarow)

# ── Step 6: Verify ──
remaining_theme = len(re.findall(r'\bTHEME\.', content))
print(f"Remaining THEME.xxx refs: {remaining_theme}")

with open(filepath, 'w') as f:
    f.write(content)
print("Done!")