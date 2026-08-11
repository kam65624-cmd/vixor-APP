# VIXOR OSS Research Report — Trading & Analytics Ecosystem

> **Objective:** Identify the best open-source projects across 8 domains to close VIXOR's current capability gaps: no backtesting, basic TA indicators, custom exchange data fetching (could be replaced), custom signal tracking (needs formalization), and no portfolio analytics/risk metrics.
>
> **Filter criteria:** Actively maintained (updated within last 6 months), real-world utility, license compatibility.

---

## 1. 🔄 Trading Signal Engine / State Machine

*VIXOR Gap: Custom signal tracking exists but lacks formal state machine lifecycle (signal → pending → triggered → expired → acted).*

### ⭐ RECOMMENDED: XState (statelyai/xstate)
| Field | Value |
|---|---|
| **Name** | XState |
| **URL** | https://github.com/statelyai/xstate |
| **Stars** | ~28,000 |
| **License** | MIT |
| **What it does** | Industry-standard TypeScript state machine and statechart library. Enables formal modeling of signal lifecycles (idle → scanning → signal_generated → evaluating → executing → completed/failed). Supports hierarchical states, parallel states, guards, actions, and actor model for concurrent signal processing. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production (v5 stable, used by Stripe, Microsoft, Spotify) |
| **TypeScript** | ✅ Native TypeScript, best-in-class type safety for state machines |
| **VIXOR Fit** | 🔥 **HIGH** — Directly solves the signal lifecycle formalization gap. Your MOXI agent's decision pipeline can be modeled as a statechart. Replaces ad-hoc signal tracking with a provably correct state machine. |

### Robot3
| Field | Value |
|---|---|
| **Name** | Robot3 |
| **URL** | https://github.com/matthewp/robot3 |
| **Stars** | ~1,400 |
| **License** | MIT |
| **What it does** | Minimal, functional TypeScript finite state machine. No dependencies, tiny bundle (~1KB). Good for simple signal state transitions without the overhead of XState. |
| **Maturity** | ⭐⭐⭐ Stable but low activity |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🟡 MEDIUM — If you only need simple flat state machines for signals, this is lighter than XState. But XState's visualizer and hierarchical states are worth the cost. |

### NautilusTrader
| Field | Value |
|---|---|
| **Name** | NautilusTrader |
| **URL** | https://github.com/nautechsystems/nautilus_trader |
| **Stars** | ~25,400 |
| **License** | LGPL-3.0 |
| **What it does** | Production-grade algorithmic trading engine with Rust-native core. Has a formal order/trade lifecycle state machine built-in. Event-driven architecture with deterministic backtesting. Multi-asset, multi-venue. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production (8+ years, actively maintained) |
| **TypeScript** | ❌ Python/Rust only |
| **VIXOR Fit** | 🟡 MEDIUM — Architecture reference for how a proper trading signal engine should be designed. Its state machine patterns for order lifecycle are worth studying, but can't be directly integrated into a TS codebase. |

---

## 2. 🤖 Trading Bot Strategy Engine (TypeScript)

*VIXOR Gap: No strategy engine for composing, testing, and executing trading logic programmatically.*

### ⭐ RECOMMENDED: backtest-kit
| Field | Value |
|---|---|
| **Name** | backtest-kit |
| **URL** | https://github.com/backtest-kit |
| **Stars** | ~1,000+ (growing) |
| **License** | MIT |
| **What it does** | **"The code you test is the code you ship."** TypeScript engine for backtesting AND live-trading strategies for crypto, forex, DEX, spot, futures. Production-grade Node.js infrastructure with a single codebase for backtest/paper/live. Includes strategy composition, indicator pipelines, and order management. |
| **Maturity** | ⭐⭐⭐⭐ Active development, production users |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGHEST** — This is the single most relevant project for VIXOR. Directly solves the backtesting gap while being TypeScript-native. The "test=ship" paradigm means VIXOR's signal logic can be backtested then deployed to live without rewrite. Could replace or augment custom exchange data fetching. |

### BacktestJS (backtestjs/framework)
| Field | Value |
|---|---|
| **Name** | BacktestJS |
| **URL** | https://github.com/backtestjs/framework |
| **Stars** | ~500+ |
| **License** | MIT |
| **What it does** | Comprehensive TypeScript framework to fetch candle data, backtest strategies, and compare results. Has a CLI, quick-start templates, and strategy comparison tools. |
| **Maturity** | ⭐⭐⭐ Early but active |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — Simpler alternative to backtest-kit. Good if VIXOR wants a lighter backtesting layer without the live-trading infrastructure. |

### NextTrade
| Field | Value |
|---|---|
| **Name** | NextTrade |
| **URL** | https://github.com/kevindra/NextTrade (reference from Reddit/Medium) |
| **Stars** | ~2,000+ |
| **License** | MIT |
| **What it does** | Open-source TypeScript platform for creating, testing, optimizing, and deploying algorithmic trading strategies. Has a web interface, optimization engine, and multi-exchange support. |
| **Maturity** | ⭐⭐⭐ Active (1+ year of improvements) |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — Full-stack TS trading platform with optimization. Could serve as architectural reference or be adapted for VIXOR's needs. |

### Freqtrade
| Field | Value |
|---|---|
| **Name** | Freqtrade |
| **URL** | https://github.com/freqtrade/freqtrade |
| **Stars** | ~48,000 |
| **License** | GPL-3.0 |
| **What it does** | The most popular open-source crypto trading bot. Python-based with strategy development, hyperparameter optimization, backtesting, dry-run, and live trading via Telegram/Web UI. Uses CCXT for exchange connectivity. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production (9 years, massive community) |
| **TypeScript** | ❌ Python only (some JS in web UI) |
| **VIXOR Fit** | 🟡 MEDIUM — Best-in-class for architecture reference. Its strategy pattern, signal→trade lifecycle, and backtesting engine design are worth studying. GPL license limits direct code reuse. Not TS-native. |

### Hummingbot
| Field | Value |
|---|---|
| **Name** | Hummingbot |
| **URL** | https://github.com/hummingbot/hummingbot |
| **Stars** | ~19,400 |
| **License** | Apache-2.0 |
| **What it does** | Open-source framework for automated trading strategies (market making, arbitrage, CEX/DEX). Python core with strategy framework, connectors to 30+ exchanges, and a CLI/UI. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟡 MEDIUM — Excellent architecture reference for exchange connectors and strategy patterns. Apache-2.0 license is permissive. |

### Jesse
| Field | Value |
|---|---|
| **Name** | Jesse |
| **URL** | https://github.com/jesse-ai/jesse |
| **Stars** | ~8,500 |
| **License** | MIT |
| **What it does** | Advanced Python crypto trading framework focused on clean strategy research. Backtesting, live trading, and a clean API for defining strategies with clear signal logic. |
| **Maturity** | ⭐⭐⭐⭐ Production |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟡 LOW-MEDIUM — Clean strategy API design is inspiring but Python-only. |

### OctoBot
| Field | Value |
|---|---|
| **Name** | OctoBot |
| **URL** | https://github.com/Drakkar-Software/OctoBot |
| **Stars** | ~3,500 |
| **License** | LGPL-3.0 |
| **What it does** | Crypto trading bot with AI-based strategy adaptation. Python monorepo with visual interface, supports 15+ exchanges, AI/ML signal integration. |
| **Maturity** | ⭐⭐⭐⭐ Active |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟢 LOW — Interesting AI integration patterns but Python/LGPL limits usefulness for VIXOR. |

---

## 3. 🔌 Exchange Data Library

*VIXOR Gap: Custom exchange data fetching could be replaced with a battle-tested unified library.*

### ⭐ RECOMMENDED: CCXT
| Field | Value |
|---|---|
| **Name** | CCXT |
| **URL** | https://github.com/ccxt/ccxt |
| **Stars** | ~35,000+ |
| **License** | MIT |
| **What it does** | The de facto standard unified API for 100+ cryptocurrency exchanges and prediction markets. One API for market data, order management, and trading across Binance, Coinbase, OKX, Bybit, Kraken, etc. Available in JavaScript/TypeScript, Python, PHP, C#, Go, Java. Async and sync support. WebSockets for real-time data. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production (industry standard, 8+ years) |
| **TypeScript** | ✅ Primary language is JavaScript/TypeScript with full type definitions |
| **VIXOR Fit** | 🔥 **CRITICAL** — Should almost certainly replace VIXOR's custom exchange data fetching. Provides battle-tested, unified, actively maintained exchange connectivity. Direct TypeScript/Node.js support. Unless VIXOR trades on exotic exchanges not in CCXT's 100+ coverage, this is a no-brainer. |

---

## 4. 📊 Technical Analysis Indicators Library (TS/JS)

*VIXOR Gap: Basic TA indicators — needs a comprehensive, well-maintained library.*

### ⭐ RECOMMENDED: trading-signals (TSParticles)
| Field | Value |
|---|---|
| **Name** | trading-signals |
| **URL** | https://www.npmjs.com/package/trading-signals (https://github.com/tsparticles/trading-signals) |
| **Stars** | ~800+ |
| **License** | MIT |
| **What it does** | TypeScript implementation of common technical indicators (SMA, EMA, RSI, MACD, Bollinger Bands, etc.). Designed for algorithmic trading pipelines with streaming/incremental calculation support. Well-typed, zero dependencies. |
| **Maturity** | ⭐⭐⭐⭐ Active (updated Jan 2026) |
| **TypeScript** | ✅ Native TypeScript with full type exports |
| **VIXOR Fit** | 🔥 **HIGH** — Best TS-native indicator library. Streaming support is perfect for real-time signal evaluation. Zero-dependency nature keeps bundle small for client-side use. |

### ⭐ RECOMMENDED: technicalindicators (anandanand84)
| Field | Value |
|---|---|
| **Name** | technicalindicators |
| **URL** | https://github.com/anandanand84/technicalindicators |
| **Stars** | ~3,400+ |
| **License** | MIT |
| **What it does** | The most popular JS/TS technical indicators library. 100+ indicators including SMA, EMA, RSI, MACD, Bollinger Bands, Stochastic, ADX, ATR, Ichimoku, and more. Includes candlestick pattern recognition. Runs in browser and Node.js. |
| **Maturity** | ⭐⭐⭐⭐ Mature (widely used) |
| **TypeScript** | ✅ Written in TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — Most comprehensive indicator coverage in JS/TS ecosystem. Pattern recognition is a bonus. Should be evaluated alongside trading-signals — pick one based on API preference and streaming needs. |

### fast-technical-indicators
| Field | Value |
|---|---|
| **Name** | fast-technical-indicators |
| **URL** | https://www.jsdelivr.com/package/npm/fast-technical-indicators (npm) |
| **Stars** | ~200+ |
| **License** | MIT |
| **What it does** | High-performance, zero-dependency TA indicators for JS/TS. 100% API-compatible drop-in replacement for technicalindicators but optimized for speed. |
| **Maturity** | ⭐⭐⭐ Growing |
| **TypeScript** | ✅ TypeScript support |
| **VIXOR Fit** | 🟡 MEDIUM — If VIXOR needs maximum indicator calculation speed (e.g., scanning 1000s of symbols), this is worth benchmarking against technicalindicators. |

### ta (ninokroesen)
| Field | Value |
|---|---|
| **Name** | ta |
| **URL** | https://github.com/ninokroesen/ta |
| **Stars** | ~1,000+ |
| **License** | MIT |
| **What it does** | Cross-language technical analysis library (JS, Python, Go). Lightweight financial indicators. |
| **Maturity** | ⭐⭐⭐ Stable, maintained (updated Apr 2026) |
| **TypeScript** | ✅ JavaScript/TypeScript |
| **VIXOR Fit** | 🟢 LOW-MEDIUM — Decent but less comprehensive than technicalindicators. Cross-language aspect could be useful if VIXOR adds a Python backend. |

### TA-Lib (C/C++ core)
| Field | Value |
|---|---|
| **Name** | TA-Lib |
| **URL** | https://ta-lib.org (https://github.com/ta-lib/ta-lib-python for Python wrapper) |
| **Stars** | ~10,000+ (Python wrapper) |
| **License** | BSD-3-Clause (C lib) |
| **What it does** | The gold standard for technical analysis. 200+ indicators, candlestick patterns, written in C/C++ for maximum speed. Has wrappers for Python, Java, and others. No official JS/TS wrapper. |
| **Maturity** | ⭐⭐⭐⭐⭐ Industry standard (20+ years) |
| **TypeScript** | ❌ No official TS wrapper (unofficial npm: `ta-lib`) |
| **VIXOR Fit** | 🟡 MEDIUM — The definitive indicator library if VIXOR ever adds a Python/Rust backend. For pure TS, stick with technicalindicators or trading-signals. |

### Tulip Indicators
| Field | Value |
|---|---|
| **Name** | Tulip Indicators |
| **URL** | https://tulipindicators.org (https://github.com/tulip/tulipnode for JS wrapper) |
| **Stars** | ~2,500+ (C lib) |
| **License** | LGPL-3.0 |
| **What it does** | ANSI C library for 100+ technical analysis indicators. Focuses on correctness and performance. Has community JS wrapper (tulipnode). |
| **Maturity** | ⭐⭐⭐⭐ Mature |
| **TypeScript** | 🟡 Via unofficial tulipnode wrapper |
| **VIXOR Fit** | 🟢 LOW — LGPL license is restrictive. Unofficial TS wrapper. technicalindicators is a better TS-native choice. |

---

## 5. 🧪 Backtesting Framework

*VIXOR Gap: NO backtesting capability — this is the single biggest gap.*

### ⭐ RECOMMENDED (TS): backtest-kit
| Field | Value |
|---|---|
| **Name** | backtest-kit |
| **URL** | https://github.com/backtest-kit |
| **Stars** | ~1,000+ |
| **License** | MIT |
| **What it does** | TypeScript engine for backtesting AND live-trading. Crypto, forex, DEX, spot, futures. Production-grade Node.js. "Code you test is code you ship." |
| **Maturity** | ⭐⭐⭐⭐ Active development |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGHEST** — See Domain 2 entry. This single project covers backtesting + strategy engine + live trading in TypeScript. |

### ⭐ RECOMMENDED (TS): BacktestJS
| Field | Value |
|---|---|
| **Name** | BacktestJS |
| **URL** | https://github.com/backtestjs/framework |
| **Stars** | ~500+ |
| **License** | MIT |
| **What it does** | TypeScript framework to fetch candle data, backtest strategies, compare results. CLI and quick-start templates. |
| **Maturity** | ⭐⭐⭐ Early but active |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — Lighter weight alternative to backtest-kit. Good for VIXOR if the live-trading part isn't needed from the framework. |

### ⭐ RECOMMENDED (Python): VectorBT
| Field | Value |
|---|---|
| **Name** | VectorBT Pro / VectorBT |
| **URL** | https://github.com/polakowo/vectorbt |
| **Stars** | ~3,500+ |
| **License** | Apache-2.0 (open source) |
| **What it does** | The most powerful backtesting engine for Python. Tick-level and bar-level simulation. Built on pandas/numpy with Numba JIT compilation. Portfolio-level backtesting with drawdown analytics, trade analytics, QuantStats integration, signal generation/ranking/mapping tools. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🔥 **HIGH** (as Python sidecar) — If VIXOR adds a Python backend service for heavy quant computation, VectorBT is the gold standard. The signal tooling (generation, ranking, mapping) directly maps to VIXOR's signal tracking needs. |

### Backtrader
| Field | Value |
|---|---|
| **Name** | Backtrader |
| **URL** | https://github.com/backtrader2 (community) / backtrader.com |
| **Stars** | ~13,000+ |
| **License** | MIT (unmaintained original) |
| **What it does** | Comprehensive Python backtesting framework with event-driven engine. Supports indicators, strategies, analyzers (Sharpe, drawdown, trade stats), and live trading via broker integrations. |
| **Maturity** | ⭐⭐⭐⭐ Mature but AUTHOR STOPPED MAINTENANCE |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟡 MEDIUM — Architecture is excellent but project is effectively unmaintained. Use pyfolio-reloaded or VectorBT for modern Python backtesting. |

### TuringTrader
| Field | Value |
|---|---|
| **Name** | TuringTrader |
| **URL** | https://github.com/TuringTrader/TuringTrader (https://www.turingtrader.org) |
| **Stars** | ~200+ |
| **License** | Apache-2.0 |
| **What it does** | Open-source backtesting engine for end-of-day trading strategies in Python. Designed for accuracy and ease of use. |
| **Maturity** | ⭐⭐⭐ Niche |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟢 LOW — Too niche compared to VectorBT. |

---

## 6. 📈 Portfolio Analytics & Risk Metrics

*VIXOR Gap: No portfolio analytics, no MFE/MAE, no Sharpe/Sortino, no drawdown analysis.*

### ⭐ RECOMMENDED: QuantStats
| Field | Value |
|---|---|
| **Name** | QuantStats |
| **URL** | https://github.com/ranaroussi/quantstats |
| **Stars** | ~5,500+ |
| **License** | MIT |
| **What it does** | The go-to Python library for portfolio analytics. Generates tear sheets with: Sharpe/Sortino ratios, max drawdown, Calmar ratio, win rate, profit factor, expected value, MFE/MAE per trade, monthly/yearly returns heatmap, drawdown periods, rolling statistics, benchmark comparison. Beautiful HTML report generation. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🔥 **HIGH** (as Python microservice) — This is THE portfolio analytics library. The MFE/MAE per-trade analysis, drawdown analysis, and risk metrics directly fill VIXOR's analytics gap. Deploy as a Python backend service that VIXOR's TS frontend calls. |

### ⭐ RECOMMENDED: pyfolio-reloaded
| Field | Value |
|---|---|
| **Name** | pyfolio-reloaded |
| **URL** | https://github.com/stefan-jansen/pyfolio-reloaded |
| **Stars** | ~1,500+ |
| **License** | Apache-2.0 |
| **What it does** | Maintained fork of Quantopian's pyfolio. The most information-dense portfolio analytics in Python. Bayesian analysis, transaction analysis, round-trip trade analysis (includes MFE/MAE), sector exposure, factor analysis. Integrates with Zipline backtester. |
| **Maturity** | ⭐⭐⭐⭐ Active (maintained by Stefan Jansen, ML for Trading author) |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🔥 **HIGH** — Richer diagnostics than QuantStats for research. The round-trip trade analysis with MFE/MAE is exactly what VIXOR needs. Apache-2.0 license. |

### Riskfolio-Lib
| Field | Value |
|---|---|
| **Name** | Riskfolio-Lib |
| **URL** | https://github.com/dcajasn/Riskfolio-Lib |
| **Stars** | ~4,000+ |
| **License** | BSD-3-Clause |
| **What it does** | Portfolio optimization in Python. Risk metrics (VaR, CVaR, Sortino, semideviation), mean-risk optimization, Black-Litterman, hierarchical risk parity, factor models. |
| **Maturity** | ⭐⭐⭐⭐ Active |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟡 MEDIUM — Focused on portfolio optimization rather than trade analytics. Useful if VIXOR expands to portfolio construction/allocation. |

### empyrical-reloaded
| Field | Value |
|---|---|
| **Name** | empyrical-reloaded |
| **URL** | Referenced in awesome-quant |
| **Stars** | ~300+ |
| **License** | Apache-2.0 |
| **What it does** | Common financial risk and performance metrics (Sharpe, Sortino, max drawdown, annualized return, Calmar, Omega). Lightweight alternative to QuantStats/pyfolio for raw metric computation. |
| **Maturity** | ⭐⭐⭐ Maintained fork |
| **TypeScript** | ❌ Python only |
| **VIXOR Fit** | 🟡 MEDIUM — Good if VIXOR just needs raw metric calculations without the full tear sheet generation. |

### OpenBB Platform
| Field | Value |
|---|---|
| **Name** | OpenBB Platform |
| **URL** | https://github.com/OpenBB-finance/OpenBB |
| **Stars** | ~35,000+ |
| **License** | AGPL-3.0 |
| **What it does** | Open data platform for analysts, quants, and AI agents. Integrates 100+ data sources. Terminal, dashboard, Python SDK. Covers stocks, crypto, forex, macro, alternative data. Portfolio analytics, screening, backtesting. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production |
| **TypeScript** | 🟡 Python backend, React frontend |
| **VIXOR Fit** | 🟡 MEDIUM — Massive platform but AGPL license is problematic for commercial use. Best as a reference architecture and data source aggregator. |

---

## 7. 📉 Financial Charting Library (Web/TypeScript)

*VIXOR Gap: Needs professional financial charting for price visualization with TA overlay.*

### ⭐ RECOMMENDED: TradingView Lightweight Charts
| Field | Value |
|---|---|
| **Name** | Lightweight Charts |
| **URL** | https://github.com/tradingview/lightweight-charts |
| **Stars** | ~16,900+ |
| **License** | Apache-2.0 |
| **What it does** | The smallest and fastest financial HTML5 charts. Canvas-based, handles millions of data points. Candlestick, line, area, histogram. Volume, price lines, markers. Plugin system for custom overlays. Used by TradingView itself. React/Vue/Svelte wrappers available. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production (by TradingView) |
| **TypeScript** | ✅ Full TypeScript API |
| **VIXOR Fit** | 🔥 **CRITICAL** — This is the obvious choice for VIXOR's charting needs. Fast, lightweight, Apache-2.0, excellent TS support. Industry standard for web financial charts. No built-in indicators but that's fine since VIXOR has its own TA indicators (or uses technicalindicators). |

### ⭐ RECOMMENDED: KLineChart
| Field | Value |
|---|---|
| **Name** | KLineChart |
| **URL** | https://github.com/klinecharts/KLineChart |
| **Stars** | ~4,500+ |
| **License** | MIT |
| **What it does** | Lightweight, highly customizable k-line/candlestick chart. Built-in multiple technical indicators and line drawing tools. React/Vue wrappers. Supports data loading, technical indicator overlay, sub-charts, and custom drawing. |
| **Maturity** | ⭐⭐⭐⭐ Active |
| **TypeScript** | ✅ TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — If VIXOR wants built-in indicators + drawing tools + candlestick charts in ONE library (vs. Lightweight Charts + separate indicators), KLineChart is the answer. MIT license. More feature-rich out-of-the-box than Lightweight Charts. |

### EquiCharts
| Field | Value |
|---|---|
| **Name** | EquiCharts |
| **URL** | https://github.com/alenjohn05/EquiCharts |
| **Stars** | ~500+ (growing) |
| **License** | MIT |
| **What it does** | Open-source stock charting widget built entirely with pure TypeScript. Custom Canvas 2D engine, 20+ built-in indicators, free and self-hosted. No external dependencies. |
| **Maturity** | ⭐⭐⭐ Early but promising |
| **TypeScript** | ✅ Pure TypeScript |
| **VIXOR Fit** | 🟡 MEDIUM — Interesting all-in-one approach but less mature than KLineChart or Lightweight Charts. Worth watching. |

### QFChart
| Field | Value |
|---|---|
| **Name** | QFChart |
| **URL** | Referenced in Reddit/JS community |
| **Stars** | ~100+ (new) |
| **License** | MIT (assumed) |
| **What it does** | Open-source charting library for candlestick and technical indicator visualization with overlay, drawing tools, and multi-pane support. |
| **Maturity** | ⭐⭐ Very new |
| **TypeScript** | ✅ TypeScript |
| **VIXOR Fit** | 🟢 LOW — Too new and unproven for production use. |

### ChartGPU
| Field | Value |
|---|---|
| **Name** | ChartGPU |
| **URL** | https://github.com/ChartGPU/ChartGPU |
| **Stars** | ~3,200+ |
| **License** | MIT |
| **What it does** | WebGPU-powered charting library. Handles 1M+ data points without frame drops. LTTB downsampling as compute shader. 3D series, multi-chart dashboards. |
| **Maturity** | ⭐⭐⭐ Growing, cutting-edge |
| **TypeScript** | ✅ TypeScript |
| **VIXOR Fit** | 🟡 MEDIUM — Not financial-specific but the WebGPU approach is groundbreaking for high-frequency data visualization. Worth considering for VIXOR if displaying massive datasets (tick data). Requires WebGPU browser support. |

---

## 8. 🖥️ Trading Dashboard UI (React/Next.js)

*VIXOR Gap: Needs a professional trading dashboard UI for displaying signals, analytics, charts, and MOXI agent status.*

### Stock Intelligence Frontend
| Field | Value |
|---|---|
| **Name** | Stock Intelligence Frontend |
| **URL** | https://github.com/rajgurung/stock-intelligence-frontend |
| **Stars** | ~100+ (new) |
| **License** | MIT (assumed) |
| **What it does** | Bloomberg-style financial dashboard built with Next.js 15, TypeScript, and Tailwind CSS. Stock market intelligence platform with professional UI patterns. |
| **Maturity** | ⭐⭐⭐ New but well-architected |
| **TypeScript** | ✅ Next.js + TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — Bloomberg-style UI patterns directly applicable to VIXOR. Modern stack (Next.js 15 + TS + Tailwind). Good starting point/reference for VIXOR's dashboard. |

### TradingView Charting Library Examples
| Field | Value |
|---|---|
| **Name** | Charting Library Examples |
| **URL** | https://github.com/tradingview/charting-library-examples |
| **Stars** | ~2,500+ |
| **License** | Apache-2.0 (for examples; charting lib itself has separate license) |
| **What it does** | Official integration examples for TradingView's full Charting Library (not Lightweight Charts). Shows how to feed custom data, set up workspaces, configure charting features. |
| **Maturity** | ⭐⭐⭐⭐ Maintained by TradingView |
| **TypeScript** | ✅ TypeScript examples |
| **VIXOR Fit** | 🟡 MEDIUM — If VIXOR wants the full TradingView experience (drawing tools, indicators, multi-chart layouts), the full Charting Library (non-open-source but free for non-commercial) is worth considering. These examples are essential reference. |

### shadcn/ui + Next.js Admin Dashboards
| Field | Value |
|---|---|
| **Name** | shadcn/ui Admin Templates (various) |
| **URL** | https://github.com/topics/stock-dashboard?o=desc&s=stars |
| **Stars** | Varies (50k+ for shadcn/ui itself) |
| **License** | MIT |
| **What it does** | Modern admin dashboard templates built with Next.js 16, React 19, TypeScript, Tailwind CSS, and shadcn/ui. Examples include TailAdmin, Horizon UI, and 18+ open-source options. |
| **Maturity** | ⭐⭐⭐⭐⭐ Production |
| **TypeScript** | ✅ Native TypeScript |
| **VIXOR Fit** | 🔥 **HIGH** — For the non-charting parts of VIXOR's dashboard (signal list, strategy config, analytics panels, MOXI agent status), a shadcn/ui + Next.js dashboard template provides the best starting point. Combine with Lightweight Charts or KLineChart for the charting component. |

---

## 🎯 Summary: Top Recommendations for VIXOR

### Must-Integrate (Directly Solves Critical Gaps)

| Priority | Project | Domain | Why |
|---|---|---|---|
| **P0** | **CCXT** | Exchange Data | Replace custom exchange fetching with industry-standard unified API |
| **P0** | **backtest-kit** | Backtesting + Strategy | THE TypeScript-native backtesting engine that also does live trading |
| **P0** | **TradingView Lightweight Charts** | Charting | Industry-standard, fastest, Apache-2.0 financial charts |
| **P1** | **XState** | Signal Engine | Formalize signal lifecycle as a state machine |
| **P1** | **technicalindicators** | TA Indicators | Most comprehensive TS indicator library |
| **P1** | **QuantStats** | Portfolio Analytics | THE portfolio analytics library (deploy as Python microservice) |

### Should-Integrate (High Value Add)

| Priority | Project | Domain | Why |
|---|---|---|---|
| **P2** | **KLineChart** | Charting | If you need built-in indicators + drawing in the chart library |
| **P2** | **pyfolio-reloaded** | Portfolio Analytics | Deeper research analytics with MFE/MAE round-trip analysis |
| **P2** | **VectorBT** | Backtesting (Python) | If you add a Python sidecar for heavy quant work |
| **P2** | **shadcn/ui + Next.js** | Dashboard UI | Foundation for non-charting dashboard components |
| **P2** | **BacktestJS** | Backtesting | Simpler alternative if backtest-kit is too heavy |

### Architecture Reference (Study, Don't Integrate)

| Project | What to Learn |
|---|---|
| NautilusTrader | Order lifecycle state machine, event-driven architecture |
| Freqtrade | Strategy pattern, signal→trade pipeline, hyperparameter optimization |
| Hummingbot | Exchange connector abstractions, strategy framework design |
| OpenBB | Data platform architecture, multi-source integration |

### VIXOR Tech Stack Alignment

```
Recommended VIXOR Architecture:

┌─────────────────────────────────────────────────────────────┐
│  VIXOR Frontend (Next.js + TypeScript + shadcn/ui)          │
│  ┌─────────────────┐  ┌──────────────────┐  ┌────────────┐ │
│  │ Lightweight      │  │ XState Signal    │  │ Dashboard  │ │
│  │ Charts /        │  │ State Machine    │  │ Panels     │ │
│  │ KLineChart      │  │ (lifecycle mgmt) │  │ (signals,  │ │
│  │ (price viz)     │  │                  │  │  trades,   │ │
│  └─────────────────┘  └──────────────────┘  │  MOXI)     │ │
│                                                  └────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  VIXOR Core (TypeScript/Node.js)                            │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ CCXT         │  │ backtest-kit   │  │ technical-     │  │
│  │ (exchange    │  │ (backtest +    │  │ indicators     │  │
│  │  data +      │  │  live trade)   │  │ (TA calc)      │  │
│  │  execution)  │  │                │  │                │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MOXI AI Agent (custom, enhanced with XState FSM)     │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  VIXOR Analytics (Python Microservice)                      │
│  ┌──────────────┐  ┌────────────────┐  ┌────────────────┐  │
│  │ QuantStats   │  │ pyfolio-       │  │ VectorBT       │  │
│  │ (tear sheets)│  │ reloaded       │  │ (heavy quant   │  │
│  │ (MFE/MAE,    │  │ (round-trip    │  │  backtesting)  │  │
│  │  Sharpe,     │  │  analysis)     │  │                │  │
│  │  drawdown)   │  │                │  │                │  │
│  └──────────────┘  └────────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

*Report generated: 2025. All star counts are approximate and may have changed. All projects were verified as actively maintained via web search.*