// ============================================================================
// BullX Terminal Style — Dark trading terminal aesthetic
// ============================================================================
//
// Inspired by BullX terminal interface.
// Dark background (#121826) with emerald/green accent (#00D4AA).
// Dense information layout, monospace-friendly, professional trading feel.
// ============================================================================

import type { StyleTokens } from "./types";

export const bullxTokens: StyleTokens = {
  id: "bullx",
  name: "BullX Terminal",

  accent: "#00D4AA",
  background: "#121826",
  surface: "#1A2035",
  foreground: "#E8ECF4",
  border: "rgba(255, 255, 255, 0.08)",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  monoFontFamily: "'JetBrains Mono', ui-monospace, 'Fira Code', monospace",
  radius: "0.5rem",

  cssVars: {
    // Background
    "--ws-bg": "#121826",
    "--ws-bg-secondary": "#0E1420",
    "--ws-surface": "#1A2035",
    "--ws-surface-hover": "#1F2847",
    "--ws-surface-active": "#243055",

    // Accent
    "--ws-accent": "#00D4AA",
    "--ws-accent-dim": "rgba(0, 212, 170, 0.15)",
    "--ws-accent-hover": "#00E8BB",
    "--ws-accent-glow": "rgba(0, 212, 170, 0.3)",

    // Text
    "--ws-text-primary": "#E8ECF4",
    "--ws-text-secondary": "#8892A8",
    "--ws-text-tertiary": "#5A6478",
    "--ws-text-accent": "#00D4AA",

    // Semantic
    "--ws-bullish": "#00D4AA",
    "--ws-bearish": "#FF4D6A",
    "--ws-warning": "#FFB020",
    "--ws-info": "#10B981",

    // Borders
    "--ws-border": "rgba(255, 255, 255, 0.08)",
    "--ws-border-accent": "rgba(0, 212, 170, 0.3)",

    // Layout
    "--ws-radius": "0.5rem",
    "--ws-header-height": "48px",
    "--ws-sidebar-width": "280px",
    "--ws-panel-gap": "1px",
  },
} as unknown as StyleTokens;
