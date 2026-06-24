// ============================================================================
// VIXOR Finnhub Quotes Client — Forex, Stock, Crypto Quotes
// ============================================================================
// Uses Finnhub's free API for real-time and quote data.
// Complements TwelveData for cross-validation and fallback.
// Rate limited: 60 calls/min → ~1050ms between calls.
// ============================================================================

import { Limiters } from "@/shared/resilience/rate-limiter";
import { CircuitBreaker } from "@/shared/resilience/circuit-breaker";
import { LRUCache } from "@/shared/resilience/lru-cache";
import { AssetRegistry } from "@/shared/asset-registry";

// ── Types ───────────────────────────────────────────────────────────────────

export interface FinnhubQuote {
  pair: string;
  price: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  change: number;
  changePct: number;
  timestamp: number;
  source: "finnhub";
}

// ── Constants ───────────────────────────────────────────────────────────────

const BASE_URL = "https://finnhub.io/api/v1";
const CACHE_TTL_MS = 60_000; // 1 minute
const CACHE_CAPACITY = 100;

// ── Singletons ──────────────────────────────────────────────────────────────

const quoteCache = new LRUCache<string, FinnhubQuote>({
  capacity: CACHE_CAPACITY,
  defaultTtlMs: CACHE_TTL_MS,
  name: "finnhub-quotes",
});

const finnhubQuoteBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60_000,
  halfOpenMaxCalls: 1,
  name: "finnhub-quotes",
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function getApiKey(): string {
  return (process.env.FINNHUB_API_KEY ?? "").trim();
}

function isConfigured(): boolean {
  const k = getApiKey();
  return k.length > 0 && k !== "demo";
}

/** Map VIXOR pair to Finnhub symbol format */
function toFinnhubSymbol(pair: string): string | undefined {
  const asset = AssetRegistry.find(pair);
  if (!asset) return undefined;
  // Use the Finnhub mapping from registry if available
  if (asset.symbols.finnhub) return asset.symbols.finnhub;
  // Fallback for crypto: BTC/USDT → BTCUSDT
  if (asset.category === "crypto") return pair.replace("/", "");
  return undefined;
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch a quote for a single pair from Finnhub.
 * Cached for 1 minute. Circuit-breaker protected. Never throws.
 */
export async function fetchFinnhubQuote(pair: string): Promise<FinnhubQuote | null> {
  if (!isConfigured()) return null;

  const cached = quoteCache.get(pair);
  if (cached) return cached;

  const symbol = toFinnhubSymbol(pair);
  if (!symbol) return null;

  try {
    const result = await finnhubQuoteBreaker.execute(async () => {
      await Limiters.finnhub.wait();
      const url = `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${getApiKey()}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
      if (!res.ok) throw new Error(`Finnhub quote returned ${res.status}`);
      return res.json();
    });

    if (!result || result.c === 0 || result.d === null) return null;

    const price = result.c; // current price
    const prevClose = result.pc; // previous close
    const change = price - prevClose;
    const changePct = prevClose > 0 ? (change / prevClose) * 100 : 0;

    const quote: FinnhubQuote = {
      pair,
      price,
      open: result.o ?? 0,
      high: result.h ?? 0,
      low: result.l ?? 0,
      prevClose,
      change,
      changePct,
      timestamp: result.t ? result.t * 1000 : Date.now(),
      source: "finnhub",
    };

    quoteCache.set(pair, quote);
    return quote;
  } catch (err) {
    console.warn(
      `[FinnhubQuote] ${pair} failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

/**
 * Fetch quotes for multiple pairs. Respects rate limiting sequentially.
 * Returns only successful results.
 */
export async function fetchFinnhubQuotes(pairs: string[]): Promise<FinnhubQuote[]> {
  const results: FinnhubQuote[] = [];
  for (const pair of pairs) {
    const quote = await fetchFinnhubQuote(pair);
    if (quote) results.push(quote);
  }
  return results;
}

/** Get cache stats for observability */
export function getFinnhubQuoteCacheStats() {
  return quoteCache.stats();
}
