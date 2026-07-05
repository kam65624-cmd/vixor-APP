import { memo, useMemo, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserPoints, getReferralData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { claimDailyCheckin, redeemReward } from "@/domains/user/functions";
import { toast } from "sonner";
import {
  PageLayout, 
  StatsRow,
  SectionTitle,
  Badge,
  DataRow,
  ScrollArea,
  EmptyState,
  ProgressBar,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Vixor" }] }),
  component: RewardsPage,
});

/* ── Static data ──────────────────────────────────── */

const tiers = [
  { name: "Bronze", min: 0, color: "#A0703C" },
  { name: "Silver", min: 2500, color: "#A0AEC0" },
  { name: "Gold", min: 5000, color: "var(--color-neutral-wait)" },
  { name: "Platinum", min: 10000, color: "var(--color-primary)" },
];

const WEEK_POINTS = [50, 50, 75, 75, 100, 100, 150];
const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const rewards = [
  { icon: "⚡", name: "Trade Fee Discount", cost: "500 pts", costNum: 500 },
  { icon: "📊", name: "AI Analysis Report", cost: "1,000 pts", costNum: 1000 },
  { icon: "🎯", name: "Signal Access", cost: "2,000 pts", costNum: 2000 },
  { icon: "👑", name: "Premium 1 Week", cost: "3,500 pts", costNum: 3500 },
  { icon: "🎁", name: "Mystery Box", cost: "750 pts", costNum: 750 },
  { icon: "🏆", name: "Profile Badge", cost: "1,500 pts", costNum: 1500 },
];

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
  const bgStyle = item.checked
    ? { background: `${"var(--color-primary)"}1F`, border: `1px solid ${"var(--color-primary)"}33` }
    : item.missed
      ? { background: `${"var(--color-bearish)"}0F`, border: `1px solid ${"var(--color-bearish)"}1F` }
      : item.current
        ? { background: `${"var(--color-bullish)"}1F`, border: `1px solid ${"var(--color-bullish)"}4D` }
        : { background: "var(--color-card)", border: "1px solid rgba(124,155,196,0.04)" };

  const statusColor = item.checked
    ? "var(--color-primary)"
    : item.missed
      ? "var(--color-bearish)"
      : item.current
        ? "var(--color-primary)"
        : "var(--color-muted-foreground)";

  return (
    <div
      style={{
        textAlign: "center",
        padding: "10px 0",
        borderRadius: 10,
        ...bgStyle,
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted-foreground)", marginBottom: 6 }}>
        {item.day}
      </div>
      <div style={{ fontSize: 20, marginBottom: 4 }}>
        {item.checked ? "✅" : item.missed ? "✕" : item.current ? "⭐" : "○"}
      </div>
      <div style={{ fontSize: 9, fontWeight: 600, color: statusColor }}>
        {item.checked
          ? "Done"
          : item.missed
            ? "Missed"
            : item.current
              ? "Today"
              : `+${item.points}`}
      </div>
    </div>
  );
});

const RewardItem = memo(function RewardItem({
  item,
  onRedeem,
  redeeming,
  canAfford,
  error,
}: {
  item: (typeof rewards)[0];
  onRedeem: () => void;
  redeeming: boolean;
  canAfford: boolean;
  error: string | null;
}) {
  return (
    <div
      style={{
        background: "var(--color-card)",
        borderRadius: 12,
        border: `1px solid ${"var(--color-border)"}`,
        padding: 16,
        textAlign: "center",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = `${"var(--color-bullish)"}08`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = "var(--color-card)";
      }}
    >
      <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)", marginBottom: 4 }}>
        {item.name}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
          fontWeight: 600,
          color: canAfford ? "var(--color-neutral-wait)" : "var(--color-bearish)",
        }}
      >
        {item.cost}
      </div>
      {error && (
        <div style={{ fontSize: 9, color: "var(--color-bearish)", marginTop: 6, lineHeight: 1.3 }}>
          {error}
        </div>
      )}
      <button
        disabled={redeeming || !canAfford}
        onClick={onRedeem}
        style={{
          marginTop: 10,
          fontSize: 10,
          fontWeight: 700,
          padding: "6px 12px",
          borderRadius: 6,
          border: "none",
          cursor: redeeming ? "wait" : canAfford ? "pointer" : "not-allowed",
          background: redeeming
            ? `${"var(--color-primary)"}26`
            : canAfford
              ? `${"var(--color-bullish)"}26`
              : `${"var(--color-muted-foreground)"}1A`,
          color: redeeming
            ? "var(--color-primary)"
            : canAfford
              ? "var(--color-bullish)"
              : "var(--color-muted-foreground)",
          fontFamily: "'Inter', system-ui, sans-serif",
          opacity: redeeming ? 0.7 : 1,
          transition: "all 0.15s",
        }}
      >
        {redeeming ? "Redeeming..." : canAfford ? "Redeem" : "Not Enough Pts"}
      </button>
    </div>
  );
});

/* ── Page ─────────────────────────────────────────── */

function RewardsPage() {
  const [copied, setCopied] = useState(false);
  const [redeemingName, setRedeemingName] = useState<string | null>(null);
  const [redeemErrors, setRedeemErrors] = useState<Record<string, string>>({});
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null);

  // ── Queries ──
  const queryClient = useQueryClient();
  const fetchPoints = useStableServerFn(getUserPoints);
  const fetchRef = useStableServerFn(getReferralData);
  const claimFn = useStableServerFn(claimDailyCheckin);

  const [claimError, setClaimError] = useState<string | null>(null);

  const claimMutation = useMutation({
    mutationFn: () => claimFn({}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      setClaimError(null);
      toast.success(`+${data.points} points claimed! Streak: ${data.streak} days`);
    },
    onError: (err: Error) => {
      setClaimError(err.message || "Failed to claim. Try again.");
      setTimeout(() => setClaimError(null), 4000);
    },
  });

  const redeemFn = useStableServerFn(redeemReward);

  const redeemMutation = useMutation({
    mutationFn: (params: { rewardName: string; cost: number }) =>
      redeemFn({ data: params }),
    onMutate: (params) => {
      setRedeemingName(params.rewardName);
      setRedeemErrors((prev) => {
        const next = { ...prev };
        delete next[params.rewardName];
        return next;
      });
    },
    onSuccess: (_data, params) => {
      queryClient.invalidateQueries({ queryKey: ["user-points"] });
      setRedeemSuccess(`${params.rewardName} redeemed!`);
      toast.success(`${params.rewardName} redeemed successfully!`);
      setTimeout(() => setRedeemSuccess(null), 3000);
    },
    onError: (err: Error, params) => {
      setRedeemErrors((prev) => ({ ...prev, [params.rewardName]: err.message }));
    },
    onSettled: () => {
      setRedeemingName(null);
    },
  });

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
        !isFuture && !isToday && !isChecked && lastCompleted !== null && dayDate < lastCompleted;

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
    const prog = nt ? Math.min(100, ((lifetimeEarned - ct.min) / (nt.min - ct.min)) * 100) : 100;
    return { currentTierIndex: idx, nextTier: nt, currentTier: ct, progress: prog };
  }, [lifetimeEarned]);

  // Referral URL
  const referralUrl = referralCode ? `https://vixor-app.vercel.app/ref/${referralCode}` : "";

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
    () => transactions.filter((t) => (t.delta ?? 0) > 0).slice(0, 10),
    [transactions],
  );

  const isLoading = pointsQuery.isLoading || refQuery.isLoading;

  // ── Render ──
  return (
    <PageLayout
      title="Rewards"
      loading={isLoading}
    >
      {/* ── Points Hero ── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${"var(--color-bullish)"}1F 0%, ${"var(--color-neutral-wait)"}0F 100%)`,
          borderRadius: 0,
          border: "1px solid rgba(124,155,196,0.15)",
          borderLeft: 0,
          borderRight: 0,
          padding: "24px 16px",
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.08em",
          }}
        >
          Points Balance
        </div>
        <div
          style={{
            fontSize: 42,
            fontWeight: 800,
            fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
            color: "var(--color-neutral-wait)",
            margin: "6px 0",
          }}
        >
          {fmtNum(balance)}
        </div>
        <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
          +{fmtNum(weekEarned)} earned this week · Streak: {streak?.current_streak ?? 0} days
        </div>
      </div>

      {/* ── Scrollable Content ── */}
      <ScrollArea>
        {redeemSuccess && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "8px 16px",
              background: `${"var(--color-bullish)"}14`,
              borderBottom: `1px solid ${"var(--color-bullish)"}26`,
              color: "var(--color-bullish)",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            ✓ {redeemSuccess}
          </div>
        )}
        {/* ── Daily Check-in Streak ── */}
        <SectionTitle title="Daily Check-in Streak" />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7, 1fr)",
            gap: 8,
            padding: "12px 16px",
            background: "var(--color-card)",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          {streakDays.map((d) => (
            <StreakDayItem key={d.day} item={d} />
          ))}
        </div>

        {/* Check-in Button */}
        {streakDays.some((d) => d.current && !d.checked) && (
          <div style={{ padding: "12px 16px", background: "var(--color-card)", borderBottom: `1px solid var(--color-border)` }}>
            <button
              onClick={() => claimMutation.mutate()}
              disabled={claimMutation.isPending}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: 10,
                border: "none",
                cursor: claimMutation.isPending ? "wait" : "pointer",
                background: claimMutation.isSuccess
                  ? "var(--color-bullish)"
                  : "linear-gradient(135deg, var(--color-bullish) 0%, var(--color-primary) 100%)",
                color: "#0B0D10",
                fontSize: 15,
                fontWeight: 800,
                fontFamily: "'Inter', system-ui, sans-serif",
                transition: "all 0.2s",
                opacity: claimMutation.isPending ? 0.7 : 1,
              }}
            >
              {claimMutation.isPending
                ? "Claiming..."
                : claimMutation.isSuccess
                  ? `✅ +${claimMutation.data?.points ?? 0} Points Claimed!`
                  : `⭐ Claim +${WEEK_POINTS[streakDays.findIndex((d) => d.current)]} Daily Points`}
            </button>
            {claimMutation.isSuccess && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--color-muted-foreground)" }}>
                Streak: {claimMutation.data?.streak} days 🔥
              </div>
            )}
            {claimError && (
              <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: "var(--color-bearish)" }}>
                {claimError}
              </div>
            )}
          </div>
        )}
        {streakDays.some((d) => d.current && d.checked) && (
          <div style={{ padding: "12px 16px", background: "var(--color-card)", borderBottom: `1px solid var(--color-border)`, textAlign: "center" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--color-bullish)" }}>✅ Today's reward claimed!</div>
            <div style={{ fontSize: 11, color: "var(--color-muted-foreground)", marginTop: 4 }}>Come back tomorrow for more points</div>
          </div>
        )}

        {/* ── Referral Earnings ── */}
        <SectionTitle title="Referral Earnings" />

        {/* Referral link */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--color-card)",
            padding: "12px 16px",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          <span
            style={{
              flex: 1,
              fontSize: 12,
              fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
              color: "var(--color-muted-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap" as const,
            }}
          >
            {referralUrl || "Generating link…"}
          </span>
          <button
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: `${"var(--color-bullish)"}26`,
              color: "var(--color-primary)",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Referral stats */}
        <StatsRow
          stats={[
            { label: "Total Referrals", value: String(referredCount), color: "var(--color-bullish)" },
            {
              label: "Active",
              value: String(referredCount > 0 ? referredCount : 0),
              color: "var(--color-primary)",
            },
            { label: "Earned", value: `${fmtNum(referralEarned)} pts`, color: "var(--color-neutral-wait)" },
          ]}
        />

        {/* ── Rewards Tier ── */}
        <SectionTitle title="Rewards Tier" />

        {/* Tier info */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "10px 16px",
            background: "var(--color-card)",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>
            Current: <span style={{ color: currentTier.color }}>{currentTier.name}</span>
          </span>
          {nextTier && (
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--color-foreground)" }}>
              Next: <span style={{ color: nextTier.color }}>{nextTier.name}</span>
            </span>
          )}
        </div>

        {/* Tier progress bar (design system component) */}
        <ProgressBar
          value={lifetimeEarned}
          max={nextTier?.min ?? lifetimeEarned}
          color={currentTier.color}
          label="Progress"
          labelRight={`${progress.toFixed(0)}%`}
        />

        {/* Tier segment bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            padding: "0 16px 8px",
            background: "var(--color-card)",
          }}
        >
          {tiers.map((t, i) => {
            let fillPct = 0;
            const fillBg = t.color;
            if (i < currentTierIndex) {
              fillPct = 100;
            } else if (i === currentTierIndex) {
              fillPct = progress;
            }
            return (
              <div
                key={t.name}
                style={{
                  flex: 1,
                  height: 10,
                  background: "var(--color-card)",
                  borderRight: i < tiers.length - 1 ? `2px solid ${"var(--color-background)"}` : "none",
                }}
              >
                <div
                  style={{
                    width: `${fillPct}%`,
                    height: "100%",
                    borderRadius: 4,
                    background: fillBg,
                    opacity: fillPct > 0 ? 0.3 : 0,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Tier labels */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "0 16px 4px",
            background: "var(--color-card)",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          {tiers.map((t) => (
            <Badge key={t.name} label={t.name} color={t.color} small />
          ))}
        </div>

        {/* Tier progress text */}
        <div
          style={{
            fontSize: 11,
            color: "var(--color-muted-foreground)",
            padding: "8px 16px 12px",
            background: "var(--color-card)",
            textAlign: "center",
            borderBottom: `1px solid ${"var(--color-border)"}`,
          }}
        >
          {nextTier
            ? `${fmtNum(lifetimeEarned)} / ${fmtNum(nextTier.min)} pts to ${nextTier.name} — ${progress.toFixed(0)}%`
            : `${fmtNum(lifetimeEarned)} pts — Max tier reached!`}
        </div>

        {/* ── Recent Earnings ── */}
        {recentPositive.length > 0 && (
          <>
            <SectionTitle title="Recent Earnings" count={recentPositive.length} />
            {recentPositive.map((tx) => (
              <DataRow key={tx.id}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div style={{ fontSize: 12, color: "var(--color-foreground)", fontWeight: 500 }}>
                      {tx.reason?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ??
                        "Points"}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-muted-foreground)", marginTop: 2 }}>
                      {fmtDate(tx.created_at)} · {fmtTime(tx.created_at)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                      color: "var(--color-primary)",
                    }}
                  >
                    +{fmtNum(tx.delta ?? 0)}
                  </div>
                </div>
              </DataRow>
            ))}
          </>
        )}

        {/* ── Available Rewards ── */}
        <SectionTitle title="Available Rewards" count={rewards.length} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
            padding: "12px 16px",
            background: "var(--color-card)",
          }}
        >
          {rewards.map((r) => (
            <RewardItem
              key={r.name}
              item={r}
              onRedeem={() => redeemMutation.mutate({ rewardName: r.name, cost: r.costNum })}
              redeeming={redeemingName === r.name}
              canAfford={balance >= r.costNum}
              error={redeemErrors[r.name] ?? null}
            />
          ))}
        </div>
      </ScrollArea>
    </PageLayout>
  );
}
