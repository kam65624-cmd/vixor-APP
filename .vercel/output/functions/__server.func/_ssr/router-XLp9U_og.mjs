import { b as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { Q as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { c as createRouter, a as createRootRouteWithContext, u as useRouter, L as Link, O as Outlet, H as HeadContent, S as Scripts, b as createFileRoute, l as lazyRouteComponent, d as useRouterState } from "../_libs/tanstack__react-router.mjs";
import { S as redirect, m as isRedirect } from "../_libs/tanstack__router-core.mjs";
import { j as jsxRuntimeExports, r as reactExports } from "../_libs/react.mjs";
import { supabase } from "./client-Lj_VRnUR.mjs";
import { c as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-DC2fSMDH.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-BatwxpoE.mjs";
import { H as House, C as Compass, P as Plus, a as ChartColumn, B as BookOpen, b as Bell, S as Sparkles, U as Upload, c as Calculator, G as Gift, d as ChevronRight } from "../_libs/lucide-react.mjs";
import { o as object, c as string, n as number, _ as _enum, b as array } from "../_libs/zod.mjs";
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
const appCss = "/assets/styles--6KDvTS5.css";
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
const createAlert = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  symbol: string().min(1),
  pair: string().min(1),
  condition: _enum(["above", "below", "crosses_up", "crosses_down"]),
  targetPrice: number().positive(),
  currentPrice: number().optional(),
  note: string().max(200).optional(),
  timeframe: string().default("1H")
}).parse(d)).handler(createSsrRpc("0a11415a236345a5ebe5a69699f9c9871943e5a282f1e85c6a98f65ce0f0c736"));
const listAlerts = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  pair: string().optional(),
  status: _enum(["active", "triggered", "cancelled"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("7cc883cd1ace66d82706afa98163780d2075e5c33882d7bb07dd029033521b27"));
const deleteAlert = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  alertId: string().uuid()
}).parse(d)).handler(createSsrRpc("ab6bfd9651332911522df5fdd49d9790fa31369afa15d1650285119f067ab89a"));
createServerFn({
  method: "POST"
}).handler(createSsrRpc("0361c258dc05de5eb14c6361a1e3bd8610f3397945d9c38679b4636fd2233e33"));
const getMarketPrices = createServerFn({
  method: "GET"
}).handler(createSsrRpc("fa093454c95b97a95dceb951789cba547f84c71829184a52caf95484955cc4a0"));
const generateDailySignals = createServerFn({
  method: "POST"
}).handler(createSsrRpc("2978d5e40c17c47813ab54d63fe4eb0f3b3a512484bd02b357edbab52c160946"));
const getDailySignals = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  pair: string().optional(),
  timeframe: string().optional(),
  recommendation: _enum(["BUY", "SELL", "WAIT"]).optional()
}).parse(d ?? {})).handler(createSsrRpc("2250cae46d85fa6f8e51a4428b1f24ffd8281369cee51f60b8e3300317443853"));
const getUserStrategy = createServerFn({
  method: "GET"
}).middleware([requireSupabaseAuth]).handler(createSsrRpc("0222c4a5f76333bcef66ddb14d20976005903d41a3839f13743d3c855f3e7abc"));
const updateUserStrategy = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).validator((d) => object({
  name: string().min(1).max(50).optional(),
  pairs: array(string()).optional(),
  tradingStyle: _enum(["Scalping", "Day Trading", "Swing Trading"]).optional(),
  riskTolerance: _enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  preferredTimeframes: array(string()).optional()
}).parse(d)).handler(createSsrRpc("6087d62e084d263168dfde2c2e7ff1473a610920324376ab44b08717c96ac529"));
function useStableServerFn(fn) {
  const serverFn = useServerFn(fn);
  const ref = reactExports.useRef(serverFn);
  ref.current = serverFn;
  const stableFn = reactExports.useCallback(
    ((...args) => ref.current(...args)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  return stableFn;
}
const tabs = [
  { to: "/", label: "Home", icon: House, match: (p) => p === "/" },
  { to: "/discover", label: "Discover", icon: Compass, match: (p) => p.startsWith("/discover") },
  { to: "/analyze", label: "Analyze", icon: Plus, match: (p) => p.startsWith("/analyze") || p.startsWith("/analysis") },
  { to: "/charts", label: "Charts", icon: ChartColumn, match: (p) => p.startsWith("/charts") || p.startsWith("/signals") || p.startsWith("/trade-desk") },
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
  const linkTelegram = useStableServerFn(linkTelegramAccount);
  reactExports.useEffect(() => {
    if (typeof window === "undefined") return;
    if (signedIn) {
      if (!localStorage.getItem("vixor-onboarded")) setShowOnboarding(true);
      if (!localStorage.getItem("vixor-tg-linked")) {
        const initData = getTelegramInitData();
        if (initData) {
          linkTelegram({ data: { initData } }).then(() => {
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
const Route$f = createRootRouteWithContext()({
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
  const { queryClient } = Route$f.useRouteContext();
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
    import("./client-Lj_VRnUR.mjs").then(({ supabase: supabase2 }) => {
      if (!mounted) return;
      const { data: sub } = supabase2.auth.onAuthStateChange((event) => {
        if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
        if (authDebounce) clearTimeout(authDebounce);
        authDebounce = setTimeout(() => {
          if (!mounted) return;
          routerRef.current.invalidate();
          if (event === "SIGNED_OUT") {
            queryClientRef.current.removeQueries({ queryKey: ["me"] });
            queryClientRef.current.removeQueries({ queryKey: ["analyses"] });
            queryClientRef.current.removeQueries({ queryKey: ["alerts"] });
            queryClientRef.current.removeQueries({ queryKey: ["alerts-dashboard"] });
            queryClientRef.current.removeQueries({ queryKey: ["daily-signals"] });
            queryClientRef.current.removeQueries({ queryKey: ["user-strategy"] });
            queryClientRef.current.removeQueries({ queryKey: ["notifs"] });
          } else {
            queryClientRef.current.invalidateQueries({ queryKey: ["me"] });
          }
        }, 500);
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
const $$splitComponentImporter$e = () => import("./auth-CUQCQDZG.mjs");
const Route$e = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [{
      title: "Sign in — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$e, "component")
});
const $$splitComponentImporter$d = () => import("./route-BFsOu0JM.mjs");
const Route$d = createFileRoute("/_authenticated")({
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
  component: lazyRouteComponent($$splitComponentImporter$d, "component")
});
const $$splitComponentImporter$c = () => import("./index-BugrEpfm.mjs");
const Route$c = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [{
      title: "Command Center — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$c, "component")
});
const $$splitComponentImporter$b = () => import("./trade-desk-Dlxz1Svt.mjs");
const Route$b = createFileRoute("/_authenticated/trade-desk")({
  head: () => ({
    meta: [{
      title: "Trade Desk — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$b, "component")
});
const $$splitComponentImporter$a = () => import("./signals-CIpDvVlr.mjs");
const Route$a = createFileRoute("/_authenticated/signals")({
  head: () => ({
    meta: [{
      title: "Daily Signals — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$a, "component")
});
const $$splitComponentImporter$9 = () => import("./settings-CvJredyi.mjs");
const Route$9 = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [{
      title: "Settings — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./referral-6fpPvByX.mjs");
const Route$8 = createFileRoute("/_authenticated/referral")({
  head: () => ({
    meta: [{
      title: "Referrals — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./profile-DtA2cq4Q.mjs");
const Route$7 = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [{
      title: "Profile — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./premium-B-gcj_0J.mjs");
const Route$6 = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [{
      title: "Premium — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./notifications-C0Mm-1XP.mjs");
const Route$5 = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [{
      title: "Notifications — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./journal-COQ-xyQx.mjs");
const Route$4 = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [{
      title: "Journal — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./discover-CFo4hfd2.mjs");
const Route$3 = createFileRoute("/_authenticated/discover")({
  head: () => ({
    meta: [{
      title: "Discover — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./charts-D38mdVA5.mjs");
const Route$2 = createFileRoute("/_authenticated/charts")({
  head: () => ({
    meta: [{
      title: "Charts — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component"),
  validateSearch: (search) => ({
    symbol: search.symbol || "BINANCE:BTCUSDT"
  })
});
const $$splitComponentImporter$1 = () => import("./analyze-CE8DEWs-.mjs");
const Route$1 = createFileRoute("/_authenticated/analyze")({
  head: () => ({
    meta: [{
      title: "Analyze — Vixor"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./analysis._id-B7e4aTiQ.mjs");
const Route = createFileRoute("/_authenticated/analysis/$id")({
  head: () => ({
    meta: [{
      title: "Vixor Signal — Analysis Result"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const AuthRoute = Route$e.update({
  id: "/auth",
  path: "/auth",
  getParentRoute: () => Route$f
});
const AuthenticatedRouteRoute = Route$d.update({
  id: "/_authenticated",
  getParentRoute: () => Route$f
});
const AuthenticatedIndexRoute = Route$c.update({
  id: "/",
  path: "/",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedTradeDeskRoute = Route$b.update({
  id: "/trade-desk",
  path: "/trade-desk",
  getParentRoute: () => AuthenticatedRouteRoute
});
const AuthenticatedSignalsRoute = Route$a.update({
  id: "/signals",
  path: "/signals",
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
  AuthenticatedSignalsRoute,
  AuthenticatedTradeDeskRoute,
  AuthenticatedIndexRoute,
  AuthenticatedAnalysisIdRoute
};
const AuthenticatedRouteRouteWithChildren = AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren);
const rootRouteChildren = {
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AuthRoute
};
const routeTree = Route$f._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 3e4,
        retry: 1
      }
    }
  });
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 3e4
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  getAnalysis as A,
  router as B,
  useStableServerFn as a,
  getMarketPrices as b,
  createSsrRpc as c,
  getDailySignals as d,
  listAlerts as e,
  getUserStrategy as f,
  getMe as g,
  generateDailySignals as h,
  createAlert as i,
  updateUserStrategy as j,
  getReferralStats as k,
  listAnalyses as l,
  claimReferral as m,
  getPremiumPlans as n,
  getPointPacks as o,
  purchasePack as p,
  createStarsInvoice as q,
  isInsideTelegram as r,
  subscribePremium as s,
  openTelegramInvoice as t,
  useServerFn as u,
  listNotifications as v,
  markAllNotificationsRead as w,
  getMarketNews as x,
  deleteAlert as y,
  createAnalysis as z
};
