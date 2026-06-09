import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { k as LayoutDashboard, c as Calculator, A as Activity } from "../_libs/lucide-react.mjs";
const mockPositions = [{
  pair: "XAU/USD",
  type: "LONG",
  entry: 2348.5,
  current: 2354.2,
  sl: 2331,
  tp: 2389,
  pnl: "+$1,240.45",
  isProfit: true,
  progress: 72
}, {
  pair: "EUR/USD",
  type: "SHORT",
  entry: 1.0842,
  current: 1.0865,
  sl: 1.088,
  tp: 1.075,
  pnl: "-$210.12",
  isProfit: false,
  progress: 18
}];
const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"];
const PIP_SIZES = {
  "EURUSD": 1e-4,
  "GBPUSD": 1e-4,
  "USDJPY": 0.01,
  "XAUUSD": 0.1,
  "BTCUSD": 1
};
const LOT_SIZES = {
  "EURUSD": 1e5,
  "GBPUSD": 1e5,
  "USDJPY": 1e5,
  "XAUUSD": 100,
  "BTCUSD": 1
};
function TradeDesk() {
  const [balance, setBalance] = reactExports.useState("10000");
  const [riskPct, setRiskPct] = reactExports.useState("1");
  const [slPips, setSlPips] = reactExports.useState("30");
  const [pair, setPair] = reactExports.useState("XAUUSD");
  const result = reactExports.useMemo(() => {
    const bal = parseFloat(balance) || 0;
    const risk = parseFloat(riskPct) || 0;
    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 1e-4;
    const lotSize = LOT_SIZES[pair] || 1e5;
    if (bal <= 0 || risk <= 0 || sl <= 0) return null;
    const riskAmount = bal * (risk / 100);
    const pipValue = pipSize * lotSize;
    const lots = riskAmount / (sl * pipValue);
    return {
      lots: lots.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      riskLevel: risk <= 1 ? "LOW" : risk <= 2 ? "MEDIUM" : "HIGH"
    };
  }, [balance, riskPct, slPips, pair]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-6 pb-6 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 rounded-xl gradient-primary flex items-center justify-center glow-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(LayoutDashboard, { className: "size-5 text-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-bold tracking-tight leading-none", children: "Trade Desk" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1", children: "Institutional Execution" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5 border-l-4 border-l-primary", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Calculator, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-[11px] uppercase tracking-widest text-muted-foreground", children: "Risk Calculator" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-3 mb-5", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Trading Pair" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("select", { value: pair, onChange: (e) => setPair(e.target.value), className: "w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors cursor-pointer", children: PAIRS.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: p, children: p }, p)) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Balance ($)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: balance, onChange: (e) => setBalance(e.target.value), className: "w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Risk %" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", step: "0.1", value: riskPct, onChange: (e) => setRiskPct(e.target.value), className: "w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "col-span-2 space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground", children: "Stop Loss (Pips/Points)" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "number", value: slPips, onChange: (e) => setSlPips(e.target.value), className: "w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors" })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "bg-card-hover p-4 rounded-xl border border-border text-center", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1", children: "Recommended Lot Size" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-3xl font-bold font-mono text-primary mb-2", children: result ? result.lots : "0.00" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs font-mono text-muted-foreground font-bold", children: [
            "Risk: $",
            result?.riskAmount || "0.00"
          ] }),
          result && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: `text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${result.riskLevel === "LOW" ? "bg-bullish/10 text-bullish" : result.riskLevel === "MEDIUM" ? "bg-neutral-wait/10 text-neutral-wait" : "bg-bearish/10 text-bearish"}`, children: [
            result.riskLevel,
            " RISK"
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Activity, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-bold text-[11px] uppercase tracking-widest text-muted-foreground", children: "Active Positions" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-3", children: mockPositions.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-4 relative overflow-hidden border-l-4 ${p.isProfit ? "border-l-bullish" : "border-l-bearish"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute top-0 inset-x-0 h-0.5 bg-card-hover", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-full ${p.isProfit ? "bg-bullish" : "bg-bearish"}`, style: {
          width: `${p.progress}%`
        } }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-start mb-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p.isProfit ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`, children: p.type }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold font-mono text-base", children: p.pair })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground", children: [
              "Entry: ",
              p.entry
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `font-bold font-mono text-lg ${p.isProfit ? "text-bullish" : "text-bearish"}`, children: p.pnl }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs font-mono text-muted-foreground", children: [
              "Curr: ",
              p.current
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-2 gap-2 mt-4", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: "h-10 rounded-lg bg-card-hover border border-border text-[11px] font-bold uppercase tracking-wider hover:bg-muted transition-colors", children: "Modify SL/TP" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("button", { className: `h-10 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-colors ${p.isProfit ? "bg-bullish/10 text-bullish hover:bg-bullish/20 border border-bullish/20" : "bg-bearish/10 text-bearish hover:bg-bearish/20 border border-bearish/20"}`, children: "Close Position" })
        ] })
      ] }, i)) })
    ] })
  ] });
}
export {
  TradeDesk as component
};
