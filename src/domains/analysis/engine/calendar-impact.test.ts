// ============================================================================
// VIXOR Analysis Engine — Calendar Impact Tests
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  assessCalendarImpact,
  setCalendarFetcher,
  type CalendarFetcher,
  type CalendarEvent,
} from "./calendar-impact";

// ── Helpers ──────────────────────────────────────────────────────────────

function futureDate(hoursFromNow: number): string {
  return new Date(Date.now() + hoursFromNow * 60 * 60 * 1000).toISOString();
}

function makeCalendarFetcher(events: CalendarEvent[]): CalendarFetcher {
  return vi.fn(async (_days: number) => events);
}

describe("calendar-impact", () => {
  beforeEach(() => {
    // Reset fetcher before each test
    setCalendarFetcher(null);
  });

  afterEach(() => {
    setCalendarFetcher(null);
  });

  it("returns no impact when no events exist", async () => {
    setCalendarFetcher(makeCalendarFetcher([]));
    const result = await assessCalendarImpact("EUR/USD");

    expect(result.hasHighImpact).toBe(false);
    expect(result.upcomingEvents).toHaveLength(0);
    expect(result.confidenceAdjustment).toBe(0);
    expect(result.recommendation).toBe("No significant calendar events affecting this pair");
  });

  it("applies -15 confidence for high-impact event within 2 hours", async () => {
    const events: CalendarEvent[] = [
      { title: "Non-Farm Payrolls", currency: "USD", impact: "high", date: futureDate(1) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("EUR/USD");

    expect(result.hasHighImpact).toBe(true);
    expect(result.confidenceAdjustment).toBe(-15);
    expect(result.recommendation).toBe("Avoid new positions before major event");
    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.upcomingEvents[0].event).toBe("Non-Farm Payrolls");
  });

  it("applies -10 confidence for high-impact event within 6 hours", async () => {
    const events: CalendarEvent[] = [
      { title: "CPI", currency: "USD", impact: "high", date: futureDate(4) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("EUR/USD");

    expect(result.confidenceAdjustment).toBe(-10);
    expect(result.recommendation).toBe("Exercise caution — high-impact event approaching");
  });

  it("applies -5 confidence for medium-impact event within 2 hours", async () => {
    const events: CalendarEvent[] = [
      { title: "Retail Sales", currency: "EUR", impact: "medium", date: futureDate(1) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("EUR/USD");

    expect(result.confidenceAdjustment).toBe(-5);
    expect(result.hasHighImpact).toBe(false);
    expect(result.upcomingEvents).toHaveLength(1);
  });

  it("takes the worst adjustment when multiple events overlap", async () => {
    const events: CalendarEvent[] = [
      { title: "NFP", currency: "USD", impact: "high", date: futureDate(0.5) },
      { title: "CPI", currency: "USD", impact: "high", date: futureDate(1) },
      { title: "Retail Sales", currency: "EUR", impact: "medium", date: futureDate(1) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("EUR/USD");

    // Should take the worst: -15 (high impact within 2h)
    expect(result.confidenceAdjustment).toBe(-15);
  });

  it("only checks USD for crypto pairs (BTC/USDT)", async () => {
    const events: CalendarEvent[] = [
      { title: "ECB Rate Decision", currency: "EUR", impact: "high", date: futureDate(1) },
      { title: "FOMC", currency: "USD", impact: "high", date: futureDate(1) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("BTC/USDT");

    // Should only see USD event, not EUR
    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.upcomingEvents[0].currency).toBe("USD");
  });

  it("checks both currencies for forex pairs (GBP/JPY)", async () => {
    const events: CalendarEvent[] = [
      { title: "UK GDP", currency: "GBP", impact: "high", date: futureDate(3) },
      { title: "BOJ Decision", currency: "JPY", impact: "high", date: futureDate(5) },
      { title: "FOMC", currency: "USD", impact: "high", date: futureDate(1) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("GBP/JPY");

    // Should see GBP and JPY events, NOT USD
    expect(result.upcomingEvents).toHaveLength(2);
    const currencies = result.upcomingEvents.map((e) => e.currency).sort();
    expect(currencies).toEqual(["GBP", "JPY"]);
  });

  it("filters events beyond the hoursAhead window", async () => {
    const events: CalendarEvent[] = [
      { title: "NFP", currency: "USD", impact: "high", date: futureDate(1) },
      { title: "Future Event", currency: "USD", impact: "high", date: futureDate(48) },
    ];
    setCalendarFetcher(makeCalendarFetcher(events));
    const result = await assessCalendarImpact("EUR/USD", { hoursAhead: 6 });

    expect(result.upcomingEvents).toHaveLength(1);
    expect(result.upcomingEvents[0].event).toBe("NFP");
  });
});
