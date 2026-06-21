/**
 * @module domains/discovery/config
 * @description Environment-based configuration for the Discovery domain.
 * Uses Zod for type-safe parsing with sensible defaults.
 */

import { z } from "zod";

/** Helper: parse string to int and clamp to [min, max]. */
function clampInt(v: string | undefined, defaultVal: number, min: number, max: number): number {
  const n = parseInt(v ?? String(defaultVal), 10);
  if (Number.isNaN(n)) return defaultVal;
  return Math.min(Math.max(n, min), max);
}

/** Zod schema for Discovery environment variables. */
const discoveryEnvSchema = z.object({
  /** Birdeye API key for price/volume/liquidity data. */
  BIRDEYE_API_KEY: z.string().optional().default(""),

  /** Helius RPC URL for Solana on-chain data + smart money tracking. */
  HELIUS_RPC_URL: z.string().optional().default(""),

  /** Helius API key (alternative to full URL). */
  HELIUS_API_KEY: z.string().optional().default(""),

  /** Twitter/X Bearer Token for social mentions (API v2). */
  TWITTER_BEARER_TOKEN: z.string().optional().default(""),

  /** LunarCrush API key for sentiment analysis. */
  LUNARCRUSH_API_KEY: z.string().optional().default(""),

  /** DexScreener API base URL. */
  DEXSCREENER_API_URL: z.string().optional().default("https://api.dexscreener.com/latest"),

  /** Discovery scan interval in seconds (default 30, clamped [5, 300]). */
  DISCOVERY_SCAN_INTERVAL_S: z
    .union([z.string(), z.number()])
    .optional()
    .default("30")
    .transform((v) => (typeof v === "number" ? v : clampInt(v, 30, 5, 300))),

  /** Cache TTL for price data in seconds (default 30, clamped [5, 120]). */
  DISCOVERY_PRICE_CACHE_TTL_S: z
    .union([z.string(), z.number()])
    .optional()
    .default("30")
    .transform((v) => (typeof v === "number" ? v : clampInt(v, 30, 5, 120))),

  /** Cache TTL for social data in seconds (default 300, clamped [30, 3600]). */
  DISCOVERY_SOCIAL_CACHE_TTL_S: z
    .union([z.string(), z.number()])
    .optional()
    .default("300")
    .transform((v) => (typeof v === "number" ? v : clampInt(v, 300, 30, 3600))),

  /** Maximum number of tokens returned per scan (default 100, clamped [10, 500]). */
  DISCOVERY_MAX_TOKENS: z
    .union([z.string(), z.number()])
    .optional()
    .default("100")
    .transform((v) => (typeof v === "number" ? v : clampInt(v, 100, 10, 500))),

  /** Enable or disable the discovery module entirely. */
  DISCOVERY_ENABLED: z
    .union([z.string(), z.boolean()])
    .optional()
    .default("true")
    .transform((v) => (typeof v === "string" ? v !== "false" && v !== "0" : v)),

  /** Minimum liquidity filter in USD (default 10000). */
  DISCOVERY_MIN_LIQUIDITY: z
    .union([z.string(), z.number()])
    .optional()
    .default("10000")
    .transform((v) =>
      typeof v === "number" ? Math.max(v, 0) : clampInt(v, 10000, 0, Number.MAX_SAFE_INTEGER),
    ),
});

/** Parsed Discovery configuration. */
export type DiscoveryConfig = z.infer<typeof discoveryEnvSchema>;

/**
 * Parses and validates Discovery configuration from environment variables.
 * Falls back to sensible defaults when optional keys are missing.
 *
 * @returns Validated configuration object.
 */
export function loadDiscoveryConfig(): DiscoveryConfig {
  return discoveryEnvSchema.parse({
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,
    LUNARCRUSH_API_KEY: process.env.LUNARCRUSH_API_KEY,
    DEXSCREENER_API_URL: process.env.DEXSCREENER_API_URL,
    DISCOVERY_SCAN_INTERVAL_S: process.env.DISCOVERY_SCAN_INTERVAL_S,
    DISCOVERY_PRICE_CACHE_TTL_S: process.env.DISCOVERY_PRICE_CACHE_TTL_S,
    DISCOVERY_SOCIAL_CACHE_TTL_S: process.env.DISCOVERY_SOCIAL_CACHE_TTL_S,
    DISCOVERY_MAX_TOKENS: process.env.DISCOVERY_MAX_TOKENS,
    DISCOVERY_ENABLED: process.env.DISCOVERY_ENABLED,
    DISCOVERY_MIN_LIQUIDITY: process.env.DISCOVERY_MIN_LIQUIDITY,
  });
}

/** Cached config singleton (module-level, not global). */
let _cachedConfig: DiscoveryConfig | null = null;

/**
 * Returns the discovery config, using a module-level cache.
 * Call `invalidateDiscoveryConfig()` to force re-read env vars.
 */
export function getDiscoveryConfig(): DiscoveryConfig {
  if (!_cachedConfig) {
    _cachedConfig = loadDiscoveryConfig();
  }
  return _cachedConfig;
}

/** Clears the module-level config cache (useful for testing). */
export function invalidateDiscoveryConfig(): void {
  _cachedConfig = null;
}
