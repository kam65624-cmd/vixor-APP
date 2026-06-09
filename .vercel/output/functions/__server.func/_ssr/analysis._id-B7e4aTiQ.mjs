import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { g as useParams, L as Link } from "../_libs/tanstack__react-router.mjs";
import { a as useStableServerFn, A as getAnalysis } from "./router-XLp9U_og.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { j as TriangleAlert, a8 as BrainCircuit, a9 as Maximize2, a3 as X, Z as Zap, B as BookOpen, n as Target, aa as CircleCheckBig, a0 as ChartNoAxesColumn, A as Activity, T as TrendingUp, $ as Layers, W as ShieldCheck, L as LoaderCircle, p as ArrowLeft, ab as Bookmark, D as Share2, N as Newspaper } from "../_libs/lucide-react.mjs";
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
import "./server-DC2fSMDH.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-BatwxpoE.mjs";
import "../_libs/zod.mjs";
const TABS = ["Trade Setup", "Market Context", "News Impact", "Management"];
function highlightSMC(text) {
  const smcTerms = ["Order Block", "Fair Value Gap", "FVG", "Liquidity", "BOS", "ChoCh", "CHOCH", "ICT", "SMC", "Sweep", "Mitigation", "Break of Structure", "Change of Character", "Imbalance", "Premium", "Discount", "OB", "NWOG", "NDOG"];
  const regex = new RegExp(`(${smcTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) => {
    if (smcTerms.some((t) => t.toLowerCase() === part.toLowerCase())) {
      return /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-primary font-bold bg-primary/10 px-0.5 rounded", children: part }, i);
    }
    return part;
  });
}
function AnalysisResult() {
  const {
    id
  } = useParams({
    from: "/_authenticated/analysis/$id"
  });
  const fetchAnalysis = useStableServerFn(getAnalysis);
  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchAnalysis({
      data: {
        id
      }
    }),
    enabled: !!id,
    staleTime: 1e4,
    // REMOVED: placeholderData: (prev) => prev — this caused re-render loops
    // during polling because each fetch returns a new object reference,
    // and placeholderData kept the old ref alive alongside the new one,
    // confusing React's reconciliation and contributing to error #310.
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 3e3;
    }
  });
  const [tab, setTab] = reactExports.useState("Trade Setup");
  const [imgZoom, setImgZoom] = reactExports.useState(false);
  if (q.isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(Loading, { label: "Loading your signal…" });
  const a = q.data;
  if (!a) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-6 text-center font-medium", children: "Analysis not found." });
  if (a.status === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-8 text-center border-bearish/30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-full bg-bearish/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-8 text-bearish" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: "Analysis Failed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-2", children: a.error_message ?? "The AI encountered an issue reading this chart." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/analyze", className: "inline-flex mt-6 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-bold items-center transition-transform active:scale-95", children: "Try another chart" })
      ] })
    ] });
  }
  if (a.status !== "complete") return /* @__PURE__ */ jsxRuntimeExports.jsx(Loading, { label: "Vixor AI is generating your signal…" });
  const raw = a.raw_ai_response ?? {};
  const signalBadge = a.signal_badge ?? raw.signal_badge ?? null;
  const vixorMsg = a.vixor_message ?? raw.vixor_message ?? null;
  const scenarios = a.scenarios ?? raw.scenarios ?? null;
  const management = a.management ?? raw.management ?? [];
  const isBullish = a.recommendation === "BUY";
  const isBearish = a.recommendation === "SELL";
  a.recommendation === "WAIT";
  const heroColor = isBullish ? "border-bullish/50 shadow-[0_0_40px_rgba(16,185,129,0.2)]" : isBearish ? "border-bearish/50 shadow-[0_0_40px_rgba(239,68,68,0.2)]" : "border-neutral-wait/40 shadow-[0_0_30px_rgba(245,158,11,0.15)]";
  const heroBg = isBullish ? "bg-gradient-to-br from-bullish/8 via-card to-card" : isBearish ? "bg-gradient-to-br from-bearish/8 via-card to-card" : "bg-gradient-to-br from-neutral-wait/8 via-card to-card";
  const recColor = isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait";
  const recBg = isBullish ? "bg-bullish/10 border-bullish/30 shadow-[0_0_20px_rgba(16,185,129,0.3)]" : isBearish ? "bg-bearish/10 border-bearish/30 shadow-[0_0_20px_rgba(239,68,68,0.3)]" : "bg-neutral-wait/10 border-neutral-wait/30";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pb-6", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-5 border-2 relative overflow-hidden ${heroColor} ${heroBg}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0 inset-x-0 h-0.5 ${isBullish ? "bg-bullish" : isBearish ? "bg-bearish" : "bg-neutral-wait"} animate-pulse` }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-card/80 backdrop-blur px-2 py-0.5 rounded border border-border", children: a.timeframe ?? "AUTO" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-muted-foreground", children: relTime(a.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-4xl font-extrabold font-mono tracking-tight leading-none", children: a.pair ?? "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-bold text-muted-foreground mt-1", children: a.pattern ?? "Pattern Analysis" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `px-5 py-3 rounded-2xl border-2 font-extrabold text-2xl ${recColor} ${recBg} font-mono tracking-wider`, children: a.recommendation ?? "—" })
      ] }),
      signalBadge && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card/70 backdrop-blur p-3 rounded-xl border border-border text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5", children: "Entry" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold text-base text-foreground", children: signalBadge.entry })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bearish/5 p-3 rounded-xl border border-bearish/30 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-bearish mb-1.5", children: "Stop Loss" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold text-base text-bearish", children: signalBadge.stop_loss })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bullish/5 p-3 rounded-xl border border-bullish/30 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-bold uppercase tracking-widest text-bullish mb-1.5", children: "Target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono font-bold text-base text-bullish", children: signalBadge.take_profit })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        signalBadge && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `px-3 py-1.5 rounded-lg border font-mono font-bold text-sm ${recBg} ${recColor}`, children: [
          "R:R ",
          signalBadge.rr
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground", children: "Confidence" }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-xs font-bold font-mono ${recColor}`, children: [
              a.confidence ?? 0,
              "%"
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-1.5 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full rounded-full transition-all duration-700 ${isBullish ? "bg-bullish" : isBearish ? "bg-bearish" : "bg-neutral-wait"}`, style: {
            width: `${a.confidence ?? 0}%`
          } }) })
        ] })
      ] })
    ] }),
    vixorMsg && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-4 border-l-4 ${isBullish ? "border-l-bullish" : isBearish ? "border-l-bearish" : "border-l-neutral-wait"}`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: `size-5 shrink-0 ${isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground", children: "Vixor Verdict" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed text-foreground/90", children: highlightSMC(vixorMsg) })
    ] }),
    a.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card overflow-hidden relative group cursor-pointer", onClick: () => setImgZoom(!imgZoom), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: a.imageUrl, alt: "Analyzed chart", className: "w-full max-h-52 object-contain bg-black" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 right-2 size-8 rounded-lg bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "size-4" }) })
    ] }),
    imgZoom && a.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4", onClick: () => setImgZoom(false), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "absolute top-4 right-4 size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: a.imageUrl, alt: "Chart", className: "max-w-full max-h-[90vh] object-contain" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/trade-desk", className: "h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 glow-primary active:scale-95 transition-transform", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-4" }),
        " Use in Calculator"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/journal", className: "h-12 rounded-xl bg-card border border-border font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-hover active:scale-95 transition-all", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4 text-muted-foreground" }),
        " Add to Journal"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 bg-card border border-border rounded-xl overflow-x-auto no-scrollbar", children: TABS.map((t) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setTab(t), className: `flex-1 h-9 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all px-2 ${tab === t ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: t }, t)) }),
    tab === "Trade Setup" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Target, { className: "size-4 text-primary" }),
          " Why This Trade"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-3", children: (a.reasons ?? []).map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-3 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "size-4 text-primary shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium", children: highlightSMC(r) })
        ] }, i)) })
      ] }),
      scenarios && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h3", { className: "font-bold text-xs ml-1 uppercase tracking-wider text-muted-foreground", children: "Execution Scenarios" }),
        [{
          label: "Conservative",
          s: scenarios.conservative,
          color: "text-info",
          border: "border-l-info/60",
          bg: "bg-info/5"
        }, {
          label: "Balanced ✦",
          s: scenarios.balanced,
          color: "text-primary",
          border: "border-l-primary/80",
          bg: "bg-primary/5",
          glow: true
        }, {
          label: "Aggressive",
          s: scenarios.aggressive,
          color: "text-neutral-wait",
          border: "border-l-neutral-wait/60",
          bg: "bg-neutral-wait/5"
        }].map(({
          label,
          s,
          color,
          border,
          bg,
          glow
        }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-4 border-l-4 ${border} ${bg} ${glow ? "shadow-[0_0_20px_rgba(16,185,129,0.12)]" : ""}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-bold uppercase tracking-wider ${color}`, children: label }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded", children: [
                "PROB: ",
                s.probability,
                "%"
              ] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm font-extrabold bg-card px-2 py-0.5 rounded border border-border", children: [
              "R:R ",
              s.rr
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card p-2.5 rounded-xl border border-border", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground font-bold uppercase mb-1", children: "Entry" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold", children: s.entry })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bearish/5 p-2.5 rounded-xl border border-bearish/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-bearish font-bold uppercase mb-1", children: "SL" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold text-bearish", children: s.sl?.toLocaleString() })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bullish/5 p-2.5 rounded-xl border border-bullish/20", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-bullish font-bold uppercase mb-1", children: "TP" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold text-bullish", children: s.tp2?.toLocaleString() })
            ] })
          ] })
        ] }, label))
      ] })
    ] }),
    tab === "Market Context" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      a.key_levels && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChartNoAxesColumn, { className: "size-4 text-primary" }),
          " Key SMC Levels"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-bearish uppercase tracking-wider", children: "Resistance / BSL" }),
            (a.key_levels.resistance || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bearish/5 border border-bearish/20 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bearish/90", children: l.toLocaleString() }, i))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-bullish uppercase tracking-wider", children: "Support / SSL" }),
            (a.key_levels.support || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bullish/5 border border-bullish/20 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bullish/90", children: l.toLocaleString() }, i))
          ] })
        ] })
      ] }),
      a.liquidity_zones && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-4 text-primary" }),
          " Liquidity Pools"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          (a.liquidity_zones.buySide || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-bullish/5 border border-bullish/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-bullish uppercase", children: "Buy-Side Liquidity (BSL)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-bullish", children: l.toLocaleString() })
          ] }, i)),
          (a.liquidity_zones.sellSide || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-xl bg-bearish/5 border border-bearish/20", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-bearish uppercase", children: "Sell-Side Liquidity (SSL)" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-bearish", children: l.toLocaleString() })
          ] }, i))
        ] })
      ] }),
      a.market_structure && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(TrendingUp, { className: "size-4 text-primary" }),
          " Market Structure (SMC)"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [{
          label: "Direction",
          value: a.market_structure.direction
        }, {
          label: "Structure",
          value: a.market_structure.structure
        }, ...a.invalidation_level ? [{
          label: "⚠ Invalidation Level",
          value: a.invalidation_level.toLocaleString(),
          danger: true
        }] : [], ...a.market_structure.bos ? [{
          label: "BOS Level",
          value: a.market_structure.bos?.toLocaleString()
        }] : []].map(({
          label,
          value,
          danger
        }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `flex justify-between items-center p-3 rounded-xl border ${danger ? "bg-bearish/10 border-bearish/30" : "bg-card border-border"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-xs font-bold uppercase ${danger ? "text-bearish" : "text-muted-foreground"}`, children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `font-mono font-bold ${danger ? "text-bearish" : ""}`, children: String(value) })
        ] }, label)) })
      ] })
    ] }),
    tab === "News Impact" && /* @__PURE__ */ jsxRuntimeExports.jsx(NewsImpactSection, { newsImpact: a.news || a.raw_ai_response?.news_impact }),
    tab === "Management" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-4 text-primary" }),
          " Step-by-Step Management"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: management.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 bg-card border border-border p-3.5 rounded-xl", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-7 rounded-full flex items-center justify-center shrink-0 font-mono text-xs font-bold ${i === 0 ? "gradient-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`, children: i + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium leading-relaxed", children: highlightSMC(m) })
        ] }, i)) })
      ] }),
      a.risk_reasons && a.risk_reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5 border-bearish/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs mb-4 uppercase tracking-wider text-bearish flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(ShieldCheck, { className: "size-4 text-bearish" }),
          " Risk Factors"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: a.risk_reasons.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bearish mt-0.5 shrink-0", children: "•" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-muted-foreground", children: r })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-4 rounded-xl bg-neutral-wait/10 border border-neutral-wait/20", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-5 text-neutral-wait shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-medium text-muted-foreground leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground block mb-1", children: "Risk Disclaimer" }),
          "This analysis is generated by Vixor AI based on technical patterns and fundamental data. It is ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "not financial advice" }),
          ". Always apply your own risk management and judgment before executing any trade."
        ] })
      ] })
    ] })
  ] });
}
function NewsImpactSection({
  newsImpact
}) {
  if (!newsImpact) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-8 text-center space-y-2 animate-in fade-in duration-300", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "size-10 text-muted-foreground mx-auto" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No fundamental news analysis for this session." })
    ] });
  }
  const {
    relevant_news = [],
    overall_sentiment = "NEUTRAL",
    verdict = ""
  } = newsImpact;
  const isBullish = overall_sentiment === "BULLISH";
  const isBearish = overall_sentiment === "BEARISH";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5 space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-4 text-primary" }),
          " Fundamental Sentiment"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${isBullish ? "bg-bullish/10 text-bullish border-bullish/30" : isBearish ? "bg-bearish/10 text-bearish border-bearish/30" : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/30"}`, children: overall_sentiment })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `p-4 rounded-xl border-l-4 ${isBullish ? "border-l-bullish bg-bullish/5" : isBearish ? "border-l-bearish bg-bearish/5" : "border-l-neutral-wait bg-neutral-wait/5"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1", children: "AI Confluence Verdict" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed", children: highlightSMC(verdict) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("h3", { className: "font-bold text-xs ml-1 uppercase tracking-wider text-muted-foreground flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "size-4 text-primary" }),
        " Key News Drivers"
      ] }),
      relevant_news.map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 relative overflow-hidden space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute left-0 top-0 bottom-0 w-1 ${n.impact === "POSITIVE" ? "bg-bullish" : n.impact === "NEGATIVE" ? "bg-bearish" : "bg-neutral-wait"}` }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-3 pl-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded", children: n.source }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-sm text-foreground mt-1.5 leading-snug", children: n.headline })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[9px] font-bold px-2 py-0.5 rounded shrink-0 uppercase ${n.impact === "POSITIVE" ? "bg-bullish/10 text-bullish" : n.impact === "NEGATIVE" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"}`, children: n.impact })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3 rounded-lg bg-card/60 border border-border text-xs text-muted-foreground leading-relaxed ml-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-[9px] uppercase tracking-wider text-foreground block mb-1", children: "Technical Impact" }),
          highlightSMC(n.explanation)
        ] })
      ] }, i))
    ] })
  ] });
}
function BackHeader() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 pb-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "size-4 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "size-4 text-muted-foreground" }) })
    ] })
  ] });
}
function Loading({
  label
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 h-[80vh] flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-10 flex-1 flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-2xl bg-primary/20 animate-ping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative size-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-8 text-primary-foreground animate-spin", strokeWidth: 2.5 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold tracking-tight", children: label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-muted-foreground mt-2", children: "Connecting to Vixor Intelligence…" })
    ] })
  ] });
}
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1e3;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
export {
  AnalysisResult as component
};
