// Barrel re-exports — split from monolithic data module into domain-grouped files

// Portfolio domain
export { getPortfolioData, getTradeHistory, getUserPoints, getReferralData } from "./portfolio";

// User domain
export {
  getNotifications,
  getUnreadNotificationCount,
  getUserSettings,
  getUserProfile,
  markNotificationRead,
  updateUserSettings,
  getPremiumData,
} from "./user";

// Dashboard domain
export {
  getDashboardData,
  getHomeMarketData,
  type HomeTickerItem,
  type HomeMarketData,
} from "./dashboard";

// Signals / notes domain
export { getJournalEntries, getDailySignals, getRecentAnalyses } from "./signals";

// Watchlist domain
export { getWatchlistData } from "./watchlist";

// Market domain
export { getWhaleData, getPulseData } from "./market";

// Trading / yield / perpetuals / arbitrage domain
export {
  getYieldData,
  getPerpetualsData,
  scanArbitrage,
  type ArbitrageScanResponse,
} from "./trading";

// Strategy domain
export { getPredictionsData, getAlphaData } from "./strategy";

// Wallet domain
export { getWalletData } from "./wallet";

// Communities domain
export { getCommunitiesData } from "./communities";

// Discovery / bonding curves domain
export { getBondingCurveData } from "./discovery";

// MOXI AI Companion
export { getMoxiInsights } from "@/domains/moxi/functions";
