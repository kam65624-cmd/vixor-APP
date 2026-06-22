import { memo } from "react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({ meta: [{ title: "Referral Program — Vixor" }] }),
  component: ReferralPage,
});

const S = {
  page: { background: "#0f1424", color: "#F0F4FC", fontFamily: "'Inter', system-ui, sans-serif", minHeight: "100vh", padding: "20px" },
  header: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" },
  title: { fontSize: "22px", fontWeight: 700, color: "#F0F4FC", margin: 0 },
  subtitle: { fontSize: "12px", color: "#7B8BA8", marginTop: "4px", marginBottom: "20px" },
  heroCard: { background: "linear-gradient(135deg, rgba(59,130,246,0.12) 0%, rgba(59,130,246,0.03) 100%)", borderRadius: "16px", border: "1px solid rgba(59,130,246,0.15)", padding: "32px", marginBottom: "24px", textAlign: "center" as const, position: "relative" as const, overflow: "hidden" },
  heroTitle: { fontSize: "20px", fontWeight: 700, color: "#F0F4FC", marginBottom: "6px" },
  heroSub: { fontSize: "13px", color: "#7B8BA8" },
  codeCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "24px" },
  codeLabel: { fontSize: "11px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "10px" },
  codeRow: { display: "flex", alignItems: "center", gap: "10px" },
  codeBox: { flex: 1, background: "#1a2035", borderRadius: "10px", padding: "14px 18px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontSize: "16px", fontWeight: 700, color: "#F0F4FC", letterSpacing: "0.1em", border: "1px solid rgba(255,255,255,0.06)" },
  copyBtn: { padding: "14px 20px", borderRadius: "10px", border: "none", cursor: "pointer", background: "rgba(59,130,246,0.15)", color: "#60A5FA", fontSize: "12px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", whiteSpace: "nowrap" as const },
  shareBtn: { width: "100%", padding: "14px", borderRadius: "10px", border: "none", cursor: "pointer", background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff", fontSize: "13px", fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif", marginTop: "12px" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" },
  statCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", textAlign: "center" as const },
  statValue: { fontSize: "24px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", marginBottom: "4px" },
  statLabel: { fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableWrap: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "24px" },
  tableHeader: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", fontWeight: 700, color: "#4A5568", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  tableRow: { display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)" },
  colRank: { width: "45px", fontSize: "13px", fontWeight: 700, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" },
  colName: { width: "140px", fontSize: "12px", fontWeight: 600, color: "#F0F4FC" },
  colReferred: { width: "100px", textAlign: "center" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", color: "#7B8BA8" },
  colEarned: { width: "110px", textAlign: "right" as const, fontSize: "12px", fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", fontWeight: 600 },
  colTier: { width: "80px", textAlign: "right" as const },
  stepsCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" },
  stepRow: { display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" },
  stepRowLast: { display: "flex", gap: "16px", alignItems: "flex-start" },
  stepNumber: { width: "32px", height: "32px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, flexShrink: 0 },
  stepTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "4px" },
  stepDesc: { fontSize: "12px", color: "#7B8BA8", lineHeight: 1.6 },
  tierBadge: { fontSize: "10px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px" },
  connector: { width: "2px", height: "16px", background: "rgba(255,255,255,0.06)", marginLeft: "15px" },
};

const referralStats = [
  { label: "Total Referred", value: "24", color: "#3B82F6" },
  { label: "Active Referrals", value: "18", color: "#22C55E" },
  { label: "Earned SOL", value: "6.2", color: "#F59E0B" },
  { label: "Earned Points", value: "12,000", color: "#60A5FA" },
];

const leaderboardData = [
  { rank: 1, name: "CryptoNova", referred: 47, earned: "14.8 SOL", earnedColor: "#22C55E", tier: "Platinum", tierColor: "#60A5FA" },
  { rank: 2, name: "WhaleAlert", referred: 38, earned: "12.1 SOL", earnedColor: "#22C55E", tier: "Platinum", tierColor: "#60A5FA" },
  { rank: 3, name: "SolMaster", referred: 31, earned: "9.4 SOL", earnedColor: "#22C55E", tier: "Gold", tierColor: "#F59E0B" },
  { rank: 4, name: "MemeQueen", referred: 28, earned: "8.2 SOL", earnedColor: "#22C55E", tier: "Gold", tierColor: "#F59E0B" },
  { rank: 5, name: "DegenKing", referred: 24, earned: "6.2 SOL", earnedColor: "#22C55E", tier: "Silver", tierColor: "#A0AEC0" },
];

const StatCard = memo(function StatCard({ item }: { item: typeof referralStats[0] }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statValue, color: item.color }}>{item.value}</div>
      <div style={S.statLabel}>{item.label}</div>
    </div>
  );
});

const LeaderboardRow = memo(function LeaderboardRow({ item }: { item: typeof leaderboardData[0] }) {
  return (
    <div style={S.tableRow}>
      <div style={{ ...S.colRank, color: item.rank <= 3 ? "#F59E0B" : "#7B8BA8" }}>#{item.rank}</div>
      <div style={S.colName}>{item.name}</div>
      <div style={S.colReferred}>{item.referred} users</div>
      <div style={{ ...S.colEarned, color: item.earnedColor }}>{item.earned}</div>
      <div style={S.colTier}>
        <span style={{ ...S.tierBadge, background: `${item.tierColor}18`, color: item.tierColor }}>{item.tier}</span>
      </div>
    </div>
  );
});

function ReferralPage() {
  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Referral Program</h1>
      </div>
      <p style={S.subtitle}>Invite friends and earn rewards together</p>

      <div style={S.heroCard}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚀</div>
        <div style={S.heroTitle}>Invite Friends, Earn Rewards</div>
        <div style={S.heroSub}>Get +25 pts for every referral · +15 pts for them · 10% of their trading points</div>
      </div>

      <div style={S.codeCard}>
        <div style={S.codeLabel}>Your Referral Code</div>
        <div style={S.codeRow}>
          <div style={S.codeBox}>VXDR7K2</div>
          <button style={S.copyBtn}>Copy Code</button>
        </div>
        <button style={S.shareBtn}>Share via Telegram</button>
      </div>

      <div style={S.statsGrid}>
        {referralStats.map((s) => (
          <StatCard key={s.label} item={s} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>Referral Leaderboard</div>
      <div style={S.tableWrap}>
        <div style={S.tableHeader}>
          <div style={{ ...S.colRank, color: "#4A5568" }}>#</div>
          <div style={{ ...S.colName, color: "#4A5568" }}>User</div>
          <div style={{ ...S.colReferred, color: "#4A5568" }}>Referred</div>
          <div style={{ ...S.colEarned, color: "#4A5568" }}>Earned</div>
          <div style={{ ...S.colTier, color: "#4A5568" }}>Tier</div>
        </div>
        {leaderboardData.map((l) => (
          <LeaderboardRow key={l.rank} item={l} />
        ))}
      </div>

      <div style={{ ...S.sectionTitle }}>How It Works</div>
      <div style={S.stepsCard}>
        <div style={S.stepRow}>
          <div style={S.stepNumber}>1</div>
          <div>
            <div style={S.stepTitle}>Share Your Referral Code</div>
            <div style={S.stepDesc}>Copy your unique code and share it with friends via Telegram, Twitter, or any social platform. Each friend who signs up with your code becomes your referral.</div>
          </div>
        </div>
        <div style={S.connector} />
        <div style={S.stepRow}>
          <div style={S.stepNumber}>2</div>
          <div>
            <div style={S.stepTitle}>Friends Sign Up & Trade</div>
            <div style={S.stepDesc}>When your referral creates an account and makes their first trade, both of you earn bonus points. You earn 10% of their trading points as a bonus on top.</div>
          </div>
        </div>
        <div style={S.connector} />
        <div style={S.stepRowLast}>
          <div style={S.stepNumber}>3</div>
          <div>
            <div style={S.stepTitle}>Earn SOL & Climb Tiers</div>
            <div style={S.stepDesc}>As your referrals grow, you earn SOL rewards and climb through referral tiers (Bronze → Silver → Gold → Platinum) for increasingly better perks and multipliers.</div>
          </div>
        </div>
      </div>
    </div>
  );
}