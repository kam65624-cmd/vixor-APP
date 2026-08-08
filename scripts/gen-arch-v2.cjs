const { Document, Packer, Paragraph, TextRun, Header, Footer,
  AlignmentType, HeadingLevel, PageNumber, PageBreak, SectionType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  TableLayoutType, TableOfContents, NumberFormat } = require('docx');
const fs = require('fs');

// ═══════════════════════════════════════════
// PALETTE: DM-1 (Deep Cyan) — AI / Tech / Digital
// ═══════════════════════════════════════════
const P = {
  bg: '162235', primary: 'FFFFFF', accent: '37DCF2',
  titleColor: 'FFFFFF', subtitleColor: 'B0B8C0', metaColor: '90989F', footerColor: '687078',
  body: '1A2B40', bodyText: '000000', secondary: '5A6080',
  surface: 'F0F6FA',
  table: { headerBg: '1B6B7A', headerText: 'FFFFFF', accentLine: '1B6B7A', innerLine: 'C8DDE2', surface: 'EDF3F5' }
};
const c = (hex) => hex.replace('#', '');
const NB = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ═══════════════════════════════════════════
// COVER RECIPE R1: Pure Paragraph Left
// ═══════════════════════════════════════════
function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 20;
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt;
  let lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    const cpl = charsPerLine(minPt);
    lines = splitTitleLines(title, cpl);
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([' ', '-', '_', '/', '(', ')', ':', '.']);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop(); lines[lines.length - 1] += last;
  }
  return lines;
}

function calcCoverSpacing(params) {
  const { titleLineCount = 1, titlePt = 36, hasSubtitle = false, metaLineCount = 0, fixedHeight = 800 } = params;
  const SAFETY = 1200;
  const usableHeight = 16838 - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = Math.max(usableHeight - contentHeight, 400);
  const FOOTER_MIN = 800;
  const rawBottom = Math.floor(remainingSpace * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(Math.floor(remainingSpace * 0.45) - Math.max(0, FOOTER_MIN - rawBottom), 400);
  return { topSpacing, bottomSpacing };
}

function buildCoverR1(config) {
  const p = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 38, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt, hasSubtitle: !!config.subtitle,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: c(p.accent), space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: c(p.accent), space: 8 } },
      children: [new TextRun({ text: config.englishLabel, size: 18, color: c(p.accent), font: { ascii: 'Calibri' }, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: 'atLeast' },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: c(p.titleColor), font: { ascii: 'Arial' } })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: c(p.subtitleColor), font: { ascii: 'Arial' } })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: c(p.metaColor), font: { ascii: 'Arial' } })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: c(p.accent), space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || '', size: 16, color: c(p.footerColor), font: { ascii: 'Arial' } }),
      new TextRun({ text: '                                        ' }),
      new TextRun({ text: config.footerRight || '', size: 16, color: c(p.footerColor), font: { ascii: 'Arial' } }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: 'exact' }, children: [
      new TableCell({ shading: { type: ShadingType.CLEAR, fill: c(p.bg) }, borders: noBorders, children })
    ] })],
  })];
}

// ═══════════════════════════════════════════
// BODY BUILDERS
// ═══════════════════════════════════════════
const FONT = { ascii: 'Calibri', eastAsia: 'Microsoft YaHei' };
const FONT_HEAD = { ascii: 'Calibri', eastAsia: 'SimHei' };

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.body), font: FONT_HEAD })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.body), font: FONT_HEAD })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.secondary), font: FONT_HEAD })],
  });
}
function p(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 120 },
    children: [new TextRun({ text, size: 24, color: '000000', font: FONT })],
  });
}
function pBold(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 120 },
    children: [
      new TextRun({ text: label, bold: true, size: 24, color: '000000', font: FONT }),
      new TextRun({ text, size: 24, color: '000000', font: FONT }),
    ],
  });
}
function emptyP() {
  return new Paragraph({ spacing: { after: 60 }, children: [] });
}

function makeHeaderCell(text) {
  return new TableCell({
    shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
    borders: { top: NB, bottom: NB, left: NB, right: NB },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 21, color: c(P.table.headerText), font: FONT })] })],
  });
}
function makeCell(text, idx) {
  return new TableCell({
    shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: c(P.table.surface) } : { type: ShadingType.CLEAR, fill: 'FFFFFF' },
    borders: { top: NB, bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) }, left: NB, right: NB },
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
    children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text, size: 21, color: '000000', font: FONT })] })],
  });
}

function makeTable(headers, rows, colWidths) {
  const totalW = colWidths || headers.map(() => Math.floor(100 / headers.length));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      left: NB, right: NB, insideHorizontal: NB, insideVertical: NB,
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((h, i) => {
        const cell = makeHeaderCell(h);
        if (totalW[i]) cell.width = { size: totalW[i], type: WidthType.PERCENTAGE };
        return cell;
      })}),
      ...rows.map((row, ri) => new TableRow({ cantSplit: true, children: row.map((cell, ci) => {
        const tc = makeCell(cell, ri);
        if (totalW[ci]) tc.width = { size: totalW[ci], type: WidthType.PERCENTAGE };
        return tc;
      })})),
    ],
  });
}

// ═══════════════════════════════════════════
// DOCUMENT CONTENT
// ═══════════════════════════════════════════

function buildBody() {
  const content = [];

  // ─── 1. MASTER ARCHITECTURE DECISION ───
  content.push(h1('1. Master Architecture Decision'));
  content.push(p('This document defines the VIXOR Product + Intelligence Architecture V2, a transformative blueprint that converts open-source research findings into a cohesive product architecture. Unlike the previous OSS Research Base (rated 7.5/10), which excelled at identifying libraries but fell short on product vision, this architecture is built around a fundamental question: What will the user DO with these tools? Every integration decision is validated against a single rule: Any integration that does not produce a capability used in the User Journey must not be added.'));
  content.push(p('The architecture combines findings from two complementary research efforts. The first research wave (Session 1) focused on trading-specific gaps: signal state machines, backtesting engines, TA indicator libraries, portfolio analytics, and financial charting. The second wave (Session 2 / Z.AI Research) discovered that VIXOR already integrates 14 OSS projects within its codebase and identified opportunities in AI agent frameworks, market data normalization, token intelligence, and event-driven architecture. The union of both efforts produces a complete picture of what exists, what is missing, and most importantly, what the user actually needs.'));
  content.push(p('The core transformation is the introduction of the VIXOR Experience / Decision Layer, a missing stratum that sits between the raw data infrastructure and the user interface. This layer is responsible for converting normalized data into actionable intelligence, ranking opportunities, managing user context, and orchestrating the MOXI agent system. Without this layer, VIXOR remains a sophisticated dashboard with disconnected tools. With it, VIXOR becomes an intelligent trading companion that guides users from discovery through analysis to execution and review.'));

  content.push(h2('1.1 Architecture Principle: Capability-First Integration'));
  content.push(p('The previous architecture treated OSS integration as a technology exercise: add CCXT for exchanges, add Lightweight Charts for visualization, add Mem0 for memory. The V2 architecture reverses this logic. We start from the User Journey, define the Capabilities required at each step, and only then map OSS projects to those capabilities. If a capability cannot be traced to a user action, it is excluded. This principle eliminates the risk of building a feature-rich but experience-empty product, the exact gap identified in the 16-point review of the previous report.'));
  content.push(p('The Capability-First approach also resolves the page bloat problem. VIXOR currently has 41 routes, many of which exist because a domain module was built without asking whether it deserves its own page. By mapping each capability to a User Journey step, we naturally consolidate pages into core experiences. A page exists only when it serves a distinct User Journey phase, not because a domain module has code.'));

  content.push(h2('1.2 Union of Both Research Efforts'));
  content.push(p('The two research waves produced overlapping but complementary findings. Session 1 identified trading-specific tools (XState, backtest-kit, VectorBT, QuantStats, technicalindicators, TradingView Lightweight Charts) while Session 2 discovered the existing stack (Vercel AI SDK, CCXT, EventEmitter3, shadcn/ui already integrated) and new opportunities (Mastra, Mem0, tulip-node, Birdeye, LunarCrush, Helius, Mobula, DefiLlama, KLineChart, Meta Astryx). The V2 architecture takes the union, not the intersection, ensuring no valuable finding is lost while eliminating redundancy through the Capability-First filter.'));
  content.push(makeTable(
    ['Research Wave', 'Focus', 'Key Findings', 'Unique Contribution'],
    [
      ['Session 1', 'Trading Engine Gaps', 'XState, backtest-kit, VectorBT, QuantStats, technicalindicators, pyfolio-reloaded', 'Signal lifecycle, backtesting, portfolio analytics, risk metrics'],
      ['Session 2 (Z.AI)', 'Stack Discovery + AI', '14 already-integrated projects, Mastra, Mem0, Birdeye, LunarCrush, tulip-node, Meta Astryx', 'Discovered existing integrations, AI agent modernization, market data sources'],
      ['V2 Union', 'Product Architecture', 'All of the above, filtered by User Journey capability', 'Experience Layer, Page Consolidation, Capability Map, Intelligence Pipeline'],
    ],
    [12, 18, 40, 30]
  ));

  content.push(h2('1.3 Master Decision: What VIXOR Is and Is Not'));
  content.push(p('VIXOR is an AI-powered trading intelligence platform, not a charting dashboard, not a data aggregator, and not a bot framework. The product identity is defined by three pillars: (1) MOXI as the intelligent copilot that assists every trading decision, (2) the Signal-to-Trade pipeline that converts market intelligence into executable actions, and (3) the Intelligence Architecture that transforms raw data into ranked, contextualized opportunities. Every architectural decision in this document serves one or more of these pillars. Technologies that serve none are excluded, regardless of how impressive they are technically.'));
  content.push(p('The following master decisions define the architectural boundaries. First, VIXOR uses TypeScript end-to-end for the product layer; Python is only acceptable as an isolated microservice for heavy quantitative computation (VectorBT, QuantStats). Second, Vercel AI SDK is the primary AI orchestration layer; Mastra and tulip-node are POC-only evaluations. Third, CCXT remains the unified exchange interface; no per-exchange custom clients. Fourth, TradingView Lightweight Charts is the primary charting library; KLineChart is a POC for built-in indicators. Fifth, page count reduces from 41 to 12 core experiences. Sixth, all new integrations must pass the Capability-First test before entering the codebase.'));

  // ─── 2. OSS MASTER DECISION ───
  content.push(h1('2. OSS Master Decision Matrix'));
  content.push(p('The OSS Master Decision Matrix classifies every project from both research waves into one of five categories. This classification replaces the previous A-E system with a stricter evaluation that incorporates the Capability-First principle. Each project is evaluated not just on technical merit but on whether it directly enables a user-facing capability within the defined User Journey. Projects that are technically excellent but lack a clear capability mapping are downgraded to Architecture Reference or excluded entirely.'));
  content.push(makeTable(
    ['Category', 'Definition', 'Count', 'Projects'],
    [
      ['A: Direct Integration', 'Already in codebase or approved for immediate integration with verified user capability', '14', 'CCXT, TradingView LW Charts, Vercel AI SDK, shadcn/ui, Radix UI, EventEmitter3, Framer Motion, lightweight-charts-indicators, Zustand, TanStack Query, Recharts, DexScreener, Helius RPC'],
      ['B: Adapter/Service', 'Requires an adapter layer or microservice; approved for integration with timeline', '5', 'Mem0 (memory service), Birdeye (Solana intel adapter), LunarCrush (social adapter), DefiLlama (DeFi adapter), technicalindicators (TA adapter wrapping existing engine)'],
      ['C: POC Evaluation', 'Requires proof-of-concept before commitment; not yet approved for production', '5', 'Mastra (vs Vercel AI SDK), tulip-node (vs technicalindicators), KLineChart (vs LW Charts), Meta Astryx (agent UI), backtest-kit (TS backtesting)'],
      ['D: Architecture Reference', 'Study for patterns and inspiration; no code integration', '6', 'XState (signal lifecycle pattern), AI-Trader (agent-signal pipeline), VectorBT (backtesting architecture), QuantStats (analytics reference), NautilusTrader (order lifecycle), Reactive Trader (real-time UI)'],
      ['E: Do Not Use', 'Excluded due to license, language mismatch, or redundancy', '4', 'LangChain.js (over-abstracted), CrewAI (Python-only), OpenBB (AGPL license), Backtrader (unmaintained)'],
    ],
    [15, 35, 8, 42]
  ));
  content.push(p('The most significant change from the previous classification is the demotion of several projects from Direct Integration to POC Evaluation. Mastra, for example, is a full-stack agent framework that overlaps significantly with Vercel AI SDK (already integrated at ai@6.0.224). Rather than committing to Mastra, we designate it for a POC that compares its workflow orchestration, memory, and RAG capabilities against Vercel AI SDK with custom tooling. Similarly, tulip-node is a C library with an unofficial TypeScript wrapper; it competes with the already-integrated analysis engine and technicalindicators. A POC will determine if its 100+ indicators and C-level performance justify the adapter complexity. The backtest-kit project is the highest-priority POC because backtesting is the single largest capability gap, and no Python alternative is currently planned.'));

  // ─── 3. CAPABILITY MAP ───
  content.push(h1('3. Capability Map: Integration to User Value'));
  content.push(p('The Capability Map is the most critical section of this architecture. It bridges the gap between technology (what OSS projects we use) and product value (what the user can do). Every row in this map represents a verified connection: the user performs an action, which requires a capability, which is enabled by one or more integrations. If an integration cannot fill a row in this map, it is excluded from the architecture. This is the enforcement mechanism for the Capability-First principle.'));
  content.push(h2('3.1 User Journey Phases'));
  content.push(p('The VIXOR User Journey consists of seven sequential phases, each corresponding to a distinct mental state and set of user needs. These phases are not pages but experiential stages that may span multiple pages or be consolidated into a single view. The Discover phase represents the user entering the platform with a general interest, scanning for opportunities across markets. The Analyze phase deepens into specific assets, applying technical and fundamental analysis. The Decide phase is where MOXI provides intelligence, the user evaluates risk/reward, and commits to a trade thesis. The Execute phase handles order placement, position sizing, and exchange interaction. The Track phase monitors active positions, manages alerts, and responds to market changes. The Review phase analyzes past trades, computes performance metrics, and extracts lessons. The Optimize phase feeds insights back into the system, improving strategies, alerts, and MOXI behavior.'));

  content.push(h2('3.2 Full Capability-Integration Matrix'));
  content.push(makeTable(
    ['User Journey Phase', 'User Capability', 'Enabling Integration(s)', 'VIXOR Domain(s)', 'Status'],
    [
      ['Discover', 'Scan market opportunities across DEX/CEX', 'DexScreener, CCXT, CoinGecko, Birdeye', 'discovery/, market-data/', 'Active (partial)'],
      ['Discover', 'Get social sentiment on tokens', 'LunarCrush, Twitter client', 'discovery/clients/', 'Adapter needed'],
      ['Discover', 'See new token launches and rugs', 'DexScreener WS, Helius RPC', 'discover/, shared/market-data/', 'Active'],
      ['Analyze', 'View professional candlestick charts', 'TradingView LW Charts, indicators', 'chart-intelligence/, components/vixor/', 'Active'],
      ['Analyze', 'Apply 50+ TA indicators with overlay', 'technicalindicators, analysis engine', 'analysis/engine/', 'Adapter needed'],
      ['Analyze', 'Read AI chart analysis (MOXI Vision)', 'Vercel AI SDK, chart-vision', 'chart-intelligence/chart-vision.ts', 'Active'],
      ['Analyze', 'Verify price truth across sources', 'chart-truth, price-reconciler', 'chart-truth/', 'Active (needs data feeds)'],
      ['Decide', 'Get MOXIs trade recommendation with reasoning', 'Vercel AI SDK, MOXI agents, Mem0', 'moxi/', 'Active (memory POC)'],
      ['Decide', 'See ranked opportunity score', 'MOXI hunter.agent, decision-store', 'moxi/server/hunter.agent.ts', 'Active'],
      ['Decide', 'Evaluate risk via debate (bull vs bear)', 'debate.engine, analyst/contrarian', 'debate/', 'Active'],
      ['Decide', 'Set up multi-TP/SL signal parameters', 'signal-tracking, transition-engine', 'signal-tracking/', 'Active (contract locked)'],
      ['Execute', 'Place trades via unified exchange API', 'CCXT, trading/gateway/adapters/', 'trading/gateway/', 'Active'],
      ['Execute', 'Manage wallet connections (Solana + EVM)', 'wagmi, viem, @solana/wallet-adapter', 'wallet/', 'Active'],
      ['Track', 'Monitor signal lifecycle (TP1/TP2/TP3/SL)', 'signal-tracking, transition-engine', 'signal-tracking/', 'Active (server auth P1)'],
      ['Track', 'Receive real-time position alerts', 'EventEmitter3, Supabase Realtime, notification-hub', 'moxi/notification-hub.ts', 'Active'],
      ['Track', 'Watch live P&L and equity curve', 'TradingView LW Charts, recharts', 'components/vixor/EquityChart.tsx', 'Active'],
      ['Review', 'View trade history with MFE/MAE analysis', 'Future: QuantStats/pyfolio microservice', 'trades/, journal/', 'Gap (Python service)'],
      ['Review', 'See portfolio performance metrics (Sharpe, drawdown)', 'Future: QuantStats microservice', 'portfolio/, bags/', 'Gap (Python service)'],
      ['Review', 'Backtest strategies on historical data', 'Future: backtest-kit POC', 'backtest/', 'Gap (TS engine)'],
      ['Optimize', 'Store and recall trade journal notes', 'notes/ domain, journal/ page', 'notes/', 'Active'],
      ['Optimize', 'Iterate on experiment results', 'experiment/ domain, strategy/runtime/', 'experiment/', 'Active (basic)'],
    ],
    [14, 28, 26, 22, 10]
  ));

  content.push(h2('3.3 Gap Analysis Summary'));
  content.push(p('The Capability Map reveals three categories of gaps. Critical Gaps are missing capabilities that block a core User Journey phase. The backtesting gap is the most severe: without historical strategy validation, the Decide phase lacks rigor. The portfolio analytics gap means the Review phase cannot provide professional-grade performance metrics. The TA indicator adapter gap means the Analyze phase has basic indicators but lacks the comprehensive library (50+ indicators) that serious traders expect. Enhancement Gaps are capabilities that exist but are below professional quality. MOXI memory (needs Mem0 integration), DeFi data (needs DefiLlama adapter), and social sentiment (needs LunarCrush adapter) fall into this category. POC Dependencies are capabilities contingent on successful proof-of-concept evaluations. The Mastra-vs-AI-SDK decision affects the entire Decide phase architecture. The tulip-node-vs-technicalindicators decision affects the Analyze phase depth. The KLineChart-vs-LW-Charts decision affects chart UX quality.'));

  // ─── 4. DATA / INTELLIGENCE ARCHITECTURE ───
  content.push(h1('4. Data and Intelligence Architecture'));
  content.push(p('The Data and Intelligence Architecture defines how raw market data flows from external sources through normalization layers into the intelligence systems that power MOXI and the user experience. This architecture addresses the critical gap identified in the review: having CCXT, DexScreener, and Helius in the codebase does not mean the Data to Normalization to Domain to MOXI to UX pipeline works end-to-end. This section makes that pipeline explicit, defines the contracts between layers, and identifies where the breaks occur.'));

  content.push(h2('4.1 Architecture Layers (Top to Bottom)'));
  content.push(p('The VIXOR architecture consists of six layers, each with a clear responsibility and interface contract. The topmost layer is the VIXOR Experience, which contains the user-facing pages, components, and interaction patterns. Below it is the Decision Layer, the new stratum that contains MOXI, Signal Decisions, Intelligence, Opportunity Ranking, and User Context. The third layer contains the domain-specific engines: Signal/Analysis Engine, Portfolio Engine, and Strategy Engine. The fourth layer is the Intelligence Data layer, which holds normalized market data, token metadata, social signals, and DeFi metrics. The fifth layer is the Normalization layer, which transforms raw data from diverse sources into a unified internal format. The bottom layer is Infrastructure: Supabase, Redis, WebSocket connections, and exchange gateways.'));

  content.push(h2('4.2 Data Flow Architecture'));
  content.push(makeTable(
    ['Layer', 'Responsibility', 'Key Components', 'Data Format', 'Current State'],
    [
      ['Infrastructure', 'Raw data acquisition and transport', 'CCXT, DexScreener WS, Binance WS, Helius RPC, Alchemy RPC, Supabase, Redis', 'Provider-native (JSON, WebSocket frames)', 'Working (5 data sources active)'],
      ['Normalization', 'Transform raw data to unified VIXOR format', 'price-resolver.ts, future: data-normalizer service', 'VIXOR Unified Price Model (OHLCV + metadata)', 'Partial (price-resolver exists, no full normalizer)'],
      ['Intelligence Data', 'Store and serve normalized data to engines', 'Supabase tables, Redis cache, future: vector store', 'VIXOR canonical models (Asset, Price, Signal, Position)', 'Working (Supabase schemas exist)'],
      ['Engines', 'Compute derived data (signals, analysis, risk)', 'analysis/engine/, signal-tracking/, debate/, risk-governor/', 'Engine-specific internal types', 'Active (6 engines implemented)'],
      ['Decision Layer', 'Convert engine outputs to user decisions', 'MOXI agents, decision-store, opportunity ranking, user context', 'Decision objects (recommendation, confidence, reasoning)', 'Partial (MOXI exists, ranking basic)'],
      ['Experience', 'Render decisions and data to user', 'React components, pages, chart components', 'UI state (React), server state (TanStack Query)', 'Active (48 vixor components, 41 routes)'],
    ],
    [14, 24, 30, 18, 14]
  ));

  content.push(h2('4.3 Critical Pipeline Breaks'));
  content.push(p('The data flow analysis reveals three critical pipeline breaks where data does not flow end-to-end. Break 1: Price Normalization is incomplete. While price-resolver.ts exists and multiple data sources are connected, there is no unified data normalizer service that transforms all provider formats into a single VIXOR Price Model. Each client (Binance WS, DexScreener, TwelveData, Finnhub) returns data in its own format, and the analysis engine must handle format differences itself. This break means the Analysis and Signal engines cannot reliably consume data from all sources without provider-specific logic. The fix is a dedicated Normalization service with provider adapters that output a canonical VIXOR AssetPrice type.'));
  content.push(p('Break 2: Intelligence to Decision conversion is ad-hoc. The MOXI agents produce analysis and recommendations, but there is no formal Opportunity Ranking system that scores, filters, and ranks opportunities across the user portfolio context. The hunter.agent finds opportunities, but the scoring is embedded in agent logic rather than being a standalone, testable ranking system. The decision-store persists decisions but does not provide a ranking API. This break means the user sees MOXI recommendations without a clear priority order or portfolio-aware filtering. The fix is an Opportunity Ranking Engine that takes signal outputs, debate results, and user context as inputs and produces a ranked list of actionable opportunities.'));
  content.push(p('Break 3: Review feedback loop is open. Trade results, journal notes, and performance metrics do not flow back into the system to improve MOXI behavior, signal sensitivity, or strategy parameters. The experiment/ domain exists but is basic. This break means the Optimize phase of the User Journey is manually driven rather than system-assisted. The fix is a Feedback Pipeline that feeds trade outcomes and journal insights into the experiment engine and MOXI memory.'));

  // ─── 5. MOXI ARCHITECTURE ───
  content.push(h1('5. MOXI Architecture'));
  content.push(p('MOXI is VIXOR proprietary intelligent agent system, the core differentiator that transforms VIXOR from a dashboard into a trading companion. The MOXI architecture defines how AI agents collaborate, how they access tools and memory, and how they produce decisions that reach the user. This section is entirely proprietary; no OSS project replaces MOXI. However, OSS projects enable MOXI capabilities: Vercel AI SDK provides the tool-calling and streaming infrastructure, and Mem0 (pending POC) would provide persistent memory.'));

  content.push(h2('5.1 Agent Topology'));
  content.push(p('MOXI operates as a multi-agent system with four specialized agents coordinated through a central agent.ts. The Analyst Agent (analyst.agent.ts) is responsible for technical and fundamental analysis, chart interpretation, and market regime identification. It consumes data from the analysis engine, chart-intelligence, and chart-truth domains. The Hunter Agent (hunter.agent.ts) scans for opportunities across markets, applying filters, ranking criteria, and user preferences to produce a curated opportunity feed. The Governor Agent (governor.agent.ts) enforces risk constraints, validates trade parameters against risk rules, and provides the contrarian voice in debate. The Coach Agent (coach.agent.ts) provides educational context, explains MOXI reasoning to the user, and offers post-trade analysis and lessons learned. The base agent.ts handles orchestration, routing user requests to the appropriate specialist, and managing multi-tool interactions through Vercel AI SDK.'));

  content.push(h2('5.2 MOXI Intelligence Pipeline'));
  content.push(makeTable(
    ['Stage', 'Input', 'Processing', 'Output', 'OSS Dependency'],
    [
      ['1. Context Assembly', 'User query + portfolio + preferences + market state', 'context-engine.ts gathers from Supabase, Redis, real-time feeds', 'Structured context object', 'Vercel AI SDK (tool calling)'],
      ['2. Analysis Orchestration', 'Context + asset data', 'Analyst agent runs TA, reads chart-vision, checks regime', 'Analysis report with bias and confidence', 'Vercel AI SDK, chart-intelligence'],
      ['3. Opportunity Scoring', 'Analysis + market scan results', 'Hunter agent scores against user criteria, ranking algorithm', 'Ranked opportunity list with scores', 'None (proprietary ranking)'],
      ['4. Risk Governance', 'Opportunity + portfolio + risk rules', 'Governor agent validates against risk-governor/rules/', 'Approved/rejected with risk assessment', 'None (proprietary rules engine)'],
      ['5. Debate (optional)', 'Approved opportunity', 'Debate engine runs bull (analyst) vs bear (contrarian) agents', 'Enhanced decision with opposing views', 'None (proprietary debate)'],
      ['6. Decision Formation', 'All above outputs', 'Base agent synthesizes into recommendation + reasoning', 'MOXI Decision object', 'Vercel AI SDK (streaming)'],
      ['7. Decision Delivery', 'Decision object', 'CopilotDrawer/FloatingCopilot renders to user', 'User-facing UI with explainability', 'shadcn/ui, Framer Motion'],
      ['8. Memory Update', 'User reaction + outcome', 'Mem0 stores insights (future POC)', 'Persistent memory for future context', 'Mem0 (POC, not yet integrated)'],
    ],
    [16, 22, 28, 20, 14]
  ));

  content.push(h2('5.3 MOXI Enhancement Roadmap'));
  content.push(p('The current MOXI system is functional but has three enhancement areas that map directly to OSS POC decisions. First, Memory Enhancement: MOXI currently has no persistent memory across sessions. Each conversation starts fresh. The Mem0 POC will evaluate whether a lightweight memory service can improve MOXI context awareness without adding significant latency or complexity. The success criteria are: MOXI recalls user preferences from previous sessions, remembers past trade outcomes when analyzing new opportunities, and adapts its communication style based on user feedback history. If Mem0 fails the POC, the fallback is a simpler Supabase-based context table with manual context loading.'));
  content.push(p('Second, Workflow Enhancement: The current MOXI pipeline is linear (analyze then recommend). Complex trading decisions may require iterative research loops (gather data, analyze, realize more data is needed, gather more, re-analyze, then recommend). The Mastra POC will evaluate whether its workflow orchestration (graph-based multi-step agents with state persistence) provides meaningful improvement over Vercel AI SDK maxSteps for these iterative scenarios. If Mastra fails the POC, the fallback is implementing custom multi-step orchestration within Vercel AI SDK using its existing tool loop primitives.'));
  content.push(p('Third, Tool Enhancement: MOXI currently has a fixed set of tools defined in tools.ts. As new data sources are added (Birdeye, LunarCrush, DefiLlama), each requires a tool definition and integration. The tool architecture should evolve toward a plugin model where data adapters auto-register as MOXI tools, reducing the integration surface for each new data source.'));

  // ─── 6. SIGNAL ARCHITECTURE ───
  content.push(h1('6. Signal Architecture'));
  content.push(p('The Signal Architecture defines how trading signals are created, validated, tracked through their lifecycle, and connected to execution. This architecture builds on the locked Task 1.2C contract (commit 4ffad75), which established the 5 terminal statuses (tp3_hit, sl_hit, invalidated, expired, cancelled), 2 intermediate statuses (tp1_hit, tp2_hit), and 4 monitored statuses (pending, active, tp1_hit, tp2_hit). The 8 locked business decisions (A through H) are the foundation; this section extends the architecture to cover the full signal pipeline from creation to post-trade analysis.'));

  content.push(h2('6.1 Signal Lifecycle State Machine'));
  content.push(p('The signal lifecycle is managed by the transition-engine in src/domains/signal-tracking/transition-engine.ts. The engine implements a deterministic state machine with the following transitions. A signal starts in the pending state when created by MOXI or manually by the user. It transitions to active when the entry price is confirmed (server-side validation). From active, it can transition to tp1_hit (first take-profit level reached), tp2_hit (second take-profit level reached), tp3_hit (all targets reached, terminal), sl_hit (stop-loss triggered, terminal), invalidated (pre-entry condition failed, terminal), expired (time-based expiry, terminal), or cancelled (user action, terminal). The 8 locked business decisions govern edge cases: pre-entry invalidation, partial wins (cancel after TP hit), post-TP expiry, legacy resolved_at handling, authoritative server timestamps, out-of-order event rejection, TP crossing behavior, and signal versioning (deferred).'));

  content.push(h2('6.2 Signal-to-Trade Pipeline'));
  content.push(p('The signal-to-trade pipeline connects the Signal Architecture to the Execution layer. This pipeline has three stages. In the Signal Creation stage, MOXI or the user creates a signal with entry/exit parameters (entry price, TP1/TP2/TP3 levels, stop-loss, expiry). The signal enters pending status. In the Validation stage, the transition engine validates the signal against market conditions (price truth check via chart-truth, risk validation via risk-governor). If valid, the signal transitions to active and the user is notified. In the Execution stage, the user decides whether to execute. If auto-execution is enabled (future), the trading gateway places orders via CCXT adapters. Position state is tracked in the trades/ and paper-trading/ domains. When a terminal status is reached, the resolved_at timestamp is set (gated to terminal-only per locked Decision D), and the trade outcome flows to the Review pipeline.'));

  content.push(h2('6.3 Signal Intelligence Enhancement'));
  content.push(p('The current signal system tracks lifecycle but lacks intelligence features that would make it proactive rather than reactive. Three enhancements are planned. Signal Pre-Validation: Before a signal enters pending, the system should check whether market conditions still support the thesis. A signal generated during a bullish regime should be flagged if the regime shifts to bearish before execution. This requires connecting the analysis/engine/regime/ module to the signal-tracking domain. Signal Clustering: When multiple signals fire for correlated assets (e.g., SOL, BONK, JUP all showing bullish divergence), the system should cluster them and alert the user to concentrated exposure risk. This requires a correlation analysis module. Signal Performance Tracking: Each signal outcome (win/loss/partial/invalidated) should be tracked over time to measure signal quality by source (MOXI vs manual), by asset class, and by market regime. This feeds the Optimize phase of the User Journey.'));

  // ─── 7. PAGE CONSOLIDATION ───
  content.push(h1('7. Page Consolidation: 41 Routes to 12 Experiences'));
  content.push(p('VIXOR currently has 41 authenticated routes, a number that reflects domain-level thinking (one page per domain module) rather than experience-level thinking (one page per User Journey phase). This section defines the consolidation plan that reduces 41 routes to 12 core experiences, each mapped to a User Journey phase. Routes that are merged become tabs, panels, or sections within a consolidated page. Routes that are eliminated have their functionality absorbed into related experiences. No capability is lost; only page-level fragmentation is eliminated.'));

  content.push(h2('7.1 Consolidated Experience Map'));
  content.push(makeTable(
    ['#', 'Core Experience', 'User Journey Phase', 'Routes Merged In', 'Routes Eliminated'],
    [
      ['1', 'Command Center (Home)', 'Discover', 'index, daily-loop, notifications, pulse, radar', 'pulse (merged into Command Center feed)'],
      ['2', 'Discover', 'Discover', 'discover, whale, communities', 'None (consolidated into single discovery page)'],
      ['3', 'Asset Intelligence', 'Analyze', 'token.$symbol, analysis.$id', 'None (dynamic routes, kept)'],
      ['4', 'Analyze', 'Analyze', 'analyze, charts, vision, curves', 'curves (merged as chart sub-view)'],
      ['5', 'Setup and Signals', 'Decide', 'signals, trackers, alerts (future), alpha', 'alpha (merged into signals)'],
      ['6', 'Trade Desk', 'Execute', 'trade-desk, swap, perpetuals, arbitrage', 'arbitrage (merged as trade type)'],
      ['7', 'Track', 'Track', 'bags, pnl, activity-web3', 'pnl (merged into bags/portfolio)'],
      ['8', 'Portfolio', 'Track', 'portfolio, brokers', 'brokers (merged into portfolio settings)'],
      ['9', 'Journal', 'Review', 'journal, predictions, experiments', 'predictions (merged into journal)'],
      ['10', 'Backtest', 'Review', 'backtest', 'None (single page, enhanced)'],
      ['11', 'MOXI (Copilot)', 'All Phases', 'moxi (copilot drawer)', 'None (cross-cutting, always available)'],
      ['12', 'Settings', 'All Phases', 'settings, profile, premium, referral, rewards, admin/api-keys, wallet-web3', 'referral + rewards (merged into settings)'],
    ],
    [4, 18, 14, 36, 28]
  ));

  content.push(h2('7.2 Elimination Rationale'));
  content.push(p('Each elimination follows the same logic: the route exists because a domain module was built, not because the user needs a separate page for it. The pulse route (real-time market pulse) is absorbed into the Command Center as a live feed panel, because the user checking the pulse is the same user checking their dashboard. The curves route (yield curves) becomes a sub-view within the Analyze page, because yield analysis is a form of market analysis, not a separate activity. The alpha route (alpha signals) merges into the Setup and Signals page because alpha signals are a type of signal. The arbitrage route becomes a trade type within Trade Desk, because arbitrage is an execution strategy, not a separate experience. The pnl route merges into the bags and portfolio pages because P&L is a view of portfolio performance, not a standalone activity. The predictions route merges into the Journal because predictions are a type of journal entry (a forecast to be reviewed against outcomes). The referral and rewards routes merge into Settings because they are account-level configurations, not daily-use features. The total reduction is from 41 routes to 12 core experiences, a 71% consolidation.'));

  content.push(h2('7.3 Navigation Architecture'));
  content.push(p('The 12 core experiences map to a simplified navigation structure. The primary navigation (sidebar or bottom dock) contains 6 top-level items: Command Center, Discover, Analyze, Trade, Portfolio, and Journal. The secondary navigation (within each experience) provides tabs or panels for sub-views. MOXI is available as a floating copilot on every page (existing FloatingCopilot.tsx component). Settings is accessible from the profile icon. The Backtest experience is accessible from the Analyze page (as a mode toggle) or from the Journal page (as a strategy validation tool). This structure ensures the user never needs more than 2 clicks to reach any feature.'));

  // ─── 8. UX / PRODUCT FLOW ───
  content.push(h1('8. UX and Product Flow'));
  content.push(p('The UX and Product Flow defines the end-to-end user experience across the 12 core experiences, with emphasis on the Decision Layer interactions that differentiate VIXOR from a standard dashboard. This section describes what the user sees, does, and feels at each stage, and how the architecture enables those experiences. The key principle is that VIXOR should feel like an intelligent companion, not a collection of tools.'));

  content.push(h2('8.1 Primary User Flow: Discovery to Review'));
  content.push(p('The primary flow begins when the user opens VIXOR and lands on the Command Center. The Command Center provides an at-a-glance summary: active positions with live P&L, pending signals with countdown to expiry, MOXI latest recommendation, and a market pulse feed showing notable movements. This is not a data dump; it is a curated summary where every element is actionable. Tapping a position opens the Track view. Tapping a signal opens the Signal detail. Tapping MOXI recommendation opens the full MOXI analysis. The design uses the existing StatCard, SignalBadge, and MiniSparkline components, composed into a dashboard layout that prioritizes information hierarchy over data density.'));
  content.push(p('From the Command Center, the user moves to Discover to find new opportunities. The Discover page shows a curated feed of tokens and opportunities, filtered by the user preferences and MOXI hunter agent results. Each card shows the token, current price, 24h change, MOXI score (if available), and a mini chart. The user can filter by chain (Solana/EVM), category (DeFi, meme, AI), and signal type (bullish divergence, breakout, volume spike). Tapping a token opens the Asset Intelligence page, which is the deep-dive view combining price charts, MOXI analysis, social sentiment, on-chain metrics, and signal history for that specific asset.'));
  content.push(p('The Analyze page is where the user performs detailed technical analysis. It features the TradingView Lightweight Charts integration with TA indicator overlays (via technicalindicators adapter), MOXI chart vision analysis, and the truth-score engine showing data reliability. The user can draw on charts, apply indicators, and request MOXI analysis of any pattern they see. The Decide phase happens when MOXI presents a recommendation, either proactively (via the FloatingCopilot) or in response to a user query. The recommendation includes the thesis, confidence level, risk assessment, debate summary (bull vs bear), and specific entry/exit parameters. The user can accept (creating a signal), modify (adjusting parameters), or reject (with feedback that improves MOXI).'));  

  content.push(h2('8.2 MOXI Interaction Patterns'));
  content.push(p('MOXI interacts with the user through four distinct patterns, each mapped to a component in the existing codebase. The Copilot Drawer (CopilotDrawer.tsx) is a side-panel that opens when the user wants a detailed conversation with MOXI. It supports multi-turn dialogue, displays structured analysis reports (AnalystReportPanel.tsx), and shows risk assessments (GovernorRiskPanel.tsx). The Floating Copilot (FloatingCopilot.tsx) is a persistent, collapsible button that provides quick MOXI insights without leaving the current page. It shows bite-sized recommendations, alerts, and context-aware suggestions. The Coach Overlay (CoachOverlay.tsx) appears during or after trades to provide educational context, explaining why MOXI made a specific recommendation or what the user can learn from a trade outcome. The MoxiAvatar (MoxiAvatar.tsx) and MoxiCharacter3D (MoxiCharacter3D.tsx) provide visual identity and personality, making MOXI feel like a companion rather than a tool. These four patterns cover the full spectrum of user interaction from passive (seeing MOXI avatar) to active (full copilot conversation).'));

  content.push(h2('8.3 Cross-Cutting UX Patterns'));
  content.push(p('Several UX patterns span multiple experiences. The Live Dot (LiveDot.tsx) indicator appears wherever real-time data is displayed, providing a visual cue that data is streaming. The Engagement Bar (EngagementBar.tsx) shows MOXI confidence level and engagement state. The Smart Bottom Sheet (SmartBottomSheet.tsx) and Dynamic Dock (DynamicDock.tsx) provide mobile-optimized navigation and context menus. The Pull Indicator (PullIndicator.tsx) enables pull-to-refresh on mobile. The Empty State (EmptyState.tsx) provides consistent messaging when no data is available, with contextual suggestions for the user next action. The Unified Feed (UnifiedFeed.tsx) combines multiple data sources (signals, alerts, MOXI updates, market events) into a single chronological stream. These patterns ensure visual and interaction consistency across the 12 core experiences.'));

  // ─── 9. MIGRATION PLAN ───
  content.push(h1('9. Migration Plan'));
  content.push(p('The Migration Plan defines the phased approach to transform the current VIXOR codebase from its existing state into the Architecture V2 target. The plan is designed to be incremental: each phase delivers user value independently, and no phase blocks the next. Coding remains paused until this architecture is approved, but the plan provides a clear execution roadmap for when approval is granted.'));

  content.push(h2('9.1 Phase 1: Foundation (Weeks 1-3)'));
  content.push(p('Phase 1 focuses on fixing the critical pipeline breaks identified in Section 4.3 and completing the locked Task 1.2C follow-up (server authority timestamps). The key deliverables are: (1) Data Normalization Service, which creates a unified VIXOR Price Model and provider adapters for all existing data sources (Binance WS, DexScreener, TwelveData, Finnhub, Helius). This unblocks the Analysis and Signal engines from provider-specific logic. (2) Server Authority Timestamps (Task 2 from the master task list), which migrates all signal timestamps to serverReceivedAt and implements the P1-P6 TODOs in the transition engine. This is already designed and just needs implementation. (3) Opportunity Ranking Engine v1, which extracts ranking logic from hunter.agent into a standalone, testable module with a clear input/output contract. This unblocks the Decision Layer enhancement. Phase 1 delivers no new user-visible features but fixes the infrastructure that all future features depend on.'));

  content.push(h2('9.2 Phase 2: Intelligence (Weeks 4-7)'));
  content.push(p('Phase 2 builds the Intelligence capabilities on the Phase 1 foundation. Key deliverables: (1) Mem0 POC and Integration, which evaluates Mem0 as MOXI memory layer, implements the adapter if POC succeeds, and falls back to Supabase-based context if it fails. (2) technicalindicators Adapter, which wraps the technicalindicators library behind the existing analysis engine interface, adding 50+ TA indicators to the Analyze page. (3) Birdeye + LunarCrush Adapters, which add Solana token intelligence and social sentiment data to the Discover and Analyze experiences. (4) DefiLlama Adapter, which adds DeFi protocol data (TVL, yields, DEX volumes) to the intelligence layer. (5) Backtest-kit POC, which evaluates the TypeScript-native backtesting framework against VIXOR requirements and implements a basic backtest UI if the POC succeeds. Phase 2 delivers the most visible user improvements: richer analysis, better discovery data, and potentially backtesting.'));

  content.push(h2('9.3 Phase 3: Experience (Weeks 8-11)'));
  content.push(p('Phase 3 focuses on the Page Consolidation and UX improvements. Key deliverables: (1) Page Consolidation Implementation, which merges the 41 routes into 12 core experiences following the map in Section 7. This includes route reconfiguration, component migration, navigation restructuring, and responsive layout updates. (2) MOXI Enhancement, which implements the workflow improvements from the Mastra POC (if successful) or the Vercel AI SDK fallback, adds the Coach Overlay to post-trade flows, and improves the Floating Copilot with context-aware suggestions. (3) Signal Intelligence, which implements signal pre-validation (regime check before activation), signal clustering (correlated asset detection), and signal performance tracking (quality metrics by source and regime). (4) QuantStats Microservice (optional), which deploys a Python microservice for professional portfolio analytics (Sharpe, Sortino, MFE/MAE, drawdown analysis) if the Review phase enhancement is prioritized. Phase 3 delivers the transformative user experience changes that define VIXOR as a product.'));

  // ─── 10. TASKS AND IMPLEMENTATION ───
  content.push(h1('10. Tasks and Implementation Order'));
  content.push(p('This section provides the granular task breakdown derived from the Migration Plan. Tasks are ordered by dependency and priority. Each task has a clear definition of done, estimated effort, and dependency chain. The task list is designed to be executed sequentially within each phase, with Phase 2 and Phase 3 tasks potentially parallelizable where dependencies allow.'));

  content.push(h2('10.1 Phase 1 Tasks (Foundation)'));
  content.push(makeTable(
    ['Task ID', 'Task', 'Description', 'Effort', 'Dependencies', 'Status'],
    [
      ['1.1', 'Signal Contract Audit', 'Completed and locked (commit 4ffad75)', 'Done', 'None', 'LOCKED'],
      ['2.1', 'Server Authority Timestamps', 'Migrate all timestamps to serverReceivedAt, implement P1-P6 TODOs', '2 days', '1.1', 'BLOCKED (awaiting arch approval)'],
      ['2.2', 'VIXOR Unified Price Model', 'Define canonical AssetPrice type with provider metadata', '1 day', 'None', 'BLOCKED'],
      ['2.3', 'Data Normalization Service', 'Build provider adapters (Binance, DexScreener, TwelveData, Finnhub, Helius) outputting unified model', '3 days', '2.2', 'BLOCKED'],
      ['2.4', 'Analysis Engine Refactor', 'Remove provider-specific logic from analysis engine, consume normalized data', '2 days', '2.3', 'BLOCKED'],
      ['2.5', 'Opportunity Ranking Engine v1', 'Extract ranking from hunter.agent, create standalone module with I/O contract', '2 days', 'None', 'BLOCKED'],
    ],
    [8, 18, 30, 8, 14, 12]
  ));

  content.push(h2('10.2 Phase 2 Tasks (Intelligence)'));
  content.push(makeTable(
    ['Task ID', 'Task', 'Description', 'Effort', 'Dependencies', 'Status'],
    [
      ['3.1', 'Mem0 POC', 'Evaluate Mem0 for MOXI memory: session persistence, cross-session recall, latency', '2 days', 'None', 'BLOCKED'],
      ['3.2', 'Mem0 Integration (conditional)', 'If POC passes: implement adapter, add to context-engine, update MOXI prompt', '2 days', '3.1', 'BLOCKED'],
      ['3.3', 'technicalindicators Adapter', 'Wrap 50+ indicators behind analysis engine interface, add to Analyze page', '3 days', '2.3', 'BLOCKED'],
      ['3.4', 'Birdeye Adapter', 'Build adapter for Solana token intelligence (prices, analytics, new tokens)', '2 days', '2.3', 'BLOCKED'],
      ['3.5', 'LunarCrush Adapter', 'Build adapter for social sentiment data', '1 day', '2.3', 'BLOCKED'],
      ['3.6', 'DefiLlama Adapter', 'Build adapter for DeFi protocol data (TVL, yields, volumes)', '1 day', '2.3', 'BLOCKED'],
      ['3.7', 'backtest-kit POC', 'Evaluate TS-native backtesting: strategy DSL, candle data integration, metrics', '3 days', '2.3, 2.4', 'BLOCKED'],
      ['3.8', 'Backtest UI (conditional)', 'If POC passes: integrate backtest-kit into Analyze page, add results visualization', '3 days', '3.7', 'BLOCKED'],
    ],
    [8, 18, 32, 8, 14, 12]
  ));

  content.push(h2('10.3 Phase 3 Tasks (Experience)'));
  content.push(makeTable(
    ['Task ID', 'Task', 'Description', 'Effort', 'Dependencies', 'Status'],
    [
      ['4.1', 'Navigation Restructure', 'Implement 6-item primary nav, secondary tab system, MOXI floating access', '2 days', 'None', 'BLOCKED'],
      ['4.2', 'Command Center Build', 'Merge index + daily-loop + notifications + radar into unified dashboard', '3 days', '4.1', 'BLOCKED'],
      ['4.3', 'Discover Page Consolidation', 'Merge discover + whale + communities into single discovery experience', '2 days', '4.1, 3.4, 3.5', 'BLOCKED'],
      ['4.4', 'Analyze Page Enhancement', 'Merge charts + vision + curves, integrate TA indicators, improve chart UX', '3 days', '4.1, 3.3', 'BLOCKED'],
      ['4.5', 'Signals Page Consolidation', 'Merge signals + trackers + alpha into unified signal management', '2 days', '4.1, 2.1', 'BLOCKED'],
      ['4.6', 'Trade Desk Consolidation', 'Merge trade-desk + swap + perpetuals + arbitrage', '2 days', '4.1', 'BLOCKED'],
      ['4.7', 'Portfolio/Track Consolidation', 'Merge bags + pnl + activity-web3 + portfolio + brokers', '2 days', '4.1', 'BLOCKED'],
      ['4.8', 'Journal Page Enhancement', 'Merge journal + predictions + experiments, add backtest results tab', '2 days', '4.1, 3.8', 'BLOCKED'],
      ['4.9', 'MOXI Workflow Upgrade', 'Implement Mastra POC results or AI SDK fallback for iterative reasoning', '3 days', '3.1, 3.2', 'BLOCKED'],
      ['4.10', 'Signal Pre-Validation', 'Connect regime engine to signal-tracking, flag regime-shifted signals', '2 days', '2.4, 4.5', 'BLOCKED'],
      ['4.11', 'QuantStats Microservice (optional)', 'Deploy Python service for Sharpe, Sortino, MFE/MAE, drawdown analytics', '5 days', '4.7', 'BLOCKED'],
    ],
    [8, 18, 34, 8, 14, 10]
  ));

  content.push(h2('10.4 Total Effort Estimate'));
  content.push(p('The total implementation effort across all three phases is approximately 50-55 working days for a single developer, or 25-30 days with two developers working in parallel on independent task streams. Phase 1 (Foundation) is 10 days and is the critical path because all subsequent phases depend on it. Phase 2 (Intelligence) is 17-19 days and can be partially parallelized (adapters are independent of each other). Phase 3 (Experience) is 23-28 days and can be partially parallelized (page consolidations are independent of each other, though they share the navigation restructure dependency). The optional QuantStats microservice adds 5 days if prioritized. The POC tasks (Mem0, backtest-kit, Mastra) have built-in decision gates: if a POC fails, the fallback path is shorter and the effort decreases.'));

  content.push(h2('10.5 Risk Register'));
  content.push(makeTable(
    ['Risk', 'Impact', 'Likelihood', 'Mitigation'],
    [
      ['Mem0 POC fails (latency, complexity)', 'Medium', 'Low', 'Fallback: Supabase context table with manual loading'],
      ['backtest-kit POC fails (immature, limited)', 'High', 'Medium', 'Fallback: Python VectorBT microservice (already in D: Reference)'],
      ['Mastra POC fails (overlap with AI SDK)', 'Low', 'Low', 'Fallback: Custom multi-step in Vercel AI SDK (maxSteps + tools)'],
      ['Page consolidation breaks existing UX', 'High', 'Medium', 'Incremental migration: build new pages alongside old, switch when ready'],
      ['Data normalizer performance bottleneck', 'Medium', 'Low', 'Redis caching at normalization layer, lazy normalization'],
      ['QuantStats Python service ops complexity', 'Medium', 'Medium', 'Defer to post-MVP; use TS-based metrics (limited) initially'],
    ],
    [30, 12, 12, 46]
  ));

  return content;
}

// ═══════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════
const bodyContent = buildBody();

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 24, color: '000000' },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: FONT_HEAD, size: 32, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 480, after: 200 } } },
      heading2: { run: { font: FONT_HEAD, size: 28, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 360, after: 160 } } },
      heading3: { run: { font: FONT_HEAD, size: 24, bold: true, color: c(P.secondary) },
        paragraph: { spacing: { before: 240, after: 120 } } },
    },
  },
  sections: [
    // Cover Section
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCoverR1({
        title: 'VIXOR Product + Intelligence Architecture V2',
        englishLabel: 'ARCHITECTURE  DECISION  DOCUMENT',
        subtitle: 'From OSS Research to Product-Capability Architecture',
        metaLines: [
          'Capability-First Integration | Union of Dual Research Efforts',
          '41 Routes to 12 Core Experiences | MOXI Intelligence Pipeline',
          'Document Version: 2.0 | Status: PENDING APPROVAL',
        ],
        footerLeft: 'VIXOR',
        footerRight: 'August 2026',
        palette: P,
      }),
    },
    // TOC Section
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: 'VIXOR Architecture V2', size: 18, color: c(P.secondary), font: FONT, italics: true })
        ] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: FONT })
        ] })] }),
      },
      children: [
        new Paragraph({
          spacing: { before: 400, after: 300 },
          children: [new TextRun({ text: 'Table of Contents', size: 36, bold: true, color: c(P.body), font: FONT_HEAD })],
        }),
        new TableOfContents('Table of Contents', {
          hyperlink: true, headingStyleRange: '1-3',
        }),
        new Paragraph({
          spacing: { before: 200, after: 100 },
          children: [new TextRun({ text: '(Right-click the table of contents and select \u201cUpdate Field\u201d to refresh page numbers)', size: 18, italics: true, color: c(P.secondary), font: FONT })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // Body Section
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [
          new TextRun({ text: 'VIXOR Architecture V2', size: 18, color: c(P.secondary), font: FONT, italics: true })
        ] })] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [
          new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary), font: FONT })
        ] })] }),
      },
      children: bodyContent,
    },
  ],
});

const OUTPUT = '/home/z/my-project/download/VIXOR_Architecture_V2_Product_Intelligence.docx';
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync(OUTPUT, buf);
  console.log('Document generated:', OUTPUT);
  console.log('Size:', (buf.length / 1024).toFixed(1), 'KB');
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
