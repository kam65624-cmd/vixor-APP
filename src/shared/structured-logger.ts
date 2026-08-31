/**
 * Structured logger — single-line JSON for log ingestion pipelines.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

type LogFn = (msg: string, ctx?: Record<string, unknown>) => void;

function emit(level: LogLevel, msg: string, ctx: Record<string, unknown> = {}): void {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ctx }));
}

const debugEnabled = process.env.DEBUG === "1";

export const log: Record<LogLevel, LogFn> = {
  info: (msg, ctx) => emit("info", msg, ctx),
  warn: (msg, ctx) => emit("warn", msg, ctx),
  error: (msg, ctx) => emit("error", msg, ctx),
  debug: debugEnabled ? (msg, ctx) => emit("debug", msg, ctx) : () => {},
};
