import { useEffect, useMemo, useState } from "react";

export type MarketDataStatus = "live" | "reconnecting" | "stale" | "offline" | "idle";

interface UseMarketDataStatusOptions {
  lastUpdate?: number | null;
  isLoading?: boolean;
  error?: unknown;
  enabled?: boolean;
  staleAfterMs?: number;
}

const STATUS_META: Record<MarketDataStatus, { label: string; color: string; pulse: boolean }> = {
  live: { label: "LIVE", color: "var(--color-bullish)", pulse: true },
  reconnecting: { label: "RECONNECTING", color: "var(--color-neutral-wait)", pulse: true },
  stale: { label: "STALE", color: "var(--color-neutral-wait)", pulse: false },
  offline: { label: "OFFLINE", color: "var(--color-muted-foreground)", pulse: false },
  idle: { label: "WAITING", color: "var(--color-muted-foreground)", pulse: false },
};

/**
 * Derives one honest market-data status from the latest observed update.
 * A green LIVE badge is only returned when a real update arrived recently.
 */
export function useMarketDataStatus({
  lastUpdate,
  isLoading = false,
  error,
  enabled = true,
  staleAfterMs = 10_000,
}: UseMarketDataStatusOptions) {
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [, forceNow] = useState(0);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    const onVisibility = () => forceNow((value) => value + 1);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(() => forceNow((value) => value + 1), 1000);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    const ageMs = lastUpdate ? Math.max(0, Date.now() - lastUpdate) : null;
    let status: MarketDataStatus;
    if (!enabled) status = "idle";
    else if (!isOnline) status = "offline";
    else if (error) status = "reconnecting";
    else if (lastUpdate && ageMs !== null && ageMs <= staleAfterMs) status = "live";
    else if (isLoading && !lastUpdate) status = "reconnecting";
    else if (lastUpdate) status = "stale";
    else status = "idle";

    return {
      status,
      ...STATUS_META[status],
      ageMs,
      lastUpdate: lastUpdate ?? null,
      isOnline,
    };
  }, [enabled, error, isLoading, isOnline, lastUpdate, staleAfterMs]);
}
