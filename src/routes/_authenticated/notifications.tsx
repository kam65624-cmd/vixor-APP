import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, memo } from "react";
import { getNotifications, markNotificationRead } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Vixor" }] }),
  component: NotificationsPage,
});

const typeConfig: Record<string, { icon: string; color: string }> = {
  trade: { icon: "💰", color: "#3B82F6" },
  alert: { icon: "🔔", color: "#F59E0B" },
  whale: { icon: "🐋", color: "#8B5CF6" },
  signal: { icon: "⚡", color: "#22C55E" },
  system: { icon: "⚙️", color: "#7B8BA8" },
  default: { icon: "📌", color: "#7B8BA8" },
};

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

const NotifItem = memo(function NotifItem({
  notif,
  onRead,
}: {
  notif: { id: string; title: string; body: string | null; type: string; created_at: string; read_at: string | null };
  onRead: (id: string) => void;
}) {
  const isRead = notif.read_at !== null;
  const cfg = typeConfig[notif.type] || typeConfig.default;

  return (
    <div
      style={{
        display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 10px", borderRadius: 6,
        borderLeft: isRead ? "none" : "3px solid #3B82F6",
        background: isRead ? "transparent" : "rgba(59,130,246,0.03)",
        borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
        transition: "background 0.1s",
      }}
      onClick={() => !isRead && onRead(notif.id)}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = isRead ? "transparent" : "rgba(59,130,246,0.03)"; }}
    >
      <div
        style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: `${cfg.color}15`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 14,
        }}
      >
        {cfg.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 11, fontWeight: isRead ? 500 : 700, color: "#F0F4FC" }}>{notif.title}</span>
          <span style={{ fontSize: 9, color: "#4A5568", flexShrink: 0 }}>{timeAgo(notif.created_at)}</span>
        </div>
        <p style={{ fontSize: 10, color: "#7B8BA8", marginTop: 2, lineHeight: 1.4 }}>
          {notif.body || "No details"}
        </p>
      </div>
    </div>
  );
});

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

  const filtered = filter === "Unread"
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

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>🔔</span>
          <span style={{ fontSize: 16, fontWeight: 800 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ fontSize: 9, padding: "2px 7px", borderRadius: 10, background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontWeight: 700 }}>
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            disabled={markReadMutation.isPending}
            style={{ fontSize: 10, padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#7B8BA8", cursor: "pointer", fontWeight: 600 }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {["All", "Unread", "trade", "alert", "whale", "signal"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              fontSize: 10, fontWeight: 600, padding: "4px 10px", borderRadius: 4, border: "none", cursor: "pointer", whiteSpace: "nowrap",
              color: filter === f ? "#fff" : "#7B8BA8",
              background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
              borderBottom: filter === f ? "2px solid #3B82F6" : "2px solid transparent",
            }}
          >
            {f === "trade" ? "Trades" : f === "alert" ? "Alerts" : f === "whale" ? "Whale" : f === "signal" ? "Signals" : f}
          </button>
        ))}
      </div>

      {/* List */}
      {notifsQuery.isLoading ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <div style={{ width: 32, height: 32, border: "2px solid rgba(255,255,255,0.1)", borderTopColor: "#3B82F6", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        </div>
      ) : filtered.length > 0 ? (
        <div style={{ padding: "4px 8px" }}>
          {filtered.map((n) => (
            <NotifItem key={n.id} notif={n} onRead={handleRead} />
          ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", gap: 12 }}>
          <span style={{ fontSize: 32, opacity: 0.5 }}>🔔</span>
          <p style={{ fontSize: 13, color: "#7B8BA8" }}>
            {notifications.length === 0 ? "No notifications yet" : "No notifications match this filter"}
          </p>
        </div>
      )}
    </div>
  );
}