import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import { u as useStableServerFn, b as getDailySignals, e as getUserStrategy, f as generateDailySignals, h as createAlert, i as updateUserStrategy } from "./router-uhgHfevS.mjs";
import { R as RecBadge, C as ConfidenceBar } from "./atoms-Cww8dxsu.mjs";
import { t as toTradingViewSymbol } from "./TradingViewChart-AiVAL5My.mjs";
import "../_libs/seroval.mjs";
import { L as LoaderCircle, R as RefreshCw, m as Settings2, Z as Zap, S as Sparkles, n as Target, e as Shield, T as TrendingUp, o as TrendingDown, M as Minus, b as Bell, a as ChartColumn } from "../_libs/lucide-react.mjs";
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
const ALL_PAIRS = ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT", "GBP/USD", "USD/JPY", "AUD/USD", "BNB/USDT"];
const TRADING_STYLES = [{
  id: "Scalping",
  icon: "⚡",
  desc: "Fast trades, small targets"
}, {
  id: "Day Trading",
  icon: "☀️",
  desc: "Intra-day, medium targets"
}, {
  id: "Swing Trading",
  icon: "🌊",
  desc: "Multi-day, large targets"
}];
const RISK_LEVELS = [{
  id: "LOW",
  label: "Low",
  color: "text-bullish"
}, {
  id: "MEDIUM",
  label: "Medium",
  color: "text-neutral-wait"
}, {
  id: "HIGH",
  label: "High",
  color: "text-bearish"
}];
function DailySignals() {
  const queryClient = useQueryClient();
  const [showStrategy, setShowStrategy] = reactExports.useState(false);
  const [filterRec, setFilterRec] = reactExports.useState(null);
  const signalsFn = useStableServerFn(getDailySignals);
  const signalsQuery = useQuery(reactExports.useMemo(() => ({
    queryKey: ["daily-signals"],
    queryFn: () => signalsFn({
      data: {}
    }),
    staleTime: 12e4
  }), [signalsFn]));
  const strategyFn = useStableServerFn(getUserStrategy);
  const strategyQuery = useQuery(reactExports.useMemo(() => ({
    queryKey: ["user-strategy"],
    queryFn: () => strategyFn({}),
    staleTime: 6e4
  }), [strategyFn]));
  const generateFn = useStableServerFn(generateDailySignals);
  const generateMutation = useMutation({
    mutationFn: () => generateFn({}),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["daily-signals"]
      });
    }
  });
  const createAlertFn = useStableServerFn(createAlert);
  const alertMutation = useMutation({
    mutationFn: (data) => createAlertFn({
      data: {
        symbol: toTradingViewSymbol(data.pair),
        pair: data.pair,
        condition: "above",
        targetPrice: data.entry,
        timeframe: "1H"
      }
    })
  });
  const strategy = strategyQuery.data;
  const signals = signalsQuery.data;
  const filteredSignals = (signals ?? []).filter((s) => {
    if (filterRec && s.recommendation !== filterRec) return false;
    return true;
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-end justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5", children: "Vixor Intelligence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-2xl font-bold tracking-tight", children: "Daily Signals" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => generateMutation.mutate(), disabled: generateMutation.isPending, className: "size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors disabled:opacity-50", children: generateMutation.isPending ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin text-primary" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "size-4 text-muted-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowStrategy(!showStrategy), className: "size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Settings2, { className: "size-4 text-muted-foreground" }) })
      ] })
    ] }),
    showStrategy && /* @__PURE__ */ jsxRuntimeExports.jsx(StrategyConfig, { strategy, onUpdate: () => queryClient.invalidateQueries({
      queryKey: ["user-strategy", "daily-signals"]
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-primary", children: "Your Strategy" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground uppercase font-bold", children: "Style" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: strategy?.trading_style || "Day Trading" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground uppercase font-bold", children: "Risk" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-sm font-bold ${strategy?.risk_tolerance === "LOW" ? "text-bullish" : strategy?.risk_tolerance === "HIGH" ? "text-bearish" : "text-neutral-wait"}`, children: strategy?.risk_tolerance || "MEDIUM" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground uppercase font-bold", children: "Pairs" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: strategy?.pairs?.length ?? 4 })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2", children: [{
      value: null,
      label: "All"
    }, {
      value: "BUY",
      label: "Buy"
    }, {
      value: "SELL",
      label: "Sell"
    }, {
      value: "WAIT",
      label: "Wait"
    }].map((f) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setFilterRec(f.value), className: `px-3 h-8 rounded-lg text-xs font-bold transition-all ${filterRec === f.value ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-card-hover"}`, children: f.label }, f.label)) }),
    signalsQuery.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-6 animate-spin mx-auto text-primary mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground", children: "Loading signals..." })
    ] }) : filteredSignals.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-8 text-muted-foreground/30 mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mb-2", children: "No signals for today yet" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => generateMutation.mutate(), disabled: generateMutation.isPending, className: "px-4 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary disabled:opacity-50", children: generateMutation.isPending ? "Generating..." : "Generate Signals" })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: filteredSignals.map((signal) => /* @__PURE__ */ jsxRuntimeExports.jsx(SignalCard, { signal, onSetAlert: (pair, entry) => alertMutation.mutate({
      pair,
      entry
    }), isAlertLoading: alertMutation.isPending }, signal.id)) }),
    generateMutation.isSuccess && generateMutation.data && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-3 border-l-4 border-l-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground", children: [
      "Generated ",
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-bold", children: generateMutation.data.generated }),
      " signals for ",
      generateMutation.data.date
    ] }) })
  ] });
}
function SignalCard({
  signal,
  onSetAlert,
  isAlertLoading
}) {
  const isBuy = signal.recommendation === "BUY";
  const isSell = signal.recommendation === "SELL";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-10 rounded-xl flex items-center justify-center ${isBuy ? "bg-bullish/10" : isSell ? "bg-bearish/10" : "bg-neutral-wait/10"}`, children: isBuy ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-5 text-bullish" }) : isSell ? /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingDown, { className: "size-5 text-bearish" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Minus, { className: "size-5 text-neutral-wait" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-base", children: signal.pair }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(RecBadge, { rec: signal.recommendation })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground font-mono", children: signal.timeframe })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase tracking-wider text-muted-foreground font-bold", children: "Confidence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-lg font-bold font-mono", children: [
          signal.confidence,
          "%"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(ConfidenceBar, { value: signal.confidence }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-3 mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-lg bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] uppercase tracking-wider text-muted-foreground font-bold", children: "Entry" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold font-mono", children: signal.entry ? Number(signal.entry).toLocaleString(void 0, {
          maximumFractionDigits: 2
        }) : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-lg bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] uppercase tracking-wider text-bearish font-bold", children: "Stop Loss" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold font-mono text-bearish", children: signal.stop_loss ? Number(signal.stop_loss).toLocaleString(void 0, {
          maximumFractionDigits: 2
        }) : "—" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-2 rounded-lg bg-background", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] uppercase tracking-wider text-bullish font-bold", children: "Take Profit" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold font-mono text-bullish", children: signal.take_profit?.[1] ? Number(signal.take_profit[1]).toLocaleString(void 0, {
          maximumFractionDigits: 2
        }) : "—" })
      ] })
    ] }),
    signal.pattern && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-3 text-xs text-muted-foreground", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-foreground", children: signal.pattern }) }),
    signal.reasons && signal.reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-2 space-y-0.5", children: signal.reasons.slice(0, 2).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] text-muted-foreground flex items-start gap-1.5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary mt-0.5", children: "•" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "line-clamp-1", children: r })
    ] }, i)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2 mt-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => onSetAlert(signal.pair, signal.entry), disabled: isAlertLoading || !signal.entry, className: "flex-1 h-9 rounded-xl bg-card border border-border flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-50", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-3.5" }),
        " Set Alert"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/charts", search: {
        symbol: toTradingViewSymbol(signal.pair)
      }, className: "flex-1 h-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-bold glow-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "size-3.5" }),
        " View Chart"
      ] })
    ] })
  ] });
}
function StrategyConfig({
  strategy,
  onUpdate
}) {
  const updateFn = useStableServerFn(updateUserStrategy);
  const [pairs, setPairs] = reactExports.useState(strategy?.pairs || ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD"]);
  const [tradingStyle, setTradingStyle] = reactExports.useState(strategy?.trading_style || "Day Trading");
  const [riskTolerance, setRiskTolerance] = reactExports.useState(strategy?.risk_tolerance || "MEDIUM");
  const [saving, setSaving] = reactExports.useState(false);
  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          pairs,
          tradingStyle,
          riskTolerance,
          preferredTimeframes: tradingStyle === "Scalping" ? ["5M", "15M", "1H"] : tradingStyle === "Day Trading" ? ["1H", "4H"] : ["4H", "1D"]
        }
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to save strategy:", err);
    } finally {
      setSaving(false);
    }
  };
  const togglePair = (pair) => {
    setPairs((prev) => prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "size-4 text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-bold", children: "Strategy Setup" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Trading Style" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: TRADING_STYLES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTradingStyle(s.id), className: `h-14 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${tradingStyle === s.id ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-card border-border text-muted-foreground hover:bg-card-hover"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: s.icon }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px]", children: s.id })
      ] }, s.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Risk Tolerance" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: RISK_LEVELS.map((r) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setRiskTolerance(r.id), className: `h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${riskTolerance === r.id ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-card border-border text-muted-foreground hover:bg-card-hover"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "size-3.5" }),
        r.label
      ] }, r.id)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Preferred Pairs" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex flex-wrap gap-1.5", children: ALL_PAIRS.map((pair) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => togglePair(pair), className: `px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${pairs.includes(pair) ? "bg-primary/10 text-primary border border-primary/30" : "bg-muted text-muted-foreground border border-border"}`, children: pair }, pair)) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleSave, disabled: saving || pairs.length === 0, className: "w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 glow-primary disabled:opacity-50", children: [
      saving ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }) : null,
      "Save Strategy"
    ] })
  ] });
}
export {
  DailySignals as component
};
