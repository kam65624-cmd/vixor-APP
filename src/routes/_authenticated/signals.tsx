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
  const navigate = useNavigate();

  const handleTrade = () => {
    navigate({
      to: "/trade-desk",
      search: {
        symbol: signal.pair,
        price: signal.entry ? String(signal.entry) : undefined,
        direction:
          signal.recommendation === "BUY"
            ? "long"
            : signal.recommendation === "SELL"
              ? "short"
              : undefined,
      },
    });
  };

  const confidenceGlow =
    signal.recommendation === "BUY"
      ? "0 0 12px rgba(14,203,129,0.3)"
      : signal.recommendation === "SELL"
        ? "0 0 12px rgba(246,70,93,0.3)"
        : "none";

  return (
    <div
      className="animate-slide-up"
      style={{
        margin: "0 16px 10px",
        padding: "16px",
        background: "rgba(255,255,255,0.04)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: `1px solid ${color}22`,
        borderLeft: `3px solid ${color}`,
        borderRadius: "14px",
        boxShadow: "0 4px 20px -8px rgba(0,0,0,0.5)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "10px",
          gap: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", flex: 1 }}>
          {/* Direction badge */}
          <div
            style={{
              padding: "3px 10px",
              borderRadius: "8px",
              background: `${color}18`,
              border: `1px solid ${color}40`,
              fontSize: "11px",
              fontWeight: 800,
              color,
              letterSpacing: "0.06em",
            }}
          >
            {signal.recommendation}
          </div>
          <span
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--color-foreground)",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            }}
          >
            {signal.pair}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              padding: "2px 6px",
              borderRadius: "6px",
              background: "rgba(255,255,255,0.05)",
              color: "var(--color-muted-foreground)",
            }}
          >
            {signal.timeframe}
          </span>
          {/* Reasons inline */}
          {signal.reasons && signal.reasons.length > 0 && (
            <div
              style={{
                fontSize: "11px",
                color: "var(--color-muted-foreground)",
                lineHeight: 1.4,
                width: "100%",
                marginTop: "4px"
              }}
            >
              {signal.reasons.join(" · ")}
            </div>
          )}
        </div>
        {/* Confidence */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: "2px",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color,
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              textShadow: confidenceGlow,
              lineHeight: 1,
            }}
          >
            {signal.confidence}%
          </span>
          <span
            style={{
              fontSize: "9px",
              color: "var(--color-muted-foreground)",
              letterSpacing: "0.04em",
            }}
          >
            CONFIDENCE
          </span>
        </div>
      </div>

      {/* Price grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "8px",
          marginBottom: "12px",
        }}
      >
        {signal.entry != null && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.03)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-muted-foreground)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              ENTRY
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-foreground)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {signal.entry}
            </div>
          </div>
        )}
        {signal.stop_loss != null && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(246,70,93,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-bearish)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              STOP LOSS
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bearish)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {signal.stop_loss}
            </div>
          </div>
        )}
        {signal.take_profit && signal.take_profit.length > 0 && (
          <div
            style={{
              padding: "8px",
              borderRadius: "8px",
              background: "rgba(14,203,129,0.06)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "10px",
                color: "var(--color-bullish)",
                marginBottom: "4px",
                letterSpacing: "0.05em",
              }}
            >
              TAKE PROFIT
            </div>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "var(--color-bullish)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              }}
            >
              {signal.take_profit[0]}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
        {/* Trade CTA — most prominent */}
        {signal.recommendation !== "WAIT" && (
          <button
            onClick={handleTrade}
            style={{
              flex: 1,
              height: "34px",
              borderRadius: "9px",
              border: "none",
              background: `linear-gradient(135deg, ${color}, ${color}99)`,
              color: "var(--color-foreground)",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "5px",
              boxShadow: `0 2px 12px ${color}44`,
              transition: "opacity 0.2s ease",
            }}
          >
            ⚡ Trade
          </button>
        )}

        {/* Track */}
        {signal.recommendation !== "WAIT" && (
          <button
            onClick={onTrack}
            disabled={isTracked}
            style={{
              height: "34px",
              padding: "0 12px",
              borderRadius: "9px",
              border: `1px solid ${isTracked ? "var(--color-bullish)" : "rgba(255,255,255,0.10)"}`,
              background: isTracked ? "rgba(14,203,129,0.12)" : "rgba(255,255,255,0.04)",
              color: isTracked ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              cursor: isTracked ? "default" : "pointer",
              fontSize: "11px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              transition: "all 0.2s ease",
            }}
          >
            {isTracked ? "✓ Tracked" : "Track"}
          </button>
        )}

        {/* Share buttons */}
        {onShareX && (
          <button
            onClick={onShareX}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            𝕏
          </button>
        )}
        {onShareTelegram && (
          <button
            onClick={onShareTelegram}
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
              fontSize: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s ease",
            }}
          >
            ✈
          </button>
        )}

        {/* Date */}
        <span
          style={{
            fontSize: "11px",
            color: "var(--color-muted-foreground)",
            marginLeft: "auto",
            whiteSpace: "nowrap",
          }}
        >
          {new Date(signal.signal_date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
});
