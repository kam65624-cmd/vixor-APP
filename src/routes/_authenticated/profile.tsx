import { memo, useMemo } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserPoints, getTradeHistory } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout, 
  StatsRow,
  SectionTitle,
  Badge,
  DataRow,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: ProfilePage,
});

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
  {
    icon: "⚙️",
    name: "Account Settings",
    desc: "Email, password, 2FA",
    bgColor: `${"var(--color-foreground)"}0D`,
  },
  {
    icon: "🔔",
    name: "Notifications",
    desc: "Alerts & push preferences",
    bgColor: `${"var(--color-bullish)"}1A`,
  },
  {
    icon: "🔗",
    name: "Connected Wallets",
    desc: "Manage wallet connections",
    bgColor: `${"var(--color-primary)"}1A`,
  },
  { icon: "🎨", name: "Appearance", desc: "Theme & display settings", bgColor: `${"var(--color-neutral-wait)"}1A` },
  {
    icon: "🔒",
    name: "Privacy & Security",
    desc: "Data & security options",
    bgColor: `${"var(--color-bearish)"}1A`,
  },
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
  const daysAgo = Math.max(0, Math.floor((Date.now() - date.getTime()) / 86_400_000));
  if (daysAgo === 0) return `Joined ${formatted} · Today`;
  if (daysAgo === 1) return `Joined ${formatted} · Yesterday`;
  return `Joined ${formatted} · ${daysAgo} days ago`;
}

function computeStats(trades: Array<{ pnl: number | null; status: string }>) {
  const totalTrades = trades.length;
  const closedTrades = trades.filter(
    (t) => t.status === "closed" || t.status === "won" || t.status === "lost",
  );
  const wins = closedTrades.filter((t) => (t.pnl ?? 0) > 0);
  const winRate = closedTrades.length > 0 ? (wins.length / closedTrades.length) * 100 : 0;
  const totalPnl = trades.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  return { totalTrades, winRate, totalPnl };
}

// ── Sub-components ───────────────────────────────────────────────────────

const BadgeItem = memo(function BadgeItem({ item }: { item: (typeof badges)[0] }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "14px 8px",
        borderRadius: 12,
        background: "var(--color-card)",
        border: `1px solid ${"color-mix(in oklab, var(--color-foreground) 4%, transparent)"}`,
        opacity: item.unlocked ? 1 : 0.35,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-foreground)" }}>{item.name}</div>
      <div style={{ fontSize: 9, color: "var(--color-muted-foreground)", marginTop: 2 }}>{item.desc}</div>
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

const AccountItem = memo(function AccountItem({ item }: { item: AccountEntry }) {
  return (
    <DataRow>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 16,
              flexShrink: 0,
              background: item.bgColor,
              color: item.iconColor,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>{item.name}</div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
              {item.linked ? item.handle : "Not connected"}
            </div>
          </div>
        </div>
        <Badge
          label={item.linked ? "Connected" : "Connect"}
          color={item.linked ? "var(--color-primary)" : "var(--color-muted-foreground)"}
        />
      </div>
    </DataRow>
  );
});

const SettingItem = memo(function SettingItem({
  item,
  onClick,
}: {
  item: (typeof settings)[0];
  onClick: () => void;
}) {
  return (
    <DataRow onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              flexShrink: 0,
              background: item.bgColor,
            }}
          >
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>{item.name}</div>
            <div style={{ fontSize: 10, color: "var(--color-muted-foreground)" }}>{item.desc}</div>
          </div>
        </div>
        <span style={{ color: "var(--color-muted-foreground)", fontSize: 16 }}>›</span>
      </div>
    </DataRow>
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
        bgColor: `${"var(--color-primary)"}26`,
        iconColor: "var(--color-primary)",
        linked: true,
      });
    } else {
      list.push({
        name: "Telegram",
        handle: "Not connected",
        icon: "✈️",
        bgColor: `${"var(--color-primary)"}26`,
        iconColor: "var(--color-primary)",
        linked: false,
      });
    }

    // Twitter / Discord — not in profile schema, show as unlinked
    list.push({
      name: "Twitter",
      handle: "Not connected",
      icon: "𝕏",
      bgColor: `${"var(--color-bullish)"}26`,
      iconColor: "var(--color-primary)",
      linked: false,
    });
    list.push({
      name: "Discord",
      handle: "Not connected",
      icon: "💬",
      bgColor: `${"var(--color-info)"}26`,
      iconColor: "var(--color-info)",
      linked: false,
    });

    return list;
  }, [profile]);

  // PnL formatting
  const pnlFormatted = useMemo(() => {
    const abs = Math.abs(totalPnl);
    const formatted = abs >= 1_000 ? `$${(abs / 1_000).toFixed(1)}k` : `$${abs.toFixed(2)}`;
    return `${totalPnl >= 0 ? "+" : "-"}${formatted}`;
  }, [totalPnl]);

  const pnlColor = totalPnl >= 0 ? "var(--color-primary)" : "var(--color-bearish)";

  const isLoading = profileQuery.isLoading || pointsQuery.isLoading || tradesQuery.isLoading;

  return (
    <PageLayout
      title="Profile"
      description="Manage your account and view trading statistics"
      loading={isLoading}
    >
      {/* Profile Card */}
      <div
        style={{
          background: "var(--color-card)",
          borderBottom: `1px solid ${"var(--color-border)"}`,
          padding: "16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexShrink: 0,
        }}
      >
        {hasAvatar ? (
          <img
            src={avatarSrc}
            alt={displayName}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              objectFit: "cover" as const,
              flexShrink: 0,
              border: `2px solid ${"color-mix(in oklab, var(--color-primary) 15%, transparent)"}`,
            }}
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.style.display = "none";
              const parent = img.parentElement;
              if (parent && !parent.querySelector("[data-initials]")) {
                const fallback = document.createElement("div");
                fallback.setAttribute("data-initials", "true");
                fallback.textContent = initial;
                fallback.style.cssText = `width:64px;height:64px;border-radius:16px;background:linear-gradient(135deg,${"var(--color-primary)"},${"var(--color-bullish)"});display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:${"var(--color-foreground)"};flex-shrink:0;border:2px solid ${"color-mix(in oklab, var(--color-primary) 15%, transparent)"}`;
                parent.insertBefore(fallback, img);
              }
            }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${"var(--color-primary)"}, ${"var(--color-bullish)"})`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
              color: "var(--color-foreground)",
              flexShrink: 0,
              border: `2px solid ${"color-mix(in oklab, var(--color-primary) 15%, transparent)"}`,
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--color-foreground)", marginBottom: 2 }}>
            {isLoading ? <span style={{ opacity: 0.4 }}>Loading…</span> : displayName}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 8 }}>
            {joinedText}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            <Badge label={`⚡ ${pointsBalance.toLocaleString()} pts`} color={"var(--color-primary)"} />
            {currentStreak > 0 && (
              <Badge label={`🔥 ${currentStreak}-day streak`} color={"var(--color-neutral-wait)"} />
            )}
            {pointsBalance >= 5000 && <Badge label="👑 PRO" color={"var(--color-bullish)"} />}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <StatsRow
        stats={[
          {
            label: "Total Trades",
            value: isLoading ? "—" : String(totalTrades),
            color: "var(--color-bullish)",
          },
          {
            label: "Win Rate",
            value: isLoading ? "—" : `${winRate.toFixed(1)}%`,
            color: "var(--color-primary)",
          },
          { label: "Total PnL", value: isLoading ? "—" : pnlFormatted, color: pnlColor },
          {
            label: "Best Streak",
            value: isLoading ? "—" : longestStreak > 0 ? `${longestStreak} W` : "—",
            color: "var(--color-neutral-wait)",
          },
        ]}
      />

      {/* Scrollable Content */}
      <ScrollArea>
        {/* Achievements */}
        <SectionTitle title="Achievements" count={badges.filter((b) => b.unlocked).length} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
            gap: 10,
            padding: "12px 16px",
            background: "var(--color-card)",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          {badges.map((b) => (
            <BadgeItem key={b.name} item={b} />
          ))}
        </div>

        {/* Connected Accounts */}
        <SectionTitle title="Connected Accounts" />
        {connectedAccounts.map((a) => (
          <AccountItem key={a.name} item={a} />
        ))}

        {/* Settings */}
        <SectionTitle title="Account Settings" />
        {settings.map((s) => (
          <SettingItem key={s.name} item={s} onClick={() => navigate({ to: "/settings" })} />
        ))}
      </ScrollArea>
    </PageLayout>
  );
}
