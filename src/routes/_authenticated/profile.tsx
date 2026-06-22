import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: ProfilePage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  profileCard: { background: "#161b2e", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" },
  avatar: { width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "#fff", flexShrink: 0, border: "2px solid rgba(59,130,246,0.3)" },
  profileInfo: { flex: 1, minWidth: 0 },
  username: { fontSize: "20px", fontWeight: 700, color: "#F0F4FC", marginBottom: "2px" },
  joined: { fontSize: "12px", color: "#7B8BA8", marginBottom: "8px" },
  badgesRow: { display: "flex", gap: "6px", flexWrap: "wrap" as const },
  smallBadge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  statCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", textAlign: "center" as const },
  statValue: { fontSize: "24px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", marginBottom: "4px" },
  statLabel: { fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" },
  badgeGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" },
  badgeItem: { textAlign: "center" as const, padding: "14px 8px", borderRadius: "12px", background: "#1a2035", border: "1px solid rgba(255,255,255,0.04)" },
  badgeItemLocked: { opacity: 0.35 },
  badgeIcon: { fontSize: "28px", marginBottom: "6px" },
  badgeName: { fontSize: "10px", fontWeight: 700, color: "#F0F4FC" },
  badgeDesc: { fontSize: "9px", color: "#7B8BA8", marginTop: "2px" },
  accountRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  accountLeft: { display: "flex", alignItems: "center", gap: "12px" },
  accountIcon: { width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 },
  accountName: { fontSize: "13px", fontWeight: 600, color: "#F0F4FC" },
  accountHandle: { fontSize: "11px", color: "#7B8BA8" },
  accountStatus: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px" },
  settingsList: { display: "flex", flexDirection: "column" as const, gap: "2px" },
  settingItem: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: "10px", cursor: "pointer", transition: "background 0.15s" },
  settingLeft: { display: "flex", alignItems: "center", gap: "12px" },
  settingIcon: { width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", flexShrink: 0 },
  settingName: { fontSize: "13px", fontWeight: 600, color: "#F0F4FC" },
  settingDesc: { fontSize: "10px", color: "#7B8BA8" },
  settingArrow: { color: "#4A5568", fontSize: "16px" },
};

const stats = [
  { label: "Total Trades", value: "847", color: "#3B82F6" },
  { label: "Win Rate", value: "64.2%", color: "#22C55E" },
  { label: "Total PnL", value: "+$4,280", color: "#22C55E" },
  { label: "Best Streak", value: "14 W", color: "#F59E0B" },
];

const badges = [
  { icon: "🎯", name: "First Trade", desc: "Made your first trade", unlocked: true },
  { icon: "🔥", name: "On Fire", desc: "7-day login streak", unlocked: true },
  { icon: "👑", name: "Pro Trader", desc: "Premium subscriber", unlocked: true },
  { icon: "🤝", name: "Connector", desc: "Referred 5+ users", unlocked: true },
  { icon: "💰", name: "Big Winner", desc: "Single trade +$500+", unlocked: true },
  { icon: "📊", name: "Analyst", desc: "50+ analyses", unlocked: true },
  { icon: "⚡", name: "Speed Demon", desc: "Trade in &lt;2s", unlocked: false },
  { icon: "🏆", name: "Legend", desc: "Top 10 leaderboard", unlocked: false },
];

const accounts = [
  { name: "Twitter", handle: "@solana_degen", icon: "𝕏", bgColor: "rgba(59,130,246,0.15)", iconColor: "#60A5FA", linked: true },
  { name: "Discord", handle: "degenking#4821", icon: "💬", bgColor: "rgba(139,92,246,0.15)", iconColor: "#A78BFA", linked: true },
  { name: "Telegram", handle: "@sol_trader", icon: "✈️", bgColor: "rgba(34,197,94,0.15)", iconColor: "#22C55E", linked: false },
];

const settings = [
  { icon: "⚙️", name: "Account Settings", desc: "Email, password, 2FA", bgColor: "rgba(255,255,255,0.05)" },
  { icon: "🔔", name: "Notifications", desc: "Alerts & push preferences", bgColor: "rgba(59,130,246,0.1)" },
  { icon: "🔗", name: "Connected Wallets", desc: "Manage wallet connections", bgColor: "rgba(34,197,94,0.1)" },
  { icon: "🎨", name: "Appearance", desc: "Theme & display settings", bgColor: "rgba(245,158,11,0.1)" },
  { icon: "🔒", name: "Privacy & Security", desc: "Data & security options", bgColor: "rgba(239,68,68,0.1)" },
];

const StatCard = memo(function StatCard({ item }: { item: typeof stats[0] }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statValue, color: item.color }}>{item.value}</div>
      <div style={S.statLabel}>{item.label}</div>
    </div>
  );
});

const BadgeItem = memo(function BadgeItem({ item }: { item: typeof badges[0] }) {
  return (
    <div style={{ ...S.badgeItem, ...(item.unlocked ? {} : S.badgeItemLocked) }}>
      <div style={S.badgeIcon}>{item.icon}</div>
      <div style={S.badgeName}>{item.name}</div>
      <div style={S.badgeDesc}>{item.desc}</div>
    </div>
  );
});

const AccountItem = memo(function AccountItem({ item }: { item: typeof accounts[0] }) {
  return (
    <div style={S.accountRow}>
      <div style={S.accountLeft}>
        <div style={{ ...S.accountIcon, background: item.bgColor }}>{item.icon}</div>
        <div>
          <div style={S.accountName}>{item.name}</div>
          <div style={S.accountHandle}>{item.linked ? item.handle : "Not connected"}</div>
        </div>
      </div>
      <span style={{
        ...S.accountStatus,
        background: item.linked ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
        color: item.linked ? "#22C55E" : "#4A5568",
      }}>
        {item.linked ? "Connected" : "Connect"}
      </span>
    </div>
  );
});

const SettingItem = memo(function SettingItem({ item }: { item: typeof settings[0] }) {
  return (
    <div style={S.settingItem}>
      <div style={S.settingLeft}>
        <div style={{ ...S.settingIcon, background: item.bgColor }}>{item.icon}</div>
        <div>
          <div style={S.settingName}>{item.name}</div>
          <div style={S.settingDesc}>{item.desc}</div>
        </div>
      </div>
      <span style={S.settingArrow}>›</span>
    </div>
  );
});

function ProfilePage() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Profile</h1>
      </div>
      <p style={S.subtitle}>Manage your account and view trading statistics</p>

      <div style={S.profileCard}>
        <div style={S.avatar}>DK</div>
        <div style={S.profileInfo}>
          <div style={S.username}>DegenKing</div>
          <div style={S.joined}>Joined December 12, 2024 · 43 days ago</div>
          <div style={S.badgesRow}>
            <span style={{ ...S.smallBadge, background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>⚡ 4,750 pts</span>
            <span style={{ ...S.smallBadge, background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>🔥 14-day streak</span>
            <span style={{ ...S.smallBadge, background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>👑 PRO</span>
          </div>
        </div>
      </div>

      <div style={S.statsGrid}>
        {stats.map((s) => (
          <StatCard key={s.label} item={s} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Achievements</div>
      <div style={{ ...S.card, padding: "16px" }}>
        <div style={S.badgeGrid}>
          {badges.map((b) => (
            <BadgeItem key={b.name} item={b} />
          ))}
        </div>
      </div>

      <div style={{ ...S.sectionTitle }}>Connected Accounts</div>
      <div style={S.card}>
        {accounts.map((a) => (
          <AccountItem key={a.name} item={a} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Account Settings</div>
      <div style={{ ...S.settingsList }}>
        {settings.map((s) => (
          <SettingItem key={s.name} item={s} />
        ))}
      </div>
    </div>
  );
}