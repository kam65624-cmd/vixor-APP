import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useState, useCallback, useRef, useEffect } from "react";
import { getDailySignals } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createSignalTracking, getUserSignalTrackings } from "@/domains/signal-tracking";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";
import type { SignalTracking } from "@/domains/signal-tracking";
import { SIGNAL_STATUS_CONFIG, TERMINAL_STATUSES } from "@/domains/signal-tracking";
import { useSignalMonitor } from "@/shared/hooks/use-signal-monitor";
import { useSound } from "@/shared/hooks/use-sound";
import {
  PageLayout,
  StatsRow,
  SectionTitle,
  DataRow,
  Badge,
  EmptyState,
  SkeletonRow,
  ScrollArea,
} from "@/components/vixor/PageLayout";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Signals — Vixor" }] }),
  component: SignalsPage,
});

type Signal = {
  id: string;
  pair: string;
  timeframe: string;
  recommendation: "BUY" | "SELL" | "WAIT";
  confidence: number;
  entry: number | null;
  stop_loss: number | null;
  take_profit: number[] | null;
  reasons: string[] | null;
  pattern: string | null;
  signal_date: string;
  created_at: string;
};

const TABS = ["All", "BUY", "SELL", "WAIT"] as const;

function SignalsPage() {
  const navigate = useNavigate();
  const { play } = useSound();
  const fetchSignals = useStableServerFn(getDailySignals);
  const createTracking = useStableServerFn(createSignalTracking);
  const fetchTrackings = useStableServerFn(getUserSignalTrackings);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [trackingIds, setTrackingIds] = useState<Record<string, string>>({});
  const prevSignalIds = useRef<Set<string>>(new Set());

  // Fetch user's trackings on mount
  useQuery({
    queryKey: ["my-signal-trackings"],
    queryFn: () => fetchTrackings({}),
    staleTime: 30_000,
  });

  // Signal monitor for real-time TP/SL checking
  const { isMonitoring, activeTrackings, notificationsSent } = useSignalMonitor(true);

  // Track a signal
  const handleTrack = useCallback(
    async (signal: Signal) => {
      if (signal.recommendation === "WAIT") return;
      const res = await createTracking({
        data: {
          signalId: signal.id,
          pair: signal.pair,
          direction: signal.recommendation,
          entryPrice: signal.entry,
          stopLoss: signal.stop_loss,
          takeProfit: signal.take_profit,
        },
      });
      if (res.ok && res.trackingId) {
        setTrackingIds((prev) => ({ ...prev, [signal.id]: res.trackingId! }));
        queryClient.invalidateQueries({ queryKey: ["my-signal-trackings"] });
      }
    },
    [createTracking, queryClient],
  );

  // Share a signal
  const handleShareX = useCallback((signal: Signal) => {
    shareOnX({
      pair: signal.pair,
      direction: signal.recommendation,
      confidence: signal.confidence,
      entry: signal.entry,
      stopLoss: signal.stop_loss,
      takeProfit: signal.take_profit,
      pattern: signal.pattern,
      reasons: signal.reasons,
      timeframe: signal.timeframe,
      source: "VIXOR AI",
    });
  }, []);

  const handleShareTelegram = useCallback((signal: Signal) => {
    shareOnTelegram({
      pair: signal.pair,
      direction: signal.recommendation,
      confidence: signal.confidence,
      entry: signal.entry,
      stopLoss: signal.stop_loss,
      takeProfit: signal.take_profit,
      pattern: signal.pattern,
      reasons: signal.reasons,
      timeframe: signal.timeframe,
      source: "VIXOR AI",
    });
  }, []);

  const query = useQuery({
    queryKey: ["daily-signals"],
    queryFn: () => fetchSignals({}),
    staleTime: 60_000,
  });

  const signals: Signal[] = query.data?.signals ?? [];
  const isLoading = query.isLoading;

  // Play sound for newly appeared signals
  useEffect(() => {
    if (isLoading || signals.length === 0) return;
    const currentIds = new Set(signals.map((s) => s.id));
    let hasNew = false;
    for (const id of currentIds) {
      if (!prevSignalIds.current.has(id)) {
        hasNew = true;
        break;
      }
    }
    if (hasNew && prevSignalIds.current.size > 0) {
      play("signal");
    }
    prevSignalIds.current = currentIds;
  }, [signals, isLoading, play]);

  const filtered =
    activeTab === "All" ? signals : signals.filter((s) => s.recommendation === activeTab);

  const buyCount = signals.filter((s) => s.recommendation === "BUY").length;
  const sellCount = signals.filter((s) => s.recommendation === "SELL").length;
  const avgConfidence =
    signals.length > 0
      ? Math.round(signals.reduce((s, sig) => s + sig.confidence, 0) / signals.length)
      : 0;

  const recColor = (rec: string) =>
    rec === "BUY"
      ? "var(--color-bullish)"
      : rec === "SELL"
        ? "var(--color-bearish)"
        : "var(--color-neutral-wait)";

  return (
    <PageLayout
      title="Signals"
      badge="AI SIGNALS"
      badgeColor={"var(--color-neutral-wait)"}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      loading={isLoading}
    >
      <StatsRow
        stats={[
          { label: "Total Signals", value: String(signals.length), color: "var(--color-bullish)" },
          { label: "Buy Signals", value: String(buyCount), color: "var(--color-bullish)" },
          { label: "Sell Signals", value: String(sellCount), color: "var(--color-bearish)" },
          {
            label: "Avg Confidence",
            value: `${avgConfidence}%`,
            color: "var(--color-neutral-wait)",
          },
          ...(isMonitoring
            ? [
                {
                  label: "Monitoring",
                  value: String(activeTrackings.length),
                  color: "var(--color-bullish)",
                },
              ]
            : []),
        ]}
      />

      <SectionTitle title="Active Signals" count={filtered.length} />

      <ScrollArea style={{ padding: "0" }}>
        {filtered.length > 0 ? (
          filtered.map((sig) => (
            <SignalRow
              key={sig.id}
              signal={sig}
              recColor={recColor}
              isTracked={!!trackingIds[sig.id]}
              onTrack={() => handleTrack(sig)}
              onShareX={() => handleShareX(sig)}
              onShareTelegram={() => handleShareTelegram(sig)}
            />
          ))
        ) : (
          <EmptyState
            icon="📡"
            title="No Signals"
            message={
              signals.length === 0
                ? "No signals generated yet. Run analyses to populate signals."
                : "No signals match this filter."
            }
            action={
              signals.length === 0
                ? {
                    label: "Analyze Chart",
                    onClick: () =>
                      navigate({
                        to: "/analyze",
                        search: { screenshot: undefined, pair: undefined },
                      }),
                  }
                : undefined
            }
          />
        )}
      </ScrollArea>
    </PageLayout>
  );
}

const SignalRow = memo(function SignalRow({
  signal,
  recColor,
  isTracked,
  onTrack,
  onShareX,
  onShareTelegram,
}: {
  signal: Signal;
  recColor: (r: string) => string;
  isTracked?: boolean;
  onTrack?: () => void;
  onShareX?: () => void;
  onShareTelegram?: () => void;
}) {
  const color = recColor(signal.recommendation);

  return (
    <DataRow leftAccent={color}>
      {/* Top line — pair info, pattern, confidence */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: signal.reasons && signal.reasons.length > 0 ? "6px" : "0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
          <Badge label={signal.recommendation} color={color} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {signal.pair}
          </span>
          <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)", flexShrink: 0 }}>
            {signal.timeframe}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
          {signal.pattern && (
            <span style={{ fontSize: "9px", color: "var(--color-muted-foreground)" }}>
              {signal.pattern}
            </span>
          )}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-neutral-wait)",
            }}
          >
            {signal.confidence}%
          </span>
        </div>
      </div>

      {/* Reasons */}
      {signal.reasons && signal.reasons.length > 0 && (
        <div
          style={{
            fontSize: "10px",
            color: "var(--color-muted-foreground)",
            lineHeight: 1.5,
            marginBottom: "6px",
          }}
        >
          {signal.reasons.join(" · ")}
        </div>
      )}

      {/* Bottom line — entry, SL, TP, date */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          fontSize: "10px",
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          color: "var(--color-muted-foreground)",
          flexWrap: "wrap",
        }}
      >
        {signal.entry != null && (
          <span>
            Entry: <span style={{ color: "var(--color-foreground)" }}>${signal.entry}</span>
          </span>
        )}
        {signal.stop_loss != null && (
          <span>
            SL: <span style={{ color: "var(--color-bearish)" }}>${signal.stop_loss}</span>
          </span>
        )}
        {signal.take_profit && signal.take_profit.length > 0 && (
          <span>
            TP:{" "}
            <span style={{ color: "var(--color-bullish)" }}>
              {signal.take_profit.map((t) => `$${t}`).join(", ")}
            </span>
          </span>
        )}
        <span style={{ marginLeft: "auto" }}>
          {new Date(signal.signal_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
        {signal.recommendation !== "WAIT" && (
          <button
            onClick={onTrack}
            disabled={isTracked}
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "6px",
              border: `1px solid ${isTracked ? "var(--color-bullish)" : "var(--color-border)"}`,
              background: isTracked ? "rgba(14,203,129,0.15)" : "transparent",
              color: isTracked ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              cursor: isTracked ? "default" : "pointer",
              whiteSpace: "nowrap",
            }}
          >
            {isTracked ? "TRACKING" : "TRACK"}
          </button>
        )}
        {onShareX && (
          <button
            onClick={onShareX}
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            X
          </button>
        )}
        {onShareTelegram && (
          <button
            onClick={onShareTelegram}
            style={{
              fontSize: "9px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              background: "transparent",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            TG
          </button>
        )}
      </div>
    </DataRow>
  );
});
