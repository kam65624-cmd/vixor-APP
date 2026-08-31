# VIXOR Domain Architecture

> Generated: DEBT-2 audit. This document maps every domain's responsibility,
> public API, and inter-domain dependencies.

## Dependency Graph

```
                              ┌──────────────┐
                              │    market    │  ← leaf (no cross-domain deps)
                              └──────┬───────┘
                    ┌────────────────┼────────────────┐
                    │                │                │
              ┌─────┴─────┐   ┌─────┴──────┐   ┌─────┴──────┐
              │  backtest  │   │   analysis  │   │ chart-intel│
              └─────┬──────┘   └──┬────┬────┘   └─────┬──────┘
                    │             │    │               │
              ┌─────┴───┐   ┌────┘    └──┐      ┌─────┴──────┐
              │ strategy │   │          │      │ chart-truth │
              └────┬────┘   │          │      └────────────┘
                   │        │          │
              ┌────┴────┐  │     ┌────┴────┐
              │experiment│  │     │  debate  │
              └─────────┘  │     └─────────┘
                           │
              ┌────────────┴────────────┐
              │        trading          │
              └──────────┬──────────────┘

  Independent (no cross-domain deps):
    discovery, arbitrage, wallet, daily-loop, notes, signal-tracking, trades, user, watchlist
```

**No circular dependencies exist.** All cross-domain imports form a clean DAG.
Dynamic `await import()` calls are used for optional features (debate, chart-truth, chart-intelligence).

---

## Domain Catalog

### 1. `market` (7 files) — Leaf Domain

**Responsibility:** External data fetching — prices (Binance, TwelveData), news, economic calendar, OHLCV klines, ETFs, fundamentals.

| File                          | Role                                           |
| ----------------------------- | ---------------------------------------------- |
| `functions.ts`                | Server functions for UI (TanStack Start)       |
| `types.ts`                    | Public types (MarketPriceItem, KlineBar, etc.) |
| `server/price-fetcher.ts`     | Binance + TwelveData price/kline clients       |
| `server/news.ts`              | News aggregation                               |
| `server/economic-calendar.ts` | Economic events fetching                       |
| `index.ts`                    | Barrel export                                  |

**Imports from:** None (leaf)  
**Imported by:** analysis, backtest, chart-truth, debate, experiment, trading (6 domains — most depended-upon)

---

### 2. `analysis` (22 files) — Core Domain

**Responsibility:** Technical analysis engine — local candle-by-candle analysis with indicators, pattern detection (harmonic, candlestick, chart formations), SMC concepts (BOS/CHOCH, order blocks, FVGs), regime detection, and risk-reward calculation.

| File/Dir                 | Role                                        |
| ------------------------ | ------------------------------------------- |
| `engine/engine.ts`       | Main analysis orchestrator                  |
| `engine/core/`           | Candle utilities, market structure, types   |
| `engine/indicators/`     | Technical indicators                        |
| `engine/patterns/`       | Harmonic, candlestick, chart formations     |
| `engine/regime/`         | Regime detection & strategy scoring         |
| `engine/risk/`           | Risk-reward calculations                    |
| `server/run-analysis.ts` | Server function: run full analysis pipeline |
| `functions.ts`           | Server functions: CRUD for analyses         |
| `types.ts`               | Public types                                |

**Imports from:** backtest (static), chart-intelligence (static), market (static), chart-truth (dynamic), debate (dynamic)  
**Imported by:** debate, experiment, trading (all dynamic or type-only)

---

### 3. `backtest` (8 files) — Core Domain

**Responsibility:** In-house backtesting engine — candle-by-candle strategy simulation with position management, protective stops, trailing stops, and performance metrics (Sharpe, Sortino, max drawdown, CAGR).

| File/Dir                  | Role                                         |
| ------------------------- | -------------------------------------------- |
| `engine/simulator.ts`     | Core backtest loop                           |
| `engine/state-machine.ts` | Position state machine                       |
| `engine/metrics.ts`       | Performance metrics                          |
| `engine/candle-path.ts`   | Candle packing for performance               |
| `engine/types.ts`         | Engine types (Candle, Trade, Position, etc.) |
| `functions.ts`            | Server functions + strategy compiler         |

**Imports from:** market (static)  
**Imported by:** analysis, experiment, strategy (3 domains)

---

### 4. `chart-intelligence` (5 files) — Core Domain

**Responsibility:** Ensures analysis is based on REAL data, not hallucinated. Two modes: session mode (data from TradingView widget) and vision mode (image/screenshot analysis with extraction pipeline).

| File                  | Role                                         |
| --------------------- | -------------------------------------------- |
| `chart-context.ts`    | ChartContext type, session/failed extraction |
| `chart-vision.ts`     | Vision pipeline: image → ChartContext        |
| `chart-validation.ts` | Confidence-based validation                  |
| `chart-session.ts`    | TradingView session management               |

**Imports from:** None (leaf)  
**Imported by:** analysis, chart-truth (dynamic)

---

### 5. `chart-truth` (5 files) — Validation Domain

**Responsibility:** Validates vision-extracted chart data against real market prices. Runs AFTER chart validation and BEFORE analysis. Never blocks analysis — only warns.

| File                      | Role                               |
| ------------------------- | ---------------------------------- |
| `market-truth.service.ts` | Price truth validation service     |
| `truth-score.engine.ts`   | Truth score calculation            |
| `price-reconciler.ts`     | Price reconciliation               |
| `types.ts`                | TruthValidationResult, TruthStatus |

**Imports from:** chart-intelligence (static), market (static)  
**Imported by:** analysis (dynamic)

---

### 6. `strategy` (5 files) — Core Domain

**Responsibility:** Runtime compilation and execution of user-defined trading strategies. Strategies call indicator APIs and order functions via a sandboxed StrategyContext.

| File/Dir                      | Role                                    |
| ----------------------------- | --------------------------------------- |
| `runtime/script-runtime.ts`   | Strategy compilation & execution        |
| `runtime/indicator-params.ts` | Indicator parameter parsing             |
| `runtime/types.ts`            | Strategy types (CompiledStrategy, etc.) |

**Imports from:** backtest (static — types only)  
**Imported by:** experiment (static)

---

### 7. `experiment` (5 files) — Research Domain

**Responsibility:** Evolutionary strategy optimization. Runs multi-generational backtests with LLM-guided mutations to find optimal indicator parameters.

| File           | Role                                         |
| -------------- | -------------------------------------------- |
| `evolution.ts` | Genetic evolution engine                     |
| `runner.ts`    | Experiment runner (multi-generation)         |
| `prompts.ts`   | LLM prompts for strategy generation/mutation |
| `functions.ts` | Server function for running experiments      |

**Imports from:** analysis (static), backtest (static), market (static), strategy (static)  
**Imported by:** None

---

### 8. `debate` (7 files) — AI Domain

**Responsibility:** Multi-agent cross-validation of analysis results. Four agents (Analyst, Strategist, RiskGuard, Contrarian) with weighted voting. Opt-in via `ENABLE_DEBATE_ENGINE=true`.

| File/Dir                     | Role                                      |
| ---------------------------- | ----------------------------------------- |
| `engine/debate.engine.ts`    | Core debate orchestration                 |
| `agents/analyst.agent.ts`    | Analyst agent (follows primary analysis)  |
| `agents/strategist.agent.ts` | Strategist agent (trend + R:R evaluation) |
| `agents/risk-guard.agent.ts` | Risk guard agent (highest authority)      |
| `agents/contrarian.agent.ts` | Contrarian agent (devil's advocate)       |
| `types.ts`                   | DebateResult, AgentVote types             |

**Imports from:** analysis (static — type only)  
**Imported by:** analysis (dynamic)

---

### 10. `trading` (12 files) — Trading Operations

**Responsibility:** Price alerts, daily signals, user strategies, and exchange connectivity. Contains an agent gateway with adapters for Binance, Bybit, OKX, and a dummy adapter.

| File/Dir                   | Role                                          |
| -------------------------- | --------------------------------------------- |
| `functions.ts`             | Server functions: alerts, signals, strategies |
| `types.ts`                 | PriceAlert, DailySignal, UserStrategy         |
| `server/alert-checker.ts`  | Background alert monitoring                   |
| `gateway/agent-gateway.ts` | Exchange abstraction layer                    |
| `gateway/adapters/`        | Binance, Bybit, OKX, dummy adapters           |
| `gateway/types.ts`         | Gateway types (OrderRequest, etc.)            |

**Imports from:** market (static), analysis (dynamic)  
**Imported by:** None

---

### 11. `trades` (3 files) — Trade Journal

**Responsibility:** Trade journal CRUD, performance statistics, and equity curve tracking. Records individual trade outcomes (entry/exit, PnL, R-multiple).

| File           | Role                                          |
| -------------- | --------------------------------------------- |
| `functions.ts` | Server functions: CRUD + stats + equity curve |
| `types.ts`     | Trade, TradeStats, EquityCurvePoint           |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 12. `signal-tracking` (3 files) — Signal Lifecycle

**Responsibility:** Tracks signal performance over time. Monitors for TP/SL hits and sends notifications when status changes.

| File           | Role                                       |
| -------------- | ------------------------------------------ |
| `functions.ts` | Server functions: CRUD + status evaluation |
| `types.ts`     | SignalTracking, SignalStatus               |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 13. `discovery` (16 files) — Token Discovery

**Responsibility:** Memecoin/token discovery across chains. Multi-stage scoring pipeline: new pair filtering, liquidity analysis, smart money scoring, social velocity, combined scoring.

| File/Dir       | Role                                              |
| -------------- | ------------------------------------------------- |
| `scoring.ts`   | Multi-stage scoring pipeline                      |
| `types.ts`     | Token types, social signals                       |
| `clients/`     | External API clients (DexScreener, Birdeye, etc.) |
| `server.ts`    | Server-only functions                             |
| `config.ts`    | Discovery configuration                           |
| `constants.ts` | Chain metadata, thresholds, rate limits           |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 14. `arbitrage` (25 files) — Arbitrage Engine

**Responsibility:** Cross-DEX, triangular, and CEX-DEX arbitrage detection and execution. Ported from axiom-arbitrage-trading-bot. Dry-run by default.

| File/Dir        | Role                                    |
| --------------- | --------------------------------------- |
| `engine.ts`     | Core arbitrage scanner                  |
| `strategies/`   | CrossDex, Triangular, CexDex strategies |
| `exchanges/`    | Jupiter, Axiom exchange clients         |
| `executor.ts`   | Trade execution                         |
| `price-feed.ts` | Price feed abstraction                  |
| `risk.ts`       | Risk management + circuit breaker       |
| `config.ts`     | Arbitrage configuration                 |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 15. `wallet` (14 files) — Wallet Management

**Responsibility:** Web3 wallet connectivity (MetaMask, Phantom). Session management, challenge-response auth, EVM chain configuration. Has both client-side React components and server-side auth functions.

| File/Dir    | Role                                                      |
| ----------- | --------------------------------------------------------- |
| `adapter/`  | React components: WalletProvider, ConnectButton, Selector |
| `adapters/` | MetaMask and Phantom adapter libraries                    |
| `server.ts` | Server-only functions (connect, verify signature)         |
| `config.ts` | Chain configs, session TTL, challenge generation          |
| `types.ts`  | Wallet types (WalletChain, WalletSession, etc.)           |

**Imports from:** None (leaf)  
**Imported by:** None  
**Note:** Only domain with client-side React components

---

### 16. `user` (5 files) — User Management

**Responsibility:** User profile, authentication (Telegram), points/billing, premium subscriptions, referrals, notifications.

| File                        | Role                                                  |
| --------------------------- | ----------------------------------------------------- |
| `functions.ts`              | Server functions: profile, points, premium, referrals |
| `auth.functions.ts`         | Telegram sign-in, admin creation                      |
| `types.ts`                  | UserProfile, PointsBalance, etc.                      |
| `server/telegram-verify.ts` | Telegram init data verification                       |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 17. `watchlist` (3 files) — Watchlist Management

**Responsibility:** User watchlists with CRUD operations, reordering, and multiple named watchlists.

| File           | Role                             |
| -------------- | -------------------------------- |
| `functions.ts` | Server functions: CRUD + reorder |
| `types.ts`     | Watchlist, WatchlistItem         |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 18. `daily-loop` (3 files) — Daily Trading Routine

**Responsibility:** Daily trader loop: morning prep, session tracking (London/NY/Asian), EOD review. Includes streak tracking.

| File           | Role                                    |
| -------------- | --------------------------------------- |
| `functions.ts` | Server functions: get/update daily loop |
| `types.ts`     | DailyLoop, UserStreak, MarketBias       |

**Imports from:** None (leaf)  
**Imported by:** None

---

### 19. `notes` (3 files) — Trading Notes

**Responsibility:** Trading journal notes with CRUD operations, filterable by pair or analysis.

| File           | Role                   |
| -------------- | ---------------------- |
| `functions.ts` | Server functions: CRUD |
| `types.ts`     | TradingNote, Mood      |

**Imports from:** None (leaf)  
**Imported by:** None

---

## Issues Found

### 🔴 No Circular Dependencies

All cross-domain imports form a clean DAG. No A→B→A cycles detected.

### 🟡 Missing Barrel Exports (FIXED)

| Domain     | Status      | Action                                                      |
| ---------- | ----------- | ----------------------------------------------------------- |
| `backtest` | Was missing | ✅ Created `index.ts` with engine + compileStrategy exports |
| `strategy` | Was missing | ✅ Created `index.ts` re-exporting from `runtime/`          |

### 🟡 Potential Misplacement: `trading/gateway/`

The `trading/gateway/` subdirectory (agent-gateway.ts + exchange adapters for Binance/Bybit/OKX/dummy) implements exchange connectivity for order execution. This is conceptually distinct from the rest of `trading/` (price alerts, daily signals, user strategies). **Recommendation:** Consider extracting to a dedicated `execution/` domain in a future refactoring pass. **Not moved** per task constraints.

### 🟢 Small Domains (3 files each)

These domains have minimal code but serve distinct, self-contained concerns:

- `notes/` — Trade journal notes
- `daily-loop/` — Daily trading routine
- `signal-tracking/` — Signal lifecycle tracking
- `trades/` — Trade journal CRUD
- `watchlist/` — Watchlist management

All are leaf domains with no cross-domain dependencies. They are small by design — each maps to a single DB table pattern. No merge recommended.

### 🟢 Server/Client Separation

Only `wallet/` contains both client-side React components (`adapter/*.tsx`) and server-side code (`server.ts`, `config.ts`). The barrel `index.ts` correctly exports only client-safe items and documents that server functions should be imported from `./server`. No issue.

### 🟢 `analysis → debate` and `analysis → chart-truth` (Dynamic Imports)

These are `await import()` calls inside `analysis/server/run-analysis.ts`, not static imports. They are opt-in features that only load when enabled. No circular dependency risk.

---

## Domain Size Summary

| Domain             | Files | Role                                 |
| ------------------ | ----- | ------------------------------------ |
| arbitrage          | 25    | Arbitrage engine (independent)       |
| analysis           | 22    | Core analysis engine                 |
| discovery          | 16    | Token discovery                      |
| wallet             | 14    | Web3 wallet                          |
| trading            | 12    | Alerts, signals, exchange gateway    |
| backtest           | 8     | Backtesting engine                   |
| debate             | 7     | Multi-agent debate                   |
| market             | 7     | Price/news data (most depended-upon) |
| experiment         | 5     | Evolutionary optimization            |
| strategy           | 5     | Strategy runtime                     |
| chart-intelligence | 5     | Chart data validation                |
| chart-truth        | 5     | Price truth scoring                  |
| user               | 5     | User management                      |
| daily-loop         | 3     | Daily routine                        |
| notes              | 3     | Trading notes                        |
| signal-tracking    | 3     | Signal tracking                      |
| trades             | 3     | Trade journal                        |
| watchlist          | 3     | Watchlist                            |
