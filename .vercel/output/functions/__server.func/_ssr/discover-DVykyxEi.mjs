import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useStableServerFn, w as getMarketNews } from "./router-uhgHfevS.mjs";
import { S as Skeleton } from "./skeleton-CoUJiN10.mjs";
import "../_libs/seroval.mjs";
import { C as Compass, Y as Search, _ as Flame, $ as Layers, h as ArrowUpRight, i as ArrowDownRight, a0 as ChartNoAxesColumn, a1 as ExternalLink } from "../_libs/lucide-react.mjs";
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
import "./server-CRLpRGUh.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C7dty81q.mjs";
import "../_libs/zod.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const TABS = ["Watchlist", "Scanner", "News", "Heatmap"];
const mockScanner = [{
  pair: "GBP/JPY",
  signal: "Breakout",
  time: "1H",
  up: true
}, {
  pair: "SPX500",
  signal: "Trend Cont.",
  time: "4H",
  up: true
}, {
  pair: "USDCAD",
  signal: "Reversal",
  time: "1D",
  up: false
}];
const mockWatchlist = [{
  pair: "XAU/USD",
  price: "2368.10",
  change: "+1.2%",
  chart: [2, 3, 5, 4, 7, 6, 8]
}, {
  pair: "EUR/USD",
  price: "1.0845",
  change: "-0.3%",
  chart: [8, 7, 5, 6, 4, 3, 2]
}, {
  pair: "BTC/USD",
  price: "64230",
  change: "+4.5%",
  chart: [1, 2, 4, 3, 6, 8, 9]
}];
function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 6e4);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
function DiscoverNews() {
  const fetchMarketNews = useStableServerFn(getMarketNews);
  const [category, setCategory] = reactExports.useState("forex");
  const {
    data: news = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ["marketNews", category],
    queryFn: () => fetchMarketNews({
      data: {
        category
      }
    }),
    refetchInterval: 6e4
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5 overflow-x-auto pb-1 no-scrollbar", children: ["forex", "general", "crypto", "merger"].map((cat) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setCategory(cat), className: `px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap border transition-all ${category === cat ? "bg-primary/10 border-primary text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"}`, children: cat === "merger" ? "M&A" : cat }, cat)) }),
    isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 flex gap-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-16" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-12" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-full" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-4 w-4/5" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-16 w-16 rounded-lg shrink-0" })
    ] }, i)) }) : error ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-6 text-center text-muted-foreground text-sm", children: "Failed to load news. Please try again." }) : news.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-6 text-center text-muted-foreground text-sm", children: "No news articles found for this category." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: news.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: item.url, target: "_blank", rel: "noopener noreferrer", className: "vixor-card p-4 flex gap-4 hover:border-primary/50 transition-colors group cursor-pointer", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1.5 text-[10px] font-bold text-muted-foreground", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 bg-primary/10 text-primary rounded capitalize", children: item.source }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "•" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: formatTimeAgo(item.time) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1", children: item.title }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground line-clamp-2 font-medium", children: item.summary })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 text-[10px] font-bold text-primary mt-2", children: [
          "Read full article ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ExternalLink, { className: "size-3" })
        ] })
      ] }),
      item.image && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-20 rounded-lg overflow-hidden shrink-0 border border-border bg-muted", children: /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: item.image, alt: "", className: "size-full object-cover group-hover:scale-105 transition-transform duration-300", onError: (e) => {
        e.target.style.display = "none";
      } }) })
    ] }, item.id)) })
  ] });
}
function Discover() {
  const [tab, setTab] = reactExports.useState("Watchlist");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-2xl font-bold tracking-tight flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "size-6 text-primary" }),
        " Market Explorer"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "What's moving right now?" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "text", placeholder: "Search pairs, stocks, crypto...", className: "w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 bg-card border border-border rounded-xl", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), className: `flex-1 h-9 rounded-lg text-xs font-bold transition-all ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: t }, t)) }),
    tab === "Watchlist" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      mockWatchlist.map((w) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 flex items-center justify-between group cursor-pointer hover:border-primary/50 transition-colors", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg text-mono", children: w.pair }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-muted-foreground", children: w.price })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-20 h-8 flex items-end gap-1 opacity-50 group-hover:opacity-100 transition-opacity", children: w.chart.map((h, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `flex-1 rounded-t-sm ${w.change.startsWith("+") ? "bg-bullish" : "bg-bearish"}`, style: {
          height: `${h * 10}%`
        } }, i)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm font-bold text-mono px-2 py-1 rounded ${w.change.startsWith("+") ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`, children: w.change })
      ] }, w.pair)),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "w-full h-12 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-sm hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4" }),
        " Add to Watchlist"
      ] })
    ] }),
    tab === "Scanner" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 border border-primary/20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Flame, { className: "size-4" }),
          " Hot Breakouts"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "h-10 rounded-lg bg-card text-muted-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-4" }),
          " Volume Spikes"
        ] })
      ] }),
      mockScanner.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border-l-4", style: {
        borderLeftColor: s.up ? "var(--color-bullish)" : "var(--color-bearish)"
      }, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-lg text-mono", children: s.pair }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded", children: s.time })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-sm font-bold", children: [
          s.up ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-4 text-bullish" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-4 text-bearish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { children: [
            s.signal,
            " detected"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "ml-auto text-xs font-bold text-primary hover:underline", children: "Analyze" })
        ] })
      ] }, s.pair))
    ] }),
    tab === "News" && /* @__PURE__ */ jsxRuntimeExports.jsx(DiscoverNews, {}),
    tab === "Heatmap" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 flex flex-col items-center justify-center h-64 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "size-8 text-primary" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-lg mb-1", children: "Interactive Heatmap" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mb-4", children: "Visualize market strength across sectors in real-time." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "px-6 h-10 rounded-lg gradient-primary text-primary-foreground font-bold text-sm glow-primary", children: "Unlock Feature" })
    ] }) })
  ] });
}
export {
  Discover as component
};
