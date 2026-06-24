// ============================================================================
// VIXOR Wallet Domain — Barrel Export (CLIENT-SAFE)
// ============================================================================
//
// Public API for the wallet domain.
// Import from "@/domains/wallet" to access client-safe exports.
//
// For server-only functions (connectWallet, verifyWalletSignature, etc.),
// import from "@/domains/wallet/server" instead.
// ============================================================================

// Types
export type {
  WalletChain,
  WalletStatus,
  WalletInfo,
  WalletSession,
  ConnectWalletRequest,
  ConnectWalletResponse,
  WalletBalance,
  TokenBalance,
  ChainConfig,
  WalletJwtPayload,
  EvmChainId,
  EvmChainInfo,
  WalletProvider,
  WalletProviderInfo,
} from "./types";

// Constants
export { EVM_CHAINS } from "./types";

// Config
export {
  CHAIN_CONFIGS,
  WALLET_SESSION_TTL_SECONDS,
  WALLET_SESSION_TTL_MS,
  MAX_WALLET_SESSIONS_PER_USER,
  CHALLENGE_EXPIRY_SECONDS,
  generateChallengeMessage,
  generateNonce,
  isValidWalletAddress,
} from "./config";
