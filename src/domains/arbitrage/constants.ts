// ============================================================================
// VIXOR Arbitrage Constants
// ============================================================================
//
// Solana mint addresses and shared constants used across the arbitrage domain.
// This file exists to break the circular dependency between config.ts and
// token-registry.ts — both need SOL_MINT/USDC_MINT, so they import from here.
// ============================================================================

/** Native Solana wrapped token mint address */
export const SOL_MINT = "So11111111111111111111111111111111111111112";

/** USDC mint address on Solana mainnet */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

/** Number of lamports per SOL (10^9) */
export const LAMPORTS_PER_SOL = 1_000_000_000n;
