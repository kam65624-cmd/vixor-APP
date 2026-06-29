#!/usr/bin/env python3
"""Patch analysis.$id.tsx to add share functionality and signals.tsx to add tracking."""
import re

# ═══════════════════════════════════════════════════════════════
# PATCH 1: analysis.$id.tsx — Add share imports + activate share button
# ═══════════════════════════════════════════════════════════════

analysis_path = 'src/routes/_authenticated/analysis.$id.tsx'
with open(analysis_path, 'r') as f:
    content = f.read()

# 1a. Add imports (useCallback + share)
old_import = 'import { useState, useMemo } from "react";'
new_import = 'import { useState, useMemo, useCallback } from "react";'
content = content.replace(old_import, new_import, 1)

# Add share imports after PageLayout import
old_pagelayout_import = 'import { PageLayout, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";'
new_pagelayout_import = '''import { PageLayout, ScrollArea, Badge, ProgressBar } from "@/components/vixor/PageLayout";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";'''
content = content.replace(old_pagelayout_import, new_pagelayout_import, 1)

# 1b. Add share menu state and handler inside AnalysisResult component
# Find the line with "const [imgZoom, setImgZoom] = useState(false);" and add after it
old_state = '  const [imgZoom, setImgZoom] = useState(false);'
new_state = '''  const [imgZoom, setImgZoom] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Share handler — formats analysis data and opens X/Telegram share
  const shareSignal: ShareableSignal = useMemo(() => ({
    pair: a?.pair ?? "",
    direction: (a?.recommendation ?? "WAIT") as "BUY" | "SELL" | "WAIT",
    confidence: a?.confidence ?? undefined,
    entry: typeof a?.entry === "number" ? a.entry : null,
    stopLoss: typeof a?.stop_loss === "number" ? a.stop_loss : null,
    takeProfit: Array.isArray(a?.take_profit) ? a.take_profit : null,
    pattern: a?.pattern ?? null,
    reasons: Array.isArray(a?.reasons) ? a.reasons : null,
    timeframe: a?.timeframe ?? undefined,
    source: "VIXOR AI",
  }), [a]);

  const handleShareX = useCallback(() => {
    shareOnX(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);

  const handleShareTelegram = useCallback(() => {
    shareOnTelegram(shareSignal);
    setShareOpen(false);
  }, [shareSignal]);'''
content = content.replace(old_state, new_state, 1)

# 1c. Replace the dead share button with a functional one
old_share_btn = '''        <button
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "12px",
            background: "var(--color-card)",
            border: `1px solid ${"var(--color-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--color-muted-foreground)",
            cursor: "pointer",
          }}
        >
          <Share2 size={16} />
        </button>'''

new_share_btn = '''        <div style={{ position: "relative" }}>
          <button
            onClick={() => setShareOpen(!shareOpen)}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--color-card)",
              border: `1px solid ${"var(--color-border)"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--color-muted-foreground)",
              cursor: "pointer",
            }}
          >
            <Share2 size={16} />
          </button>
          {shareOpen && isComplete && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
                background: "var(--color-card)",
                border: `1px solid var(--color-border)`,
                borderRadius: "12px",
                boxShadow: "0 8px 32px -8px oklch(0 0 0 / 0.5)",
                padding: "6px",
                zIndex: 50,
                minWidth: "140px",
              }}
            >
              <button
                onClick={handleShareX}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                X (Twitter)
              </button>
              <button
                onClick={handleShareTelegram}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "100%",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "8px",
                  background: "transparent",
                  color: "var(--color-foreground)",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: 600,
                }}
              >
                Telegram
              </button>
            </div>
          )}
        </div>'''
content = content.replace(old_share_btn, new_share_btn, 1)

with open(analysis_path, 'w') as f:
    f.write(content)

print(f"Patched {analysis_path}")

# ═══════════════════════════════════════════════════════════════
# PATCH 2: signals.tsx — Add Track + Share buttons + signal monitor
# ═══════════════════════════════════════════════════════════════

signals_path = 'src/routes/_authenticated/signals.tsx'
with open(signals_path, 'r') as f:
    content = f.read()

# 2a. Add imports
old_imports = '''import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { memo, useState } from "react";
import { getDailySignals } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";'''

new_imports = '''import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { memo, useState, useCallback } from "react";
import { getDailySignals } from "@/shared/data";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { createSignalTracking, getUserSignalTrackings } from "@/domains/signal-tracking";
import { shareOnX, shareOnTelegram } from "@/shared/share";
import type { ShareableSignal } from "@/shared/share";
import type { SignalTracking } from "@/domains/signal-tracking";
import { SIGNAL_STATUS_CONFIG, TERMINAL_STATUSES } from "@/domains/signal-tracking";
import { useSignalMonitor } from "@/shared/hooks/use-signal-monitor";'''
content = content.replace(old_imports, new_imports, 1)

# 2b. Add monitor hook + tracking state inside SignalsPage
old_component_start = '''function SignalsPage() {
  const fetchSignals = useStableServerFn(getDailySignals);
  const [activeTab, setActiveTab] = useState<string>("All");'''

new_component_start = '''function SignalsPage() {
  const fetchSignals = useStableServerFn(getDailySignals);
  const createTracking = useStableServerFn(createSignalTracking);
  const fetchTrackings = useStableServerFn(getUserSignalTrackings);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("All");
  const [trackingIds, setTrackingIds] = useState<Record<string, string>>({});

  // Fetch user's trackings on mount
  useQuery({
    queryKey: ["my-signal-trackings"],
    queryFn: () => fetchTrackings({}),
    staleTime: 30_000,
  });

  // Signal monitor for real-time TP/SL checking
  const { isMonitoring, activeTrackings, notificationsSent } = useSignalMonitor(true);

  // Track a signal
  const handleTrack = useCallback(async (signal: Signal) => {
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
  }, [createTracking, queryClient]);

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
  }, []);'''
content = content.replace(old_component_start, new_component_start, 1)

# 2c. Add monitoring stats + pass track/share handlers to SignalRow
old_signal_row = '''          filtered.map((sig) => (
            <SignalRow key={sig.id} signal={sig} recColor={recColor} />
          ))'''
new_signal_row = '''          filtered.map((sig) => (
            <SignalRow
              key={sig.id}
              signal={sig}
              recColor={recColor}
              isTracked={!!trackingIds[sig.id]}
              onTrack={() => handleTrack(sig)}
              onShareX={() => handleShareX(sig)}
              onShareTelegram={() => handleShareTelegram(sig)}
            />
          ))'''
content = content.replace(old_signal_row, new_signal_row, 1)

# 2d. Add monitoring indicator in stats
old_stats = '''      <StatsRow
        stats={[
          { label: "Total Signals", value: String(signals.length), color: "var(--color-bullish)" },
          { label: "Buy Signals", value: String(buyCount), color: "var(--color-bullish)" },
          { label: "Sell Signals", value: String(sellCount), color: "var(--color-bearish)" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: "var(--color-neutral-wait)" },
        ]}
      />'''

new_stats = '''      <StatsRow
        stats={[
          { label: "Total Signals", value: String(signals.length), color: "var(--color-bullish)" },
          { label: "Buy Signals", value: String(buyCount), color: "var(--color-bullish)" },
          { label: "Sell Signals", value: String(sellCount), color: "var(--color-bearish)" },
          { label: "Avg Confidence", value: `${avgConfidence}%`, color: "var(--color-neutral-wait)" },
          ...(isMonitoring ? [{ label: "Monitoring", value: String(activeTrackings.length), color: "var(--color-bullish)" }] : []),
        ]}
      />'''
content = content.replace(old_stats, new_stats, 1)

# 2e. Update SignalRow component to accept and render track/share buttons
old_signalrow_props = '''const SignalRow = memo(function SignalRow({
  signal,
  recColor,
}: {
  signal: Signal;
  recColor: (r: string) => string;
}) {'''

new_signalrow_props = '''const SignalRow = memo(function SignalRow({
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
}) {'''
content = content.replace(old_signalrow_props, new_signalrow_props, 1)

# 2f. Add action buttons after the price line
old_date_span = '''        <span style={{ marginLeft: "auto" }}>
          {new Date(signal.signal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    </DataRow>'''

new_date_span = '''        <span style={{ marginLeft: "auto" }}>
          {new Date(signal.signal_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
              background: isTracked ? "color-mix(in oklab, var(--color-bullish) 15%, transparent)" : "transparent",
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
    </DataRow>'''
content = content.replace(old_date_span, new_date_span, 1)

with open(signals_path, 'w') as f:
    f.write(content)

print(f"Patched {signals_path}")
print("All patches applied successfully!")