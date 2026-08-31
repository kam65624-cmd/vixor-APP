import { Link } from "@tanstack/react-router";
import { memo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getUnreadNotificationCount } from "@/shared/data";

// ── Notification Bell with unread badge ──────────────────────────────────

export const NotificationBell = memo(function NotificationBell() {
  const fetchUnread = useStableServerFn(getUnreadNotificationCount);
  const { data } = useQuery({
    queryKey: ["unread-notif-count"],
    queryFn: () => fetchUnread({}),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      to="/notifications"
      className="relative flex items-center justify-center rounded-full"
      style={{
        width: "30px",
        height: "30px",
        background: "var(--color-muted)",
        textDecoration: "none",
        minWidth: "44px",
        minHeight: "44px",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--color-muted-foreground)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {unread > 0 && (
        <span
          style={{
            position: "absolute",
            top: "-3px",
            right: "-3px",
            minWidth: "14px",
            height: "14px",
            borderRadius: "7px",
            background: "var(--color-bearish)",
            color: "var(--primary-foreground)",
            fontSize: "10px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 3px",
            lineHeight: 1,
          }}
        >
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
});
