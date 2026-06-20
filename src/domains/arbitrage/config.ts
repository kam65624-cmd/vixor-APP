// ============================================================================
// VIXOR Arbitrage Config
// ============================================================================
//
// Adapted from axiom-arbitrage-trading-bot config.ts.
// Uses ARBITRAGE_ prefix to avoid conflicts with vixor-APP env vars.
//
// Safety defaults:
//   - ARBITRAGE_DRY_RUN=true (default — never move real funds unless explicit)
//   - ARBITRAGE_EXECUTION_ENABLED=false (default — must be explicitly enabled)
//
// Required env vars for live mode:
//   - ARBITRAGE_SOLANA_RPC_URL (Helius recommended)
//   - ARBITRAGE_WALLET_PRIVATE_KEY (Solana keypair in base58)
//   - ARBITRAGE_EXECUTION_ENABLED=true
//   - ARBITRAGE_DRY_RUN=false
// ============================================================================

import { z } from "zod";
import type { BotMode, LogLevel } from "./types";
import { SOL_MINT, USDC_MINT, LAMPORTS_PER_SOL } from "./constants";

const envSchema = z.object({
  ARBITRAGE_BOT_MODE: z.enum(["mock", "live"]).default("mock"),
  ARBITRAGE_SOLANA_RPC_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
  ARBITRAGE_AXIOM_API_KEY: z.string().optional(),
  ARBITRAGE_AXIOM_API_URL: z.string().url().default("https://api.axiom.trade"),
  ARBITRAGE_JUPITER_QUOTE_URL: z.string().url().default("https://quote-api.jup.ag/v6"),
  ARBITRAGE_SCAN_INTERVAL_MS: z.coerce.number().int().min(1000).default(5000),
  ARBITRAGE_MIN_PROFIT_BPS: z.coerce.number().int().min(0).default(15),
  ARBITRAGE_MAX_SLIPPAGE_BPS: z.coerce.number().int().min(1).max(1000).default(50),
  ARBITRAGE_MAX_TRADE_SIZE_SOL: z.coerce.number().positive().default(1),
  ARBITRAGE_MAX_DAILY_TRADES: z.coerce.number().int().min(1).default(100),
  ARBITRAGE_MAX_CONSECUTIVE_FAILURES: z.coerce.number().int().min(1).default(5),
  ARBITRAGE_EXECUTION_ENABLED: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === "string" ? v === "true" || v === "1" : v))
    .default(false),
  ARBITRAGE_DRY_RUN: z
    .union([z.string(), z.boolean()])
    .transform((v) => (typeof v === "string" ? v !== "false" && v !== "0" : v))
    .default(true),
  ARBITRAGE_WALLET_PRIVATE_KEY: z.string().optional(),
  ARBITRAGE_WATCH_TOKENS: z.string().default("SOL,USDC,BONK,WIF,JUP"),
  ARBITRAGE_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type ArbitrageConfig = {
  mode: BotMode;
  solanaRpcUrl: string;
  axiomApiKey?: string;
  axiomApiUrl: string;
  jupiterQuoteUrl: string;
  scanIntervalMs: number;
  minProfitBps: number;
  maxSlippageBps: number;
  maxTradeSizeLamports: bigint;
  maxDailyTrades: number;
  maxConsecutiveFailures: number;
  executionEnabled: boolean;
  dryRun: boolean;
  walletPrivateKey?: string;
  watchTokenSymbols: string[];
  logLevel: LogLevel;
};

export function loadArbitrageConfig(env: NodeJS.ProcessEnv = process.env): ArbitrageConfig {
  const parsed = envSchema.parse(env);

  const dryRun = parsed.ARBITRAGE_DRY_RUN || !parsed.ARBITRAGE_EXECUTION_ENABLED;

  return {
    mode: parsed.ARBITRAGE_BOT_MODE,
    solanaRpcUrl: parsed.ARBITRAGE_SOLANA_RPC_URL,
    axiomApiKey: parsed.ARBITRAGE_AXIOM_API_KEY,
    axiomApiUrl: parsed.ARBITRAGE_AXIOM_API_URL,
    jupiterQuoteUrl: parsed.ARBITRAGE_JUPITER_QUOTE_URL,
    scanIntervalMs: parsed.ARBITRAGE_SCAN_INTERVAL_MS,
    minProfitBps: parsed.ARBITRAGE_MIN_PROFIT_BPS,
    maxSlippageBps: parsed.ARBITRAGE_MAX_SLIPPAGE_BPS,
    maxTradeSizeLamports: BigInt(
      Math.floor(parsed.ARBITRAGE_MAX_TRADE_SIZE_SOL * Number(LAMPORTS_PER_SOL)),
    ),
    maxDailyTrades: parsed.ARBITRAGE_MAX_DAILY_TRADES,
    maxConsecutiveFailures: parsed.ARBITRAGE_MAX_CONSECUTIVE_FAILURES,
    executionEnabled: parsed.ARBITRAGE_EXECUTION_ENABLED,
    dryRun,
    walletPrivateKey: parsed.ARBITRAGE_WALLET_PRIVATE_KEY,
    watchTokenSymbols: parsed.ARBITRAGE_WATCH_TOKENS.split(",")
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean),
    logLevel: parsed.ARBITRAGE_LOG_LEVEL,
  };
}

// Re-export Solana constants for convenience
export { SOL_MINT, USDC_MINT } from "./constants";
