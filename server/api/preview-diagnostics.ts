import { createError, defineEventHandler, getMethod } from "h3";

type SafeProbe = {
  status: "ok" | "degraded" | "down" | "not_configured";
  latencyMs: number;
  httpStatus?: number;
  errorName?: string;
  causeName?: string;
  causeCode?: string;
};

function safeError(error: unknown): Pick<SafeProbe, "errorName" | "causeName" | "causeCode"> {
  const err = error instanceof Error ? error : new Error("Unknown error");
  const cause = (err as Error & { cause?: unknown }).cause;
  const causeRecord =
    cause && typeof cause === "object" ? (cause as Record<string, unknown>) : undefined;
  return {
    errorName: err.name,
    causeName: cause instanceof Error ? cause.name : undefined,
    causeCode:
      typeof causeRecord?.code === "string" ? causeRecord.code : undefined,
  };
}

async function probeRedis(): Promise<SafeProbe & {
  configured: boolean;
  urlValid: boolean;
  https: boolean;
  upstashHost: boolean;
}> {
  const urlValue = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!urlValue || !token) {
    return {
      status: "not_configured",
      latencyMs: 0,
      configured: false,
      urlValid: false,
      https: false,
      upstashHost: false,
    };
  }

  let url: URL;
  try {
    url = new URL(urlValue);
  } catch {
    return {
      status: "down",
      latencyMs: 0,
      configured: true,
      urlValid: false,
      https: false,
      upstashHost: false,
      errorName: "InvalidRedisUrl",
    };
  }

  const https = url.protocol === "https:";
  const upstashHost = url.hostname.endsWith(".upstash.io");
  if (!https || !upstashHost || url.username || url.password) {
    return {
      status: "down",
      latencyMs: 0,
      configured: true,
      urlValid: true,
      https,
      upstashHost,
      errorName: "RedisUrlConfigurationError",
    };
  }

  const started = Date.now();
  try {
    const response = await fetch(new URL("/ping", url.origin), {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(7000),
    });
    return {
      status: response.ok ? "ok" : "degraded",
      latencyMs: Date.now() - started,
      httpStatus: response.status,
      configured: true,
      urlValid: true,
      https,
      upstashHost,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      ...safeError(error),
      configured: true,
      urlValid: true,
      https,
      upstashHost,
    };
  }
}

async function probePublicProvider(url: string): Promise<SafeProbe> {
  const started = Date.now();
  try {
    const response = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(7000),
      headers: { Accept: "application/json" },
    });
    return {
      status: response.ok ? "ok" : "degraded",
      latencyMs: Date.now() - started,
      httpStatus: response.status,
    };
  } catch (error) {
    return {
      status: "down",
      latencyMs: Date.now() - started,
      ...safeError(error),
    };
  }
}

/**
 * Temporary, read-only diagnostics. Deliberately unavailable outside Vercel Preview.
 * Never returns URLs, tokens, API keys, response bodies, or environment values.
 */
export default defineEventHandler(async (event) => {
  if (process.env.VERCEL_ENV !== "preview") {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const method = getMethod(event).toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const [redis, binance, dexscreener] = await Promise.all([
    probeRedis(),
    probePublicProvider("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"),
    probePublicProvider("https://api.dexscreener.com/latest/dex/search?q=SOL"),
  ]);

  return {
    environment: "preview",
    checkedAt: new Date().toISOString(),
    region: process.env.VERCEL_REGION || "unknown",
    redis,
    providers: { binance, dexscreener },
  };
});
