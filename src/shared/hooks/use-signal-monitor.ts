// ============================================================================
// VIXOR useSignalMonitor — Real-Time Signal Tracking Monitor
// ============================================================================
// React hook that connects useLivePrices to signal tracking.
// For each active/pending tracking, checks if TP/SL is hit on every price tick.
// When hit, updates the tracking status via server function and sends notification.
// ============================================================================

import { useEffect, useRef, useCallback, useState } from 'react';
import { useLivePrices } from '@/shared/market-data/use-live-prices';
import { getUserSignalTrackings, updateSignalTracking, evaluateTrackingPrice, updateExcursions } from '@/domains/signal-tracking';
import { useStableServerFn } from '@/shared/hooks/use-stable-server-fn';
import type { SignalTracking, SignalStatus } from '@/domains/signal-tracking';
import { TERMINAL_STATUSES } from '@/domains/signal-tracking';
import { AssetRegistry } from '@/shared/asset-registry';

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
  const updateTracking = useStableServerFn(updateSignalTracking);

  // Filter active/pending trackings and extract unique pairs
  const activeTrackings = trackings.filter(
    (t) => !TERMINAL_STATUSES.includes(t.status) && t.direction !== 'WAIT',
  );

  const monitoredPairs = Array.from(
    new Set(activeTrackings.map((t) => t.pair)),
  );

  // Fetch trackings on mount
  useEffect(() => {
    if (!enabled) return;

    fetchTrackings({}).then((res: { trackings?: SignalTracking[] }) => {
      if (res.trackings) setTrackings(res.trackings);
    });
  }, [enabled, fetchTrackings]);

  // Get live prices for monitored pairs
  const { prices, status: wsStatus, getPrice } = useLivePrices({
    pairs: enabled ? monitoredPairs : [],
    enabled: enabled && monitoredPairs.length > 0,
  });

  // Track previous prices to avoid duplicate notifications
  const prevPriceRef = useRef<Map<string, number>>(new Map());

  // Check prices against trackings on every update
  const checkPrices = useCallback(() => {
    if (!enabled || activeTrackings.length === 0) return;

    let anyUpdated = false;

    for (const tracking of activeTrackings) {
      const livePrice = getPrice(tracking.pair);
      if (!livePrice) continue;

      const currentPrice = livePrice.price;
      const prevPrice = prevPriceRef.current.get(tracking.id);

      // Skip if price hasn't changed (avoid redundant checks)
      if (prevPrice === currentPrice) continue;
      prevPriceRef.current.set(tracking.id, currentPrice);

      // Evaluate price against tracking
      const result = evaluateTrackingPrice(tracking, currentPrice);

      if (result.hitType !== 'none' && result.newStatus) {
        // Update tracking status via server function
        updateTracking({
          data: {
            trackingId: tracking.id,
            status: result.newStatus,
            currentPrice,
            hitTp: result.hitType === 'tp_hit' ? (tracking.hit_tp + 1) : tracking.hit_tp,
          },
        }).then((res: { ok: boolean }) => {
          if (res.ok) {
            // Update local state
            setTrackings((prev) =>
              prev.map((t) =>
                t.id === tracking.id
                  ? { ...t, status: result.newStatus!, current_price: currentPrice, updated_at: new Date().toISOString() }
                  : t,
              ),
            );

            // Notification is sent server-side by updateSignalTracking.
            // No need to call notificationRouter from the client.
            // (notificationRouter uses node:crypto via webhook.ts, client-incompatible)
            notifCountRef.current++;
            setNotificationsSent(notifCountRef.current);
          }
        });

        anyUpdated = true;
      }
    }

    if (anyUpdated) {
      setLastCheckAt(Date.now());
    }
  }, [enabled, activeTrackings, getPrice, updateTracking]);

  // Run price checks whenever prices update
  useEffect(() => {
    if (wsStatus !== 'connected' && wsStatus !== 'polling') return;
    checkPrices();
  }, [prices, wsStatus, checkPrices]);

  // Check for expired signals every 60 seconds
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const now = Date.now();
      let anyExpired = false;

      setTrackings((prev) => {
        const next = prev.map((t) => {
          if (t.expires_at && new Date(t.expires_at).getTime() < now && !TERMINAL_STATUSES.includes(t.status)) {
            anyExpired = true;
            return { ...t, status: 'expired' as SignalStatus, resolved_at: new Date().toISOString() };
          }
          return t;
        });
        return anyExpired ? next : prev;
      });

      if (anyExpired) {
        // Update expired in DB
        for (const t of trackings) {
          if (t.expires_at && new Date(t.expires_at).getTime() < now && !TERMINAL_STATUSES.includes(t.status)) {
            void updateTracking({ data: { trackingId: t.id, status: 'expired' } });
          }
        }
      }
    }, 60_000);

    return () => clearInterval(interval);
  }, [enabled, trackings, updateTracking]);

  return {
    trackings,
    activeTrackings,
    monitoredPairs,
    isMonitoring: enabled && wsStatus === 'connected' && activeTrackings.length > 0,
    lastCheckAt,
    notificationsSent,
  };
}