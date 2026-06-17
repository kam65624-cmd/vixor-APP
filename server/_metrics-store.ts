/**
 * In-memory metric store shared between request-logging middleware
 * (src/start.ts) and the /api/metrics endpoint (server/api/metrics.ts).
 *
 * Scoped per-process. On Vercel serverless, each invocation starts fresh,
 * so these are best-effort per-instance snapshots. For production-grade
 * metrics, ship to Datadog/Grafana via OpenTelemetry — this is the
 * fallback when no such integration exists.
 */

export interface MetricStore {
  httpRequests: Map<string, number>; // key: METHOD|ROUTE|STATUS
  httpDurationsMs: number[]; // last 1000 samples
  errorsByKind: Map<string, number>;
  cacheHits: number;
  cacheMisses: number;
  startedAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __VIXOR_METRICS__: MetricStore | undefined;
}

export function getMetricsStore(): MetricStore {
  if (!globalThis.__VIXOR_METRICS__) {
    globalThis.__VIXOR_METRICS__ = {
      httpRequests: new Map(),
      httpDurationsMs: [],
      errorsByKind: new Map(),
      cacheHits: 0,
      cacheMisses: 0,
      startedAt: Date.now(),
    };
  }
  return globalThis.__VIXOR_METRICS__!;
}

/** Public API for other modules to record metrics */
export const metrics = {
  recordHttpRequest(method: string, route: string, status: number) {
    const s = getMetricsStore();
    const key = `${method}|${route}|${status}`;
    s.httpRequests.set(key, (s.httpRequests.get(key) ?? 0) + 1);
  },
  recordDurationMs(ms: number) {
    const s = getMetricsStore();
    s.httpDurationsMs.push(ms);
    if (s.httpDurationsMs.length > 1000) s.httpDurationsMs.shift();
  },
  recordError(kind: string) {
    const s = getMetricsStore();
    s.errorsByKind.set(kind, (s.errorsByKind.get(kind) ?? 0) + 1);
  },
  recordCacheHit() {
    getMetricsStore().cacheHits += 1;
  },
  recordCacheMiss() {
    getMetricsStore().cacheMisses += 1;
  },
};
