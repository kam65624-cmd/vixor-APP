/**
 * VIXOR — ECHO Stats Panel
 * =========================
 * Surfaces aggregate stats from /api/echo-stats directly on the ECHO page.
 * Reuses existing design tokens (CSS variables) and patterns.
 *
 * Shows:
 *   - Daily loop today status (morning / session / review)
 *   - Current streak with flame indicator
 *   - Win rate progress bar
 *   - Signal tracking breakdown (TP1/TP2/TP3)
 *   - Net P&L
 *
 * Graceful degradation: shows "—" if /api/echo-stats is unavailable.
 */

import { useQuery } from "@tanstack/react-query";
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Target,
  CheckCircle2,
  Circle,
  Loader2,
} from "lucide-react";

// ── Types matching /api/echo-stats response ──────────────────────────────────

interface EchoStatsResponse {
  signalTracking: {
    active: number;
    total: number;
    hitTp1: number;
    hitTp2: number;
    hitTp3: number;
    stopped: number;
    invalidated: number;
  };
  trades: {
    total: number;
    closed: number;
    wins: number;
    losses: number;
    netPnl: number;
    winRate: number;
    bestTradePnl: number;
    worstTradePnl: number;
    last7Days: number;
  };
  dailyLoop: {
    todayCompleted: boolean;
    todayPrep: boolean;
    todaySession: boolean;
    todayReview: boolean;
    totalDays: number;
    completedDays: number;
    currentStreak: number;
    longestStreak: number;
  };
  watchlist: { count: number; alertsEnabled: number };
  notes: { total: number; recentWeek: number };
  fetchedAt: string;
  degraded: boolean;
}

// ── Sub-component: Loop phases row ──────────────────────────────────────────

function LoopPhase({ label, done }: { label: string; done: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        color: done ? "var(--color-bullish)" : "var(--color-muted-foreground)",
      }}
    >
      {done ? <CheckCircle2 size={13} /> : <Circle size={13} />}
      {label}
    </div>
  );
}

// ── Sub-component: Stat tile ────────────────────────────────────────────────

function StatTile({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "bullish" | "bearish" | "neutral";
}) {
  const color =
    tone === "bullish"
      ? "var(--color-bullish)"
      : tone === "bearish"
        ? "var(--color-bearish)"
        : "var(--color-foreground)";

  return (
    <div
      style={{
        flex: 1,
        minWidth: 100,
        padding: 12,
        borderRadius: 8,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        gap: 4,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "var(--color-muted-foreground)",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color,
          fontVariantNumeric: "tabular-nums",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {hint && (
        <div
          style={{
            fontSize: 10,
            color: "var(--color-muted-foreground)",
          }}
        >
          {hint}
        </div>
      )}
    </div>
  );
}

// ── Sub-component: Win rate bar ─────────────────────────────────────────────

function WinRateBar({ rate }: { rate: number }) {
  const clamped = Math.max(0, Math.min(100, rate));
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          flex: 1,
          height: 6,
          background: "var(--color-muted)",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background:
              clamped >= 50
                ? "linear-gradient(90deg, var(--color-bullish), color-mix(in srgb, var(--color-bullish) 70%, white))"
                : "linear-gradient(90deg, var(--color-bearish), color-mix(in srgb, var(--color-bearish) 70%, white))",
            transition: "width 300ms ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--color-foreground)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 40,
          textAlign: "right",
        }}
      >
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function EchoStatsPanel() {
  const { data, isPending, isError } = useQuery<EchoStatsResponse>({
    queryKey: ["echo-stats"],
    queryFn: async () => {
      const res = await fetch("/api/echo-stats", {
        credentials: "include",
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as EchoStatsResponse;
    },
    staleTime: 60_000,
    refetchInterval: 180_000,
    retry: 1,
  });

  // Loading state
  if (isPending) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          color: "var(--color-muted-foreground)",
          fontSize: 12,
        }}
      >
        <Loader2 size={14} className="animate-spin" />
        Loading aggregate stats…
      </div>
    );
  }

  // Error / unavailable — fail soft, do not block the page
  if (isError || !data) {
    return (
      <div
        style={{
          padding: 14,
          borderRadius: 10,
          background: "var(--color-card)",
          border: "1px dashed var(--color-border)",
          color: "var(--color-muted-foreground)",
          fontSize: 11,
          textAlign: "center",
        }}
      >
        Aggregate stats unavailable. Timeline below is still up to date.
      </div>
    );
  }

  const { signalTracking, trades, dailyLoop } = data;

  // P&L color
  const pnlTone: "bullish" | "bearish" | "neutral" =
    trades.netPnl > 0 ? "bullish" : trades.netPnl < 0 ? "bearish" : "neutral";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 16,
        borderRadius: 12,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      {/* ── Header: streak + today phases ─────────────────────────── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 10px",
              borderRadius: 999,
              background:
                dailyLoop.currentStreak > 0
                  ? "color-mix(in srgb, var(--color-bullish) 14%, transparent)"
                  : "var(--color-muted)",
              color:
                dailyLoop.currentStreak > 0
                  ? "var(--color-bullish)"
                  : "var(--color-muted-foreground)",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Flame size={14} />
            {dailyLoop.currentStreak}-day streak
            {dailyLoop.longestStreak > 0 && dailyLoop.longestStreak > dailyLoop.currentStreak && (
              <span style={{ opacity: 0.6, fontWeight: 500 }}>
                (best {dailyLoop.longestStreak})
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--color-muted-foreground)",
            }}
          >
            {dailyLoop.completedDays} / {dailyLoop.totalDays} days completed
          </div>
        </div>

        {/* Today's phases */}
        <div style={{ display: "flex", gap: 12 }}>
          <LoopPhase label="Prep" done={dailyLoop.todayPrep} />
          <LoopPhase label="Session" done={dailyLoop.todaySession} />
          <LoopPhase label="Review" done={dailyLoop.todayReview} />
        </div>
      </div>

      {/* ── Stat tiles row ─────────────────────────────────────────── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <StatTile
          label="Net P&L"
          value={`${trades.netPnl >= 0 ? "+" : ""}${trades.netPnl.toFixed(2)}`}
          hint={`${trades.closed} closed trades`}
          tone={pnlTone}
        />
        <StatTile
          label="Win Rate"
          value={`${trades.winRate.toFixed(0)}%`}
          hint={`${trades.wins}W / ${trades.losses}L`}
          tone={trades.winRate >= 50 ? "bullish" : "bearish"}
        />
        <StatTile
          label="Active Signals"
          value={String(signalTracking.active)}
          hint={`${signalTracking.total} total`}
        />
        <StatTile
          label="Notes (7d)"
          value={String(data.notes.recentWeek)}
          hint={`${data.notes.total} all-time`}
        />
      </div>

      {/* ── Win rate bar + signal tracking breakdown ─────────────── */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
            }}
          >
            <span>Trade win rate</span>
            <span>
              {trades.wins} wins / {trades.last7Days} trades in last 7 days
            </span>
          </div>
          <WinRateBar rate={trades.winRate} />
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "var(--color-muted-foreground)",
              marginBottom: 6,
            }}
          >
            <span>Signal lifecycle</span>
            <span>{signalTracking.total} tracked</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 11,
            }}
          >
            <SignalBadge
              icon={Target}
              label="TP1"
              count={signalTracking.hitTp1}
              color="var(--color-bullish)"
            />
            <SignalBadge
              icon={Target}
              label="TP2"
              count={signalTracking.hitTp2}
              color="var(--color-bullish)"
            />
            <SignalBadge
              icon={Target}
              label="TP3"
              count={signalTracking.hitTp3}
              color="var(--color-bullish)"
            />
            <SignalBadge
              icon={TrendingDown}
              label="Stopped"
              count={signalTracking.stopped}
              color="var(--color-bearish)"
            />
            <SignalBadge
              icon={TrendingUp}
              label="Invalidated"
              count={signalTracking.invalidated}
              color="var(--color-muted-foreground)"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Helper: Signal badge ───────────────────────────────────────────────────

function SignalBadge({
  icon: Icon,
  label,
  count,
  color,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 8px",
        borderRadius: 6,
        background: `color-mix(in srgb, ${color} 8%, transparent)`,
        color,
        fontSize: 10,
        fontWeight: 600,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <Icon size={11} />
      {label} {count}
    </div>
  );
}
