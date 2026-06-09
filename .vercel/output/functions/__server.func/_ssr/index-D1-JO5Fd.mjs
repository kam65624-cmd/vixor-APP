import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useStableServerFn, g as getMe, l as listAnalyses, a as getMarketPrices, b as getDailySignals, d as listAlerts } from "./router-CVPLbV6q.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { R as RecBadge } from "./atoms-Cww8dxsu.mjs";
import "../_libs/seroval.mjs";
import { Z as Zap, S as Sparkles, g as Camera, A as Activity, h as ArrowUpRight, i as ArrowDownRight, d as ChevronRight, T as TrendingUp, j as TriangleAlert, b as Bell, N as Newspaper, k as Clock } from "../_libs/lucide-react.mjs";
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
import "./server-DadpqRNH.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-BsyW0aBd.mjs";
import "../_libs/zod.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function CommandCenter() {
  const navigate = useNavigate();
  const fetchMe = useStableServerFn(getMe);
  const fetchRecent = useStableServerFn(listAnalyses);
  const fetchPrices = useStableServerFn(getMarketPrices);
  const fetchSignals = useStableServerFn(getDailySignals);
  const fetchAlerts = useStableServerFn(listAlerts);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({})
  });
  useQuery({
    queryKey: ["analyses", 5],
    queryFn: () => fetchRecent({
      data: {
        limit: 5
      }
    }),
    staleTime: 6e4
  });
  const prices = useQuery({
    queryKey: ["market-prices"],
    queryFn: () => fetchPrices({}),
    staleTime: 6e4,
    refetchInterval: 12e4
  });
  const signals = useQuery({
    queryKey: ["daily-signals"],
    queryFn: () => fetchSignals({
      data: {}
    }),
    staleTime: 12e4
  });
  const alerts = useQuery({
    queryKey: ["alerts-dashboard"],
    queryFn: () => fetchAlerts({
      data: {}
    }),
    staleTime: 3e4
  });
  const name = me.data?.profile?.display_name?.split(" ")[0] || "Trader";
  const xp = me.data?.profile?.xp ?? 1250;
  const isPremium = !!me.data?.isPremium;
  const activeAlerts = (alerts.data ?? []).filter((a) => a.status === "active");
  const topSignals = (signals.data ?? []).filter((s) => s.recommendation !== "WAIT").slice(0, 3);
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
      prices.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: [1, 2, 3, 4].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 rounded-xl bg-card border border-border shimmer h-20" }, i)) }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: (prices.data ?? []).map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `/charts?symbol=${p.symbol}`, className: "p-3 rounded-xl bg-card border border-border vixor-card-hover block", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-foreground mb-1", children: p.pair }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-mono text-sm font-semibold mb-1.5", children: [
          "$",
          Number(p.price).toLocaleString(void 0, {
            minimumFractionDigits: 2,
            maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4
          })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex items-center gap-1 text-[10px] font-bold ${(p.change24h ?? 0) >= 0 ? "text-bullish" : "text-bearish"}`, children: [
          (p.change24h ?? 0) >= 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-3" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-3" }),
          (p.change24h ?? 0) >= 0 ? "+" : "",
          (p.change24h ?? 0).toFixed(2),
          "%"
        ] })
      ] }, p.pair)) })
    ] }),
    topSignals.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4 text-primary" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "Today's Signals" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/signals", className: "text-[10px] font-bold text-primary flex items-center hover:underline", children: [
          "View All ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: topSignals.map((signal) => {
        const isBuy = signal.recommendation === "BUY";
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: `/charts?symbol=BINANCE:${signal.pair.replace("/", "")}`, className: "vixor-card p-3.5 flex items-center gap-3 vixor-card-hover block", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-9 rounded-xl flex items-center justify-center shrink-0 ${isBuy ? "bg-bullish/10" : "bg-bearish/10"}`, children: isBuy ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-4 text-bullish" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-4 text-bearish" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-sm", children: signal.pair }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(RecBadge, { rec: signal.recommendation })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-mono", children: [
              "Entry:",
              " ",
              signal.entry ? Number(signal.entry).toLocaleString(void 0, {
                maximumFractionDigits: 2
              }) : "—",
              " · ",
              signal.timeframe
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm font-bold font-mono", children: [
              signal.confidence,
              "%"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-12 h-1.5 bg-muted rounded-full overflow-hidden mt-1", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full ${isBuy ? "bg-bullish" : "bg-bearish"}`, style: {
              width: `${signal.confidence}%`
            } }) })
          ] })
        ] }, signal.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 border-l-4 border-l-primary relative overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute right-0 top-0 size-32 bg-primary/5 blur-2xl rounded-full" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2 relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-primary", children: "AI Daily Focus" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground leading-relaxed relative", children: topSignals.length > 0 ? `Top signal: ${topSignals[0].pair} shows a ${topSignals[0].recommendation} setup at ${topSignals[0].confidence}% confidence. ${topSignals[0].pattern || "Multiple confluences detected."} Monitor your active alerts for trigger notifications.` : "No signals generated yet today. Generate daily signals from the Signals page or set price alerts from Charts." })
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
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "text-[11px] font-bold uppercase tracking-widest text-muted-foreground", children: "Active Alerts" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("a", { href: "/charts", className: "text-[10px] font-bold text-primary flex items-center hover:underline", children: [
          "View All ",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-3" })
        ] })
      ] }),
      activeAlerts.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-6 text-muted-foreground/30 mx-auto mb-2" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "No active alerts" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("a", { href: "/charts", className: "text-xs text-primary font-bold mt-1 inline-block", children: "Set one from Charts →" })
      ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: activeAlerts.slice(0, 3).map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-3.5", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-8 rounded-lg flex items-center justify-center ${alert.condition === "above" || alert.condition === "crosses_up" ? "bg-bullish/10" : "bg-bearish/10"}`, children: alert.condition === "above" || alert.condition === "crosses_up" ? /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowUpRight, { className: "size-4 text-bullish" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowDownRight, { className: "size-4 text-bearish" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm font-mono", children: alert.pair }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-mono", children: [
            alert.condition === "above" ? "Above" : alert.condition === "below" ? "Below" : alert.condition === "crosses_up" ? "Crosses up" : "Crosses down",
            " ",
            "$",
            Number(alert.target_price).toLocaleString(void 0, {
              maximumFractionDigits: 2
            })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-0.5 rounded text-[9px] font-bold bg-primary/10 text-primary uppercase", children: "Active" })
      ] }) }, alert.id)) })
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
