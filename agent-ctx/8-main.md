# Task 8: Split monolithic `shared/data/index.ts` into domain-grouped files

## Status: ✅ Complete

## Summary

Split the 1467-line monolithic `src/shared/data/index.ts` into 12 domain-grouped files plus a barrel re-export index.

## Files Created

| File | Domain | Exports |
|------|--------|---------|
| `portfolio.ts` | Portfolio & holdings | `getPortfolioData`, `getTradeHistory`, `getUserPoints`, `getReferralData` |
| `user.ts` | User settings/profile | `getNotifications`, `getUnreadNotificationCount`, `getUserSettings`, `getUserProfile`, `markNotificationRead`, `updateUserSettings`, `getPremiumData` |
| `dashboard.ts` | Dashboard & home market | `getDashboardData`, `getHomeMarketData`, `HomeTickerItem`, `HomeMarketData` |
| `signals.ts` | Signals & notes | `getJournalEntries`, `getDailySignals`, `getRecentAnalyses` |
| `watchlist.ts` | Watchlist | `getWatchlistData` |
| `market.ts` | Whale & pulse | `getWhaleData`, `getPulseData` |
| `trading.ts` | Yield, perpetuals, arbitrage | `getYieldData`, `getPerpetualsData`, `scanArbitrage`, `ArbitrageScanResponse` |
| `strategy.ts` | Predictions & alpha | `getPredictionsData`, `getAlphaData` |
| `wallet.ts` | Wallet | `getWalletData` |
| `communities.ts` | Communities | `getCommunitiesData` |
| `discovery.ts` | Bonding curves | `getBondingCurveData` |
| `forex.ts` | Forex config | `FOREX_PAIR_CONFIG` (internal, not exported) |

## Files Modified

- `src/shared/data/index.ts` — Replaced 1467-line monolith with 48-line barrel re-export file

## Verification

- ESLint: 0 new errors/warnings in `shared/data/` directory
- TypeScript: 0 type errors in `shared/data/` directory
- All original exports preserved via barrel re-exports
- External import path `@/shared/data` continues to work unchanged
- `getMoxiInsights` re-export from `@/domains/moxi/functions` preserved

## Notes

- `formatRelativeTime` helper moved to `dashboard.ts` (only used by `getDashboardData`)
- `FOREX_PAIR_CONFIG` and `ForexPriceItem` were never exported — kept as internal to `forex.ts`
- Each file carries only the imports it needs (`createServerFn`, `z`, `requireSupabaseAuth`)
