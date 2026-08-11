// ── Performance Panel ────────────────────────────────────────────
// Shows trading performance metrics: win rate gauge, stats, trade history,
// best/worst trade callouts.
// ─────────────────────────────────────────────────────────────────────────

import { memo } from "react";
import type { TradingPerformance } from "@/domains/trades/performance";

// ── Types ─────────────────────────────────────────────────────────────────

interface PerformancePanelProps {
  performance: TradingPerformance | null;
  isLoading: boolean;
}

// ── Panel ─────────────────────────────────────────────────────────────────

export const PerformancePanel = memo(function PerformancePanel({
  performance,
  isLoading,
}: PerformancePanelProps) {
  if (isLoading) {
    return (
      <div style={{ padding: "16px" }}>
        <div
          className="shimmer"
          style={{ height: "80px", borderRadius: "12px", marginBottom: "10px" }}
        />
        <div
          className="shimmer"
          style={{ height: "120px", borderRadius: "12px", marginBottom: "10px" }}
        />
        <div className="shimmer" style={{ height: "60px", borderRadius: "12px" }} />
      </div>
    );
  }

  if (!performance || performance.totalTrades === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 20px",
          background: "var(--color-card)",
          flex: 1,
        }}
      >
        <span style={{ fontSize: "28px", opacity: 0.4 }}>📊</span>
        <div
          style={{
            fontSize: "13px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            marginTop: "8px",
          }}
        >
          No Performance Data
        </div>
        <div
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
            textAlign: "center",
            maxWidth: "280px",
            lineHeight: 1.5,
            marginTop: "4px",
          }}
        >
          Track signals and wait for them to resolve to see your performance metrics here.
        </div>
      </div>
    );
  }

  const p = performance;
  const winRateColor =
    p.winRate >= 60
      ? "var(--color-bullish)"
      : p.winRate >= 40
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";
  const pfColor =
    p.profitFactor >= 2
      ? "var(--color-bullish)"
      : p.profitFactor >= 1
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* ── Stat Cards (2x2 grid) ─────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px",
        }}
      >
        <StatCard
          label="Win Rate"
          value={`${p.winRate.toFixed(1)}%`}
          color={winRateColor}
          icon="🎯"
        />
        <StatCard
          label="Profit Factor"
          value={p.profitFactor === Infinity ? "∞" : `${p.profitFactor.toFixed(2)}x`}
          color={pfColor}
          icon="💎"
        />
        <StatCard
          label="Total Trades"
          value={String(p.totalTrades)}
          color="var(--color-foreground)"
          icon="📊"
        />
        <StatCard
          label="Avg Duration"
          value={
            p.avgDurationHours < 1
              ? `${Math.round(p.avgDurationHours * 60)}m`
              : p.avgDurationHours < 24
                ? `${p.avgDurationHours.toFixed(1)}h`
                : `${(p.avgDurationHours / 24).toFixed(1)}d`
          }
          color="var(--color-foreground)"
          icon="⏱"
        />
      </div>

      {/* ── Win Rate Bar ──────────────────────────────────────── */}
      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--color-foreground)" }}>
            Win Rate
          </span>
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              fontFamily: "var(--font-mono)",
              color: winRateColor,
            }}
          >
            {p.winRate.toFixed(1)}%
          </span>
        </div>
        <div
          style={{
            height: "8px",
            borderRadius: "4px",
            background: "var(--color-border)",
            overflow: "hidden",
            display: "flex",
          }}
        >
          <div
            style={{
              width: `${p.winRate}%`,
              height: "100%",
              background: winRateColor,
              borderRadius: "4px",
              transition: "width 0.5s ease",
            }}
          />
          <div
            style={{
              flex: 1,
              height: "100%",
              background: "var(--color-bearish)",
              opacity: 0.4,
              borderRadius: "4px",
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
          <span style={{ color: "var(--color-bullish)", fontWeight: 600 }}>Wins</span>
          <span style={{ color: "var(--color-bearish)", fontWeight: 600 }}>Losses</span>
        </div>
      </div>

      {/* ── Avg Win/Loss P&L ──────────────────────────────────── */}
      <div
        style={{
          padding: "12px",
          borderRadius: "12px",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
        }}
      >
        <MiniStat
          label="Avg Win"
          value={`+${p.avgWinPct.toFixed(2)}%`}
          color="var(--color-bullish)"
        />
        <MiniStat
          label="Avg Loss"
          value={`${p.avgLossPct.toFixed(2)}%`}
          color="var(--color-bearish)"
        />
        <MiniStat
          label="Total P&L"
          value={`${p.totalPnlPct >= 0 ? "+" : ""}${p.totalPnlPct.toFixed(2)}%`}
          color={p.totalPnlPct >= 0 ? "var(--color-bullish)" : "var(--color-bearish)"}
        />
      </div>

      {/* ── Best / Worst Trade Callouts ───────────────────────── */}
      {(p.bestTrade || p.worstTrade) && (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {p.bestTrade && (
            <TradeCallout
              label="Best Trade"
              pair={p.bestTrade.pair}
              pnlPct={p.bestTrade.pnlPct}
              isBest
            />
          )}
          {p.worstTrade && (
            <TradeCallout
              label="Worst Trade"
              pair={p.worstTrade.pair}
              pnlPct={p.worstTrade.pnlPct}
              isBest={false}
            />
          )}
        </div>
      )}
    </div>
  );
});

export default PerformancePanel;

// ── Stat Card (small) ────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: string;
}) {
  return (
    <div
      style={{
        padding: "12px",
        borderRadius: "12px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "4px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        <span>{icon}</span>
        {label}
      </div>
      <div
        style={{
          fontSize: "18px",
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color,
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Mini stat for row ────────────────────────────────────────────────────

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

// ── Trade Callout Card ───────────────────────────────────────────────────

function TradeCallout({
  label,
  pair,
  pnlPct,
  isBest,
}: {
  label: string;
  pair: string;
  pnlPct: number;
  isBest: boolean;
}) {
  const color = isBest ? "var(--color-bullish)" : "var(--color-bearish)";

  return (
    <div
      style={{
        padding: "12px 14px",
        borderRadius: "12px",
        background: `${color}08`,
        border: `1px solid ${color}20`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: "2px",
          }}
        >
          {isBest ? "🏆" : "📉"} {label}
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--color-foreground)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {pair}
        </div>
      </div>
      <span
        style={{
          fontSize: "16px",
          fontWeight: 800,
          fontFamily: "var(--font-mono)",
          color,
        }}
      >
        {pnlPct >= 0 ? "+" : ""}
        {pnlPct.toFixed(2)}%
      </span>
    </div>
  );
}
