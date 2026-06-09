import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useServerFn, l as listAnalyses } from "./router-dhCdxqZe.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { B as BookOpen, j as TriangleAlert, a as ChartColumn } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "node:stream";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "../_libs/isbot.mjs";
import "./client-Lj_VRnUR.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server-DAAiN4OG.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-z32ypy3L.mjs";
import "../_libs/zod.mjs";
const TABS = ["Overview", "History", "Reports"];
const mockHistory = [{
  id: 1,
  pair: "XAU/USD",
  type: "LONG",
  pnl: "+$840.00",
  isProfit: true,
  date: "Today, 14:30",
  mistake: null,
  rr: "1:3.2"
}, {
  id: 2,
  pair: "GBP/JPY",
  type: "SHORT",
  pnl: "-$120.00",
  isProfit: false,
  date: "Yesterday, 09:15",
  mistake: "Revenge Trading",
  rr: "1:0.5"
}, {
  id: 3,
  pair: "EUR/USD",
  type: "LONG",
  pnl: "+$210.50",
  isProfit: true,
  date: "12 May, 11:00",
  mistake: null,
  rr: "1:2.1"
}, {
  id: 4,
  pair: "BTC/USD",
  type: "SHORT",
  pnl: "-$300.00",
  isProfit: false,
  date: "11 May, 16:45",
  mistake: "FOMO Entry",
  rr: "1:0.8"
}, {
  id: 5,
  pair: "XAU/USD",
  type: "LONG",
  pnl: "+$450.00",
  isProfit: true,
  date: "10 May, 08:30",
  mistake: null,
  rr: "1:2.5"
}];
function Journal() {
  const [tab, setTab] = reactExports.useState("Overview");
  const fetchAnalyses = useServerFn(listAnalyses);
  const fetchAnalysesRef = reactExports.useRef(fetchAnalyses);
  fetchAnalysesRef.current = fetchAnalyses;
  const analysesQueryFn = reactExports.useCallback(async () => fetchAnalysesRef.current({
    data: {
      limit: 20
    }
  }), []);
  useQuery({
    queryKey: ["analyses-journal"],
    queryFn: analysesQueryFn
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-6 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-5 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold tracking-tight leading-none", children: "Trade Journal" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1", children: "Performance Analytics" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 bg-card border border-border rounded-xl", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), className: `flex-1 h-9 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: t }, t)) }),
    tab === "Overview" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Win Rate" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold font-mono text-bullish", children: "67%" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Trades" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold font-mono text-foreground", children: "48" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Profit Factor" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold font-mono text-primary", children: "1.8" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border-l-4 border-l-bullish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Best Pair" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-base", children: "XAU/USD" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-bullish/10 text-bullish text-[9px] font-bold", children: "+8%" })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border-l-4 border-l-bearish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Worst Pair" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-base", children: "GBP/JPY" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded bg-bearish/10 text-bearish text-[9px] font-bold", children: "-3%" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border border-neutral-wait/30 bg-neutral-wait/5 relative overflow-hidden", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute left-0 top-0 bottom-0 w-1 bg-neutral-wait" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 text-neutral-wait" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[10px] font-bold uppercase tracking-widest text-neutral-wait", children: "Mistake Detector" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-medium leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground", children: "Revenge Trading Detected." }),
          " You've taken 3 consecutive trades on GBP/JPY after hitting your stop loss. Consider taking a 24-hour break from this pair."
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2 pt-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3 px-1", children: "Recent Executions" }),
        mockHistory.slice(0, 3).map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryRow, { h }, h.id))
      ] })
    ] }),
    tab === "History" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300", children: mockHistory.map((h) => /* @__PURE__ */ jsxRuntimeExports.jsx(HistoryRow, { h }, h.id)) }),
    tab === "Reports" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-8 text-center border-dashed", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "size-10 text-muted-foreground/50 mx-auto mb-3" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-lg font-bold mb-1", children: "Advanced Analytics" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "Unlock detailed performance reports and AI trade reviews with Premium." })
    ] })
  ] });
}
function HistoryRow({
  h
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3.5 flex items-center justify-between border-l-4 transition-colors hover:bg-card-hover cursor-pointer", style: {
    borderLeftColor: h.isProfit ? "var(--bullish)" : "var(--bearish)"
  }, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${h.isProfit ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`, children: h.type }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm", children: h.pair })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-[10px] font-mono text-muted-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: h.date }),
        h.mistake && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "bg-neutral-wait/10 text-neutral-wait px-1.5 py-0.5 rounded font-bold border border-neutral-wait/20", children: h.mistake })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `font-bold font-mono text-base ${h.isProfit ? "text-bullish" : "text-bearish"}`, children: h.pnl }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono font-bold text-muted-foreground", children: [
        "R:R ",
        h.rr
      ] })
    ] })
  ] });
}
export {
  Journal as component
};
