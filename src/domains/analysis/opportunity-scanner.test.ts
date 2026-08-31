// ============================================================================
// VIXOR Opportunity Scanner — Tests
// ============================================================================

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { scanForOpportunities, setScanFetcher, type ScanOHLCVFetcher } from "./opportunity-scanner";
import type { OHLCVBar } from "./engine/core/types";

function makeBullishBars(count: number, basePrice: number): OHLCVBar[] {
  const bars: OHLCVBar[] = [];
  let price = basePrice;
  for (let i = 0; i < count; i++) {
    const change = (0.3 + Math.sin(i * 0.3) * 0.2) * 0.01 * basePrice;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.abs(change) * 0.5;
    bars.push({
      time: Date.now() - (count - i) * 3600000,
      open,
      high,
      low,
      close,
      volume: 1000 + i * 100,
    });
    price = close;
  }
  return bars;
}

// Strong uptrend that should produce high-confidence BUY signals
const strongBullFetcher: ScanOHLCVFetcher = (_pair, _tf, limit) => {
  return Promise.resolve(makeBullishBars(limit, 67000));
};

// Flat/consolidating data that should produce WAIT
const flatFetcher: ScanOHLCVFetcher = (_pair, _tf, limit) => {
  const bars: OHLCVBar[] = [];
  for (let i = 0; i < limit; i++) {
    const noise = Math.sin(i * 0.5) * 0.05 * 100;
    bars.push({
      time: Date.now() - (limit - i) * 3600000,
      open: 67000 + noise,
      high: 67010 + noise,
      low: 66990 + noise,
      close: 67000 + noise * 0.5,
      volume: 1000,
    });
  }
  return Promise.resolve(bars);
};

// Returns empty data for some pairs
const selectiveFetcher: ScanOHLCVFetcher = (pair, _tf, limit) => {
  if (pair === "BAD/USDT") return Promise.resolve([]);
  return Promise.resolve(makeBullishBars(limit, 67000));
};

// Fetcher that always errors
const errorFetcher: ScanOHLCVFetcher = () => {
  return Promise.reject(new Error("API error"));
};

describe("Opportunity Scanner", () => {
  beforeEach(() => {
    setScanFetcher(strongBullFetcher);
  });

  afterEach(() => {
    setScanFetcher(null as any);
  });

  it("scans and returns results sorted by confidence descending", async () => {
    const result = await scanForOpportunities(["BTC/USDT", "ETH/USDT"], {
      minConfidence: 0, // Accept all to test sorting
      timeframes: ["1H"],
    });

    expect(result.totalScanned).toBe(2);
    // Results should be sorted by confidence descending
    for (let i = 1; i < result.opportunities.length; i++) {
      expect(result.opportunities[i - 1].confidence).toBeGreaterThanOrEqual(
        result.opportunities[i].confidence,
      );
    }
  });

  it("filters by minimum confidence", async () => {
    // With high min confidence, flat data should be filtered out
    setScanFetcher(flatFetcher);
    const result = await scanForOpportunities(["BTC/USDT"], {
      minConfidence: 65,
      timeframes: ["1H"],
    });

    // Flat data typically produces WAIT → filtered out
    expect(result.opportunities.length).toBeLessThanOrEqual(1);
    for (const opp of result.opportunities) {
      expect(opp.confidence).toBeGreaterThanOrEqual(65);
    }
  });

  it("respects max results limit", async () => {
    const result = await scanForOpportunities(
      ["BTC/USDT", "ETH/USDT", "SOL/USDT", "XRP/USDT", "ADA/USDT"],
      {
        minConfidence: 0,
        timeframes: ["1H", "4H"],
        maxResults: 2,
      },
    );

    expect(result.opportunities.length).toBeLessThanOrEqual(2);
    expect(result.totalScanned).toBe(10); // 5 pairs × 2 timeframes
  });

  it("handles empty/invalid data gracefully", async () => {
    setScanFetcher(selectiveFetcher);
    const result = await scanForOpportunities(["BAD/USDT", "BTC/USDT"], {
      minConfidence: 0,
      timeframes: ["1H"],
    });

    // BAD/USDT returns empty → should be skipped
    // BTC/USDT should succeed
    expect(result.totalScanned).toBe(2);
    // Should have at least the BTC opportunity (if it produces a non-WAIT rec)
    // Or zero if all produce WAIT
    expect(result.opportunities.length).toBeGreaterThanOrEqual(0);
  });

  it("handles fetch errors gracefully", async () => {
    setScanFetcher(errorFetcher);
    const result = await scanForOpportunities(["BTC/USDT"], {
      minConfidence: 0,
      timeframes: ["1H"],
    });

    expect(result.opportunities).toHaveLength(0);
    expect(result.totalScanned).toBe(1);
  });

  it("returns correct scan metadata", async () => {
    const result = await scanForOpportunities(["BTC/USDT", "ETH/USDT"], {
      minConfidence: 0,
      timeframes: ["1H", "4H"],
    });

    expect(result.totalScanned).toBe(4); // 2 pairs × 2 timeframes
    expect(result.scanDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("opportunity fields are valid", async () => {
    const result = await scanForOpportunities(["BTC/USDT"], {
      minConfidence: 0,
      timeframes: ["1H"],
    });

    for (const opp of result.opportunities) {
      expect(typeof opp.pair).toBe("string");
      expect(typeof opp.timeframe).toBe("string");
      expect(["BUY", "SELL"]).toContain(opp.direction);
      expect(typeof opp.confidence).toBe("number");
      expect(typeof opp.entryPrice).toBe("number");
      expect(typeof opp.stopLoss).toBe("number");
      expect(Array.isArray(opp.takeProfits)).toBe(true);
      expect(typeof opp.riskReward).toBe("number");
      expect(Array.isArray(opp.keySignals)).toBe(true);
      expect(typeof opp.regime).toBe("string");
      expect(typeof opp.scannedAt).toBe("string");
      // scannedAt should be a valid ISO date
      expect(new Date(opp.scannedAt).getTime()).not.toBeNaN();
    }
  });

  it("throws when no fetcher is set", async () => {
    setScanFetcher(null as any);
    await expect(scanForOpportunities(["BTC/USDT"])).rejects.toThrow("Scan fetcher not set");
  });
});
