const m = require('./generate-phase1-v2.cjs');
const { P, c, h1, h2, h3, body, bodyBold, spacer, makeTable, buildCover } = m;
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, TableOfContents,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, PageBreak, SectionType
} = require('docx');

function sec7_ossMatrix() {
  return [
    h1('7. OSS Master Decision Matrix'),
    body('This section evaluates every OSS project referenced in the VIXOR V2 Master Transformation Contract and the two architecture documents against the Capability-First Principle and the Reality Baseline. Each project is classified using a six-tier system: A (INTEGRATE) means already in the codebase and verified as runtime-used; B (ADAPTER) means approved for integration with an adapter layer; C (POC) means requires proof-of-concept before commitment; D (REFERENCE) means study for patterns only, no code integration; E (OPTIONAL) means may be added if a specific capability gap is confirmed during implementation; F (REJECT) means excluded due to license, language mismatch, or redundancy. Every classification is backed by evidence from the Reality Baseline.'),
    makeTable(
      ['Project', 'Class', 'Evidence / Justification', 'License', 'Integration Method'],
      [
        ['CCXT v4.5', 'A', 'Integrated; 4 exchange adapters (Binance, Bybit, OKX, Exness) with HMAC signing; trading/gateway/', 'MIT', 'Direct (already integrated)'],
        ['TradingView LW Charts v5.2', 'A', 'Integrated; CandlestickChart + DexChart use it; lightweight-charts-indicators v0.4.2', 'Apache-2.0', 'Direct (already integrated)'],
        ['lightweight-charts-indicators', 'A', 'Integrated; overlay indicators in DexChart', 'Apache-2.0', 'Direct (already integrated)'],
        ['Vercel AI SDK v6', 'A', 'Integrated; MOXI, Debate, Chart Intelligence, Experiment all use ai@6.0.224', 'MIT', 'Direct (already integrated)'],
        ['shadcn/ui + Radix UI', 'A', 'Integrated; 38 shadcn + 22 Radix primitives; 45 UI component files', 'MIT', 'Direct (already integrated)'],
        ['TanStack Query + Router + Start', 'A', 'Integrated; data fetching, routing, SSR framework', 'MIT', 'Direct (already integrated)'],
        ['Zustand v5', 'A', 'Integrated; client state management', 'MIT', 'Direct (already integrated)'],
        ['Recharts v2', 'A', 'Integrated; MiniSparkline + EquityChart', 'MIT', 'Direct (already integrated)'],
        ['Framer Motion v12', 'A', 'Integrated; animations, DynamicDock, MoxiAvatar', 'MIT', 'Direct (already integrated)'],
        ['EventEmitter3', 'A', 'Integrated; domain event bus (currently DEAD in production but code is real)', 'MIT', 'Direct (already integrated)'],
        ['DexScreener', 'A', 'Integrated; 3 files (REST, WS, Discovery client); active WS connection', 'N/A (API)', 'Direct (already integrated)'],
        ['Birdeye', 'A', 'Integrated; discovery/clients/birdeye.client.ts; PARTIAL (needs API key)', 'N/A (API)', 'Direct (already integrated)'],
        ['LunarCrush', 'A', 'Integrated; discovery/clients/lunarcrush.client.ts; PARTIAL (needs API key)', 'N/A (API)', 'Direct (already integrated)'],
        ['Helius RPC', 'A', 'Integrated; 2 files (shared dead + discovery active); PARTIAL (needs API key)', 'N/A (API)', 'Direct (already integrated)'],
        ['DeFiLlama SDK', 'B', 'NOT integrated; free API, no rate limit; enables Yield + DeFi pages. ADAPTER needed', 'MIT', 'Adapter: shared/market-data/defillama.client.ts'],
        ['technicalindicators (npm)', 'B', 'NOT integrated; 50+ TA indicators; enhances Analyze phase. ADAPTER wraps existing engine interface', 'MIT', 'Adapter: analysis/engine/indicators/ta-lib-adapter.ts'],
        ['Birdeye (enhanced)', 'B', 'Already integrated for basic use; enhanced adapter needed for Solana token intelligence', 'N/A (API)', 'Adapter enhancement: discovery/clients/birdeye.client.ts'],
        ['LunarCrush (enhanced)', 'B', 'Already integrated for basic scoring; enhanced adapter needed for social sentiment in MOXI', 'N/A (API)', 'Adapter enhancement: discovery/clients/lunarcrush.client.ts'],
        ['Mastra', 'C', 'Full-stack agent framework; overlaps Vercel AI SDK. POC required to compare workflow orchestration, memory, RAG', 'MIT', 'POC: compare vs Vercel AI SDK + custom tooling; 2-week timebox'],
        ['tulip-node', 'C', 'C library with unofficial TS wrapper; 100+ indicators. POC required vs technicalindicators adapter', 'LGPL-3.0', 'POC: compare performance and indicator coverage vs technicalindicators'],
        ['backtest-kit', 'C', 'TypeScript-native backtesting; could replace custom simulator. POC required', 'MIT', 'POC: evaluate strategy DSL, candle integration, metrics output'],
        ['KLineChart', 'C', 'Alternative to LW Charts with built-in indicators; POC for chart UX', 'Apache-2.0', 'POC: compare indicator overlay UX vs LW Charts + indicators adapter'],
        ['Meta Astryx', 'C', 'Agent UI components; POC for MOXI visual identity', 'MIT', 'POC: evaluate visual quality and React integration'],
        ['XState', 'D', 'Signal lifecycle pattern reference; existing Transition Engine is pure-function and sufficient', 'MIT', 'Reference only: study state machine patterns'],
        ['AI-Trader', 'D', 'Agent-signal pipeline reference; MOXI has its own architecture', 'MIT', 'Reference only: study agent-signal coordination'],
        ['VectorBT', 'D', 'Python backtesting architecture reference; too heavy for TS codebase', 'AGPL-3.0', 'Reference only: study metrics and analyzer patterns'],
        ['QuantStats', 'D', 'Portfolio analytics reference; Python-only. Potential future microservice if TS metrics insufficient', 'AGPL-3.0', 'Reference only; potential isolated Python microservice'],
        ['NautilusTrader', 'D', 'Order lifecycle reference; enterprise-grade, Python, overkill for VIXOR scope', 'Apache-2.0', 'Reference only: study order management patterns'],
        ['Reactive Trader', 'D', 'Real-time UI reference; study for inspiration, not integration', 'Apache-2.0', 'Reference only: study real-time UI patterns'],
        ['Freqtrade', 'D', 'Strategy lifecycle reference; Python-only', 'MIT', 'Reference only: study strategy patterns'],
        ['Jesse', 'D', 'Backtesting reference; Python-only', 'MIT', 'Reference only'],
        ['Hummingbot', 'E', 'Python market-making platform; VIXOR is not a bot framework. OPTIONALLY useful for arbitrage strategy patterns', 'Apache-2.0', 'Optional: study Connector pattern for trading/gateway/adapters/'],
        ['ECharts', 'E', 'Heavy (1MB+); Recharts + LW Charts cover all current needs. OPTIONALLY useful for advanced visualizations (heatmap, network graph, sankey)', 'Apache-2.0', 'Optional: add only if specific viz type is confirmed needed'],
        ['Trigger.dev', 'E', 'Job queue; Vercel cron + in-process events sufficient for current scale. OPTIONALLY useful if durable jobs are needed', 'AGPL-3.0', 'Optional: requires license review before any integration'],
        ['NATS', 'F', 'Message queue; massive overkill for single-deployment VIXOR. EventEmitter3 + Supabase Realtime sufficient', 'Apache-2.0', 'REJECT: scale does not justify complexity'],
        ['LangChain.js', 'F', 'Over-abstracted; Vercel AI SDK is already integrated and sufficient', 'MIT', 'REJECT: redundant with Vercel AI SDK'],
        ['CrewAI', 'F', 'Python-only; VIXOR is TypeScript end-to-end for product layer', 'MIT', 'REJECT: language mismatch'],
        ['OpenBB', 'F', 'AGPL license; cannot embed in VIXOR. Reference for financial data normalization patterns only', 'AGPL-3.0', 'REJECT: AGPL license incompatible'],
        ['Backtrader', 'F', 'Unmaintained; last release 2020. Reference only for backtesting architecture', 'GPL-3.0', 'REJECT: unmaintained + GPL license'],
        ['QuantConnect LEAN', 'F', 'C# / Python; enterprise algorithmic trading platform, not a library. Fundamentally different scope', 'Apache-2.0', 'REJECT: wrong paradigm (platform vs library)'],
        ['rotki', 'F', 'Python portfolio tracker; VIXOR has its own portfolio architecture. GPL license', 'AGPL-3.0', 'REJECT: AGPL license + wrong language'],
        ['yfinance', 'F', 'Python-only; unstable API (Yahoo changes frequently). TwelveData + Finnhub cover this need', 'Apache-2.0', 'REJECT: language mismatch + instability'],
        ['Mem0', 'E', 'Memory service for AI agents; potential MOXI enhancement. Requires POC for latency and complexity', 'MIT', 'Optional POC: evaluate for MOXI memory persistence'],
        ['Tremor', 'F', 'React dashboard components; shadcn/ui + Recharts cover all needs', 'MIT', 'REJECT: redundant with shadcn/ui + Recharts'],
        ['PostHog', 'E', 'Product analytics; shared/analytics.ts exists but PostHog is not integrated (mixpanel-browser is unused). Option for future', 'MIT', 'Optional: replace mixpanel if analytics is activated'],
        ['Unleash', 'E', 'Feature flags; not currently needed. Option for future A/B testing', 'Apache-2.0', 'Optional: defer to post-MVP'],
        ['oakscriptjs', 'E', 'In package.json; unclear usage. Needs investigation', 'MIT', 'Optional: investigate and remove if unused'],
      ],
      [18, 7, 38, 14, 33]
    ),
  ];
}

function sec8_licenseMatrix() {
  return [
    h1('8. License Matrix'),
    body('This section records the license status of every approved or POC dependency. Special attention is given to AGPL, GPL, and source-available projects, which may impose copyleft obligations. VIXOR is a proprietary product; therefore, code from copyleft-licensed projects must not be embedded into the VIXOR codebase. Adapter patterns (calling the project as an external service or process) are acceptable; source code copying is not. Legal review is flagged where required.'),
    makeTable(
      ['Project', 'License', 'Integration Method', 'Source Copied?', 'Legal Review?'],
      [
        ['CCXT', 'MIT', 'npm dependency', 'No', 'No'],
        ['TradingView LW Charts', 'Apache-2.0', 'npm dependency', 'No', 'No'],
        ['Vercel AI SDK', 'MIT', 'npm dependency', 'No', 'No'],
        ['shadcn/ui + Radix', 'MIT', 'npm dependency (source copied for shadcn)', 'Yes (shadcn pattern)', 'No (MIT allows)'],
        ['DeFiLlama SDK', 'MIT', 'npm dependency + adapter', 'No', 'No'],
        ['technicalindicators', 'MIT', 'npm dependency + adapter', 'No', 'No'],
        ['Mastra', 'MIT', 'npm dependency (POC only)', 'No', 'No (if POC passes)'],
        ['tulip-node', 'LGPL-3.0', 'npm dependency + adapter', 'No', 'YES: LGPL dynamic linking requirements'],
        ['backtest-kit', 'MIT', 'npm dependency (POC only)', 'No', 'No'],
        ['Trigger.dev', 'AGPL-3.0', 'External service (if used)', 'No', 'YES: AGPL network copyleft'],
        ['VectorBT (ref)', 'AGPL-3.0', 'Reference only, no integration', 'No', 'No (reference only)'],
        ['QuantStats (ref)', 'AGPL-3.0', 'Reference only, no integration', 'No', 'No (reference only)'],
        ['OpenBB', 'AGPL-3.0', 'REJECTED', 'No', 'N/A (rejected)'],
        ['NATS', 'Apache-2.0', 'REJECTED', 'No', 'N/A (rejected)'],
        ['PostHog', 'MIT', 'npm dependency (optional)', 'No', 'No'],
      ],
      [20, 15, 28, 16, 21]
    ),
    h2('8.1 License Risk Assessment'),
    body('Two dependencies require legal review before integration: (1) tulip-node is licensed under LGPL-3.0, which permits dynamic linking but requires that users can replace the LGPL library. If the POC passes and tulip-node is selected over technicalindicators, the integration must use a runtime adapter pattern (dynamic import, not static bundling) to comply with LGPL requirements. (2) Trigger.dev is licensed under AGPL-3.0, which imposes network copyleft obligations. If Trigger.dev is used as a hosted service (calling their API), the copyleft does not apply to VIXOR code. If Trigger.dev is self-hosted or embedded, AGPL requires VIXOR to release its source code. Therefore, Trigger.dev may only be used as a hosted SaaS, never self-hosted. The legal review should confirm this interpretation before any integration.'),
  ];
}

function sec9_dataArch() {
  return [
    h1('9. Data Architecture'),
    body('The data architecture defines how raw market data flows from external providers through normalization layers into canonical models that power the intelligence engines, MOXI, and user experiences. The Phase 0 Reality Baseline identified three critical pipeline breaks: (1) Price Normalization is incomplete because each provider returns data in its own format, (2) Intelligence-to-Decision conversion is ad-hoc with no formal Opportunity Ranking system, and (3) the Review feedback loop is open, meaning trade outcomes do not flow back to improve system behavior. This section freezes the target data architecture that resolves these breaks.'),
    h2('9.1 Target Data Pipeline'),
    body('The VIXOR data pipeline follows a strict layered architecture. Each layer has a clear responsibility and interface contract. Data flows downward only: providers feed normalizers, normalizers feed canonical stores, canonical stores feed engines, engines feed the decision layer, and the decision layer feeds the experience layer. No layer may reach into a lower layer directly; all access goes through the defined interface contracts. This prevents the current pattern where the analysis engine contains provider-specific logic.'),
    makeTable(
      ['Layer', 'Responsibility', 'Key Components', 'Data Format', 'Current State'],
      [
        ['Infrastructure', 'Raw data acquisition and transport', 'CCXT, DexScreener WS, Binance WS, Helius, Supabase, Redis', 'Provider-native JSON/WS frames', 'WORKING: 5+ sources active'],
        ['Normalization', 'Transform raw data to unified VIXOR format', 'future: data-normalizer service with provider adapters', 'VIXOR Unified Price Model (OHLCV + metadata)', 'BROKEN: no unified normalizer exists'],
        ['Canonical Data', 'Store and serve normalized data', 'Supabase tables, Redis cache, future: vector store', 'VIXOR canonical models (Asset, Price, Signal, Position)', 'PARTIAL: schemas exist, no unified model'],
        ['Analysis', 'Compute derived data (signals, analysis, risk)', 'analysis/engine/, signal-tracking/, debate/, risk-governor/', 'Engine-specific internal types', 'ACTIVE: 6 engines implemented'],
        ['Intelligence', 'Convert engine outputs to ranked decisions', 'MOXI agents, opportunity ranking, user context', 'Decision objects (recommendation, confidence, reasoning)', 'PARTIAL: MOXI exists, no formal ranking'],
        ['Experience', 'Render decisions and data to user', 'React components, routes, chart components', 'UI state (React), server state (TanStack Query)', 'ACTIVE: 48 vixor components, 39 routes'],
      ],
      [14, 25, 25, 20, 16]
    ),
    h2('9.2 Critical Pipeline Breaks'),
    body('Break 1: Price Normalization is incomplete. Each client (Binance WS, DexScreener, TwelveData, Finnhub) returns data in its own format. The analysis engine must handle format differences itself. The fix is a dedicated Normalization service with provider adapters that output a canonical VIXOR AssetPrice type. Target Phase: 2 (Data Foundation). Break 2: Intelligence-to-Decision conversion is ad-hoc. The hunter.agent finds opportunities but scoring is embedded in agent logic rather than being a standalone, testable ranking system. The fix is an Opportunity Ranking Engine that takes signal outputs, debate results, and user context as inputs and produces a ranked list of actionable opportunities. Target Phase: 5 (Intelligence and Opportunity Engine). Break 3: Review feedback loop is open. Trade results, journal notes, and performance metrics do not flow back into the system to improve MOXI behavior, signal sensitivity, or strategy parameters. The fix is a Feedback Pipeline that feeds trade outcomes and journal insights into the experiment engine and MOXI memory. Target Phase: 6 (MOXI V2).'),
  ];
}

function sec10_canonicalModels() {
  return [
    h1('10. Canonical Data Models'),
    body('This section defines the canonical data models for VIXOR V2. These models represent the target state; the current database tables may differ. Migration from current to target will be executed in Phase 2 (Data Foundation). Each model defines: ownership (which domain engine owns it), source of truth (where the authoritative data lives), identifier (primary key scheme), persistence (where and how it is stored), read/write authority (who can read and write), provider mapping (which external data sources feed it), and lifecycle (how it is created, updated, and deleted). Models are organized by layer.'),
    h2('10.1 Market Data Layer Models'),
    h3('Asset'),
    body('Ownership: market domain. Source of truth: Supabase assets table. Identifier: canonical symbol (e.g., BTC, ETH, XAU, EUR). Persistence: Supabase with Redis cache (5-minute TTL). Read authority: all authenticated users. Write authority: server-only (cron + admin). Provider mapping: Binance (crypto), TwelveData (forex, commodities, ETFs), Finnhub (fallback). Lifecycle: upserted by cron jobs and price normalization service. Fields: symbol, name, type (crypto/forex/commodity/etf), base_currency, quote_currency, is_active, provider_metadata (JSONB), created_at, updated_at.'),
    h3('Pair'),
    body('Ownership: market domain. Source of truth: computed from Asset references. Identifier: base_symbol/quote_symbol (e.g., BTC/USDT). Persistence: Supabase pairs table (currently exists but missing from types.ts per F3). Read authority: all authenticated users. Write authority: server-only. Provider mapping: derived from Asset providers. Lifecycle: created when both base and quote Assets exist and at least one price observation exists. Fields: id, base_symbol, quote_symbol, exchange, category (spot/perpetual), tick_size, lot_size, min_notional.'),
    h3('Candle'),
    body('Ownership: market domain. Source of truth: Supabase price_history table (currently exists but missing from types.ts per F3). Identifier: composite (pair, interval, timestamp_open). Persistence: Supabase with Redis cache (1-minute TTL for latest, 1-hour for historical). Read authority: all authenticated users. Write authority: server-only. Provider mapping: Binance (crypto), TwelveData (forex, commodities), DexScreener (DEX pairs). Lifecycle: appended by normalization service; historical candles backfilled by cron. Fields: pair, interval, timestamp_open, open, high, low, close, volume, provider, source_timestamp, normalized_at.'),
    h3('Ticker'),
    body('Ownership: market domain. Source of truth: in-memory (real-time) with Supabase persistence (snapshot every 5 minutes). Identifier: symbol. Persistence: Redis (real-time), Supabase (snapshot). Read authority: all authenticated users. Write authority: server-only (WebSocket handlers). Provider mapping: Binance WS (crypto), DexScreener WS (DEX). Lifecycle: updated on every WebSocket tick; expired after 60 seconds of no updates. Fields: symbol, price, price_24h_change, volume_24h, high_24h, low_24h, bid, ask, provider, last_tick_at.'),
    h2('10.2 Signal and Tracking Models'),
    h3('Signal'),
    body('Ownership: signal-tracking domain. Source of truth: Supabase signals table. Identifier: UUID. Persistence: Supabase. Read authority: owner + followers (if shared). Write authority: server-only (creation via server function, transitions via Transition Engine). Provider mapping: generated by analysis engine or MOXI. Lifecycle: created as pending, transitions through the 9-state machine defined in the Transition Engine (locked at commit 4ffad75). Fields: id, user_id, pair, direction, entry, sl, tp1, tp2, tp3, rrr, status (9-value enum), source (moxi/manual/cron), thesis, analysis_snapshot (JSONB), created_at, server_received_at, activated_at, resolved_at, invalidation_reason.'),
    h3('SignalTransition'),
    body('Ownership: signal-tracking domain. Source of truth: Supabase signal_transitions table. Identifier: UUID. Persistence: Supabase. Read authority: signal owner. Write authority: server-only (Transition Engine output). Provider mapping: internal. Lifecycle: created atomically with each state transition; immutable once written. Fields: id, signal_id, from_status, to_status, trigger (price/cancel/expire/invalidate), trigger_value, observed_at (serverReceivedAt), resolved_at, metadata (JSONB). This model is the audit trail for every state change and is the foundation for signal performance analytics.'),
    h3('Trade'),
    body('Ownership: trades domain. Source of truth: Supabase trades table. Identifier: UUID. Persistence: Supabase. Read authority: owner. Write authority: server-only (FIX: createTrade currently drops validated fields per F1). Provider mapping: created from Signal execution or manual entry. Lifecycle: created when a trade is placed, updated with exit data when closed. Fields: id, user_id, signal_id (nullable), pair, direction, entry_price, exit_price, quantity, stop_loss, take_profit, status (open/closed), entry_date, exit_date, broker, notes, created_at. F1 FIX: all validated fields must be persisted, not just entry_date and quantity.'),
    h2('10.3 Intelligence Layer Models'),
    h3('Analysis'),
    body('Ownership: analysis domain. Source of truth: Supabase analyses table. Identifier: UUID. Persistence: Supabase. Read authority: owner. Write authority: server-only (analysis engine output). Provider mapping: generated by SMC/ICT engine + VLM chart vision. Lifecycle: created on analysis request, immutable once created. Fields: id, user_id, pair, timeframe, analysis_type (smc/ict/vlm/regime), result (JSONB), confidence, regime, created_at, provider_data_snapshot (JSONB).'),
    h3('Opportunity'),
    body('Ownership: NEW domain (to be created in Phase 5). Source of truth: Supabase opportunities table (to be created). Identifier: UUID. Persistence: Supabase with Redis cache. Read authority: owner. Write authority: server-only (Opportunity Ranking Engine output). Provider mapping: aggregated from Signal, Analysis, Debate, Discovery scores. Lifecycle: created when an opportunity is identified, ranked by the Opportunity Ranking Engine, consumed by MOXI, expired after 24 hours or when market conditions change. Fields: id, user_id, asset, type (signal/analysis/discovery), score, confidence, reasoning, risk_assessment (JSONB), source_signals (UUID[]), source_analyses (UUID[]), metadata (JSONB), created_at, expires_at, consumed_at.'),
    h3('MOXIContext'),
    body('Ownership: moxi domain. Source of truth: in-memory (per-request) with Supabase persistence (moxi_conversations, moxi_messages tables, currently missing from types.ts per F3). Identifier: conversation_id + message_id. Persistence: Supabase for history, Redis for active session context. Read authority: conversation owner. Write authority: server-only. Provider mapping: aggregated from all domain engines. Lifecycle: created per conversation, context rebuilt on each message from parallel data aggregation. Fields: conversation_id, message_id, role (user/assistant/system), content, agent (coach/governor/hunter/analyst), tools_called (JSONB), context_sources (JSONB), created_at.'),
    h2('10.4 User and Platform Models'),
    h3('Portfolio'),
    body('Ownership: trades domain (derived). Source of truth: computed from Trade + position data. Identifier: user_id + asset. Persistence: computed on read (materialized view or cache). Read authority: owner. Write authority: derived (no direct writes). Provider mapping: aggregated from Trade records and real-time Ticker data. Lifecycle: recomputed on trade creation/closure and on demand. Fields: user_id, asset, quantity, avg_entry, current_price, unrealized_pnl, realized_pnl, total_pnl.'),
    h3('JournalEntry'),
    body('Ownership: notes domain. Source of truth: Supabase trading_notes table. Identifier: UUID. Persistence: Supabase. Read authority: owner. Write authority: owner. Provider mapping: created by user, optionally linked to Trade or Signal. Lifecycle: created on user input, updated on edit, never deleted (soft delete only). Fields: id, user_id, trade_id (nullable), signal_id (nullable), content, mood, tags (text[]), lesson_learned, created_at, updated_at.'),
    h3('DomainEvent'),
    body('Ownership: shared/events domain. Source of truth: Supabase domain_events table. Identifier: UUID. Persistence: Supabase. Read authority: system (for replay), owner (for notification history). Write authority: server-only (domain engines). Provider mapping: emitted by all domain engines on state transitions. Lifecycle: created atomically with the state change, processed by event handlers, archived after 90 days. Fields: id, event_type (20 defined types), aggregate_id, aggregate_type, payload (JSONB), metadata (JSONB), created_at, processed_at, handler_results (JSONB).'),
    h3('Notification'),
    body('Ownership: shared/notifications domain. Source of truth: Supabase notifications table. Identifier: UUID. Persistence: Supabase. Read authority: recipient. Write authority: server-only (notification channels). Provider mapping: triggered by DomainEvent handlers. Lifecycle: created when a notification is triggered, delivered via channel, marked as read by user. Fields: id, user_id, type, title, body, channel (in_app/telegram/email/webhook), status (pending/delivered/read/failed), event_id (nullable), metadata (JSONB), created_at, delivered_at, read_at.'),
  ];
}

module.exports = { sec7_ossMatrix, sec8_licenseMatrix, sec9_dataArch, sec10_canonicalModels };
