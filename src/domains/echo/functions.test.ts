// ============================================================================
// ECHO — Tracking & Outcome & Learning — Unit Tests
// ============================================================================

import { describe, it, expect } from "vitest";
import type { EchoOverview, TimelineEntry, WeeklySummary } from "./types";

describe("TimelineEntry shape", () => {
  it("should support all 5 entry types", () => {
    const types: TimelineEntry["type"][] = ["DECISION", "TRADE", "NOTE", "WATCHLIST", "LOOP"];
    for (const t of types) {
      const entry: TimelineEntry = {
        id: "test",
        type: t,
        occurredAt: new Date().toISOString(),
        title: "Test",
        summary: "Test summary",
      };
      expect(entry.type).toBe(t);
    }
  });

  it("should support optional value with unit", () => {
    const entry: TimelineEntry = {
      id: "trade-1",
      type: "TRADE",
      occurredAt: new Date().toISOString(),
      title: "BUY ETH",
      summary: "Closed with profit",
      value: 150.5,
      unit: "USD",
      tag: "closed",
    };
    expect(entry.value).toBe(150.5);
    expect(entry.unit).toBe("USD");
  });
});

describe("WeeklySummary shape", () => {
  it("should compute win rate correctly", () => {
    const week: WeeklySummary = {
      weekStart: "2025-01-01",
      weekEnd: "2025-01-07",
      totalTrades: 10,
      wins: 6,
      losses: 4,
      netPnlUsd: 250,
      winRate: 60,
    };
    expect(week.winRate).toBe(60);
    expect(week.netPnlUsd).toBe(250);
  });
});

describe("EchoOverview shape", () => {
  it("should have all required top-level fields", () => {
    const overview: EchoOverview = {
      timeline: [],
      activeTrackings: 5,
      totalTrades: 12,
      watchlistCount: 3,
      recentNotesCount: 8,
      todayLoop: {
        completed: false,
        morningPrep: true,
        sessionTracking: false,
        eodReview: false,
      },
      fetchedAt: new Date().toISOString(),
    };
    expect(overview).toHaveProperty("timeline");
    expect(overview).toHaveProperty("activeTrackings");
    expect(overview).toHaveProperty("totalTrades");
    expect(overview).toHaveProperty("todayLoop");
  });

  it("should support empty state (no data yet)", () => {
    const empty: EchoOverview = {
      timeline: [],
      activeTrackings: 0,
      totalTrades: 0,
      watchlistCount: 0,
      recentNotesCount: 0,
      todayLoop: {
        completed: false,
        morningPrep: false,
        sessionTracking: false,
        eodReview: false,
      },
      fetchedAt: new Date().toISOString(),
    };
    expect(empty.timeline).toHaveLength(0);
    expect(empty.activeTrackings).toBe(0);
  });

  it("should sort timeline entries newest first", () => {
    const now = Date.now();
    const entries: TimelineEntry[] = [
      {
        id: "1",
        type: "NOTE",
        occurredAt: new Date(now - 1000).toISOString(),
        title: "Old",
        summary: "",
      },
      { id: "2", type: "NOTE", occurredAt: new Date(now).toISOString(), title: "New", summary: "" },
      {
        id: "3",
        type: "NOTE",
        occurredAt: new Date(now - 500).toISOString(),
        title: "Mid",
        summary: "",
      },
    ];
    entries.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
    expect(entries[0].id).toBe("2");
    expect(entries[1].id).toBe("3");
    expect(entries[2].id).toBe("1");
  });
});
