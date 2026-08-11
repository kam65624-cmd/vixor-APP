// ============================================================================
// VIXOR useSignalMonitor — Real-Time Signal Tracking Monitor
// ============================================================================
// React hook that connects useLivePrices to signal tracking.
// For each active/pending tracking, checks if TP/SL is hit on every price tick.
// When hit, requests a server-authoritative transition via requestSignalTransition.
//
// Phase 3: The client NO LONGER determines the new status.
// It sends the observed price to the server, which uses the Transition Engine
// to determine the valid next state.
// ============================================================================

import { useEffect, useRef, useCallback, useState } from "react";
import { useLivePrices } from "@/shared/market-data/use-live-prices";
import {
  getUserSignalTrackings,
  requestSignalTransition,
} from "@/domains/signal-tracking";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import type { SignalTracking, SignalStatus } from "@/domains/signal-tracking";
import { TERMINAL_STATUSES, MONITORED_STATUSES } from "@/domains/signal-tracking";

export interface SignalMonitorState {
  /** All user trackings (fetched once on mount) */
  trackings: SignalTracking[];
  /** Currently active trackings being monitored */
  activeTrackings: SignalTracking[];
  /** Pairs being monitored via WebSocket */
  monitoredPairs: string[];
  /** Whether the monitor is running */
  isMonitoring: boolean;
  /** Last price check timestamp */
  lastCheckAt: number;
  /** Notifications sent during this session */
  notificationsSent: number;
}

export function useSignalMonitor(enabled: boolean = true): SignalMonitorState {
  const [trackings, setTrackings] = useState<SignalTracking[]>([]);
  const [lastCheckAt, setLastCheckAt] = useState(0);
  const [notificationsSent, setNotificationsSent] = useState(0);
  const notifCountRef = useRef(0);

  const fetchTrackings = useStableServerFn(getUserSignalTrackings);
  const transitionFn = useStableServerFn(requestSignalTransition);

  // Filter active/pending trackings that need monitoring and extract unique pairs
  const activeTrackings = trackings.filter(
    (t) =>
      MONITORED_STATUSES.includes(t.status) && t.direction !== "WAIT",
  );

  const monitoredPairs = Array.from(new Set(activeTrackings.map((t) => t.pair)));

  // Fetch trackings on mount
  useEffect(() => {
    if (!enabled) return;

    fetchTrackings({}).then((res: { trackings?: SignalTracking[] }) => {
      if (res.trackings) setTrackings(res.trackings);
    });
  }, [enabled, fetchTrackings]);

  // Get live prices for monitored pairs
  const {
    prices,
    status: wsStatus,
    getPrice,
  } = useLivePrices({
    pairs: enabled ? monitoredPairs : [],
    enabled: enabled && monitoredPairs.length > 0,
  });

  // Track previous prices to avoid duplicate server calls
  const prevPriceRef = useRef<Map<string, number>>(new Map());

  // Track which trackings have pending transitions (debounce)
  const pendingTransitions = useRef<Set<string>>(new Set());

  // Check prices against trackings on every update
  const checkPrices = useCallback(() => {
    if (!enabled || activeTrackings.length === 0) return;

    for (const tracking of activeTrackings) {
      const livePrice = getPrice(tracking.pair);
      if (!livePrice) continue;

      const currentPrice = livePrice.price;
      const prevPrice = prevPriceRef.current.get(tracking.id);

      // Skip if price hasn't changed (avoid redundant checks)
      if (prevPrice === currentPrice) continue;
      prevPriceRef.current.set(tracking.id, currentPrice);

      // Skip if there's already a pending transition for this tracking
      if (pendingTransitions.current.has(tracking.id)) continue;

      // Request server-authoritative transition
      // The client NO LONGER determines the new status.
      // We send the observed price; the server's Transition Engine decides.
      pendingTransitions.current.add(tracking.id);

      transitionFn({
        data: {
          trackingId: tracking.id,
          observedPrice: currentPrice,
          currentVersion: tracking.updated_at,
          actor: "system",
        },
      }).then((res) => {
        pendingTransitions.current.delete(tracking.id);

        if (res.ok) {
          // Update local state from server response
          setTrackings((prev) =>
            prev.map((t) =>
              t.id === tracking.id
                ? {
                    ...t,
                    status: res.transition.to,
                    current_price: res.transition.price ?? t.current_price,
                    updated_at: res.transition.serverReceivedAt,
                    // Derive hit_tp from transition result
                    hit_tp:
                      res.transition.event === "TP1_HIT"
                        ? 1
                        : res.transition.event === "TP2_HIT"
                          ? 2
                          : res.transition.event === "TP3_HIT"
                            ? 3
                            : t.hit_tp,
                  }
                : t,
            ),
          );

          notifCountRef.current++;
          setNotificationsSent(notifCountRef.current);
        }
        // If transition was denied (e.g., NO_TRIGGER), that's normal —
        // price hasn't triggered any TP/SL/entry yet.
      }).catch(() => {
        pendingTransitions.current.delete(tracking.id);
      });
    }

    setLastCheckAt(Date.now());
  }, [enabled, activeTrackings, getPrice, transitionFn]);

  // Run price checks whenever prices update
  useEffect(() => {
    if (wsStatus !== "connected" && wsStatus !== "polling") return;
    checkPrices();
  }, [prices, wsStatus, checkPrices]);

  // Check for expired signals every 60 seconds
  // Now uses server-authoritative transition instead of client-side status change
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();

      for (const t of trackings) {
        if (
          t.expires_at &&
          new Date(t.expires_at).getTime() < now &&
          !TERMINAL_STATUSES.includes(t.status)
        ) {
          // Request server-authoritative expiration transition
          pendingTransitions.current.add(t.id);
          transitionFn({
            data: {
              trackingId: t.id,
              requestedTransition: "expired",
              observedPrice: 0,
              currentVersion: t.updated_at,
              actor: "system",
            },
          }).then((res) => {
            pendingTransitions.current.delete(t.id);
            if (res.ok) {
              setTrackings((prev) =>
                prev.map((tr) =>
                  tr.id === t.id
                    ? {
                        ...tr,
                        status: "expired" as SignalStatus,
                        resolved_at: res.transition.serverReceivedAt,
                        updated_at: res.transition.serverReceivedAt,
                      }
                    : tr,
                ),
              );
            }
          }).catch(() => {
            pendingTransitions.current.delete(t.id);
          });
        }
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [enabled, trackings, transitionFn]);

  return {
    trackings,
    activeTrackings,
    monitoredPairs,
    isMonitoring: enabled && wsStatus === "connected" && activeTrackings.length > 0,
    lastCheckAt,
    notificationsSent,
  };
}
