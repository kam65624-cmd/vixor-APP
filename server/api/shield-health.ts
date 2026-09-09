/**
 * GET /api/shield-health
 * ======================
 * Health check for the SHIELD domain's external API dependencies.
 * Returns status of GoPlus, RugCheck, Birdeye, and DexScreener.
 *
 * No auth required — informational endpoint.
 * Used by:运维 dashboard, Sentry alerts, status page
 */

import { defineEventHandler, createError } from "h3";

interface ProviderHealth {
  name: string;
  status: "ok" | "degraded" | "down";
  latencyMs: number | null;
  error: string | null;
  note: string;
}

export default defineEventHandler(
  async (): Promise<{ providers: ProviderHealth[]; checkedAt: string }> => {
    const results = await Promise.allSettled([checkGoPlus(), checkRugCheck(), checkBinance()]);

    const providers: ProviderHealth[] = [];
    const [goplusResult, rugcheckResult, binanceResult] = results;

    if (goplusResult.status === "fulfilled") providers.push(goplusResult.value);
    else
      providers.push({
        name: "GoPlus",
        status: "down",
        latencyMs: null,
        error: "Request failed",
        note: "",
      });

    if (rugcheckResult.status === "fulfilled") providers.push(rugcheckResult.value);
    else
      providers.push({
        name: "RugCheck",
        status: "down",
        latencyMs: null,
        error: "Request failed",
        note: "Solana tokens",
      });

    if (binanceResult.status === "fulfilled") providers.push(binanceResult.value);
    else
      providers.push({
        name: "Binance",
        status: "down",
        latencyMs: null,
        error: "Request failed",
        note: "Klines, price data",
      });

    const allOk = providers.every((p) => p.status === "ok");
    const anyDown = providers.some((p) => p.status === "down");

    if (anyDown) {
      throw createError({ statusCode: 503, message: "One or more providers are down" });
    }

    return { providers, checkedAt: new Date().toISOString() };
  },
);

// ── Individual provider checks ─────────────────────────────────────────────────

async function checkGoPlus(): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    const res = await fetch(
      "https://api.gopluslabs.io/api/v1/token_security/1?contract_addresses=0xdAC17F958D2ee523a2206206994597C13D831ec7",
      { signal: AbortSignal.timeout(8_000) },
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        name: "GoPlus",
        status: "degraded",
        latencyMs,
        error: `HTTP ${res.status}`,
        note: "Free tier — no API key needed",
      };
    }

    const json = (await res.json()) as { code?: number };
    if (json.code !== 1) {
      return {
        name: "GoPlus",
        status: "degraded",
        latencyMs,
        error: "Unexpected response format",
        note: "",
      };
    }

    return {
      name: "GoPlus",
      status: "ok",
      latencyMs,
      error: null,
      note: "Free tier — no API key needed",
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "GoPlus",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "EVM chain security (Solana uses RugCheck)",
    };
  }
}

async function checkRugCheck(): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    // Test with a known Solana token
    const res = await fetch(
      "https://api.rugcheck.xyz/v1/tokens/7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs/report",
      { signal: AbortSignal.timeout(8_000) },
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        name: "RugCheck",
        status: "degraded",
        latencyMs,
        error: `HTTP ${res.status}`,
        note: "Solana only",
      };
    }

    return {
      name: "RugCheck",
      status: "ok",
      latencyMs,
      error: null,
      note: "Solana security — no API key",
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "RugCheck",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "Solana security — free API",
    };
  }
}

async function checkBinance(): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    // Test public klines endpoint
    const res = await fetch(
      "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=1",
      { signal: AbortSignal.timeout(5_000) },
    );
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return {
        name: "Binance",
        status: "degraded",
        latencyMs,
        error: `HTTP ${res.status}`,
        note: "",
      };
    }

    const data = await res.json();
    if (!Array.isArray(data)) {
      return {
        name: "Binance",
        status: "degraded",
        latencyMs,
        error: "Unexpected response",
        note: "",
      };
    }

    return {
      name: "Binance",
      status: "ok",
      latencyMs,
      error: null,
      note: "Public klines + ticker — no API key",
    };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "Binance",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "Candlestick data, real-time prices",
    };
  }
}
