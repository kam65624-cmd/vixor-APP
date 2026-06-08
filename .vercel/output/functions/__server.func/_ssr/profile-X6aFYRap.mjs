import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useServerFn, g as getMe, a as getReferralStats, l as listAnalyses } from "./router-CpOILtp4.mjs";
import { a as useQueryClient, u as useQuery } from "../_libs/tanstack__react-query.mjs";
import { supabase } from "./client-CjdFgX-H.mjs";
import { S as Skeleton } from "./skeleton-CoUJiN10.mjs";
import "../_libs/seroval.mjs";
import { y as Crown, Z as Zap, T as TrendingUp, z as Target, v as Users, D as Award, r as Star, B as BookOpen, L as LayoutDashboard, b as Bell, J as Settings, d as ChevronRight, u as LogOut } from "../_libs/lucide-react.mjs";
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
import "./server-DgZVuMzr.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-C9iXm7zZ.mjs";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/zod.mjs";
import "./utils-H80jjgLf.mjs";
import "../_libs/clsx.mjs";
import "../_libs/tailwind-merge.mjs";
const BADGES = [{
  id: "first_analysis",
  icon: "🎯",
  label: "First Analysis",
  desc: "Completed your first chart read"
}, {
  id: "streak_7",
  icon: "🔥",
  label: "On Fire",
  desc: "7-day login streak"
}, {
  id: "premium",
  icon: "👑",
  label: "Pro Trader",
  desc: "Subscribed to Premium"
}, {
  id: "referral",
  icon: "🤝",
  label: "Connector",
  desc: "Referred a friend"
}];
function XPBar({
  xp
}) {
  const level = Math.floor(xp / 100) + 1;
  const progress = xp % 100;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] uppercase font-bold text-muted-foreground tracking-wider", children: [
        "Level ",
        level
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[10px] font-bold text-muted-foreground", children: [
        xp,
        " / ",
        level * 100,
        " XP"
      ] })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-2 bg-muted rounded-full overflow-hidden", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-full gradient-primary rounded-full transition-all duration-700", style: {
      width: `${progress}%`
    } }) })
  ] });
}
function Profile() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchMe = useServerFn(getMe);
  const fetchRef = useServerFn(getReferralStats);
  const fetchAnalyses = useServerFn(listAnalyses);
  const me = useQuery({
    queryKey: ["me"],
    queryFn: () => fetchMe({})
  });
  const refs = useQuery({
    queryKey: ["refs"],
    queryFn: () => fetchRef({})
  });
  const analyses = useQuery({
    queryKey: ["analyses-profile"],
    queryFn: () => fetchAnalyses({
      limit: 50
    })
  });
  const display = me.data?.profile?.display_name ?? "Trader";
  const tgPhoto = me.data?.profile?.telegram_photo_url;
  const tgUsername = me.data?.profile?.telegram_username;
  const avatarFallback = (display.split(" ").map((s) => s[0]).join("").slice(0, 2) || "U").toUpperCase();
  const isPremium = !!me.data?.isPremium;
  const refCount = refs.data?.count ?? 0;
  const joinedAt = me.data?.profile?.created_at;
  const joinedDays = joinedAt ? Math.floor((Date.now() - new Date(joinedAt).getTime()) / 864e5) : 0;
  const xp = me.data?.profile?.xp ?? 0;
  const streak = me.data?.profile?.streak_days ?? 0;
  const totalAnalyses = analyses.data?.length ?? 0;
  const points = me.data?.balance?.balance ?? 0;
  const earned = me.data?.balance?.lifetime_earned ?? 0;
  const unlockedBadges = /* @__PURE__ */ new Set();
  if (totalAnalyses >= 1) unlockedBadges.add("first_analysis");
  if (streak >= 7) unlockedBadges.add("streak_7");
  if (isPremium) unlockedBadges.add("premium");
  if (refCount >= 1) unlockedBadges.add("referral");
  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({
      to: "/auth",
      replace: true
    });
  }
  const links = [{
    to: "/journal",
    icon: BookOpen,
    label: "Trade Journal",
    desc: "History & performance",
    color: "bg-bullish/10 text-bullish"
  }, {
    to: "/trade-desk",
    icon: LayoutDashboard,
    label: "Trade Desk",
    desc: "Positions & risk calc",
    color: "bg-info/10 text-info"
  }, {
    to: "/referral",
    icon: Users,
    label: "Referrals",
    desc: `${refCount} friend${refCount !== 1 ? "s" : ""} invited`,
    color: "bg-primary/10 text-primary"
  }, {
    to: "/premium",
    icon: Crown,
    label: "Premium",
    desc: isPremium ? "✅ Active" : "Unlock unlimited",
    color: "bg-neutral-wait/10 text-neutral-wait"
  }, {
    to: "/notifications",
    icon: Bell,
    label: "Notifications",
    desc: "Alerts & reminders",
    color: "bg-bearish/10 text-bearish"
  }, {
    to: "/settings",
    icon: Settings,
    label: "Settings",
    desc: "Account & preferences",
    color: "bg-muted text-muted-foreground"
  }];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-5", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-4 mb-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
          tgPhoto ? /* @__PURE__ */ jsxRuntimeExports.jsx("img", { src: tgPhoto, alt: "Telegram Avatar", className: "size-18 rounded-2xl border border-border object-cover" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-18 rounded-2xl gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground glow-primary", children: avatarFallback }),
          isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1.5 -right-1.5 size-6 rounded-full gradient-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Crown, { className: "size-3 text-primary-foreground" }) }),
          tgUsername && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-2 inset-x-0 flex justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "bg-[#24A1DE] text-white text-[9px] font-bold px-2 py-0.5 rounded-full border border-background shadow-sm whitespace-nowrap", children: "Linked" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 min-w-0", children: me.isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-5 w-32" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Skeleton, { className: "h-3 w-20" })
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-lg truncate", children: display }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-xs text-muted-foreground mb-2", children: [
            "Member for ",
            joinedDays,
            " days"
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-wrap gap-1.5", children: [
            isPremium && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[9px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary/20 text-primary font-bold uppercase tracking-wider", children: "PRO" }),
            streak > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] px-2 py-0.5 rounded-full bg-neutral-wait/10 border border-neutral-wait/20 text-neutral-wait font-bold", children: [
              "🔥 ",
              streak,
              " day streak"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "text-[9px] px-2 py-0.5 rounded-full bg-info/10 border border-info/20 text-info font-bold", children: [
              "⚡ ",
              points,
              " pts"
            ] })
          ] })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(XPBar, { xp })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-2", children: [{
      label: "Points",
      value: points,
      color: "text-primary",
      icon: Zap
    }, {
      label: "Earned",
      value: earned,
      color: "text-bullish",
      icon: TrendingUp
    }, {
      label: "Analyses",
      value: totalAnalyses,
      color: "text-info",
      icon: Target
    }, {
      label: "Referrals",
      value: refCount,
      color: "text-neutral-wait",
      icon: Users
    }].map((s) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3 text-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(s.icon, { className: `size-4 mx-auto mb-1 ${s.color}` }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `text-lg font-bold font-mono ${s.color}`, children: s.value }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[8px] uppercase font-bold text-muted-foreground mt-0.5", children: s.label })
    ] }, s.label)) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 mb-3 px-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Award, { className: "size-4 text-primary" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-xs font-bold uppercase tracking-widest text-muted-foreground", children: "Badges" })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: BADGES.map((b) => {
        const unlocked = unlockedBadges.has(b.id);
        return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-3 flex items-center gap-3 transition-opacity ${unlocked ? "opacity-100" : "opacity-40"}`, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-2xl", children: b.icon }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-w-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-bold text-xs leading-none mb-0.5", children: b.label }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] text-muted-foreground leading-tight line-clamp-2", children: b.desc })
          ] }),
          unlocked && /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "size-3 text-primary shrink-0" })
        ] }, b.id);
      }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card divide-y divide-border overflow-hidden", children: links.map((l) => {
      const Icon = l.icon;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: l.to, className: "p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors group", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-9 rounded-xl flex items-center justify-center shrink-0 ${l.color}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-bold", children: l.label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: l.desc })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" })
      ] }, l.to);
    }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: signOut, className: "w-full h-12 rounded-2xl bg-bearish/10 border border-bearish/20 text-bearish font-bold flex items-center justify-center gap-2 hover:bg-bearish hover:text-white transition-all duration-200", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-4" }),
      " Sign Out"
    ] })
  ] });
}
export {
  Profile as component
};
