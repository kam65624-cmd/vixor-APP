// ============================================================================
// VIXOR V2 — Mock Token Intelligence Provider
// ============================================================================
//
// Returns SAMPLE token profile and market snapshot data.
// ============================================================================

import type { ProviderResult } from "./types";
import { emptyResult, successResult, failedResult } from "./types";
import type {
  TokenIntelligenceProvider,
  TokenProfile,
  MarketSnapshot,
} from "./token-intelligence-provider";
import {
  LOW_RISK_TARGET_ID,
  CAUTION_TARGET_ID,
  HIGH_RISK_TARGET_ID,
  lowRiskTarget,
  cautionTarget,
  highRiskTarget,
} from "../fixtures";

const MOCK_SOURCE = "mock-token-intelligence";

const SAMPLE_PROFILES: Record<string, TokenProfile> = {
  [LOW_RISK_TARGET_ID]: {
    targetId: LOW_RISK_TARGET_ID,
    symbol: lowRiskTarget.symbol,
    name: lowRiskTarget.name,
    network: lowRiskTarget.network,
    address: lowRiskTarget.address,
    decimals: 18,
    totalSupply: "1000000",
    description: "SAMPLE — low risk demo token",
    website: null,
    explorerUrl: null,
  },
  [CAUTION_TARGET_ID]: {
    targetId: CAUTION_TARGET_ID,
    symbol: cautionTarget.symbol,
    name: cautionTarget.name,
    network: cautionTarget.network,
    address: cautionTarget.address,
    decimals: 18,
    totalSupply: "10000000",
    description: "SAMPLE — caution demo token",
    website: null,
    explorerUrl: null,
  },
  [HIGH_RISK_TARGET_ID]: {
    targetId: HIGH_RISK_TARGET_ID,
    symbol: highRiskTarget.symbol,
    name: highRiskTarget.name,
    network: highRiskTarget.network,
    address: highRiskTarget.address,
    decimals: 18,
    totalSupply: "1000000000",
    description: "SAMPLE — high risk demo token",
    website: null,
    explorerUrl: null,
  },
};

const SAMPLE_SNAPSHOTS: Record<string, MarketSnapshot> = {
  [LOW_RISK_TARGET_ID]: {
    targetId: LOW_RISK_TARGET_ID,
    priceUsd: 1.25,
    volume24hUsd: 250000,
    liquidityUsd: 800000,
    marketCapUsd: 1250000,
    change24hPct: 2.4,
    updatedAt: "2026-01-01T03:00:00.000Z",
  },
  [CAUTION_TARGET_ID]: {
    targetId: CAUTION_TARGET_ID,
    priceUsd: 0.08,
    volume24hUsd: 50000,
    liquidityUsd: 120000,
    marketCapUsd: 800000,
    change24hPct: -1.7,
    updatedAt: "2026-02-01T03:00:00.000Z",
  },
  [HIGH_RISK_TARGET_ID]: {
    targetId: HIGH_RISK_TARGET_ID,
    priceUsd: 0.001,
    volume24hUsd: 5000,
    liquidityUsd: 8000,
    marketCapUsd: 1000000,
    change24hPct: -45.2,
    updatedAt: "2026-03-01T03:00:00.000Z",
  },
};

export class MockTokenIntelligenceProvider implements TokenIntelligenceProvider {
  scenario: "success" | "empty" | "failed" = "success";

  async getTokenProfile(targetId: string): Promise<ProviderResult<TokenProfile>> {
    if (this.scenario === "empty") {
      return emptyResult<TokenProfile>(MOCK_SOURCE);
    }
    if (this.scenario === "failed") {
      return failedResult<TokenProfile>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }
    const profile = SAMPLE_PROFILES[targetId];
    if (!profile) {
      return failedResult<TokenProfile>(MOCK_SOURCE, {
        code: "NO_DATA",
        message: `No profile found for target "${targetId}".`,
        retryable: false,
        provider: MOCK_SOURCE,
      });
    }
    return successResult(profile, MOCK_SOURCE);
  }

  async getMarketSnapshot(targetId: string): Promise<ProviderResult<MarketSnapshot>> {
    if (this.scenario === "empty") {
      return emptyResult<MarketSnapshot>(MOCK_SOURCE);
    }
    if (this.scenario === "failed") {
      return failedResult<MarketSnapshot>(MOCK_SOURCE, {
        code: "UPSTREAM_ERROR",
        message: "Mock provider simulated an upstream failure.",
        retryable: true,
        provider: MOCK_SOURCE,
      });
    }
    const snapshot = SAMPLE_SNAPSHOTS[targetId];
    if (!snapshot) {
      return failedResult<MarketSnapshot>(MOCK_SOURCE, {
        code: "NO_DATA",
        message: `No market snapshot found for target "${targetId}".`,
        retryable: false,
        provider: MOCK_SOURCE,
      });
    }
    return successResult(snapshot, MOCK_SOURCE);
  }
}
