import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useStableServerFn, n as getPremiumPlans, p as getPointPacks, g as getMe, s as subscribePremium, r as purchasePack, q as createStarsInvoice, m as isInsideTelegram, o as openTelegramInvoice } from "./router-CBhlu--X.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { p as ArrowLeft, J as Crown, S as Sparkles, Z as Zap, a as ChartColumn, b as Bell, W as ShieldCheck, X as Check, L as LoaderCircle, u as Star } from "../_libs/lucide-react.mjs";
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
const features = [{
  icon: Sparkles,
  label: "Unlimited analyses"
}, {
  icon: Zap,
  label: "Priority AI processing"
}, {
  icon: ChartColumn,
  label: "Advanced indicators"
}, {
  icon: Bell,
  label: "Unlimited price alerts"
}, {
  icon: ShieldCheck,
  label: "Multi-strategy plans"
}];
function Premium() {
  const qc = useQueryClient();
  const fetchPlans = useStableServerFn(getPremiumPlans);
  const fetchPacks = useStableServerFn(getPointPacks);
  const fetchMe = useStableServerFn(getMe);
  const subscribe = useStableServerFn(subscribePremium);
  const buy = useStableServerFn(purchasePack);
  const buyStars = useStableServerFn(createStarsInvoice);
  const plans = useQuery({
    queryKey: ["plans"],
    queryFn: () => fetchPlans({})
  });
  const packs = useQuery({
    queryKey: ["packs"],
    queryFn: () => fetchPacks({})
  });
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({})
  });
  const [planId, setPlanId] = reactExports.useState("yearly");
  const subMut = useMutation({
    mutationFn: (id) => subscribe({
      data: {
        planId: id
      }
    }),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["me"]
    })
  });
  const packMut = useMutation({
    mutationFn: async (id) => {
      if (isInsideTelegram()) {
        const pack = packs.data?.find((p) => p.id === id);
        const amountStars = Math.max(1, Math.floor((pack?.price_cents ?? 0) / 2));
        const res = await buyStars({
          data: {
            packId: id,
            amountStars
          }
        });
        openTelegramInvoice(res.invoiceUrl);
        return;
      } else {
        return buy({
          data: {
            packId: id
          }
        });
      }
    },
    onSuccess: () => {
      if (!isInsideTelegram()) {
        qc.invalidateQueries({
          queryKey: ["me"]
        });
      }
    }
  });
  const isPremium = !!me.data?.isPremium;
  isInsideTelegram();
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "size-9 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-semibold", children: "Premium" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-6 relative overflow-hidden text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/20 via-info/10 to-transparent" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-2xl bg-gradient-to-br from-primary to-info mx-auto flex items-center justify-center mb-3 glow-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "size-8 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold tracking-tight", children: "Vixor Premium" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: isPremium ? "Active until " + new Date(me.data?.premium?.current_period_end ?? "").toLocaleDateString() : "Unlimited analyses. Smarter setups." })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-4 space-y-3", children: features.map((f) => {
      const Icon = f.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-primary/15 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm flex-1", children: f.label }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-4 text-primary" })
      ] }, f.label);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: plans.data?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => setPlanId(p.id), disabled: isPremium, className: `w-full vixor-card p-4 flex items-center gap-3 text-left border-2 ${planId === p.id ? "border-primary" : "border-transparent"} disabled:opacity-50`, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-5 rounded-full border-2 flex items-center justify-center ${planId === p.id ? "border-primary bg-primary" : "border-muted-foreground"}`, children: planId === p.id && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2 rounded-full bg-primary-foreground" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm", children: p.name }),
        p.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-primary font-semibold", children: p.badge })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-right", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "font-bold text-mono", children: [
          "$",
          (p.price_cents / 100).toFixed(2)
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-[10px] text-muted-foreground", children: [
          "/",
          p.interval
        ] })
      ] })
    ] }, p.id)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => subMut.mutate(planId), disabled: isPremium || subMut.isPending, className: "w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold glow-primary flex items-center justify-center gap-2 disabled:opacity-50", children: [
      subMut.isPending && /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
      isPremium ? "You're a Premium member" : "Upgrade now"
    ] }),
    subMut.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-bearish text-center", children: subMut.error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-center text-muted-foreground", children: "Cancel anytime. Pay with Telegram Stars or card." }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-base font-semibold tracking-tight mb-3", children: "Or top up points" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-3", children: packs.data?.map((p) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-4 relative ${p.badge === "Popular" ? "border-primary border-2" : ""}`, children: [
        p.badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -top-2 right-2 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded", children: p.badge.toUpperCase() }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-mono text-2xl font-bold", children: [
          p.points,
          p.bonus_points ? /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-bullish", children: [
            " +",
            p.bonus_points
          ] }) : null
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] text-muted-foreground mb-3", children: "points" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => packMut.mutate(p.id), disabled: packMut.isPending, className: "w-full h-9 rounded-lg bg-[#24A1DE] text-white flex items-center justify-center gap-1.5 text-xs font-semibold disabled:opacity-50", children: packMut.isPending && packMut.variables === p.id ? "…" : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3", fill: "currentColor" }),
          Math.max(1, Math.floor(p.price_cents / 2)),
          " Stars"
        ] }) })
      ] }, p.id)) }),
      packMut.error && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-bearish text-center mt-2", children: packMut.error.message })
    ] })
  ] });
}
export {
  Premium as component
};
