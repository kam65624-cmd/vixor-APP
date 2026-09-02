// ============================================================================
// VIXOR MetaMask Adapter — EVM Wallet (ETH + Polygon + Avalanche)
// ============================================================================
//
// Detects MetaMask (window.ethereum), provides getAddress/signMessage
// callbacks compatible with the WalletProvider connect() method.
// Supports 3 chains: Ethereum (0x1), Polygon (0x89), Avalanche (0xa86a).
//
// Non-custodial: only interacts with MetaMask's public provider API.
// ============================================================================

import type { EvmChainId } from "../types";
import { EVM_CHAINS } from "../types";

/** Type for the injected EIP-1193 provider */
interface Eip1193Provider {
  isMetaMask?: boolean;
  request(args: { method: string; params?: unknown[] }): Promise<unknown>;
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider;
  }
}

/** Check if MetaMask (or compatible EIP-1193 wallet) is installed */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum?.isMetaMask;
}

/** Get the EIP-1193 provider, throws if not available */
function getProvider(): Eip1193Provider {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask not installed. Install it from metamask.io");
  }
  return window.ethereum;
}

/**
 * Build a SIWE-like message for wallet authentication.
 * Follows EIP-4361 structure.
 */
export function buildSIWEMessage(address: string, chainId: EvmChainId): string {
  const domain = typeof window !== "undefined" ? window.location.host : "vixor.app";
  const nonce = crypto.randomUUID();
  const chain = EVM_CHAINS[chainId];

  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    "Sign in to VIXOR Trading OS.",
    "",
    `URI: ${typeof window !== "undefined" ? window.location.origin : "https://vixor.app"}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Network: ${chain.label}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join("\n");
}

/**
 * Switch to a specific EVM chain in MetaMask.
 * If the chain is not added, it will prompt to add it.
 */
export async function switchChain(chainId: EvmChainId): Promise<void> {
  const provider = getProvider();
  const chain = EVM_CHAINS[chainId];

  // Hex-encoded chain ID as number for the RPC call
  const chainIdNum = parseInt(chainId, 16);

  try {
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: `0x${chainIdNum.toString(16)}` }],
    });
  } catch (switchError: unknown) {
    // 4902 = chain not added, try to add it
    const err = switchError as { code?: number };
    if (err.code === 4902) {
      await provider.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainIdNum.toString(16)}`,
            chainName: chain.label,
            nativeCurrency: { name: chain.nativeSymbol, symbol: chain.nativeSymbol, decimals: 18 },
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: [chain.explorerUrl],
          },
        ],
      });
    } else {
      throw switchError;
    }
  }
}

/**
 * Connect to MetaMask and return callbacks for WalletProvider.
 *
 * @param chainId - The EVM chain to connect to (default: "0x1" for Ethereum)
 *
 * @example
 * ```tsx
 * const { connect } = useWallet();
 * const { getAddress, signMessage, disconnect: mmDisconnect } = await connectMetaMask("0x89");
 * await connect({ chain: "evm", getAddress, signMessage });
 * ```
 */
export async function connectMetaMask(chainId: EvmChainId = "0x1"): Promise<{
  getAddress: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  getChainId: () => Promise<EvmChainId>;
  switchToChain: (id: EvmChainId) => Promise<void>;
  disconnect: () => void;
}> {
  const provider = getProvider();

  // Request account access
  const accounts = (await provider.request({
    method: "eth_requestAccounts",
  })) as string[];

  if (!accounts || accounts.length === 0) {
    throw new Error("No accounts returned from MetaMask");
  }

  const address = accounts[0];

  // Switch to the requested chain
  await switchChain(chainId);

  return {
    getAddress: async () => address,
    signMessage: async (message: string) => {
      // eth_sign + personal_sign both work; personal_sign is more user-friendly
      const signature = (await provider.request({
        method: "personal_sign",
        params: [message, address],
      })) as string;
      return signature;
    },
    getChainId: async () => {
      const id = (await provider.request({ method: "eth_chainId" })) as string;
      return id as EvmChainId;
    },
    switchToChain: async (id: EvmChainId) => {
      await switchChain(id);
    },
    disconnect: () => {
      // MetaMask doesn't have a programmatic disconnect.
      // The user disconnects via the MetaMask UI.
      // We just clear local state.
    },
  };
}

/**
 * Get the EVM chain MetaMask is currently connected to (live read, not cached
 * state — the user may switch networks in the extension after connecting).
 */
export async function getCurrentEvmChainId(): Promise<EvmChainId> {
  const provider = getProvider();
  const id = (await provider.request({ method: "eth_chainId" })) as string;
  return id as EvmChainId;
}

/**
 * Send an EVM transaction (e.g. a swap built by 1inch) through MetaMask.
 * Returns the transaction hash once the user approves it in the wallet UI.
 */
export async function sendEvmTransaction(tx: {
  to: string;
  data: string;
  value?: string;
  from: string;
  gas?: number;
}): Promise<string> {
  const provider = getProvider();
  const txHash = (await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        to: tx.to,
        data: tx.data,
        value: tx.value ?? "0x0",
        from: tx.from,
        ...(tx.gas ? { gas: `0x${tx.gas.toString(16)}` } : {}),
      },
    ],
  })) as string;
  return txHash;
}

/**
 * Get native token (ETH/MATIC/AVAX) balance for an EVM address.
 */
export async function getEvmNativeBalance(address: string, chainId: EvmChainId): Promise<number> {
  const chain = EVM_CHAINS[chainId];
  const resp = await fetch(chain.rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const data = await resp.json();
  const balanceWei = BigInt(data.result);
  return Number(balanceWei) / 1e18;
}
