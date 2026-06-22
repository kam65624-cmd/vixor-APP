import { memo, useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReferralData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";

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
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" },
  statCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "18px", textAlign: "center" as const },
  statValue: { fontSize: "24px", fontWeight: 800, fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace", marginBottom: "4px" },
  statLabel: { fontSize: "10px", fontWeight: 600, color: "#7B8BA8", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  sectionTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "14px", textTransform: "uppercase" as const, letterSpacing: "0.05em" },
  stepsCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" },
  stepRow: { display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "20px" },
  stepRowLast: { display: "flex", gap: "16px", alignItems: "flex-start" },
  stepNumber: { width: "32px", height: "32px", borderRadius: "10px", background: "rgba(59,130,246,0.15)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: 800, flexShrink: 0 },
  stepTitle: { fontSize: "13px", fontWeight: 700, color: "#F0F4FC", marginBottom: "4px" },
  stepDesc: { fontSize: "12px", color: "#7B8BA8", lineHeight: 1.6 },
  connector: { width: "2px", height: "16px", background: "rgba(255,255,255,0.06)", marginLeft: "15px" },
  emptyCard: { background: "#161b2e", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.06)", padding: "32px", textAlign: "center" as const, marginBottom: "24px" },
  emptyIcon: { fontSize: "32px", marginBottom: "12px" },
  emptyTitle: { fontSize: "15px", fontWeight: 700, color: "#F0F4FC", marginBottom: "6px" },
  emptyDesc: { fontSize: "12px", color: "#7B8BA8", lineHeight: 1.6, maxWidth: "360px", margin: "0 auto" },
  spinnerWrap: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" },
};

const StatCard = memo(function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={S.statCard}>
      <div style={{ ...S.statValue, color }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </div>
  );
});

function Spinner() {
  return (
    <div style={S.spinnerWrap}>
      <svg width="36" height="36" viewBox="0 0 36 36" style={{ animation: "spin 0.8s linear infinite" }}>
        <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="3" />
        <circle cx="18" cy="18" r="14" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray="60 40" strokeLinecap="round" />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </svg>
    </div>
  );
}

function ReferralPage() {
  const fetchRef = useStableServerFn(getReferralData);
  const refQuery = useQuery({
    queryKey: ["referral-data"],
    queryFn: () => fetchRef({}),
    staleTime: 30_000,
  });

  const [copied, setCopied] = useState(false);

  const referralCode = refQuery.data?.referralCode ?? "VIXORXX";
  const referredCount = refQuery.data?.referredCount ?? 0;
  const earnedPoints = refQuery.data?.earnedPoints ?? 0;
  const username = refQuery.data?.username ?? "Trader";
  const streakDays = refQuery.data?.streakDays ?? 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for environments where clipboard API is unavailable
      const ta = document.createElement("textarea");
      ta.value = referralCode;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralCode]);

  const handleShare = useCallback(() => {
    const text = `Join me on Vixor! Use my referral code: ${referralCode}`;
    const url = `https://t.me/share/url?url=https://vixor.app&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [referralCode]);

  if (refQuery.isLoading) {
    return (
      <div style={S.page}>
        <div style={S.header}>
          <h1 style={S.title}>Referral Program</h1>
        </div>
        <Spinner />
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={S.header}>
        <h1 style={S.title}>Referral Program</h1>
      </div>
      <p style={S.subtitle}>Invite friends and earn rewards together</p>

      {/* Hero Card */}
      <div style={S.heroCard}>
        <div style={{ fontSize: "40px", marginBottom: "12px" }}>🚀</div>
        <div style={S.heroTitle}>Welcome back, {username}!</div>
        <div style={S.heroSub}>Get +25 pts for every referral · +15 pts for them · 10% of their trading points</div>
      </div>

      {/* Referral Code Card */}
      <div style={S.codeCard}>
        <div style={S.codeLabel}>Your Referral Code</div>
        <div style={S.codeRow}>
          <div style={S.codeBox}>{referralCode}</div>
          <button style={S.copyBtn} onClick={handleCopy}>
            {copied ? "✓ Copied" : "Copy Code"}
          </button>
        </div>
        <button style={S.shareBtn} onClick={handleShare}>Share via Telegram</button>
      </div>

      {/* Stats Grid */}
      <div style={S.statsGrid}>
        <StatCard label="Total Referred" value={String(referredCount)} color="#3B82F6" />
        <StatCard label="Earned Points" value={earnedPoints.toLocaleString()} color="#22C55E" />
        <StatCard label="Streak" value={`${streakDays}d`} color="#F59E0B" />
      </div>

      {/* Empty State — only show when no referrals yet */}
      {referredCount === 0 && (
        <div style={S.emptyCard}>
          <div style={S.emptyIcon}>🔗</div>
          <div style={S.emptyTitle}>No referrals yet</div>
          <div style={S.emptyDesc}>
            Share your referral code with friends to start earning points. You get +25 pts for each friend who signs up, and they get +15 pts too!
          </div>
        </div>
      )}

      {/* How It Works */}
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
            <div style={S.stepTitle}>Earn Points & Climb Tiers</div>
            <div style={S.stepDesc}>As your referrals grow, you earn points rewards and climb through referral tiers (Bronze → Silver → Gold → Platinum) for increasingly better perks and multipliers.</div>
          </div>
        </div>
      </div>
    </div>
  );
}