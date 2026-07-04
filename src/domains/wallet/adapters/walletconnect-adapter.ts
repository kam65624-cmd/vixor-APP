// ============================================================================
// VIXOR Wallet — WalletConnect v2 Adapter (STUB)
// ============================================================================
//
// WalletConnect v2 enables mobile wallet scanning (QR code) and supports
// multi-chain connections. This is a STUB implementation that exposes the
// required interface but returns "not available" until the WalletConnect
// packages are installed.
//
// To enable, install:
//   @walletconnect/web3wallet
//   @web3modal/ethers
//
// Then replace the stub implementations below with real WalletConnect v2
// protocol logic.
// ============================================================================

/** WalletConnect Cloud project ID (replace with real project ID). */
export const WALLETCONNECT_PROJECT_ID = "vixor-demo";

/** WalletConnect v2 relay endpoint. */
export const WALLETCONNECT_RELAY_URL = "wss://relay.walletconnect.com";

/**
 * Check if WalletConnect v2 packages are available.
 *
 * Currently returns `false` because the required packages have not been
 * installed. Once `@walletconnect/web3wallet` (or `@web3modal/ethers`) is
 * added to `package.json`, this should perform a dynamic import check.
 */
export function isWalletConnectAvailable(): boolean {
  // TODO: Replace with a real runtime check, e.g.:
  //   try { require.resolve("@walletconnect/web3wallet"); return true; }
  //   catch { return false; }
  return false;
}

/**
 * Initiate a WalletConnect v2 session.
 *
 * @returns An object with the connected wallet address and chain ID.
 * @throws Error describing the missing dependency.
 */
export async function connectWalletConnect(): Promise<{
  address: string;
  chain: string;
}> {
  throw new Error(
    "WalletConnect v2 integration requires @walletconnect/web3provider package. Install it to enable.",
  );
}

/**
 * Get the WalletConnect pairing URI (shown as a QR code in the UI).
 *
 * @returns The URI string, or `null` if no session is being proposed.
 */
export function getWalletConnectUri(): string | null {
  return null;
}
