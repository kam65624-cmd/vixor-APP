/** VIXOR Design Tokens — TypeScript constants mirroring CSS custom properties */
export const COLORS = {
  primary: "var(--color-primary)",
  primaryGlow: "var(--color-primary-glow)",
  bullish: "var(--color-bullish)",
  bearish: "var(--color-bearish)",
  neutralWait: "var(--color-neutral-wait)",
  foreground: "var(--color-foreground)",
  muted: "var(--color-muted-foreground)",
  border: "var(--color-border)",
  card: "var(--color-card)",
  cardHover: "var(--color-card-hover)",
  background: "var(--color-background)",
  gold: "var(--color-gold)",
  info: "var(--color-info)",
  tp1: "var(--color-tp1)",
  tp2: "var(--color-tp2)",
  tp3: "var(--color-tp3)",
  destructive: "var(--color-destructive)",
  surface: "var(--color-surface)",
  surface2: "var(--color-surface-2)",
  surface3: "var(--color-surface-3)",
  overlay: "var(--color-overlay)",
} as const;

export const SPACING = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "24px",
  "2xl": "32px",
  "3xl": "48px",
} as const;

export const RADII = {
  xs: "4px",
  sm: "8px",
  md: "12px",
  lg: "16px",
  xl: "20px",
  "2xl": "24px",
  pill: "9999px",
} as const;

export const MOTION = {
  instant: "100ms ease",
  fast: "180ms ease",
  base: "240ms ease-in-out",
  slow: "400ms ease-out",
} as const;

export const SHADOWS = {
  resting: "var(--shadow-resting)",
  elevated: "var(--shadow-elevated)",
  glow: "var(--shadow-glow)",
  floating: "var(--shadow-floating)",
  cardGlow: "var(--shadow-card-glow)",
} as const;

export const GRADIENTS = {
  primary: "var(--gradient-primary)",
  hero: "var(--gradient-hero)",
  bullish: "var(--gradient-bullish)",
  bearish: "var(--gradient-bearish)",
  glass: "var(--gradient-glass)",
} as const;
