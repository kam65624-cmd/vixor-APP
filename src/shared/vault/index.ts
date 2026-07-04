/**
 * @module shared/vault
 * @description Centralized Secure API Key Vault — SINGLE SOURCE OF TRUTH.
 *
 * This is the ONLY place in the codebase that reads API keys from `process.env`.
 * All other modules MUST import getters from this vault instead of reading
 * `process.env.XXX` directly.
 *
 * SECURITY:
 *   - This module is server-side only (reads process.env which is unavailable
 *     in client-side bundles).
 *   - `getPublicStatus()` never exposes actual key values.
 *   - All keys are validated via Zod at parse time.
 */

import { z } from "zod";

// ── Zod Schema ───────────────────────────────────────────────────────────────

const VAULT_SCHEMA = z.object({
  // ── LLM Providers ──
  OPENAI_API_KEY: z.string().optional().default(""),
  OPENAI_BASE_URL: z.string().optional().default("https://api.openai.com/v1"),
  ANTHROPIC_API_KEY: z.string().optional().default(""),
  GROQ_API_KEY: z.string().optional().default(""),
  LLM_PROVIDER: z
    .enum(["zai", "openai", "anthropic", "groq"])
    .optional()
    .default("zai"),

  // ── Market Data ──
  MOBULA_API_KEY: z.string().optional().default(""),
  GOPLUS_APP_KEY: z.string().optional().default(""),
  GOPLUS_APP_SECRET: z.string().optional().default(""),
  BIRDEYE_API_KEY: z.string().optional().default(""),
  TWELVEDATA_API_KEY: z.string().optional().default(""),
  FINNHUB_API_KEY: z.string().optional().default(""),
  LUNARCRUSH_API_KEY: z.string().optional().default(""),

  // ── Solana & On-Chain ──
  HELIUS_RPC_URL: z.string().optional().default(""),
  HELIUS_API_KEY: z.string().optional().default(""),
  WALLET_SOLANA_RPC_URL: z.string().optional().default(""),

  // ── DEX & Trading ──
  DEXSCREENER_API_URL: z
    .string()
    .optional()
    .default("https://api.dexscreener.com/latest"),
  JUPITER_QUOTE_URL: z
    .string()
    .optional()
    .default("https://quote-api.jup.ag/v6"),
  ARBITRAGE_SOLANA_RPC_URL: z.string().optional().default(""),

  // ── Social ──
  TWITTER_BEARER_TOKEN: z.string().optional().default(""),

  // ── Notifications ──
  TELEGRAM_BOT_TOKEN: z.string().optional().default(""),
  RESEND_API_KEY: z.string().optional().default(""),
  WEBHOOK_SIGNING_SECRET: z.string().optional().default(""),

  // ── Supabase ──
  SUPABASE_URL: z.string().optional().default(""),
  SUPABASE_ANON_KEY: z.string().optional().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default(""),

  // ── Security ──
  CREDENTIAL_ENCRYPTION_KEY: z.string().optional().default(""),
  CRON_SECRET: z.string().optional().default(""),
  HEALTH_TOKEN: z.string().optional().default(""),
});

/** Type of the parsed vault (all values resolved, defaults applied). */
export type VaultConfig = z.infer<typeof VAULT_SCHEMA>;

// ── Provider Registry ────────────────────────────────────────────────────────

/**
 * Definition of a provider for status reporting.
 * `keys` lists the vault fields that must be non-empty for the provider to be
 * considered "configured". If `keys` is empty, the provider is always
 * configured (e.g. ZAI which is bundled).
 */
interface ProviderDef {
  label: string;
  category: string;
  keys: (keyof VaultConfig)[];
  /** If true, this provider is always configured regardless of key presence. */
  alwaysConfigured?: boolean;
}

const PROVIDER_REGISTRY: Record<string, ProviderDef> = {
  // ── LLM Providers ──
  openai: {
    label: "OpenAI",
    category: "LLM",
    keys: ["OPENAI_API_KEY"],
  },
  anthropic: {
    label: "Anthropic",
    category: "LLM",
    keys: ["ANTHROPIC_API_KEY"],
  },
  groq: {
    label: "Groq",
    category: "LLM",
    keys: ["GROQ_API_KEY"],
  },
  zai: {
    label: "ZAI (Bundled)",
    category: "LLM",
    keys: [],
    alwaysConfigured: true,
  },

  // ── Market Data ──
  mobula: {
    label: "Mobula",
    category: "Market Data",
    keys: ["MOBULA_API_KEY"],
  },
  goplus: {
    label: "GoPlus Security",
    category: "Market Data",
    keys: ["GOPLUS_APP_KEY", "GOPLUS_APP_SECRET"],
  },
  birdeye: {
    label: "Birdeye",
    category: "Market Data",
    keys: ["BIRDEYE_API_KEY"],
  },
  twelvedata: {
    label: "TwelveData",
    category: "Market Data",
    keys: ["TWELVEDATA_API_KEY"],
  },
  finnhub: {
    label: "Finnhub",
    category: "Market Data",
    keys: ["FINNHUB_API_KEY"],
  },
  lunarcrush: {
    label: "LunarCrush",
    category: "Market Data",
    keys: ["LUNARCRUSH_API_KEY"],
  },

  // ── Solana & On-Chain ──
  helius: {
    label: "Helius",
    category: "Solana & On-Chain",
    keys: ["HELIUS_RPC_URL", "HELIUS_API_KEY"],
  },
  walletSolana: {
    label: "Wallet Solana RPC",
    category: "Solana & On-Chain",
    keys: ["WALLET_SOLANA_RPC_URL"],
  },

  // ── DEX & Trading ──
  dexscreener: {
    label: "DexScreener",
    category: "DEX & Trading",
    keys: [],
    alwaysConfigured: true, // public API, no key needed
  },
  jupiter: {
    label: "Jupiter",
    category: "DEX & Trading",
    keys: [],
    alwaysConfigured: true, // public API, no key needed
  },
  arbitrageRpc: {
    label: "Arbitrage Solana RPC",
    category: "DEX & Trading",
    keys: ["ARBITRAGE_SOLANA_RPC_URL"],
  },

  // ── Social ──
  twitter: {
    label: "Twitter/X",
    category: "Social",
    keys: ["TWITTER_BEARER_TOKEN"],
  },

  // ── Notifications ──
  telegram: {
    label: "Telegram",
    category: "Notifications",
    keys: ["TELEGRAM_BOT_TOKEN"],
  },
  resend: {
    label: "Resend (Email)",
    category: "Notifications",
    keys: ["RESEND_API_KEY"],
  },
  webhook: {
    label: "Webhook Signing",
    category: "Notifications",
    keys: ["WEBHOOK_SIGNING_SECRET"],
  },

  // ── Supabase ──
  supabase: {
    label: "Supabase",
    category: "Infrastructure",
    keys: ["SUPABASE_URL", "SUPABASE_ANON_KEY"],
  },
};

// ── Singleton ────────────────────────────────────────────────────────────────

let _vault: VaultConfig | null = null;

/**
 * Parses and validates all API keys from `process.env` via Zod.
 * Caches the result for the lifetime of the process.
 */
function loadVault(): VaultConfig {
  return VAULT_SCHEMA.parse({
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    LLM_PROVIDER: process.env.LLM_PROVIDER,

    MOBULA_API_KEY: process.env.MOBULA_API_KEY,
    GOPLUS_APP_KEY: process.env.GOPLUS_APP_KEY,
    GOPLUS_APP_SECRET: process.env.GOPLUS_APP_SECRET,
    BIRDEYE_API_KEY: process.env.BIRDEYE_API_KEY,
    TWELVEDATA_API_KEY: process.env.TWELVEDATA_API_KEY,
    FINNHUB_API_KEY: process.env.FINNHUB_API_KEY,
    LUNARCRUSH_API_KEY: process.env.LUNARCRUSH_API_KEY,

    HELIUS_RPC_URL: process.env.HELIUS_RPC_URL,
    HELIUS_API_KEY: process.env.HELIUS_API_KEY,
    WALLET_SOLANA_RPC_URL: process.env.WALLET_SOLANA_RPC_URL,

    DEXSCREENER_API_URL: process.env.DEXSCREENER_API_URL,
    JUPITER_QUOTE_URL: process.env.JUPITER_QUOTE_URL,
    ARBITRAGE_SOLANA_RPC_URL: process.env.ARBITRAGE_SOLANA_RPC_URL,

    TWITTER_BEARER_TOKEN: process.env.TWITTER_BEARER_TOKEN,

    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    WEBHOOK_SIGNING_SECRET: process.env.WEBHOOK_SIGNING_SECRET,

    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

    CREDENTIAL_ENCRYPTION_KEY: process.env.CREDENTIAL_ENCRYPTION_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
    HEALTH_TOKEN: process.env.HEALTH_TOKEN,
  });
}

/**
 * Returns the parsed vault config (cached singleton).
 * Call `invalidateVault()` to force re-read (useful for testing).
 */
export function getVault(): VaultConfig {
  if (!_vault) {
    _vault = loadVault();
  }
  return _vault;
}

/** Clears the cached vault (for testing only). */
export function invalidateVault(): void {
  _vault = null;
}

// ── isConfigured ─────────────────────────────────────────────────────────────

/**
 * Checks whether a named provider is configured.
 * Provider names are the keys of PROVIDER_REGISTRY.
 *
 * @example
 *   isConfigured("openai")   // true if OPENAI_API_KEY is non-empty
 *   isConfigured("zai")      // always true (bundled)
 */
export function isConfigured(providerName: string): boolean {
  const def = PROVIDER_REGISTRY[providerName];
  if (!def) return false;
  if (def.alwaysConfigured) return true;

  const vault = getVault();
  return def.keys.every((key) => (vault[key] as string).length > 0);
}

// ── Public Status (for admin dashboard) ─────────────────────────────────────

export interface ProviderStatusEntry {
  configured: boolean;
  label: string;
  category: string;
}

export interface VaultPublicStatus {
  providers: Record<string, ProviderStatusEntry>;
  activeLlmProvider: string;
  timestamp: string;
}

/**
 * Returns configuration status of ALL providers WITHOUT exposing actual keys.
 * Safe to return to authenticated admin users.
 */
export function getPublicStatus(): VaultPublicStatus {
  const vault = getVault();
  const providers: VaultPublicStatus["providers"] = {};

  for (const [name, def] of Object.entries(PROVIDER_REGISTRY)) {
    const configured = def.alwaysConfigured
      ? true
      : def.keys.every((key) => (vault[key] as string).length > 0);

    providers[name] = {
      configured,
      label: def.label,
      category: def.category,
    };
  }

  return {
    providers,
    activeLlmProvider: vault.LLM_PROVIDER,
    timestamp: new Date().toISOString(),
  };
}

// ── Typed Getter Functions ───────────────────────────────────────────────────
// Each getter returns the validated value from the vault.

// ── LLM ──
export function getOpenAiApiKey(): string {
  return getVault().OPENAI_API_KEY;
}
export function getOpenAiBaseUrl(): string {
  return getVault().OPENAI_BASE_URL;
}
export function getAnthropicApiKey(): string {
  return getVault().ANTHROPIC_API_KEY;
}
export function getGroqApiKey(): string {
  return getVault().GROQ_API_KEY;
}
export function getLlmProvider(): "zai" | "openai" | "anthropic" | "groq" {
  return getVault().LLM_PROVIDER;
}

// ── Market Data ──
export function getMobulaApiKey(): string {
  return getVault().MOBULA_API_KEY;
}
export function getGoPlusAppKey(): string {
  return getVault().GOPLUS_APP_KEY;
}
export function getGoPlusAppSecret(): string {
  return getVault().GOPLUS_APP_SECRET;
}
export function getBirdeyeApiKey(): string {
  return getVault().BIRDEYE_API_KEY;
}
export function getTwelveDataApiKey(): string {
  return getVault().TWELVEDATA_API_KEY;
}
export function getFinnhubApiKey(): string {
  return getVault().FINNHUB_API_KEY;
}
export function getLunarCrushApiKey(): string {
  return getVault().LUNARCRUSH_API_KEY;
}

// ── Solana & On-Chain ──
export function getHeliusRpcUrl(): string {
  return getVault().HELIUS_RPC_URL;
}
export function getHeliusApiKey(): string {
  return getVault().HELIUS_API_KEY;
}
export function getWalletSolanaRpcUrl(): string {
  return getVault().WALLET_SOLANA_RPC_URL;
}

// ── DEX & Trading ──
export function getDexScreenerApiUrl(): string {
  return getVault().DEXSCREENER_API_URL;
}
export function getJupiterQuoteUrl(): string {
  return getVault().JUPITER_QUOTE_URL;
}
export function getArbitrageSolanaRpcUrl(): string {
  return getVault().ARBITRAGE_SOLANA_RPC_URL;
}

// ── Social ──
export function getTwitterBearerToken(): string {
  return getVault().TWITTER_BEARER_TOKEN;
}

// ── Notifications ──
export function getTelegramBotToken(): string {
  return getVault().TELEGRAM_BOT_TOKEN;
}
export function getResendApiKey(): string {
  return getVault().RESEND_API_KEY;
}
export function getWebhookSigningSecret(): string {
  return getVault().WEBHOOK_SIGNING_SECRET;
}

// ── Supabase ──
export function getSupabaseUrl(): string {
  return getVault().SUPABASE_URL;
}
export function getSupabaseAnonKey(): string {
  return getVault().SUPABASE_ANON_KEY;
}
export function getSupabaseServiceRoleKey(): string {
  return getVault().SUPABASE_SERVICE_ROLE_KEY;
}

// ── Security ──
export function getCredentialEncryptionKey(): string {
  return getVault().CREDENTIAL_ENCRYPTION_KEY;
}
export function getCronSecret(): string {
  return getVault().CRON_SECRET;
}
export function getHealthToken(): string {
  return getVault().HEALTH_TOKEN;
}