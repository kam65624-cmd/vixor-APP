// ============================================================================
// User Domain — Barrel Export
// ============================================================================

// Server functions (from functions.ts)
export * from "./functions";

// Auth functions
export { telegramSignIn, createAdmin } from "./auth.functions";

// Types
export type {
  UserProfile,
  PointsBalance,
  PremiumSubscription,
  UserMeResult,
  PointPack,
  PremiumPlan,
  Notification,
} from "./types";

// Server modules
export { verifyTelegramInitData } from "./server/telegram-verify";
export type { TelegramUser } from "./server/telegram-verify";
