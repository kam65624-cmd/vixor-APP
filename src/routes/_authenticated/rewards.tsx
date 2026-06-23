import { memo, useMemo, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserPoints, getReferralData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Vixor" }] }),
  component: RewardsPage,
});

/* ── Static data ──────────────────────────────────── */

const tiers = [
  { name: "Bronze", min: 0, color: "#A0703C" },
  { name: "Silver", min: 2500, color: "#A0AEC0" },
  { name: "Gold", min: 5000, color: "#F59E0B" },
  { name: "Platinum", min: 10000, color: "#34D399" },
];

const WEEK_POINTS = [50, 50, 75, 75, 100, 100, 150];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const rewards = [
  { icon: "⚡", name: "Trade Fee Discount", cost: "500 pts" },
  { icon: "📊", name: "AI Analysis Report", cost: "1,000 pts" },
  { icon: "🎯", name: "Signal Access", cost: "2,000 pts" },
  { icon: "👑", name: "Premium 1 Week", cost: "3,500 pts" },
  { icon: "🎁", name: "Mystery Box", cost: "750 pts" },
  { icon: "🏆", name: "Profile Badge", cost: "1,500 pts" },
];

/* ── Styles ───────────────────────────────────────── */

const S = {
  page: {
    background: "#121212",
    color: "#FFFFFF",
    fontFamily: "'Inter', system-ui, sans-serif",
    minHeight: "100vh",
    padding: "20px",
  },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#FFFFFF", margin: 0 },
  subtitle: { fontSize: "12px", color: "#9CA3AF", marginTop: "4px", marginBottom: "20px" },
  pointsHero: {
    background: "linear-gradient(135deg, rgba(16,185,129,0.12) 0%, rgba(245,158,11,0.06) 100%)",
    borderRadius: "16px",
    border: "1px solid rgba(16,185,129,0.15)",
    padding: "28px",
    marginBottom: "24px",
    textAlign: "center" as const,
  },
  pointsLabel: {
    fontSize: "11px",
    fontWeight: 600,
    color: "#9CA3AF",
    textTransform: "uppercase" as const,
    letterSpacing: "0.08em",
  },
  pointsValue: {
    fontSize: "48px",
    fontWeight: 800,
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
    color: "#F59E0B",
    margin: "6px 0",
  },
  pointsSub: { fontSize: "12px", color: "#9CA3AF" },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#FFFFFF",
    marginBottom: "14px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
  },
  card: {
    background: "#1E1E1E",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "20px",
    marginBottom: "24px",
  },
  streakGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
  streakDay: { textAlign: "center" as const, padding: "10px 0", borderRadius: "10px" },
  streakDayLabel: { fontSize: "10px", fontWeight: 600, color: "#6B7280", marginBottom: "6px" },
  streakDayIcon: { fontSize: "20px", marginBottom: "4px" },
  streakDayStatus: { fontSize: "9px", fontWeight: 600 },
  streakDayChecked: {
    background: "rgba(34,197,94,0.12)",
    border: "1px solid rgba(34,197,94,0.2)",
  },
  streakDayCurrent: {
    background: "rgba(16,185,129,0.12)",
    border: "1px solid rgba(16,185,129,0.3)",
  },
  streakDayFuture: {
    background: "#1A1A1A",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  streakDayMissed: {
    background: "rgba(239,68,68,0.06)",
    border: "1px solid rgba(239,68,68,0.12)",
  },
  referralCard: {
    background: "#1E1E1E",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "20px",
    marginBottom: "24px",
  },
  referralLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#1A1A1A",
    borderRadius: "8px",
    padding: "12px 16px",
    marginBottom: "16px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  referralUrl: {
    flex: 1,
    fontSize: "12px",
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
    color: "#9CA3AF",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
  },
  copyBtn: {
    fontSize: "11px",
    fontWeight: 600,
    padding: "6px 14px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "rgba(16,185,129,0.15)",
    color: "#34D399",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  referralStats: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  refStat: { textAlign: "center" as const },
  refStatValue: {
    fontSize: "20px",
    fontWeight: 700,
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
  },
  refStatLabel: { fontSize: "10px", color: "#9CA3AF", marginTop: "4px" },
  tierCard: {
    background: "#1E1E1E",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "20px",
    marginBottom: "24px",
  },
  tierBar: { display: "flex", alignItems: "center", gap: "0", marginBottom: "8px" },
  tierSegment: { flex: 1, height: "10px", background: "#1A1A1A" },
  tierSegmentFill: { height: "100%", borderRadius: "4px" },
  tierLabels: { display: "flex", justifyContent: "space-between" },
  tierLabel: { fontSize: "10px", fontWeight: 600 },
  tierProgress: {
    fontSize: "11px",
    color: "#9CA3AF",
    marginTop: "8px",
    textAlign: "center" as const,
  },
  rewardGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
  },
  rewardItem: {
    background: "#1A1A1A",
    borderRadius: "12px",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "16px",
    textAlign: "center" as const,
    cursor: "pointer",
    transition: "background 0.15s",
  },
  rewardIcon: { fontSize: "28px", marginBottom: "8px" },
  rewardName: { fontSize: "12px", fontWeight: 600, color: "#FFFFFF", marginBottom: "4px" },
  rewardCost: {
    fontSize: "11px",
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
    fontWeight: 600,
    color: "#F59E0B",
  },
  rewardBtn: {
    marginTop: "10px",
    fontSize: "10px",
    fontWeight: 700,
    padding: "6px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    background: "rgba(16,185,129,0.15)",
    color: "#34D399",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  txList: { display: "flex", flexDirection: "column" as const, gap: "8px" },
  txRow: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 14px",
    background: "#1A1A1A",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.04)",
  },
  txReason: { fontSize: "12px", color: "#FFFFFF", fontWeight: 500 },
  txDate: { fontSize: "10px", color: "#6B7280", marginTop: "2px" },
  txDelta: {
    fontSize: "13px",
    fontWeight: 700,
    fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
  },
  loadingShimmer: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "40vh",
    fontSize: "14px",
    color: "#6B7280",
  },
};

/* ── Helpers ──────────────────────────────────────── */

function getMonday(d: Date): Date {
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const mon = new Date(d);
  mon.setHours(0, 0, 0, 0);
  mon.setDate(diff);
  return mon;
}

function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ── Sub-components ───────────────────────────────── */

type StreakDayData = {
  day: string;
  checked: boolean;
  current: boolean;
  missed: boolean;
  points: number;
};

const StreakDayItem = memo(function StreakDayItem({ item }: { item: StreakDayData }) {
  const style = item.checked
    ? S.streakDayChecked
    : item.missed
      ? S.streakDayMissed
      : item.current
        ? S.streakDayCurrent
        : S.streakDayFuture;

  return (
    <div style={{ ...S.streakDay, ...style }}>
      <div style={S.streakDayLabel}>{item.day}</div>
      <div style={S.streakDayIcon}>
        {item.checked ? "✅" : item.missed ? "✕" : item.current ? "⭐" : "○"}
      </div>
      <div
        style={{
          ...S.streakDayStatus,
          color: item.checked
            ? "#22C55E"
            : item.missed
              ? "#EF4444"
              : item.current
                ? "#34D399"
                : "#6B7280",
        }}
      >
        {item.checked ? "Done" : item.missed ? "Missed" : item.current ? "Today" : `+${item.points}`}
      </div>
    </div>
  );
});

const RewardItem = memo(function RewardItem({ item }: { item: (typeof rewards)[0] }) {
  return (
    <div style={S.rewardItem}>
      <div style={S.rewardIcon}>{item.icon}</div>
      <div style={S.rewardName}>{item.name}</div>
      <div style={S.rewardCost}>{item.cost}</div>
      <button style={S.rewardBtn}>Redeem</button>
    </div>
  );
});

/* ── Page ─────────────────────────────────────────── */

function RewardsPage() {
  const [copied, setCopied] = useState(false);

  // ── Queries ──
  const fetchPoints = useStableServerFn(getUserPoints);
  const fetchRef = useStableServerFn(getReferralData);

  const pointsQuery = useQuery({
    queryKey: ["user-points"],
    queryFn: () => fetchPoints({}),
    staleTime: 30_000,
  });

  const refQuery = useQuery({
    queryKey: ["referral-data"],
    queryFn: () => fetchRef({}),
    staleTime: 60_000,
  });

  // ── Derived data ──
  const balance = pointsQuery.data?.balance ?? 0;
  const lifetimeEarned = pointsQuery.data?.lifetimeEarned ?? 0;
  const streak = pointsQuery.data?.streak;
  const transactions = pointsQuery.data?.recentTransactions ?? [];
  const referralCode = refQuery.data?.referralCode ?? "";
  const referredCount = refQuery.data?.referredCount ?? 0;
  const referralEarned = refQuery.data?.earnedPoints ?? 0;

  // Points earned this week
  const weekEarned = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return transactions
      .filter((t) => {
        const d = new Date(t.created_at);
        return d >= weekAgo && (t.delta ?? 0) > 0;
      })
      .reduce((s, t) => s + (t.delta ?? 0), 0);
  }, [transactions]);

  // Streak days for the current week grid
  const streakDays: StreakDayData[] = useMemo(() => {
    const today = startOfDay(new Date());
    const monday = getMonday(today);
    const lastCompleted = streak?.last_completed_date
      ? startOfDay(new Date(streak.last_completed_date))
      : null;
    const currentStreak = streak?.current_streak ?? 0;

    // Streak start date: go backwards from lastCompleted by (currentStreak - 1) days
    const streakStart = lastCompleted
      ? new Date(lastCompleted.getTime() - (currentStreak - 1) * 24 * 60 * 60 * 1000)
      : null;

    return DAY_LABELS.map((label, i) => {
      const dayDate = new Date(monday.getTime() + i * 24 * 60 * 60 * 1000);
      const isFuture = dayDate > today;
      const isToday = dayDate.getTime() === today.getTime();

      // A day is "checked" if it falls within the streak window
      const isChecked =
        !isFuture &&
        lastCompleted !== null &&
        dayDate <= lastCompleted &&
        streakStart !== null &&
        dayDate >= streakStart;

      const isMissed =
        !isFuture &&
        !isToday &&
        !isChecked &&
        lastCompleted !== null &&
        dayDate < lastCompleted;

      return {
        day: label,
        checked: isChecked,
        current: isToday && !isChecked,
        missed: isMissed,
        points: WEEK_POINTS[i],
      };
    });
  }, [streak]);

  // Tier computation
  const { currentTierIndex, nextTier, currentTier, progress } = useMemo(() => {
    let idx = 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (lifetimeEarned >= tiers[i].min) {
        idx = i;
        break;
      }
    }
    const ct = tiers[idx];
    const nt = idx < tiers.length - 1 ? tiers[idx + 1] : null;
    const prog = nt
      ? Math.min(100, ((lifetimeEarned - ct.min) / (nt.min - ct.min)) * 100)
      : 100;
    return { currentTierIndex: idx, nextTier: nt, currentTier: ct, progress: prog };
  }, [lifetimeEarned]);

  // Referral URL
  const referralUrl = referralCode ? `https://vixor.io/ref/${referralCode}` : "";

  // Copy handler
  const handleCopy = useCallback(() => {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [referralUrl]);

  // Recent transactions (positive deltas only, last 10)
  const recentPositive = useMemo(
    () =>
      transactions
        .filter((t) => (t.delta ?? 0) > 0)
        .slice(0, 10),
    [transactions],
  );

  // ── Loading state ──
  if (pointsQuery.isLoading || refQuery.isLoading) {
    return (
      <div style={S.page}>
        <div style={S.loadingShimmer}>Loading rewards data…</div>
      </div>
    );
  }

  // ── Render ──
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Rewards</h1>
      </div>
      <p style={S.subtitle}>Earn points, unlock tiers, and redeem rewards</p>

      {/* ── Points Hero ── */}
      <div style={S.pointsHero}>
        <div style={S.pointsLabel}>Points Balance</div>
        <div style={S.pointsValue}>{fmtNum(balance)}</div>
        <div style={S.pointsSub}>
          +{fmtNum(weekEarned)} earned this week · Streak: {streak?.current_streak ?? 0} days
        </div>
      </div>

      {/* ── Daily Check-in Streak ── */}
      <div style={S.sectionTitle}>Daily Check-in Streak</div>
      <div style={S.card}>
        <div style={S.streakGrid}>
          {streakDays.map((d) => (
            <StreakDayItem key={d.day} item={d} />
          ))}
        </div>
      </div>

      {/* ── Referral Earnings ── */}
      <div style={S.sectionTitle}>Referral Earnings</div>
      <div style={S.referralCard}>
        <div style={S.referralLink}>
          <span style={S.referralUrl}>
            {referralUrl || "Generating link…"}
          </span>
          <button style={S.copyBtn} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div style={S.referralStats}>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#10B981" }}>{referredCount}</div>
            <div style={S.refStatLabel}>Total Referrals</div>
          </div>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#22C55E" }}>
              {referredCount > 0 ? referredCount : 0}
            </div>
            <div style={S.refStatLabel}>Active</div>
          </div>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#F59E0B" }}>
              {fmtNum(referralEarned)} pts
            </div>
            <div style={S.refStatLabel}>Earned</div>
          </div>
        </div>
      </div>

      {/* ── Rewards Tier ── */}
      <div style={S.sectionTitle}>Rewards Tier</div>
      <div style={S.tierCard}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
            Current: <span style={{ color: currentTier.color }}>{currentTier.name}</span>
          </span>
          {nextTier && (
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#FFFFFF" }}>
              Next: <span style={{ color: nextTier.color }}>{nextTier.name}</span>
            </span>
          )}
        </div>
        <div style={S.tierBar}>
          {tiers.map((t, i) => {
            let fillPct = 0;
            let fillBg = t.color;
            if (i < currentTierIndex) {
              fillPct = 100;
            } else if (i === currentTierIndex) {
              fillPct = progress;
            }
            return (
              <div
                key={t.name}
                style={{
                  ...S.tierSegment,
                  borderRight: i < tiers.length - 1 ? "2px solid #121212" : "none",
                }}
              >
                <div
                  style={{
                    ...S.tierSegmentFill,
                    width: `${fillPct}%`,
                    background: fillBg,
                    opacity: fillPct > 0 ? 0.3 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>
        <div style={S.tierLabels}>
          {tiers.map((t) => (
            <span key={t.name} style={{ ...S.tierLabel, color: t.color }}>
              {t.name}
            </span>
          ))}
        </div>
        <div style={S.tierProgress}>
          {nextTier
            ? `${fmtNum(lifetimeEarned)} / ${fmtNum(nextTier.min)} pts to ${nextTier.name} — ${progress.toFixed(0)}%`
            : `${fmtNum(lifetimeEarned)} pts — Max tier reached!`}
        </div>
      </div>

      {/* ── Recent Earnings ── */}
      {recentPositive.length > 0 && (
        <>
          <div style={S.sectionTitle}>Recent Earnings</div>
          <div style={S.card}>
            <div style={S.txList}>
              {recentPositive.map((tx) => (
                <div key={tx.id} style={S.txRow}>
                  <div>
                    <div style={S.txReason}>
                      {tx.reason?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ?? "Points"}
                    </div>
                    <div style={S.txDate}>
                      {fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}
                    </div>
                  </div>
                  <div style={{ ...S.txDelta, color: "#22C55E" }}>+{fmtNum(tx.delta ?? 0)}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Available Rewards ── */}
      <div style={S.sectionTitle}>Available Rewards</div>
      <div style={S.rewardGrid}>
        {rewards.map((r) => (
          <RewardItem key={r.name} item={r} />
        ))}
      </div>
    </div>
  );
}