// ============================================================================
// VIXOR Market News — Real fetcher via Finnhub
// ============================================================================
//
// Replaces the deleted fake newsMap (P0.3 fix). Fetches REAL forex/crypto
// market news from Finnhub and caches for 5 minutes via the new LRUCache.
//
// All Finnhub calls are wrapped in a CircuitBreaker so a Finnhub outage
// doesn't break the analysis pipeline — callers get an empty array on
// failure, NOT a thrown error.
//
// API:
//   - getMarketNews(category, opts)  — top market news by category
//   - getNewsForSymbol(symbol, opts) — news mentioning a specific symbol
//
// Env var: FINNHUB_API_KEY (already documented in .env.example)
// ============================================================================

import { LRUCache } from "@/shared/resilience/lru-cache";
import { CircuitBreaker } from "@/shared/resilience/circuit-breaker";

// ── Types ───────────────────────────────────────────────────────────────────

export type NewsCategory = "forex" | "crypto" | "general";

export type NewsSentiment = "positive" | "negative" | "neutral";

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  publishedAt: string; // ISO datetime
  sentiment?: NewsSentiment;
  relatedSymbols: string[];
}

export interface NewsFetchOptions {
  /** Max items to return. Default: 20. */
  limit?: number;
  /** Filter news from this date (inclusive). */
  from?: Date;
  /** Filter news up to this date (inclusive). */
  to?: Date;
}

// ── Constants ───────────────────────────────────────────────────────────────

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CACHE_CAPACITY = 200;
const DEFAULT_LIMIT = 20;
const FETCH_TIMEOUT_MS = 10_000;

// ── Singletons (per-module-instance) ────────────────────────────────────────

const newsCache = new LRUCache<string, NewsItem[]>({
  capacity: CACHE_CAPACITY,
  defaultTtlMs: CACHE_TTL_MS,
  name: "market-news",
});

const finnhubBreaker = new CircuitBreaker({
  failureThreshold: 3,
  resetTimeoutMs: 60_000, // 1 minute cooldown
  halfOpenMaxCalls: 1,
  name: "finnhub",
});

// ── Helpers ─────────────────────────────────────────────────────────────────

function getApiKey(): string {
  return (process.env.FINNHUB_API_KEY ?? "").trim();
}

function isConfigured(): boolean {
  const k = getApiKey();
  return k.length > 0 && k !== "demo";
}

/**
 * Map a Vixor category to Finnhub's category string.
 * Finnhub supports: general, forex, crypto, merger.
 */
function toFinnhubCategory(cat: NewsCategory): string {
  switch (cat) {
    case "forex":
      return "forex";
    case "crypto":
      return "crypto";
    case "general":
    default:
      return "general";
  }
}

interface FinnhubNewsItem {
  category: string;
  datetime: number; // unix seconds
  headline: string;
  id: number;
  image?: string;
  related?: string;
  source: string;
  summary: string;
  url: string;
}

/**
 * Heuristic sentiment classifier based on keyword matching.
 * Finnhub free tier doesn't include sentiment — this gives us a rough signal.
 */
function classifySentiment(text: string): NewsSentiment {
  const positive =
    /\b(surge|soar|jump|rally|gain|bullish|uptrend|breakout|high|boost|beat|exceed|optimis|optimiz|positive|rally|surge|rise|climb|advance)\b/i;
  const negative =
    /\b(plunge|crash|fall|drop|bearish|downtrend|loss|decline|miss|weak|low|fear|concern|risk|collapse|sink|slide|tumble)\b/i;

  if (positive.test(text) && !negative.test(text)) return "positive";
  if (negative.test(text) && !positive.test(text)) return "negative";
  if (positive.test(text) && negative.test(text)) return "neutral";
  return "neutral";
}

function toNewsItem(raw: FinnhubNewsItem): NewsItem {
  const publishedAt = new Date(raw.datetime * 1000).toISOString();
  const relatedSymbols = (raw.related ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  const combined = `${raw.headline} ${raw.summary}`;
  return {
    id: String(raw.id),
    title: raw.headline,
    summary: raw.summary,
    url: raw.url,
    source: raw.source,
    publishedAt,
    sentiment: classifySentiment(combined),
    relatedSymbols,
  };
}

function applyFilters(items: NewsItem[], opts: NewsFetchOptions = {}): NewsItem[] {
  let result = items;

  if (opts.from) {
    const fromMs = opts.from.getTime();
    result = result.filter((i) => new Date(i.publishedAt).getTime() >= fromMs);
  }
  if (opts.to) {
    const toMs = opts.to.getTime();
    result = result.filter((i) => new Date(i.publishedAt).getTime() <= toMs);
  }

  const limit = opts.limit ?? DEFAULT_LIMIT;
  return result.slice(0, limit);
}

// ── Core fetch ──────────────────────────────────────────────────────────────

async function fetchFromFinnhub(
  endpoint: string,
  params: Record<string, string>,
): Promise<FinnhubNewsItem[] | null> {
  const key = getApiKey();
  if (!key) return null;

  const url = new URL(`${FINNHUB_BASE_URL}${endpoint}`);
  url.searchParams.set("token", key);
  for (const [k, v] of Object.entries(params)) {
    if (v) url.searchParams.set(k, v);
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  if (timer && typeof timer === "object" && "unref" in timer) timer.unref();

  try {
    const res = await fetch(url.toString(), { signal: ctrl.signal });
    if (!res.ok) {
      throw new Error(`Finnhub ${endpoint} returned ${res.status}`);
    }
    const data = (await res.json()) as FinnhubNewsItem[] | { error?: string };
    if (Array.isArray(data)) return data;
    // Finnhub sometimes returns `{ error: "..." }` on key issues.
    if (data && typeof data === "object" && "error" in data) {
      throw new Error(`Finnhub API error: ${data.error}`);
    }
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Fetch top market news for a category (forex / crypto / general).
 * Cached for 5 minutes. Circuit-breaker protected.
 *
 * Returns an empty array on any failure (incl. circuit open) so callers
 * never need to handle a thrown error.
 */
export async function getMarketNews(
  category: NewsCategory = "general",
  opts: NewsFetchOptions = {},
): Promise<NewsItem[]> {
  if (!isConfigured()) {
    console.warn("[News] FINNHUB_API_KEY not configured; returning empty news list.");
    return [];
  }

  const cacheKey = `market:${category}:${opts.limit ?? DEFAULT_LIMIT}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return applyFilters(cached, opts);

  try {
    const rawItems = await finnhubBreaker.execute(async () => {
      return fetchFromFinnhub("/news", {
        category: toFinnhubCategory(category),
      });
    });

    if (!rawItems) return [];
    const items = rawItems.map(toNewsItem);
    // Cache the FULL list (before filtering) so subsequent calls with
    // different filters can reuse it.
    newsCache.set(cacheKey, items);
    return applyFilters(items, opts);
  } catch (err) {
    console.warn("[News] getMarketNews failed:", err instanceof Error ? err.message : String(err));
    return [];
  }
}

/**
 * Fetch news mentioning a specific symbol (e.g., "EUR/USD", "BTC:USDT").
 *
 * Uses Finnhub's `/news/company-news` endpoint with symbol + date range.
 * For forex/crypto symbols, Finnhub may return limited results — the
 * caller should treat this as best-effort.
 *
 * Cached for 5 minutes. Circuit-breaker protected. Never throws.
 */
export async function getNewsForSymbol(
  symbol: string,
  opts: NewsFetchOptions = {},
): Promise<NewsItem[]> {
  if (!isConfigured()) {
    console.warn("[News] FINNHUB_API_KEY not configured; returning empty news list.");
    return [];
  }
  if (!symbol || !symbol.trim()) return [];

  const normalized = symbol.trim().toUpperCase();
  const cacheKey = `symbol:${normalized}:${opts.limit ?? DEFAULT_LIMIT}`;
  const cached = newsCache.get(cacheKey);
  if (cached) return applyFilters(cached, opts);

  // Finnhub expects dates as YYYY-MM-DD.
  const today = new Date();
  const toDate = opts.to ?? today;
  const fromDate = opts.from ?? new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // Try Finnhub symbol formats:
  //   - "EUR/USD"  → "OANDA:EUR_USD" (forex)
  //   - "BTC/USDT" → "BINANCE:BTCUSDT" (crypto)
  //   - "AAPL"     → "AAPL" (stock)
  const finnhubSymbol = normalizeSymbolForFinnhub(normalized);

  try {
    const rawItems = await finnhubBreaker.execute(async () => {
      return fetchFromFinnhub("/company-news", {
        symbol: finnhubSymbol,
        from: fmt(fromDate),
        to: fmt(toDate),
      });
    });

    if (!rawItems) return [];
    const items = rawItems.map((r) => ({
      ...toNewsItem(r),
      relatedSymbols: [
        normalized,
        ...(r.related ?? "")
          .split(",")
          .map((s) => s.trim().toUpperCase())
          .filter((s) => s.length > 0 && s !== normalized),
      ],
    }));
    newsCache.set(cacheKey, items);
    return applyFilters(items, opts);
  } catch (err) {
    console.warn(
      `[News] getNewsForSymbol(${normalized}) failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * Convert a Vixor-style symbol to Finnhub's expected format.
 * Conservative — returns the input unchanged if no known mapping applies.
 */
function normalizeSymbolForFinnhub(symbol: string): string {
  // Forex: "EUR/USD" → "OANDA:EUR_USD"
  if (/^[A-Z]{3}\/[A-Z]{3}$/.test(symbol)) {
    return `OANDA:${symbol.replace("/", "_")}`;
  }
  // Crypto: "BTC/USDT" → "BINANCE:BTCUSDT"
  if (/^[A-Z]+\/USDT$/.test(symbol)) {
    return `BINANCE:${symbol.replace("/", "")}`;
  }
  // Crypto without slash: "BTCUSDT" → "BINANCE:BTCUSDT"
  if (/^[A-Z]+USDT$/.test(symbol) && symbol.length > 4) {
    return `BINANCE:${symbol}`;
  }
  // Otherwise (stocks): pass through.
  return symbol;
}

// ── Observability ───────────────────────────────────────────────────────────

export function getNewsCacheStats() {
  return newsCache.stats();
}

export function getNewsCircuitStatus() {
  return finnhubBreaker.getStatus();
}
