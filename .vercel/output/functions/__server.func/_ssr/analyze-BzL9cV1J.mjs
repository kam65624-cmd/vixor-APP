import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate } from "../_libs/tanstack__react-router.mjs";
import { u as useStableServerFn, g as getMe, y as createAnalysis } from "./router-CBhlu--X.mjs";
import { u as useQuery } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { p as ArrowLeft, U as Upload, a6 as Image, a7 as Clipboard, a3 as X, S as Sparkles, L as LoaderCircle } from "../_libs/lucide-react.mjs";
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
import "./server-Be9kCMDs.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C1LBbw-O.mjs";
import "../_libs/zod.mjs";
const TRADING_STYLES = [{
  id: "Scalping",
  icon: "⚡",
  label: "Scalping"
}, {
  id: "Day Trading",
  icon: "☀️",
  label: "Day Trading"
}, {
  id: "Swing Trading",
  icon: "🌊",
  label: "Swing Trading"
}];
const STEPS = ["Connecting to Engine", "Extracting Price Action", "Computing Market Structure", "Generating Signal"];
function Analyze() {
  const navigate = useNavigate();
  const fetchMe = useStableServerFn(getMe);
  const create = useStableServerFn(createAnalysis);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({}),
    staleTime: 3e4
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
          tradingStyle
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
      }), className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-5" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5", children: "Vixor Engine" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold tracking-tight leading-none", children: "Analyze Chart" })
      ] })
    ] }),
    err && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-bearish/10 border border-bearish/30 text-bearish text-xs font-bold rounded-xl animate-in shake", children: err }),
    stage === "upload" && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("label", { className: "block w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-border bg-card/50 hover:bg-card/80 transition-colors cursor-pointer relative overflow-hidden group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center text-center p-6", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Upload, { className: "size-8 text-primary" }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg mb-1", children: "Tap to Upload Chart" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground", children: "PNG, JPG, WebP (Max 8MB)" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "file", ref: fileRef, className: "hidden", accept: "image/png, image/jpeg, image/webp", onChange: (e) => pickFile(e.target.files?.[0] || null) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => fileRef.current?.click(), className: "h-14 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Image, { className: "size-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Gallery" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handlePaste, className: "h-14 rounded-xl bg-card border border-border flex flex-col items-center justify-center gap-1 hover:bg-card-hover transition-colors", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Clipboard, { className: "size-5 text-muted-foreground" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider", children: "Paste" })
        ] })
      ] })
    ] }),
    stage === "preview" && preview && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative rounded-2xl overflow-hidden border border-border aspect-[4/3] bg-black group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: preview, alt: "Preview", className: "w-full h-full object-contain" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
          setFile(null);
          setPreview(null);
          setStage("upload");
        }, className: "absolute top-3 right-3 size-8 rounded-full bg-black/60 backdrop-blur flex items-center justify-center border border-white/20 hover:scale-110 transition-transform text-white", children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-4" }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Trading Style" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-2", children: TRADING_STYLES.map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setTradingStyle(s.id), className: `h-12 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${tradingStyle === s.id ? "bg-primary text-primary-foreground border-primary glow-primary" : "bg-card border-border text-muted-foreground hover:bg-card-hover"}`, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-base", children: s.icon }),
            " ",
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: s.label })
          ] }, s.id)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: startAnalysis, disabled: !isPremium && points < 10, className: "w-full h-14 rounded-xl gradient-primary text-primary-foreground font-bold text-lg flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-5" }),
          " Start Analysis",
          !isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2 text-xs bg-black/20 px-2 py-0.5 rounded-full", children: "-10 pts" })
        ] })
      ] })
    ] }),
    stage === "analyzing" && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "h-[60vh] flex flex-col items-center justify-center text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative mb-8", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-3xl bg-primary/20 animate-ping" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative size-24 rounded-3xl gradient-primary glow-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-10 text-white animate-spin", strokeWidth: 2.5 }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold tracking-tight mb-2", children: "Analyzing Chart..." }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-mono text-primary font-bold", children: STEPS[progress] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "w-48 h-1.5 bg-muted rounded-full mt-6 overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full gradient-primary transition-all duration-500 ease-out", style: {
        width: `${(progress + 1) / STEPS.length * 100}%`
      } }) })
    ] })
  ] });
}
export {
  Analyze as component
};
