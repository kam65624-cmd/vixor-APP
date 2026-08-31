# VIXOR — Sprint-to-Code Map

> Links each feature/sprint to its source files, domains, and components.
> Updated: 2026-08-03

---

## Active Sprints (Completed)

### F-004 — DEX Chart Core
**Priority**: P0 | **Status**: Done

| Layer | Files |
|-------|-------|
| Route | `src/routes/_authenticated/charts.tsx` |
| Component | `src/components/vixor/DexChart.tsx` |
| Component | `src/components/vixor/TradingViewChart.tsx` |
| Component | `src/components/vixor/TradingViewMiniChart.tsx` |
| Component | `src/components/vixor/TradingViewTechAnalysis.tsx` |
| Component | `src/components/vixor/TradingViewTickerTape.tsx` |
| Component | `src/components/vixor/CandlestickChart.tsx` |
| Domain | `src/domains/chart-intelligence/` (5 files) |
| Domain | `src/domains/chart-truth/` (5 files) |
| Server | `server/api/market-overview.ts` |
| Shared | `src/shared/market-data/` |
| Shared | `src/shared/color-utils.ts` |

**Key commits**: `4d4f453` `8dfcc80` `ce59b1f` `9e21398` `ce3b1eb` `eaa7de1` `f1fc0d4` `b4efb95` `26c9aa7`

---

### F-007 — Documentation Cleanup
**Priority**: P0 | **Status**: Done

Removed 310 files / 144,900 lines (audit reports, bibles, JSON dumps, obsolete scripts).

**Key commit**: `af223c2`

---

### F-008 — Home Page MOXI-First Layout
**Priority**: P0 | **Status**: Done

| Layer | Files |
|-------|-------|
| Route | `src/routes/_authenticated/index.tsx` |
| Component | `src/components/vixor/MoxiCharacter3D.tsx` (new) |
| Component | `src/components/vixor/MoxiAvatar.tsx` |
| Component | `src/components/vixor/LiveDot.tsx` |
| Domain | `src/domains/moxi/types.ts` |
| Domain | `src/domains/moxi/persona.ts` |
| Shared | `src/shared/data/index.ts` (getHomeMarketData, getDashboardData) |
| Shared | `src/shared/market-data/` (BinanceWS live prices) |
| Shared | `src/shared/hooks/use-stable-server-fn.ts` |

**Key commits**: `a9e577a` `3dc25a6` `a449640`

---

### F-001 — Git Hooks
**Priority**: P0 | **Status**: Done

| Layer | Files |
|-------|-------|
| Config | `.husky/pre-commit` |
| Config | `.husky/commit-msg` |
| Config | `package.json` (lint-staged, prepare script) |

**Key commit**: `7387e1b`

---

### F-002 — CI Pipeline
**Priority**: P0 | **Status**: Done

| Layer | Files |
|-------|-------|
| Config | `.github/workflows/ci.yml` |
| Config | `package.json` (typecheck script) |

**Key commit**: `708cdaf`

---

## Feature File Map (by Domain)

### Pages / Routes

| Route | File | Domain | Status |
|-------|------|--------|--------|
| `/` | `index.tsx` | home/moxi | Active |
| `/charts` | `charts.tsx` | chart-intelligence | Active |
| `/discover` | `discover.tsx` | discovery | Active |
| `/token/:symbol` | `token.$symbol.tsx` + `-token-symbol-component.tsx` | discovery | Active |
| `/analysis/:id` | `analysis.$id.tsx` + `-analysis-id-component.tsx` | analysis | Active |
| `/swap` | `swap.tsx` + `-swap-component.tsx` | trading | Active |
| `/signals` | `signals.tsx` | signal-tracking | Active |
| `/radar` | `radar.tsx` | market | Active |
| `/pnl` | `pnl.tsx` | trades | Active |
| `/portfolio` | `portfolio.tsx` | trades | Active |
| `/journal` | `journal.tsx` | notes | Active |
| `/trackers` | `trackers.tsx` | watchlist | Active |
| `/whale` | `whale.tsx` | market | Active |
| `/pulse` | `pulse.tsx` | market | Active |
| `/predictions` | `predictions.tsx` | strategy | Active |
| `/backtest` | `backtest.tsx` | backtest | Active |
| `/analyze` | `analyze.tsx` | analysis | Active |
| `/brokers` | `brokers.tsx` | broker | Active |
| `/premium` | `premium.tsx` | user | Active |
| `/rewards` | `rewards.tsx` | user | Active |
| `/referral` | `referral.tsx` | user | Active |
| `/perpetuals` | `perpetuals.tsx` | trading | Active |
| `/trade-desk` | `trade-desk.tsx` | trading | Active |
| `/daily-loop` | `daily-loop.tsx` + `-daily-loop-component.tsx` | daily-loop | Active |
| `/vision` | `vision.tsx` | strategy | Active |
| `/alpha` | `alpha.tsx` | strategy | Active |
| `/experiments` | `experiments.tsx` | experiment | Active |
| `/yield` | `yield.tsx` | arbitrage | Active |
| `/curves` | `curves.tsx` | arbitrage | Active |
| `/arbitrage` | `arbitrage.tsx` | arbitrage | Active |
| `/bags` | `bags.tsx` | trading | Active |
| `/communities` | `communities.tsx` | strategy | Active |
| `/admin/api-keys` | `admin/api-keys.tsx` | user | Active |
| `/settings` | `settings.tsx` | user | Active |
| `/profile` | `profile.tsx` | user | Active |
| `/notifications` | `notifications.tsx` | user | Active |
| `/wallet-web3` | `wallet-web3.tsx` | wallet | Active |
| `/activity-web3` | `activity-web3.tsx` | wallet | Active |

### Domain Modules

| Domain | Path | Files | Description |
|--------|------|-------|-------------|
| analysis | `src/domains/analysis/` | 24 | Token analysis, AI reports |
| arbitrage | `src/domains/arbitrage/` | 27 | Yield farming, DEX arbitrage |
| backtest | `src/domains/backtest/` | 9 | Strategy backtesting engine |
| broker | `src/domains/broker/` | 1 | Broker integration |
| chart-intelligence | `src/domains/chart-intelligence/` | 5 | Chart pattern recognition |
| chart-truth | `src/domains/chart-truth/` | 5 | Chart data validation |
| daily-loop | `src/domains/daily-loop/` | 3 | Daily market brief |
| debate | `src/domains/debate/` | 7 | AI debate analysis |
| discover | `src/domains/discover/` | 2 | Token discovery |
| discovery | `src/domains/discovery/` | 16 | GeckoTerminal DEX data |
| experiment | `src/domains/experiment/` | 5 | Feature experiments |
| market | `src/domains/market/` | 7 | Market data, whale tracking |
| moxi | `src/domains/moxi/` | 8 | MOXI persona, avatar, types |
| notes | `src/domains/notes/` | 3 | Trading journal notes |
| paper-trading | `src/domains/paper-trading/` | 4 | Simulated trading |
| risk-governor | `src/domains/risk-governor/` | 4 | Risk management |
| signal-tracking | `src/domains/signal-tracking/` | 3 | Signal alerts |
| strategy | `src/domains/strategy/` | 6 | Trading strategies |
| trades | `src/domains/trades/` | 3 | Trade history, PnL |
| trading | `src/domains/trading/` | 15 | Trading execution, swap |
| user | `src/domains/user/` | 5 | Auth, profile |
| wallet | `src/domains/wallet/` | 16 | Solana wallet, Web3 |
| watchlist | `src/domains/watchlist/` | 3 | Token watchlists |

### Server API Routes

| Endpoint | File | Description |
|----------|------|-------------|
| GET /api/health | `server/api/health.ts` | Health check |
| GET /api/sol-price | `server/api/sol-price.ts` | SOL price feed |
| GET /api/market-overview | `server/api/market-overview.ts` | Market stats |
| GET /api/discover | `server/api/discover.ts` | Token discovery data |
| POST /api/generate-signals | `server/api/generate-signals.ts` | AI signal generation |
| GET /api/check-alerts | `server/api/check-alerts.ts` | Signal alert checker |
| POST /api/telegram-webhook | `server/api/telegram-webhook.ts` | Telegram bot webhook |
| POST /api/stars-webhook | `server/api/stars-webhook.ts` | Stars payment webhook |
| GET /api/metrics | `server/api/metrics.ts` | App metrics |
| POST /api/migrate | `server/api/migrate.ts` | DB migrations |
| POST /api/p1-validate | `server/api/p1-validate.ts` | P1 bootstrap validation |
| POST /api/wallet/connect | `server/api/wallet/connect.ts` | Wallet connect |
| POST /api/wallet/session | `server/api/wallet/session.ts` | Wallet session |
| Cron /api/reanalysis-cron | `server/api/reanalysis-cron.ts` | Scheduled reanalysis |

### Shared Infrastructure

| Module | Path | Description |
|--------|------|-------------|
| Data (server fns) | `src/shared/data/` | All createServerFn handlers |
| Market data | `src/shared/market-data/` | BinanceWS, DexScreenerWS |
| Hooks | `src/shared/hooks/` | useRenderGuard, useStableServerFn, etc. |
| Supabase | `src/shared/supabase/` | Auth middleware, client config |
| LLM | `src/shared/llm/` | AI model providers |
| i18n | `src/shared/i18n/` | EN/AR translations |
| Crypto | `src/shared/crypto/` | Encryption utilities |
| Vault | `src/shared/vault/` | Secure storage |
| Notifications | `src/shared/notifications/` | Push notification system |
| Error capture | `src/shared/error-capture.ts` | Error boundary logic |
| Analytics | `src/shared/analytics.ts` | Mixpanel tracking |
| Telegram | `src/shared/telegram.ts` | Telegram SDK integration |
| Sound | `src/shared/sound-manager.ts` | Audio alerts |
