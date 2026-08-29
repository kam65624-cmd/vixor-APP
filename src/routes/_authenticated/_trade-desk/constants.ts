// ── Trading Pairs & Sizes ──

export const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"];

export const PIP_SIZES: Record<string, number> = {
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
  XAUUSD: 0.1,
  BTCUSD: 1,
};

export const LOT_SIZES: Record<string, number> = {
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,
  XAUUSD: 100,
  BTCUSD: 1,
};

// ── Shared CSS-in-JS Styles ──

export const card: React.CSSProperties = {
  background: "var(--color-card)",
  border: "1px solid var(--color-border)",
  borderRadius: "16px",
  boxShadow: "var(--shadow-card)",
};

export const mono: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
};

export const labelStyle: React.CSSProperties = {
  fontSize: "12px",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "var(--color-muted-foreground)",
};

export const inputStyle: React.CSSProperties = {
  background: "color-mix(in srgb, var(--color-foreground) 4%, transparent)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease, background var(--transition-fast)",
};

// ── Computed Result Type ──

export interface RiskCalcResult {
  lots: string;
  riskAmount: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
}

// ── Order Summary Type (used by dialog) ──

export interface OrderSummary {
  entry: number;
  slPrice: number | null;
  quantity: string;
  estimatedCost: string;
}
