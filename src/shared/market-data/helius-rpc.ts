// ============================================================================
// VIXOR Helius RPC Client — Solana On-Chain Data
// ============================================================================
// Uses Helius enhanced RPC for Solana blockchain queries:
//   - Token balances (SPL tokens + SOL native)
//   - Token metadata
//   - Transaction signatures
//   - DAS (Digital Asset Standard) for NFTs
// Rate limited via shared limiter.
// ============================================================================

import { Limiters } from "@/shared/resilience/rate-limiter";

// ── Types ───────────────────────────────────────────────────────────────────

export interface SolanaBalance {
  lamports: number;
  sol: number;
}

export interface SplTokenBalance {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: number;
  uiAmount: number;
  logoUrl?: string;
}

export interface HeliusTokenAccounts {
  nativeBalance: SolanaBalance;
  tokens: SplTokenBalance[];
}

// ── Config ──────────────────────────────────────────────────────────────────

function getRpcUrl(): string {
  return (
    process.env.SOLANA_RPC_URL ||
    `https://mainnet.helius-rpc.com/?api-key=${process.env.HELIUS_API_KEY || ""}`
  );
}

function isConfigured(): boolean {
  return !!(process.env.HELIUS_API_KEY || process.env.SOLANA_RPC_URL);
}

// ── JSON-RPC Helper ────────────────────────────────────────────────────────

async function rpcCall<T>(method: string, params: unknown[] = []): Promise<T | null> {
  if (!isConfigured()) return null;

  try {
    await Limiters.helius.wait();
    const res = await fetch(getRpcUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) {
      console.warn(`[Helius] RPC error for ${method}:`, data.error.message);
      return null;
    }
    return data.result as T;
  } catch (err) {
    console.warn(
      `[Helius] ${method} failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Get SOL native balance for a wallet address */
export async function getSolanaBalance(address: string): Promise<SolanaBalance | null> {
  const result = await rpcCall<{ value: number; context: { slot: number } }>(
    "getBalance",
    [address],
  );
  if (!result) return null;
  const lamports = result.value;
  return { lamports, sol: lamports / 1e9 };
}

/**
 * Get all SPL token balances for a wallet using Helius DAS API.
 * Returns parsed token accounts with decimals, symbol, and logo.
 */
export async function getTokenAccounts(address: string): Promise<SplTokenBalance[]> {
  if (!process.env.HELIUS_API_KEY) return [];

  try {
    await Limiters.helius.wait();
    const url = `https://api.helius.xyz/v0/addresses/${address}/balances?api-key=${process.env.HELIUS_API_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!res.ok) return [];
    const data = await res.json();

  if (!data.tokens || !Array.isArray(data.tokens)) return [];

  return data.tokens
    .filter((t: any) => t.amount !== "0" && t.mint)
    .map((t: any) => ({
      mint: t.mint,
      symbol: t.symbol || "UNKNOWN",
      name: t.name || t.symbol || "Unknown Token",
      decimals: t.decimals ?? 9,
      balance: BigInt(t.amount || "0"),
      uiAmount: t.nativeBalance?.balance ? parseFloat(t.nativeBalance.balance) : 0,
      logoUrl: t.logoURI,
    }));
  } catch (err) {
    console.warn(
      `[Helius] getTokenAccounts failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return [];
  }
}

/**
 * Get comprehensive token balances: native SOL + all SPL tokens.
 */
export async function getFullTokenBalances(address: string): Promise<HeliusTokenAccounts> {
  const [nativeBalance, tokens] = await Promise.all([
    getSolanaBalance(address),
    getTokenAccounts(address),
  ]);

  return {
    nativeBalance: nativeBalance ?? { lamports: 0, sol: 0 },
    tokens,
  };
}

/** Get latest block height */
export async function getBlockHeight(): Promise<number | null> {
  const result = await rpcCall<number>("getBlockHeight");
  return result;
}

/** Get health status */
export async function getHealth(): Promise<"ok" | null> {
  const result = await rpcCall<string>("getHealth");
  return result === "ok" ? "ok" : null;
}
