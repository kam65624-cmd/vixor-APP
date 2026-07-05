import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, memo } from "react";
import { getNotifications, markNotificationRead } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  DataRow,
  Badge,
  EmptyState,
  SkeletonRow,
  ScrollArea,
  SectionTitle,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Vixor" }] }),
  component: NotificationsPage,
});

// ── Type config using THEME semantic colors ──────────────────────────────

const typeConfig: Record<string, { icon: string; color: string; label: string }> = {
  trade: { icon: "💰", color: "var(--color-bullish)", label: "TRADE" },
  alert: { icon: "🔔", color: "var(--color-neutral-wait)", label: "ALERT" },
  whale: { icon: "🐋", color: "var(--color-info)", label: "WHALE" },
  signal: { icon: "⚡", color: "var(--color-bullish)", label: "SIGNAL" },
  system: { icon: "⚙️", color: "var(--color-muted-foreground)", label: "SYSTEM" },
  default: { icon: "📌", color: "var(--color-muted-foreground)", label: "" },
};

// ── Tab definitions (display label → internal filter value) ──────────────

const TAB_ITEMS = [
  { filter: "All", label: "All" },
  { filter: "Unread", label: "Unread" },
  { filter: "trade", label: "Trades" },
  { filter: "alert", label: "Alerts" },
  { filter: "whale", label: "Whale" },
  { filter: "signal", label: "Signals" },
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const ms = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Notification item using DataRow + Badge ───────────────────────────────

const NotifItem = memo(function NotifItem({
  notif,
  onRead,
}: {
  notif: {
    id: string;
    title: string;
    body: string | null;
    type: string;
    created_at: string;
    read_at: string | null;
  };
  onRead: (id: string) => void;
}) {
  const isRead = notif.read_at !== null;
  const cfg = typeConfig[notif.type] || typeConfig.default;

  return (
    <DataRow
      onClick={() => !isRead && onRead(notif.id)}
      leftAccent={isRead ? undefined : "var(--color-bullish)"}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        {/* Type icon */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            flexShrink: 0,
            background: `${cfg.color}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
          }}
        >
          {cfg.icon}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: isRead ? 500 : 700,
                  color: "var(--color-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {notif.title}
              </span>
              {cfg.label && <Badge label={cfg.label} color={cfg.color} small />}
            </div>
            <span style={{ fontSize: 9, color: "var(--color-muted-foreground)", flexShrink: 0 }}>
              {timeAgo(notif.created_at)}
            </span>
          </div>
          <p
            style={{
              fontSize: 10,
              color: "var(--color-muted-foreground)",
              marginTop: 2,
              lineHeight: 1.4,
            }}
          >
            {notif.body || "No details"}
          </p>
        </div>
      </div>
    </DataRow>
  );
});

// ── Page component ────────────────────────────────────────────────────────

function NotificationsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("All");

  const fetchNotifs = useStableServerFn(getNotifications);
  const notifsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifs({}),
    staleTime: 15_000,
  });

  const markReadMutation = useMutation({
    mutationFn: useStableServerFn(markNotificationRead),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = notifsQuery.data?.notifications ?? [];
  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const filtered =
    filter === "Unread"
      ? notifications.filter((n) => !n.read_at)
      : filter === "All"
        ? notifications
        : notifications.filter((n) => n.type === filter);

  const handleMarkAllRead = () => {
    const unread = notifications.filter((n) => !n.read_at);
    for (const n of unread) {
      markReadMutation.mutate({ data: { id: n.id } });
    }
  };

  const handleRead = (id: string) => {
    markReadMutation.mutate({ data: { id } });
  };

  // ── Tab plumbing ──
  const tabLabels = TAB_ITEMS.map((t) => t.label);
  const activeTabLabel = TAB_ITEMS.find((t) => t.filter === filter)?.label ?? "All";

  const tabCounts: Record<string, number> = {
    All: notifications.length,
    Unread: unreadCount,
    Trades: notifications.filter((n) => n.type === "trade").length,
    Alerts: notifications.filter((n) => n.type === "alert").length,
    Whale: notifications.filter((n) => n.type === "whale").length,
    Signals: notifications.filter((n) => n.type === "signal").length,
  };

  const handleTabChange = (tab: string) => {
    const item = TAB_ITEMS.find((t) => t.label === tab);
    if (item) setFilter(item.filter);
  };

  // ── Render ──
  return (
    <PageLayout
      title="Notifications"
      badge={unreadCount > 0 ? `${unreadCount} new` : undefined}
      badgeColor={"var(--color-primary)"}
      tabs={tabLabels}
      activeTab={activeTabLabel}
      onTabChange={handleTabChange}
      tabCounts={tabCounts}
      loading={notifsQuery.isLoading}
    >
      {filtered.length > 0 ? (
        <>
          {unreadCount > 0 && (
            <SectionTitle
              title="All Notifications"
              count={filtered.length}
              action={
                markReadMutation.isPending
                  ? undefined
                  : { label: "Mark all read", onClick: handleMarkAllRead }
              }
            />
          )}
          <ScrollArea>
            {filtered.map((n) => (
              <NotifItem key={n.id} notif={n} onRead={handleRead} />
            ))}
          </ScrollArea>
        </>
      ) : (
        <EmptyState
          icon="🔔"
          title="No notifications"
          message={
            notifications.length === 0
              ? "No notifications yet"
              : "No notifications match this filter"
          }
        />
      )}
    </PageLayout>
  );
}
