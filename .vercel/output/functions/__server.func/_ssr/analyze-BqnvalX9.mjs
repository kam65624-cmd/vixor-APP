import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, g as getMe, k as createAnalysis, l as listAnalyses } from "./router-CpOILtp4.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import "../_libs/seroval.mjs";
import { n as ArrowLeft, Z as Zap, U as Upload, _ as Image, h as Camera, d as ChevronRight, $ as X, S as Sparkles, g as LoaderCircle } from "../_libs/lucide-react.mjs";
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
const TRADING_STYLES = [{
  id: "Scalping",
  label: "Scalping",
  desc: "Fast, intra-day"
}, {
  id: "Day Trading",
  label: "Day Trading",
  desc: "Within session"
}, {
  id: "Swing Trading",
  label: "Swing",
  desc: "Multi-day holds"
}];
const STEPS = ["Connecting to Engine", "Extracting Price Action", "Computing Market Structure", "Generating Scenarios"];
function Analyze() {
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const create = useServerFn(createAnalysis);
  const fetchRecent = useServerFn(listAnalyses);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({})
  });
  const recent = useQuery({
    queryKey: ["analyses", 5],
    queryFn: () => fetchRecent({
      data: {
        limit: 5
      }
    })
  });
  const fileRef = reactExports.useRef(null);
  const [stage, setStage] = reactExports.useState("upload");
  const [progress, setProgress] = reactExports.useState(0);
  const [preview, setPreview] = reactExports.useState(null);
  const [file, setFile] = reactExports.useState(null);
  const [err, setErr] = reactExports.useState(null);
  const [selectedPair, setSelectedPair] = reactExports.useState("auto");
  const [tradingStyle, setTradingStyle] = reactExports.useState("Day Trading");
  const points = me.data?.balance.balance ?? 0;
  const isPremium = !!me.data?.isPremium;
  function pickFile(f) {
    if (!f) return;
    if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) {
      setErr("PNG, JPG, or WebP only");
      return;
    }
    if (f.size > 8 * 1024 * 1024) {
      setErr("Max 8 MB");
      return;
    }
    setErr(null);
    setFile(f);
    const name = f.name.toLowerCase();
    if (name.includes("gold") || name.includes("xau")) setSelectedPair("XAU/USD");
    else if (name.includes("eur")) setSelectedPair("EUR/USD");
    else if (name.includes("btc")) setSelectedPair("BTC/USD");
    else if (name.includes("gbp")) setSelectedPair("GBP/JPY");
    else if (name.includes("nasdaq") || name.includes("ndx")) setSelectedPair("NASDAQ");
    else setSelectedPair("auto");
    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result);
      setStage("preview");
    };
    reader.readAsDataURL(f);
  }
  async function handlePaste() {
    try {
      const items = await navigator.clipboard.read();
      for (const it of items) {
        const type = it.types.find((t) => t.startsWith("image/"));
        if (type) {
          const blob = await it.getType(type);
          pickFile(new File([blob], "pasted.png", {
            type
          }));
          return;
        }
      }
      setErr("No image found on clipboard");
    } catch {
      setErr("Clipboard access denied. Please paste manually (Ctrl+V)");
    }
  }
  reactExports.useEffect(() => {
    const handleGlobalPaste = (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const blob = items[i].getAsFile();
          if (blob) pickFile(blob);
          break;
        }
      }
    };
    window.addEventListener("paste", handleGlobalPaste);
    return () => window.removeEventListener("paste", handleGlobalPaste);
  }, []);
  async function startAnalysis() {
    if (!file || !preview) return;
    if (!isPremium && points < 10) {
      setErr("Need at least 10 points. Check your profile.");
      return;
    }
    setStage("analyzing");
    setProgress(0);
    setErr(null);
    const ticker = setInterval(() => setProgress((p) => Math.min(p + 1, STEPS.length - 1)), 2e3);
    try {
      const {
        id
      } = await create({
        data: {
          imageBase64: preview,
          mimeType: file.type,
          fileName: file.name,
          selectedPair: selectedPair === "auto" ? void 0 : selectedPair,
          trading_style: tradingStyle
        }
      });
      clearInterval(ticker);
      navigate({
        to: "/analysis/$id",
        params: {
          id
        }
      });
    } catch (e) {
      clearInterval(ticker);
      setErr(e instanceof Error ? e.message : "Failed to analyze");
      setStage("preview");
    }
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3 mb-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => navigate({
        to: "/"
      }), className: "size-10 rounded-xl terminal-card flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5", children: "Vixor Intelligence" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold tracking-tight leading-none", children: "Analyze Chart" })
      ] }),
      !isPremium && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg terminal-card text-[10px] font-bold text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-3 text-primary" }),
        " ",
        points,
        " pts"
      ] }),
      isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2.5 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider", children: "PRO" })
    ] }),
    err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-bearish/8 border border-bearish/20 text-bearish text-xs font-bold rounded-xl animate-in shake", children: err }),
    stage === "upload" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block w-full aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-card/30 hover:bg-card/50 transition-colors cursor-pointer relative overflow-hidden group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-14 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-7 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-base mb-1", children: "Upload Chart Image" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "PNG, JPG, WebP · Max 8MB" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground mt-2", children: "Or paste from clipboard (Ctrl+V)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileRef, className: "hidden", accept: "image/png, image/jpeg, image/webp", onChange: (e) => pickFile(e.target.files?.[0] || null) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => fileRef.current?.click(), className: "h-14 rounded-xl terminal-card flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "size-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Gallery" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handlePaste, className: "h-14 rounded-xl terminal-card flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Camera, { className: "size-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Paste" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3", children: "What Vixor Provides" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2.5", children: [{
          icon: "📊",
          text: "Market structure & trend analysis"
        }, {
          icon: "🎯",
          text: "3 scenarios with triggers & invalidations"
        }, {
          icon: "🧠",
          text: "Trade thesis — why, confirms, invalidates"
        }, {
          icon: "📰",
          text: "News confluence with technicals"
        }, {
          icon: "📚",
          text: "SMC/ICT education built-in"
        }].map((item, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2.5 text-sm font-medium text-foreground/80", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: item.icon }),
          item.text
        ] }, i)) })
      ] }),
      recent.data && recent.data.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1", children: "Recent Analyses" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: recent.data.slice(0, 3).map((a) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/analysis/$id", params: {
          id: a.id
        }, className: "terminal-card p-3.5 flex items-center justify-between hover:bg-card-hover transition-colors active:scale-[0.98]", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: cn("text-[9px] font-bold px-1.5 py-0.5 rounded", a.recommendation === "BUY" ? "bg-bullish/10 text-bullish" : a.recommendation === "SELL" ? "bg-bearish/10 text-bearish" : "bg-neutral-wait/10 text-neutral-wait"), children: a.recommendation }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-sm font-mono", children: a.pair }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
                a.timeframe,
                " · ",
                relTime(a.created_at)
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 text-muted-foreground" })
        ] }, a.id)) })
      ] })
    ] }),
    stage === "preview" && preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-xl overflow-hidden border border-border aspect-[4/3] bg-black group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview, alt: "Preview", className: "w-full h-full object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setFile(null);
          setPreview(null);
          setStage("upload");
        }, className: "absolute top-3 right-3 size-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 hover:scale-110 transition-transform text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "terminal-card p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-2 block", children: "Trading Style" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: TRADING_STYLES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTradingStyle(s.id), className: cn("h-14 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5", tradingStyle === s.id ? "bg-primary/10 text-primary border-primary/30" : "bg-card border-border text-muted-foreground hover:bg-card-hover"), children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold", children: s.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] font-medium opacity-70", children: s.desc })
          ] }, s.id)) })
        ] }),
        !isPremium && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between p-3 rounded-lg bg-card border border-border", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground", children: "Analysis Cost" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-bold flex items-center gap-1", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "size-3 text-primary" }),
            " 10 points"
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: startAnalysis, disabled: !isPremium && points < 10, className: cn("w-full h-14 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-transform active:scale-[0.97] disabled:opacity-50", "bg-primary text-primary-foreground hover:brightness-110"), children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-5" }),
          " Generate Intelligence Report"
        ] })
      ] })
    ] }),
    stage === "analyzing" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-[60vh] flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-2xl bg-primary/15 animate-ping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative size-20 rounded-2xl bg-primary/8 border border-primary/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-9 text-primary animate-spin", strokeWidth: 2 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold tracking-tight mb-2", children: "Generating Intelligence..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono text-primary font-bold", children: STEPS[progress] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 h-1.5 bg-muted rounded-full mt-6 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full bg-primary rounded-full transition-all duration-500 ease-out", style: {
        width: `${(progress + 1) / STEPS.length * 100}%`
      } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground mt-4 max-w-[260px]", children: "Analyzing structure, building scenarios, and cross-referencing fundamentals" })
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
  Analyze as component
};
