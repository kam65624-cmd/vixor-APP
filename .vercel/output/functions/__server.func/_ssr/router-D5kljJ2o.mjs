import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { S as redirect, m as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { supabase } from "./client-CjdFgX-H.mjs";
import { c as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-CCzWFmWl.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-1P-qMUgE.mjs";
import { H as House, C as Compass, P as Plus, L as LayoutDashboard, B as BookOpen, a as ChartColumn, b as Bell, S as Sparkles, U as Upload, c as Calculator, G as Gift, d as ChevronRight } from "../_libs/lucide-react.mjs";
import { o as object, c as string, n as number } from "../_libs/zod.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "async_hooks";
import "stream";
import "crypto";
import "node:stream";
import "../_libs/isbot.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
function useServerFn(serverFn) {
  const router2 = useRouter();
  return reactExports.useCallback(async (...args) => {
    try {
      const res = await serverFn(...args);
      if (isRedirect(res)) throw res;
      return res;
    } catch (err) {
      if (isRedirect(err)) {
        err.options._fromLocation = router2.stores.location.get();
        return router2.navigate(router2.resolveRedirect(err).options);
      }
      throw err;
    }
  }, [router2, serverFn]);
}
const appCss = "/assets/styles-DOcOkguJ.css";
const slides = [
  { icon: Sparkles, title: "Welcome to Vixor", body: "AI-powered chart analysis built for Telegram traders. Smarter setups in seconds." },
  { icon: Upload, title: "Drop a chart, get a plan", body: "Upload any chart image. Get entry, stop loss, take profits, and confidence in under 10 seconds." },
  { icon: Calculator, title: "Trade with discipline", body: "Built-in lot calculator and risk management keep your account safe — every trade." },
  { icon: Gift, title: "Earn as you trade", body: "Daily bonuses, streaks, and referrals turn into points you can spend on analyses." }
];
function OnboardingModal({ onClose }) {
  const [i, setI] = reactExports.useState(0);
  const s = slides[i];
  const Icon = s.icon;
  const last = i === slides.length - 1;
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card w-full max-w-md p-6 space-y-6 animate-in slide-in-from-bottom-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between items-center", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1.5", children: slides.map((_, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `h-1 rounded-full transition-all ${idx === i ? "w-8 bg-primary" : "w-1.5 bg-muted"}` }, idx)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: onClose, className: "text-xs text-muted-foreground hover:text-foreground", children: "Skip" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col items-center text-center gap-4 py-6", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-20 rounded-3xl gradient-primary glow-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-9 text-primary-foreground", strokeWidth: 2.2 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "text-2xl font-bold tracking-tight", children: s.title }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-muted-foreground text-sm max-w-xs", children: s.body })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "button",
      {
        onClick: () => last ? onClose() : setI(i + 1),
        className: "w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary",
        children: [
          last ? "Claim +10 points" : "Continue",
          /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4" })
        ]
      }
    )
  ] }) });
}
function getTelegramInitData() {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initData || null;
  }
  return null;
}
function isInsideTelegram() {
  return !!getTelegramInitData();
}
function openTelegramInvoice(url) {
  if (typeof window !== "undefined" && window.Telegram?.WebApp) {
    window.Telegram.WebApp.openInvoice(url, (status) => {
      console.log("Invoice status:", status);
    });
  }
}
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const getMe = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("6ca79208ef9c4066dad6cd1a3ab1451e3040c7383cec027f6b92729ccc50c3d5"));
const getPointPacks = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("cb296644a2f9a048d6bb4c16138ebd2b254738ba633107c33aa50f6c25675d9f"));
const getPremiumPlans = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("89b585d1d9fc395c1ff9793765fc5e5288ee79c251a8aa780da4b3027ea4b893"));
const purchasePack = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  packId: string().min(1).max(64)
}).parse(d)).handler(createSsrRpc("45dbf160bcf3e906c5305bd6589501c3ed28167a490ea94072a165bd2490ab51"));
const subscribePremium = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  planId: string().min(1).max(64)
}).parse(d)).handler(createSsrRpc("d22b0fb6c719a9163ecfe9e033b2d0efca5db2e3e0c5d955fc13eca336063508"));
const CreateAnalysisInput = object({
  imageBase64: string().min(64).max(15e6),
  mimeType: string().regex(/^image\/(png|jpeg|jpg|webp)$/),
  fileName: string().optional(),
  selectedPair: string().optional(),
  tradingStyle: string().optional()
});
const createAnalysis = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => CreateAnalysisInput.parse(d)).handler(createSsrRpc("b5c8229b29e46a8f81b244120156ed019e274415d4be41272d7106a370296687"));
const getAnalysis = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  id: string().uuid()
}).parse(d)).handler(createSsrRpc("b59bcf6511b3020036361dae2f1a70673f2541388682281eb563c430bddc81ee"));
const listAnalyses = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  limit: number().min(1).max(100).default(20)
}).parse(d ?? {})).handler(createSsrRpc("3e22292f15cabf364231519245a61d0a27aa8922c53737dbe4290036af679b61"));
const listNotifications = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("9e47b7f9d55d7174faabcd406baf936dc0572e9b4cf066e1daa5b71e3cc91794"));
const markAllNotificationsRead = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("ee9b2b9c40e6b87e601e8a248236cf26d2076f053d0e449dbb552e0164b9b499"));
const claimReferral = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  code: string().min(4).max(16).regex(/^[A-Z0-9]+$/)
}).parse(d)).handler(createSsrRpc("fc83294feba346665eb81f3ef3955fccc1a154ffdff6c6425c403c745950dfb2"));
const getReferralStats = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("1be115425d998b8b2f28b2d572d52b6b6eb1428db38069c10841ff9887ca5d9c"));
const getMarketNews = createServerFn({
  method: "GET"
}).validator((d) => object({
  category: string().default("general")
}).parse(d ?? {})).handler(createSsrRpc("2a29fe47665b5c27b0e3e1992921497be92eb965d831b23d8095fbbc6637e705"));
const linkTelegramAccount = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  initData: string()
}).parse(d)).handler(createSsrRpc("ca08d6854b607c25e06525c403218138fa7247757a2c228ed077a64d3bff07e3"));
const createStarsInvoice = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  packId: string(),
  amountStars: number()
}).parse(d)).handler(createSsrRpc("687dd7b3cee4fe88a7de141690a0905638e455e8754ca3f86731a522e1a23dbe"));
const tabs = [
  { to: "/", label: "Home", icon: House, match: (p) => p === "/" },
  { to: "/discover", label: "Discover", icon: Compass, match: (p) => p.startsWith("/discover") },
  { to: "/analyze", label: "Analyze", icon: Plus, match: (p) => p.startsWith("/analyze") || p.startsWith("/analysis") },
  { to: "/trade-desk", label: "Trade", icon: LayoutDashboard, match: (p) => p.startsWith("/trade-desk") },
  { to: "/journal", label: "Journal", icon: BookOpen, match: (p) => p.startsWith("/journal") || p.startsWith("/profile") }
];
function AppShell({ children }) {
  const { location } = useRouterState();
  const path = location.pathname;
  const [showOnboarding, setShowOnboarding] = reactExports.useState(false);
  const [signedIn, setSignedIn] = reactExports.useState(null);
  reactExports.useEffect(() => {
    let cancel = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancel) setSignedIn(!!data.session);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return;
      setSignedIn(!!session);
    });
    return () => {
      cancel = true;
      sub.subscription.unsubscribe();
    };
  }, []);
  const linkTelegram = useServerFn(linkTelegramAccount);
  const linkTelegramRef = reactExports.useRef(linkTelegram);
  linkTelegramRef.current = linkTelegram;
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn) {
      if (!localStorage.getItem("vixor-onboarded")) setShowOnboarding(true);
      if (!localStorage.getItem("vixor-tg-linked")) {
        const initData = getTelegramInitData();
        if (initData) {
          linkTelegramRef.current({ data: { initData } }).then(() => {
            localStorage.setItem("vixor-tg-linked", "1");
          }).catch((err) => console.error("Failed to link Telegram:", err));
        }
      }
    }
  }, [signedIn]);
  if (path === "/auth" || signedIn === false) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(jsxRuntimeExports.Fragment, { children });
  }
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(Header, {}),
    /* @__PURE__ */ jsxRuntimeExports.jsx("main", { className: "flex-1 mx-auto w-full max-w-md px-4 pb-28 pt-3", children }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("nav", { className: "fixed bottom-0 inset-x-0 z-40 pb-safe pointer-events-none", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "mx-auto max-w-md px-4 pb-3 pointer-events-auto", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "glass-card rounded-2xl flex items-center justify-around h-16 px-2 shadow-[var(--shadow-elevated)] relative overflow-hidden", children: tabs.map((t) => {
      const active = t.match(path);
      const Icon = t.icon;
      const isAnalyze = t.label === "Analyze";
      return /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: t.to, className: "flex flex-col items-center justify-center gap-1 flex-1 h-full relative z-10", children: isAnalyze ? /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `size-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${active ? "gradient-primary glow-primary scale-110" : "bg-card-hover border border-border"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `size-6 ${active ? "text-primary-foreground" : "text-foreground"}`, strokeWidth: 2.5 }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `size-5 transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`, strokeWidth: active ? 2.5 : 2 }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${active ? "text-primary" : "text-muted-foreground"}`, children: t.label }),
        active && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute -bottom-1 size-1 rounded-full bg-primary" })
      ] }) }, t.to);
    }) }) }) }),
    showOnboarding && /* @__PURE__ */ jsxRuntimeExports.jsx(OnboardingModal, { onClose: () => {
      localStorage.setItem("vixor-onboarded", "1");
      setShowOnboarding(false);
    } })
  ] });
}
function Header() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("header", { className: "glass-header sticky top-0 z-40 pt-safe", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "mx-auto max-w-md px-4 h-14 flex items-center justify-between", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/", className: "flex items-center gap-2 group", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-8 rounded-xl gradient-primary flex items-center justify-center glow-primary group-hover:scale-105 transition-transform", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "size-4 text-primary-foreground", strokeWidth: 2.5 }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-bold tracking-tight text-lg", children: "Vixor" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "size-8 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition", children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-full rounded-full bg-gradient-to-tr from-primary/20 to-info/20 flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-bold text-foreground", children: "ME" }) }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(Link, { to: "/notifications", className: "size-8 rounded-full bg-card border border-border flex items-center justify-center relative hover:bg-card-hover transition", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Bell, { className: "size-4 text-muted-foreground" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "absolute top-0 right-0 size-2.5 rounded-full bg-primary border-2 border-background" })
      ] })
    ] })
  ] }) });
}
function NotFoundComponent() {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "mt-4 text-xl font-semibold text-foreground", children: "Page not found" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "The page you're looking for doesn't exist." }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/", className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground", children: "Back to dashboard" })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-xl font-semibold text-foreground", children: "Something went wrong" }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: error.message }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "button",
      {
        onClick: () => {
          router2.invalidate();
          reset();
        },
        className: "mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground",
        children: "Try again"
      }
    )
  ] }) });
}
const Route$e = createRootRouteWithContext()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#08090C" },
      { title: "Vixor — AI Chart Analysis" },
      { name: "description", content: "AI-powered chart analysis for traders. Get entry, stop loss, and take profit levels in seconds." },
      { property: "og:title", content: "Vixor — AI Chart Analysis" },
      { property: "og:description", content: "Drop any chart, get an AI trade plan with confidence score, risk, and management in seconds." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" }
    ],
    links: [{ rel: "stylesheet", href: appCss }],
    scripts: [{ src: "https://telegram.org/js/telegram-web-app.js" }]
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent
});
function RootShell({ children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("html", { lang: "en", className: "dark", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("head", { children: /* @__PURE__ */ jsxRuntimeExports.jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsxRuntimeExports.jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$e.useRouteContext();
  const router2 = useRouter();
  const routerRef = reactExports.useRef(router2);
  routerRef.current = router2;
  const queryClientRef = reactExports.useRef(queryClient);
  queryClientRef.current = queryClient;
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        tg.setHeaderColor?.("#08090C");
      } catch {
      }
    }
    let mounted = true;
    let authDebounce = null;
    import("./client-CjdFgX-H.mjs").then(({ supabase: supabase2 }) => {
      if (!mounted) return;
      const { data: sub } = supabase2.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        if (authDebounce) clearTimeout(authDebounce);
        authDebounce = setTimeout(() => {
          if (!mounted) return;
          routerRef.current.invalidate();
          if (event !== "SIGNED_OUT") queryClientRef.current.invalidateQueries();
        }, 150);
      });
      window.__vxAuthSub = sub.subscription;
    });
    return () => {
      mounted = false;
      if (authDebounce) clearTimeout(authDebounce);
    };
  }, []);
  return /* @__PURE__ */ jsxRuntimeExports.jsx(QueryClientProvider, { client: queryClient, children: /* @__PURE__ */ jsxRuntimeExports.jsx(AppShell, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(Outlet, {}) }) });
}
const $$splitComponentImporter$d = () => import("./auth-ChMSu8oB.mjs");
const Route$d = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "Sign in — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./route-BFsOu0JM.mjs");
const Route$c = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const {
      data,
      error
    } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({
      to: "/auth"
    });
    return {
      user: data.user
    };
  },
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./index-B8BPqVIl.mjs");
const Route$b = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{
      title: "Command Center — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./trade-desk-Dlxz1Svt.mjs");
const Route$a = createFileRoute("/_authenticated/trade-desk")({
  head: () => ({
    meta: [{
      title: "Trade Desk — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./settings-B94C8Lzv.mjs");
const Route$9 = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Settings — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./referral-jOrGm_Su.mjs");
const Route$8 = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [{
      title: "Referrals — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./profile-o-Jk0i39.mjs");
const Route$7 = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "Profile — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./premium-bVq0Z06x.mjs");
const Route$6 = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [{
      title: "Premium — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./notifications-Dp-uDxAa.mjs");
const Route$5 = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [{
      title: "Notifications — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./journal-B9FTKb4x.mjs");
const Route$4 = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [{
      title: "Journal — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./discover-CcjHEmWD.mjs");
const Route$3 = createFileRoute("/_authenticated/discover")({
  head: () => ({
    meta: [{
      title: "Discover — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./charts-BfEnHIyd.mjs");
const Route$2 = createFileRoute("/_authenticated/charts")({
  head: () => ({
    meta: [{
      title: "Charts — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./analyze-Cx_7zfjT.mjs");
const Route$1 = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [{
      title: "Analyze — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./analysis._id-Bwpm0Qfj.mjs");
const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [{
      title: "Vixor Signal — Analysis Result"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const AuthRoute = Route$d.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$e
});
const AuthenticatedRouteRoute = Route$c.update({
  id: "/_authenticated",
  getParentRoute: () => Route$e
});
const AuthenticatedIndexRoute = Route$b.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedTradeDeskRoute = Route$a.update({
  id: "/trade-desk",
  path: "/trade-desk",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedSettingsRoute = Route$9.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedReferralRoute = Route$8.update({
  id: "/referral",
  path: "/referral",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedProfileRoute = Route$7.update({
  id: "/profile",
  path: "/profile",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedPremiumRoute = Route$6.update({
  id: "/premium",
  path: "/premium",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedNotificationsRoute = Route$5.update({
  id: "/notifications",
  path: "/notifications",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedJournalRoute = Route$4.update({
  id: "/journal",
  path: "/journal",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedDiscoverRoute = Route$3.update({
  id: "/discover",
  path: "/discover",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedChartsRoute = Route$2.update({
  id: "/charts",
  path: "/charts",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAnalyzeRoute = Route$1.update({
  id: "/analyze",
  path: "/analyze",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedAnalysisIdRoute = Route.update({
  id: "/analysis/$id",
  path: "/analysis/$id",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedRouteRouteChildren = {
  AuthenticatedAnalyzeRoute,
  AuthenticatedChartsRoute,
  AuthenticatedDiscoverRoute,
  AuthenticatedJournalRoute,
  AuthenticatedNotificationsRoute,
  AuthenticatedPremiumRoute,
  AuthenticatedProfileRoute,
  AuthenticatedReferralRoute,
  AuthenticatedSettingsRoute,
  AuthenticatedTradeDeskRoute,
  AuthenticatedIndexRoute,
  AuthenticatedAnalysisIdRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const rootRouteChildren = {
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute
};
const routeTree = Route$e._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  getReferralStats as a,
  claimReferral as b,
  createSsrRpc as c,
  getPremiumPlans as d,
  getPointPacks as e,
  createStarsInvoice as f,
  getMe as g,
  listNotifications as h,
  isInsideTelegram as i,
  getMarketNews as j,
  createAnalysis as k,
  listAnalyses as l,
  markAllNotificationsRead as m,
  getAnalysis as n,
  openTelegramInvoice as o,
  purchasePack as p,
  router as r,
  subscribePremium as s,
  useServerFn as u
};
