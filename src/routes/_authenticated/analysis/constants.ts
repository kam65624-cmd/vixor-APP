// ── Style constants, types, and tab configuration for AnalysisResult ──

export const GREEN_DEEP = "var(--color-bullish)";
export const GREEN_GRAD = `linear-gradient(to right, ${"var(--color-bullish)"}, ${GREEN_DEEP})`;

export const CARD: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: "12px",
  boxShadow: "0 4px 24px -8px oklch(0 0 0 / 0.4)",
};

export const MONO = { fontFamily: "var(--font-mono)" } as const;

export const LABEL: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--color-muted-foreground)",
};

export const TABS = ["Trade Setup", "Market Context", "News Impact", "Management"] as const;

export interface Scenario {
  name: string;
  probability: number;
  entry: string;
  sl: number;
  tp1: number;
  tp2: number;
  rr: string;
}
