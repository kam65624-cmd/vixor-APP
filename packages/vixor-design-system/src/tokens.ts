// ============================================================================
// VIXOR Design System — Tokens
// ============================================================================

export const COLOR_TOKENS = {
  // Shared Dark Theme Foundations
  background: "#0F1117",
  card: "#181B25",
  cardBorder: "rgba(255, 255, 255, 0.08)",
  foreground: "#F1F5F9",
  mutedForeground: "#94A3B8",

  // Semantic Trading Colors
  bullish: "#22D3A6",
  bearish: "#FB4667",
  neutralWait: "#F59E0B",
  info: "#6366F1",
  gold: "#EAB308",

  // Product Skins
  hunt: {
    primary: "#22D3A6",
    accent: "#6366F1",
    cardGlow: "rgba(34, 211, 166, 0.15)",
  },
  shield: {
    primary: "#312E81",
    secondary: "#7C3AED",
    alert: "#B8E62E",
    emerald: "#10B981",
    danger: "#E63946",
    amber: "#F59E0B",
    cardGlow: "rgba(124, 58, 237, 0.15)",
  },
  trade: {
    primary: "#6366F1",
    accent: "#22D3A6",
    cardGlow: "rgba(99, 102, 241, 0.15)",
  },
} as const;

export const TYPOGRAPHY_TOKENS = {
  fontSans: "'Inter', sans-serif",
  fontMono: "'JetBrains Mono', monospace",
  fontDisplay: "'Space Grotesk', sans-serif",
} as const;
