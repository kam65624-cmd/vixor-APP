import { defineEventHandler, getMethod, getHeader, setHeader, createError } from "h3";
import { getMetricsStore } from "../_metrics-store";

/**
 * GET /api/metrics
 * Returns Prometheus exposition format + JSON summary.
 *
 * Auth: CRON_SECRET or HEALTH_TOKEN (Bearer).
 */
export default defineEventHandler((event) => {
  const method = getMethod(event).toUpperCase();
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

  const s = getMetricsStore();
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

  setHeader(event, "Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  return lines.join("\n");
});
