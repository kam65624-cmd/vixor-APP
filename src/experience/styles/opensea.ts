// ============================================================================
// OpenSea Collection Style — Dark slate with cyan accent
// ============================================================================
//
// Inspired by OpenSea NFT collection interface.
// Dark background (#0C111C) with cyan/blue accent (#2081E2).
// Card-based layout with rounded corners, ideal for portfolio/communities.
// ============================================================================

import type { StyleTokens } from "./types";

export const openseaTokens: StyleTokens = {
  id: "opensea",
  name: "OpenSea Collection",

  accent: "#2081E2",
  background: "#0C111C",
  surface: "#161E2E",
  foreground: "#EFF4FB",
  border: "rgba(255, 255, 255, 0.07)",
  fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
  monoFontFamily: "'JetBrains Mono', ui-monospace, 'Fira Code', monospace",
  radius: "1rem",

  cssVars: {
    // Background
    "--ws-bg": "#0C111C",
    "--ws-bg-secondary": "#090D16",
    "--ws-surface": "#161E2E",
    "--ws-surface-hover": "#1B2538",
    "--ws-surface-active": "#212E44",

    // Accent
    "--ws-accent": "#2081E2",
    "--ws-accent-dim": "rgba(32, 129, 226, 0.12)",
    "--ws-accent-hover": "#3D9AEC",
    "--ws-accent-glow": "rgba(32, 129, 226, 0.25)",

    // Text
    "--ws-text-primary": "#EFF4FB",
    "--ws-text-secondary": "#7E8FA6",
    "--ws-text-tertiary": "#4E5D72",
    "--ws-text-accent": "#2081E2",

    // Semantic
    "--ws-bullish": "#22C55E",
    "--ws-bearish": "#EF4444",
    "--ws-warning": "#F59E0B",
    "--ws-info": "#2081E2",

    // Borders
    "--ws-border": "rgba(255, 255, 255, 0.07)",
    "--ws-border-accent": "rgba(32, 129, 226, 0.25)",

    // Layout
    "--ws-radius": "1rem",
    "--ws-header-height": "48px",
    "--ws-sidebar-width": "280px",
    "--ws-panel-gap": "4px",
  },
} as unknown as StyleTokens;
