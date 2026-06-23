// ============================================================================
// Axiom Grid Style — Deep navy with blue accent
// ============================================================================
//
// Inspired by Axiom trading terminal grid layout.
// Very dark background (#121212) with blue accent (#10B981).
// Clean grid-based layout, ideal for data-dense Discover pages.
// ============================================================================

import type { StyleTokens } from "./types";

export const axiomTokens: StyleTokens = {
  id: "axiom",
  name: "Axiom Grid",

  accent: "#10B981",
  background: "#121212",
  surface: "#1A1A1A",
  foreground: "#FFFFFF",
  border: "rgba(255, 255, 255, 0.06)",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  monoFontFamily: "'JetBrains Mono', ui-monospace, 'Fira Code', monospace",
  radius: "0.75rem",

  cssVars: {
    // Background
    "--ws-bg": "#121212",
    "--ws-bg-secondary": "#0E0E0E",
    "--ws-surface": "#1A1A1A",
    "--ws-surface-hover": "#1E1E1E",
    "--ws-surface-active": "#1E1E1E",

    // Accent
    "--ws-accent": "#10B981",
    "--ws-accent-dim": "rgba(16, 185, 129, 0.12)",
    "--ws-accent-hover": "#34D399",
    "--ws-accent-glow": "rgba(16, 185, 129, 0.25)",

    // Text
    "--ws-text-primary": "#FFFFFF",
    "--ws-text-secondary": "#9CA3AF",
    "--ws-text-tertiary": "#6B7280",
    "--ws-text-accent": "#10B981",

    // Semantic
    "--ws-bullish": "#22C55E",
    "--ws-bearish": "#EF4444",
    "--ws-warning": "#F59E0B",
    "--ws-info": "#10B981",

    // Borders
    "--ws-border": "rgba(255, 255, 255, 0.06)",
    "--ws-border-accent": "rgba(16, 185, 129, 0.25)",

    // Layout
    "--ws-radius": "0.75rem",
    "--ws-header-height": "48px",
    "--ws-sidebar-width": "260px",
    "--ws-panel-gap": "2px",
  },
} as unknown as StyleTokens;
