import { createFileRoute } from "@tanstack/react-router";
import { useState, memo } from "react";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications — Vixor" }] }),
  component: NotificationsPage,
});

interface Notification {
  id: string;
  type: "trade" | "alert" | "whale" | "signal" | "system";
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const NOTIFS: Notification[] = [
  { id: "1", type: "trade", title: "Trade Executed", desc: "Bought 2,500 WIF at $2.10 on Raydium — Order filled", time: "5m ago", read: false },
  { id: "2", type: "whale", title: "Whale Alert: WIF", desc: "7xKXtg2...3nPB transferred 500K WIF ($1.2M) to new wallet", time: "12m ago", read: false },
  { id: "3", type: "signal", title: "AI Signal: WIF Breakout", desc: "WIF breaking above $2.50 resistance — confidence 87%", time: "15m ago", read: false },
  { id: "4", type: "alert", title: "Price Alert: POPCAT", desc: "POPCAT reached your target price of $1.20 (current: $1.23)", time: "30m ago", read: false },
  { id: "5", type: "trade", title: "Trade Executed", desc: "Sold 5B GOAT at $0.45 on Jupiter — Order filled", time: "1h ago", read: true },
  { id: "6", type: "whale", title: "Whale Alert: GOAT", desc: "4pHDkCK...8vW2 sold 2.5M GOAT ($1.1M) — Distribution phase", time: "2h ago", read: true },
  { id: "7", type: "signal", title: "AI Signal: GOAT Sell", desc: "Dev wallet activity increasing — risk level elevated to HIGH", time: "2h ago", read: true },
  { id: "8", type: "system", title: "Daily Report Ready", desc: "Your trading performance report for yesterday is ready", time: "3h ago", read: true },
  { id: "9", type: "alert", title: "Price Alert: SPX", desc: "SPX6900 dropped below your stop loss at $0.72 (current: $0.71)", time: "4h ago", read: true },
  { id: "10", type: "whale", title: "Whale Alert: SPX", desc: "3 new wallets accumulated 5M SPX in 24h — Bullish signal", time: "5h ago", read: true },
  { id: "11", type: "trade", title: "Trade Executed", desc: "Bought 8,000 POPCAT at $0.95 on Raydium — Order filled", time: "8h ago", read: true },
  { id: "12", type: "system", title: "Reward Earned", desc: "Daily check-in reward: +50 points. Streak: 7 days", time: "12h ago", read: true },
];

const typeConfig: Record<string, { icon: string; color: string }> = {
  trade: { icon: "&#128176;", color: "#3B82F6" },
  alert: { icon: "&#128276;", color: "#F59E0B" },
  whale: { icon: "&#128011;", color: "#8B5CF6" },
  signal: { icon: "&#9889;", color: "#22C55E" },
  system: { icon: "&#9881;", color: "#7B8BA8" },
};

function NotificationsPage() {
  const [filter, setFilter] = useState("All");
  const [notifs, setNotifs] = useState(NOTIFS);
  const unreadCount = notifs.filter((n) => !n.read).length;

  const filtered = filter === "Unread" ? notifs.filter((n) => !n.read)
    : filter === "All" ? notifs
    : notifs.filter((n) => n.type === filter);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#F0F4FC" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>&#128276;</span>
          <span style={{ fontSize: "16px", fontWeight: 800 }}>Notifications</span>
          {unreadCount > 0 && (
            <span style={{ fontSize: "9px", padding: "2px 7px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontWeight: 700 }}>{unreadCount} new</span>
          )}
        </div>
        <button onClick={markAllRead} style={{ fontSize: "10px", padding: "4px 10px", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "#7B8BA8", cursor: "pointer", fontWeight: 600 }}>
          Mark all read
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "4px", padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", overflowX: "auto" }}>
        {["All", "Unread", "Trades", "Alerts", "Whale", "Signals"].map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            fontSize: "10px", fontWeight: 600, padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer", whiteSpace: "nowrap",
            color: filter === f ? "#fff" : "#7B8BA8",
            background: filter === f ? "rgba(59,130,246,0.15)" : "transparent",
            borderBottom: filter === f ? "2px solid #3B82F6" : "2px solid transparent",
          }}>{f}</button>
        ))}
      </div>

      {/* List */}
      <div style={{ padding: "4px 8px" }}>
        {filtered.map((n) => (
          <div key={n.id} style={{
            display: "flex", alignItems: "flex-start", gap: "10px", padding: "10px 10px", borderRadius: "6px",
            borderLeft: n.read ? "none" : "3px solid #3B82F6",
            background: n.read ? "transparent" : "rgba(59,130,246,0.03)",
            borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
            transition: "background 0.1s",
          }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = n.read ? "transparent" : "rgba(59,130,246,0.03)")}
          >
            <div style={{
              width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
              background: `${typeConfig[n.type].color}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "14px",
            }} dangerouslySetInnerHTML={{ __html: typeConfig[n.type].icon }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: "11px", fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                <span style={{ fontSize: "9px", color: "#4A5568", flexShrink: 0 }}>{n.time}</span>
              </div>
              <p style={{ fontSize: "10px", color: "#7B8BA8", marginTop: "2px", lineHeight: 1.4 }}>{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}