import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { f as useParams, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, n as getAnalysis } from "./router-CpOILtp4.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { B as BiasIndicator, a as SetupStrengthBadge, b as SetupStrengthBar, h as highlightSMCTerms, C as CollapsibleSection, E as EducationLayer } from "./atoms-DkK9Gkoa.mjs";
import "../_libs/seroval.mjs";
import { i as TriangleAlert, a0 as Maximize2, $ as X, a1 as BrainCircuit, a2 as Lightbulb, a3 as CircleCheckBig, a4 as CircleX, X as Layers, T as TrendingUp, N as Newspaper, O as ShieldCheck, Z as Zap, B as BookOpen, a5 as Bookmark, C as Compass, a6 as MessageSquare, a7 as RotateCcw, g as LoaderCircle, n as ArrowLeft, x as Share2, z as Target, a8 as ChevronDown } from "../_libs/lucide-react.mjs";
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
import "./server-DgZVuMzr.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C9iXm7zZ.mjs";
import "../_libs/zod.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1e3;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
function deriveSetupStrength(confidence) {
  if (confidence === null || confidence === void 0) return "MODERATE";
  if (confidence >= 70) return "STRONG";
  if (confidence >= 40) return "MODERATE";
  return "WEAK";
}
function deriveThesis(reasons, invalidationLevel, trend) {
  return {
    why: reasons.length > 0 ? `${reasons.slice(0, 2).join(". ")}. The market structure supports a ${trend?.toLowerCase() || "directional"} bias.` : "Setup identified based on technical analysis of price action and market structure.",
    confirms: reasons.slice(0, 3).map((r) => r.replace(/\.$/, "")),
    invalidates: [...invalidationLevel ? [`Price breaks below ${invalidationLevel.toLocaleString()} invalidation level`] : [], "Conflicting fundamental catalyst or major news event", "Price action shows rejection at key structural level"]
  };
}
function extractTermsFromAnalysis(a) {
  const text = [...a.reasons || [], a.pattern || "", a.raw_ai_response?.vixor_message || "", JSON.stringify(a.market_structure || {}), JSON.stringify(a.liquidity_zones || {})].join(" ");
  const terms = ["Order Block", "Fair Value Gap", "FVG", "Liquidity", "BOS", "ChoCh", "CHOCH", "ICT", "SMC", "Sweep", "Mitigation", "Break of Structure", "Change of Character", "Imbalance", "Premium", "Discount", "OB", "NWOG", "NDOG", "BSL", "SSL", "Equal Highs", "Equal Lows"];
  return terms.filter((t) => text.toLowerCase().includes(t.toLowerCase()));
}
function AnalysisResult() {
  const {
    id
  } = useParams({
    from: "/_authenticated/analysis/$id"
  });
  const fetchFn = useServerFn(getAnalysis);
  const q = useQuery({
    queryKey: ["analysis", id],
    queryFn: () => fetchFn({
      data: {
        id
      }
    }),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "complete" || s === "failed" ? false : 1200;
    }
  });
  const [imgZoom, setImgZoom] = reactExports.useState(false);
  if (q.isLoading) return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, {});
  const a = q.data;
  if (!a) return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-6 text-center font-medium", children: "Analysis not found." });
  if (a.status === "failed") {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-8 text-center border-bearish/30", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-full bg-bearish/10 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-8 text-bearish" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold", children: "Analysis Failed" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground mt-2", children: a.error_message ?? "The AI encountered an issue reading this chart." }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/analyze", className: "inline-flex mt-6 px-6 h-12 rounded-xl bg-primary text-primary-foreground font-bold items-center transition-transform active:scale-95", children: "Try another chart" })
      ] })
    ] });
  }
  if (a.status !== "complete") return /* @__PURE__ */ jsxRuntimeExports.jsx(LoadingState, {});
  const raw = a.raw_ai_response || {};
  const isBullish = a.recommendation === "BUY";
  const isBearish = a.recommendation === "SELL";
  const setupStrength = raw.setup_strength || deriveSetupStrength(a.confidence);
  const thesis = raw.thesis || deriveThesis(a.reasons || [], a.invalidation_level, a.trend);
  const hasNewScenarios = raw.scenarios?.primary !== void 0;
  const newScenarios = hasNewScenarios ? raw.scenarios : null;
  const legacyScenarios = !hasNewScenarios ? a.scenarios : null;
  const signal = raw.signal_badge;
  const management = a.management ?? [];
  const newsImpact = a.news || raw.news_impact;
  const smcTerms = reactExports.useMemo(() => extractTermsFromAnalysis(a), [a]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground bg-card-hover px-2 py-0.5 rounded border border-border", children: a.timeframe ?? "AUTO" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-muted-foreground", children: relTime(a.created_at) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-extrabold font-mono tracking-tight leading-none mb-1", children: a.pair ?? "?" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs font-medium text-muted-foreground", children: a.pattern ?? "Pattern Analysis" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(BiasIndicator, { direction: a.trend || (isBullish ? "BULLISH" : isBearish ? "BEARISH" : "NEUTRAL") })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(SetupStrengthBadge, { strength: setupStrength, size: "md" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(SetupStrengthBar, { strength: setupStrength })
      ] })
    ] }),
    signal && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 divide-x divide-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground", children: "Entry" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-mono text-base font-bold text-foreground", children: signal.entry })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-bearish", children: "Stop Loss" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-mono text-base font-bold text-bearish", children: signal.stop_loss })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center gap-1 p-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-bullish", children: "Target" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-mono text-base font-bold text-bullish", children: signal.take_profit })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "border-t border-border p-2.5 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("text-mono text-sm font-bold px-3 py-1 rounded-md border", isBullish ? "text-bullish bg-bullish/8 border-bullish/20" : isBearish ? "text-bearish bg-bearish/8 border-bearish/20" : "text-neutral-wait bg-neutral-wait/8 border-neutral-wait/20"), children: [
        "R:R ",
        signal.rr
      ] }) })
    ] }),
    a.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card overflow-hidden relative group cursor-pointer", onClick: () => setImgZoom(!imgZoom), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: a.imageUrl, alt: "Analyzed chart", className: "w-full max-h-48 object-contain bg-black" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute bottom-2 right-2 size-7 rounded-md bg-black/60 backdrop-blur text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Maximize2, { className: "size-3.5" }) })
    ] }),
    imgZoom && a.imageUrl && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 z-50 bg-black/95 backdrop-blur flex items-center justify-center p-4", onClick: () => setImgZoom(false), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "absolute top-4 right-4 size-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: a.imageUrl, alt: "Chart", className: "max-w-full max-h-[90vh] object-contain" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card-accent p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-primary", children: "Trade Thesis" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Why This Setup Exists" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed text-foreground/90", children: highlightSMCTerms(thesis.why) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "size-3.5 text-bullish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-bullish", children: "Confirmation Triggers" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: thesis.confirms.map((c, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 rounded-full bg-bullish mt-2 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground/85", children: highlightSMCTerms(c) })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "size-3.5 text-bearish" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-bearish", children: "Invalidation Triggers" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: thesis.invalidates.map((inv, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "size-1.5 rounded-full bg-bearish mt-2 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-foreground/85", children: highlightSMCTerms(inv) })
        ] }, i)) })
      ] }),
      a.invalidation_level && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mt-4 p-3 rounded-lg bg-bearish/5 border border-bearish/15", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-bearish", children: "Critical Invalidation" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-mono text-sm font-bold text-bearish", children: a.invalidation_level.toLocaleString() })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Layers, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-primary", children: "Scenario Engine" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[11px] text-muted-foreground mb-4", children: "Three market paths — think in probabilities, not predictions" }),
      newScenarios ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScenarioCardV2, { scenario: newScenarios.primary, type: "primary", label: "Primary", isBullish }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScenarioCardV2, { scenario: newScenarios.alternative, type: "alternative", label: "Alternative", isBullish }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ScenarioCardV2, { scenario: newScenarios.counter, type: "counter", label: "Counter", isBullish })
      ] }) : legacyScenarios ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(LegacyScenarioCard, { scenario: legacyScenarios.conservative, label: "Conservative", color: "text-info", borderColor: "border-l-info/60" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LegacyScenarioCard, { scenario: legacyScenarios.balanced, label: "Balanced", color: "text-primary", borderColor: "border-l-primary/80" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(LegacyScenarioCard, { scenario: legacyScenarios.aggressive, label: "Aggressive", color: "text-neutral-wait", borderColor: "border-l-neutral-wait/60" })
      ] }) : null
    ] }),
    raw.vixor_message && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("terminal-card p-4 border-l-3", isBullish ? "border-l-bullish" : isBearish ? "border-l-bearish" : "border-l-neutral-wait"), children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(BrainCircuit, { className: cn("size-4 shrink-0", isBullish ? "text-bullish" : isBearish ? "text-bearish" : "text-neutral-wait") }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Vixor Intelligence" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed text-foreground/90", children: highlightSMCTerms(raw.vixor_message) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleSection, { title: "Market Context", icon: TrendingUp, defaultOpen: false, children: [
      a.key_levels && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "Key SMC Levels" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-bearish uppercase tracking-wider", children: "Resistance / BSL" }),
            (a.key_levels.resistance || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bearish/5 border border-bearish/15 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bearish/90", children: l.toLocaleString() }, i))
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-bullish uppercase tracking-wider", children: "Support / SSL" }),
            (a.key_levels.support || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-bullish/5 border border-bullish/15 px-3 py-2 rounded-lg font-mono text-sm font-bold text-bullish/90", children: l.toLocaleString() }, i))
          ] })
        ] })
      ] }),
      a.liquidity_zones && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "Liquidity Pools" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-2", children: [
          (a.liquidity_zones.buySide || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-bullish/5 border border-bullish/15", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-bullish uppercase", children: "Buy-Side Liquidity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-bullish text-sm", children: l.toLocaleString() })
          ] }, i)),
          (a.liquidity_zones.sellSide || []).map((l, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-bearish/5 border border-bearish/15", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[11px] font-bold text-bearish uppercase", children: "Sell-Side Liquidity" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-mono font-bold text-bearish text-sm", children: l.toLocaleString() })
          ] }, i))
        ] })
      ] }),
      a.market_structure && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "Market Structure" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: [{
          label: "Direction",
          value: a.market_structure.direction
        }, {
          label: "Structure",
          value: a.market_structure.structure
        }, ...a.invalidation_level ? [{
          label: "Invalidation",
          value: a.invalidation_level.toLocaleString(),
          danger: true
        }] : [], ...a.market_structure.bos ? [{
          label: "BOS Level",
          value: a.market_structure.bos?.toLocaleString(),
          danger: false
        }] : []].map(({
          label,
          value,
          danger
        }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("flex justify-between items-center p-3 rounded-lg border", danger ? "bg-bearish/5 border-bearish/15" : "bg-card border-border"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[11px] font-bold uppercase", danger ? "text-bearish" : "text-muted-foreground"), children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("font-mono font-bold text-sm", danger ? "text-bearish" : ""), children: String(value) })
        ] }, label)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CollapsibleSection, { title: "News Confluence", icon: Newspaper, defaultOpen: false, badge: newsImpact ? /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ml-1", newsImpact.overall_sentiment === "BULLISH" ? "bg-bullish/10 text-bullish border-bullish/25" : newsImpact.overall_sentiment === "BEARISH" ? "bg-bearish/10 text-bearish border-bearish/25" : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/25"), children: newsImpact.overall_sentiment }) : void 0, children: newsImpact ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("p-3 rounded-lg border-l-3", newsImpact.overall_sentiment === "BULLISH" ? "border-l-bullish bg-bullish/3" : newsImpact.overall_sentiment === "BEARISH" ? "border-l-bearish bg-bearish/3" : "border-l-neutral-wait bg-neutral-wait/3"), children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1", children: "Tech + Fundies Verdict" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium leading-relaxed", children: highlightSMCTerms(newsImpact.verdict) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3 mt-3", children: (newsImpact.relevant_news || []).map((n, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-3.5 relative overflow-hidden space-y-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("absolute left-0 top-0 bottom-0 w-1", n.impact === "POSITIVE" ? "bg-bullish" : n.impact === "NEGATIVE" ? "bg-bearish" : "bg-neutral-wait") }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between gap-2 pl-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold text-muted-foreground uppercase bg-muted px-1.5 py-0.5 rounded", children: n.source }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "font-bold text-sm text-foreground mt-1 leading-snug", children: n.headline })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[9px] font-bold px-2 py-0.5 rounded shrink-0 uppercase", n.impact === "POSITIVE" ? "bg-bullish/10 text-bullish" : n.impact === "NEGATIVE" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"), children: n.impact })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-2.5 rounded-md bg-card/60 border border-border text-xs text-muted-foreground leading-relaxed ml-1", children: highlightSMCTerms(n.explanation) })
      ] }, i)) })
    ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center py-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Newspaper, { className: "size-8 text-muted-foreground mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground", children: "No fundamental news analysis available." })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(CollapsibleSection, { title: "Risk & Management", icon: ShieldCheck, defaultOpen: false, badge: a.risk_level ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ml-1", a.risk_level === "LOW" ? "bg-bullish/10 text-bullish border-bullish/25" : a.risk_level === "HIGH" ? "bg-bearish/10 text-bearish border-bearish/25" : "bg-neutral-wait/10 text-neutral-wait border-neutral-wait/25"), children: [
      a.risk_level,
      " RISK"
    ] }) : void 0, children: [
      a.risk_reasons && a.risk_reasons.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-bearish mb-2.5", children: "Risk Factors" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "space-y-2", children: a.risk_reasons.map((r, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex gap-2.5 text-sm", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-bearish mt-0.5 shrink-0", children: "•" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-medium text-muted-foreground", children: r })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h4", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "Step-by-Step Management" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: management.map((m, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3 bg-card border border-border p-3 rounded-lg", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("size-6 rounded-full flex items-center justify-center shrink-0 font-mono text-[10px] font-bold", i === 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"), children: i + 1 }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium leading-relaxed", children: highlightSMCTerms(m) })
        ] }, i)) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-3 p-3 rounded-lg bg-neutral-wait/5 border border-neutral-wait/15", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "size-4 text-neutral-wait shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[11px] font-medium text-muted-foreground leading-relaxed", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { className: "text-foreground block mb-0.5", children: "Risk Disclaimer" }),
          "This analysis is generated by Vixor AI based on technical patterns and fundamental data. It is ",
          /* @__PURE__ */ jsxRuntimeExports.jsx("strong", { children: "not financial advice" }),
          ". Always apply your own risk management."
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(EducationLayer, { terms: smcTerms }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3 pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/trade-desk", className: "h-12 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-4" }),
          " Open Trade"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/journal", className: "h-12 rounded-xl terminal-card font-bold text-sm flex items-center justify-center gap-2 hover:bg-card-hover active:scale-[0.97] transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "size-4 text-muted-foreground" }),
          " Add to Journal"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Save" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/discover", className: "h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Compass, { className: "size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Watchlist" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "h-10 rounded-lg terminal-card text-[11px] font-semibold flex flex-col items-center justify-center gap-0.5 hover:bg-card-hover active:scale-[0.97] transition-all", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(MessageSquare, { className: "size-3.5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground", children: "Copilot" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/analyze", className: "w-full h-10 rounded-lg border border-dashed border-border text-[11px] font-semibold flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all active:scale-[0.97]", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(RotateCcw, { className: "size-3.5" }),
        " Analyze Another Chart"
      ] })
    ] })
  ] });
}
function ScenarioCardV2({
  scenario,
  type,
  label,
  isBullish
}) {
  const [expanded, setExpanded] = reactExports.useState(type === "primary");
  const styleMap = {
    primary: {
      container: "scenario-primary",
      labelColor: "text-primary",
      probBg: "bg-primary/10 text-primary border-primary/25",
      icon: Target
    },
    alternative: {
      container: "scenario-alternative",
      labelColor: "text-info",
      probBg: "bg-info/10 text-info border-info/25",
      icon: Layers
    },
    counter: {
      container: "scenario-counter",
      labelColor: "text-bearish",
      probBg: "bg-bearish/10 text-bearish border-bearish/25",
      icon: TriangleAlert
    }
  };
  const style = styleMap[type];
  const Icon = style.icon;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("rounded-lg border border-border p-4", style.container), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setExpanded(!expanded), className: "w-full flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: cn("size-4", style.labelColor) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-xs font-bold uppercase tracking-wider", style.labelColor), children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-bold text-foreground/70", children: scenario.name })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: cn("text-[10px] font-bold px-2 py-0.5 rounded-full border", style.probBg), children: [
          scenario.probability,
          "%"
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: cn("size-4 text-muted-foreground transition-transform duration-200", expanded && "rotate-180") })
      ] })
    ] }),
    expanded && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mt-3 pt-3 border-t border-border/50 space-y-3 animate-in fade-in slide-in-from-top-1 duration-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-muted-foreground block mb-1", children: "What could happen" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm font-medium text-foreground/85 leading-relaxed", children: highlightSMCTerms(scenario.story) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-1 gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2.5 rounded-md bg-bullish/5 border border-bullish/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleCheckBig, { className: "size-3.5 text-bullish shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-bullish block mb-0.5", children: "Trigger" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-foreground/80", children: highlightSMCTerms(scenario.trigger) })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-2.5 rounded-md bg-bearish/5 border border-bearish/10", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CircleX, { className: "size-3.5 text-bearish shrink-0 mt-0.5" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-bold uppercase tracking-widest text-bearish block mb-0.5", children: "Invalidation" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-medium text-foreground/80", children: highlightSMCTerms(scenario.invalidation_trigger) })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-4 gap-1.5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card p-2 rounded-md border border-border text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-muted-foreground font-bold uppercase mb-0.5", children: "Entry" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs font-bold", children: scenario.entry })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bearish/5 p-2 rounded-md border border-bearish/15 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-bearish font-bold uppercase mb-0.5", children: "SL" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs font-bold text-bearish", children: scenario.sl?.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bullish/5 p-2 rounded-md border border-bullish/15 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-bullish font-bold uppercase mb-0.5", children: "TP1" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs font-bold text-bullish", children: scenario.tp1?.toLocaleString() })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bullish/5 p-2 rounded-md border border-bullish/15 text-center", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] text-bullish font-bold uppercase mb-0.5", children: "TP2" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-xs font-bold text-bullish", children: scenario.tp2?.toLocaleString() })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-mono text-sm font-bold bg-card px-2.5 py-1 rounded-md border border-border", children: [
        "R:R ",
        scenario.rr
      ] }) })
    ] })
  ] });
}
function LegacyScenarioCard({
  scenario,
  label,
  color,
  borderColor
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: cn("terminal-card p-4 border-l-3", borderColor), children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-xs font-bold uppercase tracking-wider", color), children: label }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded", children: [
          "PROB: ",
          scenario.probability,
          "%"
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-sm font-extrabold bg-card px-2 py-0.5 rounded border border-border", children: [
        "R:R ",
        scenario.rr
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card p-2.5 rounded-lg border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground font-bold uppercase mb-1", children: "Entry" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold", children: scenario.entry })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bearish/5 p-2.5 rounded-lg border border-bearish/15", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-bearish font-bold uppercase mb-1", children: "SL" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold text-bearish", children: scenario.sl?.toLocaleString() })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-bullish/5 p-2.5 rounded-lg border border-bullish/15", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-bullish font-bold uppercase mb-1", children: "TP" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-mono text-sm font-bold text-bullish", children: scenario.tp2?.toLocaleString() })
      ] })
    ] })
  ] });
}
function BackHeader() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2 pb-1", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-5" }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bookmark, { className: "size-4 text-muted-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "size-4 text-muted-foreground" }) })
    ] })
  ] });
}
function LoadingState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 h-[80vh] flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(BackHeader, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-10 flex-1 flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-6", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-2xl bg-primary/15 animate-ping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative size-16 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-8 text-primary animate-spin", strokeWidth: 2.5 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-lg font-bold tracking-tight", children: "Generating Intelligence Report..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium text-muted-foreground mt-2", children: "Vixor is analyzing market structure and scenarios" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 h-1 bg-muted rounded-full mt-6 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary rounded-full animate-pulse w-2/3" }) })
    ] })
  ] });
}
export {
  AnalysisResult as component
};
