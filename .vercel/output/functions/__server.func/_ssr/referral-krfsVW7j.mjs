import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { S as SectionTitle } from "./atoms-Cww8dxsu.mjs";
import { u as useServerFn, g as getMe, j as getReferralStats, k as claimReferral } from "./router-dhCdxqZe.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { p as ArrowLeft, y as Users, z as Copy, D as Share2, J as Crown } from "../_libs/lucide-react.mjs";
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
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
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
import "./server-DAAiN4OG.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-z32ypy3L.mjs";
import "../_libs/zod.mjs";
const tiers = [{
  name: "Bronze",
  min: 1
}, {
  name: "Silver",
  min: 5
}, {
  name: "Gold",
  min: 15
}, {
  name: "Diamond",
  min: 30
}];
function Referral() {
  const qc = useQueryClient();
  const fetchMe = useServerFn(getMe);
  const fetchRef = useServerFn(getReferralStats);
  const claim = useServerFn(claimReferral);
  const fetchMeRef = reactExports.useRef(fetchMe);
  fetchMeRef.current = fetchMe;
  const fetchRefRef = reactExports.useRef(fetchRef);
  fetchRefRef.current = fetchRef;
  const claimRef = reactExports.useRef(claim);
  claimRef.current = claim;
  const meQueryFn = reactExports.useCallback(async () => fetchMeRef.current({}), []);
  const refsQueryFn = reactExports.useCallback(async () => fetchRefRef.current({}), []);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: meQueryFn
  });
  const refs = useQuery({
    queryKey: ["refs"],
    queryFn: refsQueryFn
  });
  const [code, setCode] = reactExports.useState("");
  const [copied, setCopied] = reactExports.useState(false);
  const m = useMutation({
    mutationFn: (c) => claimRef.current({
      data: {
        code: c.toUpperCase()
      }
    }),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["me"]
      });
      setCode("");
    }
  });
  const myCode = me.data?.profile?.referral_code ?? "";
  const count = refs.data?.count ?? 0;
  const next = tiers.find((t) => t.min > count) ?? tiers[tiers.length - 1];
  const current = [...tiers].reverse().find((t) => t.min <= count) ?? tiers[0];
  const progress = Math.min(100, count / next.min * 100);
  function copy() {
    navigator.clipboard.writeText(myCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "size-9 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-semibold", children: "Referrals" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5 relative overflow-hidden text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary/10 to-info/10" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-2xl gradient-primary glow-primary mx-auto flex items-center justify-center mb-3", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Users, { className: "size-7 text-primary-foreground" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xl font-bold", children: "Invite friends, earn points" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "+25 pts for you · +15 pts for them" })
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs uppercase text-muted-foreground tracking-wide", children: "Your referral code" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 px-4 h-12 rounded-xl bg-muted flex items-center font-bold text-mono tracking-wider", children: myCode || "—" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: copy, className: "size-12 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "size-4" }) })
      ] }),
      copied && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-primary", children: "Copied!" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { className: "w-full h-11 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Share2, { className: "size-4" }),
        " Share via Telegram"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-3 gap-3", children: [{
      label: "Referrals",
      value: count,
      sub: current.name
    }, {
      label: "Earned",
      value: `${count * 25}`,
      sub: "points"
    }, {
      label: "Tier",
      value: current.name,
      sub: "current"
    }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xl font-bold text-mono", children: s.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] uppercase text-muted-foreground", children: s.label }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-primary mt-0.5", children: s.sub })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-sm font-semibold flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "size-4 text-primary" }),
          " Next: ",
          next.name
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-xs text-muted-foreground text-mono", children: [
          count,
          " / ",
          next.min
        ] })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 rounded-full bg-muted overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full gradient-primary rounded-full transition-all", style: {
        width: `${progress}%`
      } }) })
    ] }),
    !me.data?.profile?.referred_by && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-4 space-y-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-semibold", children: "Have a referral code?" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("input", { value: code, onChange: (e) => setCode(e.target.value.toUpperCase()), placeholder: "VIXOR123", maxLength: 16, className: "flex-1 h-11 px-4 rounded-xl bg-muted outline-none text-sm font-mono tracking-wider uppercase" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => code.length >= 4 && m.mutate(code), disabled: m.isPending || code.length < 4, className: "px-4 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50", children: "Apply" })
      ] }),
      m.error && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-bearish", children: m.error.message })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(SectionTitle, { title: "How it works" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-4 space-y-3", children: ["Share your code with friends", "They sign up and apply your code", "You both get bonus points instantly"].map((s, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex gap-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-7 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs", children: i + 1 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm pt-1", children: s })
      ] }, i)) })
    ] })
  ] });
}
export {
  Referral as component
};
