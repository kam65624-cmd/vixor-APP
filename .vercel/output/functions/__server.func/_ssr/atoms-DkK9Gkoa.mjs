import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { a9 as Minus, aa as TrendingDown, T as TrendingUp, ab as ShieldAlert, ac as ShieldQuestionMark, e as Shield, a8 as ChevronDown, B as BookOpen } from "../_libs/lucide-react.mjs";
function SectionTitle({ title, action, subtitle }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold tracking-tight", children: title }),
      subtitle && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-0.5", children: subtitle })
    ] }),
    action
  ] });
}
function SetupStrengthBadge({ strength, size = "md" }) {
  const config = {
    STRONG: {
      label: "Strong Setup",
      icon: Shield,
      className: "strength-strong"
    },
    MODERATE: {
      label: "Moderate Setup",
      icon: ShieldQuestionMark,
      className: "strength-moderate"
    },
    WEAK: {
      label: "Weak Setup",
      icon: ShieldAlert,
      className: "strength-weak"
    }
  };
  const c = config[strength];
  const Icon = c.icon;
  const sizeClasses = size === "lg" ? "px-4 py-2 text-sm gap-2" : size === "md" ? "px-3 py-1.5 text-xs gap-1.5" : "px-2 py-1 text-[10px] gap-1";
  const iconSize = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
    "inline-flex items-center font-bold rounded-lg border",
    c.className,
    sizeClasses
  ), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: iconSize, strokeWidth: 2 }),
    c.label
  ] });
}
function SetupStrengthBar({ strength }) {
  const segments = strength === "STRONG" ? 3 : strength === "MODERATE" ? 2 : 1;
  const color = strength === "STRONG" ? "bg-bullish" : strength === "MODERATE" ? "bg-neutral-wait" : "bg-bearish";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1", children: [1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      className: cn(
        "h-1 flex-1 rounded-full transition-all duration-500",
        i <= segments ? color : "bg-muted"
      )
    },
    i
  )) });
}
function BiasIndicator({ direction }) {
  const config = {
    BULLISH: { label: "Bullish", icon: TrendingUp, className: "text-bullish bg-bullish/10 border-bullish/25" },
    BEARISH: { label: "Bearish", icon: TrendingDown, className: "text-bearish bg-bearish/10 border-bearish/25" },
    NEUTRAL: { label: "Neutral", icon: Minus, className: "text-neutral-wait bg-neutral-wait/10 border-neutral-wait/25" }
  };
  const c = config[direction];
  const Icon = c.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-bold uppercase tracking-wider",
    c.className
  ), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3.5", strokeWidth: 2.5 }),
    c.label
  ] });
}
function CollapsibleSection({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge
}) {
  const [isOpen, setIsOpen] = reactExports.useState(defaultOpen);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className: "w-full flex items-center justify-between p-4 collapsible-trigger",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-muted-foreground" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: title }),
            badge
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn(
            "size-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          ) })
        ]
      }
    ),
    isOpen && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-4 pb-4 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200", children })
  ] });
}
const SMC_GLOSSARY = {
  "Order Block": "A consolidation zone where institutional orders were placed before a strong move. Acts as support/resistance on retests.",
  "Fair Value Gap": "A 3-candle imbalance where the wicks of the first and third candles don't overlap, indicating rapid price movement and a potential retest zone.",
  "FVG": "See Fair Value Gap — a 3-candle imbalance indicating rapid institutional price movement.",
  "Liquidity": "Areas where stop losses accumulate (above highs for buy-side, below lows for sell-side), often targeted by smart money.",
  "BOS": "Break of Structure — when price breaks a previous swing high/low, confirming trend continuation.",
  "ChoCh": "Change of Character — the first break against the current trend, signaling a potential reversal.",
  "CHOCH": "See ChoCh — the first structural break against the current trend direction.",
  "ICT": "Inner Circle Trader methodology — a trading approach focusing on institutional order flow, liquidity, and market structure.",
  "SMC": "Smart Money Concepts — trading methodology based on following institutional footprints and order flow.",
  "Sweep": "When price briefly moves beyond a key level to trigger stop losses before reversing in the intended direction.",
  "Mitigation": "When price returns to an imbalance zone (OB/FVG) and fills it — these often act as high-probability entry areas.",
  "Break of Structure": "See BOS — a break of the previous swing point confirming trend direction.",
  "Change of Character": "See ChoCh — the first structural break against the current trend.",
  "Imbalance": "An area of rapid price movement where buying/selling was one-sided, leaving a gap in fair value.",
  "Premium": "Price zone above the 50% fib of a range where smart money sells — not ideal for buying.",
  "Discount": "Price zone below the 50% fib of a range where smart money buys — ideal for long entries.",
  "OB": "See Order Block — a key institutional zone acting as support or resistance.",
  "NWOG": "New Week Opening Gap — the gap between Friday's close and Monday's open, often filled during the week.",
  "NDOG": "New Day Opening Gap — the gap between the previous day's close and current day's open.",
  "BSL": "Buy-Side Liquidity — stop losses resting above highs that attract price upward like a magnet.",
  "SSL": "Sell-Side Liquidity — stop losses resting below lows that attract price downward like a magnet.",
  "Equal Highs": "Two or more swing highs at approximately the same price level, creating buy-side liquidity above.",
  "Equal Lows": "Two or more swing lows at approximately the same price level, creating sell-side liquidity below."
};
function highlightSMCTerms(text) {
  const terms = Object.keys(SMC_GLOSSARY);
  const regex = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (terms.some((t) => t.toLowerCase() === part.toLowerCase())) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "term-highlight", title: SMC_GLOSSARY[terms.find((t) => t.toLowerCase() === part.toLowerCase())], children: part }, i);
    }
    return part;
  });
}
function EducationLayer({ terms }) {
  const [expanded, setExpanded] = reactExports.useState(null);
  const glossary = SMC_GLOSSARY;
  const uniqueTerms = [...new Set(terms.filter((t) => glossary[t]))];
  if (uniqueTerms.length === 0) return null;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4 text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "SMC Glossary" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-2", children: uniqueTerms.map((term) => /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => setExpanded(expanded === term ? null : term),
        className: cn(
          "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all duration-150",
          expanded === term ? "term-highlight border-primary/30" : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
        ),
        children: term
      },
      term
    )) }),
    expanded && glossary[expanded] && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 p-3 rounded-lg bg-primary/5 border border-primary/15 animate-in fade-in slide-in-from-top-1 duration-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-primary mb-1", children: expanded }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground leading-relaxed", children: glossary[expanded] })
    ] })
  ] });
}
export {
  BiasIndicator as B,
  CollapsibleSection as C,
  EducationLayer as E,
  SectionTitle as S,
  SetupStrengthBadge as a,
  SetupStrengthBar as b,
  highlightSMCTerms as h
};
