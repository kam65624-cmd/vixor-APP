// ============================================================================
// Trade — 1inch DEX Aggregator API Client (EVM Swaps)
// ============================================================================
//
// 1inch Swap API v6.0. Requires an API key from https://portal.1inch.dev
// (set ONEINCH_API_KEY in the server environment).
// Docs: https://portal.1inch.dev/documentation/apis/swap/swagger
// ============================================================================

const ONEINCH_BASE = "https://api.1inch.dev/swap/v6.0";

/** 1inch's placeholder address for the native gas token (ETH/MATIC/AVAX) */
export const ONEINCH_NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export interface OneInchQuoteResult {
  ok: boolean;
  error: string | null;
  srcToken: string;
  dstToken: string;
  srcAmount: string;
  dstAmount: string;
  estimatedGas: number;
}

export interface OneInchSwapTxResult {
  ok: boolean;
  error: string | null;
  dstAmount: string;
  tx: {
    to: string;
    data: string;
    value: string;
    gas: number;
  } | null;
}

function apiKey(): string | null {
  return process.env.ONEINCH_API_KEY || null;
}

function authHeaders(): Record<string, string> {
  const key = apiKey();
  return key
    ? { Authorization: `Bearer ${key}`, Accept: "application/json" }
    : { Accept: "application/json" };
}

/**
 * Fetch a swap quote from 1inch (EVM chains only).
 *
 * @param chainId - EVM chain ID as a number (1 = Ethereum, 137 = Polygon, 43114 = Avalanche)
 * @param src - Source token contract address (use ONEINCH_NATIVE_TOKEN for native gas token)
 * @param dst - Destination token contract address
 * @param amount - Amount in the source token's smallest unit (wei-equivalent), as a string
 */
export async function fetch1inchQuote(
  chainId: number,
  src: string,
  dst: string,
  amount: string,
): Promise<OneInchQuoteResult> {
  if (!apiKey()) {
    return {
      ok: false,
      error: "1inch API key not configured on the server (ONEINCH_API_KEY)",
      srcToken: src,
      dstToken: dst,
      srcAmount: amount,
      dstAmount: "0",
      estimatedGas: 0,
    };
  }

  try {
    const url = `${ONEINCH_BASE}/${chainId}/quote?src=${src}&dst=${dst}&amount=${amount}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: authHeaders(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `1inch quote API returned HTTP ${res.status}${text ? `: ${text}` : ""}`,
        srcToken: src,
        dstToken: dst,
        srcAmount: amount,
        dstAmount: "0",
        estimatedGas: 0,
      };
    }

    const json = (await res.json()) as {
      dstAmount: string;
      gas?: number;
    };

    return {
      ok: true,
      error: null,
      srcToken: src,
      dstToken: dst,
      srcAmount: amount,
      dstAmount: json.dstAmount,
      estimatedGas: json.gas ?? 0,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "1inch quote failed",
      srcToken: src,
      dstToken: dst,
      srcAmount: amount,
      dstAmount: "0",
      estimatedGas: 0,
    };
  }
}

/**
 * Build an unsigned swap transaction via 1inch. The caller (wallet adapter)
 * is responsible for sending it through the connected EVM wallet.
 *
 * @param fromAddress - The connected EVM wallet address that will sign the tx
 * @param slippage - Slippage tolerance as a percentage (e.g. 1 = 1%)
 */
export async function fetch1inchSwapTransaction(
  chainId: number,
  src: string,
  dst: string,
  amount: string,
  fromAddress: string,
  slippage: number = 1,
): Promise<OneInchSwapTxResult> {
  if (!apiKey()) {
    return {
      ok: false,
      error: "1inch API key not configured on the server (ONEINCH_API_KEY)",
      dstAmount: "0",
      tx: null,
    };
  }

  try {
    const url =
      `${ONEINCH_BASE}/${chainId}/swap?src=${src}&dst=${dst}&amount=${amount}` +
      `&from=${fromAddress}&slippage=${slippage}&disableEstimate=false`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: authHeaders(),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `1inch swap API returned HTTP ${res.status}${text ? `: ${text}` : ""}`,
        dstAmount: "0",
        tx: null,
      };
    }

    const json = (await res.json()) as {
      dstAmount: string;
      tx: { to: string; data: string; value: string; gas: number };
    };

    return {
      ok: true,
      error: null,
      dstAmount: json.dstAmount,
      tx: json.tx,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to build 1inch swap transaction",
      dstAmount: "0",
      tx: null,
    };
  }
}

/** Common EVM token addresses per chain, for the swap token selector */
export const EVM_SWAP_TOKENS: Record<
  number,
  Array<{ symbol: string; address: string; decimals: number }>
> = {
  1: [
    { symbol: "ETH", address: ONEINCH_NATIVE_TOKEN, decimals: 18 },
    { symbol: "USDC", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
    { symbol: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
  ],
  137: [
    { symbol: "MATIC", address: ONEINCH_NATIVE_TOKEN, decimals: 18 },
    { symbol: "USDC", address: "0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359", decimals: 6 },
    { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6 },
  ],
  43114: [
    { symbol: "AVAX", address: ONEINCH_NATIVE_TOKEN, decimals: 18 },
    { symbol: "USDC", address: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E", decimals: 6 },
    { symbol: "USDT", address: "0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7", decimals: 6 },
  ],
};
