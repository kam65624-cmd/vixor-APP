// ── Centralized API Key Vault ──────────────────────────────────────────────
// Server-side ONLY. Never import this in client code.
// All API keys are read from environment variables.

/**
 * Every API key the platform needs.
 * The string literal is the ENV VAR name — add new keys here
 * and the admin dashboard will pick them up automatically.
 */
export const API_KEY_REGISTRY = [
  // ── Market Data ──
  {
    id: "BINANCE_API_KEY" as const,
    envVar: "VIXOR_BINANCE_API_KEY",
    label: "Binance API Key",
    description: "Access to Binance REST & WebSocket for price feeds, order book, and trade data",
    category: "Market Data",
  },
  {
    id: "COINGECKO_API_KEY" as const,
    envVar: "VIXOR_COINGECKO_API_KEY",
    label: "CoinGecko Pro",
    description: "CoinGecko Pro API for token metadata, market data, and historical prices",
    category: "Market Data",
  },
  {
    id: "BIRDEYE_API_KEY" as const,
    envVar: "VIXOR_BIRDEYE_API_KEY",
    label: "Birdeye API",
    description: "Birdeye for Solana DEX data, token analytics, and whale tracking",
    category: "Market Data",
  },
  {
    id: "DEXSCREENER_API_KEY" as const,
    envVar: "VIXOR_DEXSCREENER_API_KEY",
    label: "DexScreener API",
    description: "DexScreener for real-time DEX trading pairs, new token alerts",
    category: "Market Data",
  },

  // ── Solana / Web3 ──
  {
    id: "HELIUS_API_KEY" as const,
    envVar: "VIXOR_HELIUS_API_KEY",
    label: "Helius RPC",
    description: "Helius enhanced Solana RPC with webhook support for whale alerts",
    category: "Solana / Web3",
  },
  {
    id: "JUPITER_API_KEY" as const,
    envVar: "VIXOR_JUPITER_API_KEY",
    label: "Jupiter API",
    description: "Jupiter DEX aggregator for swap quotes, token lists, and price API",
    category: "Solana / Web3",
  },
  {
    id: "RAYDIUM_API_KEY" as const,
    envVar: "VIXOR_RAYDIUM_API_KEY",
    label: "Raydium API",
    description: "Raydium for LP pool data, farming APYs, and liquidity information",
    category: "Solana / Web3",
  },

  // ── AI / LLM ──
  {
    id: "OPENAI_API_KEY" as const,
    envVar: "VIXOR_OPENAI_API_KEY",
    label: "OpenAI",
    description: "OpenAI GPT models for AI analysis, AI assistant, and signal generation",
    category: "AI / LLM",
  },
  {
    id: "GROQ_API_KEY" as const,
    envVar: "VIXOR_GROQ_API_KEY",
    label: "Groq",
    description: "Groq for ultra-fast LLM inference (Llama, Mixtral) for real-time analysis",
    category: "AI / LLM",
  },
  {
    id: "ANTHROPIC_API_KEY" as const,
    envVar: "VIXOR_ANTHROPIC_API_KEY",
    label: "Anthropic Claude",
    description: "Anthropic Claude for deep analysis, reasoning, and code generation",
    category: "AI / LLM",
  },

  // ── Social & Notifications ──
  {
    id: "TELEGRAM_BOT_TOKEN" as const,
    envVar: "VIXOR_TELEGRAM_BOT_TOKEN",
    label: "Telegram Bot",
    description: "Telegram bot token for sending alerts, signals, and trade notifications",
    category: "Social & Notifications",
  },
  {
    id: "TWITTER_API_KEY" as const,
    envVar: "VIXOR_TWITTER_API_KEY",
    label: "Twitter / X API",
    description: "Twitter API for social sentiment analysis and mention tracking",
    category: "Social & Notifications",
  },
  {
    id: "DISCORD_WEBHOOK_URL" as const,
    envVar: "VIXOR_DISCORD_WEBHOOK_URL",
    label: "Discord Webhook",
    description: "Discord webhook URL for community alerts and notifications",
    category: "Social & Notifications",
  },
] as const;

/** All possible API key IDs */
export type ApiKeyId = (typeof API_KEY_REGISTRY)[number]["id"];

/**
 * Retrieve an API key from environment variables.
 * Returns `undefined` if the key is not set.
 *
 * Usage:
 *   import { getApiKey } from "@/shared/api-keys";
 *   const key = getApiKey("BINANCE_API_KEY");
 */
export function getApiKey(id: ApiKeyId): string | undefined {
  const entry = API_KEY_REGISTRY.find((k) => k.id === id);
  if (!entry) {
    console.error(`[API Vault] Unknown key id: ${id}`);
    return undefined;
  }
  return process.env[entry.envVar];
}

/**
 * Check if an API key is configured (present in env).
 */
export function isKeyConfigured(id: ApiKeyId): boolean {
  return !!getApiKey(id);
}

/**
 * Get masked version of a key for display (first 4 ... last 4 chars).
 * Only safe to use in admin UI — never log or send full keys.
 */
export function maskKey(key: string): string {
  if (key.length <= 8) return "****";
  return `${key.slice(0, 4)}${"·".repeat(8)}${key.slice(-4)}`;
}

/**
 * Get the status of all keys for the admin dashboard.
 * Returns each key's registry info plus its current status.
 */
export function getAllKeyStatuses(): Array<{
  id: ApiKeyId;
  label: string;
  envVar: string;
  description: string;
  category: string;
  configured: boolean;
  maskedValue?: string;
}> {
  return API_KEY_REGISTRY.map((entry) => {
    const value = getApiKey(entry.id);
    return {
      id: entry.id,
      label: entry.label,
      envVar: entry.envVar,
      description: entry.description,
      category: entry.category,
      configured: !!value,
      maskedValue: value ? maskKey(value) : undefined,
    };
  });
}
