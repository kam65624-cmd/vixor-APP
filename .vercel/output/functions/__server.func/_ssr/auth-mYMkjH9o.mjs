import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { e as useNavigate, u as useRouter } from "../_libs/tanstack__react-router.mjs";
import { supabase } from "./client-Lj_VRnUR.mjs";
import { u as useStableServerFn, c as createSsrRpc } from "./router-CBhlu--X.mjs";
import { c as createServerFn } from "./server-Be9kCMDs.mjs";
import "../_libs/seroval.mjs";
import { a as ChartColumn, S as Sparkles, T as TrendingUp, e as Shield, Z as Zap, E as EyeOff, f as Eye, L as LoaderCircle } from "../_libs/lucide-react.mjs";
import { o as object, c as string } from "../_libs/zod.mjs";
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
import "../_libs/supabase__supabase-js.mjs";
import "../_libs/supabase__postgrest-js.mjs";
import "../_libs/supabase__realtime-js.mjs";
import "../_libs/supabase__phoenix.mjs";
import "../_libs/supabase__storage-js.mjs";
import "../_libs/iceberg-js.mjs";
import "../_libs/supabase__auth-js.mjs";
import "tslib";
import "../_libs/supabase__functions-js.mjs";
import "../_libs/tanstack__query-core.mjs";
import "../_libs/tanstack__react-query.mjs";
import "./auth-middleware-C1LBbw-O.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
const telegramSignIn = createServerFn({
  method: "POST"
}).inputValidator((d) => object({
  initData: string().min(1).max(8192)
}).parse(d)).handler(createSsrRpc("ca6700ae705ae6d4b0bf535d3cab0fa958f3d3d0bf825a8d98e6207a62fb4644"));
const features = [{
  icon: ChartColumn,
  label: "AI Chart Analysis",
  desc: "Instant pattern recognition"
}, {
  icon: TrendingUp,
  label: "Trade Setups",
  desc: "Entry, SL & TP levels"
}, {
  icon: Shield,
  label: "Risk Management",
  desc: "Protect your capital"
}, {
  icon: Zap,
  label: "200 Free Points",
  desc: "Start analyzing today"
}];
function AuthPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = reactExports.useState("signin");
  const [email, setEmail] = reactExports.useState("");
  const [password, setPassword] = reactExports.useState("");
  const [showPass, setShowPass] = reactExports.useState(false);
  const [busy, setBusy] = reactExports.useState(false);
  const [err, setErr] = reactExports.useState(null);
  const [success, setSuccess] = reactExports.useState(null);
  const tgSignIn = useStableServerFn(telegramSignIn);
  const navigateRef = reactExports.useRef(navigate);
  navigateRef.current = navigate;
  const routerRef = reactExports.useRef(router);
  routerRef.current = router;
  reactExports.useEffect(() => {
    let active = true;
    const waitForTelegram = () => new Promise((resolve) => {
      const tg = window.Telegram?.WebApp;
      if (tg) {
        resolve(tg);
        return;
      }
      let attempts = 0;
      const iv = setInterval(() => {
        const t = window.Telegram?.WebApp;
        if (t || attempts++ > 30) {
          clearInterval(iv);
          resolve(t ?? null);
        }
      }, 100);
    });
    (async () => {
      const {
        data
      } = await supabase.auth.getUser();
      if (data.user && active) {
        navigateRef.current({
          to: "/"
        });
        return;
      }
      const tg = await waitForTelegram();
      const initData = tg?.initData;
      if (initData && initData.length > 10) {
        if (active) setBusy(true);
        try {
          const {
            email: email2,
            password: password2
          } = await tgSignIn({
            data: {
              initData
            }
          });
          const {
            error
          } = await supabase.auth.signInWithPassword({
            email: email2,
            password: password2
          });
          if (error) throw error;
          routerRef.current.invalidate();
          navigateRef.current({
            to: "/"
          });
        } catch (e) {
          if (active) setErr(e instanceof Error ? e.message : "Telegram sign-in failed");
        } finally {
          if (active) setBusy(false);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setSuccess(null);
    try {
      if (mode === "signin") {
        const {
          error
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setErr("Email not confirmed. Please check your inbox or use a different email.");
          } else if (error.message.includes("Invalid login")) {
            setErr("Wrong email or password. Please try again.");
          } else {
            throw error;
          }
          return;
        }
        router.invalidate();
        navigate({
          to: "/"
        });
      } else {
        const {
          error
        } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              display_name: email.split("@")[0]
            }
          }
        });
        if (error) throw error;
        const {
          error: signInErr
        } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInErr) {
          setSuccess("Account created! Check your email to confirm, then sign in.");
          setMode("signin");
        } else {
          router.invalidate();
          navigate({
            to: "/"
          });
        }
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Auth failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "min-h-screen bg-background text-foreground flex flex-col", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "fixed inset-0 pointer-events-none overflow-hidden", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary/10 blur-3xl" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-info/8 blur-3xl" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "relative flex-1 flex flex-col items-center justify-center px-6 py-12", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "w-full max-w-sm space-y-7", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-4", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative inline-flex", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-16 rounded-2xl gradient-primary glow-primary flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ChartColumn, { className: "size-8 text-primary-foreground", strokeWidth: 2.5 }) }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute -top-1 -right-1 size-5 rounded-full bg-bullish flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-2.5 text-primary-foreground" }) })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "text-3xl font-bold tracking-tight", children: "Vixor AI" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground mt-1", children: mode === "signin" ? "Welcome back, trader 👋" : "Start your trading journey" })
        ] })
      ] }),
      mode === "signup" && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-2 gap-2", children: features.map(({
        icon: Icon,
        label,
        desc
      }) => /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-3 flex items-start gap-2", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-7 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 mt-0.5", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3.5 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs font-semibold", children: label }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] text-muted-foreground", children: desc })
        ] })
      ] }, label)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex gap-1 p-1 bg-card border border-border rounded-2xl", children: ["signin", "signup"].map((m) => /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => {
        setMode(m);
        setErr(null);
        setSuccess(null);
      }, className: `flex-1 h-9 rounded-xl text-sm font-semibold transition-all duration-200 ${mode === m ? "gradient-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`, children: m === "signin" ? "Sign in" : "Create account" }, m)) }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Email" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: "email", required: true, autoComplete: "email", placeholder: "you@example.com", value: email, onChange: (e) => setEmail(e.target.value), className: "w-full h-12 px-4 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-1", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("label", { className: "text-xs font-medium text-muted-foreground uppercase tracking-wide", children: "Password" }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("input", { type: showPass ? "text" : "password", required: true, minLength: 8, autoComplete: mode === "signin" ? "current-password" : "new-password", placeholder: "Min 8 characters", value: password, onChange: (e) => setPassword(e.target.value), className: "w-full h-12 pl-4 pr-12 rounded-xl bg-card border border-border outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "button", onClick: () => setShowPass((v) => !v), className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition", children: showPass ? /* @__PURE__ */ jsxRuntimeExports.jsx(EyeOff, { className: "size-4" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Eye, { className: "size-4" }) })
          ] })
        ] }),
        err && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 rounded-xl bg-bearish/10 border border-bearish/20 text-xs text-bearish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5", children: "⚠️" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: err })
        ] }),
        success && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-start gap-2 p-3 rounded-xl bg-bullish/10 border border-bullish/20 text-xs text-bullish", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "mt-0.5", children: "✅" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: success })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("button", { type: "submit", disabled: busy, className: "w-full h-12 rounded-xl gradient-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 glow-primary disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]", children: busy ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(LoaderCircle, { className: "size-4 animate-spin" }),
          " Processing…"
        ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Sparkles, { className: "size-4" }),
          " ",
          mode === "signin" ? "Sign in" : "Create account"
        ] }) })
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("p", { className: "text-[10px] text-center text-muted-foreground leading-relaxed", children: [
        "By continuing you agree to our Terms of Service.",
        /* @__PURE__ */ jsxRuntimeExports.jsx("br", {}),
        "Already in Telegram? Vixor signs you in automatically."
      ] })
    ] }) })
  ] });
}
export {
  AuthPage as component
};
