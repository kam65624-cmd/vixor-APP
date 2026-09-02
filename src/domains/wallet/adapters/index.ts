export {
  isPhantomInstalled,
  connectPhantom,
  getPhantomSolBalance,
  getPhantomTokenBalances,
  signAndSendSolanaTransaction,
} from "./phantom-adapter";
export {
  isMetaMaskInstalled,
  connectMetaMask,
  switchChain,
  buildSIWEMessage,
  getEvmNativeBalance,
  getCurrentEvmChainId,
  sendEvmTransaction,
} from "./metamask-adapter";
export {
  isWalletConnectAvailable,
  connectWalletConnect,
  disconnectWalletConnect,
  getWalletConnectUri,
  walletConnectAdapter,
} from "./walletconnect-adapter";
export type { WalletConnectAdapter, WalletConnectSession } from "./walletconnect-adapter";
export {
  isTelegramWebApp,
  connectTelegramWallet,
  getTelegramWalletAddress,
  getTonBalance,
  getTonTokenBalances,
} from "./telegram-adapter";
export type { TelegramWalletResult } from "./telegram-adapter";
