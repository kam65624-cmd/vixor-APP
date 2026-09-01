// ============================================================================
// Shield — GoPlus Security API Client
// ============================================================================
//
// GoPlus Security: Free, no API key. Covers EVM chains.
// For Solana tokens, we defer to RugCheck.
//
// Docs: https://docs.gopluslabs.io/reference/token-security-api
// ============================================================================

const GOPLUS_BASE = "https://api.gopluslabs.io/api/v1";

// Chain ID map (EVM only — Solana handled by RugCheck)
export const CHAIN_IDS: Record<string, string> = {
  ethereum: "1",
  eth: "1",
  bsc: "56",
  bnb: "56",
  polygon: "137",
  matic: "137",
  base: "8453",
  arbitrum: "42161",
  arb: "42161",
  avalanche: "43114",
  avax: "43114",
  optimism: "10",
  op: "10",
};

export interface GoPlusTokenSecurity {
  is_honeypot: string; // "0" or "1"
  buy_tax: string; // e.g. "0.05"
  sell_tax: string;
  is_mintable: string;
  is_proxy: string;
  can_take_back_ownership: string;
  owner_change_balance: string;
  hidden_owner: string;
  external_call: string;
  is_blacklisted: string;
  is_whitelisted: string;
  trading_cooldown: string;
  transfer_pausable: string;
  cannot_sell_all: string;
  personal_slippage_modifiable: string;
  anti_whale_modifiable: string;
  token_name: string;
  token_symbol: string;
  holder_count: string;
  total_supply: string;
  lp_holder_count: string;
  lp_total_supply: string;
  is_open_source: string;
  is_airdrop_scam: string;
  holders: Array<{
    address: string;
    balance: string;
    percent: string;
    is_contract: number;
    is_locked: number;
  }>;
  lp_holders: Array<{
    address: string;
    balance: string;
    percent: string;
    is_contract: number;
    is_locked: number;
    tag: string;
  }>;
  owner_address: string;
  creator_address: string;
}

export interface GoPlusResult {
  success: boolean;
  data: GoPlusTokenSecurity | null;
  error: string | null;
}

/**
 * Fetch GoPlus security data for an EVM token.
 * Returns null if chain is Solana (use RugCheck instead).
 */
export async function fetchGoPlusSecurity(
  chain: string,
  contractAddress: string,
): Promise<GoPlusResult> {
  const chainId = CHAIN_IDS[chain.toLowerCase()];

  // Solana tokens aren't supported by GoPlus — caller should use RugCheck
  if (!chainId) {
    return { success: false, data: null, error: `Chain ${chain} not supported by GoPlus` };
  }

  try {
    const res = await fetch(
      `${GOPLUS_BASE}/token_security/${chainId}?contract_addresses=${contractAddress}`,
      {
        signal: AbortSignal.timeout(12_000),
        headers: { Accept: "application/json" },
      },
    );

    if (!res.ok) {
      return {
        success: false,
        data: null,
        error: `GoPlus returned HTTP ${res.status}`,
      };
    }

    const json = await res.json();

    if (json.code !== 1) {
      return {
        success: false,
        data: null,
        error: json.message || "GoPlus API error",
      };
    }

    const tokenData = json.result?.[contractAddress.toLowerCase()];
    if (!tokenData) {
      return {
        success: false,
        data: null,
        error: "Token not found in GoPlus database",
      };
    }

    return { success: true, data: tokenData as GoPlusTokenSecurity, error: null };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { success: false, data: null, error: "GoPlus request timed out" };
    }
    return {
      success: false,
      data: null,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Parse top 10 holder concentration from GoPlus data.
 * Returns percentage held by top 10 non-LP holders.
 */
export function getTop10HolderPct(security: GoPlusTokenSecurity): number {
  if (!security.holders || security.holders.length === 0) return 0;

  const top10 = security.holders.slice(0, 10);
  const totalPct = top10.reduce((sum, h) => {
    const pct = parseFloat(h.percent || "0");
    return sum + (isNaN(pct) ? 0 : pct * 100);
  }, 0);

  return Math.min(100, totalPct);
}

/**
 * Check if LP is burned or locked.
 * Returns true if significant LP is locked/burned.
 */
export function isLpBurned(security: GoPlusTokenSecurity): boolean {
  if (!security.lp_holders || security.lp_holders.length === 0) return false;

  const burnAddresses = new Set([
    "0x000000000000000000000000000000000000dead",
    "0x0000000000000000000000000000000000000000",
  ]);

  let burnedPct = 0;
  let lockedPct = 0;

  for (const holder of security.lp_holders) {
    const pct = parseFloat(holder.percent || "0") * 100;
    if (isNaN(pct)) continue;

    if (burnAddresses.has(holder.address?.toLowerCase())) {
      burnedPct += pct;
    }
    if (holder.is_locked === 1) {
      lockedPct += pct;
    }
  }

  return burnedPct + lockedPct >= 80;
}
