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
  updateAlert,
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

export {
  createConversation,
  listConversations,
  getConversation,
  saveMessage,
  deleteConversation,
  updateConversationTitle,
} from "@/domains/copilot/conversations";

// ── Watchlist Domain ──
export {
  getWatchlists,
  getDefaultWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  reorderWatchlist,
  createWatchlist,
  deleteWatchlist,
  renameWatchlist,
} from "@/domains/watchlist/functions";

// ── Notes Domain ──
export {
  createNote,
  listNotes,
  updateNote,
  deleteNote,
  getNotesByPair,
  getNotesByAnalysis,
} from "@/domains/notes/functions";

// ── Trades Domain ──
export {
  createTrade,
  listTrades,
  updateTrade,
  deleteTrade,
  getTradeStats,
  getEquityCurve,
} from "@/domains/trades/functions";

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

// ── Daily Loop Domain ──
export {
  getTodayLoop,
  updateMorningPrep,
  updateSessionTracking,
  updateEodReview,
  getLoopHistory,
  getStreak,
} from "@/domains/daily-loop/functions";
