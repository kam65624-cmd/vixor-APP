import { j as jsxRuntimeExports } from "../_libs/react.mjs";
import { L as Link } from "../_libs/tanstack__react-router.mjs";
import { u as useStableServerFn, t as listNotifications, v as markAllNotificationsRead } from "./router-CVPLbV6q.mjs";
import { a as useQueryClient, u as useQuery, b as useMutation } from "../_libs/tanstack__react-query.mjs";
import "../_libs/seroval.mjs";
import { p as ArrowLeft, X as Check, S as Sparkles, y as Users, G as Gift, T as TrendingUp } from "../_libs/lucide-react.mjs";
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
import "./server-DadpqRNH.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "./auth-middleware-BsyW0aBd.mjs";
import "../_libs/zod.mjs";
const iconMap = {
  TrendingUp,
  Gift,
  Users,
  Sparkles
};
function NotificationsPage() {
  const qc = useQueryClient();
  const fetch = useStableServerFn(listNotifications);
  const markAll = useStableServerFn(markAllNotificationsRead);
  const q = useQuery({
    queryKey: ["notifs"],
    queryFn: () => fetch({})
  });
  const m = useMutation({
    mutationFn: () => markAll({}),
    onSuccess: () => qc.invalidateQueries({
      queryKey: ["notifs"]
    })
  });
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(Link, { to: "/profile", className: "size-9 rounded-xl bg-card border border-border flex items-center justify-center", children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowLeft, { className: "size-4" }) }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("h1", { className: "font-semibold", children: "Notifications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("button", { onClick: () => m.mutate(), className: "text-xs text-primary font-semibold flex items-center gap-1", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "size-3" }),
        "Mark all"
      ] })
    ] }),
    q.isLoading && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "vixor-card p-6 text-center text-xs text-muted-foreground", children: "Loading…" }),
    !q.isLoading && (q.data?.length ?? 0) === 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "vixor-card p-10 text-center text-sm", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold", children: "No notifications" }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-1", children: "You're all caught up" })
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "space-y-2", children: q.data?.map((n) => {
      const Icon = iconMap[n.type] ?? Sparkles;
      const unread = !n.read_at;
      return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: `vixor-card p-3 flex items-start gap-3 ${unread ? "border-l-2 border-l-primary" : ""}`, children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0", children: /* @__PURE__ */ jsxRuntimeExports.jsx(Icon, { className: "size-4 text-primary" }) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between gap-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "font-semibold text-sm", children: n.title }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] text-muted-foreground shrink-0", children: relTime(n.created_at) })
          ] }),
          n.body && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-xs text-muted-foreground mt-0.5", children: n.body })
        ] }),
        unread && /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "size-2 rounded-full bg-primary mt-1.5 shrink-0" })
      ] }, n.id);
    }) })
  ] });
}
function relTime(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1e3;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
export {
  NotificationsPage as component
};
