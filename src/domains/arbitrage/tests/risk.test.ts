import { describe, it, expect } from "vitest";
import { RiskManager, CircuitBreaker } from "../risk";
import { loadArbitrageConfig } from "../config";
import type { ArbitrageOpportunity } from "../types";
import { SOL_MINT } from "../config";

function makeOpportunity(overrides: Partial<ArbitrageOpportunity> = {}): ArbitrageOpportunity {
  const now = Date.now();
  return {
    id: "test_opp",
    strategy: "cross-dex",
    legs: [
      {
        venue: "jupiter",
        inputMint: SOL_MINT,
        outputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        inputAmount: 100_000_000n,
        expectedOutput: 50_000_000n,
      },
      {
        venue: "raydium",
        inputMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        outputMint: SOL_MINT,
        inputAmount: 50_000_000n,
        expectedOutput: 101_500_000n,
      },
    ],
    startToken: { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
    endToken: { symbol: "SOL", mint: SOL_MINT, decimals: 9 },
    inputAmount: 100_000_000n,
    expectedOutput: 101_500_000n,
    grossProfitBps: 150,
    netProfitBps: 120,
    estimatedGasLamports: 29_000,
    confidence: 75,
    detectedAt: now,
    expiresAt: now + 5000,
    ...overrides,
  };
}

describe("RiskManager", () => {
  it("approves valid opportunities", () => {
    const config = loadArbitrageConfig({
      ARBITRAGE_MIN_PROFIT_BPS: "10",
      ARBITRAGE_BOT_MODE: "mock",
    });
    const rm = new RiskManager(config);
    expect(rm.validate(makeOpportunity())).toBeNull();
  });

  it("rejects low profit", () => {
    const config = loadArbitrageConfig({
      ARBITRAGE_MIN_PROFIT_BPS: "200",
      ARBITRAGE_BOT_MODE: "mock",
    });
    const rm = new RiskManager(config);
    const rejection = rm.validate(makeOpportunity({ netProfitBps: 50 }));
    expect(rejection?.reason).toContain("below minimum");
  });

  it("rejects expired opportunities", () => {
    const config = loadArbitrageConfig({ ARBITRAGE_BOT_MODE: "mock" });
    const rm = new RiskManager(config);
    const rejection = rm.validate(makeOpportunity({ expiresAt: Date.now() - 1 }));
    expect(rejection?.reason).toBe("Opportunity expired");
  });

  it("rejects oversized trades", () => {
    const config = loadArbitrageConfig({
      ARBITRAGE_MAX_TRADE_SIZE_SOL: "0.01",
      ARBITRAGE_BOT_MODE: "mock",
    });
    const rm = new RiskManager(config);
    const rejection = rm.validate(makeOpportunity({ inputAmount: 1_000_000_000n }));
    expect(rejection?.reason).toContain("exceeds max");
  });
});

describe("CircuitBreaker", () => {
  it("opens after max failures", () => {
    const cb = new CircuitBreaker(3);
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(false);
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
  });

  it("resets on success", () => {
    const cb = new CircuitBreaker(2);
    cb.recordFailure();
    cb.recordFailure();
    expect(cb.isOpen()).toBe(true);
    cb.recordSuccess();
    expect(cb.isOpen()).toBe(false);
  });
});
