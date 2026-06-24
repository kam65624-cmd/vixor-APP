# VIXOR — Data Layer Report

**Date:** 2026-06-24
**Branch:** `feat/data-layer-setup`
**Commits:** 4

## Summary

| Task | Status | Notes |
|------|--------|-------|
| D1: API verification | ✅ | Supabase + TwelveData + Telegram verified |
| D2: Schema | ✅ | 4 new tables (pairs, news_cache, price_history, strategies) |
| D3: Seed data | ✅ | 6 pairs + 10 signals + 3 trades + 4 alerts |
| D4: Live feeds | ✅ | Binance WS + DexScreener + TwelveData |
| D5: Mock replacement | ✅ | Already real — no mocks found |

## API Keys Verified
- ✅ Supabase (connected, 1 profile)
- ✅ TwelveData (EUR/USD: 1.13652, ETH/USD: 1676.3) — 800 calls/day
- ✅ Telegram bot @VIXOR_v1_bot
- ✅ JWT_SECRET, CRON_SECRET, TELEGRAM_WEBHOOK_SECRET generated
- ⏳ FINNHUB_API_KEY (user needs to provide)
- ⏳ HELIUS_API_KEY (user needs to provide)
- ⏳ ALCHEMY_API_KEY (user needs to provide)

## Database Tables

### Existing (from prior migrations)
- profiles, daily_signals, trades, price_alerts, watchlists, watchlist_items
- user_strategies, trading_notes, user_memories, copilot_chats
- wallet_sessions, web3_transactions, nft_badges
- domain_events, experiments

### New (this migration)
- `pairs` — master asset registry (forex/crypto/metal/stock)
- `news_cache` — cached news articles
- `price_history` — OHLCV candle data
- `strategies` — user trading strategies with performance metrics

## Live Feeds
- **Binance WS** — client-side WebSocket for real-time crypto prices
- **useLivePrices** — React hook (WS for crypto, REST polling for forex/gold)
- **DexScreener** — free REST API (60/min) for Solana/memecoin discovery
- **TwelveData** — forex/gold REST (requires key, 800/day limit)
- **Finnhub** — news REST (requires key, 60/min limit)

## Mock Data Status
`src/shared/data/index.ts` — **zero mock data**. All server functions use real Supabase queries with `requireSupabaseAuth` middleware.

## Next Steps
- User provides FINNHUB_API_KEY, HELIUS_API_KEY, ALCHEMY_API_KEY
- Merge data-layer branch → main
- Ready for Stitch design brief