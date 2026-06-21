// ============================================================================
// Axiom Grid Style — Deep navy with blue accent
// ============================================================================
//
// Inspired by Axiom trading terminal grid layout.
// Very dark background (#0A0E1A) with blue accent (#3B82F6).
// Clean grid-based layout, ideal for data-dense Discover pages.
// ============================================================================

import type { StyleTokens } from "./types";

export const axiomTokens: StyleTokens = {
  id: "axiom",
  name: "Axiom Grid",

  accent: "#3B82F6",
  background: "#0A0E1A",
  surface: "#111827",
  foreground: "#F0F4FC",
  border: "rgba(255, 255, 255, 0.06)",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  monoFontFamily: "'JetBrains Mono', ui-monospace, 'Fira Code', monospace",
  radius: "0.75rem",

  cssVars: {
    // Background
    "--ws-bg": "#0A0E1A",
    "--ws-bg-secondary": "#070B14",
    "--ws-surface": "#111827",
    "--ws-surface-hover": "#162032",
    "--ws-surface-active": "#1C2A45",

    // Accent
    "--ws-accent": "#3B82F6",
    "--ws-accent-dim": "rgba(59, 130, 246, 0.12)",
    "--ws-accent-hover": "#60A5FA",
    "--ws-accent-glow": "rgba(59, 130, 246, 0.25)",

    // Text
    "--ws-text-primary": "#F0F4FC",
    "--ws-text-secondary": "#7B8BA8",
    "--ws-text-tertiary": "#4A5568",
    "--ws-text-accent": "#3B82F6",

    // Semantic
    "--ws-bullish": "#22C55E",
    "--ws-bearish": "#EF4444",
    "--ws-warning": "#F59E0B",
    "--ws-info": "#3B82F6",

    // Borders
    "--ws-border": "rgba(255, 255, 255, 0.06)",
    "--ws-border-accent": "rgba(59, 130, 246, 0.25)",

    // Layout
    "--ws-radius": "0.75rem",
    "--ws-header-height": "48px",
    "--ws-sidebar-width": "260px",
    "--ws-panel-gap": "2px",
  },
} as unknown as StyleTokens;
