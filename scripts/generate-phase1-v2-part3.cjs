const m = require('./generate-phase1-v2.cjs');
const { h1, h2, h3, body, spacer, makeTable } = m;

function sec11_providerArch() {
  return [
    h1('11. Provider Architecture'),
    body('The provider architecture defines how VIXOR connects to external data sources, normalizes their output, and manages failures. The current state has 16 client files across shared/market-data/ and domain-specific clients/ directories, with 4 DEAD files and 6 PARTIAL providers that degrade gracefully without API keys. The target architecture consolidates all provider connections through a single normalization layer, eliminating provider-specific logic from domain engines.'),
    h2('11.1 Current Provider Inventory'),
    makeTable(
      ['Provider', 'Location', 'Type', 'Data', 'Status', 'Target Action'],
      [
        ['Binance REST', 'market/server/', 'REST', 'OHLCV, Ticker, OrderBook', 'REAL', 'Wrap in normalizer adapter'],
        ['Binance WS', 'shared/market-data/binance-ws.ts', 'WebSocket', 'Real-time ticker', 'REAL', 'Wrap in normalizer adapter'],
        ['DexScreener REST', 'domains/discovery/clients/dexscreener.client.ts', 'REST', 'DEX pairs, prices, volume', 'REAL', 'Wrap in normalizer adapter'],
        ['DexScreener WS', 'shared/market-data/dexscreener-ws.ts', 'WebSocket', 'Real-time DEX updates', 'REAL', 'Wrap in normalizer adapter'],
        ['TwelveData', 'domains/market/server/twelvedata.ts', 'REST', 'OHLCV, Forex, Commodities', 'PARTIAL', 'Wrap in normalizer adapter; key required'],
        ['Finnhub', 'shared/market-data/finnhub-quotes.ts', 'REST', 'Forex/Stock quotes', 'PARTIAL', 'Wrap in normalizer adapter; key required'],
        ['Birdeye', 'domains/discovery/clients/birdeye.client.ts', 'REST', 'Token metadata, trade data', 'PARTIAL', 'Enhance adapter; key required'],
        ['Helius RPC', 'domains/discovery/clients/helius.client.ts', 'RPC', 'Smart money, on-chain data', 'PARTIAL', 'Enhance adapter; key required'],
        ['LunarCrush', 'domains/discovery/clients/lunarcrush.client.ts', 'REST', 'Social sentiment, Galaxy Score', 'PARTIAL', 'Enhance adapter; key required'],
        ['Twitter/X', 'domains/discovery/clients/twitter.client.ts', 'REST', 'Social signals', 'PARTIAL', 'Enhance adapter; key required'],
        ['Mobula', 'domains/discovery/clients/mobula.client.ts', 'REST', 'Multi-chain market data', 'PARTIAL', 'Investigate; currently unwired per baseline'],
        ['CCXT', 'domains/trading/gateway/adapters/', 'REST+WS', 'Exchange execution', 'REAL', 'Keep as execution layer; not data provider'],
        ['shared/dexscreener.ts', 'shared/market-data/dexscreener.ts', 'REST', 'DEX data', 'DEAD', 'REMOVE (shadowed by discovery client)'],
        ['shared/helius-rpc.ts', 'shared/market-data/helius-rpc.ts', 'RPC', 'Helius RPC', 'DEAD', 'REMOVE (shadowed by discovery client)'],
        ['shared/alchemy-rpc.ts', 'shared/market-data/alchemy-rpc.ts', 'RPC', 'EVM RPC', 'DEAD', 'REMOVE (zero imports)'],
        ['shared/price-resolver.ts', 'shared/market-data/price-resolver.ts', 'Internal', 'Price conflict resolution', 'DEAD', 'REMOVE (zero imports; unimplemented)'],
        ['CoinGecko', 'market/server/ (via market-overview API)', 'REST', 'Fallback prices', 'REAL', 'Wrap in normalizer adapter'],
        ['GeckoTerminal', 'domains/market/server/ (analysis)', 'REST', 'DEX OHLCV for charts', 'REAL', 'Wrap in normalizer adapter'],
      ],
      [16, 32, 10, 16, 10, 26]
    ),
    h2('11.2 Normalization Contract'),
    body('Every provider adapter must implement the NormalizerAdapter interface: a function that takes provider-native data and returns a VIXOR canonical type. For price data, the target type is AssetPrice { symbol, pair, price, timestamp, provider, confidence }. For OHLCV data, the target type is Candle { pair, interval, timestamp_open, open, high, low, close, volume, provider, source_timestamp, normalized_at }. The normalization layer also handles: (a) confidence scoring based on provider reliability and data freshness, (b) deduplication when multiple providers serve the same pair, (c) fallback cascading when a primary provider fails, and (d) rate limiting per provider to respect API quotas. The normalization layer is server-side only; clients receive already-normalized data through TanStack Query hooks.'),
    h2('11.3 Provider Failure Strategy'),
    body('When a provider fails, the system follows a graceful degradation cascade: (1) Try the primary provider with a 3-second timeout, (2) Fall back to the secondary provider for the same data type, (3) Return stale cached data from Redis (with a STALE indicator in the UI), (4) Return null and display a degraded UX message ("Price data temporarily unavailable"). No provider failure should crash the application or block the user from performing other actions. This strategy is already partially implemented in the existing provider clients (they return null when keys are missing), but it is not formalized into a consistent pattern across all providers.'),
  ];
}

function sec12_intelArch() {
  return [
    h1('12. Intelligence Architecture'),
    body('The Intelligence Architecture defines how raw data and engine outputs are transformed into ranked, contextualized, actionable opportunities. This is the layer that makes VIXOR an intelligence platform rather than a data dashboard. The current state has six implemented engines (analysis, backtest, debate, risk-governor, discovery scoring, experiment) and MOXI with four agents, but there is no formal system for converting their outputs into a ranked opportunity feed. The Opportunity Ranking Engine is the missing piece.'),
    h2('12.1 Engine Inventory'),
    makeTable(
      ['Engine', 'Location', 'Input', 'Output', 'Status', 'V2 Owner'],
      [
        ['SMC/ICT Analysis', 'analysis/engine/', 'OHLCV + indicators', 'Analysis result (JSONB)', 'REAL', 'analysis domain'],
        ['Chart Vision (VLM)', 'chart-intelligence/', 'Chart screenshot', 'Chart analysis text', 'REAL', 'chart-intelligence domain'],
        ['Chart Truth', 'chart-truth/', 'Vision data + real prices', 'Truth score', 'REAL', 'chart-truth domain'],
        ['Debate Engine', 'debate/engine/', 'Analysis + thesis', 'Bull/bear consensus', 'REAL', 'debate domain'],
        ['Risk Governor', 'risk-governor/', 'Trade parameters', 'PROCEED/REDUCE/WAIT/BLOCK', 'REAL', 'risk-governor domain'],
        ['Discovery Scoring', 'discovery/scoring.ts', 'Token data + social + on-chain', '0-100 score', 'REAL', 'discovery domain'],
        ['Backtest Simulator', 'backtest/engine/', 'Strategy + historical OHLCV', 'Equity curve + metrics', 'REAL', 'backtest domain'],
        ['Signal Transition', 'signal-tracking/transition-engine.ts', 'Current state + price observation', 'New state + transition record', 'REAL (not invoked)', 'signal-tracking domain'],
        ['Opportunity Ranking', 'MISSING', 'Signals + Analyses + Debate + Context', 'Ranked opportunity list', 'MISSING', 'NEW: intelligence domain'],
        ['Regime Detection', 'analysis/engine/regime/', 'OHLCV + indicators', 'Regime label (trending/ranging/volatile)', 'REAL', 'analysis domain'],
      ],
      [18, 22, 20, 18, 10, 22]
    ),
    h2('12.2 Opportunity Ranking Engine (NEW)'),
    body('The Opportunity Ranking Engine is the single most important new architectural component. It is responsible for taking the unstructured outputs of multiple engines and producing a single, ranked, portfolio-context-aware list of actionable opportunities. Without this engine, MOXI recommendations lack priority order and the user sees ad-hoc suggestions rather than a curated intelligence feed. The engine takes as input: (a) active Signals with their confidence and source, (b) recent Analyses with their regime and pattern detection results, (c) Debate results with bull/bear consensus scores, (d) Discovery scores for new tokens, (e) user Context (current positions, risk preferences, watchlist, portfolio allocation), and (f) Risk Governor assessment. It produces as output a ranked list of Opportunity objects (defined in Section 10), each with a composite score, confidence level, reasoning, and risk assessment. The ranking algorithm uses a weighted composite of: signal confidence (30%), analysis quality (25%), debate consensus strength (15%), discovery momentum (10%), portfolio fit (10%), and risk assessment (10%). These weights are initial defaults and will be tuned based on the Review feedback loop once the system is operational.'),
  ];
}

function sec13_signalArch() {
  return [
    h1('13. Signal Architecture'),
    body('The Signal Architecture defines how trading signals are created, validated, transitioned, tracked, and resolved. This architecture preserves the existing Transition Engine (locked at commit 4ffad75, 75 passing tests) while relocating authority from the client to the server. The existing engine is a pure function with zero dependencies; the problem is not the engine design but the invocation location and the absence of atomic commits, domain events, and audit records.'),
    h2('13.1 Current State vs Target State'),
    body('Current state (BROKEN from authority perspective): The client (useSignalMonitor hook) evaluates price observations against signal levels, determines the new state, and sends the new state to the server via updateSignalTracking. The server accepts the client-determined state and writes it directly to the database. The hit_tp field, observedAt timestamp, and resolved_at timestamp are all client-controlled. The Transition Engine exists but is never called. Target state (CORRECT): An external price observation triggers a server-side function. The server invokes the Transition Engine with the observation and the current signal state. The Transition Engine returns the new state and a transition record. The server performs an atomic database commit (status + hit_tp + timestamps + transition record) within a transaction. The server emits a DomainEvent (signal.state_changed). The event handler triggers notifications via the notification system. MOXI receives the event for context update. An audit record is created. The client receives the updated state via TanStack Query refetch or Supabase Realtime.'),
    h2('13.2 Signal Lifecycle State Machine'),
    body('The signal lifecycle is defined by the Transition Engine at src/domains/signal-tracking/transition-engine.ts. The 9 states are: 2 Monitored (pending, active), 2 Intermediate (tp1_hit, tp2_hit), and 5 Terminal (tp3_hit, sl_hit, invalidated, expired, cancelled). Legal transitions are defined in PRICE_TRANSITION_MATRIX for price-driven transitions and as standalone functions for non-price transitions (cancel, expire, invalidate). The Transition Engine enforces: (a) no transitions out of terminal states, (b) SL has priority over TP at the same tick (to prevent phantom wins), (c) TP levels must be hit in order (tp1 before tp2 before tp3), and (d) invalidation, cancellation, and expiration can occur from any non-terminal state. All 75 tests verify these invariants.'),
    h2('13.3 Server Authority Protocol'),
    body('The server authority protocol defines how the Transition Engine is invoked on the server side. The protocol consists of the following steps: (1) A price observation arrives (from a cron job, WebSocket handler, or API call). (2) The server function fetches the current signal state from the database, including all active signal_trackings for the relevant pair. (3) For each active signal_tracking, the server calls evaluateSignalTransition(currentState, observation). (4) If the result is a state change, the server begins a database transaction. (5) Within the transaction, the server updates the signal_tracking status, sets hit_tp (if applicable), sets serverReceivedAt as the authoritative timestamp, creates a SignalTransition record, and emits a DomainEvent. (6) The transaction commits atomically. (7) Post-commit, the event handler triggers notifications and MOXI context updates. (8) The client receives the update via Supabase Realtime or TanStack Query refetch. This protocol ensures that signal state is never client-authoritative, all transitions are auditable, and notifications are event-driven.'),
    h2('13.4 Concurrency and Idempotency'),
    body('When multiple price observations arrive in rapid succession (e.g., during high volatility), the server must handle concurrency correctly. The chosen model is optimistic locking with a version column on the signal_tracking table. Each update includes a WHERE version = current_version clause. If the update affects zero rows, the observation is stale (the signal has already transitioned) and is discarded. This is sufficient for VIXOR because: (a) signal transitions are relatively rare events (not high-frequency), (b) the Transition Engine is deterministic (same input always produces same output), and (c) the version check prevents lost updates without the complexity of pessimistic locking. For idempotency, each observation includes a unique observation_id (derived from provider + timestamp + pair). The server checks for existing transitions with the same observation_id before processing, preventing duplicate transitions from retry logic.'),
    h2('13.5 Eight Locked Business Decisions'),
    body('The following business decisions from the Master Contract are frozen by this Architecture Decision Freeze: (A) invalidated is a pre-entry state, not a post-entry failure. A signal is invalidated before the user acts on it (regime shift, thesis invalidated). Once a signal is active (user has entered), it can only exit via TP, SL, expiry, or cancellation. (B) The authoritative timestamp for all transitions is serverReceivedAt, not client-sent timestamps. (C) TP crossing: one tick counts. If the price touches the TP level, the TP is considered hit, even if the candle closes below it. (D) Signal versioning is deferred. There is no signal version history; the current signal represents the latest state. (E) SL priority: if SL and TP would trigger on the same observation, SL wins (conservative bias). (F) TP ordering: tp1 must be hit before tp2, tp2 before tp3. (G) Terminal state protection: no transitions out of terminal states. (H) Invalidation requires a reason string, stored in the invalidation_reason field.'),
  ];
}

function sec14_moxiArch() {
  return [
    h1('14. MOXI V2 Architecture'),
    body('MOXI is VIXOR proprietary intelligent agent system and the core product differentiator. MOXI is already REAL: 4 specialized agents (Coach, Governor, Hunter, Analyst), an intent detection router, a context engine that aggregates 10+ data sources in parallel, a multi-provider LLM router with fallback chain (ZAI, Anthropic, Groq, OpenAI), and a tool registry. MOXI is not rebuilt from scratch in V2; instead, the architecture is enhanced in three ways: (1) structured context aggregation, (2) the Opportunity Ranking Engine as a tool, and (3) a feedback loop from trade outcomes to MOXI memory.'),
    h2('14.1 Current MOXI State (Preserved)'),
    makeTable(
      ['Component', 'File', 'Status', 'V2 Action'],
      [
        ['Intent Router', 'server/agent.ts', 'REAL (regex-based)', 'Keep; enhance with LLM-based intent for complex queries'],
        ['Coach Agent', 'server/coach.agent.ts', 'REAL', 'Keep; add post-trade feedback loop'],
        ['Governor Agent', 'server/governor.agent.ts', 'REAL', 'Keep; connect to Opportunity Ranking Engine'],
        ['Hunter Agent', 'server/hunter.agent.ts', 'REAL', 'Refactor: extract ranking logic to standalone engine'],
        ['Analyst Agent', 'server/analyst.agent.ts', 'REAL', 'Keep; add regime-aware context injection'],
        ['Feedback Handler', 'server/feedback.ts', 'REAL', 'Keep; enhance with learning storage'],
        ['LLM Router', 'shared/llm/router.ts', 'REAL', 'Keep; add per-agent provider preferences'],
        ['Context Engine', 'moxi/context/', 'REAL', 'Enhance: add structured context types'],
        ['Tool Registry', 'shared/tool-registry/', 'PARTIAL (8 tools, 2/9 categories)', 'Expand: add all 9 categories'],
        ['Memory Store', 'shared/memory/', 'REAL (Supabase-based)', 'Keep; evaluate Mem0 as optional POC'],
      ],
      [18, 30, 20, 42]
    ),
    h2('14.2 V2 Context Architecture'),
    body('The V2 MOXI context architecture defines eight structured context types that are aggregated in parallel on each MOXI request. The current context engine aggregates data sources but does not have formal types. The V2 types are: (1) Market Context: current regime (trending/ranging/volatile), sector performance, correlation heatmap. (2) Asset Context: current price, 24h metrics, technical indicators, recent analysis results. (3) Signal Context: active signals for the asset, recent signal outcomes, signal performance by source. (4) Risk Context: portfolio exposure, risk governor assessment, correlation with existing positions. (5) Portfolio Context: current positions, allocation, PnL, drawdown status. (6) User Context: preferences, risk tolerance, watchlist, recent journal entries, learning history. (7) Historical Context: past MOXI recommendations for this asset/user, outcomes, user feedback. (8) Behavior Context: user activity patterns, preferred assets, typical session times. These eight context types are aggregated in parallel (Promise.all) and passed to the relevant MOXI agent as structured input rather than raw data dumps.'),
    h2('14.3 MOXI Intelligence Pipeline'),
    body('The V2 MOXI pipeline enhances the current flow with two new stages: Opportunity Ranking and Risk Guard. The pipeline is: Context Aggregation (parallel fetch of 8 context types) then Opportunity Ranking (if Hunter or general query: run Opportunity Ranking Engine) then Reasoning (relevant agent processes context + opportunity data) then Risk Guard (Governor agent evaluates recommendation against risk rules) then Recommendation (produce structured output with thesis, confidence, entry/SL/TP, reasoning) then Action (user accepts, modifies, or rejects) then Follow-up (if accepted: create signal; if rejected: store feedback) then Review (after signal resolves: feed outcome back to memory and learning). This pipeline ensures every MOXI recommendation is grounded in real data, ranked against alternatives, validated against risk constraints, and fed back into the system for improvement.'),
    h2('14.4 Mastra Evaluation'),
    body('Mastra is classified as C (POC). The POC must answer three questions within a 2-week timebox: (1) Does Mastra provide meaningful workflow orchestration improvements over Vercel AI SDK with custom tooling and maxSteps? (2) Does Mastra memory significantly improve over the existing Supabase-based memory store? (3) Does Mastra RAG provide value for the MOXI context engine? If the POC fails on any question, Mastra is REJECTED and Vercel AI SDK remains the primary AI orchestration layer. The POC is a bounded, isolated experiment with no impact on production code. The fallback path is: multi-step reasoning via Vercel AI SDK maxSteps + tools, memory via enhanced Supabase store, and RAG via custom embedding + vector search.'),
  ];
}

module.exports = { sec11_providerArch, sec12_intelArch, sec13_signalArch, sec14_moxiArch };
