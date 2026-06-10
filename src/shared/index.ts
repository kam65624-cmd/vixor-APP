// ============================================================================
// Shared — Barrel Export
// ============================================================================

// Cache
export { cache, CACHE_KEYS, CACHE_TTL, getKlinesTtl } from "./cache";
export type { CacheProvider } from "./cache";

// Cache Invalidation
export {
  invalidatePriceCache,
  invalidateAllPriceCache,
  invalidateKlinesCache,
  invalidateNewsCache,
  invalidateMarketPricesCache,
  invalidateAllCache,
} from "./cache-invalidator";

// Utils
export { cn } from "./utils";

// Supabase
export { supabase } from "./supabase/client";
export { supabaseAdmin } from "./supabase/client.server";
export { requireSupabaseAuth } from "./supabase/auth-middleware";
export { attachSupabaseAuth } from "./supabase/auth-attacher";
export type { Database } from "./supabase/types";

// Migrations
export { checkMigrations, getMigrationSQL } from "./migrate.server";
export type { MigrationStatus } from "./migrate.server";

// Telegram helpers
export { getTelegramInitData, isInsideTelegram, openTelegramInvoice } from "./telegram";

// Error handling
export { consumeLastCapturedError } from "./error-capture";
export { renderErrorPage } from "./error-page";
