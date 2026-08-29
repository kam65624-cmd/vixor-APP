import type React from "react";

// ── Local style constants using THEME ──

export const cardStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 12,
  boxShadow: "var(--shadow-card)",
};

export const inputStyle: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  borderRadius: 8,
  transition: "border-color var(--transition-fast), box-shadow var(--transition-fast)",
  height: 44,
  paddingLeft: 12,
  paddingRight: 12,
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  width: "100%",
  outline: "none",
  boxSizing: "border-box",
};

export const TRADING_STYLES = [
  { id: "Scalping", icon: "⚡", label: "Scalping" },
  { id: "Day Trading", icon: "☀️", label: "Day Trading" },
  { id: "Swing Trading", icon: "🌊", label: "Swing Trading" },
];

export const ANALYSIS_TECHNIQUES = [
  {
    id: "SMC",
    icon: "🏗️",
    label: "SMC",
    desc: "Smart Money Concepts — full BOS, ChoCH, OB, FVG, Liquidity",
  },
  {
    id: "ICT",
    icon: "🎯",
    label: "ICT",
    desc: "Inner Circle Trader — Optimal Trade Entry, Killzones",
  },
  {
    id: "OB_FVG",
    icon: "🧱",
    label: "OB + FVG",
    desc: "Order Blocks & Fair Value Gaps focus",
  },
  {
    id: "CLASSIC",
    icon: "📊",
    label: "Classic TA",
    desc: "Traditional indicators: RSI, MACD, Support/Resistance",
  },
];

export const POPULAR_PAIRS = [
  { value: "auto", label: "Auto-detect", icon: "🔍" },
  { value: "XAU/USD", label: "XAU/USD", icon: "🥇" },
  { value: "EUR/USD", label: "EUR/USD", icon: "🇪🇺" },
  { value: "GBP/USD", label: "GBP/USD", icon: "🇬🇧" },
  { value: "BTC/USDT", label: "BTC/USDT", icon: "₿" },
  { value: "ETH/USDT", label: "ETH/USDT", icon: "Ξ" },
  { value: "USD/JPY", label: "USD/JPY", icon: "🇯🇵" },
  { value: "GBP/JPY", label: "GBP/JPY", icon: "🇬🇧🇯🇵" },
  { value: "SOL/USDT", label: "SOL/USDT", icon: "◎" },
];

export const STEPS_KEYS = [
  "analyze.steps.connecting",
  "analyze.steps.extracting",
  "analyze.steps.computing",
  "analyze.steps.generating",
];
