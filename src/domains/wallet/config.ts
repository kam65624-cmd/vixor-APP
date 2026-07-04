// ============================================================================
// VIXOR Wallet Domain — Configuration
// ============================================================================
//
// Chain configurations and wallet-related environment variables.
// All wallet env vars use WALLET_ prefix to avoid conflicts.
// ============================================================================

import type { ChainConfig, WalletChain } from "./types";

/** Supported chains with their configurations */
export const CHAIN_CONFIGS: Record<WalletChain, ChainConfig> = {
  solana: {
    chain: "solana",
    label: "Solana",
    nativeSymbol: "SOL",
    nativeDecimals: 9,
    explorerUrl: "https://solscan.io/address/",
    rpcUrls: [process.env.WALLET_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"],
  },
  evm: {
    chain: "evm",
    label: "Ethereum",
    nativeSymbol: "ETH",
    nativeDecimals: 18,
    explorerUrl: "https://etherscan.io/address/",
    rpcUrls: [process.env.WALLET_EVM_RPC_URL || "https://eth.llamarpc.com"],
  },
  ton: {
    chain: "ton",
    label: "TON",
    nativeSymbol: "TON",
    nativeDecimals: 9,
    explorerUrl: "https://tonviewer.com/",
    rpcUrls: ["https://toncenter.com/api/v2/"],
  },
} as const;

/** Wallet session TTL in seconds (default: 7 days) */
export const WALLET_SESSION_TTL_SECONDS = 7 * 24 * 60 * 60;

/** Wallet session TTL in milliseconds */
export const WALLET_SESSION_TTL_MS = WALLET_SESSION_TTL_SECONDS * 1000;

/** Maximum number of active wallet sessions per user */
export const MAX_WALLET_SESSIONS_PER_USER = 5;

/** Challenge message expiry in seconds (5 minutes) */
export const CHALLENGE_EXPIRY_SECONDS = 5 * 60;

/** Generate a wallet connection challenge message */
export function generateChallengeMessage(nonce: string): string {
  return `VIXOR Wallet Verification\n\nSign this message to connect your wallet.\n\nNonce: ${nonce}\nTimestamp: ${Date.now()}\n\nThis does not cost any gas or tokens.\nBy signing, you agree to the VIXOR Terms of Service.`;
}

/** Generate a cryptographic nonce for challenge messages */
export function generateNonce(): string {
  const array = new Uint8Array(16);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(array);
  } else {
    for (let i = 0; i < 16; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Validate a wallet address format for a given chain */
export function isValidWalletAddress(address: string, chain: WalletChain): boolean {
  if (!address || typeof address !== "string") return false;
  const trimmed = address.trim();
  if (chain === "solana") {
    // Solana addresses are base58 encoded, 32-44 characters
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(trimmed);
  }
  if (chain === "ton") {
    // TON addresses: raw (48 hex chars) or bounceable/non-bounceable user-friendly
    // User-friendly: EQ... or UQ... (base64url, 48 chars)
    // Raw: 0: followed by 64 hex chars
    return /^(EQ[A-Za-z0-9_-]{46}|UQ[A-Za-z0-9_-]{46}|0:[0-9a-fA-F]{64})$/.test(trimmed);
  }
  // EVM addresses are hex, 0x-prefixed, 42 characters
  return /^0x[0-9a-fA-F]{40}$/.test(trimmed);
}
