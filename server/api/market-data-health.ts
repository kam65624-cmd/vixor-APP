/**
 * GET /api/market-data-health
 * ============================
 * Health check for the HUNT / market-data external API dependencies.
 * Returns status of Birdeye, DexScreener, and Binance market data.
 *
 * No auth required — informational endpoint.
 * Complements /api/shield-health (security domain).
 */

import { defineEventHandler, createError } from "h3";

interface ProviderHealth {
  name: string;
  status: "ok" | "degraded" | "down" | "disabled";
  latencyMs: number | null;
  error: string | null;
  note: string;
}

export default defineEventHandler(async (): Promise<{ providers: ProviderHealth[]; checkedAt: string }> => {
  const results = await Promise.allSettled([
    checkBirdeye(),
    checkDexScreener(),
    checkBinanceTicker(),
  ]);

  const providers: ProviderHealth[] = [];
  const [birdeyeResult, dexscreenerResult, binanceResult] = results;

  if (birdeyeResult.status === "fulfilled") providers.push(birdeyeResult.value);
  else providers.push({ name: "Birdeye", status: "down", latencyMs: null, error: "Request failed", note: "Set BIRDEYE_API_KEY for richer data" });

  if (dexscreenerResult.status === "fulfilled") providers.push(dexscreenerResult.value);
  else providers.push({ name: "DexScreener", status: "down", latencyMs: null, error: "Request failed", note: "Free, no key" });

  if (binanceResult.status === "fulfilled") providers.push(binanceResult.value);
  else providers.push({ name: "Binance", status: "down", latencyMs: null, error: "Request failed", note: "Already in /api/shield-health too" });

  const anyDown = providers.some((p) => p.status === "down");
  if (anyDown) {
    throw createError({ statusCode: 503, message: "One or more market data providers are down" });
  }

  return { providers, checkedAt: new Date().toISOString() };
});

// ── Individual provider checks ─────────────────────────────────────────────────

async function checkBirdeye(): Promise<ProviderHealth> {
  const apiKey = process.env.BIRDEYE_API_KEY;
  if (!apiKey) {
    return {
      name: "Birdeye",
      status: "disabled",
      latencyMs: null,
      error: null,
      note: "BIRDEYE_API_KEY not set — using DexScreener fallback",
    };
  }

  const start = Date.now();
  try {
    // Test Birdeye with a public endpoint
    const res = await fetch("https://public-api.birdeye.so/defi/tokenlist?sort_by=v24hChangePercent&sort_type=desc&offset=0&limit=1", {
      headers: { "X-API-KEY": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(8_000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { name: "Birdeye", status: "degraded", latencyMs, error: `HTTP ${res.status}`, note: "Token overview + market data" };
    }

    const data = await res.json() as { data?: unknown };
    if (!data.data) {
      return { name: "Birdeye", status: "degraded", latencyMs, error: "Empty response", note: "" };
    }

    return { name: "Birdeye", status: "ok", latencyMs, error: null, note: "Hunt domain market data" };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "Birdeye",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "Set BIRDEYE_API_KEY to enable",
    };
  }
}

async function checkDexScreener(): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.dexscreener.com/latest/dex/search?q=solana", {
      signal: AbortSignal.timeout(8_000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { name: "DexScreener", status: "degraded", latencyMs, error: `HTTP ${res.status}`, note: "Free, no key" };
    }

    const data = await res.json();
    if (!data.pairs) {
      return { name: "DexScreener", status: "degraded", latencyMs, error: "Empty response", note: "" };
    }

    return { name: "DexScreener", status: "ok", latencyMs, error: null, note: "Free, no key — Hunt fallback" };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "DexScreener",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "Free, rate-limited",
    };
  }
}

async function checkBinanceTicker(): Promise<ProviderHealth> {
  const start = Date.now();
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT", {
      signal: AbortSignal.timeout(5_000),
    });
    const latencyMs = Date.now() - start;

    if (!res.ok) {
      return { name: "Binance Ticker", status: "degraded", latencyMs, error: `HTTP ${res.status}`, note: "" };
    }

    const data = await res.json();
    if (!data.symbol) {
      return { name: "Binance Ticker", status: "degraded", latencyMs, error: "Empty response", note: "" };
    }

    return { name: "Binance Ticker", status: "ok", latencyMs, error: null, note: "Public — DR.DEX candlestick fallback" };
  } catch (err) {
    const latencyMs = Date.now() - start;
    return {
      name: "Binance Ticker",
      status: "degraded",
      latencyMs,
      error: err instanceof Error ? err.message : "Unknown",
      note: "Public endpoint",
    };
  }
}
