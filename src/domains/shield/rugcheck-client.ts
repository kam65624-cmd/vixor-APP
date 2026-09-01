// ============================================================================
// Shield — RugCheck API Client (Solana Only)
// ============================================================================
//
// RugCheck: Free, no API key required.
// Only works for Solana SPL tokens.
//
// Docs: https://api.rugcheck.xyz/swagger
// ============================================================================

const RUGCHECK_BASE = "https://api.rugcheck.xyz/v1";

export interface RugCheckRisk {
  name: string;
  value: string;
  description: string;
  score: number;
  level: "warn" | "danger" | "info";
}

export interface RugCheckMarket {
  pubkey: string;
  marketType: string;
  liquidityA: string;
  liquidityB: string;
  mintA: string;
  mintB: string;
  lp: {
    lpLockedPct: number;
    lpBurnedPct: number;
    lpCurrentSupply: number;
    lpTotalSupply: number;
  };
}

export interface RugCheckHolder {
  address: string;
  amount: number;
  decimals: number;
  pct: number;
  uiAmount: number;
  uiAmountString: string;
  owner: string;
  insider: boolean;
}

export interface RugCheckReport {
  mint: string;
  tokenMeta: {
    name: string;
    symbol: string;
    uri: string;
    mutable: boolean;
    updateAuthority: string;
  };
  token: {
    supply: number;
    decimals: number;
    mintAuthority: string | null;
    freezeAuthority: string | null;
    isInitialized: boolean;
  };
  topHolders: RugCheckHolder[];
  markets: RugCheckMarket[];
  risks: RugCheckRisk[];
  score: number; // 0-1000+, lower is safer
  rugged: boolean;
}

export interface RugCheckResult {
  success: boolean;
  data: RugCheckReport | null;
  error: string | null;
}

/**
 * Fetch RugCheck security report for a Solana token.
 * Only works for Solana tokens (chain must be 'solana').
 */
export async function fetchRugCheckReport(mintAddress: string): Promise<RugCheckResult> {
  try {
    const res = await fetch(`${RUGCHECK_BASE}/tokens/${mintAddress}/report/summary`, {
      signal: AbortSignal.timeout(12_000),
      headers: { Accept: "application/json" },
    });

    if (res.status === 404) {
      return { success: false, data: null, error: "Token not found on RugCheck" };
    }

    if (!res.ok) {
      return { success: false, data: null, error: `RugCheck returned HTTP ${res.status}` };
    }

    const json = await res.json();
    return { success: true, data: json as RugCheckReport, error: null };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { success: false, data: null, error: "RugCheck request timed out" };
    }
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Get top 10 holder concentration from RugCheck data (%).
 */
export function getTop10HolderPctFromRugCheck(report: RugCheckReport): number {
  if (!report.topHolders || report.topHolders.length === 0) return 0;
  const top10 = report.topHolders.slice(0, 10);
  return top10.reduce((sum, h) => sum + (h.pct || 0) * 100, 0);
}

/**
 * Check if LP is burned or locked from RugCheck data.
 */
export function isLpBurnedFromRugCheck(report: RugCheckReport): boolean {
  if (!report.markets || report.markets.length === 0) return false;
  const mainMarket = report.markets[0];
  if (!mainMarket?.lp) return false;
  return (mainMarket.lp.lpBurnedPct || 0) + (mainMarket.lp.lpLockedPct || 0) >= 80;
}

/**
 * Check if mint authority is disabled (can't mint more tokens).
 */
export function isMintDisabled(report: RugCheckReport): boolean {
  return report.token?.mintAuthority === null;
}

/**
 * Check if freeze authority is disabled (can't freeze wallets).
 */
export function isFreezeDisabled(report: RugCheckReport): boolean {
  return report.token?.freezeAuthority === null;
}

/**
 * Count critical-level risks.
 */
export function countCriticalRisks(report: RugCheckReport): number {
  return (report.risks || []).filter((r) => r.level === "danger").length;
}
