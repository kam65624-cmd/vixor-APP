import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, TrendingUp, Gift, Users, Sparkles, Check } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications, markAllNotificationsRead } from "@/lib/vixor.functions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

const iconMap: Record<string, typeof TrendingUp> = { TrendingUp, Gift, Users, Sparkles };

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Vixor" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const qc = useQueryClient();
  const fetch = useServerFn(listNotifications);
  const markAll = useServerFn(markAllNotificationsRead);
  const q = useQuery({ queryKey: ["notifs"], queryFn: () => fetch({}) });
  const m = useMutation({
    mutationFn: () => markAll({}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Link
          to="/profile"
          className="size-9 rounded-xl bg-card border border-border flex items-center justify-center"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="font-semibold">Notifications</h1>
        <button
          onClick={() => m.mutate()}
          className="text-xs text-primary font-semibold flex items-center gap-1"
        >
          <Check className="size-3" />
          Mark all
        </button>
      </div>

      {q.isLoading && (
        <div className="vixor-card p-6 text-center text-xs text-muted-foreground">Loading…</div>
      )}
      {!q.isLoading && (q.data?.length ?? 0) === 0 && (
        <div className="vixor-card p-10 text-center text-sm">
          <div className="font-semibold">No notifications</div>
          <div className="text-xs text-muted-foreground mt-1">You're all caught up</div>
        </div>
      )}

      <div className="space-y-2">
        {q.data?.map((n) => {
          const Icon = iconMap[n.type] ?? Sparkles;
          const unread = !n.read_at;
          return (
            <div
              key={n.id}
              className={`vixor-card p-3 flex items-start gap-3 ${unread ? "border-l-2 border-l-primary" : ""}`}
            >
              <div className="size-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Icon className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold text-sm">{n.title}</div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {relTime(n.created_at)}
                  </span>
                </div>
                {n.body && <div className="text-xs text-muted-foreground mt-0.5">{n.body}</div>}
              </div>
              {unread && <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />}
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
