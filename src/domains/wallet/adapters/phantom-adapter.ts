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
  signAndSendTransaction(transaction: unknown): Promise<{ signature: string }>;
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
      try {
        const bs58Module = await import("bs58");
        const bs58 = bs58Module.default || bs58Module;
        return bs58.encode(signature);
      } catch {
        return Array.from(signature)
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
      }
    },
    disconnect: async () => {
      try {
        await phantom.disconnect();
      } catch {
        /* ignore */
      }
    },
  };
}

/**
 * Get SOL balance for a Phantom-connected address.
 * Uses the Solana RPC from CHAIN_CONFIGS.
 */
export async function getPhantomSolBalance(address: string): Promise<number> {
  try {
    const { Connection, LAMPORTS_PER_SOL, PublicKey } = await import("@solana/web3.js");
    const rpcUrl = process.env.WALLET_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
    const connection = new Connection(rpcUrl, "confirmed");
    const balance = await connection.getBalance(new PublicKey(address));
    return balance / LAMPORTS_PER_SOL;
  } catch {
    return 0;
  }
}

/**
 * Get SPL token balances for a Phantom-connected address.
 * Uses Helius RPC if available (faster + richer metadata).
 */
export async function getPhantomTokenBalances(
  address: string,
): Promise<import("../types").TokenBalance[]> {
  try {
    const { Connection, PublicKey } = await import("@solana/web3.js");
    const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");

    const heliusKey = process.env.HELIUS_API_KEY;
    const rpcUrl = heliusKey
      ? `https://mainnet.helius-rpc.com/?api-key=${heliusKey}`
      : process.env.WALLET_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

    const connection = new Connection(rpcUrl, "confirmed");
    const resp = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), {
      programId: TOKEN_PROGRAM_ID,
    });

    const balances: import("../types").TokenBalance[] = [];
    for (const acc of resp.value) {
      const info = acc.account.data.parsed?.info;
      if (!info || Number(info.tokenAmount.uiAmount) === 0) continue;

      balances.push({
        mint: info.mint,
        symbol: ((info as Record<string, unknown>).symbol as string) || "UNKNOWN",
        name: ((info as Record<string, unknown>).name as string) || "Unknown Token",
        decimals: info.tokenAmount.decimals,
        balance: info.tokenAmount.amount,
        balanceFormatted: info.tokenAmount.uiAmount.toFixed(info.tokenAmount.decimals > 6 ? 4 : 6),
        valueUsd: 0,
        isVerified: false,
        isHoneypot: false,
      });
    }

    return balances;
  } catch {
    return [];
  }
}

// ============================================================================
// Swap execution
// ============================================================================

/** Extended Phantom interface with transaction signing */
interface PhantomSolanaFull extends PhantomSolana {
  signAndSendTransaction(
    transaction: unknown,
    options?: { skipPreflight?: boolean },
  ): Promise<{ signature: string }>;
}

/**
 * Sign and send a Solana transaction via Phantom wallet.
 * Used for Jupiter swap execution after getting a swap transaction from the server.
 *
 * @param serializedTransaction - Base64-encoded serialized VersionedTransaction
 * @param rpcUrl - Solana RPC endpoint to confirm the tx
 * @returns Transaction signature (hash)
 */
export async function signAndSendSolanaTransaction(
  serializedTransaction: string,
  rpcUrl = "https://api.mainnet-beta.solana.com",
): Promise<string> {
  const phantomFull = getPhantom() as PhantomSolanaFull;
  if (!phantomFull.signAndSendTransaction) {
    throw new Error("Phantom does not support signAndSendTransaction");
  }

  const { VersionedTransaction } = await import("@solana/web3.js");
  const txBuffer = Uint8Array.from(atob(serializedTransaction), (c) => c.charCodeAt(0));
  const transaction = VersionedTransaction.deserialize(txBuffer);

  const { signature } = await phantomFull.signAndSendTransaction(transaction, {
    skipPreflight: false,
  });

  // Wait for confirmation
  try {
    const { Connection } = await import("@solana/web3.js");
    const connection = new Connection(rpcUrl, "confirmed");
    await connection.confirmTransaction(signature, "confirmed");
  } catch {
    // Non-blocking: return signature even if confirmation polling fails
  }

  return signature;
}
