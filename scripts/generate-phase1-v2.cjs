const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, TableOfContents,
  Table, TableRow, TableCell, WidthType, BorderStyle,
  ShadingType, PageBreak, SectionType, PageOrientation
} = require('docx');

// ── Palette: Deep Sea Blue-Gold (Finance / Investment / Premium) ──
const P = {
  primary: '0F2027', body: '1A1A1A', secondary: '4A6575',
  accent: 'D4AF37', surface: 'F5F7FA',
  table: {
    headerBg: 'D4AF37', headerText: '0F2027',
    accentLine: '0F2027', innerLine: 'D0D8D0', surface: 'F5F2E8'
  }
};
const c = (hex) => hex.replace('#', '');

// ── Helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1, spacing: { before: 600, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.primary) })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2, spacing: { before: 400, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.primary) })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3, spacing: { before: 300, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: { ascii: 'Calibri', eastAsia: 'SimHei' }, color: c(P.secondary) })]
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, font: { ascii: 'Times New Roman', eastAsia: 'Microsoft YaHei' }, color: c(P.body) })]
  });
}
function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, font: { ascii: 'Times New Roman', eastAsia: 'Microsoft YaHei' }, color: c(P.body), bold: true })]
  });
}
function spacer(h = 100) {
  return new Paragraph({ spacing: { before: h, after: 0 }, children: [] });
}

// Table helper
const TB = { NONE: BorderStyle.NONE, SINGLE: BorderStyle.SINGLE };
function headerCell(text, width) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE }, shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
    borders: { top: { style: TB.NONE }, bottom: { style: TB.SINGLE, size: 2, color: c(P.primary) }, left: { style: TB.NONE }, right: { style: TB.NONE } },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, font: { ascii: 'Calibri' }, color: c(P.table.headerText) })] })]
  });
}
function dataCell(text, width, shade = false) {
  return new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    shading: shade ? { type: ShadingType.CLEAR, fill: c(P.table.surface) } : undefined,
    borders: { top: { style: TB.NONE }, bottom: { style: TB.NONE }, left: { style: TB.NONE }, right: { style: TB.NONE } },
    margins: { top: 50, bottom: 50, left: 100, right: 100 },
    children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text, size: 19, font: { ascii: 'Calibri' }, color: c(P.body) })] })]
  });
}
function makeTable(headers, rows, widths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: { top: { style: TB.SINGLE, size: 2, color: c(P.primary) }, bottom: { style: TB.SINGLE, size: 2, color: c(P.primary) }, left: { style: TB.NONE }, right: { style: TB.NONE }, insideHorizontal: { style: TB.SINGLE, size: 1, color: c(P.table.innerLine) }, insideVertical: { style: TB.NONE } },
    rows: [
      new TableRow({ tableHeader: true, children: headers.map((h, i) => headerCell(h, widths[i])) }),
      ...rows.map((row, ri) => new TableRow({ cantSplit: true, children: row.map((cell, ci) => dataCell(cell, widths[ci], ri % 2 === 1)) }))
    ]
  });
}

// ── COVER (R2: Double-Rule Frame, IG-1 palette: Ink Gold) ──
function buildCover() {
  const W = 16838, H = 15638;
  const outerBorder = { style: BorderStyle.SINGLE, size: 8, color: c(P.accent) };
  const innerBorder = { style: BorderStyle.SINGLE, size: 3, color: c(P.primary) };
  return new Table({
    width: { size: W, type: WidthType.DXA },
    rows: [new TableRow({
      height: { value: H, rule: 'exact' },
      children: [new TableCell({
        width: { size: W, type: WidthType.DXA },
        verticalAlign: 'center',
        borders: {
          top: outerBorder, bottom: outerBorder, left: outerBorder, right: outerBorder,
          insideHorizontal: { style: TB.NONE, size: 0 }, insideVertical: { style: TB.NONE, size: 0 }
        },
        margins: { top: 1440, bottom: 1440, left: 2160, right: 2160 },
        children: [
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'VIXOR V2', size: 72, bold: true, font: { ascii: 'Calibri' }, color: c(P.accent) })] }),
          new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'ARCHITECTURE DECISION FREEZE', size: 48, bold: true, font: { ascii: 'Calibri' }, color: c(P.primary) })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Phase 1 — Implementation Blueprint', size: 28, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          spacer(200),
          new Paragraph({ borders: { top: innerBorder, bottom: innerBorder }, spacing: { before: 0, after: 0 }, children: [] }),
          spacer(200),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Commit: 32bbf147 | Branch: main', size: 20, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Baseline: VIXOR_REALITY_BASELINE (Phase 0)', size: 20, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Classification: CONFIDENTIAL', size: 20, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
          new Paragraph({ children: [new TextRun({ text: '2026-08-10', size: 20, font: { ascii: 'Calibri' }, color: c(P.secondary) })] }),
        ]
      })] })]
  });
}

// ══════════════════════════════════════════════════
// SECTION CONTENT GENERATORS
// ══════════════════════════════════════════════════

function sec1_executiveDecision() {
  return [
    h1('1. Executive Decision'),
    body('This document constitutes the Phase 1 Architecture Decision Freeze for the VIXOR V2 Transformation. It is the single authoritative source for all architectural decisions, OSS project classifications, capability mappings, data model definitions, route consolidation plans, and implementation task structures. Every subsequent implementation phase (Phases 2 through 15) must derive its authority from this document. Any architectural change not recorded here requires a new Phase 1 amendment before implementation.'),
    body('The executive decision is that VIXOR transforms from a partially-connected collection of trading pages into a coherent Trading Intelligence and Decision Operating System. This transformation is achieved not by adding more libraries, but by completing three critical pipelines that are currently broken: the Data Normalization pipeline (raw provider data to canonical models), the Intelligence-to-Decision pipeline (engine outputs to ranked, actionable opportunities), and the Review-to-Learning feedback loop (trade outcomes improving future system behavior). The existing codebase provides substantial foundations: 23 domain engines, 47 database tables, 12 real market data connections, 4 AI agents, and a formal signal transition engine with 75 passing tests. The problem is not a lack of code but a lack of connectivity and authority.'),
    body('The most critical architectural decision is the relocation of authority from the client to the server for all signal state transitions. Currently, price evaluation happens client-side, meaning the hit_tp field and timestamps are client-controlled. The existing pure-function Transition Engine (locked at commit 4ffad75, preserved in commit 32bbf14) must be invoked server-side with serverReceivedAt timestamps, producing atomic commits, domain events, and audit records. This single decision fixes the foundation upon which all signal integrity, notification reliability, and MOXI intelligence depends.'),
    h2('1.1 What This Document Decides'),
    body('This document makes the following binding decisions: (a) VIXOR product identity and what it is not, (b) the two-vertical boundary between On-Chain and Markets, (c) the complete OSS Master Decision Matrix with license gates, (d) the canonical data model for 23 core entities, (e) the provider architecture and normalization contracts, (f) the Signal Architecture with server-authoritative transitions, (g) the MOXI V2 architecture with context aggregation, (h) the Event Architecture separating domain events from durable jobs, (i) the route consolidation from 39 routes to 12 core experiences, (j) the replanning of old Tasks 2 through 7 into the new V2 phase structure, (k) the complete phase map with dependency graphs and exit criteria, (l) a risk register with mitigation strategies, and (m) a list of decisions that require explicit human approval before coding begins.'),
  ];
}

function sec2_currentReality() {
  return [
    h1('2. Current Reality Summary'),
    body('This section synthesizes the evidence from the Phase 0 Reality Baseline document (VIXOR_REALITY_BASELINE.docx) into an architectural context. Every statement below is backed by the evidence standard defined in Phase 0: REAL means fully functional in production, PARTIAL means functional but limited, MOCK means intentional test infrastructure, BROKEN means code produces incorrect results, DEAD means code is unreachable from any production path, and MISSING means required but not implemented. The maturity model is: EXISTS then WIRED then RUNTIME-USED then PROVEN. Only PROVEN capabilities may be treated as fully operational dependencies.'),
    h2('2.1 Repository State'),
    makeTable(
      ['Dimension', 'Value', 'Status'],
      [
        ['Commit', '32bbf147a30e2448a5c89d504fd7ef5ec3143bac', 'Verified'],
        ['Branch', 'main', 'Verified'],
        ['Package Manager', 'pnpm 9.15.0 (declared)', 'Verified'],
        ['Framework', 'TanStack Start 1.168.25 + React 19.2.0 + Vite 7.3.1', 'Verified'],
        ['Database', 'Supabase (47 tables, 26 migrations, all RLS)', 'Verified'],
        ['Domain Engines', '23 (18 REAL, 2 PARTIAL, 1 MOCK, 1 BROKEN, 1 PARTIAL)', 'Verified'],
        ['Route Pages', '39 (27 REAL, 10 PARTIAL, 2 DEAD)', 'Verified'],
        ['API Routes', '14 (13 REAL, 1 DUPLICATE)', 'Verified'],
        ['Market Data Clients', '16 (12 REAL, 4 DEAD, 6 PARTIAL need keys)', 'Verified'],
        ['WebSocket Connections', '3 (Binance WS, DexScreener WS, WalletConnect)', 'Verified'],
        ['Tests', '307 passing across 18 files, zero skips', 'Verified'],
        ['TypeScript TypeCheck', 'Zero errors (tsc --noEmit)', 'Verified'],
        ['Build', 'Not verified (pnpm not in environment)', 'Partial'],
        ['CI Pipeline', 'None (no GitHub Actions, no test script)', 'MISSING'],
        ['Production Dependencies', '96 (86 used, 10 truly UNUSED)', 'Verified'],
      ],
      [35, 45, 20]
    ),
    h2('2.2 Critical Findings from Phase 0'),
    body('The Phase 0 audit identified 18 findings (F1 through F18) that must be carried forward into the V2 architecture. Each finding is mapped below to its architectural impact, affected capability, affected user journey, priority, target phase, and the tasks required to resolve it. These mappings ensure no finding is silently resolved or forgotten during implementation.'),
    makeTable(
      ['ID', 'Finding', 'Impact', 'Target Phase'],
      [
        ['F1', 'createTrade drops validated fields (pair, direction, entry_price)', 'Trade data integrity; blocks PnL, portfolio, journal', 'Phase 2'],
        ['F2', 'Signal Transition Engine exists but not invoked server-side', 'Client-authoritative state; signal integrity compromised', 'Phase 4'],
        ['F3', '18 DB tables missing from TypeScript types', 'No type safety for 18 tables; developer experience', 'Phase 2'],
        ['F4', 'Event bus: 20 events defined, ZERO handlers registered', 'Events are dead in production; no observability', 'Phase 7'],
        ['F5', '4 DEAD market data client files in shared/', 'Code clutter; confusion about which clients are active', 'Phase 2'],
        ['F6', '10 truly unused npm dependencies', 'Bundle size; maintenance burden', 'Phase 2'],
        ['F7', 'Client-authoritative signal price evaluation', 'hit_tp and timestamps are client-controlled', 'Phase 4'],
        ['F8', '4 AI agent panels with 80% duplicated code', 'Maintenance burden; inconsistent behavior', 'Phase 9'],
        ['F9', '2 chart components with 80% duplicated code', 'Maintenance burden; inconsistent chart UX', 'Phase 2'],
        ['F10', 'Duplicate Telegram webhooks', 'Confusion; potential double-processing', 'Phase 2'],
        ['F11', '5 components hardcode strings (bypass i18n)', 'i18n coverage gap', 'Phase 9'],
        ['F12', 'signal_status enum mismatch (invalidated)', 'TypeScript type errors reading invalidated rows', 'Phase 2'],
        ['F13', '.env.example incomplete (13 of 25+ vars)', 'Onboarding difficulty; misconfiguration risk', 'Phase 2'],
        ['F14', '8 orphaned Storybook stories', 'Dead code; no Storybook infrastructure', 'Phase 2'],
        ['F15', 'debate/index.ts dead code', 'Confusion between dead and real engine', 'Phase 2'],
        ['F16', '2 orphaned routes (activity-web3, communities)', 'Dead navigation targets', 'Phase 9'],
        ['F17', '3 lock files (pnpm, npm, bun)', 'Dependency resolution inconsistency', 'Phase 2'],
        ['F18', 'No CI pipeline', 'No automated quality gate', 'Phase 2'],
      ],
      [6, 40, 34, 20]
    ),
  ];
}

function sec3_archPrinciples() {
  return [
    h1('3. Architecture Principles'),
    body('The following principles are non-negotiable constraints on every architectural decision and implementation task. They are derived from the VIXOR V2 Master Transformation Contract and validated against the Phase 0 Reality Baseline. Any violation of these principles requires an explicit exception documented in this Architecture Decision Freeze.'),
    h2('3.1 Capability-First Principle'),
    body('Every technology, OSS project, code module, and architectural component must map to a verified user capability through a clear chain: Technology enables a Capability which enables a User Action which serves a User Journey phase which produces a Measurable Outcome. If any link in this chain cannot be established with evidence from the Reality Baseline, the technology must not be added. This principle eliminates the Frankenstein Architecture anti-pattern where impressive libraries are integrated without product purpose. The current codebase already contains evidence of this anti-pattern: 4 DEAD market data clients, 10 unused npm dependencies, and 8 orphaned Storybook stories represent technology added without verified capability linkage.'),
    h2('3.2 Server Authority Principle'),
    body('All state transitions that affect trade integrity, signal lifecycle, or financial calculations must be server-authoritative. The client may DISPLAY state but must never AUTHORITATIVELY DECIDE state. This principle is currently violated in signal tracking, where price evaluation happens client-side via the useSignalMonitor hook. The existing Transition Engine (75 tests, pure function, locked at commit 4ffad75) is the correct domain model; the problem is that it is invoked on the client instead of the server. The fix is not to redesign the engine but to relocate its invocation and add server-side timestamps, atomic commits, and event emission.'),
    h2('3.3 Reality Baseline Wins Principle'),
    body('If any previous architecture document (VIXOR_Architecture_V2_Product_Intelligence.docx, VIXOR_Architecture_V2_OSS_Research.docx, VIXOR_Architecture_V2_Revised.docx) claims that something is implemented or operational, but the Phase 0 Reality Baseline proves otherwise with file-level evidence, the Reality Baseline wins. The maturity model is strict: EXISTS then WIRED then RUNTIME-USED then PROVEN. Only PROVEN may be treated as complete. For example, the previous architecture document classified Whale Monitoring as REAL, but the Reality Baseline proves it only shows the user\'s own trades sorted by value. Therefore, Whale Monitoring is reclassified as MISSING in this document.'),
    h2('3.4 Minimum Powerful Stack Principle'),
    body('VIXOR uses a Minimum Powerful Stack: no redundant libraries, no Frankenstein architecture, no technology added for future potential. Every dependency must earn its place through current, verified user value. The stack is TypeScript end-to-end for the product layer. Python is only acceptable as an isolated microservice for heavy quantitative computation that cannot be performed efficiently in TypeScript. This principle means that projects like Mastra (overlaps Vercel AI SDK), tulip-node (C library with unofficial TS wrapper, overlaps existing analysis engine), and NATS (overkill for current scale) must pass explicit POC gates before entering the stack.'),
    h2('3.5 Two-Vertical Separation Principle'),
    body('VIXOR operates two distinct product verticals: ON-CHAIN (tokens, meme coins, wallets, whales, liquidity, DEX activity, on-chain discovery) and MARKETS (Gold, Forex, crypto markets, charts, SMC/ICT, indicators, setups, signals, tracking). These verticals have different data sources, different analysis paradigms, different user mental models, and different risk profiles. They share a platform layer (Signal, Creator, Share, Follow, Notifications, MOXI, Tracking, Reputation, Automation) but must not merge their domain semantics. On-Chain discovery scoring is fundamentally different from Markets SMC/ICT analysis; combining them would create a confused user experience and unmaintainable code.'),
    h2('3.6 No Regressions Principle'),
    body('Every implementation task must include regression verification. The 307 existing tests must continue to pass after every change. The signal tracking contract (75 tests, locked at commit 4ffad75) must not be broken. Any task that modifies shared infrastructure (Supabase types, event system, notification system, market data hooks) must verify that all existing consumers continue to function correctly. New code must not break old functionality. This principle is enforced through the Definition of Done, which requires typecheck, lint, build, all tests passing, and runtime verification.'),
  ];
}

function sec4_productDef() {
  return [
    h1('4. Product Definition'),
    body('VIXOR is an AI-powered Trading Intelligence and Decision Platform. This identity is frozen by this Architecture Decision Freeze and must not change without a new Phase 1 amendment.'),
    h2('4.1 What VIXOR IS'),
    body('VIXOR is an AI-powered Trading Intelligence and Decision Platform with five core product pillars: (1) MOXI as the intelligent copilot that assists every trading decision with reasoning, risk assessment, and contextual awareness; (2) Intelligence and Opportunity Ranking that transforms raw data into ranked, actionable opportunities using multi-source analysis and debate; (3) the Signal-to-Setup-to-Track-to-Review pipeline that converts market intelligence into executable, monitorable, and reviewable trading actions; (4) Real Market and Token Intelligence that provides live, normalized, cross-validated data from multiple providers; and (5) Decision Workflow that guides the user through Discover, Understand, Analyze, Decide, Setup, Track, Review, and Learn with MOXI assistance at every step.'),
    h2('4.2 What VIXOR is NOT'),
    body('VIXOR is not a charting dashboard. While professional charts are a component, the product identity is intelligence and decision-making, not visualization. VIXOR is not a generic data aggregator. Data serves intelligence, not the reverse. VIXOR is not a chatbot. MOXI is a multi-agent system with tool execution, not a conversational interface. VIXOR is not a collection of signals. Signals are one stage in the product loop, not the product itself. VIXOR is not a bot framework. While trade execution is supported, VIXOR does not run autonomous trading strategies. VIXOR is not a collection of disconnected trading pages. The 39 current routes must consolidate into 12 core experiences, each serving a distinct User Journey phase.'),
    h2('4.3 Product Loop'),
    body('The VIXOR Product Loop defines the canonical user journey through the platform. Every page, component, and feature must serve one or more phases of this loop. The phases are: DISCOVER (scan markets, find opportunities), UNDERSTAND (learn about assets, read MOXI analysis), ANALYZE (apply technical and fundamental analysis, verify data truth), DECIDE (evaluate risk/reward, commit to trade thesis with MOXI assistance), SETUP (create signal with validated Entry/SL/TP/R:R/Invalidation), TRACK (monitor active signals, receive alerts, manage positions), REVIEW (analyze completed trades, compute performance metrics, extract lessons), and LEARN (feed insights back to improve MOXI behavior, signal sensitivity, and strategy parameters). This loop is the ultimate test for every architectural decision: if a technology does not strengthen one or more phases of this loop, it must not enter VIXOR.'),
  ];
}

function sec5_twoVerticals() {
  return [
    h1('5. Two-Vertical Boundary'),
    body('VIXOR operates two distinct product verticals that share a common platform layer. This section defines the boundary between the verticals and the shared platform. The boundary is not arbitrary; it reflects fundamentally different data paradigms, analysis methods, user mental models, and risk profiles. Mixing these verticals at the domain engine level would create confused code and confused users.'),
    h2('5.1 ON-CHAIN Vertical'),
    body('The On-Chain vertical deals with blockchain-native assets and activities. Its primary objects are: tokens (metadata, price, liquidity), meme coins (launch detection, rug analysis), wallets (user-owned and monitored), whales (smart money tracking, large transaction monitoring), liquidity (pool analysis, LP tracking), holders (distribution analysis), DEX activity (swap tracking, volume analysis), on-chain activity (transaction feeds, contract interactions), discovery (new token scoring, launch detection), token risk (contract audit signals, honeypot detection), and execution (DEX swap execution via Jupiter/Axiom). The primary data sources are DexScreener, Birdeye, Helius RPC, Mobula, and on-chain RPC endpoints. The primary analysis methods are on-chain metrics (velocity, holder concentration, smart money flows) and social signals (Twitter, LunarCrush). The user mental model is exploratory: scanning, filtering, and scoring large numbers of tokens to find opportunities.'),
    h2('5.2 MARKETS Vertical'),
    body('The Markets vertical deals with traditional and crypto market analysis and execution. Its primary objects are: Gold, Forex pairs, crypto markets (where applicable), charts (candlestick, technical), SMC/ICT analysis (Smart Money Concepts, Institutional concepts), indicators (RSI, MACD, Bollinger, ATR, and 50+ others), setups (trade configurations with Entry/SL/TP), signals (lifecycle-managed trade ideas), and tracking (position monitoring with server-authoritative state). The primary data sources are Binance (REST and WebSocket), TwelveData, Finnhub, TradingView, and CCXT-connected exchanges. The primary analysis methods are technical analysis (SMC/ICT engine, 1116-line analysis engine), chart pattern recognition (VLM-based chart vision), and fundamental analysis (via MOXI agents). The user mental model is focused: deep analysis of a specific asset to decide whether to trade.'),
    h2('5.3 Shared Platform Layer'),
    body('Both verticals share the following platform capabilities: Signal (lifecycle management, transition engine, server authority), Creator (user-generated content and signals), Share (deep linking, Telegram/X sharing), Follow (signal creator subscription), Notifications (4 channels: in-app, Telegram, Email, Webhook), MOXI (AI copilot serving both verticals), Tracking (real-time position monitoring), Reputation (signal creator performance tracking), and Automation (alerts, cron jobs, event-driven actions). The platform layer provides these as services to both verticals, ensuring consistency and avoiding code duplication.'),
  ];
}

function sec6_capMap() {
  return [
    h1('6. Capability Map'),
    body('The Capability Map is the master reference that links every user-facing capability to its current status, evidence, ownership, user journey phase, target V2 owner, required action, OSS dependencies, priority, and target phase. This map is derived from the Phase 0 Reality Baseline (evidence) and the Product Intelligence Architecture V2 (target state). Every row represents a verified connection between a capability and the user journey. Capabilities without a verified user journey connection are marked for removal or demotion.'),
    makeTable(
      ['Capability', 'Current', 'Evidence', 'Journey', 'Priority', 'Phase'],
      [
        ['Token Discovery Pipeline', 'REAL', '5-stage scoring, DexScreener/Birdeye/Helius/LunarCrush/Twitter', 'Discover', 'P1', '5'],
        ['Live Crypto Prices (WS)', 'REAL', 'Binance WS + DexScreener WS; 2 active WebSocket connections', 'All', 'P0', '2'],
        ['Forex/Commodity Prices', 'PARTIAL', 'TwelveData + fallback; degrades to null without API key', 'Analyze', 'P1', '3'],
        ['Chart Analysis (AI)', 'REAL', '1116-line SMC/ICT engine + VLM vision + grounded data', 'Analyze', 'P1', '3'],
        ['Backtesting Engine', 'REAL', 'Candle-by-candle simulator, Sharpe/Sortino/drawdown', 'Review', 'P1', '3'],
        ['Signal Generation (Cron)', 'REAL', 'Daily cron, Binance/TwelveData to local analysis', 'Decide', 'P0', '4'],
        ['Signal Transition Authority', 'PARTIAL', 'Engine exists (75 tests) but NOT invoked server-side', 'Track', 'P0', '4'],
        ['Trade Execution (Exchange)', 'REAL', 'Binance/Bybit/OKX/CCXT/Exness adapters with HMAC', 'Execute', 'P0', '4'],
        ['Trade Creation (DB)', 'BROKEN', 'createTrade drops validated fields via as any', 'Execute', 'P0', '2'],
        ['Portfolio Tracking', 'PARTIAL', 'Derived from user trades, not wallet balances', 'Track', 'P1', '8'],
        ['Wallet Connection (SIWE)', 'REAL', 'Solana ed25519 + EVM viem signature verification', 'Execute', 'P1', '8'],
        ['Arbitrage Scanning', 'MOCK', 'Defaults to mock mode; real Jupiter/Axiom clients exist', 'Execute', 'P2', '4'],
        ['MOXI AI Copilot', 'REAL', '4 agents + LLMRouter (ZAI/Anthropic/Groq/OpenAI)', 'All', 'P1', '6'],
        ['Price Alerts', 'REAL', 'Cron (00:30), real price comparison', 'Track', 'P1', '7'],
        ['Journal / Notes', 'REAL', 'Full CRUD on trading_notes table', 'Review', 'P1', '9'],
        ['Daily Loop', 'REAL', 'Morning prep + session tracking + EOD review + streaks', 'All', 'P1', '9'],
        ['Watchlist Management', 'REAL', '8 server fns, full CRUD with ownership verification', 'Discover', 'P1', '8'],
        ['Notification System', 'REAL', '4 channels: in-app, Telegram, Email, Webhook', 'All', 'P1', '7'],
        ['Event Bus', 'DEAD', '20 events defined, 6 emitted, ZERO handlers', 'All', 'P1', '7'],
        ['Whale Monitoring', 'MISSING', 'Shows user\'s own trades, no blockchain tracking', 'Discover', 'P2', '5'],
        ['Bonding Curve Tracking', 'MISSING', 'Groups user\'s trades by pair, no on-chain data', 'Discover', 'P2', '5'],
        ['Perpetuals / Futures', 'MISSING', 'Shows trade positions, no exchange futures', 'Execute', 'P2', '4'],
        ['DeFi Yield Tracking', 'MISSING', 'Computes from closed trades, no DeFi protocol', 'Discover', 'P2', '3'],
        ['Community / Social', 'MISSING', 'Shows user\'s strategies/notes, no social features', 'Discover', 'P2', '9'],
        ['On-Chain Activity Feed', 'MISSING', 'Reuses wallet data, no chain transaction history', 'Discover', 'P2', '5'],
      ],
      [22, 10, 30, 12, 8, 8]
    ),
  ];
}

// Due to the massive size, I'll generate the rest as continuation
module.exports = { sec1_executiveDecision, sec2_currentReality, sec3_archPrinciples, sec4_productDef, sec5_twoVerticals, sec6_capMap, P, c, h1, h2, h3, body, bodyBold, spacer, makeTable, headerCell, dataCell, buildCover, TB };
