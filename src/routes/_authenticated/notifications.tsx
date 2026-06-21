import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, Gift, Users, Sparkles, Check } from "lucide-react";
import { listNotifications, markAllNotificationsRead } from "@/domains/user/functions";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";

const iconMap: Record<string, typeof TrendingUp> = { TrendingUp, Gift, Users, Sparkles };

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Vixor" }] }),
  component: NotificationsPage,
});

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};

function NotificationsPage() {
  const qc = useQueryClient();
  const { t } = useI18n();
  // Use stable server function references to prevent infinite re-render loop (React error #310)
  const fetch = useStableServerFn(listNotifications);
  const markAll = useStableServerFn(markAllNotificationsRead);

  const q = useQuery(
    useMemo(() => ({ queryKey: ["notifs"] as const, queryFn: () => fetch({}) }), [fetch]),
  );
  const m = useMutation({
    mutationFn: () => markAll({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });

  return (
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="size-9 rounded-xl flex items-center justify-center"
          style={card}
        >
          <ArrowLeft className="size-4" style={{ color: "#7B8BA8" }} />
        </Link>
        <h1 className="font-semibold" style={{ color: "#F0F4FC" }}>
          {t("notifications.title")}
        </h1>
        <button
          onClick={() => m.mutate()}
          className="text-xs font-semibold flex items-center gap-1"
          style={{ color: "#3B82F6" }}
        >
          <Check className="size-3" />
          {t("notifications.markAll")}
        </button>
      </div>

      {q.isLoading && (
        <div
          className="p-6 text-center text-xs"
          style={{ ...card, marginTop: "16px", color: "#7B8BA8" }}
        >
          {t("notifications.loading")}
        </div>
      )}
      {!q.isLoading && (q.data?.length ?? 0) === 0 && (
        <div className="p-10 text-center text-sm" style={{ ...card, marginTop: "16px" }}>
          <div className="font-semibold" style={{ color: "#F0F4FC" }}>
            {t("notifications.noNotifications")}
          </div>
          <div className="text-xs mt-1" style={{ color: "#7B8BA8" }}>
            {t("notifications.allCaughtUp")}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2" style={{ marginTop: "16px" }}>
        {q.data?.map((n) => {
          const Icon = iconMap[n.type] ?? Sparkles;
          const unread = !n.read_at;
          return (
            <div
              key={n.id}
              className="p-3 flex items-start gap-3"
              style={{
                ...card,
                borderLeft: unread ? "2px solid #3B82F6" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                className="size-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "rgba(59,130,246,0.15)" }}
              >
                <Icon className="size-4" style={{ color: "#3B82F6" }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm" style={{ color: "#F0F4FC" }}>
                    {n.title}
                  </div>
                  <span className="text-[10px] shrink-0" style={{ color: "#7B8BA8" }}>
                    {relTime(n.created_at)}
                  </span>
                </div>
                {n.body && (
                  <div className="text-xs mt-0.5" style={{ color: "#7B8BA8" }}>
                    {n.body}
                  </div>
                )}
              </div>
              {unread && (
                <div
                  className="size-2 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#3B82F6" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function relTime(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}
