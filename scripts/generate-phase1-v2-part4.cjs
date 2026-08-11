const m = require('./generate-phase1-v2.cjs');
const { h1, h2, h3, body, spacer, makeTable } = m;

function sec15_eventArch() {
  return [
    h1('15. Event Architecture'),
    body('The event architecture addresses the finding that the domain event bus is DEAD in production: 20 event types are defined, 6 are emitted, but ZERO handlers are registered (F4). This section separates two concerns that are currently conflated: (a) Domain Events, which represent "something important happened" and require immediate handling (notifications, state updates, MOXI context), and (b) Durable Jobs, which represent "do this work reliably, potentially much later" and require persistence and retry. The current EventEmitter3-based implementation is suitable for in-process Domain Events but not for Durable Jobs. The architecture must not replace the event bus automatically; instead, it must determine which events need which pattern.'),
    h2('15.1 Domain Event Bus (In-Process)'),
    body('The existing EventEmitter3-based VixorEvents singleton is retained for in-process domain events. These events are synchronous within a single serverless function invocation and do not require persistence. The event bus is enhanced with three changes: (1) handler registration is made explicit and mandatory during server function bootstrap (the configureEventHandlers function that is currently missing), (2) events are persisted to the domain_events table for audit and replay via configureEventPersistence (this function exists but is never called per the baseline), and (3) the 6 currently-emitted events are connected to actual handlers. The following events require immediate handlers: signal.state_changed (triggers notification), signal.created (triggers MOXI context update), alert.triggered (triggers notification), trade.closed (triggers journal prompt, MOXI learning), analysis.completed (triggers MOXI context update), and dailyloop.session_started (triggers morning prep data fetch).'),
    h2('15.2 Durable Jobs (Deferred)'),
    body('Durable jobs are work items that must survive serverless function termination and be retried on failure. Current candidates for durable jobs are: (a) signal re-analysis (currently a cron job at /api/reanalysis-cron), (b) price alert monitoring (currently a cron job at /api/check-alerts), and (c) discovery pipeline execution (currently triggered by API call). The current implementation uses Vercel Cron, which is sufficient for the current scale. Trigger.dev (classified as E: OPTIONAL) is a potential enhancement for more complex job orchestration (chains, retries, dead letter queues), but it carries an AGPL-3.0 license that requires legal review. NATS (classified as F: REJECT) is rejected as massive overkill. The decision is: keep Vercel Cron for Phase 2-8, evaluate Trigger.dev as a hosted SaaS in Phase 7 if job complexity grows, and introduce a simple Supabase-based job queue (table + poll) as the minimum viable durable job system in Phase 7.'),
  ];
}

function sec16_bgJobsArch() {
  return [
    h1('16. Background Jobs Architecture'),
    body('Background jobs in VIXOR currently run via Vercel Cron (3 cron endpoints) and fire-and-forget patterns in server functions. This section defines the target architecture for background jobs, separating them into three categories: scheduled jobs (cron-triggered), event-driven jobs (triggered by domain events), and on-demand jobs (triggered by user actions or API calls). Each category has different reliability, retry, and monitoring requirements.'),
    h2('16.1 Scheduled Jobs (Cron)'),
    makeTable(
      ['Job', 'Schedule', 'Endpoint', 'Status', 'V2 Target'],
      [
        ['Signal Generation', '00:00 UTC', '/api/generate-signals', 'REAL', 'Keep; enhance with normalized data'],
        ['Alert Checking', '00:30 UTC', '/api/check-alerts', 'REAL', 'Migrate to event-driven (price observation triggers check)'],
        ['Signal Re-analysis', 'Configurable', '/api/reanalysis-cron', 'REAL', 'Keep; connect to server-authoritative Transition Engine'],
      ],
      [20, 16, 28, 12, 34]
    ),
    h2('16.2 Event-Driven Jobs (NEW in Phase 7)'),
    body('Event-driven jobs are triggered by domain events and processed asynchronously. The implementation in Phase 7 introduces a simple Supabase-based job queue: a background_jobs table (id, type, payload JSONB, status pending/running/completed/failed, attempts, max_attempts, created_at, started_at, completed_at, error text), a poll function that runs in each serverless invocation (check for pending jobs, process them, update status), and exponential backoff retry (1s, 5s, 30s, 5min, 30min). This is sufficient for VIXOR scale. The first event-driven jobs will be: (a) notification delivery (currently synchronous, should be async to avoid blocking the update path), (b) MOXI context pre-computation (when a signal is created, pre-compute MOXI context for the asset), and (c) signal performance analytics (when a signal resolves, compute performance metrics asynchronously).'),
  ];
}

function sec17_routeConsolidation() {
  return [
    h1('17. Route Consolidation'),
    body('The current VIXOR application has 39 authenticated routes plus the auth route. The Phase 0 Reality Baseline classified 27 as REAL, 10 as PARTIAL (fetching real data but with misleading scope), and 2 as DEAD (orphaned with no navigation link). This section defines the consolidation from 39 routes to 12 core experiences, each mapped to a User Journey phase. Every route is accounted for: KEEP (same page, possibly enhanced), MERGE (absorbed into another page as a tab, panel, or section), REMOVE (deleted, functionality absorbed elsewhere), REBUILD (current page replaced with new implementation), REDIRECT (old URL redirects to new location), or SUBVIEW (becomes a sub-view within a parent page).'),
    h2('17.1 Consolidation Map'),
    makeTable(
      ['Current Route', 'Classification', 'Decision', 'Target Experience', 'Migration Path'],
      [
        ['/', 'REAL', 'REBUILD', '1. Command Center', 'Merge daily-loop, notifications, radar into unified dashboard'],
        ['/discover', 'REAL', 'KEEP', '2. Discover', 'Enhance with real whale data (Phase 5), merge whale + communities'],
        ['/token.$symbol', 'REAL', 'KEEP', '3. Asset Intelligence', 'Dynamic route; enhance with structured MOXI analysis'],
        ['/analysis.$id', 'REAL', 'KEEP', '3. Asset Intelligence', 'Merge with token page as analysis sub-view'],
        ['/analyze', 'REAL', 'KEEP', '4. Analyze', 'Enhance with TA indicators adapter (Phase 3), merge charts + vision + curves'],
        ['/charts', 'REAL', 'MERGE', '4. Analyze', 'Merge into Analyze as chart sub-view'],
        ['/vision', 'REAL', 'MERGE', '4. Analyze', 'Merge into Analyze as VLM sub-view'],
        ['/curves', 'PARTIAL', 'MERGE', '4. Analyze', 'Merge as chart sub-view; rebuild with DeFiLlama data (Phase 3)'],
        ['/signals', 'REAL', 'KEEP', '5. Setup & Signals', 'Enhance with server-authoritative transitions (Phase 4)'],
        ['/trackers', 'REAL', 'MERGE', '5. Setup & Signals', 'Merge into Signals as active tracking tab'],
        ['/alpha', 'REAL', 'MERGE', '5. Setup & Signals', 'Merge into Signals as opportunity tab'],
        ['/trade-desk', 'REAL', 'KEEP', '6. Trade Desk', 'Enhance; merge swap + perpetuals + arbitrage'],
        ['/swap', 'REAL', 'MERGE', '6. Trade Desk', 'Merge as execution type (swap)'],
        ['/perpetuals', 'PARTIAL', 'MERGE', '6. Trade Desk', 'Merge as execution type (futures); rebuild with real data (Phase 4)'],
        ['/arbitrage', 'MOCK', 'MERGE', '6. Trade Desk', 'Merge as execution type (arbitrage); move from MOCK to REAL (Phase 4)'],
        ['/portfolio', 'PARTIAL', 'KEEP', '7. Portfolio', 'Rebuild with wallet balances + trade-derived data (Phase 8)'],
        ['/bags', 'PARTIAL', 'MERGE', '7. Portfolio', 'Merge into Portfolio as positions tab'],
        ['/pnl', 'REAL', 'MERGE', '7. Portfolio', 'Merge into Portfolio as PnL tab'],
        ['/brokers', 'PARTIAL', 'MERGE', '7. Portfolio', 'Merge into Portfolio as settings sub-section'],
        ['/journal', 'REAL', 'KEEP', '8. Journal', 'Enhance; merge predictions + experiments'],
        ['/predictions', 'REAL', 'MERGE', '8. Journal', 'Merge as predictions tab (forecast vs outcome review)'],
        ['/experiments', 'REAL', 'MERGE', '8. Journal', 'Merge as experiments tab'],
        ['/backtest', 'REAL', 'KEEP', '9. Backtest', 'Enhance with backtest-kit POC results (Phase 3)'],
        ['/daily-loop', 'REAL', 'MERGE', '1. Command Center', 'Merge into Command Center as routine panel'],
        ['/notifications', 'REAL', 'MERGE', '1. Command Center', 'Merge into Command Center as notification panel'],
        ['/pulse', 'REAL', 'MERGE', '1. Command Center', 'Merge into Command Center as live feed panel'],
        ['/radar', 'REAL', 'MERGE', '1. Command Center', 'Merge into Command Center as radar panel'],
        ['/wallet-web3', 'REAL', 'KEEP', '10. Wallet', 'Enhance; merge activity-web3'],
        ['/activity-web3', 'DEAD', 'REMOVE', '10. Wallet', 'Remove orphaned route; merge any unique functionality into Wallet'],
        ['/settings', 'REAL', 'KEEP', '11. Settings', 'Keep; merge profile + premium + referral + rewards + admin'],
        ['/profile', 'REAL', 'MERGE', '11. Settings', 'Merge as profile section'],
        ['/premium', 'PARTIAL', 'MERGE', '11. Settings', 'Merge as premium section; add payment processor (Phase 9)'],
        ['/referral', 'REAL', 'MERGE', '11. Settings', 'Merge as referral section'],
        ['/rewards', 'REAL', 'MERGE', '11. Settings', 'Merge as rewards section'],
        ['/admin/api-keys', 'REAL', 'MERGE', '11. Settings', 'Merge as admin section'],
        ['/whale', 'PARTIAL', 'MERGE', '2. Discover', 'Merge into Discover as whale tab; rebuild with real data (Phase 5)'],
        ['/yield', 'PARTIAL', 'MERGE', '2. Discover', 'Merge into Discover as yield tab; rebuild with DeFiLlama (Phase 3)'],
        ['/communities', 'DEAD', 'REMOVE', 'N/A', 'Remove orphaned route; no social features exist to preserve'],
        ['MOXI (Copilot Drawer)', 'REAL', 'KEEP', '12. MOXI', 'Cross-cutting; available on every page as floating copilot + drawer'],
      ],
      [20, 12, 12, 18, 48]
    ),
    h2('17.2 Navigation Architecture'),
    body('The 12 core experiences map to a simplified navigation structure. The primary navigation (DynamicDock on mobile, sidebar on desktop) contains 6 top-level items: Command Center, Discover, Analyze, Trade, Portfolio, and Journal. The secondary navigation (within each experience) provides tabs or panels for sub-views. MOXI is available as a floating copilot on every page (existing FloatingCopilot.tsx component). Settings is accessible from the profile icon. Backtest is accessible from the Analyze page (as a mode toggle) or from the Journal page (as a strategy validation tool). Wallet is accessible from Trade Desk (for execution) and from Settings (for connection management). This structure ensures the user never needs more than 2 taps to reach any feature.'),
  ];
}

function sec18_uxFlow() {
  return [
    h1('18. UX / Product Flow'),
    body('The UX and Product Flow defines the end-to-end user experience across the 12 core experiences. The key principle is that VIXOR should feel like an intelligent companion, not a collection of tools. Every core screen must answer five questions: WHAT MATTERS? (prioritized, contextual information), WHY? (MOXI reasoning and analysis), WHAT SHOULD I DO? (actionable recommendation with specific parameters), WHAT IS THE RISK? (risk assessment with portfolio context), and WHAT HAPPENS NEXT? (clear next step in the product loop). No page exists merely because a domain folder exists.'),
    h2('18.1 Product Loop Implementation'),
    makeTable(
      ['Phase', 'Experience', 'Primary Action', 'MOXI Role', 'Key Components'],
      [
        ['DISCOVER', 'Command Center + Discover', 'Scan markets, find opportunities', 'Hunter: surface ranked opportunities', 'UnifiedFeed, DiscoveryCards, MiniSparkline'],
        ['UNDERSTAND', 'Asset Intelligence', 'Learn about asset, read analysis', 'Analyst: provide context and history', 'TokenPage, AnalysisView, SocialSentiment'],
        ['ANALYZE', 'Analyze', 'Deep technical analysis', 'Analyst: SMC/ICT analysis, chart vision', 'CandlestickChart, Indicators, ChartVision'],
        ['DECIDE', 'Setup & Signals', 'Create signal with parameters', 'Governor: risk check, debate summary', 'SignalForm, RiskPanel, DebateView'],
        ['SETUP', 'Setup & Signals', 'Configure Entry/SL/TP/R:R', 'Coach: explain parameters', 'SetupWizard, RRCalculator, InvalidationRules'],
        ['TRACK', 'Trade Desk + Portfolio', 'Monitor positions, manage alerts', 'Coach: real-time coaching', 'SignalMonitor, PnLTracker, AlertManager'],
        ['REVIEW', 'Journal + Backtest', 'Analyze outcomes, extract lessons', 'Coach: post-trade analysis', 'JournalEntry, PerformanceMetrics, BacktestResults'],
        ['LEARN', 'Journal (system-assisted)', 'Improve based on outcomes', 'System: update MOXI memory, signal sensitivity', 'LearningFeed, StrategyTuner, PerformanceTrends'],
      ],
      [12, 22, 24, 24, 28]
    ),
    h2('18.2 MOXI Interaction Patterns'),
    body('MOXI interacts with the user through four patterns preserved from the current implementation: (1) Copilot Drawer (CopilotDrawer.tsx) for detailed multi-turn conversation with structured analysis reports; (2) Floating Copilot (FloatingCopilot.tsx) for persistent, collapsible quick insights without leaving the current page; (3) Coach Overlay (CoachOverlay.tsx) for educational context during and after trades; and (4) MoxiAvatar (MoxiAvatar.tsx + MoxiCharacter3D.tsx) for visual identity and personality. These four patterns are not rebuilt; they are enhanced with the V2 context architecture (Section 14.2) and the Opportunity Ranking Engine (Section 12.2). The agent panel duplication (F8: 4 panels with 80% duplicated code) is resolved in Phase 9 by extracting the shared layout into the existing AgentResponseLayout component.'),
  ];
}

module.exports = { sec15_eventArch, sec16_bgJobsArch, sec17_routeConsolidation, sec18_uxFlow };
