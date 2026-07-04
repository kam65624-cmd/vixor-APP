import { useState, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getReferralData } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout, 
  StatsRow,
  SectionTitle,
  EmptyState,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/referral")({
  head: () => ({ meta: [{ title: "Referral Program — Vixor" }] }),
  component: ReferralPage,
});

const STEPS = [
  {
    num: "1",
    title: "Share Your Referral Code",
    desc: "Copy your unique code and share it with friends via Telegram, Twitter, or any social platform. Each friend who signs up with your code becomes your referral.",
  },
  {
    num: "2",
    title: "Friends Sign Up & Trade",
    desc: "When your referral creates an account and makes their first trade, both of you earn bonus points. You earn 10% of their trading points as a bonus on top.",
  },
  {
    num: "3",
    title: "Earn Points & Climb Tiers",
    desc: "As your referrals grow, you earn points rewards and climb through referral tiers (Bronze → Silver → Gold → Platinum) for increasingly better perks and multipliers.",
  },
] as const;

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

  const referralUrl = `https://vixor-app.vercel.app/ref/${referralCode}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [referralUrl]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
    } catch {
      // Silent fail — code is visible on screen
    }
  }, [referralCode]);

  const handleShare = useCallback(() => {
    const text = `Join me on Vixor! Use my referral code: ${referralCode}`;
    const url = `https://t.me/share/url?url=https://vixor-app.vercel.app&text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  }, [referralCode]);

  return (
    <PageLayout
      title="Referral Program"
      badge="REFERRAL"
      badgeColor={"var(--color-bullish)"}
      description="Invite friends and earn rewards together"
      loading={refQuery.isLoading}
      loadingColor={"var(--color-bullish)"}
    >
      <ScrollArea>
        {/* ── Hero Card ── */}
        <div
          style={{
            background: `linear-gradient(135deg, ${"var(--color-bullish)"}1F 0%, ${"var(--color-bullish)"}08 100%)`,
            borderRadius: "12px",
            border: `1px solid ${"var(--color-bullish)"}26`,
            padding: "24px 16px",
            margin: "12px 16px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "36px", marginBottom: "10px" }}>🚀</div>
          <div
            style={{
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              marginBottom: "4px",
            }}
          >
            Welcome back, {username}!
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              lineHeight: 1.5,
            }}
          >
            Get +25 pts for every referral · +15 pts for them · 10% of their trading points
          </div>
        </div>

        {/* ── Referral Code Card ── */}
        <div
          style={{
            background: "var(--color-card-hover)",
            borderRadius: "12px",
            border: `1px solid ${"var(--color-border)"}`,
            padding: "16px",
            margin: "0 16px 12px",
          }}
        >
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--color-muted-foreground)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "10px",
            }}
          >
            Your Referral Code
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                flex: 1,
                minWidth: "160px",
                background: "var(--color-card)",
                borderRadius: "8px",
                padding: "12px 16px",
                fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace",
                fontSize: "15px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                letterSpacing: "0.1em",
                border: `1px solid ${"var(--color-border)"}`,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {referralCode}
            </div>
            <button
              onClick={handleCopy}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: `${"var(--color-bullish)"}26`,
                color: "var(--color-primary)",
                fontSize: "11px",
                fontWeight: 700,
                fontFamily: "'Inter', system-ui, sans-serif",
                whiteSpace: "nowrap",
                transition: "background 0.15s ease",
              }}
            >
              {copied ? "✓ Copied Link" : "Copy Link"}
            </button>
          </div>
          <button
            onClick={handleShare}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              background: "var(--color-bullish)",
              color: "var(--color-foreground)",
              fontSize: "12px",
              fontWeight: 700,
              fontFamily: "'Inter', system-ui, sans-serif",
              marginTop: "10px",
              transition: "opacity 0.15s ease",
            }}
          >
            Share via Telegram
          </button>
        </div>

        {/* ── Stats Row ── */}
        <StatsRow
          stats={[
            {
              label: "Total Referred",
              value: String(referredCount),
              color: "var(--color-bullish)",
              icon: "👥",
            },
            {
              label: "Earned Points",
              value: earnedPoints.toLocaleString(),
              color: "var(--color-primary)",
              icon: "⭐",
            },
            {
              label: "Streak",
              value: `${streakDays}d`,
              color: "var(--color-neutral-wait)",
              icon: "🔥",
            },
          ]}
        />

        {/* ── Empty State (only when no referrals) ── */}
        {referredCount === 0 && (
          <EmptyState
            icon="🔗"
            title="No referrals yet"
            message="Share your referral code with friends to start earning points. You get +25 pts for each friend who signs up, and they get +15 pts too!"
          />
        )}

        {/* ── How It Works ── */}
        <SectionTitle title="How It Works" />
        <div style={{ padding: "16px" }}>
          <div
            style={{
              background: "var(--color-card-hover)",
              borderRadius: "12px",
              border: `1px solid ${"var(--color-border)"}`,
              padding: "20px 16px",
            }}
          >
            {STEPS.map((step, i) => (
              <div key={step.num}>
                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      background: `${"var(--color-bullish)"}26`,
                      color: "var(--color-bullish)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "13px",
                      fontWeight: 800,
                      flexShrink: 0,
                    }}
                  >
                    {step.num}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "var(--color-foreground)",
                        marginBottom: "3px",
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--color-muted-foreground)",
                        lineHeight: 1.6,
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    style={{
                      width: "2px",
                      height: "12px",
                      background: "var(--color-border)",
                      marginLeft: "13px",
                      marginBottom: "4px",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </PageLayout>
  );
}
