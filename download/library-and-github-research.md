# Vixor Trading Terminal — Library & GitHub Research Report

> **Project Context**: Vixor is a crypto trading terminal built with TanStack Start + Supabase + Vercel. It tracks Solana memecoins, provides whale alerts, alpha signals, market pulse, predictions, yield farming, perpetuals, social sentiment analysis, and wallet management.
>
> **Date**: July 2025  
> **Task ID**: 3

---

## PART A: LIBRARY RESEARCH

---

### 1. Real-time Data & WebSockets

#### 1.1 CCXT (CryptoCurrency eXchange Trading Library)

- **npm**: `ccxt`
- **GitHub**: https://github.com/ccxt/ccxt (~35,000+ stars)
- **What it does**: Unified API to 100+ crypto exchanges. Supports REST and WebSocket for spot, futures, and options trading. Fetches tickers, order books, OHLCV, trades, and supports order placement.
- **Why useful for Vixor**: Single library to connect to Binance, Bybit, OKX, etc. for real-time price feeds and order book data. The WebSocket implementations give you tick-by-tick updates for the Market Pulse and Discover pages.
- **Alternatives**: `tardis-dev` (institutional-grade historical + real-time data, Python/JS), `ccxt` remains the gold standard for exchange coverage.

#### 1.2 Tardis.dev Client

- **npm**: `tardis-dev`
- **GitHub**: https://github.com/tardis-dev/tardis-node (~1,500+ stars)
- **What it does**: Provides tick-by-tick order book snapshots, trades, open interest, funding rates, options chains, and liquidations. Replay historical data or stream real-time consolidated feeds.
- **Why useful for Vixor**: If you need institutional-grade market data replay and real-time streaming for the terminal, this is the most granular data source available.
- **Alternatives**: `cryptofeed` (Python, ~1,800 stars — multi-exchange WS data feed handler), `alpaca-markets` SDK for US-regulated crypto data.

#### 1.3 Binance WebSocket API (Direct)

- **npm**: No package needed — use native `WebSocket` or `ws` package
- **What it does**: Free real-time trade streams, order book depth (partial & full), kline/candlestick streams, and 24h ticker streams for all Binance trading pairs.
- **Why useful for Vixor**: Already using Binance for SOL price. Can extend to get real-time SOL/USDT order book, trade streams, and kline data at zero cost. The `wss://stream.binance.com:9443/ws` endpoint is production-grade and free.
- **Alternatives**: Bybit WebSocket API (similar free data), OKX WebSocket.

#### 1.4 CoinGecko API v3 + WebSocket

- **npm**: `coingecko-api-v3`
- **What it does**: World's largest independent crypto data aggregator. Provides REST + WebSocket endpoints for prices, market data, trending coins, and more.
- **Why useful for Vixor**: Excellent for the Market Pulse page, token discovery, and enriching token metadata (market cap, volume, community data). WebSocket for live price updates.
- **Alternatives**: CoinMarketCap API (paid tiers), Mobula API (on-chain + market data).

#### 1.5 DexScreener API

- **REST**: `https://api.dexscreener.com` (already used in Vixor)
- **What it does**: Real-time DEX trading data across all chains — Solana pairs, new tokens, trending pairs, trade history, and liquidity data.
- **Why useful for Vixor**: Already integrated. Can be extended with WebSocket-like polling for real-time memecoin tracking on Solana DEXes.
- **Alternatives**: GeckoTerminal API (free, open — live DEX data across 1,500+ DEXes), Birdeye API (comprehensive Solana multi-market data).

#### 1.6 GeckoTerminal API

- **REST**: `https://api.geckoterminal.com/api/v2`
- **What it does**: Free, public API for real-time crypto prices, OHLCV, trading volumes, transactions, and liquidity across 1,500+ DEXes and 200+ chains.
- **Why useful for Vixor**: Great as a secondary/primary source for DEX data. Provides OHLCV data for charting, and real-time token prices for the Discover page.
- **Alternatives**: DexScreener API, Birdeye API, Bitquery (GraphQL-based).

#### 1.7 Birdeye API

- **REST**: `https://public-api.birdeye.so`
- **What it does**: Comprehensive multi-market data for crypto tokens — DEX + CEX prices, historical data, wallet analytics, trader tracking, and launchpad data.
- **Why useful for Vixor**: Best-in-class Solana analytics data. Provides token prices, trade data, whale tracking, and market overview data. Useful for the whale alerts and market pulse features.
- **Alternatives**: DexScreener, GeckoTerminal, SolanaFM.

#### 1.8 Socket.IO (for custom WebSocket infrastructure)

- **npm**: `socket.io` + `socket.io-client`
- **GitHub**: https://github.com/socketio/socket.io (~62,000+ stars)
- **What it does**: Bidirectional, event-based real-time communication. Handles reconnection, rooms, namespaces, and works across all platforms.
- **Why useful for Vixor**: If you need to push real-time data from a server to all connected terminal clients (e.g., live whale alerts, price updates), Socket.IO provides the infrastructure. Pairs well with Supabase for broadcasting.
- **Alternatives**: Native `WebSocket`, `ws` (Node.js), Supabase Realtime (already in stack).

---

### 2. Charting & Visualization

#### 2.1 TradingView Lightweight Charts ⭐ TOP PICK

- **npm**: `lightweight-charts`
- **GitHub**: https://github.com/tradingview/lightweight-charts (~10,000+ stars)
- **What it does**: The smallest and fastest financial HTML5 charting library (45KB). Supports candlestick, line, area, bar, histogram charts. Handles millions of data points. Supports real-time updates, crosshair, time scale, and price scale.
- **Why useful for Vixor**: The **definitive choice** for the main trading chart. Already an industry standard. Free, open-source, and feature-rich. Perfect for the token detail view with candlestick charts + volume. The React wrapper `@tradingview-tools/lightweight-charts-react` is available.
- **Alternatives**: KLineChart (more features, see below), react-stockcharts.

#### 2.2 KLineChart

- **npm**: `klinechart`
- **GitHub**: https://github.com/klinecharts/KLineChart (~4,500+ stars)
- **What it does**: Lightweight k-line (candlestick) chart library. Zero dependencies, 40KB gzipped. Supports technical indicators, drawing tools, custom overlays, real-time data, and mobile.
- **Why useful for Vixor**: More feature-rich than Lightweight Charts for technical analysis — includes built-in MA, EMA, MACD, RSI, BOLL, VOL indicators out of the box. Good for the "alpha signals" and "predictions" pages where users want to see technical overlays.
- **Alternatives**: TradingView Lightweight Charts (simpler, faster), react-stockcharts (React-native, more customizable).

#### 2.3 Kline-Orderbook-Chart

- **npm**: `kline-orderbook-chart`
- **GitHub**: https://github.com/PhamNhinh/kline-orderbook-chart
- **What it does**: The **only chart library** with built-in orderbook heatmap, footprint chart, and liquidation heatmap rendered alongside candlesticks at 60fps. Native high-performance engine.
- **Why useful for Vixor**: Unique value for a trading terminal — shows order book depth as a heatmap layer behind candlesticks. This is a "wow factor" feature for a professional terminal.
- **Alternatives**: SciChart.js (commercial, has orderbook heatmap demo), LightningChart JS Trader (commercial).

#### 2.4 react-stockcharts

- **npm**: `react-stockcharts`
- **GitHub**: https://github.com/rrag/react-stockcharts (~4,200+ stars)
- **What it does**: Highly customizable stock charts built with React and d3. Supports candlestick, area, bar, line, MACD, RSI, stochastic, Bollinger Bands, moving averages, volume by price, and more.
- **Why useful for Vixor**: React-native implementation — integrates natively with the TanStack Start React setup. Rich set of technical indicators. Good for the Market Pulse and Predictions pages.
- **Alternatives**: React Financial Charts (successor project), Lightweight Charts.

#### 2.5 SciChart.js

- **npm**: `scichart`
- **GitHub**: https://github.com/ABTSoftware/scichart-js
- **What it does**: The highest-performance JavaScript charting library — uses WebGL for rendering. Supports orderbook heatmaps, real-time ticking stock charts, 10M+ data points. Has a React wrapper.
- **Why useful for Vixor**: If you need **maximum performance** for real-time order book visualization or depth charts, SciChart.js is the most powerful option. The orderbook heatmap demo is production-quality.
- **Note**: Commercial license (free for open-source / small teams). Worth evaluating if performance becomes a bottleneck.
- **Alternatives**: LightningChart JS Trader (commercial), kline-orderbook-chart (free).

#### 2.6 LightningChart JS Trader

- **npm**: `@arction/lcjs`
- **What it does**: The most comprehensive JS charting library for financial applications. Supports Candlestick, Bar, Line, Mountain, Kagi, Renko, Point & Figure, Heikin-Ashi, and advanced order book visualization.
- **Why useful for Vixor**: Enterprise-grade charting for professional trading terminals. If Vixor wants to compete with professional terminals, this provides the most complete feature set.
- **Note**: Commercial license.
- **Alternatives**: SciChart.js, TradingView Lightweight Charts (free).

#### 2.7 ApexCharts

- **npm**: `apexcharts` + `react-apexcharts`
- **GitHub**: https://github.com/apexcharts/apexcharts (~14,500+ stars)
- **What it does**: Modern, interactive charting library with 50+ chart types. Beautiful out-of-the-box themes, animations, and responsive design.
- **Why useful for Vixor**: Perfect for the non-candlestick visualizations — yield farming APY comparisons, social sentiment gauges, market pulse radar charts, wallet distribution pie charts. Complements the candlestick charting libraries.
- **Alternatives**: Recharts (~24,000 stars, simpler), Chart.js (~66,000 stars, most popular), Nivo (React-native charts).

---

### 3. Solana / Web3

#### 3.1 Solana web3.js v2 (Official SDK)

- **npm**: `@solana/web3.js`
- **GitHub**: https://github.com/anza-xyz/kit (v2.0 RC) — original `@solana/web3.js` has ~6,000+ stars
- **What it does**: Official JavaScript/TypeScript SDK for Solana. Send transactions, read accounts, subscribe to account changes, query blocks, and interact with on-chain programs.
- **Why useful for Vixor**: Core library for all Solana interactions — connecting wallets, reading token balances, subscribing to on-chain events, and building transactions. Version 2.0 is a major improvement with better TypeScript support.
- **Alternatives**: `@solana/kit` (new official SDK, 2.0 RC), `@coral-xyz/anchor` (for Anchor programs).

#### 3.2 @solana/spl-token

- **npm**: `@solana/spl-token`
- **GitHub**: https://github.com/solana-labs/solana-program-library (~3,500+ stars)
- **What it does**: TypeScript library for interacting with SPL Token and Token-2022 programs. Create, mint, transfer, burn tokens, and manage token accounts.
- **Why useful for Vixor**: Essential for wallet management features — reading token balances, creating associated token accounts, and understanding token holdings for whale tracking.
- **Alternatives**: `@metaplex-foundation/mpl-toolbox` (Metaplex utilities, higher-level).

#### 3.3 Metaplex Umi Framework

- **npm**: `@metaplex-foundation/umi` + various plugins
- **GitHub**: https://github.com/metaplex-foundation/umi (~400+ stars, but Metaplex org has ~4,500+ total)
- **What it does**: Modular JavaScript framework for building Solana apps. Provides plugins for token metadata, candy machine, NFTs, and token operations. Uses a clean, extensible architecture.
- **Why useful for Vixor**: Fetch token metadata (name, symbol, image, social links) for memecoins discovered via DexScreener. Essential for the Discover page to show token logos, descriptions, and links.
- **Alternatives**: `@metaplex-foundation/mpl-token-metadata` (standalone metadata library).

#### 3.4 Jupiter API + SDK

- **npm**: `@jup-ag/core`, `@jup-ag/api`
- **GitHub**: https://github.com/jup-ag (~4,500+ stars across repos)
- **What it does**: Solana's premier DEX aggregator. The Swap API finds the best price route across all major Solana DEXes (Raydium, Orca, Meteora, etc.). Price API for quotes, Limit Order API, DCA API.
- **Why useful for Vixor**: **Critical for the trading feature.** Use the Price API to show best swap prices. Use the Swap API for one-click token swapping. Use the Quote API for the "predictions" page to show real-time pricing. The Jupiter Terminal can be embedded as an iframe for instant swap UI.
- **Alternatives**: Direct Raydium SDK, Orca SDK, Meteora SDK (but Jupiter routes to all of them).

#### 3.5 Helius SDK

- **npm**: `helius-sdk` / `@helius-labs/helius-rpc-wasm`
- **Website**: https://www.helius.dev
- **What it does**: Solana-native RPC provider with enhanced APIs — NFT metadata, SPL token APIs, account history, webhooks for transaction monitoring, gRPC streaming, and DAS (Digital Asset Standard) for compressed NFTs.
- **Why useful for Vixor**: Helius webhooks are perfect for whale alerts — subscribe to specific wallet addresses and get notified when they transact. The enhanced APIs provide richer data than standard RPC. The gRPC streaming gives real-time block data.
- **Alternatives**: Shyft (gRPC + RabbitStream), QuickNode (multi-chain), Chainstack, Alchemy, Triton.

#### 3.6 Shyft

- **Website**: https://shyft.to
- **What it does**: Solana gRPC streaming, RabbitStream shred streaming, staked RPCs across 7 global regions. Multi-node failover, slot replay. Designed specifically for Solana traders.
- **Why useful for Vixor**: If you need ultra-low-latency Solana data streaming (for real-time whale tracking, mempool monitoring), Shyft's gRPC streaming is the fastest option. RabbitStream for slot-level data.
- **Alternatives**: Helius (more developer tools), Triton One (enterprise RPC).

#### 3.7 Anchor

- **npm**: `@coral-xyz/anchor`
- **GitHub**: https://github.com/coral-xyz/anchor (~4,000+ stars)
- **What it does**: Solana program framework for writing secure, maintainable on-chain programs. Also provides an IDL client for interacting with Anchor programs from JS/TS.
- **Why useful for Vixor**: If Vixor ever deploys its own Solana program (e.g., for automated trading vaults, social sentiment contracts), Anchor is the framework to use. Also useful for interacting with existing Anchor programs.
- **Alternatives**: Native Solana programs (Rust without framework).

---

### 4. AI / ML for Trading

#### 4.1 Transformers.js

- **npm**: `@huggingface/transformers`
- **GitHub**: https://github.com/huggingface/transformers.js (~10,000+ stars)
- **What it does**: Run Hugging Face models directly in the browser or Node.js using ONNX Runtime. Supports sentiment analysis, text classification, NER, text generation, and more — all client-side.
- **Why useful for Vixor**: **Game-changer for social sentiment analysis.** Run a sentiment analysis model (e.g., FinBERT) directly in the browser on Twitter/X data, Reddit posts, or Telegram messages — no API costs, no server needed. Perfect for the "Social Sentiment" feature.
- **Alternatives**: TensorFlow.js (more general ML, heavier), ONNX Runtime Web (lower-level).

#### 4.2 trading-signals

- **npm**: `trading-signals`
- **GitHub**: https://github.com/nicemon-nicemon/trading-signals (check npm for latest)
- **What it does**: TypeScript implementation of common technical indicators — SMA, EMA, WMA, DEMA, TEMA, RSI, MACD, Bollinger Bands, ATR, ADX, and more. Designed for algorithmic trading.
- **Why useful for Vixor**: Generate alpha signals programmatically. Compute RSI, MACD, Bollinger Band breakouts on Solana token price data. Feed into the "Alpha Signals" and "Predictions" pages. Pure TypeScript — integrates directly into the TanStack Start codebase.
- **Alternatives**: `tulind-node` (wraps Tulip C library, faster), `technicalindicators` (~1,200 npm stars, similar).

#### 4.3 TensorFlow.js

- **npm**: `@tensorflow/tfjs`
- **GitHub**: https://github.com/tensorflow/tfjs (~19,000+ stars)
- **What it does**: ML framework for JavaScript — run models in the browser or Node.js. Build and train custom models, or use pre-trained ones.
- **Why useful for Vixor**: If you want to build custom prediction models (e.g., predict memecoin price movements based on on-chain metrics), TensorFlow.js lets you train and run models. Could power the "Predictions" page with LSTM or transformer-based price forecasting.
- **Alternatives**: Transformers.js (better for NLP/sentiment), ONNX Runtime Web (for inference only).

#### 4.4 ONNX Runtime Web

- **npm**: `onnxruntime-web`
- **GitHub**: https://github.com/microsoft/onnxruntime (~19,000+ stars)
- **What it does**: High-performance ML inference engine. Run ONNX models in the browser via WebAssembly or WebGPU. Extremely fast for inference.
- **Why useful for Vixor**: If you train a price prediction or sentiment model in Python (PyTorch/TensorFlow), convert to ONNX, and run it in the browser for real-time predictions. The fastest way to do client-side ML inference.
- **Alternatives**: Transformers.js (higher-level, wraps ONNX Runtime), TensorFlow.js.

#### 4.5 Neural Trader (MCP)

- **npm**: `neural-trader`
- **Website**: https://neural-trader.ruv.io
- **What it does**: Self-learning AI trading platform with 58+ MCP tools. Multi-source news aggregation with AI sentiment analysis, real-time prediction market trading, GPU-accelerated analysis.
- **Why useful for Vixor**: Could be integrated as a backend service for the "AI Predictions" feature. The sentiment analysis and multi-source news aggregation align perfectly with Vixor's social sentiment analysis needs.
- **Alternatives**: Build custom with OpenAI API + custom prompts.

#### 4.6 Natural (NLP for Node.js)

- **npm**: `natural`
- **GitHub**: https://github.com/NaturalNode/natural (~13,000+ stars)
- **What it does**: NLP toolkit for Node.js — tokenization, stemming, classification, sentiment analysis, wordnet, phonetics, and more.
- **Why useful for Vixor**: Server-side NLP processing for social media data (Twitter, Telegram, Discord). Classify crypto-related messages as bullish/bearish. Faster than running a transformer model for simple keyword-based sentiment.
- **Alternatives**: `compromise` (lighter NLP), `sentiment` (~9,500 stars, simple AFINN-based sentiment).

---

### 5. State Management & Data Fetching

#### 5.1 TanStack Query (React Query) ⭐ ALREADY IN STACK

- **npm**: `@tanstack/react-query`
- **GitHub**: https://github.com/TanStack/query (~42,000+ stars)
- **What it does**: Server state management — fetching, caching, synchronizing, and updating server state. Handles loading/error states, automatic refetching, optimistic updates, pagination, and infinite scrolling.
- **Why useful for Vixor**: **Already perfectly suited.** Use for all API data fetching — token prices, whale alerts, sentiment data. The `refetchInterval` option enables polling-based "real-time" updates. The cache prevents redundant API calls. Pausing queries when tab is inactive saves resources.
- **Pro tip**: Combine with WebSocket connections via `useQuery`'s `initialData` + WebSocket `onmessage` to update cache in real-time.

#### 5.2 Zustand

- **npm**: `zustand`
- **GitHub**: https://github.com/pmndrs/zustand (~50,000+ stars)
- **What it does**: Lightweight state management (~1KB). Simple, scalable state with hooks API. Supports middleware (persist, devtools, immer). No providers needed.
- **Why useful for Vixor**: Perfect for **client state** that doesn't come from the server — UI state (active tab, theme, sidebar), WebSocket connection status, user preferences (watchlist, alert thresholds), and derived state. The `subscribe` API is excellent for reacting to real-time WebSocket data changes.
- **Alternatives**: Jotai (atomic state), Valtio (proxy-based), Redux Toolkit (heavier, more boilerplate).

#### 5.3 TanStack Start (Router) ⭐ ALREADY IN STACK

- **npm**: `@tanstack/react-start`
- **What it does**: Full-stack React framework with file-based routing, SSR, data loading, and server functions. The foundation of Vixor.
- **Why useful for Vixor**: Already in use. The server functions (`createServerFn`) are where you'll put data-fetching logic for APIs. The streaming SSR is great for initial page loads with live data.

#### 5.4 SWR

- **npm**: `swr`
- **GitHub**: https://github.com/vercel/swr (~30,000+ stars)
- **What it does**: React Hooks for data fetching by Vercel. Similar to TanStack Query but simpler API.
- **Why useful for Vixor**: An alternative to TanStack Query if you want a lighter API. The `useSWRSubscription` hook is excellent for real-time WebSocket data — it subscribes to a data source and re-renders on each update.
- **Alternatives**: TanStack Query (more feature-rich, already in stack).

#### 5.5 Supabase Realtime ⭐ ALREADY IN STACK

- **npm**: `@supabase/supabase-js`
- **What it does**: Real-time subscriptions to database changes via WebSocket. When a row in Supabase changes, all subscribed clients get notified instantly.
- **Why useful for Vixor**: Push real-time whale alerts, price alerts, and social sentiment updates to all connected clients. Store alert configurations in Supabase, and when a trigger fires, the Realtime channel broadcasts to all users.
- **Alternatives**: Pusher (paid), Ably (paid), Socket.IO (self-hosted).

---

### 6. UI / UX Libraries

#### 6.1 AG Grid

- **npm**: `ag-grid-react`
- **GitHub**: https://github.com/ag-grid/ag-grid (~13,000+ stars)
- **What it does**: Enterprise-grade React data grid. 1M+ rows, virtual scrolling, Excel-like filtering, sorting, pivoting, cell editing, custom cell renderers, row grouping. Built-in dark theme.
- **Why useful for Vixor**: The **definitive choice** for the token watchlist, whale transactions list, and any tabular data display. The virtual scrolling handles 100K+ rows without lag. The dark theme matches the terminal aesthetic.
- **Note**: Community edition is free and feature-rich. Enterprise features (pivot, row grouping) require license.
- **Alternatives**: TanStack Table (free, headless — need to style yourself), Handsontable (commercial), Tremor (Tailwind-based).

#### 6.2 TanStack Table

- **npm**: `@tanstack/react-table`
- **GitHub**: https://github.com/TanStack/table (~25,000+ stars)
- **What it does**: Headless UI for building tables. Gives you full control over styling while handling sorting, filtering, pagination, grouping, and virtualization.
- **Why useful for Vixor**: If you want full control over the table styling (to match the terminal aesthetic), TanStack Table provides the logic while you provide the CSS/Tailwind. Pairs perfectly with Tailwind CSS already in the stack.
- **Alternatives**: AG Grid (more features, heavier), Tremor (simpler, opinionated).

#### 6.3 Tremor

- **npm**: `@tremor/react`
- **GitHub**: https://github.com/tremorlabs/tremor (~19,000+ stars)
- **What it does**: React components built on top of Tailwind CSS. Provides KPI cards, charts, tables, select dropdowns, and more — all with a dark mode that looks like a dashboard.
- **Why useful for Vixor**: Quick-to-deploy dashboard components for the Market Pulse page — metric cards, bar charts, area charts, and callout components. The dark theme matches terminal aesthetics out of the box.
- **Alternatives**: shadcn/ui (more primitive, already likely in stack), MUI (Material Design, doesn't match terminal aesthetic).

#### 6.4 shadcn/ui ⭐ LIKELY ALREADY IN STACK

- **npm**: `@radix-ui/react-*` (primitives) + shadcn CLI
- **GitHub**: https://github.com/shadcn-ui/ui (~81,000+ stars)
- **What it does**: Collection of beautifully designed, accessible React components built on Radix UI primitives + Tailwind CSS. Copy-paste, not a dependency.
- **Why useful for Vixor**: If not already installed, it should be. Provides the building blocks — Dialog, Dropdown, Command (⌘K), Toast, Sheet, Tabs, and more. The `Command` component is perfect for a terminal-style search/commands palette.
- **Alternatives**: Radix UI (lower-level), Mantine (full component library).

#### 6.5 xterm.js

- **npm**: `@xterm/xterm` + `@xterm/addon-fit`
- **GitHub**: https://github.com/xtermjs/xterm.js (~17,000+ stars)
- **What it does**: Full-featured terminal emulator component for the web. Supports ANSI escape codes, themes, addons (fit, web-links, search, unicode11, serialize).
- **Why useful for Vixor**: If Vixor wants a literal "terminal" feel — a command-line interface where users can type commands like `/alert SOL >200`, `/track whale 0x...`, `/predict BONK` — xterm.js provides that authentic terminal experience.
- **Alternatives**: Terminal Kit (Node.js only), Guacamole (remote desktop).

#### 6.6 React-Window / React-Virtuoso

- **npm**: `react-virtuoso` or `react-window`
- **GitHub**: https://github.com/petyosi/react-virtuoso (~4,000+ stars) / https://github.com/bvaughn/react-window (~17,000+ stars)
- **What it does**: Virtualized lists — render only visible items for massive performance gains with long lists.
- **Why useful for Vixor**: Essential for the whale alerts feed, trade history, and token lists. When you have 10,000+ items, virtualization prevents the browser from rendering all DOM nodes. `react-virtuoso` is simpler (auto-sizes rows), `react-window` is more mature.

---

### 7. Notification Systems

#### 7.1 Novu

- **npm**: `@novu/node` + `@novu/react`
- **GitHub**: https://github.com/novuhq/novu (~36,000+ stars)
- **What it does**: Open-source notification infrastructure. Unified API for multi-channel notifications — In-App, Push (FCM/APNS), Email, SMS, Chat (Slack, Discord, Telegram). Workflow builder, templates, and digest/batch support.
- **Why useful for Vixor**: **The complete solution for Vixor's notification needs.** Set up a whale alert workflow: trigger → Novu routes to Telegram bot, push notification, and in-app notification simultaneously. The digest feature prevents spam when multiple alerts fire at once.
- **Alternatives**: Build custom with web-push + grammY.

#### 7.2 grammY (Telegram Bot Framework)

- **npm**: `grammy`
- **GitHub**: https://github.com/grammyjs/grammy (~3,000+ stars)
- **What it does**: Modern, ergonomic Telegram Bot framework for Node.js. Supports scenes, sessions, middleware, conversations, and plugins.
- **Why useful for Vixor**: Build a Telegram bot for whale alerts, price alerts, and trade notifications. grammY is the most modern and TypeScript-friendly Telegram framework. Supports inline keyboards (for interactive alerts — "View Token", "Dismiss"), and conversation flows.
- **Alternatives**: Telegraf (~7,500 stars, older but proven), node-telegram-bot-api (~8,500 stars, callback-style).

#### 7.3 Telegraf

- **npm**: `telegraf`
- **GitHub**: https://github.com/telegraf/telegraf (~7,500+ stars)
- **What it does**: The most popular Telegram Bot framework for Node.js. Mature, battle-tested, huge ecosystem of plugins and examples.
- **Why useful for Vixor**: More established than grammY, with more community examples for crypto bots. Heavier API but extremely well-documented.
- **Alternatives**: grammY (more modern, better TypeScript).

#### 7.4 Web Push (Browser Push Notifications)

- **npm**: `web-push`
- **GitHub**: https://github.com/web-push-libs/web-push (~4,500+ stars)
- **What it does**: Send push notifications to browsers (Chrome, Firefox, Edge, Safari) using the Web Push Protocol and VAPID keys. No third-party service required.
- **Why useful for Vixor**: Send browser push notifications when whale alerts trigger, or when a watched token hits a price target. Users can enable/disable from the terminal UI. Free — no FCM/APNS service needed.
- **Alternatives**: OneSignal (managed service), Pusher Beams (managed).

#### 7.5 Sonner (Toast Notifications)

- **npm**: `sonner`
- **GitHub**: https://github.com/emilkowalski/sonner (~12,000+ stars)
- **What it does**: Beautiful, accessible toast notification library for React. Supports promises, auto-dismiss, stacking, custom styling, and actions.
- **Why useful for Vixor**: In-app notifications — "Whale alert: 500 SOL moved to DEX", "Token BONK up 25% in 1h". Sonner is the most beautiful and modern toast library, and matches Tailwind's aesthetic perfectly.
- **Alternatives**: react-hot-toast (~9,500 stars), shadcn/ui Toast component.

---

### 8. Backtesting & Strategy

#### 8.1 BacktestJS Framework

- **npm**: Check GitHub
- **GitHub**: https://github.com/backtestjs/framework
- **What it does**: Comprehensive JavaScript framework to fetch candle data, backtest any trading strategy, and compare results. Designed for crypto and stock strategies.
- **Why useful for Vixor**: If Vixor wants to add a "Backtest" feature where users can test alpha signals against historical data, this provides the core engine. Users could validate their strategies before deploying real alerts.
- **Alternatives**: Build custom (not hard with trading-signals + historical data), freqtrade (Python, not JS).

#### 8.2 TradingAgents (Python, reference architecture)

- **GitHub**: https://github.com/tauricresearch/tradingagents (~5,000+ stars)
- **What it does**: Multi-agent LLM financial trading framework. Deploys specialized agents — fundamental analysts, sentiment experts, technical analysts, traders, risk management.
- **Why useful for Vixor**: **Architecture reference.** The multi-agent pattern is directly applicable to Vixor's "AI Predictions" feature. Even though it's Python, the architecture (separate agents for technical, sentiment, fundamental analysis feeding into a unified prediction) is exactly what Vixor needs.
- **Alternatives**: AI-Trader (HKUDS), FinRobot.

#### 8.3 Backtesting.py (Python, reference)

- **GitHub**: https://github.com/kernc/backtesting.py (~9,000+ stars)
- **What it does**: Fast Python framework for backtesting trading strategies on historical candlestick data. Simple API — define a strategy class with `init()` and `next()` methods.
- **Why useful for Vixor**: Reference for how to structure a backtesting engine. Even if implemented in TypeScript, the design pattern (Strategy pattern, broker simulation, performance metrics) is worth studying.
- **Alternatives**: VectorBT (vectorized backtesting), Zipline (quant finance).

#### 8.4 Freqtrade (Python, reference)

- **GitHub**: https://github.com/freqtrade/freqtrade (~39,900+ stars)
- **What it does**: Free, open-source crypto trading bot in Python. Supports all major exchanges, ML strategy optimization, backtesting, Telegram/web UI control, and strategy marketplace.
- **Why useful for Vixor**: **The gold standard reference for a trading platform.** Study its architecture: strategy definition, backtesting engine, real-time execution, and Telegram integration. The UI (Frequi, built in Vue) is also worth studying for trading dashboard patterns.
- **Alternatives**: Hummingbot (market-making focused), OctoBot.

---

## PART B: GITHUB PROJECT RESEARCH

---

### 1. Open-Source Trading Terminals & Dashboards

#### 1.1 Freqtrade + Frequi

- **URL**: https://github.com/freqtrade/freqtrade
- **Stars**: ~39,900+
- **Tech Stack**: Python (backend), Vue.js (Frequi frontend), SQLite, Telegram Bot API, Matplotlib
- **Key Features to Learn From**:
  - Strategy definition pattern (user-defined classes with `populate_indicators`, `populate_entry_trend`, `populate_exit_trend`)
  - Backtesting engine with configurable timeframes, stake amounts, and stop-loss/take-profit
  - Real-time Telegram bot for trade management and alerts
  - Web UI (Frequi) with profit/loss charts, trade history, and open trades
  - FreqAI — ML strategy optimization module using scikit-learn, XGBoost, etc.
- **What Makes It Stand Out**: The most complete open-source trading bot ecosystem. The separation of strategy logic from execution, combined with a polished UI, is the benchmark.

#### 1.2 Hummingbot

- **URL**: https://github.com/hummingbot/hummingbot
- **Stars**: ~8,500+
- **Tech Stack**: Python, TypeScript (dashboard), Docker, WebSockets
- **Key Features to Learn From**:
  - Market-making strategies (pure market making, cross-exchange, arbitrage)
  - Multi-exchange support (both CEX and DEX) via CCXT
  - Visual dashboard for strategy configuration and monitoring
  - Backtesting and paper trading modes
  - Strategy builder and marketplace
- **What Makes It Stand Out**: Focus on market-making and arbitrage — strategies that are directly applicable to Solana DEX trading. The DEX support (Uniswap, PancakeSwap) is relevant for Solana equivalents.

#### 1.3 React Crypto Exchange Template

- **URL**: https://github.com/cenksari/react-crypto-exchange
- **Stars**: ~500+
- **Tech Stack**: React, TypeScript, CSS Modules
- **Key Features to Learn From**:
  - Exchange-style UI layout (order book, trades, chart, order form)
  - Buy/sell form with market/limit order types
  - Real-time price display and portfolio tracking
  - Responsive design patterns for trading interfaces
- **What Makes It Stand Out**: A clean, modern exchange UI template. Good reference for layout patterns — the typical 4-panel trading layout (chart + order book + trades + order form).

---

### 2. Solana DEX Interfaces

#### 2.1 Raze.bot (Solana Multi-Wallet Trading Platform)

- **URL**: https://github.com/razedotbot/solana-ui
- **Stars**: ~200+ (growing)
- **Tech Stack**: React, TypeScript, Solana web3.js, Tailwind CSS
- **Key Features to Learn From**:
  - Multi-wallet connection and management
  - Token swapping interface
  - Portfolio tracking across wallets
  - Solana-specific trading flows (token selection, slippage settings, priority fees)
- **What Makes It Stand Out**: Directly relevant to Vixor's use case — a Solana-focused trading UI. The multi-wallet approach is great for power users who manage multiple wallets.

#### 2.2 Jupiter Terminal

- **URL**: https://github.com/jup-ag (multiple repos)
- **Stars**: ~4,500+ (org total)
- **Tech Stack**: React, TypeScript, @solana/web3.js, Next.js
- **Key Features to Learn From**:
  - End-to-end swap flow in a single embeddable component
  - Token search with fuzzy matching
  - Route visualization (showing which DEXes the swap routes through)
  - Slippage tolerance, priority fee configuration
  - Best price discovery across all Solana DEXes
- **What Makes It Stand Out**: Can be embedded directly into Vixor as an iframe. The route visualization is a unique feature that shows users exactly where their trade goes. The API design (Price → Quote → Swap) is a great pattern to follow.

#### 2.3 Pump.fun Clone Smart Contract

- **URL**: https://github.com/Benjamin-cup/Solana-Pumpfun-Smart-Contract
- **Stars**: ~100+
- **Tech Stack**: Rust (Solana program), Anchor
- **Key Features to Learn From**:
  - Bonding curve mechanism implementation
  - Token creation and fair launch mechanics
  - Migration from bonding curve to Raydium AMM
  - Fee calculation and distribution
- **What Makes It Stand Out**: Understanding the bonding curve mechanics is essential for Vixor's memecoin tracking. Knowing when a token is still on the bonding curve vs. migrated to Raydium is critical for alpha signals.

#### 2.4 Pumpfun/Bonkfun Trading Bot

- **URL**: https://github.com/chainstacklabs/pumpfun-bonkfun-bot
- **Stars**: ~300+
- **Tech Stack**: Python, Solana web3.py, WebSocket subscriptions
- **Key Features to Learn From**:
  - Automated sniping on new token launches
  - No reliance on third-party APIs (direct on-chain monitoring)
  - Sell strategy implementation (taking profit, stop-loss)
  - Real-time transaction monitoring via WebSocket
- **What Makes It Stand Out**: Shows how to monitor pump.fun tokens at the blockchain level — useful for Vixor's alpha signals feature to detect new token launches early.

---

### 3. Whale Tracking / On-Chain Analytics

#### 3.1 Solana Whale Tracker (Telegram Bot)

- **URL**: https://github.com/rickscode/Solana-Whale-Tracker
- **Stars**: ~50+
- **Tech Stack**: Python, aiogram (Telegram), solana/solders, WebSocket
- **Key Features to Learn From**:
  - Real-time Telegram notifications for large transactions
  - Configurable whale threshold (e.g., alert on >100 SOL transfers)
  - Wallet monitoring and balance tracking
  - Transaction parsing and formatting
- **What Makes It Stand Out**: Reference implementation for Vixor's whale alert system. The pattern — monitor transactions via WebSocket → filter by size → send Telegram notification — is exactly what Vixor needs.

#### 3.2 Web3 Whale Tracker Dashboard

- **URL**: (found via GitHub Topics — `whale-tracker`)
- **Stars**: Varies
- **Tech Stack**: Next.js, TypeScript, Tailwind CSS, Ethers.js/Solana web3.js
- **Key Features to Learn From**:
  - Dashboard monitoring large wallet activity
  - Major on-chain transaction surfacing
  - Wallet labeling and categorization
  - Historical whale activity visualization
- **What Makes It Stand Out**: The dashboard pattern — showing whale transactions in a live feed, categorizing them (exchange deposit/withdrawal, DEX trade, NFT purchase), and visualizing trends.

#### 3.3 Crypto-Whale-Tracker

- **URL**: (found via GitHub Topics — `whale-tracking-source`)
- **Tech Stack**: JavaScript/TypeScript, WebSocket, React
- **Key Features to Learn From**:
  - Real-time monitor for high-value transactions
  - Wallet balance tracking
  - Smart Money Tracker component
  - Whale Alert System with configurable thresholds
- **What Makes It Stand Out**: The "Smart Money Tracker" concept — tracking known profitable wallets and alerting when they make moves. This is directly applicable to Vixor's alpha signals.

---

### 4. DeFi Yield Aggregators / Dashboards

#### 4.1 DeFiLlama (Source Code)

- **URL**: https://github.com/DefiLlama (org with 46+ repos)
- **Stars**: ~10,000+ (main site repo)
- **Tech Stack**: Next.js, TypeScript, React, GraphQL
- **Key Features to Learn From**:
  - TVL (Total Value Locked) tracking across 350+ chains
  - Yield farming data — APY/APR across all protocols
  - Protocol comparison and sorting
  - Historical TVL charts and yield curves
  - Free, open API with no rate limits
- **What Makes It Stand Out**: **The definitive DeFi data source.** Use the DeFiLlama API directly to power Vixor's yield farming page — no need to build your own yield tracking. The API provides TVL, yields, fees, revenue, and stablecoin data for free.
- **Key repos**: `DefiLlama/defillama` (frontend), `DefiLlama/DefiLlama-Adapters` (protocol adapters), `DefiLlama/python-sdk` (Python SDK).

#### 4.2 Awesome DeFi (Curated List)

- **URL**: https://github.com/ong/awesome-decentralized-finance
- **Stars**: ~15,000+
- **Key Features to Learn From**:
  - Comprehensive list of DeFi protocols, tools, and resources
  - Category organization (lending, DEXes, yield, derivatives, insurance)
  - Points to DeFiLlama, Dune Analytics, and other data sources
- **What Makes It Stand Out**: A goldmine for discovering DeFi protocols to track in Vixor's yield farming page. Use it to build a comprehensive protocol database.

---

### 5. Social Sentiment Analysis for Crypto

#### 5.1 TradingAgents (Multi-Agent LLM Trading)

- **URL**: https://github.com/tauricresearch/tradingagents
- **Stars**: ~5,000+
- **Tech Stack**: Python, LangChain, OpenAI/LLM APIs, Financial data APIs
- **Key Features to Learn From**:
  - **Multi-agent architecture**: Separate agents for fundamental analysis, sentiment analysis, technical analysis, trading decisions, and risk management
  - Sentiment expert agent that processes news, social media, and market commentary
  - Portfolio management with risk controls
  - Research report generation (equity research style)
- **What Makes It Stand Out**: The multi-agent pattern is the most sophisticated approach to AI-powered trading. Vixor could implement a simplified version: Technical Agent (trading-signals) + Sentiment Agent (Transformers.js) + Alpha Agent (combines both).

#### 5.2 AI-Trading-Assistant

- **URL**: https://github.com/11daksh11/AI-Trading-Assistant
- **Stars**: ~200+
- **Tech Stack**: Python, TensorFlow, Twitter API, yfinance, Streamlit
- **Key Features to Learn From**:
  - Combines technical analysis indicators with sentiment analysis
  - Machine learning model for price prediction
  - Real-time dashboard with Streamlit
  - News sentiment scoring for financial news
- **What Makes It Stand Out**: Shows how to combine technical indicators with social sentiment for a unified prediction. The architecture (fetch data → compute indicators → run sentiment → combine → predict) is directly applicable to Vixor.

#### 5.3 FinRobot (AI Agent Platform for Financial Analysis)

- **URL**: https://github.com/ai4finance-foundation/finrobot
- **Stars**: ~10,000+
- **Tech Stack**: Python, LangChain, OpenAI/LLM APIs, Finnhub, yfinance
- **Key Features to Learn From**:
  - Multi-agent framework for financial analysis
  - Equity research report generation
  - Market sentiment tracking
  - Diverse agent roles (analyst, researcher, reporter)
- **What Makes It Stand Out**: The concept of AI-generated research reports is powerful for Vixor — imagine generating a "Token Research Report" for any Solana memecoin combining on-chain data, social sentiment, and technical analysis.

---

### 6. AI-Powered Trading Assistants

#### 6.1 AI-Trader (HKUDS)

- **URL**: https://github.com/HKUDS/AI-Trader
- **Stars**: ~2,000+
- **Tech Stack**: Python, LLM APIs, Multi-agent architecture
- **Key Features to Learn From**:
  - Agent-native trading platform — AI agents join and trade autonomously
  - Exchange ideas and trading skills through AI agents
  - Any AI agent joins the platform in seconds
  - Real-time trading simulation
- **What Makes It Stand Out**: The "agent-native" concept — where different AI strategies compete and collaborate. Could inspire Vixor's "Predictions" feature to show multiple AI-generated predictions with confidence scores.

#### 6.2 Freqtrade FreqAI

- **URL**: https://github.com/freqtrade/freqtrade (FreqAI module)
- **Stars**: ~39,900+ (parent project)
- **Tech Stack**: Python, scikit-learn, XGBoost, LightGBM, PyTorch
- **Key Features to Learn From**:
  - ML-based strategy optimization
  - Feature engineering from candle data
  - Model training and evaluation
  - Predictive signals generation
  - Dropout protection (model degeneration detection)
- **What Makes It Stand Out**: The most practical implementation of ML in a production trading system. The pattern of training on historical data, generating signals, and protecting against model degeneration is directly applicable.

#### 6.3 Neural Trader MCP

- **URL**: https://neural-trader.ruv.io / `npm install neural-trader`
- **Tech Stack**: TypeScript, MCP (Model Context Protocol), 58+ tools
- **Key Features to Learn From**:
  - Self-learning AI trading platform
  - Multi-source news aggregation with AI sentiment analysis
  - Market impact scoring
  - GPU-accelerated analysis
  - 58+ MCP tools for trading operations
- **What Makes It Stand Out**: The MCP tool architecture is modern and composable. Each tool does one thing well, and the AI agent composes them. This is a great pattern for Vixor's AI features.

---

## RECOMMENDATION SUMMARY FOR VIXOR

### Priority 1 — Immediate Integration (High Impact, Low Effort)

| Library                     | Purpose                                | Effort  |
| --------------------------- | -------------------------------------- | ------- |
| `lightweight-charts`        | Main candlestick chart                 | 1 day   |
| `jup-ag/core` + Jupiter API | Token swapping + price quotes          | 2 days  |
| `trading-signals`           | Technical indicators for alpha signals | 1 day   |
| `grammy`                    | Telegram bot for alerts                | 1 day   |
| DeFiLlama API               | Yield farming data                     | 0.5 day |
| `zustand`                   | Client state management                | 0.5 day |
| `sonner`                    | In-app toast notifications             | 0.5 day |

### Priority 2 — Short-Term (High Impact, Medium Effort)

| Library                     | Purpose                           | Effort   |
| --------------------------- | --------------------------------- | -------- |
| `kline-orderbook-chart`     | Orderbook heatmap (wow factor)    | 2-3 days |
| `@huggingface/transformers` | Client-side sentiment analysis    | 2-3 days |
| `ccxt`                      | Multi-exchange data               | 2 days   |
| `@helius-labs/*`            | Solana webhooks for whale alerts  | 2 days   |
| `ag-grid-react`             | Data grids for token lists        | 1-2 days |
| `novu`                      | Multi-channel notification system | 2-3 days |
| Birdeye API                 | Enhanced Solana analytics         | 1 day    |

### Priority 3 — Medium-Term (Strategic Value)

| Library                    | Purpose                           | Effort   |
| -------------------------- | --------------------------------- | -------- |
| `@metaplex-foundation/umi` | Token metadata enrichment         | 2 days   |
| `klinechart`               | Advanced charting with indicators | 2-3 days |
| `@solana/spl-token`        | Wallet management features        | 2 days   |
| `web-push`                 | Browser push notifications        | 1-2 days |
| `xterm.js`                 | Terminal-style command interface  | 3-5 days |
| `onnxruntime-web`          | Client-side ML prediction models  | 3-5 days |

### Priority 4 — Long-Term (Advanced Features)

| Library                 | Purpose                                  | Effort   |
| ----------------------- | ---------------------------------------- | -------- |
| `scichart.js`           | Enterprise-grade orderbook visualization | 5+ days  |
| `backtestjs/framework`  | Strategy backtesting engine              | 5+ days  |
| Supabase Edge Functions | Serverless alert processing              | 3-5 days |
| Shyft gRPC              | Ultra-low-latency Solana streaming       | 5+ days  |
| Custom LLM Integration  | AI research report generation            | 5+ days  |

---

_Report generated for the Vixor Trading Terminal project. All information is current as of July 2025._
