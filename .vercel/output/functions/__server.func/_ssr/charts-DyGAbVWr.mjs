import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, f as useSearch } from "../_libs/tanstack__react-router.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { u as useStableServerFn, a as getMarketPrices, d as listAlerts, x as deleteAlert, h as createAlert } from "./router-uhgHfevS.mjs";
import { g as getDisplayPair, t as toTradingViewSymbol, S as SYMBOL_MAP, T as TradingViewChart } from "./TradingViewChart-AiVAL5My.mjs";
import { R as Root, P as Portal, C as Content, a as Close, T as Title, D as Description, O as Overlay } from "../_libs/radix-ui__react-dialog.mjs";
import { c as cn } from "./utils-H80jjgLf.mjs";
import { S as Select$1, a as SelectValue$1, b as SelectTrigger$1, c as SelectIcon, d as SelectPortal, e as SelectContent$1, f as SelectViewport, g as SelectItem$1, h as SelectItemIndicator, i as SelectItemText, j as SelectScrollUpButton$1, k as SelectScrollDownButton$1, l as SelectLabel$1, m as SelectSeparator$1 } from "../_libs/radix-ui__react-select.mjs";
import { S as SectionTitle } from "./atoms-Cww8dxsu.mjs";
import "../_libs/seroval.mjs";
import { Y as Search, b as Bell, S as Sparkles, P as Plus, a2 as ArrowUpDown, o as TrendingDown, T as TrendingUp, a3 as X, k as Clock, L as LoaderCircle, a4 as ChevronDown, X as Check, a5 as ChevronUp } from "../_libs/lucide-react.mjs";
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
import "../_libs/radix-ui__primitive.mjs";
import "../_libs/radix-ui__react-compose-refs.mjs";
import "../_libs/radix-ui__react-context.mjs";
import "../_libs/radix-ui__react-id.mjs";
import "../_libs/@radix-ui/react-use-layout-effect+[...].mjs";
import "../_libs/@radix-ui/react-use-controllable-state+[...].mjs";
import "../_libs/@radix-ui/react-dismissable-layer+[...].mjs";
import "../_libs/radix-ui__react-primitive.mjs";
import "../_libs/radix-ui__react-slot.mjs";
import "../_libs/@radix-ui/react-use-callback-ref+[...].mjs";
import "../_libs/@radix-ui/react-use-escape-keydown+[...].mjs";
import "../_libs/radix-ui__react-focus-scope.mjs";
import "../_libs/radix-ui__react-portal.mjs";
import "../_libs/radix-ui__react-presence.mjs";
import "../_libs/radix-ui__react-focus-guards.mjs";
import "../_libs/react-remove-scroll.mjs";
import "../_libs/react-remove-scroll-bar.mjs";
import "../_libs/react-style-singleton.mjs";
import "../_libs/get-nonce.mjs";
import "../_libs/use-sidecar.mjs";
import "../_libs/use-callback-ref.mjs";
import "../_libs/aria-hidden.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
import "../_libs/radix-ui__number.mjs";
import "../_libs/radix-ui__react-collection.mjs";
import "../_libs/radix-ui__react-direction.mjs";
import "../_libs/radix-ui__react-popper.mjs";
import "../_libs/floating-ui__react-dom.mjs";
import "../_libs/floating-ui__dom.mjs";
import "../_libs/floating-ui__core.mjs";
import "../_libs/floating-ui__utils.mjs";
import "../_libs/radix-ui__react-arrow.mjs";
import "../_libs/radix-ui__react-use-size.mjs";
import "../_libs/radix-ui__react-use-previous.mjs";
import "../_libs/@radix-ui/react-visually-hidden+[...].mjs";
const Dialog = Root;
const DialogPortal = Portal;
const DialogOverlay = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = Overlay.displayName;
const DialogContent = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsxRuntimeExports.jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = Content.displayName;
const DialogHeader = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: cn("flex flex-col space-y-1.5 text-center sm:text-left", className), ...props });
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({ className, ...props }) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  "div",
  {
    className: cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Title,
  {
    ref,
    className: cn("text-lg font-semibold leading-none tracking-tight", className),
    ...props
  }
));
DialogTitle.displayName = Title.displayName;
const DialogDescription = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = Description.displayName;
const Select = Select$1;
const SelectValue = SelectValue$1;
const SelectTrigger = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectTrigger$1,
  {
    ref,
    className: cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background cursor-pointer data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    ),
    ...props,
    children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectIcon, { asChild: true, children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4 opacity-50" }) })
    ]
  }
));
SelectTrigger.displayName = SelectTrigger$1.displayName;
const SelectScrollUpButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectScrollUpButton$1,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "h-4 w-4" })
  }
));
SelectScrollUpButton.displayName = SelectScrollUpButton$1.displayName;
const SelectScrollDownButton = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectScrollDownButton$1,
  {
    ref,
    className: cn("flex cursor-default items-center justify-center py-1", className),
    ...props,
    children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "h-4 w-4" })
  }
));
SelectScrollDownButton.displayName = SelectScrollDownButton$1.displayName;
const SelectContent = reactExports.forwardRef(({ className, children, position = "popper", ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectPortal, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectContent$1,
  {
    ref,
    className: cn(
      "relative z-50 max-h-(--radix-select-content-available-height) min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-(--radix-select-content-transform-origin)",
      position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
      className
    ),
    position,
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollUpButton, {}),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        SelectViewport,
        {
          className: cn(
            "p-1",
            position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
          ),
          children
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectScrollDownButton, {})
    ]
  }
) }));
SelectContent.displayName = SelectContent$1.displayName;
const SelectLabel = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectLabel$1,
  {
    ref,
    className: cn("px-2 py-1.5 text-sm font-semibold", className),
    ...props
  }
));
SelectLabel.displayName = SelectLabel$1.displayName;
const SelectItem = reactExports.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
  SelectItem$1,
  {
    ref,
    className: cn(
      "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    ),
    ...props,
    children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute right-2 flex h-3.5 w-3.5 items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItemIndicator, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "h-4 w-4" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItemText, { children })
    ]
  }
));
SelectItem.displayName = SelectItem$1.displayName;
const SelectSeparator = reactExports.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsxRuntimeExports.jsx(
  SelectSeparator$1,
  {
    ref,
    className: cn("-mx-1 my-1 h-px bg-muted", className),
    ...props
  }
));
SelectSeparator.displayName = SelectSeparator$1.displayName;
const CONDITIONS = [
  { value: "above", label: "Price goes above" },
  { value: "below", label: "Price goes below" },
  { value: "crosses_up", label: "Price crosses up" },
  { value: "crosses_down", label: "Price crosses down" }
];
function CreateAlertDialog({
  open,
  onOpenChange,
  pair,
  currentPrice,
  onSuccess
}) {
  const [condition, setCondition] = reactExports.useState("above");
  const [targetPrice, setTargetPrice] = reactExports.useState("");
  const [note, setNote] = reactExports.useState("");
  const [timeframe, setTimeframe] = reactExports.useState("1H");
  const [loading, setLoading] = reactExports.useState(false);
  const [error, setError] = reactExports.useState(null);
  const createAlertFn = useStableServerFn(createAlert);
  const handleCreate = async () => {
    const price = parseFloat(targetPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid price");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createAlertFn({
        data: {
          symbol: toTradingViewSymbol(pair),
          pair,
          condition,
          targetPrice: price,
          currentPrice,
          note: note || void 0,
          timeframe
        }
      });
      onOpenChange(false);
      setTargetPrice("");
      setNote("");
      setCondition("above");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create alert");
    } finally {
      setLoading(false);
    }
  };
  const suggestedPrices = condition === "above" ? [currentPrice * 1.01, currentPrice * 1.02, currentPrice * 1.05] : condition === "below" ? [currentPrice * 0.99, currentPrice * 0.98, currentPrice * 0.95] : [currentPrice * 1.01, currentPrice * 0.99, currentPrice * 1.02];
  const formatSuggestedPrice = (p) => {
    if (pair.includes("JPY") || pair === "XAU/USD" || pair.includes("USDT")) {
      return p.toFixed(2);
    }
    return p.toFixed(4);
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsx(Dialog, { open, onOpenChange, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { className: "max-w-sm rounded-2xl bg-card border-border", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogTitle, { className: "flex items-center gap-2 text-foreground", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-5 text-primary" }),
        "Set Price Alert"
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogDescription, { className: "text-muted-foreground", children: [
        "Get notified when ",
        pair,
        " reaches your target price"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-bold uppercase tracking-widest text-muted-foreground", children: "Current Price" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xl font-bold font-mono text-foreground", children: [
            "$",
            currentPrice.toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: pair.includes("JPY") ? 2 : 4 })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold", children: pair })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Condition" }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: condition, onValueChange: setCondition, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectTrigger, { className: "bg-background border-border rounded-xl h-11", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SelectValue, {}) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(SelectContent, { children: CONDITIONS.map((c) => /* @__PURE__ */ jsxRuntimeExports.jsx(SelectItem, { value: c.value, children: c.label }, c.value)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Target Price" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "number",
            value: targetPrice,
            onChange: (e) => setTargetPrice(e.target.value),
            placeholder: "0.00",
            step: pair.includes("JPY") ? "0.01" : pair === "XAU/USD" ? "0.01" : "0.0001",
            className: "w-full h-11 px-3 rounded-xl bg-background border border-border text-foreground font-mono text-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5 mt-2", children: suggestedPrices.map((p, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "button",
          {
            onClick: () => setTargetPrice(formatSuggestedPrice(p)),
            className: "flex-1 h-8 rounded-lg bg-muted text-xs font-mono font-semibold text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors",
            children: [
              "$",
              formatSuggestedPrice(p)
            ]
          },
          i
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Timeframe" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5", children: ["15M", "1H", "4H", "1D"].map((tf) => /* @__PURE__ */ jsxRuntimeExports.jsx(
          "button",
          {
            onClick: () => setTimeframe(tf),
            className: `flex-1 h-9 rounded-lg text-xs font-bold transition-all ${timeframe === tf ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-card-hover"}`,
            children: tf
          },
          tf
        )) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block", children: "Note (optional)" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "input",
          {
            type: "text",
            value: note,
            onChange: (e) => setNote(e.target.value),
            placeholder: "e.g. Breakout play",
            maxLength: 200,
            className: "w-full h-9 px-3 rounded-xl bg-background border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          }
        )
      ] }),
      error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "p-3 bg-bearish/10 border border-bearish/30 text-bearish text-xs font-bold rounded-xl", children: error })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogFooter, { children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: handleCreate,
        disabled: loading || !targetPrice,
        className: "w-full h-12 rounded-xl gradient-primary text-primary-foreground font-bold text-base flex items-center justify-center gap-2 glow-primary hover:scale-[1.02] active:scale-95 transition-transform disabled:opacity-50",
        children: [
          loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-5 animate-spin" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-5" }),
          "Create Alert"
        ]
      }
    ) })
  ] }) });
}
const conditionIcons = {
  above: TrendingUp,
  below: TrendingDown,
  crosses_up: ArrowUpDown,
  crosses_down: ArrowUpDown
};
const conditionLabels = {
  above: "Above",
  below: "Below",
  crosses_up: "Crosses Up",
  crosses_down: "Crosses Down"
};
function AlertsList({ pair, onRefresh }) {
  const queryClient = useQueryClient();
  const listAlertsFn = useStableServerFn(listAlerts);
  const deleteAlertFn = useStableServerFn(deleteAlert);
  const { data: alerts, isLoading } = useQuery(reactExports.useMemo(() => ({
    queryKey: ["alerts", pair],
    queryFn: () => listAlertsFn({ data: { pair, status: void 0 } }),
    staleTime: 15e3
  }), [listAlertsFn, pair]));
  const handleDelete = async (alertId) => {
    try {
      await deleteAlertFn({ data: { alertId } });
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      onRefresh?.();
    } catch (err) {
      console.error("Failed to cancel alert:", err);
    }
  };
  if (isLoading) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm text-muted-foreground text-center", children: "Loading alerts..." }) });
  }
  if (!alerts || alerts.length === 0) {
    return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-6 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-8 text-muted-foreground/30 mx-auto mb-2" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-sm text-muted-foreground", children: [
        "No active alerts",
        pair ? ` for ${pair}` : ""
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground/60 mt-1", children: "Set an alert to get notified when price hits your target" })
    ] });
  }
  const activeAlerts = alerts.filter((a) => a.status === "active");
  const triggeredAlerts = alerts.filter((a) => a.status === "triggered").slice(0, 3);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-3", children: [
    activeAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: `Active Alerts (${activeAlerts.length})` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: activeAlerts.map((alert) => {
        const Icon = conditionIcons[alert.condition] || Bell;
        return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-3.5 animate-in fade-in slide-in-from-bottom-2 duration-300", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-9 rounded-xl flex items-center justify-center ${alert.condition === "above" || alert.condition === "crosses_up" ? "bg-bullish/10" : "bg-bearish/10"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `size-4 ${alert.condition === "above" || alert.condition === "crosses_up" ? "text-bullish" : "text-bearish"}` }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-sm font-mono", children: alert.pair }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${alert.condition === "above" || alert.condition === "crosses_up" ? "bg-bullish/10 text-bullish" : "bg-bearish/10 text-bearish"}`, children: conditionLabels[alert.condition] })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-mono mt-0.5", children: [
              "$",
              Number(alert.target_price).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: alert.pair?.includes("JPY") ? 2 : 4 }),
              alert.timeframe && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "ml-2", children: alert.timeframe })
            ] }),
            alert.note && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground/70 mt-0.5 truncate", children: alert.note })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "button",
            {
              onClick: () => handleDelete(alert.id),
              className: "size-8 rounded-lg bg-muted flex items-center justify-center hover:bg-bearish/10 hover:text-bearish transition-colors shrink-0",
              children: /* @__PURE__ */ jsxRuntimeExports.jsx(X, { className: "size-3.5" })
            }
          )
        ] }) }, alert.id);
      }) })
    ] }),
    triggeredAlerts.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: "Recently Triggered" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: triggeredAlerts.map((alert) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-3.5 opacity-60", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold text-sm font-mono", children: alert.pair }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-primary/10 text-primary", children: "Triggered" })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground font-mono mt-0.5", children: [
            "$",
            Number(alert.target_price).toLocaleString(void 0, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-2", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "size-3 inline -mt-0.5" }),
              " ",
              alert.triggered_at ? new Date(alert.triggered_at).toLocaleTimeString() : ""
            ] })
          ] })
        ] })
      ] }) }, alert.id)) })
    ] })
  ] });
}
const POPULAR = [{
  pair: "BTC/USDT",
  icon: "₿"
}, {
  pair: "ETH/USDT",
  icon: "Ξ"
}, {
  pair: "XAU/USD",
  icon: "Au"
}, {
  pair: "EUR/USD",
  icon: "€"
}, {
  pair: "GBP/JPY",
  icon: "£"
}, {
  pair: "SOL/USDT",
  icon: "◎"
}];
function Charts() {
  const navigate = useNavigate();
  const search = useSearch({
    strict: false
  });
  const queryClient = useQueryClient();
  const [currentPair, setCurrentPair] = reactExports.useState(() => {
    const sym = search.symbol || "BINANCE:BTCUSDT";
    return getDisplayPair(sym);
  });
  const [searchInput, setSearchInput] = reactExports.useState("");
  const [showAlertDialog, setShowAlertDialog] = reactExports.useState(false);
  const currentSymbol = reactExports.useMemo(() => toTradingViewSymbol(currentPair), [currentPair]);
  const fetchPrices = useStableServerFn(getMarketPrices);
  const pricesQuery = useQuery(reactExports.useMemo(() => ({
    queryKey: ["market-prices"],
    queryFn: () => fetchPrices({}),
    staleTime: 6e4,
    refetchInterval: 12e4
  }), [fetchPrices]));
  const currentPrice = reactExports.useMemo(() => {
    const priceData = pricesQuery.data?.find((p) => p.pair === currentPair);
    return priceData?.price ?? 0;
  }, [pricesQuery.data, currentPair]);
  const changePair = reactExports.useCallback((pair) => {
    setCurrentPair(pair);
    const symbol = toTradingViewSymbol(pair);
    navigate({
      to: "/charts",
      search: {
        symbol
      }
    });
  }, [navigate]);
  const handleSearch = reactExports.useCallback(() => {
    if (!searchInput.trim()) return;
    const normalizedInput = searchInput.trim().toUpperCase();
    if (SYMBOL_MAP[normalizedInput]) {
      changePair(normalizedInput);
      setSearchInput("");
      return;
    }
    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.replace("/", "").toUpperCase() === normalizedInput) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }
    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.toUpperCase().includes(normalizedInput)) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }
    if (normalizedInput.includes(":")) {
      setCurrentPair(getDisplayPair(normalizedInput));
      navigate({
        to: "/charts",
        search: {
          symbol: normalizedInput
        }
      });
      setSearchInput("");
    }
  }, [searchInput, changePair, navigate]);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4 animate-in fade-in duration-500", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-card border border-border", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { placeholder: "Search pair… (e.g. BTC/USDT)", value: searchInput, onChange: (e) => setSearchInput(e.target.value), onKeyDown: (e) => e.key === "Enter" && handleSearch(), className: "bg-transparent flex-1 text-sm outline-none text-foreground placeholder:text-muted-foreground" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: handleSearch, className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Search, { className: "size-4 text-muted-foreground" }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-2 overflow-x-auto scrollbar-hide pb-1", children: POPULAR.map((p) => {
      const priceData = pricesQuery.data?.find((d) => d.pair === p.pair);
      const isActive = currentPair === p.pair;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => changePair(p.pair), className: `flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${isActive ? "gradient-primary text-primary-foreground glow-primary" : "bg-card border border-border text-muted-foreground hover:bg-card-hover hover:text-foreground"}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm", children: p.icon }),
        p.pair,
        priceData && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "font-mono text-[10px] opacity-70", children: [
          "$",
          Number(priceData.price).toLocaleString(void 0, {
            maximumFractionDigits: priceData.pair?.includes("JPY") ? 2 : 2
          })
        ] })
      ] }, p.pair);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground font-semibold", children: currentPair }),
        currentPrice > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-3xl font-bold font-mono", children: [
            "$",
            currentPrice.toLocaleString(void 0, {
              minimumFractionDigits: 2,
              maximumFractionDigits: currentPair.includes("JPY") ? 2 : 4
            })
          ] }),
          pricesQuery.data?.find((p) => p.pair === currentPair)?.change24h !== void 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `text-sm font-semibold font-mono ${(pricesQuery.data.find((p) => p.pair === currentPair)?.change24h ?? 0) >= 0 ? "text-bullish" : "text-bearish"}`, children: [
            (pricesQuery.data.find((p) => p.pair === currentPair)?.change24h ?? 0) >= 0 ? "+" : "",
            (pricesQuery.data.find((p) => p.pair === currentPair)?.change24h ?? 0).toFixed(2),
            "%"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => setShowAlertDialog(true), className: "size-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4" }) })
    ] }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(TradingViewChart, { symbol: currentSymbol, interval: "240", theme: "dark", height: "65vh" }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "grid grid-cols-3 gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setShowAlertDialog(true), className: "vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Set Alert" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => navigate({
        to: "/analyze"
      }), className: "vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Analyze" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => {
        queryClient.invalidateQueries({
          queryKey: ["alerts"]
        });
      }, className: "vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-primary/10 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Plus, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold uppercase tracking-wider text-muted-foreground", children: "Watchlist" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: "My Alerts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertsList, { pair: currentPair })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: "All Alerts" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(AlertsList, {})
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(CreateAlertDialog, { open: showAlertDialog, onOpenChange: setShowAlertDialog, pair: currentPair, currentPrice: currentPrice || 68e3, onSuccess: () => queryClient.invalidateQueries({
      queryKey: ["alerts"]
    }) })
  ] });
}
export {
  Charts as component
};
