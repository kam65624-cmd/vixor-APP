// ============================================================================
// VIXOR Analysis Engine — Calendar Impact Assessment
// ============================================================================
//
// Assesses the impact of upcoming economic calendar events on a pair's analysis.
// For forex pairs: checks both currencies.
// For crypto pairs: only USD events matter.
//
// Uses an injectable calendar fetcher for testability.
// ============================================================================

// ── Types ──────────────────────────────────────────────────────────────────

export interface CalendarEvent {
  title: string;
  currency: string;
  impact: "high" | "medium" | "low";
  date: string; // ISO datetime string
}

export interface CalendarImpactAssessment {
  hasHighImpact: boolean;
  upcomingEvents: {
    event: string;
    currency: string;
    impact: "high" | "medium" | "low";
    hoursUntil: number;
  }[];
  /** Confidence adjustment: -15 to 0 based on upcoming events */
  confidenceAdjustment: number;
  /** Suggested action */
  recommendation: string;
}

export interface CalendarFetcher {
  (days: number): Promise<CalendarEvent[]>;
}

// ── Injectable fetcher (defaults to real implementation) ──────────────────

let calendarFetcher: CalendarFetcher | null = null;

/**
 * Set a custom calendar fetcher (for testing or alternate data sources).
 */
export function setCalendarFetcher(fetcher: CalendarFetcher | null): void {
  calendarFetcher = fetcher;
}

// ── Crypto pair detection ──────────────────────────────────────────────────

const CRYPTO_QUOTES = new Set(["USDT", "USDC", "BUSD", "DAI", "TUSD", "FDUSD"]);

function isCryptoPair(pair: string): boolean {
  const upper = pair.toUpperCase();
  const parts = upper.split(/[/_-]/);
  if (parts.length !== 2) return false;
  const quote = parts[1]!.trim();
  return CRYPTO_QUOTES.has(quote);
}

// ── Currency extraction ────────────────────────────────────────────────────

/**
 * Extract relevant currency codes from a pair string.
 * For forex ("EUR/USD") → ["EUR", "USD"]
 * For crypto ("BTC/USDT") → ["USD"] (only USD matters)
 */
function extractRelevantCurrencies(pair: string): string[] {
  const upper = pair.toUpperCase();
  const parts = upper
    .split(/[/_-]/)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.length !== 2) return ["USD"]; // Fallback

  if (isCryptoPair(pair)) {
    // For crypto, only USD-denominated events matter
    return ["USD"];
  }

  // Forex pair — both currencies matter
  return [parts[0]!, parts[1]!];
}

// ── Impact calculation ─────────────────────────────────────────────────────

function calculateConfidenceAdjustment(
  events: { impact: "high" | "medium" | "low"; hoursUntil: number }[],
): number {
  let adjustment = 0;

  for (const evt of events) {
    if (evt.impact === "high" && evt.hoursUntil <= 2) {
      // High-impact within 2 hours → -15 (take the worst)
      adjustment = Math.min(adjustment, -15);
    } else if (evt.impact === "high" && evt.hoursUntil <= 6) {
      // High-impact within 6 hours → -10
      adjustment = Math.min(adjustment, -10);
    } else if (evt.impact === "medium" && evt.hoursUntil <= 2) {
      // Medium-impact within 2 hours → -5
      adjustment = Math.min(adjustment, -5);
    }
  }

  return adjustment; // Will be -15, -10, -5, or 0
}

function buildRecommendation(adjustment: number): string {
  if (adjustment <= -15) return "Avoid new positions before major event";
  if (adjustment <= -10) return "Exercise caution — high-impact event approaching";
  if (adjustment <= -5) return "Moderate event risk — consider reduced position size";
  return "No significant calendar events affecting this pair";
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Assess the impact of upcoming economic events on a pair's analysis.
 * For forex pairs: check both currencies.
 * For crypto: minimal impact (only USD events matter).
 */
export async function assessCalendarImpact(
  pair: string,
  options?: { hoursAhead?: number },
): Promise<CalendarImpactAssessment> {
  const hoursAhead = options?.hoursAhead ?? 24;
  const daysToFetch = Math.max(1, Math.ceil(hoursAhead / 24));

  // Fetch calendar events (using injectable fetcher or real)
  let events: CalendarEvent[] = [];
  if (calendarFetcher) {
    events = await calendarFetcher(daysToFetch);
  } else {
    // Dynamic import to avoid circular dependencies at module level
    const { fetchEconomicCalendar } = await import("@/domains/market/server/economic-calendar");
    const raw = await fetchEconomicCalendar(daysToFetch);
    events = raw.map((e) => ({
      title: e.title,
      currency: e.currency,
      impact: e.impact,
      date: e.date,
    }));
  }

  // Extract relevant currencies for this pair
  const relevantCurrencies = extractRelevantCurrencies(pair);

  // Filter events to only those matching our currencies and within our window
  const now = Date.now();
  const windowMs = hoursAhead * 60 * 60 * 1000;

  const upcomingEvents = events
    .filter((e) => relevantCurrencies.includes(e.currency))
    .map((e) => {
      const eventTime = new Date(e.date).getTime();
      const hoursUntil = (eventTime - now) / (1000 * 60 * 60);
      return {
        event: e.title,
        currency: e.currency,
        impact: e.impact,
        hoursUntil: Math.max(0, hoursUntil),
      };
    })
    .filter((e) => e.hoursUntil <= hoursAhead && e.hoursUntil >= -1) // -1h tolerance for events just started
    .sort((a, b) => a.hoursUntil - b.hoursUntil);

  // Calculate confidence adjustment
  const confidenceAdjustment = calculateConfidenceAdjustment(upcomingEvents);
  const hasHighImpact = upcomingEvents.some((e) => e.impact === "high");
  const recommendation = buildRecommendation(confidenceAdjustment);

  return {
    hasHighImpact,
    upcomingEvents,
    confidenceAdjustment,
    recommendation,
  };
}
