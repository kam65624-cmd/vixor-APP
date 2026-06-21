/**
 * Structured logger — emits single-line JSON for downstream ingestion
 * (Vercel logs / Loki / ELK / Datadog / OpenTelemetry collectors).
 *
 * Channels:
 *   - "http"     — every HTTP request (level: info|warn|error)
 *   - "alert"    — 404 / 5xx / uncaught errors (alertable)
 *   - "error"    — application-level errors
 *   - "info"     — general info
 *   - "warn"     — warnings
 *   - "debug"    — debug (only when DEBUG=1)
 *
 * Output is a single JSON line per call, prefixed with "[VIXOR]" so it can
 * be grepped out of stdout in serverless logs.
 */

export type LogChannel = "http" | "alert" | "error" | "info" | "warn" | "debug";

const ISO = () => new Date().toISOString();

export function structuredLogger(channel: LogChannel, payload: Record<string, any>): void {
  const line = JSON.stringify({
    ts: ISO(),
    channel,
    ...payload,
  });
  // Use the appropriate console method based on level
  const level = (payload.level as string) || "info";
  if (level === "error") {
    console.error(`[VIXOR] ${line}`);
  } else if (level === "warn") {
    console.warn(`[VIXOR] ${line}`);
  } else if (level === "debug" && process.env.DEBUG !== "1") {
    // skip debug unless DEBUG=1
    return;
  } else {
    console.log(`[VIXOR] ${line}`);
  }
}

/** Convenience helpers */
export const log = {
  info: (msg: string, ctx: Record<string, any> = {}) =>
    structuredLogger("info", { level: "info", msg, ...ctx }),
  warn: (msg: string, ctx: Record<string, any> = {}) =>
    structuredLogger("warn", { level: "warn", msg, ...ctx }),
  error: (msg: string, ctx: Record<string, any> = {}) =>
    structuredLogger("error", { level: "error", msg, ...ctx }),
  debug: (msg: string, ctx: Record<string, any> = {}) =>
    structuredLogger("debug", { level: "debug", msg, ...ctx }),
  alert: (kind: string, ctx: Record<string, any> = {}) =>
    structuredLogger("alert", { level: "error", kind, ...ctx }),
  http: (ctx: Record<string, any>) => structuredLogger("http", ctx),
};
