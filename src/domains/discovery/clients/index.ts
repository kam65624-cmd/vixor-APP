/**
 * @module domains/discovery/clients
 * @description Barrel export for all Discovery API clients.
 */

export { fetchTrendingTokens, birdeyeCache } from "./birdeye.client";
export {
  fetchSmartMoneyHolders,
  batchFetchSmartMoneyHolders,
  heliusCache,
  KNOWN_SMART_MONEY_WALLETS,
} from "./helius.client";
export { fetchTwitterMentions, twitterCache, type TwitterSearchResult } from "./twitter.client";
export {
  fetchTokenSocialData,
  batchFetchSocialData,
  lunarcrushCache,
  type LunarCrushSocialData,
} from "./lunarcrush.client";
export { fetchLatestPairs, searchTokenPairs, dexscreenerCache } from "./dexscreener.client";
