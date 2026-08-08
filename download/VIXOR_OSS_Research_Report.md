# VIXOR OSS Research Report — AI Agent, Market Data & Token Intelligence

> **Goal:** Identify the best open-source projects to modernize VIXOR's MOXI agent, enhance market data fetching, upgrade token support, and improve UI/UX. All searches executed July-August 2026.

---

## 1. AI AGENT FRAMEWORKS (TypeScript-Native)

### 🔥 TIER 1 — Top Picks for MOXI Modernization

| # | Project | GitHub | ⭐ Stars | License | TS Native | Tool Calling | Memory | Maturity | VIXOR Relevance |
|---|---------|--------|---------|---------|-----------|-------------|--------|----------|----------------|
| 1 | **Vercel AI SDK** | `vercel/ai` | ~18k | MIT | ✅ Native | ✅ First-class (multi-step, programmatic) | ✅ Via providers | Production (v6, Dec 2025) | **★★★★★** — Best fit. Lightweight, streaming-first, native TS, tool calling is its core feature. Ships agent loop primitives (`maxSteps`, `ToolLoopAgent`, `HarnessAgent`). Can wrap MOXI's existing tools as AI SDK tools with zero framework lock-in. |
| 2 | **Mastra** | `mastra-ai/mastra` | ~10k | MIT | ✅ Native | ✅ Built-in tool registry | ✅ Built-in (working memory, long-term) | Production (v1, 2025) | **★★★★★** — Full-stack TS framework. Agents + workflows + memory + RAG + vector store. If VIXOR needs a "batteries-included" framework with stateful workflows and persistence, Mastra is the top choice. |
| 3 | **LangGraph.js** | `langchain-ai/langgraphjs` | ~3k | MIT | ✅ Native | ✅ Via LangChain tools | ⚠️ External (bring your own) | Production (used by Uber, LinkedIn, Replit) | **★★★★☆** — Stateful graph-based agent orchestration. Best for complex multi-step agent flows (e.g., research → analyze → trade). Steeper learning curve. JS/TS is a first-class port. |
| 4 | **VoltAgent** | `voltagent/voltagent` | ~2k | Apache-2.0 | ✅ Native | ✅ First-class | ✅ Built-in | Early-growth (2025) | **★★★★☆** — Observability-first. Built-in memory, RAG, guardrails. Visual tracing of agent execution. Rising star. Less battle-tested but excellent DX. |

### TIER 2 — Worth Evaluating

| # | Project | GitHub | ⭐ Stars | License | TS Native | Tool Calling | Memory | Maturity | VIXOR Relevance |
|---|---------|--------|---------|---------|-----------|-------------|--------|----------|----------------|
| 5 | **OpenAI Agents SDK** | `openai/openai-agents-js` | ~7k | MIT | ✅ Native | ✅ First-class | ✅ Handoffs + thread state | Production (v0.x) | **★★★☆☆** — Tightest OpenAI integration. Vendor lock-in concern. Good if VIXOR exclusively uses GPT-4o/o3. |
| 6 | **LangChain.js** | `langchain-ai/langchainjs` | ~10k | MIT | ✅ Native | ✅ Extensive tool ecosystem | ⚠️ External | Mature (v0.3) | **★★★☆☆** — Massive ecosystem. Overly abstracted for simple agents. Better as a tool provider (retrievers, document loaders) than the agent orchestration layer. |
| 7 | **CrewAI** | `crewAIInc/crewAI` | ~35k | BSD-3 | ❌ Python only | ✅ | ✅ | Production | **★★☆☆☆** — Python-only. Best multi-agent simulation. Not usable for TS codebase but excellent reference architecture. |
| 8 | **Google ADK** | `google/adk-python` | ~6k | Apache-2.0 | ⚠️ Alpha TS port | ✅ | ⚠️ Basic | Early | **★★☆☆☆** — Agent Development Kit. TS port exists but immature. Google-centric. |

### Agent Memory Systems (Pluggable into any framework)

| # | Project | GitHub | ⭐ Stars | License | TS SDK | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|--------|-------------|----------------|
| 9 | **Mem0** | `mem0ai/mem0` | ~25k | Apache-2.0 | ✅ `mem0ai/mem0js` | Managed memory layer — adds/deletes/searches/updates memories for users, sessions, agents. Tiny footprint (1,764 tokens vs 600k+ for alternatives). | **★★★★★** — Best-in-class memory layer. Drop-in for MOXI. Supports graph-based memory with temporal reasoning. |
| 10 | **Zep (Graphiti)** | `getzep/graphiti` | ~2k | Apache-2.0 | ✅ `@getzep/graphiti` | Temporal knowledge graph memory. Extracts facts, builds time-aware entity graph. | **★★★★☆** — Best for temporal/sequential memory (e.g., remembering past market conditions). |
| 11 | **Letta (MemGPT)** | `letta-ai/letta` | ~18k | Apache-2.0 | ❌ Python SDK only | Self-editing memory with context management (inner/outer loop). Runs as a server with REST API. | **★★★☆☆** — Most sophisticated memory architecture but Python-only. Would need a service boundary. |
| 12 | **LangMem** | (in LangChain) | — | MIT | ✅ Via langchain.js | Memory module within LangChain. Conversation summary + entity extraction. | **★★★☆☆** — Good if already using LangChain. |

### 🔑 Agent Framework Recommendation for MOXI

**Primary:** **Vercel AI SDK** — Replace MOXI's current ad-hoc LLM calls with AI SDK's `generateText`/`streamText` + tool definitions. Minimal migration surface. Add `maxSteps` for autonomous multi-tool loops.

**Memory:** **Mem0** — Add as a service. MOXI calls `mem0.add()` when it learns something, `mem0.search()` before responding. Tiny footprint.

**Workflow Upgrade Path:** If MOXI needs complex multi-step reasoning (research → analyze → decide → execute), layer on **LangGraph.js** or **Mastra workflows** on top of AI SDK primitives.

---

## 2. MARKET DATA PROVIDERS (OHLCV, Crypto, Forex, Stocks)

### Open-Source Libraries / SDKs

| # | Project | GitHub | ⭐ Stars | License | TS Support | What It Does | Maturity | VIXOR Relevance |
|---|---------|--------|---------|---------|-----------|-------------|----------|----------------|
| 13 | **CCXT** | `ccxt/ccxt` | ~43k | MIT | ✅ Native (JS/TS) | Unified API to 100+ crypto exchanges. Fetches OHLCV, orderbook, tickers, trades. Supports async/WebSocket. | Production (v4) | **★★★★★** — Industry standard. If VIXOR fetches from any exchange, CCXT eliminates per-exchange integration. Replace custom exchange fetchers with CCXT unified API. |
| 14 | **Tiingo** | tiingo.com | N/A (API service) | Free tier | ✅ Community SDKs | Stocks, ETFs, crypto EOD + intraday data. Free 1000 req/day. IEX real-time. | Production | **★★★★☆** — Best free stock market data. Great for equity OHLCV. Not open-source but generous free API. |
| 15 | **Twelve Data** | twelvedata.com | N/A (API service) | Free tier | ✅ Official SDK | Stocks, forex, crypto OHLCV + 100+ technical indicators computed server-side. WebSocket streaming. | Production | **★★★★☆** — Best all-in-one (stocks + forex + crypto). Free 800 req/day. Technical indicators as API. |
| 16 | **CryptoDataDownload** | cryptodatadownload.com | N/A (free data) | Free | ❌ CSV downloads | Historical crypto OHLCV downloads. ML feature store. | Production | **★★★☆☆** — Good for backfilling historical data. Not a real-time API. |
| 17 | **Finnhub** | finnhub.io | N/A (API service) | Free tier | ✅ Official SDK | US stocks, forex, crypto. Real-time WebSocket trades. Fundamentals, earnings, economic calendar. | Production | **★★★☆☆** — Good real-time WebSocket for US stocks. Free 60 calls/min. |

### DEX / On-Chain Data

| # | Project | GitHub/URL | ⭐ Stars | License | What It Does | VIXOR Relevance |
|---|---------|-----------|---------|---------|-------------|----------------|
| 18 | **DefiLlama** | `DefiLlama/DefiLlama-Adapters` | ~8k | AGPL-3.0 | TVL, DEX volumes, yields, fees across 200+ chains. Has public API + open-source adapters. | **★★★★★** — The de-facto DeFi data standard. Use their API for protocol TVL, DEX volumes, liquidity data. |
| 19 | **Dune Analytics** | dune.com | N/A (platform) | Free tier (public queries) | SQL-queryable blockchain data. 130+ chains. Community dashboards for DEX analytics. | **★★★★☆** — Best for custom on-chain queries. Free tier sufficient for research. |
| 20 | **Bitquery** | bitquery.io | N/A (API service) | Free tier | GraphQL API for 300+ DEXs. Real-time + historical trades, OHLCV, liquidity. | **★★★★☆** — Best DEX-specific OHLCV API. GraphQL lets you query exactly what you need. |
| 21 | **crumbs** | `AsharibAli/blockchain-research-tools` | ~2k | MIT | Curated list of free blockchain analytics tools. Includes crumbs (free DEX data across 34 chains). | **★★★☆☆** — Reference/resource. Good for discovering additional tools. |

### 🔑 Market Data Recommendation for VIXOR

- **Crypto exchange data:** Migrate to **CCXT** — unified API, TypeScript native, replaces all custom fetchers.
- **Stock/forex OHLCV:** Add **Twelve Data** or **Tiingo** as free-tier providers.
- **DeFi/DEX analytics:** Integrate **DefiLlama API** for protocol data.
- **On-chain DEX OHLCV:** **Bitquery** GraphQL for granular pair-level data.

---

## 3. TOKEN INTELLIGENCE (Metadata, Lists, Prices)

### Token Lists & Registries

| # | Project | GitHub | ⭐ Stars | License | Chains | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|---------|-------------|----------------|
| 22 | **Uniswap Token Lists** | `Uniswap/token-lists` | ~3k | MIT | Ethereum/EVM | Specification + default list for token metadata (address, name, symbol, decimals, logoURI). Industry standard. | **★★★★★** — Use the token-lists spec for EVM tokens. The default list is maintained by Uniswap and used by most DeFi UIs. |
| 23 | **Uniswap Default Token List** | `Uniswap/default-token-list` | ~1k | MIT | Ethereum | Curated token list used in Uniswap Interface. 300+ tokens with verified metadata. | **★★★★☆** — Drop-in token metadata for major EVM tokens. |
| 24 | **Jupiter Token List** | `jup-ag/token-list` | ~2k | Apache-2.0 | Solana | Validated Solana token list (CSV + JSON). Maintained by Jupiter (Solana's largest DEX). | **★★★★★** — The best Solana token registry. Includes validated metadata, mints, decimals, logos. Essential if VIXOR supports Solana. |
| 25 | **Solana Token List** | `solana-labs/token-list` | ~1k | Apache-2.0 | Solana | Original community-maintained Solana token registry. Now deprecated in favor of Metaplex Token Metadata. | **★★★☆☆** — Legacy. Use Jupiter list instead. |
| 26 | **Metaplex Token Metadata** | `metaplex-foundation/mpl-token-metadata` | ~2k | Apache-2.0 | Solana | On-chain token metadata program. Name, symbol, URI, update authority stored on mint account. | **★★★★☆** — For on-chain Solana token lookups. Pairs well with Jupiter list for off-chain cache. |
| 27 | **CoinGecko API** | coingecko.com/api | N/A (API) | Free tier (100 req/min) | All chains | Real-time + historical prices, market cap, volume, metadata, images, social stats. | **★★★★★** — Best free token metadata API. Covers 10,000+ coins. Use as primary price + metadata source. |

### Token Intelligence Alternatives

| # | Project | Type | What It Does | VIXOR Relevance |
|---|---------|------|-------------|----------------|
| 28 | **Birdeye** | API service | DEX aggregator data. Solana + EVM. Historical prices, token analytics, new token detection. | **★★★★☆** — Best for Solana token intelligence. Has WebSocket for real-time. |
| 29 | **DexScreener** | API + web | Real-time DEX token data. New token alerts, pair analytics. Solana + EVM. | **★★★★☆** — Best for spotting new/rug tokens. Good alert system. |
| 30 | **CoinMarketCap API** | API service | Market data, rankings, metadata. Free tier. | **★★★☆☆** — Solid but restrictive free tier (10k/month). CoinGecko is more generous. |
| 31 | **Mobula API** | API service | On-chain + real-time data. DEX analytics, wallet tracking, high-frequency pricing. | **★★★☆☆** — Good CoinGecko alternative for on-chain data focus. |

### 🔑 Token Intelligence Recommendation for VIXOR

- **EVM tokens:** Use **Uniswap Token Lists** spec + **default-token-list** for metadata.
- **Solana tokens:** Use **Jupiter Token List** + **Metaplex Token Metadata** for on-chain lookups.
- **Prices + market data:** **CoinGecko API** (free, comprehensive, 100 req/min).
- **New token detection:** **DexScreener** or **Birdeye** APIs.

---

## 4. EVENT-DRIVEN ARCHITECTURE (TypeScript)

| # | Project | GitHub | ⭐ Stars | License | TS Native | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|-----------|-------------|----------------|
| 32 | **EventEmitter3** | `primus/eventemitter3` | ~4k | MIT | ✅ | High-performance event emitter. Micro-optimized, 2x faster than Node.js EventEmitter. No dependencies. | **★★★★★** — Drop-in replacement for Node EventEmitter. Perfect for in-process event bus (price updates, signal alerts, agent events). |
| 33 | **Typed Emitter** | `andywer/typed-emitter` | ~2k | MIT | ✅ | Type-safe event emitter interface for TypeScript. Generic typing for event names and payloads. | **★★★★☆** — Wraps EventEmitter3 with full TypeScript type safety. Compile-time guarantees on event names and payloads. |
| 34 | **BullMQ** | `taskforcesh/bullmq` | ~16k | MIT | ✅ | Distributed message queue for Node.js. Redis-backed. Supports events, delays, retries, priorities. | **★★★★★** — If VIXOR needs persistent/distributed event processing (e.g., agent task queues, scheduled analysis), BullMQ is the standard. |
| 35 | **MQTT.js** | `mqttjs/MQTT.js` | ~8k | MIT | ✅ | MQTT client for Node.js/browsers. Lightweight pub/sub. | **★★★☆☆** — Good for real-time data streaming if adopting MQTT protocol. |
| 36 | **RxJS** | `ReactiveX/rxjs` | ~31k | Apache-2.0 | ✅ | Reactive programming library. Observable streams with operators. | **★★★★☆** — If VIXOR already uses RxJS for price streams, keep it. Powerful but steep learning curve. |

### 🔑 Event Architecture Recommendation for VIXOR

- **In-process events (price ticks, agent signals, UI updates):** **EventEmitter3** + **TypedEmitter** for type safety.
- **Persistent task queues (agent jobs, scheduled analysis):** **BullMQ** (Redis-backed).
- **Real-time data streams:** **RxJS** if already used, or plain WebSocket with EventEmitter3.

---

## 5. TRADING UI / DASHBOARD COMPONENTS

### Charting Libraries

| # | Project | GitHub | ⭐ Stars | License | React | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|-------|-------------|----------------|
| 37 | **TradingView Lightweight Charts** | `tradingview/lightweight-charts` | ~17k | Apache-2.0 | ✅ `lightweight-charts-react-wrapper` | Smallest & fastest financial HTML5 charts. Candlestick, line, area, histogram, bar. 60fps. | **★★★★★** — Industry standard for web trading charts. Tiny bundle. Perfect for VIXOR's price charts. |

### Design Systems

| # | Project | GitHub | ⭐ Stars | License | React | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|-------|-------------|----------------|
| 38 | **shadcn/ui** | `shadcn-ui/ui` | ~80k | MIT | ✅ | Copy-paste component library built on Radix UI + Tailwind CSS. Dashboard templates, data tables, forms, dialogs. | **★★★★★** — Best choice for VIXOR UI. Dark/light themes, excellent data tables, composable. Used by most modern TS dashboards. |
| 39 | **Meta Astryx** | `facebook/astryx` (newly open-sourced) | New | MIT | ✅ | Agent-ready React design system. 150+ accessible components, 7 themes, MCP server, token-optimized CLI. | **★★★★★** — Brand new (Jul 2026). Purpose-built for AI agent UIs. MCP integration means AI agents can render UI components. Worth watching closely. |
| 40 | **Ant Design** | `ant-design/ant-design` | ~92k | MIT | ✅ | Enterprise-grade React UI library. 60+ components. Built-in charts, data tables. | **★★★☆☆** — Very complete but heavy. Better for traditional dashboards. shadcn/ui is more modern. |

### Trading Interfaces / Reference Projects

| # | Project | GitHub | ⭐ Stars | License | Tech | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|------|-------------|----------------|
| 41 | **AI-Trader** | `HKUDS/AI-Trader` | ~13k | MIT | React + Python | Agent-native trading platform. AI agents self-register and publish trading signals. 100% automated. | **★★★★★** — Directly relevant! Agent-native architecture is exactly what MOXI needs. Great reference for how to structure agent-signal-to-UI pipeline. Python backend but UI patterns are applicable. |
| 42 | **Reactive Trader Cloud** | `AdaptiveConsulting/ReactiveTraderCloud` | ~2k | MIT | React + TypeScript | Real-time FX trading platform showcasing reactive programming. Spot/forward trading, blotter, price ticks. | **★★★★☆** — Excellent reference for real-time trading UI. TypeScript + React. Shows proper WebSocket price streaming, blotter design, P&L tracking. (Archived but code is solid.) |
| 43 | **TradingAgents** | `tauricresearch/tradingagents` | ~5k | MIT | Python | Multi-agent LLM trading framework. Simulates trading firm with fundamental, sentiment, and technical analysts. | **★★★★☆** — Architecture reference. Shows how to decompose trading intelligence into specialized agents (similar to what MOXI could become). Python-only. |

### 🔑 UI/UX Recommendation for VIXOR

- **Design system:** **shadcn/ui** for dashboard layout, data tables, dialogs. Evaluate **Meta Astryx** for agent-specific UI components.
- **Charts:** **TradingView Lightweight Charts** for candlestick/OHLCV. Integrate with `@tanstack/react-query` for data fetching.
- **Architecture reference:** Study **AI-Trader** for agent-signal pipeline. Study **Reactive Trader** for real-time streaming patterns.

---

## 6. OBSERVABILITY (Bonus Domain)

| # | Project | GitHub | ⭐ Stars | License | TS SDK | What It Does | VIXOR Relevance |
|---|---------|--------|---------|---------|--------|-------------|----------------|
| 44 | **Langfuse** | `langfuse/langfuse` | ~10k | MIT | ✅ | Open-source LLM observability. Traces, evaluations, prompt management. Framework-agnostic. | **★★★★★** — Essential for monitoring MOXI agent calls. See every tool call, token usage, latency. |
| 45 | **OpenTelemetry** | `open-telemetry/opentelemetry-js` | ~3k | Apache-2.0 | ✅ | Standardized observability (traces, metrics, logs). Vendor-neutral. | **★★★★☆** — Infrastructure-level observability. Pairs with Langfuse for LLM-specific traces. |

---

## 7. SUMMARY: VIXOR MODERNIZATION PRIORITY MATRIX

### Immediate (High Impact, Low Effort)

| Action | Project | Why |
|--------|---------|-----|
| Modernize MOXI tool calling | **Vercel AI SDK** | Drop-in replacement. Native TS. Best tool calling primitives. |
| Add agent memory | **Mem0** | 5-minute integration. Massive improvement to MOXI's context awareness. |
| Standardize exchange data fetching | **CCXT** | Eliminates all custom exchange code. 100+ exchanges unified. |
| Add charting | **TradingView Lightweight Charts** | Best-in-class. Tiny bundle. |
| Set up UI design system | **shadcn/ui** | Modern, composable, dark-mode ready. |

### Short-Term (High Impact, Medium Effort)

| Action | Project | Why |
|--------|---------|-----|
| Add token metadata | **Uniswap Token Lists** + **Jupiter Token List** | Standard EVM + Solana token data. |
| Add price data | **CoinGecko API** | Free, 100 req/min, 10k+ coins. |
| Agent observability | **Langfuse** | See every MOXI decision. Debug & improve. |
| Event bus refactor | **EventEmitter3** + **TypedEmitter** | Type-safe in-process events. |

### Medium-Term (Strategic)

| Action | Project | Why |
|--------|---------|-----|
| Complex agent workflows | **Mastra** or **LangGraph.js** | Multi-step research/analysis/execution flows. |
| DeFi data | **DefiLlama API** | Protocol TVL, DEX volumes, yields. |
| Distributed task queues | **BullMQ** | If scaling beyond single-process. |
| Agent-native UI | **Meta Astryx** | If MCP-driven UI becomes relevant. |
| Multi-agent trading | Study **AI-Trader** + **TradingAgents** architecture | Reference for agent decomposition. |

---

## 8. QUICK-REFERENCE: ALL PROJECTS BY GITHUB URL

```
AI AGENT FRAMEWORKS
├── vercel/ai                          ~18k ⭐  MIT        — AI SDK (tool calling, agents)
├── mastra-ai/mastra                   ~10k ⭐  MIT        — Full-stack TS agent framework
├── langchain-ai/langgraphjs           ~3k  ⭐  MIT        — Graph-based agent orchestration
├── voltagent/voltagent                ~2k  ⭐  Apache-2.0 — Observability-first TS agent framework
├── openai/openai-agents-js            ~7k  ⭐  MIT        — OpenAI-native agent SDK
├── langchain-ai/langchainjs           ~10k ⭐  MIT        — LangChain JS/TS
└── crewAIInc/crewAI                   ~35k ⭐  BSD-3      — Multi-agent framework (Python)

AGENT MEMORY
├── mem0ai/mem0                        ~25k ⭐  Apache-2.0 — Best memory layer
├── getzep/graphiti                    ~2k  ⭐  Apache-2.0 — Temporal knowledge graph
└── letta-ai/letta                     ~18k ⭐  Apache-2.0 — Self-editing memory (Python)

MARKET DATA
├── ccxt/ccxt                          ~43k ⭐  MIT        — Unified crypto exchange API
├── DefiLlama/DefiLlama-Adapters       ~8k  ⭐  AGPL-3.0  — DeFi data adapters
└── (API services: Tiingo, Twelve Data, Finnhub, CoinGecko, Bitquery, Dune)

TOKEN INTELLIGENCE
├── Uniswap/token-lists                ~3k  ⭐  MIT        — Token list spec (EVM)
├── Uniswap/default-token-list         ~1k  ⭐  MIT        — Curated EVM token list
├── jup-ag/token-list                  ~2k  ⭐  Apache-2.0 — Validated Solana token list
├── solana-labs/token-list             ~1k  ⭐  Apache-2.0 — Legacy Solana token list
└── metaplex-foundation/mpl-token-metadata ~2k ⭐ Apache-2.0 — Solana on-chain metadata

EVENT-DRIVEN
├── primus/eventemitter3               ~4k  ⭐  MIT        — Fast event emitter
├── andywer/typed-emitter              ~2k  ⭐  MIT        — Type-safe emitter
├── taskforcesh/bullmq                 ~16k ⭐  MIT        — Distributed job queue
└── ReactiveX/rxjs                     ~31k ⭐  Apache-2.0 — Reactive streams

TRADING UI
├── tradingview/lightweight-charts     ~17k ⭐  Apache-2.0 — Financial charts
├── shadcn-ui/ui                       ~80k ⭐  MIT        — Modern React design system
├── facebook/astryx                    New    MIT        — Agent-ready React design system
├── HKUDS/AI-Trader                    ~13k ⭐  MIT        — Agent-native trading platform
├── AdaptiveConsulting/ReactiveTraderCloud ~2k ⭐ MIT     — Real-time FX trading UI
└── tauricresearch/tradingagents       ~5k  ⭐  MIT        — Multi-agent trading framework

OBSERVABILITY
├── langfuse/langfuse                  ~10k ⭐  MIT        — LLM observability
└── open-telemetry/opentelemetry-js    ~3k  ⭐  Apache-2.0 — Standardized observability
```

---
*Report generated by VIXOR OSS Research Agent. All data current as of August 2026.*