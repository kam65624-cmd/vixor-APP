import { memo, useMemo, useState, useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  getUserProfile,
  getUserPoints,
  getTradeHistory,
  getPortfolioData,
  getReferralData,
  getRecentAnalyses,
} from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  StatsRow,
  SectionTitle,
  Badge,
  DataRow,
  DataRowTwoLine,
  LabelValue,
  ScrollArea,
} from "@/components/vixor/PageLayout";

// ── Telegram WebApp client-side data (instant, no server round-trip) ──
interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

function getTelegramUserData(): TelegramUserData | null {
  if (typeof window === "undefined") return null;
  try {
    const tg = (
      window as unknown as {
        Telegram?: { WebApp?: { initDataUnsafe?: { user?: TelegramUserData } } };
      }
    ).Telegram?.WebApp;
    return tg?.initDataUnsafe?.user ?? null;
  } catch {
    return null;
  }
}

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — Vixor" }] }),
  component: ProfilePage,
});

// ── Achievement badges (dynamically computed from user data) ─────────

interface BadgeDef {
  icon: string;
  name: string;
  desc: string;
  check: (d: BadgeData) => boolean;
}

interface BadgeData {
  totalTrades: number;
  streak: number;
  referralCount: number;
  bestTrade: number;
  analysisCount: number;
  winRate: number;
  xp: number;
}

const BADGE_DEFS: BadgeDef[] = [
  {
    icon: "🎯",
    name: "First Trade",
    desc: "Made your first trade",
    check: (d) => d.totalTrades >= 1,
  },
  { icon: "🔥", name: "On Fire", desc: "7-day login streak", check: (d) => d.streak >= 7 },
  {
    icon: "👑",
    name: "Pro Trader",
    desc: "100+ trades completed",
    check: (d) => d.totalTrades >= 100,
  },
  { icon: "🤝", name: "Connector", desc: "Referred 3+ users", check: (d) => d.referralCount >= 3 },
  { icon: "💰", name: "Big Winner", desc: "Single trade +$500+", check: (d) => d.bestTrade >= 500 },
  { icon: "📊", name: "Analyst", desc: "10+ chart analyses", check: (d) => d.analysisCount >= 10 },
  { icon: "⚡", name: "Sharp Eye", desc: "Win rate above 70%", check: (d) => d.winRate >= 70 },
  { icon: "🏆", name: "Legend", desc: "1000+ XP earned", check: (d) => d.xp >= 1000 },
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
  {
    icon: "🎨",
    name: "Appearance",
    desc: "Theme & display settings",
    bgColor: `${"var(--color-neutral-wait)"}1A`,
  },
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

const BadgeItem = memo(function BadgeItem({
  item,
}: {
  item: { icon: string; name: string; desc: string; unlocked: boolean };
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "14px 8px",
        borderRadius: 12,
        background: "var(--color-card)",
        border: "1px solid rgba(124,155,196,0.04)",
        opacity: item.unlocked ? 1 : 0.35,
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 6 }}>{item.icon}</div>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--color-foreground)" }}>
        {item.name}
      </div>
      <div style={{ fontSize: 9, color: "var(--color-muted-foreground)", marginTop: 2 }}>
        {item.desc}
      </div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              {item.name}
            </div>
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
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-foreground)" }}>
              {item.name}
            </div>
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

  // ── Telegram client-side data (instant, no server round-trip) ──
  // This gives us the user's real photo and name directly from the
  // Telegram WebApp API, without waiting for the server query.
  const tgUser = useMemo(() => getTelegramUserData(), []);
  const tgDisplayName = tgUser
    ? [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ") || tgUser.username || "Trader"
    : null;
  const tgPhotoUrl = tgUser?.photo_url || null;

  // Server function stabilizers
  const fetchProfile = useStableServerFn(getUserProfile);
  const fetchPoints = useStableServerFn(getUserPoints);
  const fetchTrades = useStableServerFn(getTradeHistory);
  const fetchPortfolio = useStableServerFn(getPortfolioData);
  const fetchReferral = useStableServerFn(getReferralData);
  const fetchAnalyses = useStableServerFn(getRecentAnalyses);

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

  const portfolioQuery = useQuery({
    queryKey: ["portfolio-profile"],
    queryFn: () => fetchPortfolio({}),
    staleTime: 30_000,
  });

  const referralQuery = useQuery({
    queryKey: ["referral-profile"],
    queryFn: () => fetchReferral({}),
    staleTime: 60_000,
  });

  const analysesQuery = useQuery({
    queryKey: ["analyses-profile"],
    queryFn: () => fetchAnalyses(),
    staleTime: 60_000,
  });

  // Derived data
  const profile = profileQuery.data?.profile;
  const pointsBalance = pointsQuery.data?.balance ?? 0;
  const streak =
    (pointsQuery.data?.streak as { current_streak?: number; longest_streak?: number } | undefined)
      ?.current_streak ?? 0;
  const trades = tradesQuery.data?.trades ?? [];

  const { totalTrades, winRate, totalPnl } = useMemo(() => computeStats(trades), [trades]);

  // ── Dynamic badges ──
  const badgeData: BadgeData = useMemo(() => {
    const bestTrade = trades.reduce((max, t) => Math.max(max, t.pnl ?? 0), 0);
    return {
      totalTrades,
      streak,
      referralCount: referralQuery.data?.referredCount ?? 0,
      bestTrade,
      analysisCount: analysesQuery.data?.analyses?.length ?? 0,
      winRate,
      xp: profile?.xp ?? 0,
    };
  }, [totalTrades, streak, referralQuery.data, trades, analysesQuery.data, winRate, profile?.xp]);

  const badges = useMemo(
    () => BADGE_DEFS.map((b) => ({ ...b, unlocked: b.check(badgeData) })),
    [badgeData],
  );

  // ── Name: Telegram client-side > server profile > fallback ──
  const displayName = tgDisplayName || profile?.display_name || profile?.username || "Trader";
  const initial = (tgDisplayName || profile?.display_name || profile?.username || "T")
    .charAt(0)
    .toUpperCase();
  const joinedText = useMemo(() => formatJoinDate(profile?.created_at), [profile?.created_at]);

  const streakData = pointsQuery.data?.streak as
    { current_streak?: number; longest_streak?: number } | undefined;
  const longestStreak = streakData?.longest_streak ?? profile?.streak_days ?? 0;
  const currentStreak = streakData?.current_streak ?? profile?.streak_days ?? 0;

  const [imgError, setImgError] = useState(false);

  // ── Avatar: Telegram client-side photo > server profile photo > fallback initial ──
  // The Telegram WebApp API provides the photo URL instantly without any
  // server round-trip. This is the most reliable source for the profile photo.
  const avatarSrc = tgPhotoUrl || profile?.avatar_url || profile?.telegram_photo_url || "";
  const hasAvatar = Boolean(avatarSrc && !imgError);

  // Build connected accounts list from real profile data
  const connectedAccounts: AccountEntry[] = useMemo(() => {
    const list: AccountEntry[] = [];

    if (profile?.telegram_username || tgUser?.username) {
      list.push({
        name: "Telegram",
        handle: `@${profile?.telegram_username || tgUser?.username || ""}`,
        icon: "✈️",
        bgColor: `${"var(--color-primary)"}26`,
        iconColor: "var(--color-primary)",
        linked: true,
      });
    } else {
      list.push({
        name: "Telegram",
        handle: tgUser ? `ID: ${tgUser.id}` : "Not connected",
        icon: "✈️",
        bgColor: `${"var(--color-primary)"}26`,
        iconColor: "var(--color-primary)",
        linked: !!tgUser,
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

  // Portfolio derived
  const holdings = portfolioQuery.data?.holdings ?? [];
  const portfolioValue = portfolioQuery.data?.totalValue ?? 0;
  const portfolioPnl = portfolioQuery.data?.totalPnl ?? 0;
  const portfolioPnlPct = portfolioQuery.data?.totalPnlPct ?? 0;

  const ALLOC_COLORS = [
    "var(--color-bullish)",
    "var(--color-info)",
    "var(--color-bearish)",
    "var(--color-neutral-wait)",
    "var(--color-primary)",
    "var(--color-bearish)",
    "var(--color-info)",
    "var(--color-neutral-wait)",
  ];

  return (
    <PageLayout title="Profile" loading={isLoading}>
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
            onError={() => setImgError(true)}
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              objectFit: "cover" as const,
              flexShrink: 0,
              border: "2px solid rgba(124,155,196,0.15)",
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
              border: "2px solid rgba(124,155,196,0.15)",
            }}
          >
            {initial}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--color-foreground)",
              marginBottom: 2,
            }}
          >
            {isLoading ? <span style={{ opacity: 0.4 }}>Loading…</span> : displayName}
          </div>
          <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginBottom: 8 }}>
            {joinedText}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" as const }}>
            <Badge
              label={`⚡ ${pointsBalance.toLocaleString()} pts`}
              color={"var(--color-primary)"}
            />
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
        {/* Portfolio Holdings */}
        <SectionTitle
          title="Portfolio"
          action={
            holdings.length > 0
              ? { label: "PnL Tracker", onClick: () => navigate({ to: "/pnl" }) }
              : undefined
          }
        />
        {holdings.length > 0 ? (
          <>
            {/* Allocation bar */}
            <div
              style={{
                display: "flex",
                height: "4px",
                borderRadius: "2px",
                overflow: "hidden",
                background: "var(--color-border)",
              }}
            >
              {holdings.map((h: any, i: number) => {
                const pct = portfolioValue > 0 ? (h.value / portfolioValue) * 100 : 0;
                if (pct < 1) return null;
                return (
                  <div
                    key={h.symbol}
                    style={{
                      width: `${pct}%`,
                      background: ALLOC_COLORS[i % ALLOC_COLORS.length],
                      transition: "width 0.3s",
                    }}
                  />
                );
              })}
            </div>
            {holdings.slice(0, 5).map((h: any) => {
              const isPos = h.pnlPct >= 0;
              const c = isPos ? "var(--color-bullish)" : "var(--color-bearish)";
              return (
                <DataRowTwoLine
                  key={h.symbol}
                  leftAccent={c}
                  topContent={
                    <>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: isPos ? "rgba(14,203,129,0.10)" : "rgba(246,70,93,0.10)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "8px",
                            fontWeight: 800,
                            color: c,
                            flexShrink: 0,
                          }}
                        >
                          {h.symbol.slice(0, 2)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--color-foreground)",
                            }}
                          >
                            {h.symbol}
                          </div>
                          <Badge label={h.chain} color={"var(--color-muted-foreground)"} small />
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: c,
                          }}
                        >
                          {h.pnl >= 0 ? "+" : ""}
                          {h.pnl.toFixed(2)}
                        </span>
                        <Badge
                          label={`${isPos ? "+" : ""}${h.pnlPct.toFixed(1)}%`}
                          color={c}
                          small
                        />
                      </div>
                    </>
                  }
                  bottomContent={
                    <>
                      <LabelValue label="Value" value={`$${h.value.toFixed(2)}`} mono />
                      <LabelValue label="Amt" value={h.amount.toFixed(4)} mono />
                    </>
                  }
                />
              );
            })}
            {holdings.length > 5 && (
              <div style={{ padding: "8px 16px", textAlign: "center" }}>
                <span
                  style={{ fontSize: "11px", color: "var(--color-primary)", cursor: "pointer" }}
                  onClick={() => navigate({ to: "/pnl" })}
                >
                  +{holdings.length - 5} more holdings →
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "32px 20px",
              background: "var(--color-card)",
            }}
          >
            <span style={{ fontSize: "24px", opacity: 0.4 }}>📭</span>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--color-muted-foreground)",
                marginTop: 8,
              }}
            >
              No trades yet
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "var(--color-primary)",
                cursor: "pointer",
                marginTop: 4,
              }}
              onClick={() => navigate({ to: "/trade-desk" })}
            >
              Start trading →
            </span>
          </div>
        )}

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
