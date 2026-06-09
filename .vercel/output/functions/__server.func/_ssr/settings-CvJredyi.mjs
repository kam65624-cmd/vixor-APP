import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
import { u as useRouter, L as Link } from "../_libs/tanstack__react-router.mjs";
import { supabase } from "./client-Lj_VRnUR.mjs";
import { p as ArrowLeft, q as Palette, r as Moon, s as Sun, t as Globe, T as TrendingUp, u as Star, Z as Zap, b as Bell, V as Volume2, v as Smartphone, e as Shield, K as Key, I as Info, F as FileText, w as CircleQuestionMark, x as LogOut, d as ChevronRight } from "../_libs/lucide-react.mjs";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval.mjs";
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
function SettingsPage() {
  const router = useRouter();
  const [dark, setDark] = reactExports.useState(true);
  const [haptics, setHaptics] = reactExports.useState(true);
  const [sound, setSound] = reactExports.useState(true);
  const [priceAlerts, setPriceAlerts] = reactExports.useState(true);
  const [newsAlerts, setNewsAlerts] = reactExports.useState(false);
  const [signing, setSigning] = reactExports.useState(false);
  const handleSignOut = async () => {
    setSigning(true);
    await supabase.auth.signOut();
    router.navigate({
      to: "/auth"
    });
  };
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-5 pb-8", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between pt-2", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-bold text-lg tracking-tight", children: "Settings" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "Appearance", icon: Palette, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: dark ? Moon : Sun, label: "Dark Mode", iconColor: "text-info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { on: dark, onChange: (v) => {
        setDark(v);
        document.documentElement.classList.toggle("light", !v);
      } }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Globe, label: "Language", value: "English", iconColor: "text-primary" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "Trading Profile", icon: TrendingUp, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: TrendingUp, label: "Risk Tolerance", value: "Moderate", iconColor: "text-neutral-wait" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Star, label: "Preferred Pairs", value: "BTC, ETH, EUR/USD", iconColor: "text-primary" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Zap, label: "Trading Style", value: "Swing", iconColor: "text-bullish" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "Notifications", icon: Bell, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Volume2, label: "Sound Effects", iconColor: "text-primary", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { on: sound, onChange: setSound }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Smartphone, label: "Haptic Feedback", iconColor: "text-info", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { on: haptics, onChange: setHaptics }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Bell, label: "Price Alerts", iconColor: "text-neutral-wait", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { on: priceAlerts, onChange: setPriceAlerts }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Globe, label: "News Alerts", iconColor: "text-bullish", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Toggle, { on: newsAlerts, onChange: setNewsAlerts }) })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "Security", icon: Shield, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Shield, label: "Two-Factor Auth", value: "Off", iconColor: "text-bearish" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Key, label: "Active Sessions", value: "1 device", iconColor: "text-neutral-wait" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(Section, { title: "About", icon: Info, children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: FileText, label: "Terms of Service", iconColor: "text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Shield, label: "Privacy Policy", iconColor: "text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: CircleQuestionMark, label: "Help & Support", iconColor: "text-info" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(Row, { icon: Info, label: "Version", value: "2.0.0 · build 42", iconColor: "text-muted-foreground", noArrow: true })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: handleSignOut, disabled: signing, className: "w-full h-13 rounded-2xl bg-bearish/10 border border-bearish/20 text-bearish font-bold flex items-center justify-center gap-2 hover:bg-bearish hover:text-white transition-all duration-200 disabled:opacity-50", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(LogOut, { className: "size-4" }),
      signing ? "Signing out…" : "Sign Out"
    ] })
  ] });
}
function Section({
  title,
  icon: Icon,
  children
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-1.5 mb-2 px-1", children: [
      Icon && /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-3 text-muted-foreground" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[11px] uppercase tracking-widest font-bold text-muted-foreground", children: title })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card divide-y divide-border overflow-hidden", children })
  ] });
}
function Row({
  icon: Icon,
  label,
  value,
  children,
  iconColor = "text-muted-foreground",
  noArrow
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "p-3.5 flex items-center gap-3 hover:bg-card-hover transition-colors cursor-pointer group", children: [
    Icon && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-9 rounded-xl bg-muted flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: `size-4 ${iconColor}` }) }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-sm font-medium flex-1", children: label }),
    value && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-medium", children: value }),
    children,
    !children && value === void 0 && !noArrow && /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronRight, { className: "size-4 text-muted-foreground group-hover:text-foreground transition-colors" })
  ] });
}
function Toggle({
  on,
  onChange
}) {
  return /* @__PURE__ */ jsxRuntimeExports.jsx("button", { onClick: () => onChange?.(!on), className: `w-11 h-6 rounded-full transition-all duration-300 shrink-0 relative ${on ? "bg-primary" : "bg-muted"}`, children: /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: `absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-all duration-300 ${on ? "left-[22px]" : "left-0.5"}` }) });
}
export {
  SettingsPage as component
};
