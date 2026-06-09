import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, g as getMe, l as listAnalyses } from "./router-BBF5Hwjm.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { Z as Zap, S as Sparkles, h as Camera, A as Activity, i as TriangleAlert, j as ChartNoAxesColumn, d as ChevronRight, N as Newspaper, k as ArrowUpRight, l as ArrowDownRight, m as Clock } from "../_libs/lucide-react.mjs";
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
import "../_libs/tanstack__query-core.mjs";
import "./client-CjdFgX-H.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "./server--GDeO9-a.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-CT92Npo9.mjs";
import "../_libs/zod.mjs";
function CommandCenter() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchRecent = useServerFn(listAnalyses);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({})
  });
  useQuery({
    queryKey: ["analyses", 5],
    queryFn: () => fetchRecent({
      limit: 5
    })
  });
  const name = me.data?.profile?.display_name?.split(" ")[0] || "Trader";
  const xp = me.data?.profile?.xp ?? 1250;
  const isPremium = !!me.data?.isPremium;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-6 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Good Evening, Trader" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h1", { className: "text-3xl font-bold tracking-tight text-foreground flex items-center gap-2", children: [
          name,
          " ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "animate-wave origin-bottom-right inline-block", children: "👋" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-end gap-2", children: [
        isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-widest glow-primary", children: "PRO" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1 px-2.5 py-1 rounded-md bg-card border border-border text-[10px] font-bold text-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-3 text-info" }),
          " ",
          xp,
          " pts"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { onClick: () => navigate({
      to: "/analyze"
    }), className: "relative overflow-hidden rounded-2xl p-5 cursor-pointer group active:scale-[0.98] transition-all", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-[#059669]/90 to-[#064e3b]/90" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 w-32 h-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-5 text-emerald-200 mb-3" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold text-white mb-1", children: "Analyze Your Chart" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-emerald-100 font-medium opacity-90", children: "SMC and ICT-powered signal in seconds" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-5 text-white" }) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "Market Pulse" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-1.5 rounded-full bg-primary animate-pulse" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold text-primary uppercase tracking-widest", children: "Live" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(PulseItem, { pair: "XAU/USD", price: "2,348.50", change: "+0.42%", up: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PulseItem, { pair: "EUR/USD", price: "1.0842", change: "0.02%", neutral: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PulseItem, { pair: "BTC/USD", price: "64,210", change: "+1.85%", up: true }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(PulseItem, { pair: "GBP/JPY", price: "192.45", change: "-0.31%", down: true })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border-l-4 border-l-primary relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 size-32 bg-primary/5 blur-2xl rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-primary", children: "AI Daily Focus" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground leading-relaxed relative", children: "CPI volatility expected in NY Session. Liquidity clusters detected at $64,200. Consider tightening stops on active USD pairs." })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between px-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 text-bearish" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "High Impact Events" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card divide-y divide-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(EventRow, { time: "14:00", currency: "USD", name: "FOMC Meeting" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(EventRow, { time: "08:30", currency: "USD", name: "NFP Report" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(EventRow, { time: "10:45", currency: "EUR", name: "ECB Press Conf" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "size-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "Active Trades" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/trade-desk", className: "text-[10px] font-bold text-primary flex items-center hover:underline", children: [
          "View All ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-bold bg-bullish/10 text-bullish uppercase", children: "LONG" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm", children: "XAU/USD" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm text-bullish", children: "+$1,240.45" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground font-mono mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Entry: 2348.50" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Curr: 2354.20" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-card-hover rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-bullish rounded-full w-[72%]" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-bold bg-bearish/10 text-bearish uppercase", children: "SHORT" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm", children: "EUR/USD" })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm text-bearish", children: "-$210.12" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-xs text-muted-foreground font-mono mb-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Entry: 1.0842" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Curr: 1.0865" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1 bg-card-hover rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-bearish rounded-full w-[18%]" }) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between px-1", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "Market News" })
      ] }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(NewsCard, { source: "Reuters", time: "2h ago", headline: "Gold prices hit record high as investors digest Fed minutes" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NewsCard, { source: "Bloomberg", time: "4h ago", headline: "Euro struggles to maintain momentum ahead of critical ECB decision" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(NewsCard, { source: "CoinDesk", time: "5h ago", headline: "Bitcoin liquidations surpass $200M after sudden price swing" })
      ] })
    ] })
  ] });
}
function PulseItem({
  pair,
  price,
  change,
  up,
  down,
  neutral
}) {
  const color = up ? "text-bullish" : down ? "text-bearish" : "text-muted-foreground";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-xl bg-card border border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-foreground mb-1", children: pair }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-semibold mb-1.5", children: price }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-1 text-[10px] font-bold ${color}`, children: [
      up && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-3" }),
      down && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-3" }),
      !up && !down && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-1.5 rounded-full bg-muted-foreground mx-1" }),
      change
    ] })
  ] });
}
function EventRow({
  time,
  currency,
  name
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-full bg-bearish/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-4 text-bearish" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm", children: name }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] font-mono text-muted-foreground", children: [
          time,
          " | ",
          currency
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-0.5 rounded text-[9px] font-bold bg-bearish/10 text-bearish border border-bearish/20", children: "HIGH" })
  ] });
}
function NewsCard({
  source,
  headline,
  time
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3.5 flex items-start gap-3 active:scale-[0.98] transition-transform cursor-pointer", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-1.5 py-0.5 rounded", children: source }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-muted-foreground", children: time })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-sm font-bold leading-snug line-clamp-2", children: headline })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-14 rounded-lg bg-card-hover border border-border shrink-0 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "size-5 text-muted-foreground/30" }) })
  ] });
}
export {
  CommandCenter as component
};
