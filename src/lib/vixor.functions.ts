// ============================================================================
// vixor.functions.ts — Backward-Compatible Barrel
// ============================================================================
//
// All functions are now in domain-specific files under @/domains/.
// This file re-exports everything for backward compatibility.
// Existing imports like `import { getMe } from "@/lib/vixor.functions"` will continue to work.
// ============================================================================

// ── Market Domain ──
export {
  getMarketNews,
  getMarketPrices,
  getOHLCV,
  getEconomicCalendar,
  getExchangeRate,
  convertCurrency,
  getETFsDirectory,
  getETFSummary,
  getETFPerformance,
  getETFFullData,
  getCashFlow,
  getEarningsEstimate,
  getEPSTrend,
  getGrowthEstimates,
  getStockFundamentals,
} from "@/domains/market/functions";

// ── Analysis Domain ──
export {
  createAnalysis,
  getAnalysis,
  listAnalyses,
  quickAnalyze,
  applySignalBadgeMigration,
} from "@/domains/analysis/functions";

// ── Trading Domain ──
export {
  createAlert,
  listAlerts,
  deleteAlert,
  runAlertCheck,
  generateDailySignals,
  getDailySignals,
  getUserStrategy,
  updateUserStrategy,
} from "@/domains/trading/functions";

// ── Copilot Domain ──
export {
  askCopilot,
  getConsensus,
} from "@/domains/copilot/functions";

// ── Watchlist Domain ──
export {
  getWatchlists,
  getDefaultWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  reorderWatchlist,
} from "@/domains/watchlist/functions";

// ── User Domain ──
export {
  getMe,
  getPointPacks,
  getPremiumPlans,
  purchasePack,
  subscribePremium,
  listNotifications,
  markAllNotificationsRead,
  claimReferral,
  getReferralStats,
  linkTelegramAccount,
  createStarsInvoice,
} from "@/domains/user/functions";
