import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/rewards")({
  head: () => ({ meta: [{ title: "Rewards — Vixor" }] }),
  component: RewardsPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  pointsHero: { background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(245,158,11,0.06) 100%)", borderRadius: "16px", border: "1px solid rgba(59,130,246,0.15)", padding: "28px", marginBottom: "24px", textAlign: "center" as const },
  pointsLabel: { fontSize: "11px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.08em" },
  pointsValue: { fontSize: "48px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#F59E0B", margin: "6px 0" },
  pointsSub: { fontSize: "12px", color: "#7B8BA8" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  card: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" },
  streakGrid: { display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" },
  streakDay: { textAlign: "center" as const, padding: "10px 0", borderRadius: "10px" },
  streakDayLabel: { fontSize: "10px", fontWeight: 600, color: "#4A5568", marginBottom: "6px" },
  streakDayIcon: { fontSize: "20px", marginBottom: "4px" },
  streakDayStatus: { fontSize: "9px", fontWeight: 600 },
  streakDayChecked: { background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.2)" },
  streakDayCurrent: { background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)" },
  streakDayFuture: { background: "#1a2035", border: "1px solid rgba(255,255,255,0.04)" },
  referralCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" },
  referralLink: { display: "flex", alignItems: "center", gap: "8px", background: "#1a2035", borderRadius: "8px", padding: "12px 16px", marginBottom: "16px", border: "1px solid rgba(255,255,255,0.06)" },
  referralUrl: { flex: 1, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const },
  copyBtn: { fontSize: "11px", fontWeight: 600, padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontFamily: "'Inter', system-ui, sans-serif" },
  referralStats: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
  refStat: { textAlign: "center" as const },
  refStatValue: { fontSize: "20px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  refStatLabel: { fontSize: "10px", color: "#7B8BA8", marginTop: "4px" },
  tierCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" },
  tierBar: { display: "flex", alignItems: "center", gap: "0", marginBottom: "8px" },
  tierSegment: { flex: 1, height: "10px", background: "#1a2035" },
  tierSegmentFill: { height: "100%", borderRadius: "4px" },
  tierLabels: { display: "flex", justifyContent: "space-between" },
  tierLabel: { fontSize: "10px", fontWeight: 600 },
  tierProgress: { fontSize: "11px", color: "#7B8BA8", marginTop: "8px", textAlign: "center" as const },
  rewardGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px" },
  rewardItem: { background: "#1a2035", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", textAlign: "center" as const, cursor: "pointer", transition: "background 0.15s" },
  rewardIcon: { fontSize: "28px", marginBottom: "8px" },
  rewardName: { fontSize: "12px", fontWeight: 600, color: "#F0F4FC", marginBottom: "4px" },
  rewardCost: { fontSize: "11px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600, color: "#F59E0B" },
  rewardBtn: { marginTop: "10px", fontSize: "10px", fontWeight: 700, padding: "6px 12px", borderRadius: "6px", border: "none", cursor: "pointer", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontFamily: "'Inter', system-ui, sans-serif" },
};

const streakDays = [
  { day: "Mon", checked: true, points: 50 },
  { day: "Tue", checked: true, points: 50 },
  { day: "Wed", checked: true, points: 75 },
  { day: "Thu", checked: true, points: 75 },
  { day: "Fri", checked: false, points: 100, current: true },
  { day: "Sat", checked: false, points: 100 },
  { day: "Sun", checked: false, points: 150 },
];

const tiers = [
  { name: "Bronze", min: 0, color: "#A0703C" },
  { name: "Silver", min: 2500, color: "#A0AEC0" },
  { name: "Gold", min: 5000, color: "#F59E0B" },
  { name: "Platinum", min: 10000, color: "#60A5FA" },
];

const rewards = [
  { icon: "⚡", name: "Trade Fee Discount", cost: "500 pts" },
  { icon: "📊", name: "AI Analysis Report", cost: "1,000 pts" },
  { icon: "🎯", name: "Signal Access", cost: "2,000 pts" },
  { icon: "👑", name: "Premium 1 Week", cost: "3,500 pts" },
  { icon: "🎁", name: "Mystery Box", cost: "750 pts" },
  { icon: "🏆", name: "Profile Badge", cost: "1,500 pts" },
];

const StreakDayItem = memo(function StreakDayItem({ item }: { item: typeof streakDays[0] }) {
  const style = item.checked ? S.streakDayChecked : item.current ? S.streakDayCurrent : S.streakDayFuture;
  return (
    <div style={{ ...S.streakDay, ...style }}>
      <div style={S.streakDayLabel}>{item.day}</div>
      <div style={S.streakDayIcon}>{item.checked ? "✅" : item.current ? "⭐" : "○"}</div>
      <div style={{ ...S.streakDayStatus, color: item.checked ? "#22C55E" : item.current ? "#60A5FA" : "#4A5568" }}>
        {item.checked ? "Done" : item.current ? "Today" : `+${item.points}`}
      </div>
    </div>
  );
});

const RewardItem = memo(function RewardItem({ item }: { item: typeof rewards[0] }) {
  return (
    <div style={S.rewardItem}>
      <div style={S.rewardIcon}>{item.icon}</div>
      <div style={S.rewardName}>{item.name}</div>
      <div style={S.rewardCost}>{item.cost}</div>
      <button style={S.rewardBtn}>Redeem</button>
    </div>
  );
});

function RewardsPage() {
  const currentPoints = 4750;
  const currentTierIndex = 1; // Silver
  const nextTier = tiers[currentTierIndex + 1];
  const currentTier = tiers[currentTierIndex];
  const progress = Math.min(100, ((currentPoints - currentTier.min) / (nextTier.min - currentTier.min)) * 100);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Rewards</h1>
      </div>
      <p style={S.subtitle}>Earn points, unlock tiers, and redeem rewards</p>

      <div style={S.pointsHero}>
        <div style={S.pointsLabel}>Points Balance</div>
        <div style={S.pointsValue}>4,750</div>
        <div style={S.pointsSub}>+620 earned this week · Streak: 4 days</div>
      </div>

      <div style={{ ...S.sectionTitle }}>Daily Check-in Streak</div>
      <div style={S.card}>
        <div style={S.streakGrid}>
          {streakDays.map((d) => (
            <StreakDayItem key={d.day} item={d} />
          ))}
        </div>
      </div>

      <div style={{ ...S.sectionTitle }}>Referral Earnings</div>
      <div style={S.referralCard}>
        <div style={S.referralLink}>
          <span style={S.referralUrl}>https://vixor.io/ref/VXDR7K2</span>
          <button style={S.copyBtn}>Copy</button>
        </div>
        <div style={S.referralStats}>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#3B82F6" }}>12</div>
            <div style={S.refStatLabel}>Total Referrals</div>
          </div>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#22C55E" }}>8</div>
            <div style={S.refStatLabel}>Active</div>
          </div>
          <div style={S.refStat}>
            <div style={{ ...S.refStatValue, color: "#F59E0B" }}>2.4 SOL</div>
            <div style={S.refStatLabel}>Earned</div>
          </div>
        </div>
      </div>

      <div style={{ ...S.sectionTitle }}>Rewards Tier</div>
      <div style={S.tierCard}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#F0F4FC" }}>Current: <span style={{ color: "#A0AEC0" }}>Silver</span></span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#F0F4FC" }}>Next: <span style={{ color: "#F59E0B" }}>Gold</span></span>
        </div>
        <div style={S.tierBar}>
          {tiers.map((t, i) => {
            let fillPct = 0;
            let fillBg = t.color;
            if (i < currentTierIndex) { fillPct = 100; fillBg = t.color; }
            else if (i === currentTierIndex) { fillPct = progress; fillBg = t.color; }
            return (
              <div key={t.name} style={{ ...S.tierSegment, borderRight: i < tiers.length - 1 ? "2px solid #0f1424" : "none" }}>
                <div style={{ ...S.tierSegmentFill, width: `${fillPct}%`, background: fillBg, opacity: fillPct > 0 ? 0.3 : 0 }} />
              </div>
            );
          })}
        </div>
        <div style={S.tierLabels}>
          {tiers.map((t) => (
            <span key={t.name} style={{ ...S.tierLabel, color: t.color }}>{t.name}</span>
          ))}
        </div>
        <div style={S.tierProgress}>4,750 / 5,000 pts to Gold — {progress.toFixed(0)}%</div>
      </div>

      <div style={{ ...S.sectionTitle }}>Available Rewards</div>
      <div style={S.rewardGrid}>
        {rewards.map((r) => (
          <RewardItem key={r.name} item={r} />
        ))}
      </div>
    </div>
  );
}