// ============================================================================
// VIXOR V2 — Token Intelligence Provider
// ============================================================================
//
// Returns technical and market data for a target.
// Does NOT interpret risk — that is the role of the risk assessment layer.
// ============================================================================

import type { ProviderResult } from "./types";

export interface TokenProfile {
  targetId: string;
  symbol: string | null;
  name: string | null;
  network: string | null;
  address: string;
  decimals: number | null;
  totalSupply: string | null;
  description: string | null;
  website: string | null;
  explorerUrl: string | null;
}

export interface MarketSnapshot {
  targetId: string;
  priceUsd: number | null;
  volume24hUsd: number | null;
  liquidityUsd: number | null;
  marketCapUsd: number | null;
  change24hPct: number | null;
  updatedAt: string;
}

export interface TokenIntelligenceProvider {
  getTokenProfile(targetId: string): Promise<ProviderResult<TokenProfile>>;
  getMarketSnapshot(targetId: string): Promise<ProviderResult<MarketSnapshot>>;
}
