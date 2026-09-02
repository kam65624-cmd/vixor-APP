// ============================================================================
// Trade — Jupiter DEX Aggregator API Client (Solana Swaps)
// ============================================================================
//
// Jupiter V6 API: Free, no API key required for basic quotes & swap transactions.
// Docs: https://station.jup.ag/docs/api/v6-quote-api
// ============================================================================

const JUPITER_QUOTE_BASE = "https://quote-api.jup.ag/v6";

export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: Array<{
    swapInfo: {
      ammKey: string;
      label: string;
      inputMint: string;
      outputMint: string;
      inAmount: string;
      outAmount: string;
      feeAmount: string;
      feeMint: string;
    };
    percent: number;
  }>;
  contextSlot?: number;
  timeTaken?: number;
}

export interface SwapQuoteResult {
  ok: boolean;
  error: string | null;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  priceImpactPct: number;
  slippageBps: number;
  route: string[];
  rawQuote: JupiterQuoteResponse | null;
}

/**
 * Fetch a swap quote from Jupiter Aggregator (Solana).
 *
 * @param inputMint - SPL token mint address to swap from
 * @param outputMint - SPL token mint address to swap to
 * @param amount - Amount in atomic units (e.g. lamports for SOL)
 * @param slippageBps - Slippage tolerance in basis points (50 = 0.5%)
 */
export async function fetchJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 50,
): Promise<SwapQuoteResult> {
  try {
    const url = `${JUPITER_QUOTE_BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10_000),
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      return {
        ok: false,
        error: `Jupiter API returned HTTP ${res.status}`,
        inputMint,
        outputMint,
        inAmount: amount,
        outAmount: 0,
        priceImpactPct: 0,
        slippageBps,
        route: [],
        rawQuote: null,
      };
    }

    const json = (await res.json()) as JupiterQuoteResponse;

    const route = (json.routePlan || []).map((r) => r.swapInfo?.label || "DEX");

    return {
      ok: true,
      error: null,
      inputMint: json.inputMint,
      outputMint: json.outputMint,
      inAmount: parseFloat(json.inAmount || "0"),
      outAmount: parseFloat(json.outAmount || "0"),
      priceImpactPct: parseFloat(json.priceImpactPct || "0"),
      slippageBps: json.slippageBps,
      route,
      rawQuote: json,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Jupiter quote failed",
      inputMint,
      outputMint,
      inAmount: amount,
      outAmount: 0,
      priceImpactPct: 0,
      slippageBps,
      route: [],
      rawQuote: null,
    };
  }
}

export interface JupiterSwapTxResult {
  ok: boolean;
  error: string | null;
  /** Base64-encoded serialized VersionedTransaction, ready to sign */
  swapTransaction: string | null;
  lastValidBlockHeight: number | null;
}

/**
 * Build a serialized (unsigned) swap transaction from a Jupiter quote.
 * The caller (wallet adapter) is responsible for signing + sending it.
 *
 * @param quoteResponse - The raw quote object returned by fetchJupiterQuote
 * @param userPublicKey - The connected Solana wallet's public address
 */
export async function fetchJupiterSwapTransaction(
  quoteResponse: JupiterQuoteResponse,
  userPublicKey: string,
): Promise<JupiterSwapTxResult> {
  try {
    const res = await fetch(`${JUPITER_QUOTE_BASE}/swap`, {
      method: "POST",
      signal: AbortSignal.timeout(15_000),
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: "auto",
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: `Jupiter swap API returned HTTP ${res.status}${text ? `: ${text}` : ""}`,
        swapTransaction: null,
        lastValidBlockHeight: null,
      };
    }

    const json = (await res.json()) as {
      swapTransaction: string;
      lastValidBlockHeight: number;
    };

    return {
      ok: true,
      error: null,
      swapTransaction: json.swapTransaction,
      lastValidBlockHeight: json.lastValidBlockHeight ?? null,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to build Jupiter swap transaction",
      swapTransaction: null,
      lastValidBlockHeight: null,
    };
  }
}

/** Known Solana Mint Addresses for convenience */
export const SOLANA_MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  USDC: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
  JUP: "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
};
