# VIXOR API Inventory

> Auto-generated: 2026-08-03

## HTTP API Routes

| Endpoint | Methods | Rate Limit | File |
|----------|---------|------------|------|
| /api/check-alerts | GET | 30/60s | server/api/check-alerts.ts |
| /api/discover | GET | 120/60s | server/api/discover.ts |
| /api/generate-signals | GET | 10/60s | server/api/generate-signals.ts |
| /api/health | GET | 30/60s | server/api/health.ts |
| /api/market-overview | GET | 120/60s | server/api/market-overview.ts |
| /api/metrics | GET | 30/60s | server/api/metrics.ts |
| /api/migrate | GET | 10/60s | server/api/migrate.ts |
| /api/p1-validate | GET | 10/60s | server/api/p1-validate.ts |
| /api/reanalysis-cron | GET | 30/60s | server/api/reanalysis-cron.ts |
| /api/sol-price | GET | 120/60s | server/api/sol-price.ts |
| /api/stars-webhook | WEBHOOK | — | server/api/stars-webhook.ts |
| /api/telegram-webhook | WEBHOOK | — | server/api/telegram-webhook.ts |

**Total**: 12 endpoints

## Server Functions (createServerFn)

### domains/analysis

| Function | File |
|----------|------|
| createAnalysis | domains/analysis/functions.ts |
| getAnalysis | domains/analysis/functions.ts |
| reanalyzeTrackedSignal | domains/analysis/reanalysis.ts |

### domains/backtest

| Function | File |
|----------|------|
| getBacktestHistory | domains/backtest/functions.ts |
| runBacktestServer | domains/backtest/functions.ts |

### domains/broker

| Function | File |
|----------|------|
| connectBroker | domains/broker/functions.ts |
| disconnectBroker | domains/broker/functions.ts |
| getConnectedBrokers | domains/broker/functions.ts |

### domains/daily-loop

| Function | File |
|----------|------|
| getLoopHistory | domains/daily-loop/functions.ts |
| getStreak | domains/daily-loop/functions.ts |
| getTodayLoop | domains/daily-loop/functions.ts |
| updateEodReview | domains/daily-loop/functions.ts |
| updateMorningPrep | domains/daily-loop/functions.ts |
| updateSessionTracking | domains/daily-loop/functions.ts |

### domains/discover

| Function | File |
|----------|------|
| getDiscoverCryptoData | domains/discover/discover-crypto-data.ts |

### domains/experiment

| Function | File |
|----------|------|
| cancelExperiment | domains/experiment/functions.ts |
| createExperiment | domains/experiment/functions.ts |
| getExperiment | domains/experiment/functions.ts |
| listExperiments | domains/experiment/functions.ts |

### domains/market

| Function | File |
|----------|------|
| convertCurrency | domains/market/functions.ts |
| getCashFlow | domains/market/functions.ts |
| getChartOHLCV | domains/market/functions.ts |
| getDexOHLCV | domains/market/functions.ts |
| getEarningsEstimate | domains/market/functions.ts |
| getEconomicCalendar | domains/market/functions.ts |
| getEPSTrend | domains/market/functions.ts |
| getETFFullData | domains/market/functions.ts |
| getETFPerformance | domains/market/functions.ts |
| getETFsDirectory | domains/market/functions.ts |
| getETFSummary | domains/market/functions.ts |
| getExchangeRate | domains/market/functions.ts |
| getGrowthEstimates | domains/market/functions.ts |
| getMarketNews | domains/market/functions.ts |
| getMarketPrices | domains/market/functions.ts |
| getOHLCV | domains/market/functions.ts |
| getStockFundamentals | domains/market/functions.ts |

### domains/moxi

| Function | File |
|----------|------|
| askMoxi | domains/moxi/functions.ts |
| getMoxiInsights | domains/moxi/functions.ts |
| getMoxiPersonaFn | domains/moxi/functions.ts |
| updateMoxiPersona | domains/moxi/functions.ts |

### domains/notes

| Function | File |
|----------|------|
| createNote | domains/notes/functions.ts |
| deleteNote | domains/notes/functions.ts |
| getNotesByAnalysis | domains/notes/functions.ts |
| updateNote | domains/notes/functions.ts |

### domains/signal-tracking

| Function | File |
|----------|------|
| cancelSignalTracking | domains/signal-tracking/functions.ts |
| createSignalTracking | domains/signal-tracking/functions.ts |
| getUserSignalTrackings | domains/signal-tracking/functions.ts |
| updateSignalTracking | domains/signal-tracking/functions.ts |

### domains/trades

| Function | File |
|----------|------|
| createTrade | domains/trades/functions.ts |
| listTrades | domains/trades/functions.ts |

### domains/trading

| Function | File |
|----------|------|
| createAlert | domains/trading/functions.ts |
| deleteAlert | domains/trading/functions.ts |
| deleteExchangeCredentials | domains/trading/gateway/functions.ts |
| executeTrade | domains/trading/gateway/functions.ts |
| generateDailySignals | domains/trading/functions.ts |
| getDailySignals | domains/trading/functions.ts |
| getExchangeCredentials | domains/trading/gateway/functions.ts |
| getExchangeStatus | domains/trading/gateway/functions.ts |
| getUserStrategy | domains/trading/functions.ts |
| listAlerts | domains/trading/functions.ts |
| runAlertCheck | domains/trading/functions.ts |
| saveExchangeCredentials | domains/trading/gateway/functions.ts |
| testExchangeConnection | domains/trading/gateway/functions.ts |
| updateAlert | domains/trading/functions.ts |
| updateUserStrategy | domains/trading/functions.ts |

### domains/user

| Function | File |
|----------|------|
| claimDailyCheckin | domains/user/functions.ts |
| claimReferral | domains/user/functions.ts |
| createStarsInvoice | domains/user/functions.ts |
| getMe | domains/user/functions.ts |
| getPointPacks | domains/user/functions.ts |
| getPremiumPlans | domains/user/functions.ts |
| getReferralStats | domains/user/functions.ts |
| linkTelegramAccount | domains/user/functions.ts |
| listNotifications | domains/user/functions.ts |
| markAllNotificationsRead | domains/user/functions.ts |
| purchasePack | domains/user/functions.ts |
| redeemReward | domains/user/functions.ts |
| subscribePremium | domains/user/functions.ts |
| syncTelegramProfile | domains/user/functions.ts |
| telegramSignIn | domains/user/auth.functions.ts |

### domains/watchlist

| Function | File |
|----------|------|
| addToWatchlist | domains/watchlist/functions.ts |
| createWatchlist | domains/watchlist/functions.ts |
| deleteWatchlist | domains/watchlist/functions.ts |
| getDefaultWatchlist | domains/watchlist/functions.ts |
| getWatchlists | domains/watchlist/functions.ts |
| removeFromWatchlist | domains/watchlist/functions.ts |
| renameWatchlist | domains/watchlist/functions.ts |
| reorderWatchlist | domains/watchlist/functions.ts |
| updateWatchlistItem | domains/watchlist/functions.ts |

### routes/_authenticated

| Function | File |
|----------|------|
| createJournalEntry | routes/_authenticated/journal.tsx |
| getLiveForexDiscoverData | routes/_authenticated/-discover-forex-data.ts |
| getRadarBlips | routes/_authenticated/radar.tsx |
| subscribeToPlan | routes/_authenticated/premium.tsx |

### shared/data

| Function | File |
|----------|------|
| getAlphaData | shared/data/index.ts |
| getBondingCurveData | shared/data/index.ts |
| getCommunitiesData | shared/data/index.ts |
| getDailySignals | shared/data/index.ts |
| getDashboardData | shared/data/index.ts |
| getHomeMarketData | shared/data/index.ts |
| getJournalEntries | shared/data/index.ts |
| getNotifications | shared/data/index.ts |
| getPerpetualsData | shared/data/index.ts |
| getPortfolioData | shared/data/index.ts |
| getPredictionsData | shared/data/index.ts |
| getPremiumData | shared/data/index.ts |
| getPulseData | shared/data/index.ts |
| getRecentAnalyses | shared/data/index.ts |
| getReferralData | shared/data/index.ts |
| getTradeHistory | shared/data/index.ts |
| getUnreadNotificationCount | shared/data/index.ts |
| getUserPoints | shared/data/index.ts |
| getUserProfile | shared/data/index.ts |
| getUserSettings | shared/data/index.ts |
| getWalletData | shared/data/index.ts |
| getWatchlistData | shared/data/index.ts |
| getWhaleData | shared/data/index.ts |
| getYieldData | shared/data/index.ts |
| markNotificationRead | shared/data/index.ts |
| scanArbitrage | shared/data/index.ts |
| updateUserSettings | shared/data/index.ts |

**Total**: 120 server functions across 16 modules

## Summary

- HTTP API Routes: 12
- Server Functions: 120
- Domain Modules: 16
