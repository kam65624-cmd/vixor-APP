const m = require('./generate-phase1-v2.cjs');
const { h1, h2, h3, body, spacer, makeTable } = m;

function sec19_migration() {
  return [
    h1('19. Current to V2 Migration Map'),
    body('This section defines the migration path from the current codebase state to the V2 architecture target. The migration is incremental: each phase delivers independent value and no phase blocks the next. The migration preserves all PROVEN capabilities, fixes all BROKEN and DEAD items, and builds the three missing pipelines (normalization, intelligence, feedback). Items marked PRESERVED are kept as-is. Items marked FIX are repaired to their intended behavior. Items marked REFACTOR are restructured without changing behavior. Items marked REBUILD are replaced with new implementations. Items marked REMOVE are deleted.'),
    makeTable(
      ['Component', 'Current State', 'V2 Action', 'Phase', 'Key Files'],
      [
        ['Signal Transition Engine', 'REAL (not invoked server-side)', 'PRESERVE + FIX invocation', 'Phase 4', 'signal-tracking/transition-engine.ts'],
        ['SMC/ICT Analysis Engine', 'REAL', 'PRESERVE + refactor out provider logic', 'Phase 3', 'analysis/engine/engine.ts'],
        ['MOXI Agents (4)', 'REAL', 'PRESERVE + enhance context', 'Phase 6', 'moxi/server/*.agent.ts'],
        ['LLM Router', 'REAL', 'PRESERVE + per-agent preferences', 'Phase 6', 'shared/llm/router.ts'],
        ['Notification System', 'REAL', 'PRESERVE + async delivery', 'Phase 7', 'shared/notifications/'],
        ['Discovery Scoring', 'REAL', 'PRESERVE + enhance with real data', 'Phase 5', 'discovery/scoring.ts'],
        ['Backtest Simulator', 'REAL', 'PRESERVE + evaluate backtest-kit POC', 'Phase 3', 'backtest/engine/simulator.ts'],
        ['Wallet SIWE', 'REAL', 'PRESERVE', 'Phase 8', 'wallet/functions.ts'],
        ['Trading Gateway', 'REAL', 'PRESERVE', 'Phase 4', 'trading/gateway/adapters/'],
        ['createTrade Function', 'BROKEN', 'FIX: persist all validated fields', 'Phase 2', 'trades/functions.ts'],
        ['Event Bus', 'DEAD', 'REBUILD: register handlers', 'Phase 7', 'shared/events/'],
        ['Provider Clients (4 DEAD)', 'DEAD', 'REMOVE', 'Phase 2', 'shared/market-data/{dexscreener,helius-rpc,alchemy-rpc,price-resolver}.ts'],
        ['debate/index.ts', 'DEAD', 'REMOVE', 'Phase 2', 'domains/debate/index.ts'],
        ['Orphaned Routes (2)', 'DEAD', 'REMOVE', 'Phase 9', 'routes/_authenticated/{activity-web3,communities}.tsx'],
        ['Orphaned Storybook (8)', 'DEAD', 'REMOVE', 'Phase 2', 'components/vixor/*.stories.tsx'],
        ['Duplicate Webhooks', 'DUPLICATE', 'FIX: unify telegram-webhook + stars-webhook', 'Phase 2', 'server/api/telegram-webhook.ts, stars-webhook.ts'],
        ['Duplicate Agent Panels', 'DUPLICATE', 'REFACTOR: extract AgentResponseLayout', 'Phase 9', 'components/vixor/Coach*,Hunter*,Governor*,Analyst*'],
        ['Duplicate Charts', 'DUPLICATE', 'REFACTOR: extract useLightweightChart hook', 'Phase 2', 'CandlestickChart.tsx, DexChart.tsx'],
        ['Supabase Types', 'PARTIAL (18 tables missing)', 'FIX: regenerate types', 'Phase 2', 'shared/supabase/types.ts'],
        ['Unused Dependencies (10)', 'DEAD WEIGHT', 'REMOVE', 'Phase 2', 'package.json'],
        ['Lock Files (3)', 'CLUTTER', 'FIX: keep pnpm only', 'Phase 2', 'package-lock.json, bunfig.toml'],
        ['Data Normalization', 'MISSING', 'BUILD', 'Phase 2', 'NEW: shared/normalization/'],
        ['Opportunity Ranking', 'MISSING', 'BUILD', 'Phase 5', 'NEW: domains/intelligence/ranking/'],
        ['Feedback Pipeline', 'MISSING', 'BUILD', 'Phase 6', 'NEW: shared/feedback/'],
      ],
      [22, 22, 24, 10, 32]
    ),
  ];
}

function sec20_tasksReplanning() {
  return [
    h1('20. Tasks 2-7 Replanning'),
    body('The old Tasks 2 through 7 (from the VIXOR_Master_Roadmap_Tasks_v2 document and the Product Intelligence Architecture V2) are formally REPLANNED. They are not executed in their old form. The old tasks were designed before the Phase 0 Reality Baseline exposed critical infrastructure gaps (F1-F18) and before the server authority requirement was fully understood. The new task structure incorporates the old task intent while respecting the dependency order required by the V2 architecture. Task 1 (Signal Contract Audit) and Task 1.2C (Transition Engine unification) are PRESERVED and LOCKED at commit 4ffad75.'),
    h2('20.1 Old Task Mapping'),
    makeTable(
      ['Old Task', 'Old Intent', 'Why Old Order Invalid', 'New Task ID(s)', 'New Phase'],
      [
        ['Task 2.1: Server Authority Timestamps', 'Migrate timestamps to serverReceivedAt', 'Depends on createTrade fix (F1) and types fix (F3) which were unknown', 'V2-4-01', 'Phase 4'],
        ['Task 2.2: VIXOR Unified Price Model', 'Define canonical AssetPrice type', 'Still valid but must follow data types fix (F3) and dead code removal (F5)', 'V2-2-02', 'Phase 2'],
        ['Task 2.3: Data Normalization Service', 'Build provider adapters', 'Depends on Price Model and cleanup of 4 DEAD client files (F5)', 'V2-2-03', 'Phase 2'],
        ['Task 2.4: Analysis Engine Refactor', 'Remove provider-specific logic', 'Depends on normalization service', 'V2-3-01', 'Phase 3'],
        ['Task 2.5: Opportunity Ranking Engine v1', 'Extract ranking from hunter.agent', 'Depends on normalization and analysis refactor', 'V2-5-01', 'Phase 5'],
        ['Task 3.1: Mem0 POC', 'Evaluate Mem0 for MOXI memory', 'Still valid; lower priority than infrastructure fixes', 'V2-6-02', 'Phase 6'],
        ['Task 3.2: Mem0 Integration', 'Integrate if POC passes', 'Conditional on POC', 'V2-6-03', 'Phase 6'],
        ['Task 3.3: technicalindicators Adapter', 'Wrap 50+ indicators', 'Valid; depends on normalization', 'V2-3-02', 'Phase 3'],
        ['Task 3.4: Birdeye Adapter Enhancement', 'Solana token intelligence', 'Valid; depends on normalization', 'V2-5-02', 'Phase 5'],
        ['Task 3.5: LunarCrush Adapter', 'Social sentiment', 'Valid; depends on normalization', 'V2-5-03', 'Phase 5'],
        ['Task 3.6: DeFiLlama Adapter', 'DeFi protocol data', 'Valid; depends on normalization', 'V2-3-03', 'Phase 3'],
        ['Task 3.7: backtest-kit POC', 'Evaluate TS backtesting', 'Valid; depends on normalization', 'V2-3-04', 'Phase 3'],
        ['Task 4.1: Navigation Restructure', '6-item primary nav', 'Depends on route consolidation decision', 'V2-9-01', 'Phase 9'],
        ['Task 4.2-4.11: Page Consolidations', 'Merge 41 routes to 12', 'Depends on navigation + data + signal fixes', 'V2-9-02 through V2-9-10', 'Phase 9'],
      ],
      [22, 24, 24, 22, 14]
    ),
    h2('20.2 Preserved Work'),
    body('The following completed work is preserved and incorporated into the V2 architecture without modification: (1) Task 1: Signal Contract Audit (locked at commit 4ffad75, preserved in 32bbf14) including the 9-value signal_status enum, TERMINAL/INTERMEDIATE/MONITORED status arrays, the PRICE_TRANSITION_MATRIX, and all 75 unit tests. (2) Task 1.2C: Signal Transition Engine unification including the pure-function evaluateSignalTransition, the notification gate (gated to terminal states only), the resolved_at field (gated to terminal states), and the P1-6 TODO markers for server timestamps. (3) All 307 existing tests across 18 test files. (4) All REAL domain engines (23 domains, 18 REAL). (5) All REAL market data connections (12 providers). (6) All REAL UI components (48 vixor + 41 shadcn).'),
  ];
}

function sec21_phaseMap() {
  return [
    h1('21. Complete V2 Phase Map'),
    body('This section defines the complete V2 execution structure with 15 phases (0-14, with Phase 0 complete and Phase 1 current). Each phase has defined inputs, outputs, dependencies, tasks, affected files/domains, risks, tests, and exit criteria. A phase is not complete because code exists; a capability is PROVEN only when implementation exists, is wired, is runtime-used, is tested, has production path verified, has no core mock dependency, has no critical regression, and has been verified in the target deployment environment.'),
    makeTable(
      ['Phase', 'Name', 'Input', 'Output', 'Dependencies', 'Key Tasks'],
      [
        ['0', 'Reality Audit', 'Repository at 32bbf14', 'VIXOR_REALITY_BASELINE.docx', 'None', 'Audit all domains, routes, providers, signals, MOXI'],
        ['1', 'Architecture Freeze', 'Baseline + Master Contract', 'This document', 'Phase 0', 'All architectural decisions, OSS matrix, task register'],
        ['2', 'Data Foundation', 'Phase 1 document', 'Normalized data pipeline, fixed types, cleaned code', 'Phase 1', 'F1-F6, F9-F10, F12-F15, F17; data normalizer; Price Model'],
        ['3', 'Analytics & Research', 'Phase 2 data pipeline', 'Enhanced analysis with adapters', 'Phase 2', 'TA indicators adapter, DeFiLlama, backtest-kit POC, analysis refactor'],
        ['4', 'Signal Authority', 'Phase 2 + Phase 3', 'Server-authoritative signal tracking', 'Phase 2, Phase 3', 'V2-4-01: Server-side Transition Engine invocation; F7 fix'],
        ['5', 'Intelligence Engine', 'Phase 4 (server authority)', 'Opportunity Ranking Engine, enhanced discovery', 'Phase 4', 'V2-5-01: Ranking Engine; Birdeye/LunarCrush adapters; whale real data'],
        ['6', 'MOXI V2', 'Phase 5 (ranking output)', 'Enhanced MOXI with structured context + feedback', 'Phase 5', 'Context architecture, Mem0 POC, feedback pipeline, Mastra POC'],
        ['7', 'Events & Jobs', 'Phase 4 (signal events)', 'Working event bus + durable job system', 'Phase 4', 'F4 fix: register handlers; async notifications; job queue'],
        ['8', 'Frontend Data & State', 'Phase 2-7 backend', 'Normalized client data layer', 'Phase 7', 'TanStack Query hooks for normalized data, Zustand stores, wallet UX'],
        ['9', 'Product/UX Consolidation', 'Phase 8 (data layer)', '12 core experiences, consolidated routes', 'Phase 8', 'Route consolidation, navigation restructure, F8/F11/F16 fixes'],
        ['10', 'UI Design System V2', 'Phase 9 (routes)', 'Polished visual design, responsive layout', 'Phase 9', 'Agent panel dedup (F8), i18n fix (F11), chart dedup (F9)'],
        ['11', 'Product Intelligence', 'Phase 10 (UI)', 'Observability, analytics, monitoring', 'Phase 10', 'Activate analytics (F6), error tracking (F6), PostHog evaluation'],
        ['12', 'Security/Reliability', 'Phase 11', 'Security audit, rate limiting, credential rotation', 'Phase 11', 'Security review, credential rotation, RLS audit, API key validation'],
        ['13', 'Integration/E2E', 'Phase 12', 'End-to-end product verification', 'Phase 12', 'E2E tests for critical journeys, integration tests, performance tests'],
        ['14', 'QA/Verification', 'Phase 13', 'Production-ready release', 'Phase 13', 'Full regression, performance benchmarks, accessibility audit'],
      ],
      [6, 16, 18, 18, 12, 40]
    ),
  ];
}

function sec22_depGraph() {
  return [
    h1('22. Dependency Graph'),
    body('The dependency graph defines the hard and soft dependencies between phases. Hard dependencies mean a phase cannot begin until its dependency phase is complete. Soft dependencies mean a phase can begin in parallel but will benefit from the dependency phase being complete. The critical path is Phase 0 to Phase 1 to Phase 2 to Phase 3 to Phase 4 to Phase 5 to Phase 6 to Phase 7 to Phase 8 to Phase 9 to Phase 10 to Phase 11 to Phase 12 to Phase 13 to Phase 14. However, several phases can be parallelized:'),
    h2('22.1 Parallelization Opportunities'),
    makeTable(
      ['Phase', 'Hard Dependencies', 'Can Parallel With', 'Critical Path?'],
      [
        ['Phase 2: Data Foundation', 'Phase 1', 'Nothing (foundation phase)', 'YES'],
        ['Phase 3: Analytics', 'Phase 2', 'Phase 4 (signal authority)', 'YES (data pipeline needed first)'],
        ['Phase 4: Signal Authority', 'Phase 2', 'Phase 3', 'YES (but can start data fixes in parallel with Phase 3)'],
        ['Phase 5: Intelligence', 'Phase 4', 'Phase 6 (MOXI), Phase 7 (Events)', 'YES (needs server authority first)'],
        ['Phase 6: MOXI V2', 'Phase 5', 'Phase 7', 'NO (MOXI POCs can start in parallel with Phase 5)'],
        ['Phase 7: Events & Jobs', 'Phase 4 (signal events)', 'Phase 6, Phase 8', 'NO (job queue can be built independently)'],
        ['Phase 8: Frontend Data', 'Phase 7 (event-driven data)', 'Phase 9 (route consolidation planning)', 'NO'],
        ['Phase 9: UX Consolidation', 'Phase 8', 'Phase 10', 'YES (routes need data layer first)'],
        ['Phase 10: Design System', 'Phase 9', 'Phase 11', 'NO (can start design tokens independently)'],
        ['Phase 11: Product Intelligence', 'Phase 10', 'Phase 12', 'NO'],
        ['Phase 12: Integration', 'Phase 11', 'Nothing', 'YES (final integration gate)'],
      ],
      [22, 26, 26, 26]
    ),
  ];
}

function sec23_riskRegister() {
  return [
    h1('23. Risk Register'),
    makeTable(
      ['Risk', 'Impact', 'Likelihood', 'Mitigation', 'Owner'],
      [
        ['Mem0 POC fails (latency, complexity)', 'Medium', 'Low', 'Fallback: enhanced Supabase context table with manual loading; existing memory store is REAL', 'Phase 6 lead'],
        ['backtest-kit POC fails (immature, limited)', 'High', 'Medium', 'Fallback: keep existing backtest engine (REAL, 200 candles <500ms KPI); add indicators incrementally', 'Phase 3 lead'],
        ['Mastra POC fails (overlap with AI SDK)', 'Low', 'Low', 'Fallback: custom multi-step in Vercel AI SDK (maxSteps + tools); current MOXI already works', 'Phase 6 lead'],
        ['Page consolidation breaks existing UX', 'High', 'Medium', 'Incremental migration: build new pages alongside old, switch when ready; A/B test if possible', 'Phase 9 lead'],
        ['Data normalizer performance bottleneck', 'Medium', 'Low', 'Redis caching at normalization layer; lazy normalization; batch processing for historical data', 'Phase 2 lead'],
        ['Server authority migration breaks signal tracking', 'Critical', 'Low', 'Run all 75 Transition Engine tests in new server context; add integration tests for the authority protocol', 'Phase 4 lead'],
        ['Provider API changes break normalizer adapters', 'Medium', 'Medium', 'Adapter pattern isolates provider changes; add provider health monitoring and auto-fallback', 'Phase 2 lead'],
        ['tulip-node LGPL compliance issues', 'Medium', 'Low', 'Use technicalindicators (MIT) as default; tulip-node only if POC proves significant value and legal approves', 'Phase 3 lead'],
        ['Trigger.dev AGPL network copyleft', 'Medium', 'Low', 'Use as hosted SaaS only (no self-hosting); or defer to Supabase-based job queue', 'Phase 7 lead'],
        ['Existing 307 tests break during refactoring', 'Medium', 'Medium', 'Run full test suite after every task; fix tests before proceeding; no task is done with failing tests', 'All leads'],
      ],
      [32, 10, 12, 34, 16]
    ),
  ];
}

function sec24_verificationStrategy() {
  return [
    h1('24. Verification Strategy'),
    body('The verification strategy defines how each phase is verified before being marked complete. The standard is: a capability is PROVEN only when implementation exists, is wired, is runtime-used, is tested, has production path verified, has no core mock dependency, has no critical regression, and has been verified in the target deployment environment. This section defines the verification methods for each phase.'),
    makeTable(
      ['Phase', 'Unit Tests', 'Integration Tests', 'E2E Tests', 'Manual Verification'],
      [
        ['Phase 2: Data Foundation', 'Price Model types, normalizer unit tests', 'Provider adapter integration with real APIs', 'Verify normalized data appears in existing routes', 'Compare data quality before/after'],
        ['Phase 3: Analytics', 'TA indicator calculation tests', 'Analysis engine with normalized data', 'Analyze page shows enriched indicators', 'Compare analysis quality before/after'],
        ['Phase 4: Signal Authority', 'Transition Engine (existing 75 tests) + server invocation tests', 'Server-side transition with mock observations', 'Create signal, send price observation, verify state change', 'Verify client cannot set state directly'],
        ['Phase 5: Intelligence', 'Ranking algorithm tests', 'Ranking with real engine outputs', 'MOXI shows ranked opportunities', 'Compare opportunity quality before/after'],
        ['Phase 6: MOXI V2', 'Context assembly tests', 'MOXI with structured context', 'MOXI response quality improvement', 'Compare MOXI response before/after'],
        ['Phase 7: Events', 'Event handler unit tests', 'End-to-end event flow', 'Signal transition triggers notification', 'Verify event persistence in domain_events'],
        ['Phase 8: Frontend', 'Hook tests', 'Data flow from server to component', 'All pages render with normalized data', 'Verify no mock data in production paths'],
        ['Phase 9: UX', 'Route tests', 'Navigation flow tests', 'Complete user journey: discover to review', 'User testing on mobile and desktop'],
        ['Phase 10: Design', 'Component tests', 'Visual regression tests', 'Responsive layout verification', 'Design review against Figma/specs'],
      ],
      [18, 16, 20, 22, 24]
      ),
  ];
}

function sec25_finalGates() {
  return [
    h1('25. Final Architecture Gates'),
    body('The architecture defines 18 final product gates that must be met before the VIXOR V2 transformation is considered complete. These gates are derived from the Master Transformation Contract and validated against the Phase 0 Reality Baseline. Each gate maps to specific phases and tasks.'),
    makeTable(
      ['#', 'Gate', 'Verification Method', 'Phase', 'Status'],
      [
        ['1', 'Discover uses real market data', 'API call verification, no mock data in code path', 'Phase 2 + Phase 5', 'BLOCKED'],
        ['2', 'Opportunities are computed, not hardcoded', 'Opportunity Ranking Engine unit + integration tests', 'Phase 5', 'BLOCKED'],
        ['3', 'Analyze uses canonical asset/market data', 'Normalized data verification in analysis engine', 'Phase 3', 'BLOCKED'],
        ['4', 'MOXI receives the same context as analysis', 'Context assembly tests, MOXI integration tests', 'Phase 6', 'BLOCKED'],
        ['5', 'MOXI recommendation has explainable inputs', 'Structured context output verification', 'Phase 6', 'BLOCKED'],
        ['6', 'Risk Guard can veto unsafe recommendation', 'Governor agent tests with edge cases', 'Phase 4', 'BLOCKED'],
        ['7', 'Setup contains validated Entry/SL/TP/R:R/Invalidation', 'Signal creation validation tests', 'Phase 4', 'BLOCKED'],
        ['8', 'Signal lifecycle is server-authoritative', 'Server invocation tests, client authority prevention', 'Phase 4', 'BLOCKED'],
        ['9', 'Signal transitions are auditable', 'SignalTransition records in DB, query tests', 'Phase 4', 'BLOCKED'],
        ['10', 'Notifications are event-driven', 'Event handler verification, notification delivery tests', 'Phase 7', 'BLOCKED'],
        ['11', 'Track uses real state changes', 'Server-side Transition Engine invocation', 'Phase 4', 'BLOCKED'],
        ['12', 'Review uses real completed data', 'Journal + performance metrics with real trade outcomes', 'Phase 8', 'BLOCKED'],
        ['13', 'Learning uses scoped historical context', 'Feedback pipeline tests', 'Phase 6', 'BLOCKED'],
        ['14', 'Core journeys contain no mock data', 'Code path audit for mock data references', 'Phase 2-9', 'BLOCKED'],
        ['15', 'Provider failures produce degraded UX', 'Failure injection tests, stale data display', 'Phase 2', 'BLOCKED'],
        ['16', 'Dead routes are removed/merged', 'Route inventory verification', 'Phase 9', 'BLOCKED'],
        ['17', 'Duplicate implementations are consolidated', 'Code duplication audit', 'Phase 2, Phase 9', 'BLOCKED'],
        ['18', 'Core UX has no dead ends', 'E2E navigation tests', 'Phase 13', 'BLOCKED'],
      ],
      [4, 36, 30, 14, 16]
    ),
  ];
}

function sec26_taskRegister() {
  return [
    h1('26. Master Implementation Task Register'),
    body('This register contains every implementation task created by this Architecture Decision Freeze. Tasks are atomic: each has a single clear deliverable. Tasks are ordered by phase and dependency. Each task follows the Task Design Standard (Section 22 of the Master Contract) with all required fields. This register is the authoritative task list for Phases 2 through 14. No task outside this register may be implemented.'),
    h2('26.1 Phase 2: Data Foundation'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-2-01', 'Fix createTrade field dropping (F1)', 'P0', 'All validated fields persisted to DB', 'None', 'domains/trades/functions.ts'],
        ['V2-2-02', 'Define VIXOR Canonical Price Model', 'P1', 'Unified AssetPrice + Candle types', 'None', 'NEW: shared/normalization/types.ts'],
        ['V2-2-03', 'Build Data Normalization Service', 'P1', 'Provider adapters output canonical types', 'V2-2-02', 'NEW: shared/normalization/'],
        ['V2-2-04', 'Fix 18 missing DB table types (F3)', 'P1', 'All 47 tables in types.ts', 'None', 'shared/supabase/types.ts'],
        ['V2-2-05', 'Fix signal_status enum mismatch (F12)', 'P1', 'Invalidated in DB type union', 'None', 'shared/supabase/types.ts'],
        ['V2-2-06', 'Remove 4 DEAD client files (F5)', 'P2', 'Clean shared/market-data/', 'None', 'shared/market-data/{dexscreener,helius-rpc,alchemy-rpc,price-resolver}.ts'],
        ['V2-2-07', 'Remove 10 unused dependencies (F6)', 'P2', 'Clean package.json', 'None', 'package.json'],
        ['V2-2-08', 'Unify duplicate webhooks (F10)', 'P2', 'Single Telegram webhook handler', 'None', 'server/api/telegram-webhook.ts, stars-webhook.ts'],
        ['V2-2-09', 'Remove dead debate/index.ts (F15)', 'P2', 'Clean debate domain', 'None', 'domains/debate/index.ts'],
        ['V2-2-10', 'Remove orphaned Storybook stories (F14)', 'P2', 'Clean components/vixor/', 'None', 'components/vixor/*.stories.tsx'],
        ['V2-2-11', 'Consolidate lock files (F17)', 'P2', 'pnpm-lock.yaml only', 'None', 'package-lock.json, bunfig.toml'],
        ['V2-2-12', 'Complete .env.example (F13)', 'P1', 'All 25+ vars documented', 'None', '.env.example'],
        ['V2-2-13', 'Refactor duplicate chart components (F9)', 'P2', 'Shared useLightweightChart hook', 'None', 'CandlestickChart.tsx, DexChart.tsx'],
        ['V2-2-14', 'Add CI pipeline (F18)', 'P1', 'GitHub Actions: typecheck + lint + test', 'None', '.github/workflows/'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.2 Phase 3: Analytics & Research'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-3-01', 'Refactor analysis engine for normalized data', 'P1', 'Remove provider-specific logic', 'V2-2-03', 'analysis/engine/'],
        ['V2-3-02', 'Integrate technicalindicators adapter', 'P1', '50+ TA indicators in Analyze page', 'V2-2-03', 'analysis/engine/indicators/'],
        ['V2-3-03', 'Integrate DeFiLlama adapter', 'P2', 'DeFi protocol data (TVL, yields)', 'V2-2-03', 'NEW: shared/market-data/defillama.client.ts'],
        ['V2-3-04', 'Evaluate backtest-kit POC', 'P1', 'TS-native backtesting assessment', 'V2-2-03', 'backtest/engine/'],
        ['V2-3-05', 'Enhance Forex/Commodity price pipeline', 'P1', 'Reliable forex data', 'V2-2-03', 'market/server/twelvedata.ts, finnhub-quotes.ts'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.3 Phase 4: Signal Authority & Execution State'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-4-01', 'Server-side Transition Engine invocation', 'P0', 'All transitions server-authoritative', 'V2-2-04, V2-3-01', 'signal-tracking/functions.ts, transition-engine.ts'],
        ['V2-4-02', 'Implement SignalTransition audit records', 'P0', 'Every transition recorded', 'V2-4-01', 'NEW: signal_transitions table operations'],
        ['V2-4-03', 'Signal event emission on transition', 'P1', 'Domain events on state change', 'V2-4-01', 'signal-tracking/functions.ts, shared/events/'],
        ['V2-4-04', 'Implement optimistic locking on signal_tracking', 'P0', 'Concurrent observation safety', 'V2-4-01', 'signal_tracking table (add version column)'],
        ['V2-4-05', 'Client migration: remove evaluateTrackingPrice', 'P0', 'Client displays only, never decides', 'V2-4-01', 'shared/hooks/use-signal-monitor.ts'],
        ['V2-4-06', 'Move arbitrage from MOCK to REAL mode', 'P2', 'Real Jupiter/Axiom execution', 'V2-2-03', 'domains/arbitrage/config.ts'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.4 Phase 5: Intelligence & Opportunity Engine'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-5-01', 'Build Opportunity Ranking Engine v1', 'P1', 'Standalone ranking module', 'V2-4-01', 'NEW: domains/intelligence/ranking/'],
        ['V2-5-02', 'Enhance Birdeye adapter for token intelligence', 'P2', 'Real token metadata and analytics', 'V2-2-03', 'discovery/clients/birdeye.client.ts'],
        ['V2-5-03', 'Enhance LunarCrush adapter for social sentiment', 'P2', 'Real social data in MOXI context', 'V2-2-03', 'discovery/clients/lunarcrush.client.ts'],
        ['V2-5-04', 'Build real whale monitoring', 'P2', 'Blockchain whale tracking (not user trades)', 'V2-5-02', 'domains/discovery/clients/helius.client.ts'],
        ['V2-5-05', 'Wire Mobula client into discovery pipeline', 'P2', 'Mobula data in scoring', 'V2-2-03', 'discovery/clients/mobula.client.ts'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.5 Phase 6: MOXI V2'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-6-01', 'Implement structured MOXI context types', 'P1', '8 context types aggregated in parallel', 'V2-5-01', 'moxi/context/'],
        ['V2-6-02', 'Evaluate Mem0 POC for MOXI memory', 'P2', '2-week POC with clear pass/fail', 'None', 'shared/memory/'],
        ['V2-6-03', 'Integrate Mem0 (conditional on POC)', 'P2', 'Persistent MOXI memory', 'V2-6-02', 'shared/memory/'],
        ['V2-6-04', 'Implement feedback pipeline', 'P1', 'Trade outcomes improve MOXI', 'V2-4-02', 'NEW: shared/feedback/'],
        ['V2-6-05', 'Evaluate Mastra POC', 'P2', '2-week POC vs Vercel AI SDK', 'None', 'moxi/server/'],
        ['V2-6-06', 'Expand MOXI tool registry (7 empty categories)', 'P1', 'All 9 categories populated', 'V2-5-01', 'shared/tool-registry/'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.6 Phase 7: Background Jobs & Events'),
    makeTable(
      ['Task ID', 'Title', 'Priority', 'Goal', 'Dependencies', 'Files/Domain'],
      [
        ['V2-7-01', 'Register event handlers for 6 emitted events', 'P1', 'Event bus alive in production', 'V2-4-03', 'shared/events/'],
        ['V2-7-02', 'Enable event persistence', 'P1', 'All events stored in domain_events', 'V2-7-01', 'shared/events/persist.ts'],
        ['V2-7-03', 'Build Supabase-based job queue', 'P1', 'Durable job processing', 'None', 'NEW: shared/jobs/'],
        ['V2-7-04', 'Migrate notification delivery to async jobs', 'P1', 'Notifications do not block update path', 'V2-7-03', 'shared/notifications/'],
      ],
      [12, 30, 8, 22, 14, 24]
    ),
    h2('26.7 Phases 8-14 (Summary)'),
    body('Phase 8 (Frontend Data & State): V2-8-01 through V2-8-05 covering normalized TanStack Query hooks, Zustand store updates, and wallet UX enhancement. Phase 9 (Product/UX Consolidation): V2-9-01 through V2-9-10 covering navigation restructure, 12 core experience builds, route consolidation execution, agent panel dedup (F8), i18n fix (F11), and dead route removal (F16). Phase 10 (UI Design System V2): V2-10-01 through V2-10-04 covering design tokens, responsive layout system, and visual polish. Phase 11 (Product Intelligence): V2-11-01 through V2-11-03 covering analytics activation, error tracking, and PostHog evaluation. Phase 12 (Security): V2-12-01 through V2-12-04 covering security audit, credential rotation, RLS verification, and API key validation. Phase 13 (Integration/E2E): V2-13-01 through V2-13-05 covering E2E tests for all 8 product loop phases, integration tests, and performance benchmarks. Phase 14 (QA/Verification): V2-14-01 through V2-14-03 covering full regression, accessibility audit, and production release verification. Detailed task definitions for Phases 8-14 will be expanded during Phase 7 execution when the full system state is known.'),
  ];
}

function sec27_humanApproval() {
  return [
    h1('27. Decisions Requiring Human Approval'),
    body('The following decisions are explicitly flagged as requiring human approval before implementation. These are decisions where reasonable engineers may disagree, where legal or business considerations apply, or where the cost of the wrong decision is high. The architecture document records the recommended path, but implementation must not proceed until explicit approval is given for each item.'),
    makeTable(
      ['#', 'Decision', 'Recommendation', 'Impact If Wrong', 'Approval Needed From'],
      [
        ['1', 'Mastra: POC or reject', 'POC with 2-week timebox; fallback to Vercel AI SDK', 'Low (fallback exists)', 'Tech Lead'],
        ['2', 'tulip-node: POC or reject', 'REJECT; use technicalindicators (MIT, pure JS)', 'Low (technicalindicators covers need)', 'Tech Lead'],
        ['3', 'Trigger.dev: integrate or retain Vercel cron', 'RETAIN Vercel cron; add Supabase job queue for durability', 'Medium (job reliability)', 'Tech Lead'],
        ['4', 'DeFiLlama: integrate or defer', 'INTEGRATE as adapter (Phase 3)', 'Low (free API, MIT license)', 'Product'],
        ['5', 'OpenBB: adapter or reject', 'REJECT (AGPL license)', 'None (rejected)', 'Legal'],
        ['6', 'Hummingbot: adapter or reference', 'REFERENCE ONLY (study Connector pattern)', 'None (reference only)', 'Tech Lead'],
        ['7', 'Portfolio architecture: trade-derived vs wallet-balances', 'HYBRID: wallet balances as primary, trade-derived as secondary', 'High (affects Portfolio UX)', 'Product + Tech Lead'],
        ['8', 'Event persistence: all events or critical-only', 'CRITICAL-ONLY: signal, trade, alert, analysis events persisted', 'Medium (storage cost vs audit coverage)', 'Tech Lead'],
        ['9', 'Route consolidation: 12 experiences or alternative', '12 experiences as defined in Section 17', 'High (affects entire UX)', 'Product + Design'],
        ['10', 'On-chain scope: full or minimal', 'MINIMAL for MVP: Discovery + Helius/Birdeye only', 'High (development cost)', 'Product + Business'],
        ['11', 'Futures/perpetuals scope: build or defer', 'DEFER to post-MVP (current data is trade-derived only)', 'Medium (market segment)', 'Product + Business'],
        ['12', 'Social/community scope: build or defer', 'DEFER to post-MVP (no social features exist)', 'Medium (market segment)', 'Product + Business'],
        ['13', 'tulip-node LGPL legal review', 'Skip tulip-node; use technicalindicators', 'None (if skipped)', 'Legal (if tulip-node is reconsidered)'],
        ['14', 'Trigger.dev AGPL legal review', 'Use as hosted SaaS only, never self-host', 'High (if self-hosted)', 'Legal (if Trigger.dev is adopted)'],
      ],
      [4, 28, 30, 20, 22]
    ),
  ];
}

module.exports = { sec19_migration, sec20_tasksReplanning, sec21_phaseMap, sec22_depGraph, sec23_riskRegister, sec24_verificationStrategy, sec25_finalGates, sec26_taskRegister, sec27_humanApproval };
