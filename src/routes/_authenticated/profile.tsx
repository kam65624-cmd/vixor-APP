import { memo, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserPoints, getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: ProfilePage,
});

// ── Styles ──────────────────────────────────────────────────────────────

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  profileCard: { background: "#161b2e", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "20px" },
  avatar: { width: "72px", height: "72px", borderRadius: "18px", background: "linear-gradient(135deg, #3B82F6, #2563EB)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", fontWeight: 800, color: "#fff", flexShrink: 0, border: "2px solid rgba(59,130,246,0.3)" },
  avatarImg: { width: "72px", height: "72px", borderRadius: "18px", objectFit: "cover" as const, flexShrink: 0, border: "2px solid rgba(59,130,246,0.3)" },
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
  accountRowLast: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0" },
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
  skeletonPulse: { animation: "pulse 1.5s ease-in-out infinite" },
};

// ── Static data (achievements badges are product-level) ─────────────────

const badges = [
  { icon: "🎯", name: "First Trade", desc: "Made your first trade", unlocked: true },
  { icon: "🔥", name: "On Fire", desc: "7-day login streak", unlocked: true },
  { icon: "👑", name: "Pro Trader", desc: "Premium subscriber", unlocked: true },
  { icon: "🤝", name: "Connector", desc: "Referred 5+ users", unlocked: true },
  { icon: "💰", name: "Big Winner", desc: "Single trade +$500+", unlocked: true },
  { icon: "📊", name: "Analyst", desc: "50+ analyses", unlocked: true },
  { icon: "⚡", name: "Speed Demon", desc: "Trade in <2s", unlocked: false },
  { icon: "🏆", name: "Legend", desc: "Top 10 leaderboard", unlocked: false },
];

const settings = [
  { icon: "⚙️", name: "Account Settings", desc: "Email, password, 2FA", bgColor: "rgba(255,255,255,0.05)" },
  { icon: "🔔", name: "Notifications", desc: "Alerts & push preferences", bgColor: "rgba(59,130,246,0.1)" },
  { icon: "🔗", name: "Connected Wallets", desc: "Manage wallet connections", bgColor: "rgba(34,197,94,0.1)" },
  { icon: "🎨", name: "Appearance", desc: "Theme & display settings", bgColor: "rgba(245,158,11,0.1)" },
  { icon: "🔒", name: "Privacy & Security", desc: "Data & security options", bgColor: "rgba(239,68,68,0.1)" },
];

// ── Helpers ─────────────────────────────────────────────────────────────

function formatJoinDate(createdAt: string | undefined): string {
  if (!createdAt) return "Member";
  const date = new Date(createdAt);
  const formatted = date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const daysAgo = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 86_400_000),
  );
  if (daysAgo === 0) return `Joined ${formatted} · Today`;
  if (daysAgo === 1) return `Joined ${formatted} · Yesterday`;
  return `Joined ${formatted} · ${daysAgo} days ago`;
}

function computeStats(trades: Array<{ pnl: number | null; status: string }>) {
  const totalTrades = trades.length;
  const closedTrades = trades.filter((t) => t.status === "closed" || t.status === "won" || t.status === "lost");
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? ((wins.length / closedTrades.length) * 100) : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return { totalTrades, winRate, totalPnl };
}

// ── Sub-components ───────────────────────────────────────────────────────

const StatCard = memo(function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
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

interface AccountEntry {
  name: string;
  handle: string;
  icon: string;
  bgColor: string;
  iconColor: string;
  linked: boolean;
}

const AccountItem = memo(function AccountItem({ item, isLast }: { item: AccountEntry; isLast: boolean }) {
  return (
    <div style={isLast ? S.accountRowLast : S.accountRow}>
      <div style={S.accountLeft}>
        <div style={{ ...S.accountIcon, background: item.bgColor, color: item.iconColor }}>{item.icon}</div>
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

const SettingItem = memo(function SettingItem({ item, onClick }: { item: typeof settings[0]; onClick: () => void }) {
  return (
    <div style={S.settingItem} onClick={onClick} onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"; }} onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}>
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

// ── Main Page ───────────────────────────────────────────────────────────

function ProfilePage() {
  const navigate = useNavigate();

  // Server function stabilizers
  const fetchProfile = useStableServerFn(getUserProfile);
  const fetchPoints = useStableServerFn(getUserPoints);
  const fetchTrades = useStableServerFn(getTradeHistory);

  // Queries
  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => fetchProfile({}),
    staleTime: 30_000,
  });

  const pointsQuery = useQuery({
    queryKey: ["user-points"],
    queryFn: () => fetchPoints({}),
    staleTime: 30_000,
  });

  const tradesQuery = useQuery({
    queryKey: ["trade-history-profile"],
    queryFn: () => fetchTrades({ data: { limit: 100 } }),
    staleTime: 60_000,
  });

  // Derived data
  const profile = profileQuery.data?.profile;
  const pointsBalance = pointsQuery.data?.balance ?? 0;
  const streak = pointsQuery.data?.streak;
  const trades = tradesQuery.data?.trades ?? [];

  const { totalTrades, winRate, totalPnl } = useMemo(() => computeStats(trades), [trades]);

  const displayName = profile?.display_name || profile?.username || "Trader";
  const initial = (profile?.display_name?.[0] || profile?.username?.[0] || "T").toUpperCase();
  const joinedText = useMemo(() => formatJoinDate(profile?.created_at), [profile?.created_at]);

  const longestStreak = streak?.longest_streak ?? profile?.streak_days ?? 0;
  const currentStreak = streak?.current_streak ?? profile?.streak_days ?? 0;

  const hasAvatar = Boolean(profile?.avatar_url || profile?.telegram_photo_url);
  const avatarSrc = profile?.avatar_url || profile?.telegram_photo_url || "";

  // Build connected accounts list from real profile data
  const connectedAccounts: AccountEntry[] = useMemo(() => {
    const list: AccountEntry[] = [];

    if (profile?.telegram_username) {
      list.push({
        name: "Telegram",
        handle: `@${profile.telegram_username}`,
        icon: "✈️",
        bgColor: "rgba(34,197,94,0.15)",
        iconColor: "#22C55E",
        linked: true,
      });
    } else {
      list.push({
        name: "Telegram",
        handle: "Not connected",
        icon: "✈️",
        bgColor: "rgba(34,197,94,0.15)",
        iconColor: "#22C55E",
        linked: false,
      });
    }

    // Twitter / Discord — not in profile schema, show as unlinked
    list.push({
      name: "Twitter",
      handle: "Not connected",
      icon: "𝕏",
      bgColor: "rgba(59,130,246,0.15)",
      iconColor: "#60A5FA",
      linked: false,
    });
    list.push({
      name: "Discord",
      handle: "Not connected",
      icon: "💬",
      bgColor: "rgba(139,92,246,0.15)",
      iconColor: "#A78BFA",
      linked: false,
    });

    return list;
  }, [profile]);

  // PnL formatting
  const pnlFormatted = useMemo(() => {
    const abs = Math.abs(totalPnl);
    const formatted = abs >= 1_000
      ? `$${(abs / 1_000).toFixed(1)}k`
      : `$${abs.toFixed(2)}`;
    return `${totalPnl >= 0 ? "+" : "-"}${formatted}`;
  }, [totalPnl]);

  const pnlColor = totalPnl >= 0 ? "#22C55E" : "#EF4444";

  const isLoading = profileQuery.isLoading || pointsQuery.isLoading || tradesQuery.isLoading;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={S.header}>
        <h1 style={S.title}>Profile</h1>
      </div>
      <p style={S.subtitle}>Manage your account and view trading statistics</p>

      {/* Profile Card */}
      <div style={S.profileCard}>
        {hasAvatar ? (
          <img
            src={avatarSrc}
            alt={displayName}
            style={S.avatarImg}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const parent = img.parentElement;
              if (parent && !parent.querySelector("[data-initials]")) {
                const fallback = document.createElement("div");
                fallback.setAttribute("data-initials", "true");
                fallback.textContent = initial;
                fallback.style.cssText =
                  "width:72px;height:72px;border-radius:18px;background:linear-gradient(135deg,#3B82F6,#2563EB);display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;color:#fff;flex-shrink:0;border:2px solid rgba(59,130,246,0.3)";
                parent.insertBefore(fallback, img);
              }
            }}
          />
        ) : (
          <div style={S.avatar}>{initial}</div>
        )}
        <div style={S.profileInfo}>
          <div style={S.username}>
            {isLoading ? (
              <span style={{ opacity: 0.4 }}>Loading…</span>
            ) : (
              displayName
            )}
          </div>
          <div style={S.joined}>{joinedText}</div>
          <div style={S.badgesRow}>
            <span style={{ ...S.smallBadge, background: "rgba(59,130,246,0.15)", color: "#60A5FA" }}>
              ⚡ {pointsBalance.toLocaleString()} pts
            </span>
            {currentStreak > 0 && (
              <span style={{ ...S.smallBadge, background: "rgba(245,158,11,0.15)", color: "#F59E0B" }}>
                🔥 {currentStreak}-day streak
              </span>
            )}
            {pointsBalance >= 5000 && (
              <span style={{ ...S.smallBadge, background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                👑 PRO
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={S.statsGrid}>
        <StatCard
          label="Total Trades"
          value={isLoading ? "—" : String(totalTrades)}
          color="#3B82F6"
        />
        <StatCard
          label="Win Rate"
          value={isLoading ? "—" : `${winRate.toFixed(1)}%`}
          color="#22C55E"
        />
        <StatCard
          label="Total PnL"
          value={isLoading ? "—" : pnlFormatted}
          color={pnlColor}
        />
        <StatCard
          label="Best Streak"
          value={isLoading ? "—" : longestStreak > 0 ? `${longestStreak} W` : "—"}
          color="#F59E0B"
        />
      </div>

      {/* Achievements */}
      <div style={{ ...S.sectionTitle }}>Achievements</div>
      <div style={{ ...S.card, padding: "16px" }}>
        <div style={S.badgeGrid}>
          {badges.map((b) => (
            <BadgeItem key={b.name} item={b} />
          ))}
        </div>
      </div>

      {/* Connected Accounts */}
      <div style={{ ...S.sectionTitle }}>Connected Accounts</div>
      <div style={S.card}>
        {connectedAccounts.map((a, i) => (
          <AccountItem key={a.name} item={a} isLast={i === connectedAccounts.length - 1} />
        ))}
      </div>

      {/* Settings */}
      <div style={{ ...S.sectionTitle }}>Account Settings</div>
      <div style={S.settingsList}>
        {settings.map((s) => (
          <SettingItem
            key={s.name}
            item={s}
            onClick={() => navigate({ to: "/settings" })}
          />
        ))}
      </div>
    </div>
  );
}
