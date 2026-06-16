import { defineEventHandler, getHeader, createError } from "h3";

/**
 * GET /api/metrics
 * Returns Prometheus-style text metrics + a JSON summary for dashboards.
 *
 * Auth: same gate as /api/health.
 *
 * Metrics collected (in-memory counters/histograms since process start):
 *  - vixor_http_requests_total{method,route,status}
 *  - vixor_http_request_duration_seconds_bucket{le}
 *  - vixor_errors_total{kind}
 *  - vixor_uptime_seconds
 *  - vixor_cache_hits_total / vixor_cache_misses_total
 *
 * Note: in serverless (Vercel) each invocation starts fresh, so these metrics
 * are best-effort per-instance snapshots. For production-grade metrics, ship
 * to Datadog/Grafana Cloud via OpenTelemetry. This endpoint is the fallback
 * when no such integration exists.
 */

// In-memory metric store (process-scoped)
interface MetricStore {
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

function getStore(): MetricStore {
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
    const s = getStore();
    const key = `${method}|${route}|${status}`;
    s.httpRequests.set(key, (s.httpRequests.get(key) ?? 0) + 1);
  },
  recordDurationMs(ms: number) {
    const s = getStore();
    s.httpDurationsMs.push(ms);
    if (s.httpDurationsMs.length > 1000) s.httpDurationsMs.shift();
  },
  recordError(kind: string) {
    const s = getStore();
    s.errorsByKind.set(kind, (s.errorsByKind.get(kind) ?? 0) + 1);
  },
  recordCacheHit() {
    getStore().cacheHits += 1;
  },
  recordCacheMiss() {
    getStore().cacheMisses += 1;
  },
};

export default defineEventHandler((event) => {
  const method = (event.node.req.method || "GET").toUpperCase();
  if (method !== "GET") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const authHeader = getHeader(event, "authorization");
  const cronSecret = process.env.CRON_SECRET;
  const healthToken = process.env.HEALTH_TOKEN;
  const authorized =
    (cronSecret && authHeader === `Bearer ${cronSecret}`) ||
    (healthToken && authHeader === `Bearer ${healthToken}`) ||
    process.env.NODE_ENV !== "production";
  if (!authorized) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }

  const s = getStore();
  const uptimeS = (Date.now() - s.startedAt) / 1000;
  const samples = s.httpDurationsMs;
  const count = samples.length;
  const sum = samples.reduce((a, b) => a + b, 0);
  const avg = count ? sum / count : 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const p50 = count ? sorted[Math.floor(count * 0.5)] : 0;
  const p95 = count ? sorted[Math.floor(count * 0.95)] : 0;
  const p99 = count ? sorted[Math.floor(count * 0.99)] : 0;
  const max = count ? sorted[count - 1] : 0;

  // Build Prometheus exposition format
  const lines: string[] = [];
  lines.push("# HELP vixor_uptime_seconds Process uptime");
  lines.push("# TYPE vixor_uptime_seconds gauge");
  lines.push(`vixor_uptime_seconds ${uptimeS.toFixed(2)}`);
  lines.push("");
  lines.push("# HELP vixor_http_requests_total HTTP requests by method/route/status");
  lines.push("# TYPE vixor_http_requests_total counter");
  for (const [key, val] of s.httpRequests.entries()) {
    const [m, r, st] = key.split("|");
    const routeLabel = r.replace(/[^a-zA-Z0-9_/\-]/g, "_").slice(0, 80) || "root";
    lines.push(`vixor_http_requests_total{method="${m}",route="${routeLabel}",status="${st}"} ${val}`);
  }
  lines.push("");
  lines.push("# HELP vixor_http_request_duration_seconds HTTP request duration");
  lines.push("# TYPE vixor_http_request_duration_seconds summary");
  lines.push(`vixor_http_request_duration_seconds{quantile="0.5"} ${(p50 / 1000).toFixed(4)}`);
  lines.push(`vixor_http_request_duration_seconds{quantile="0.95"} ${(p95 / 1000).toFixed(4)}`);
  lines.push(`vixor_http_request_duration_seconds{quantile="0.99"} ${(p99 / 1000).toFixed(4)}`);
  lines.push(`vixor_http_request_duration_seconds_sum ${(sum / 1000).toFixed(4)}`);
  lines.push(`vixor_http_request_duration_seconds_count ${count}`);
  lines.push("");
  lines.push("# HELP vixor_errors_total Errors by kind");
  lines.push("# TYPE vixor_errors_total counter");
  for (const [k, v] of s.errorsByKind.entries()) {
    lines.push(`vixor_errors_total{kind="${k}"} ${v}`);
  }
  lines.push("");
  lines.push("# HELP vixor_cache_total Cache hits/misses");
  lines.push("# TYPE vixor_cache_total counter");
  lines.push(`vixor_cache_total{result="hit"} ${s.cacheHits}`);
  lines.push(`vixor_cache_total{result="miss"} ${s.cacheMisses}`);

  event.node.res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return lines.join("\n");
});
