// ── Signal Tracking Status Page ────────────────────────────────────────────
// Shows the user's tracked signals with real-time status updates.
// Groups by status: Active, TP Hit, Closed (terminal).
// Shows price progress bars (entry → SL → TP) and MFE/MAE.
// ─────────────────────────────────────────────────────────────────────────────

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useMemo, useState, useCallback } from "react";
import { useSignalTrackings } from "@/domains/signal-tracking/hooks";
import {
  SIGNAL_STATUS_CONFIG,
  TERMINAL_STATUSES,
  INTERMEDIATE_STATUSES,
} from "@/domains/signal-tracking";
import type { SignalTracking } from "@/domains/signal-tracking";
import {
  PageLayout,
  StatsRow,
  SectionTitle,
  EmptyState,
  ScrollArea,
  SkeletonRow,
} from "@/components/vixor/PageLayout";
import { Plus, Target, AlertTriangle, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/tracking")({
  head: () => ({ meta: [{ title: "Signal Tracking — Vixor" }] }),
  component: TrackingPage,
});

// ── Status group definitions ─────────────────────────────────────────────

type StatusGroup = {
  key: string;
  label: string;
  statuses: string[];
  icon: string;
};

const STATUS_GROUPS: StatusGroup[] = [
  { key: "active", label: "Active", statuses: ["pending", "active"], icon: "🎯" },
  {
    key: "tp",
    label: "TP Hit",
    statuses: INTERMEDIATE_STATUSES,
    icon: "✅",
  },
  { key: "closed", label: "Closed", statuses: TERMINAL_STATUSES, icon: "🏁" },
];

// ── Page ─────────────────────────────────────────────────────────────────

function TrackingPage() {
  const navigate = useNavigate();
  const { data: res, isLoading } = useSignalTrackings();
  const trackings = (res as any)?.trackings ?? [];

  const [activeGroup, setActiveGroup] = useState<string>("active");

  // Group trackings by status group
  const grouped = useMemo(() => {
    const map: Record<string, SignalTracking[]> = {
      active: [],
      tp: [],
      closed: [],
    };
    for (const t of trackings) {
      if (t.status === "pending" || t.status === "active") map.active.push(t);
      else if (INTERMEDIATE_STATUSES.includes(t.status as any)) map.tp.push(t);
      else map.closed.push(t);
    }
    return map;
  }, [trackings]);

  const currentTrackings = grouped[activeGroup] ?? [];
  const activeCount = grouped.active.length;
  const tpCount = grouped.tp.length;
  const closedCount = grouped.closed.length;

  return (
    <PageLayout
      title="Signal Tracking"
      badge="TRACKING"
      badgeColor="var(--color-bullish)"
      tabs={STATUS_GROUPS.map((g) => g.label)}
      activeTab={activeGroup}
      onTabChange={setActiveGroup}
      tabCounts={{ Active: activeCount, "TP Hit": tpCount, Closed: closedCount }}
      loading={isLoading}
      loadingColor="var(--color-bullish)"
    >
      <StatsRow
        stats={[
          {
            label: "Total",
            value: String(trackings.length),
            icon: "📡",
            color: "var(--color-foreground)",
          },
          {
            label: "Active",
            value: String(activeCount),
            icon: "🎯",
            color: "var(--color-bullish)",
          },
          { label: "TP Hits", value: String(tpCount), icon: "✅", color: "var(--color-bullish)" },
          {
            label: "Closed",
            value: String(closedCount),
            icon: "🏁",
            color: "var(--color-muted-foreground)",
          },
        ]}
      />

      {/* Track New Signal CTA */}
      <div style={{ padding: "8px 16px" }}>
        <button
          onClick={() => navigate({ to: "/signals" })}
          style={{
            width: "100%",
            height: "40px",
            borderRadius: "10px",
            border: "1px dashed var(--color-border)",
            background: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
            color: "var(--color-primary)",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "6px",
            transition: "all var(--transition-fast)",
          }}
        >
          <Plus size={14} />
          Track New Signal
        </button>
      </div>

      <SectionTitle
        title={STATUS_GROUPS.find((g) => g.key === activeGroup)?.label ?? "Signals"}
        count={currentTrackings.length}
      />

      <ScrollArea>
        {isLoading ? (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        ) : currentTrackings.length > 0 ? (
          currentTrackings.map((t) => <TrackingRow key={t.id} tracking={t} />)
        ) : (
          <EmptyState
            icon={STATUS_GROUPS.find((g) => g.key === activeGroup)?.icon ?? "📭"}
            title="No Signals"
            message={
              activeGroup === "active"
                ? "No actively tracked signals. Go to Signals to track one."
                : activeGroup === "tp"
                  ? "No take-profit hits yet."
                  : "No closed signals yet."
            }
            action={
              activeGroup === "active"
                ? { label: "Go to Signals", onClick: () => navigate({ to: "/signals" }) }
                : undefined
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

// ── Price Progress Bar ────────────────────────────────────────────────────

function PriceProgressBar({
  entry,
  sl,
  tp,
  current,
  direction,
}: {
  entry: number | null;
  sl: number | null;
  tp: number[] | null;
  current: number | null;
  direction: string;
}) {
  if (!entry || !sl || !tp || !current || tp.length === 0) return null;

  const isBuy = direction === "BUY";
  const tpTarget = tp[0]!;

  // Normalize positions: SL = 0%, Entry = some %, TP = 100%
  const slVal = isBuy ? sl : sl; // SL is below entry for BUY, above for SELL
  const totalRange = Math.abs(tpTarget - sl);
  if (totalRange === 0) return null;

  const entryPct = Math.abs((entry - sl) / totalRange) * 100;
  const currentPct = Math.min(100, Math.max(0, Math.abs((current - sl) / totalRange) * 100));

  const isProfitable = isBuy ? current > entry : current < entry;
  const barColor = isProfitable ? "var(--color-bullish)" : "var(--color-bearish)";

  return (
    <div style={{ marginTop: "8px" }}>
      <div
        style={{
          position: "relative",
          height: "6px",
          borderRadius: "3px",
          background: "var(--color-border)",
          overflow: "visible",
        }}
      >
        {/* Entry marker */}
        <div
          style={{
            position: "absolute",
            left: `${entryPct}%`,
            top: "-2px",
            width: "2px",
            height: "10px",
            background: "var(--color-foreground)",
            borderRadius: "1px",
            transform: "translateX(-50%)",
          }}
        />
        {/* Current price marker */}
        <div
          style={{
            position: "absolute",
            left: `${currentPct}%`,
            top: "-1px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: barColor,
            transform: "translateX(-50%)",
            boxShadow: `0 0 6px ${barColor}66`,
            transition: "left 0.5s ease",
          }}
        />
        {/* Fill bar */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: `${currentPct}%`,
            height: "100%",
            borderRadius: "3px",
            background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
            transition: "width 0.5s ease",
          }}
        />
      </div>
      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: "4px",
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <span style={{ color: "var(--color-bearish)" }}>SL {sl.toFixed(entry >= 100 ? 2 : 4)}</span>
        <span>{entry.toFixed(entry >= 100 ? 2 : 4)}</span>
        <span style={{ color: "var(--color-bullish)" }}>
          TP {tpTarget.toFixed(entry >= 100 ? 2 : 4)}
        </span>
      </div>
    </div>
  );
}

// ── Tracking Row ──────────────────────────────────────────────────────────

const TrackingRow = memo(function TrackingRow({ tracking }: { tracking: SignalTracking }) {
  const config = SIGNAL_STATUS_CONFIG[tracking.status];
  const isBuy = tracking.direction === "BUY";
  const dirColor = isBuy ? "var(--color-bullish)" : "var(--color-bearish)";

  const fmtPrice = (n: number) =>
    n >= 1000 ? `$${n.toFixed(1)}` : n >= 1 ? `$${n.toFixed(2)}` : `$${n.toFixed(4)}`;

  return (
    <div
      style={{
        margin: "0 16px 10px",
        padding: "14px 16px",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderLeft: `3px solid ${config.color}`,
        borderRadius: "14px",
        boxShadow: "var(--shadow-card)",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: "10px",
              fontWeight: 800,
              padding: "2px 8px",
              borderRadius: "5px",
              background: `${dirColor}14`,
              color: dirColor,
              letterSpacing: "0.04em",
            }}
          >
            {tracking.direction}
          </span>
          <span
            style={{
              fontSize: "14px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {tracking.pair}
          </span>
        </div>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "3px 10px",
            borderRadius: "6px",
            background: `${config.color}14`,
            color: config.color,
          }}
        >
          {config.icon} {config.label}
        </span>
      </div>

      {/* Price grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: tracking.current_price ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
          gap: "6px",
          marginBottom: "4px",
        }}
      >
        {tracking.entry_price != null && (
          <PriceCell label="Entry" value={fmtPrice(tracking.entry_price)} />
        )}
        {tracking.current_price != null && (
          <PriceCell
            label="Current"
            value={fmtPrice(tracking.current_price)}
            valueColor={dirColor}
          />
        )}
        {tracking.stop_loss != null && (
          <PriceCell
            label="SL"
            value={fmtPrice(tracking.stop_loss)}
            valueColor="var(--color-bearish)"
          />
        )}
        {tracking.take_profit && tracking.take_profit.length > 0 && (
          <PriceCell
            label="TP"
            value={fmtPrice(tracking.take_profit[0])}
            valueColor="var(--color-bullish)"
          />
        )}
      </div>

      {/* Price progress bar */}
      <PriceProgressBar
        entry={tracking.entry_price}
        sl={tracking.stop_loss}
        tp={tracking.take_profit}
        current={tracking.current_price}
        direction={tracking.direction}
      />

      {/* MFE / MAE row */}
      {(tracking.max_favorable_excursion > 0 || tracking.max_adverse_excursion > 0) && (
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
          }}
        >
          {tracking.max_favorable_excursion > 0 && (
            <span>
              <span style={{ fontWeight: 600 }}>MFE:</span>{" "}
              <span
                style={{
                  color: "var(--color-bullish)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                +{tracking.max_favorable_excursion.toFixed(2)}%
              </span>
            </span>
          )}
          {tracking.max_adverse_excursion > 0 && (
            <span>
              <span style={{ fontWeight: 600 }}>MAE:</span>{" "}
              <span
                style={{
                  color: "var(--color-bearish)",
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                }}
              >
                -{tracking.max_adverse_excursion.toFixed(2)}%
              </span>
            </span>
          )}
        </div>
      )}
    </div>
  );
});

// ── Small price cell ──────────────────────────────────────────────────────

function PriceCell({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        padding: "6px 8px",
        borderRadius: "8px",
        background: "color-mix(in srgb, var(--color-foreground) 3%, transparent)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "9px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          letterSpacing: "0.04em",
          marginBottom: "2px",
        }}
      >
        {label.toUpperCase()}
      </div>
      <div
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: valueColor ?? "var(--color-foreground)",
        }}
      >
        {value}
      </div>
    </div>
  );
}
