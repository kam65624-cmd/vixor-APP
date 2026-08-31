import { memo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getUserProfile, getUserPoints } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import {
  PageLayout,
  PageScrollArea,
  StatsRow,
  PageSectionTitle,
  DataRow,
  PageBadge,
} from "@/components/vixor/PageLayout";
import { Lock } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface BadgeItem {
  id: string;
  icon: string;
  name: string;
  desc: string;
  unlocked: boolean;
}

interface RecentTrade {
  id: string;
  pair: string;
  dir: "LONG" | "SHORT";
  pnl: number;
  date: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LEVEL_TITLES = ["Scout", "Analyst", "Expert", "Master", "Legend"];

const TRADER_BADGES: BadgeItem[] = [
  { id: "first-win", icon: "🏆", name: "First Win", desc: "Closed first profitable trade", unlocked: true },
  { id: "streak-3", icon: "🔥", name: "3-Day Streak", desc: "Traded 3 consecutive days", unlocked: true },
  { id: "chart-master", icon: "📊", name: "Chart Master", desc: "Used chart signals 10x", unlocked: true },
  { id: "signal-hunter", icon: "🎯", name: "Signal Hunter", desc: "Followed 20 trade signals", unlocked: true },
  { id: "whale-watch", icon: "🐋", name: "Whale Watcher", desc: "Tracked 5 whale moves", unlocked: false },
  { id: "elite", icon: "👑", name: "Elite Trader", desc: "Reach Master rank", unlocked: false },
  { id: "century", icon: "💯", name: "Century Club", desc: "Execute 100 trades", unlocked: false },
  { id: "legend", icon: "⚡", name: "Legend", desc: "Reach Legend rank", unlocked: false },
];

const RECENT_ACTIVITY: RecentTrade[] = [
  { id: "r1", pair: "BTC/USDT", dir: "LONG", pnl: +420, date: "Aug 31" },
  { id: "r2", pair: "ETH/USDT", dir: "SHORT", pnl: -85, date: "Aug 31" },
  { id: "r3", pair: "SOL/USDT", dir: "LONG", pnl: +310, date: "Aug 30" },
  { id: "r4", pair: "BNB/USDT", dir: "LONG", pnl: +178, date: "Aug 30" },
  { id: "r5", pair: "XRP/USDT", dir: "SHORT", pnl: -42, date: "Aug 29" },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function pnlColor(val: number) {
  return val >= 0 ? "var(--color-bullish)" : "var(--color-bearish)";
}
function pnlSign(val: number) {
  return val >= 0 ? "+" : "";
}
function formatMoney(val: number) {
  return `${pnlSign(val)}$${Math.abs(val).toLocaleString()}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Trader Profile — VIXOR" }] }),
  component: TraderProfile,
});

function TraderProfile() {
  const navigate = useNavigate();
  const fetchProfile = useStableServerFn(getUserProfile);
  const fetchPoints = useStableServerFn(getUserPoints);

  const profileQuery = useQuery({
    queryKey: ["profile-vixor"],
    queryFn: () => fetchProfile({}),
    staleTime: 60_000,
  });

  const pointsQuery = useQuery({
    queryKey: ["points-vixor"],
    queryFn: () => fetchPoints({}),
    staleTime: 60_000,
  });

  const profileData = profileQuery.data;
  const points = pointsQuery.data;

  // Derived values
  const xp = points?.balance ?? 2_450;
  const levelIndex = Math.min(Math.floor(xp / 1000), LEVEL_TITLES.length - 1);
  const levelTitle = LEVEL_TITLES[levelIndex] ?? "Scout";
  const xpInLevel = xp % 1000;
  const xpPct = Math.min(100, (xpInLevel / 1000) * 100);
  const username = profileData?.profile?.username ?? profileData?.profile?.display_name ?? "Trader";
  const initials = username.slice(0, 2).toUpperCase();

  const tradingStats = [
    { label: "Total Trades", value: "143", icon: "📊", color: "var(--color-foreground)" },
    { label: "Win Rate", value: "72%", icon: "🎯", color: "var(--gold, #F0C419)" },
    { label: "Best Trade", value: "+$850", icon: "🏆", color: "var(--color-bullish)" },
    { label: "Total PnL", value: "+$4,230", icon: "💰", color: "var(--color-bullish)" },
    { label: "Avg Hold", value: "4.2h", icon: "⏱️", color: "var(--color-foreground)" },
    { label: "Streak", value: "5 days", icon: "🔥", color: "var(--color-bearish)" },
  ];

  return (
    <PageLayout
      title="TRADER PROFILE"
      badge={levelTitle.toUpperCase()}
      badgeColor="var(--gold, #F0C419)"
      loading={profileQuery.isLoading}
    >
      <PageScrollArea>
        {/* ── Profile Header ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "var(--color-card)",
            borderBottom: "1px solid var(--color-border)",
            padding: "20px 16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            {/* Avatar */}
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--gold, #F0C419) 0%, #D97706 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                border: "2px solid color-mix(in srgb, var(--gold, #F0C419) 40%, transparent)",
              }}
            >
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 800,
                  color: "#000",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {initials}
              </span>
            </div>

            {/* Name + Level */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "var(--color-foreground)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {username}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <PageBadge label={`Level ${levelIndex + 1}`} color="var(--gold, #F0C419)" small />
                <span style={{ fontSize: "12px", color: "var(--color-muted-foreground)" }}>
                  {levelTitle} Trader
                </span>
              </div>
            </div>
          </div>

          {/* XP Bar */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "6px",
              }}
            >
              <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)", letterSpacing: "0.05em" }}>
                XP PROGRESS
              </span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--gold, #F0C419)",
                }}
              >
                {xpInLevel.toLocaleString()} / 1,000 XP
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "var(--color-border)",
                borderRadius: "3px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${xpPct}%`,
                  height: "100%",
                  background: "linear-gradient(90deg, var(--gold, #F0C419) 0%, #D97706 100%)",
                  borderRadius: "3px",
                  transition: "width 0.8s ease",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "4px",
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
              }}
            >
              <span>{levelTitle}</span>
              <span>{LEVEL_TITLES[levelIndex + 1] ?? "Max Rank"}</span>
            </div>
          </div>
        </div>

        {/* ── Trading Stats ──────────────────────────────────────────────── */}
        <StatsRow stats={tradingStats.slice(0, 4)} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1px",
            background: "var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {tradingStats.slice(4).map((s) => (
            <div key={s.label} style={{ background: "var(--color-card)", padding: "10px 16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)", letterSpacing: "0.04em", marginBottom: "3px" }}>
                {s.icon} {s.label}
              </div>
              <div style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── Badges ────────────────────────────────────────────────────── */}
        <PageSectionTitle title="Trader Badges" count={TRADER_BADGES.filter((b) => b.unlocked).length} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1px",
            background: "var(--color-border)",
            borderBottom: "1px solid var(--color-border)",
          }}
        >
          {TRADER_BADGES.map((badge) => (
            <div
              key={badge.id}
              title={badge.desc}
              style={{
                background: "var(--color-card)",
                padding: "12px 8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                opacity: badge.unlocked ? 1 : 0.4,
                position: "relative",
              }}
            >
              {!badge.unlocked && (
                <div
                  style={{
                    position: "absolute",
                    top: "6px",
                    right: "6px",
                  }}
                >
                  <Lock size={10} color="var(--color-muted-foreground)" />
                </div>
              )}
              <span style={{ fontSize: "22px" }}>{badge.icon}</span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color: badge.unlocked ? "var(--gold, #F0C419)" : "var(--color-muted-foreground)",
                  textAlign: "center",
                  letterSpacing: "0.03em",
                  lineHeight: 1.2,
                }}
              >
                {badge.name}
              </span>
              {badge.unlocked && (
                <div
                  style={{
                    width: "4px",
                    height: "4px",
                    borderRadius: "50%",
                    background: "var(--gold, #F0C419)",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* ── Recent Activity ────────────────────────────────────────────── */}
        <PageSectionTitle title="Recent Activity" count={RECENT_ACTIVITY.length} />
        {RECENT_ACTIVITY.map((trade) => (
          <DataRow key={trade.id} leftAccent={trade.pnl >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--color-foreground)" }}>
                    {trade.pair}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "3px" }}>
                    <PageBadge label={trade.dir} color={trade.dir === "LONG" ? "var(--color-bullish)" : "var(--color-bearish)"} small />
                    <span style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>{trade.date}</span>
                  </div>
                </div>
              </div>
              <span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)", color: pnlColor(trade.pnl) }}>
                {formatMoney(trade.pnl)}
              </span>
            </div>
          </DataRow>
        ))}

        {/* Bottom clearance */}
        <div style={{ height: "28px" }} />
      </PageScrollArea>
    </PageLayout>
  );
}

export default TraderProfile;
