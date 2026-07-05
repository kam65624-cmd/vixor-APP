// VIXOR Wallet Adapters — Barrel Export
export {
  isPhantomInstalled,
  connectPhantom,
  getPhantomSolBalance,
  getPhantomTokenBalances,
} from "./phantom-adapter";
export {
  isMetaMaskInstalled,
  connectMetaMask,
  switchChain,
  buildSIWEMessage,
  getEvmNativeBalance,
} from "./metamask-adapter";
export {
  isWalletConnectAvailable,
  connectWalletConnect,
  getWalletConnectUri,
  WALLETCONNECT_PROJECT_ID,
  WALLETCONNECT_RELAY_URL,
} from "./walletconnect-adapter";
export {
  isTelegramWebApp,
  connectTelegramWallet,
  getTelegramWalletAddress,
  getTonBalance,
  getTonTokenBalances,
} from "./telegram-adapter";
export type { TelegramWalletResult } from "./telegram-adapter";
