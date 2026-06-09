// ============================================================================
// Vixor Economic Calendar Server — Real data from free sources
// ============================================================================
//
// Fetches economic events from:
//   1. Primary: nfs.faireconomy.media (free ForexFactory-style calendar)
//   2. Fallback: Finnhub economic calendar API (if key available)
//
// Data is cached for 300s (5 min) since economic events don't change rapidly.
// NEVER fabricates data — returns empty array on failure.
// ============================================================================

import { cache, CACHE_KEYS, CACHE_TTL } from "@/shared/cache";

// ── Types ──

export interface EconomicEvent {
  id: string;
  title: string;
  country: string; // "US", "EU", "UK", "JP", etc.
  currency: string; // "USD", "EUR", "GBP", "JPY"
  impact: "high" | "medium" | "low";
  date: string; // ISO datetime string
  actual?: string;
  forecast?: string;
  previous?: string;
  source: string;
}

// ── Country / Currency mapping ──

const COUNTRY_CURRENCY_MAP: Record<string, { country: string; currency: string }> = {
  USD: { country: "US", currency: "USD" },
  EUR: { country: "EU", currency: "EUR" },
  GBP: { country: "UK", currency: "GBP" },
  JPY: { country: "JP", currency: "JPY" },
  AUD: { country: "AU", currency: "AUD" },
  CAD: { country: "CA", currency: "CAD" },
  CHF: { country: "CH", currency: "CHF" },
  NZD: { country: "NZ", currency: "NZD" },
  CNY: { country: "CN", currency: "CNY" },
};

// ── Impact mapping ──

function mapImpact(level: string): "high" | "medium" | "low" {
  const normalized = String(level).toLowerCase().trim();
  if (normalized === "high" || normalized === "3" || normalized === "high impact") return "high";
  if (normalized === "medium" || normalized === "2" || normalized === "medium impact") return "medium";
  return "low";
}

// ── Faireconomy Media Calendar (ForexFactory-style) ──
// Free, no API key needed, returns this week's events

interface FaireconomyEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast?: string;
  previous?: string;
  actual?: string;
}

async function fetchFaireconomyCalendar(days: number): Promise<EconomicEvent[]> {
  try {
    const res = await fetch("https://nfs.faireconomy.media/ff_calendar_thisweek.json", {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.warn(`[EconomicCalendar] Faireconomy returned ${res.status}`);
      return [];
    }

    const data: FaireconomyEvent[] = await res.json();
    if (!Array.isArray(data)) return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const dayStart = new Date(now);
    dayStart.setHours(0, 0, 0, 0);

    const events: EconomicEvent[] = [];

    for (const evt of data) {
      try {
        // Parse date — faireconomy uses "2024-03-06T13:30:00-05:00" format
        const eventDate = new Date(evt.date);
        if (isNaN(eventDate.getTime())) continue;

        // Only include future events within our range (or today's events)
        if (eventDate < dayStart) continue;
        if (eventDate > cutoff) continue;

        const currency = evt.country?.toUpperCase() ?? "";
        const mapping = COUNTRY_CURRENCY_MAP[currency];

        // Filter to only major currencies (forex-relevant)
        if (!mapping) continue;

        const impact = mapImpact(evt.impact);

        events.push({
          id: `fe-${currency}-${evt.title}-${evt.date}`.replace(/[^a-zA-Z0-9-]/g, "-"),
          title: evt.title?.trim() || "Unknown Event",
          country: mapping.country,
          currency: mapping.currency,
          impact,
          date: eventDate.toISOString(),
          actual: evt.actual?.trim() || undefined,
          forecast: evt.forecast?.trim() || undefined,
          previous: evt.previous?.trim() || undefined,
          source: "faireconomy",
        });
      } catch {
        // Skip malformed events
      }
    }

    return events;
  } catch (err) {
    console.warn(
      "[EconomicCalendar] Faireconomy fetch failed:",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

// ── Finnhub Economic Calendar (fallback) ──

interface FinnhubEconomicEvent {
  event: string;
  country: string;
  impact: string;
  time: string; // ISO datetime
  actual?: string | number;
  forecast?: string | number;
  prev?: string | number;
}

async function fetchFinnhubCalendar(days: number): Promise<EconomicEvent[]> {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) return [];

  try {
    const now = new Date();
    const later = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const from = now.toISOString().split("T")[0];
    const to = later.toISOString().split("T")[0];

    const res = await fetch(
      `https://finnhub.io/api/v1/calendar/economic?from=${from}&to=${to}&token=${key}`,
      { signal: AbortSignal.timeout(10_000) },
    );
    if (!res.ok) return [];

    const data = await res.json();
    const rawEvents: FinnhubEconomicEvent[] = data?.economicCalendar ?? [];
    if (!Array.isArray(rawEvents)) return [];

    const events: EconomicEvent[] = [];

    for (const evt of rawEvents) {
      try {
        const eventDate = new Date(evt.time);
        if (isNaN(eventDate.getTime())) continue;

        const countryCode = evt.country?.toUpperCase() ?? "";
        // Find currency from country code
        let currency = "";
        let country = countryCode;
        for (const [cur, map] of Object.entries(COUNTRY_CURRENCY_MAP)) {
          if (map.country === countryCode) {
            currency = cur;
            country = map.country;
            break;
          }
        }
        // If no mapping found, try using country code as currency
        if (!currency && COUNTRY_CURRENCY_MAP[countryCode]) {
          currency = countryCode;
          country = COUNTRY_CURRENCY_MAP[countryCode].country;
        }
        if (!currency) continue; // Skip unknown countries

        const impact = mapImpact(evt.impact);

        events.push({
          id: `fh-${country}-${evt.event}-${evt.time}`.replace(/[^a-zA-Z0-9-]/g, "-"),
          title: evt.event?.trim() || "Unknown Event",
          country,
          currency,
          impact,
          date: eventDate.toISOString(),
          actual: evt.actual != null ? String(evt.actual) : undefined,
          forecast: evt.forecast != null ? String(evt.forecast) : undefined,
          previous: evt.prev != null ? String(evt.prev) : undefined,
          source: "finnhub",
        });
      } catch {
        // Skip malformed events
      }
    }

    return events;
  } catch (err) {
    console.warn(
      "[EconomicCalendar] Finnhub fetch failed:",
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

// ── Main export ──

export async function fetchEconomicCalendar(days: number = 7): Promise<EconomicEvent[]> {
  // Check cache first
  try {
    const cacheKey = `economic-calendar:${days}`;
    const cached = await cache.get<EconomicEvent[]>(cacheKey);
    if (cached && cached.length > 0) {
      console.log(`[EconomicCalendar] Using cached data (${cached.length} events)`);
      return cached;
    }
  } catch {
    // Cache read failed — proceed to API
  }

  // Try primary source (faireconomy), then fallback (finnhub)
  let events = await fetchFaireconomyCalendar(days);

  // If primary returned no data, try Finnhub
  if (events.length === 0) {
    console.log("[EconomicCalendar] Faireconomy returned empty, trying Finnhub...");
    events = await fetchFinnhubCalendar(days);
  }

  // Sort by date, then by impact (high first)
  const impactOrder = { high: 0, medium: 1, low: 2 };
  events.sort((a, b) => {
    const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateDiff !== 0) return dateDiff;
    return (impactOrder[a.impact] ?? 2) - (impactOrder[b.impact] ?? 2);
  });

  // Store in cache (300s TTL = 5 minutes)
  if (events.length > 0) {
    try {
      const cacheKey = `economic-calendar:${days}`;
      await cache.set(cacheKey, events, CACHE_TTL.KLINES_LONG); // 300s
    } catch {
      // Non-fatal — cache write failure shouldn't block
    }
  }

  console.log(`[EconomicCalendar] Fetched ${events.length} events for next ${days} days`);
  return events;
}

// ── Country flag emoji helper ──

export const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸",
  EU: "🇪🇺",
  UK: "🇬🇧",
  JP: "🇯🇵",
  AU: "🇦🇺",
  CA: "🇨🇦",
  CH: "🇨🇭",
  NZ: "🇳🇿",
  CN: "🇨🇳",
};
