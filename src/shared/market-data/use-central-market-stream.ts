import { useEffect, useRef } from "react";

export interface CentralMarketSnapshot {
  address: string;
  chainId: string;
  price: number;
  change24h: number;
  updatedAt: number;
  source: string;
}

interface Options {
  addresses: string[];
  enabled?: boolean;
  onSnapshot: (snapshot: CentralMarketSnapshot) => void;
  onStatusChange?: (status: "connecting" | "open" | "reconnecting" | "closed") => void;
}

/**
 * Connects the browser to the central Collector. The Birdeye key never enters
 * this hook: VITE_MARKET_COLLECTOR_URL is only a public service URL.
 */
export function useCentralMarketStream({
  addresses,
  enabled = true,
  onSnapshot,
  onStatusChange,
}: Options) {
  const onSnapshotRef = useRef(onSnapshot);
  const onStatusRef = useRef(onStatusChange);
  onSnapshotRef.current = onSnapshot;
  onStatusRef.current = onStatusChange;

  const tokenKey = [...new Set(addresses)].sort().join(",");

  useEffect(() => {
    const baseUrl = import.meta.env.VITE_MARKET_COLLECTOR_URL as string | undefined;
    if (!enabled || !baseUrl || !tokenKey || typeof EventSource === "undefined") {
      onStatusRef.current?.("closed");
      return;
    }

    const url = new URL("/stream", baseUrl);
    url.searchParams.set("tokens", tokenKey);
    onStatusRef.current?.("connecting");
    const source = new EventSource(url);

    source.onopen = () => onStatusRef.current?.("open");
    source.addEventListener("price", (event) => {
      try {
        onSnapshotRef.current(
          JSON.parse((event as MessageEvent<string>).data) as CentralMarketSnapshot,
        );
      } catch {
        // Ignore malformed events; the connection remains usable.
      }
    });
    source.onerror = () => {
      // EventSource automatically retries with its reconnect delay. Keep the
      // stream open so the browser does not create duplicate connections.
      onStatusRef.current?.("reconnecting");
    };

    return () => {
      source.close();
      onStatusRef.current?.("closed");
    };
  }, [enabled, tokenKey]);
}
