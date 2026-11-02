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
    causeCode: typeof causeRecord?.code === "string" ? causeRecord.code : undefined,
  };
}

type RedisProbe = SafeProbe & {
  configured: boolean;
  urlValid: boolean;
  https: boolean;
  upstashHost: boolean;
};

async function probeRedis(): Promise<RedisProbe> {
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

async function probePublicDns(hostname: string): Promise<{
  status: "resolved" | "nxdomain" | "no_answer" | "unavailable";
  answerCount: number;
}> {
  try {
    const url = new URL("https://dns.google/resolve");
    url.searchParams.set("name", hostname);
    url.searchParams.set("type", "A");
    const response = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { status: "unavailable", answerCount: 0 };
    const data = (await response.json()) as { Status?: number; Answer?: unknown[] };
    const answerCount = Array.isArray(data.Answer) ? data.Answer.length : 0;
    if (data.Status === 3) return { status: "nxdomain", answerCount };
    if (data.Status === 0 && answerCount > 0) return { status: "resolved", answerCount };
    return { status: "no_answer", answerCount };
  } catch {
    return { status: "unavailable", answerCount: 0 };
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
  console.info("[PreviewDiagnostics] deployment gate", {
    vercelEnv: process.env.VERCEL_ENV ?? "unset",
    gitRef: process.env.VERCEL_GIT_COMMIT_REF ?? "unset",
  });

  if (process.env.VERCEL_GIT_COMMIT_REF !== "diagnostics/redis-market-api-20261102") {
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  }

  const method = getMethod(event).toUpperCase();
  if (method !== "GET" && method !== "HEAD") {
    throw createError({ statusCode: 405, statusMessage: "Method not allowed" });
  }

  const [redis, redisDns, binancePrimary, binanceMarketDataTicker, binanceMarketData24h, dexscreener] = await Promise.all([
    probeRedis(),
    process.env.UPSTASH_REDIS_REST_URL
      ? probePublicDns(new URL(process.env.UPSTASH_REDIS_REST_URL).hostname)
      : Promise.resolve({ status: "unavailable" as const, answerCount: 0 }),
    probePublicProvider("https://api.binance.com/api/v3/ticker/24hr?symbol=SOLUSDT"),
    probePublicProvider("https://data-api.binance.vision/api/v3/ticker/price?symbol=SOLUSDT"),
    probePublicProvider("https://data-api.binance.vision/api/v3/ticker/24hr?symbol=SOLUSDT"),
    probePublicProvider("https://api.dexscreener.com/latest/dex/search?q=SOL"),
  ]);

  return {
    environment: "preview",
    checkedAt: new Date().toISOString(),
    region: process.env.VERCEL_REGION || "unknown",
    redis,
    redisDns,
    providers: { binancePrimary, binanceMarketDataTicker, binanceMarketData24h, dexscreener },
  };
});
