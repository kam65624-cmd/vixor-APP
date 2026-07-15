// ============================================================================
// VIXOR Alchemy RPC Client — EVM On-Chain Data
// ============================================================================
// Uses Alchemy enhanced RPC for EVM chains:
//   - ETH Mainnet, BSC, Base
//   - Native balance (ETH/BNB/base)
//   - ERC-20 token balances
//   - Gas price estimation
//   - Block number
// Rate limited via shared limiter.
// ============================================================================

import { Limiters } from "@/shared/resilience/rate-limiter";

// ── Types ───────────────────────────────────────────────────────────────────

export type EvmChain = "eth" | "bsc" | "base";

export interface EvmNativeBalance {
  wei: string;
  ether: number;
  chain: EvmChain;
}

export interface Erc20TokenBalance {
  contractAddress: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  uiAmount: number;
  logoUrl?: string;
}

export interface EvmChainConfig {
  name: string;
  chainId: string;
  rpcUrl: string;
  nativeSymbol: string;
  explorerUrl: string;
  blockExplorerTx: string;
}

// ── Chain Configs ────────────────────────────────────────────────────────────

const CHAIN_CONFIGS: Record<EvmChain, EvmChainConfig> = {
  eth: {
    name: "Ethereum",
    chainId: "0x1",
    rpcUrl: "",
    nativeSymbol: "ETH",
    explorerUrl: "https://etherscan.io",
    blockExplorerTx: "https://etherscan.io/tx/",
  },
  bsc: {
    name: "BNB Chain",
    chainId: "0x89",
    rpcUrl: "",
    nativeSymbol: "BNB",
    explorerUrl: "https://bscscan.com",
    blockExplorerTx: "https://bscscan.com/tx/",
  },
  base: {
    name: "Base",
    chainId: "0xa86a",
    rpcUrl: "",
    nativeSymbol: "ETH",
    explorerUrl: "https://basescan.org",
    blockExplorerTx: "https://basescan.org/tx/",
  },
};

function getChainConfig(chain: EvmChain): EvmChainConfig {
  const config = { ...CHAIN_CONFIGS[chain] };
  const envMap: Record<EvmChain, string> = {
    eth: "ETH_RPC_URL",
    bsc: "BSC_RPC_URL",
    base: "BASE_RPC_URL",
  };
  const envUrl = process.env[envMap[chain]];
  if (envUrl) config.rpcUrl = envUrl;
  else {
    const key = process.env.ALCHEMY_API_KEY || "";
    const networkMap: Record<EvmChain, string> = {
      eth: "eth-mainnet",
      bsc: "bsc-mainnet",
      base: "base-mainnet",
    };
    config.rpcUrl = `https://${networkMap[chain]}.g.alchemy.com/v2/${key}`;
  }
  return config;
}

function isConfigured(): boolean {
  return !!(process.env.ALCHEMY_API_KEY || process.env.ETH_RPC_URL);
}

// ── JSON-RPC Helper ────────────────────────────────────────────────────────

async function rpcCall<T>(
  chain: EvmChain,
  method: string,
  params: unknown[] = [],
): Promise<T | null> {
  if (!isConfigured()) return null;
  const config = getChainConfig(chain);

  try {
    await Limiters.alchemy.wait();
    const res = await fetch(config.rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error) {
      console.warn(`[Alchemy] ${chain} RPC error for ${method}:`, data.error.message);
      return null;
    }
    return data.result as T;
  } catch (err) {
    console.warn(
      `[Alchemy] ${chain} ${method} failed:`,
      err instanceof Error ? err.message : String(err),
    );
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Get native balance (ETH/BNB) for an address */
export async function getNativeBalance(
  address: string,
  chain: EvmChain = "eth",
): Promise<EvmNativeBalance | null> {
  const result = await rpcCall<string>(chain, "eth_getBalance", [address, "latest"]);
  if (!result) return null;
  const wei = BigInt(result);
  return { wei: result, ether: Number(wei) / 1e18, chain };
}

/** Get ERC-20 token balance for a specific token */
export async function getErc20Balance(
  walletAddress: string,
  tokenAddress: string,
  chain: EvmChain = "eth",
): Promise<number | null> {
  // ERC-20 balanceOf(address) selector
  const data = "0x70a08231" + walletAddress.slice(2).padStart(64, "0");
  const result = await rpcCall<string>(chain, "eth_call", [{ to: tokenAddress, data }, "latest"]);
  if (!result) return null;
  return parseInt(result, 16) / 1e18;
}

/** Get estimated gas price in gwei */
export async function getGasPrice(chain: EvmChain = "eth"): Promise<number | null> {
  const result = await rpcCall<string>(chain, "eth_gasPrice");
  if (!result) return null;
  return Number(BigInt(result)) / 1e9;
}

/** Get latest block number */
export async function getBlockNumber(chain: EvmChain = "eth"): Promise<number | null> {
  const result = await rpcCall<string>(chain, "eth_blockNumber");
  if (!result) return null;
  return parseInt(result, 16);
}

/** Get chain config for UI display */
export function getChainConfigs(): Record<EvmChain, EvmChainConfig> {
  return Object.fromEntries(
    (Object.keys(CHAIN_CONFIGS) as EvmChain[]).map((c) => [c, getChainConfig(c)]),
  ) as Record<EvmChain, EvmChainConfig>;
}
