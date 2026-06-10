# Task 5-7-HIGH — Frontend Engineer Work Record

## Status: COMPLETED

## Changes Made

### 1. Dashboard (`src/routes/_authenticated/index.tsx`)
- **Market News**: Replaced 3 hardcoded news items with real Finnhub API data via `getMarketNews` server function + `useQuery`. Added loading skeletons, empty state, and clickable links to original articles with images.
- **Dynamic Greeting**: Changed "Good Evening, Trader" to time-of-day based greeting (Morning/Afternoon/Evening).
- **High Impact Events**: Removed 3 hardcoded events (FOMC, NFP, ECB) and replaced with premium empty state message.
- **Source Badges**: Updated Market Pulse source badge logic from binary fallback/live to granular: LIVE (binance/twelvedata), CACHED (cache), EST (ESTIMATED), DELAYED (exchangerate-api).
- **Cleanup**: Removed unused `EventRow`, `NewsCard` components and `Clock` import. Added `formatTimeAgo` helper.

### 2. Discover Page (`src/routes/_authenticated/discover.tsx`)
- **Watchlist Tab**: Replaced `mockWatchlist` with real `getMarketPrices` data. Shows real pair/price/24h change with up/down arrow indicator instead of fake sparkline.
- **Scanner Tab**: Replaced `mockScanner` with real `getDailySignals` data. Shows real pair, RecBadge (BUY/SELL), confidence %, timeframe. Added loading/empty states.
- **Heatmap Tab**: Replaced "Unlock Feature" placeholder with real color-coded grid using `getMarketPrices`. Shows pair, 24h change %, and price with dynamic background intensity. Kept "coming soon" note for interactive features.
- **News Tab**: No changes needed (already real data).

### No new packages added. All TypeScript errors in modified files are pre-existing.
