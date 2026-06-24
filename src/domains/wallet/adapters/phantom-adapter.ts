// ============================================================================
// VIXOR Phantom Adapter — Solana Wallet
// ============================================================================
//
// Detects Phantom wallet, provides getAddress/signMessage callbacks
// compatible with the WalletProvider connect() method.
//
// Non-custodial: only interacts with Phantom's public API.
// No private keys are ever accessed or stored.
// ============================================================================

import type { WalletChain } from "../types";

/** Type for Phantom's Solana interface injected into window */
interface PhantomSolana {
  isPhantom?: boolean;
  isConnected: boolean;
  publicKey: { toString(): string } | null;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: string): Promise<{ signature: Uint8Array }>;
}

declare global {
  interface Window {
    phantom?: {
      solana?: PhantomSolana;
    };
  }
}

/** Check if Phantom wallet is installed */
export function isPhantomInstalled(): boolean {
  return typeof window !== "undefined" && !!window.phantom?.solana?.isPhantom;
}

/** Get Phantom's Solana interface, throws if not available */
function getPhantom(): PhantomSolana {
  if (typeof window === "undefined" || !window.phantom?.solana) {
    throw new Error("Phantom wallet not installed. Install it from phantom.app");
  }
  return window.phantom.solana;
}

/**
 * Connect to Phantom wallet and return callbacks for WalletProvider.
 *
 * @example
 * ```tsx
 * const { connect } = useWallet();
 * const { getAddress, signMessage, disconnect: phantomDisconnect } = await connectPhantom();
 * await connect({ chain: "solana", getAddress, signMessage });
 * ```
 */
export async function connectPhantom(): Promise<{
  getAddress: () => Promise<string>;
  signMessage: (message: string) => Promise<string>;
  disconnect: () => Promise<void>;
}> {
  const phantom = getPhantom();

  // Connect to Phantom (shows the approval popup)
  const resp = await phantom.connect();
  const address = resp.publicKey.toString();

  return {
    getAddress: async () => address,
    signMessage: async (message: string) => {
      const encoded = new TextEncoder().encode(message);
      const { signature } = await phantom.signMessage(encoded, "utf8");
      // Return base58-encoded signature (Solana standard)
      const { default: bs58 } = await import("bs58");
      return bs58.encode(signature);
    },
    disconnect: async () => {
      try { await phantom.disconnect(); } catch { /* ignore */ }
    },
  };
}

/**
 * Get SOL balance for a Phantom-connected address.
 * Uses the Solana RPC from CHAIN_CONFIGS.
 */
export async function getPhantomSolBalance(address: string): Promise<number> {
  const { Connection, LAMPORTS_PER_SOL } = await import("@solana/web3.js");
  const rpcUrl = process.env.WALLET_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const balance = await connection.getBalance(new (await import("@solana/web3.js")).PublicKey(address));
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Get SPL token balances for a Phantom-connected address.
 * Uses Helius RPC if available (faster + richer metadata).
 */
export async function getPhantomTokenBalances(address: string): Promise<import("../types").TokenBalance[]> {
  const { Connection, PublicKey } = await import("@solana/web3.js");
  const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

  // Use Helius if key is available
  const heliusKey = process.env.HELIUS_API_KEY;
  const rpcUrl = heliusKey
    ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
    : process.env.WALLET_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

  const connection = new Connection(rpcUrl, "confirmed");
  const resp = await connection.getParsedTokenAccountsByOwner(
    new PublicKey(address),
    { programId: TOKEN_PROGRAM_ID },
  );

  const balances: import("../types").TokenBalance[] = [];
  for (const acc of resp.value) {
    const info = acc.account.data.parsed?.info;
    if (!info || Number(info.tokenAmount.uiAmount) === 0) continue;

    balances.push({
      mint: info.mint,
      symbol: (info as Record<string, unknown>).symbol as string || "UNKNOWN",
      name: (info as Record<string, unknown>).name as string || "Unknown Token",
      decimals: info.tokenAmount.decimals,
      balance: info.tokenAmount.amount,
      balanceFormatted: info.tokenAmount.uiAmount.toFixed(info.tokenAmount.decimals > 6 ? 4 : 6),
      valueUsd: 0, // Filled by price service
      isVerified: false,
      isHoneypot: false,
    });
  }

  return balances;
}