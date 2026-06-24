// ============================================================================
// VIXOR Wallet Domain — Types
// ============================================================================
//
// Defines all types for the non-custodial wallet connection system.
// VIXOR never stores private keys — only public addresses and signed sessions.
// ============================================================================

/** Supported blockchain networks */
export type WalletChain = "solana" | "evm";

/** Specific EVM chain IDs */
export type EvmChainId = "0x1" | "0x89" | "0xa86a";

/** EVM chain metadata */
export interface EvmChainInfo {
  chainId: EvmChainId;
  name: string;
  label: string;
 nativeSymbol: string;
  explorerUrl: string;
 rpcUrl: string;
 blockExplorerTx: string;
}

/** All supported EVM chains */
export const EVM_CHAINS: Record<EvmChainId, EvmChainInfo> = {
  "0x1": {
    chainId: "0x1",
    name: "ethereum",
    label: "Ethereum",
    nativeSymbol: "ETH",
    explorerUrl: "https://etherscan.io/address/",
    rpcUrl: "https://eth.llamarpc.com",
    blockExplorerTx: "https://etherscan.io/tx/",
  },
  "0x89": {
    chainId: "0x89",
    name: "polygon",
    label: "Polygon",
    nativeSymbol: "MATIC",
    explorerUrl: "https://polygonscan.com/address/",
    rpcUrl: "https://polygon-rpc.com",
    blockExplorerTx: "https://polygonscan.com/tx/",
  },
  "0xa86a": {
    chainId: "0xa86a",
    name: "avalanche",
    label: "Avalanche",
    nativeSymbol: "AVAX",
    explorerUrl: "https://snowtrace.io/address/",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    blockExplorerTx: "https://snowtrace.io/tx/",
  },
} as const;

/** Wallet provider identifiers */
export type WalletProvider = "PHANTOM" | "METAMASK" | "WALLETCONNECT";

/** Wallet provider info for UI display */
export interface WalletProviderInfo {
  id: WalletProvider;
  name: string;
  icon: string;
  description: string;
  chain: WalletChain;
  evmChainId?: EvmChainId;
}

/** Wallet connection status in the app */
export type WalletStatus = "disconnected" | "connecting" | "connected" | "error";

/** Wallet information stored in React context */
export interface WalletInfo {
  address: string;
  chain: WalletChain;
  /** Specific EVM chain ID (only for evm chain) */
  evmChainId?: EvmChainId;
  /** Wallet provider used to connect */
  provider?: WalletProvider;
  status: WalletStatus;
  connectedAt: number;
}

/** Wallet session record (stored in Supabase) */
export interface WalletSession {
  id: string;
  user_id: string;
  wallet_address: string;
  chain: WalletChain;
  /** JWT token issued for this session */
  session_token: string;
  /** When the session was created */
  created_at: string;
  /** When the session expires (7 days from creation) */
  expires_at: string;
  /** IP address at time of connection (fingerprinting) */
  ip_address: string;
  /** User agent at time of connection */
  user_agent: string;
  /** Whether the session is still active */
  is_active: boolean;
}

/** Request to connect a wallet */
export interface ConnectWalletRequest {
  /** Public wallet address */
  address: string;
  /** Blockchain network */
  chain: WalletChain;
  /** Signed message (base58 for Solana, hex for EVM) */
  signature: string;
  /** The challenge message that was signed */
  message: string;
  /** Nonce used in the challenge */
  nonce: string;
}

/** Response after successful wallet connection */
export interface ConnectWalletResponse {
  success: boolean;
  session: WalletSession;
  /** JWT token for subsequent API calls */
  token: string;
}

/** Wallet balance information */
export interface WalletBalance {
  chain: WalletChain;
  address: string;
  /** Native token balance in smallest units */
  nativeBalance: string;
  /** Native token balance in human-readable form */
  nativeBalanceFormatted: string;
  /** Symbol of the native token */
  nativeSymbol: string;
  /** Additional token balances */
  tokens?: TokenBalance[];
}

/** Individual token balance */
export interface TokenBalance {
  mint: string;
  symbol: string;
  name?: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  /** USD value if available */
  valueUsd?: number;
  /** Token logo URL */
  logoURI?: string;
  /** Whether the token is verified (not a honeypot) */
  isVerified?: boolean;
  /** Whether the token is a known honeypot */
  isHoneypot?: boolean;
}

/** Chain configuration */
export interface ChainConfig {
  chain: WalletChain;
  label: string;
  nativeSymbol: string;
  nativeDecimals: number;
  /** Explorer URL prefix */
  explorerUrl: string;
  /** RPC URLs for the chain */
  rpcUrls: string[];
}

/** Wallet session JWT payload */
export interface WalletJwtPayload {
  /** Session ID */
  sid: string;
  /** User ID from Supabase Auth */
  uid: string;
  /** Wallet address */
  wallet: string;
  /** Chain */
  chain: WalletChain;
  /** IP fingerprint */
  ip: string;
  /** Issued at (Unix timestamp) */
  iat: number;
  /** Expires at (Unix timestamp) */
  exp: number;
}
