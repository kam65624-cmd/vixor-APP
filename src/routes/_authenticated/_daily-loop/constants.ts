import type { MarketBias, EmotionalState, TradingSession } from "@/domains/daily-loop/types";

// ═══════════════════════════════════════════════
// SHARED STYLE CONSTANTS
// ═══════════════════════════════════════════════

// Gradient endpoint — darker shade of "var(--color-bullish)" for depth
const GREEN_DARK = "#059669";

export const CSS_VARS: React.CSSProperties = {
  "--color-primary": "var(--color-bullish)",
  "--color-primary-foreground": "var(--color-foreground)",
  "--color-muted": "color-mix(in srgb, var(--color-foreground) 5%, transparent)",
  "--color-muted-foreground": "var(--color-muted-foreground)",
  "--color-card": "var(--color-card)",
  "--color-card-hover": "color-mix(in srgb, var(--color-primary) 6%, transparent)",
  "--color-border": "var(--color-border)",
  "--color-bullish": "var(--color-bullish)",
  "--color-bearish": "var(--color-bearish)",
  "--color-neutral-wait": "var(--color-neutral-wait)",
  "--color-info": "var(--color-bullish)",
  "--color-foreground": "var(--color-foreground)",
  "--gradient-primary": `linear-gradient(135deg, ${"var(--color-bullish)"}, ${GREEN_DARK})`,
  "--shadow-glow": `0 0 20px ${"var(--color-bullish)"}4D`,
} as React.CSSProperties;

export const CARD_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: 12,
};

export const GRADIENT_BTN_STYLE: React.CSSProperties = {
  background: `linear-gradient(135deg, ${"var(--color-bullish)"}, ${GREEN_DARK})`,
  color: "var(--color-foreground)",
  boxShadow: `0 0 20px ${"var(--color-bullish)"}4D`,
};

export const INPUT_STYLE: React.CSSProperties = {
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  borderRadius: 8,
  padding: "10px 12px",
  fontSize: 12,
  outline: "none",
  width: "100%",
};

export const TEXTAREA_STYLE: React.CSSProperties = {
  ...INPUT_STYLE,
  resize: "none",
  height: 80,
};

export const LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  display: "block",
  marginBottom: 8,
};

export const SECTION_LABEL_STYLE: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: "var(--color-muted-foreground)",
  textTransform: "uppercase",
  letterSpacing: "0.1em",
};

// ═══════════════════════════════════════════════
// COLOR HELPERS
// ═══════════════════════════════════════════════

export function biasColors(bias: MarketBias | undefined | null): {
  bg: string;
  text: string;
  border: string;
} {
  if (bias === "bullish")
    return {
      bg: `${"var(--color-bullish)"}26`,
      text: "var(--color-bullish)",
      border: `${"var(--color-bullish)"}66`,
    };
  if (bias === "bearish")
    return {
      bg: `${"var(--color-bearish)"}26`,
      text: "var(--color-bearish)",
      border: `${"var(--color-bearish)"}66`,
    };
  return {
    bg: `${"var(--color-neutral-wait)"}26`,
    text: "var(--color-neutral-wait)",
    border: `${"var(--color-neutral-wait)"}66`,
  };
}

// ═══════════════════════════════════════════════
// EMOTIONAL STATE CONFIG
// ═══════════════════════════════════════════════

export const EMOTIONAL_STATES: {
  value: EmotionalState;
  emoji: string;
  label: string;
  color: { bg: string; text: string; border: string };
}[] = [
  {
    value: "disciplined",
    emoji: "💪",
    label: "Disciplined",
    color: {
      bg: `${"var(--color-bullish)"}26`,
      text: "var(--color-bullish)",
      border: `${"var(--color-bullish)"}66`,
    },
  },
  {
    value: "calm",
    emoji: "🧘",
    label: "Calm",
    color: {
      bg: `${"var(--color-bullish)"}26`,
      text: "var(--color-bullish)",
      border: `${"var(--color-bullish)"}66`,
    },
  },
  {
    value: "anxious",
    emoji: "😰",
    label: "Anxious",
    color: {
      bg: `${"var(--color-neutral-wait)"}26`,
      text: "var(--color-neutral-wait)",
      border: `${"var(--color-neutral-wait)"}66`,
    },
  },
  {
    value: "fomo",
    emoji: "🏃",
    label: "FOMO",
    color: {
      bg: `${"var(--color-neutral-wait)"}26`,
      text: "var(--color-neutral-wait)",
      border: `${"var(--color-neutral-wait)"}66`,
    },
  },
  {
    value: "revenge",
    emoji: "🔥",
    label: "Revenge",
    color: {
      bg: `${"var(--color-bearish)"}26`,
      text: "var(--color-bearish)",
      border: `${"var(--color-bearish)"}66`,
    },
  },
  {
    value: "tired",
    emoji: "😴",
    label: "Tired",
    color: {
      bg: "var(--color-card-hover)",
      text: "var(--color-muted-foreground)",
      border: "var(--color-border)",
    },
  },
];

// ═══════════════════════════════════════════════
// SESSION CONFIG
// ═══════════════════════════════════════════════

export const SESSIONS: {
  key: TradingSession;
  label: string;
  hours: string;
  startHour: number;
  endHour: number;
}[] = [
  { key: "london", label: "London", hours: "8:00–16:00 UTC", startHour: 8, endHour: 16 },
  { key: "ny", label: "New York", hours: "13:00–22:00 UTC", startHour: 13, endHour: 22 },
  { key: "asian", label: "Asian", hours: "0:00–8:00 UTC", startHour: 0, endHour: 8 },
];

export function getActiveSession(): TradingSession | null {
  const hour = new Date().getUTCHours();
  for (const s of SESSIONS) {
    if (hour >= s.startHour && hour < s.endHour) return s.key;
  }
  return null;
}
