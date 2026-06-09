import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { M as Minus, o as TrendingDown, T as TrendingUp } from "../_libs/lucide-react.mjs";
function SectionTitle({ title, action }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between mb-3", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold tracking-tight", children: title }),
    action
  ] });
}
function RecBadge({ rec, size = "sm" }) {
  const map = {
    BUY: { bg: "bg-bullish/15", border: "border-bullish/40", text: "text-bullish", Icon: TrendingUp },
    SELL: { bg: "bg-bearish/15", border: "border-bearish/40", text: "text-bearish", Icon: TrendingDown },
    WAIT: { bg: "bg-neutral-wait/15", border: "border-neutral-wait/40", text: "text-neutral-wait", Icon: Minus }
  };
  const s = map[rec];
  const Icon = s.Icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn(
    "inline-flex items-center gap-1 font-semibold rounded-lg border",
    s.bg,
    s.border,
    s.text,
    size === "lg" ? "px-3 py-1.5 text-sm" : "px-2 py-0.5 text-[11px]"
  ), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: size === "lg" ? "size-4" : "size-3", strokeWidth: 2.5 }),
    rec
  ] });
}
function ConfidenceBar({ value }) {
  const color = value >= 70 ? "bg-bullish" : value >= 40 ? "bg-neutral-wait" : "bg-bearish";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 w-full rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("h-full rounded-full transition-all duration-1000", color), style: { width: `${value}%` } }) });
}
export {
  ConfidenceBar as C,
  RecBadge as R,
  SectionTitle as S
};
