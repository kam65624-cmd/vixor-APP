import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { S as SectionTitle } from "./atoms-DkK9Gkoa.mjs";
import { R as Search, P as Plus, b as Bell, X as Layers, S as Sparkles } from "../_libs/lucide-react.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const watchlist = [
  { pair: "BTC/USDT", price: 67482.15, change: 2.34 },
  { pair: "ETH/USDT", price: 3521.88, change: -0.62 },
  { pair: "EUR/USD", price: 1.0842, change: -0.18 },
  { pair: "XAU/USD", price: 2342.6, change: 1.12 },
  { pair: "SOL/USDT", price: 168.4, change: 4.05 },
  { pair: "GBP/JPY", price: 197.34, change: 0.41 }
];
const timeframes = ["1m", "5m", "15m", "1H", "4H", "1D", "1W"];
function Charts() {
  const [tf, setTf] = reactExports.useState("4H");
  const [sym, setSym] = reactExports.useState(watchlist[0]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-card border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Search pair…", className: "bg-transparent flex-1 text-sm outline-none" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: sym.pair }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold text-mono", children: [
            "$",
            sym.price.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-sm font-semibold text-mono ${sym.change >= 0 ? "text-bullish" : "text-bearish"}`, children: [
            sym.change >= 0 ? "+" : "",
            sym.change,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-9 rounded-xl bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-44 mt-3", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("svg", { className: "w-full h-full", viewBox: "0 0 400 180", preserveAspectRatio: "none", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("defs", { children: /* @__PURE__ */ jsxRuntimeExports.jsxs("linearGradient", { id: "cg", x1: "0", x2: "0", y1: "0", y2: "1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "0%", stopColor: "oklch(0.72 0.17 162)", stopOpacity: "0.4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("stop", { offset: "100%", stopColor: "oklch(0.72 0.17 162)", stopOpacity: "0" })
        ] }) }),
        [40, 80, 120].map((y) => /* @__PURE__ */ jsxRuntimeExports.jsx("line", { x1: "0", x2: "400", y1: y, y2: y, stroke: "oklch(1 0 0 / 0.05)" }, y)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M 0 140 L 30 130 L 60 135 L 90 110 L 120 115 L 150 90 L 180 100 L 210 70 L 240 80 L 270 50 L 300 65 L 330 40 L 360 55 L 400 35 L 400 180 L 0 180 Z", fill: "url(#cg)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("path", { d: "M 0 140 L 30 130 L 60 135 L 90 110 L 120 115 L 150 90 L 180 100 L 210 70 L 240 80 L 270 50 L 300 65 L 330 40 L 360 55 L 400 35", fill: "none", stroke: "oklch(0.72 0.17 162)", strokeWidth: "2" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 mt-3 overflow-x-auto scrollbar-hide", children: [
        timeframes.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTf(t), className: `px-3 h-7 rounded-md text-xs font-semibold whitespace-nowrap transition ${tf === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`, children: t }, t)),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-8 rounded-md bg-muted flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-4 text-muted-foreground" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "mt-3 w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4" }),
        " Analyze this chart"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: "Watchlist" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card divide-y divide-border", children: watchlist.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setSym(w), className: "w-full p-3 flex items-center gap-3 vixor-card-hover", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-lg bg-muted flex items-center justify-center text-[10px] font-bold text-mono", children: w.pair.split("/")[0].slice(0, 3) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 text-left", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm text-mono", children: w.pair }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "Live" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-semibold text-mono", children: [
            "$",
            w.price.toLocaleString()
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-xs text-mono ${w.change >= 0 ? "text-bullish" : "text-bearish"}`, children: [
            w.change >= 0 ? "+" : "",
            w.change,
            "%"
          ] })
        ] })
      ] }, w.pair)) })
    ] })
  ] });
}
export {
  Charts as component
};
