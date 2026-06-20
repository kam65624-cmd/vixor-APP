// ============================================================================
// VIXOR Wallet Domain — Server-Only Exports
// ============================================================================
//
// These functions run ONLY on the server (never in client bundles).
// Import from "@/domains/wallet/server" in server-side code only.
// DO NOT import these in React components or client-side code.
// ============================================================================

export {
  connectWallet,
  disconnectWallet,
  getWalletSessions,
  verifyWalletSignature,
  verifyWalletJwt,
  signWalletJwt,
} from "./functions";
