const fs = require('fs');
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, TableOfContents,
} = require('docx');

// ── Palette: Tech Audit (Cool + Heavy + Active) ──
const P = {
  primary: '1A2332', body: '1E293B', secondary: '64748B',
  accent: '6366F1', surface: 'F1F5F9', red: 'EF4444',
  orange: 'F59E0B', green: '22C55E', blue: '3B82F6',
};
const c = (h) => h.replace('#', '');

const DOCX_SCRIPTS = '/home/z/my-project/skills/docx/scripts';

// ── Helpers ──
function h1(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 480, after: 200 },
    children: [new TextRun({ text: t, bold: true, size: 32, color: c(P.primary), font: { ascii: 'Calibri' } })] });
}
function h2(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 360, after: 160 },
    children: [new TextRun({ text: t, bold: true, size: 28, color: c(P.primary), font: { ascii: 'Calibri' } })] });
}
function h3(t) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: t, bold: true, size: 24, color: c(P.accent), font: { ascii: 'Calibri' } })] });
}
function p(t, opts = {}) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { after: 120, line: 312 },
    children: [new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: 'Calibri' }, ...opts })] });
}
function bold(t) {
  return new TextRun({ text: t, bold: true, size: 22, color: c(P.body), font: { ascii: 'Calibri' } });
}
function normal(t) {
  return new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: 'Calibri' } });
}
function colored(t, color) {
  return new TextRun({ text: t, size: 22, color: c(color), font: { ascii: 'Calibri' }, bold: true });
}
function bp(t, runs) {
  return new Paragraph({ spacing: { after: 80, line: 312 }, children: runs });
}

// ── Table helpers ──
const noBorders = { top: { style: BorderStyle.NONE }, bottom: { style: BorderStyle.NONE }, left: { style: BorderStyle.NONE }, right: { style: BorderStyle.NONE } };
const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }, bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
  left: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' }, right: { style: BorderStyle.SINGLE, size: 1, color: 'CBD5E1' },
};

function makeProblemRow(id, severity, title, file, status, roadmap, isNew) {
  const sevColor = severity === 'CRITICAL' ? P.red : severity === 'HIGH' ? P.orange : severity === 'MEDIUM' ? P.blue : P.secondary;
  return new TableRow({ cantSplit: true, children: [
    cell(id, 8), cell(severity, 12, { color: sevColor, bold: true }), cell(title, 30), cell(file, 25),
    cell(status, 10, { color: status === 'Open' ? P.red : P.green }), cell(roadmap, 10), cell(isNew, 5),
  ]});
}
function cell(text, w, opts = {}) {
  return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE },
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
    children: [new Paragraph({ spacing: { after: 0, line: 276 },
      children: [new TextRun({ text: String(text), size: 18, color: c(opts.color || P.body), font: { ascii: 'Calibri' }, bold: opts.bold || false })] })] });
}
function headerCell(text, w) {
  return new TableCell({ width: { size: w, type: WidthType.PERCENTAGE }, tableHeader: true,
    shading: { fill: c(P.primary), type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({ spacing: { after: 0 },
      children: [new TextRun({ text, size: 18, color: 'FFFFFF', bold: true, font: { ascii: 'Calibri' } })] })] });
}

// ── All 47 Problems ──
const problems = [
  // CRITICAL (5)
  ['#01', 'CRITICAL', 'Charts do not work in Telegram WebView', 'TradingViewChart.tsx', 'Open', 'Phase C1', true],
  ['#02', 'CRITICAL', 'AssetRegistry is a static bottleneck (18 assets only)', 'asset-registry/types.ts', 'Open', 'Phase C2', true],
  ['#03', 'CRITICAL', 'Home page shows derived data not real portfolio', 'shared/data/index.ts', 'Open', 'Phase C3', true],
  ['#04', 'CRITICAL', 'Portfolio data derived from trades, not real balances', 'shared/data/index.ts', 'Open', 'Phase C3', true],
  ['#05', 'CRITICAL', 'Token detail page is empty for most tokens', '-token-symbol-component.tsx', 'Open', 'Phase C4', true],
  // HIGH - Data & API
  ['#06', 'HIGH', 'Arbitrage scanner returns mock empty response', 'shared/data/index.ts:1321', 'Open', 'Deferred', false],
  ['#07', 'HIGH', 'Swap page uses hardcoded static prices', 'swap-component.tsx:12', 'Open', 'Deferred', false],
  ['#08', 'HIGH', 'Swap page has mock balances (MOCK_BALANCES)', 'swap-component.tsx:50', 'Open', 'Deferred', false],
  ['#09', 'HIGH', 'OHLCV fallback generates fake deterministic offsets', 'market/functions.ts:160', 'Open', 'Phase C3', false],
  ['#10', 'HIGH', 'Market news returns empty without FINNHUB_API_KEY', 'market/functions.ts:31', 'Open', 'Deferred', false],
  ['#11', 'HIGH', 'Whale page shows users own trades, not real whales', 'shared/data/index.ts:773', 'Open', 'Deferred', false],
  ['#12', 'HIGH', 'Pulse page shows users own activity, not market pulse', 'shared/data/index.ts:989', 'Open', 'Deferred', false],
  ['#13', 'HIGH', 'Alpha signals only from user data, not real alpha', 'shared/data/index.ts:912', 'Open', 'Deferred', false],
  ['#14', 'HIGH', 'Bonding curves computed from user trades, fake data', 'shared/data/index.ts:819', 'Open', 'Deferred', false],
  ['#15', 'HIGH', 'Communities page shows user strategies, not real community', 'shared/data/index.ts:715', 'Open', 'Deferred', false],
  // HIGH - Architecture
  ['#16', 'HIGH', 'Symbol maps duplicated in 3+ files', 'TradingViewChart.tsx, -token-symbol-component.tsx, asset-registry/types.ts', 'Open', 'Phase C2', false],
  ['#17', 'HIGH', 'Price data sources fragmented (5+ providers)', 'shared/market-data/', 'Open', 'Phase C2', false],
  ['#18', 'HIGH', 'No centralized price cache strategy', 'shared/cache.ts', 'Open', 'Phase C2', false],
  ['#19', 'HIGH', 'Arbitrage domain has unused complex architecture', 'domains/arbitrage/', 'Open', 'Deferred', false],
  ['#20', 'HIGH', 'N+1 API calls in discover-crypto-data enrichment', 'discover/discover-crypto-data.ts:74', 'Open', 'Phase C1', false],
  // HIGH - Charts
  ['#21', 'HIGH', 'DexChart CSS vars may not resolve in all contexts', 'components/vixor/DexChart.tsx:42', 'Open', 'Phase C1', false],
  ['#22', 'HIGH', 'No fallback when TradingView fails in restricted env', 'components/vixor/TradingViewChart.tsx', 'Open', 'Phase C1', false],
  ['#23', 'HIGH', 'TradingViewChart uses Math.random for container ID', 'components/vixor/TradingViewChart.tsx:107', 'Open', 'Phase C1', false],
  // MEDIUM - UI/UX
  ['#24', 'MEDIUM', 'Home page greeting is English-only (not localized)', 'routes/_authenticated/index.tsx:38', 'Open', 'Phase C4', false],
  ['#25', 'MEDIUM', 'New users see empty state on most pages', 'Multiple pages', 'Open', 'Phase C4', false],
  ['#26', 'MEDIUM', 'Forex/commodity token detail uses TradingView (fails in Tg)', '-token-symbol-component.tsx:395', 'Open', 'Phase C1', false],
  ['#27', 'MEDIUM', 'Gold price uses ECB/Frankfurter exchange rates', 'shared/data/index.ts:1343', 'Open', 'Phase C3', false],
  ['#28', 'MEDIUM', 'Discover forex data uses Math.random', '-discover-forex-data.ts', 'Open', 'Phase C3', false],
  ['#29', 'MEDIUM', 'BTC dominance hardcoded to 0 as initial fallback', 'shared/data/index.ts:1251', 'Open', 'Phase C3', false],
  ['#30', 'MEDIUM', 'Duplicated utility functions (fmtPrice, fmtCompact) in 5+ files', 'Multiple files', 'Open', 'Phase C2', false],
  // MEDIUM - Code Quality
  ['#31', 'MEDIUM', 'Excessive `any` type usage in data mapping', 'shared/data/index.ts', 'Open', 'Phase C2', false],
  ['#32', 'MEDIUM', 'Dead code: token-symbol-component.tsx alongside -token-symbol-component.tsx', 'routes/_authenticated/', 'Open', 'Phase C2', false],
  ['#33', 'MEDIUM', 'Missing error handling in several server functions', 'shared/data/index.ts', 'Open', 'Phase C2', false],
  ['#34', 'MEDIUM', 'Experiments page has placeholder content', 'routes/_authenticated/experiments.tsx', 'Open', 'Deferred', false],
  ['#35', 'MEDIUM', 'Daily Loop component has TODO/placeholder markers', '-daily-loop-component.tsx', 'Open', 'Deferred', false],
  // MEDIUM - Security & Infra
  ['#36', 'MEDIUM', 'No rate limiting on DexScreener client calls', 'domains/discovery/clients/dexscreener.client.ts', 'Open', 'Phase C2', false],
  ['#37', 'MEDIUM', 'Binance API called without API key (rate-limited)', 'shared/data/index.ts:1228', 'Open', 'Phase C2', false],
  ['#38', 'MEDIUM', 'No retry/backoff for failed external API calls', 'market/functions.ts', 'Open', 'Phase C2', false],
  ['#39', 'MEDIUM', 'WebSocket connections lack error boundaries', 'shared/market-data/', 'Open', 'Phase C2', false],
  ['#40', 'MEDIUM', 'No input validation on token symbol in token detail', '-token-symbol-component.tsx:254', 'Open', 'Phase C2', false],
  // LOW
  ['#41', 'LOW', 'Backtest engine uses simulated data', 'domains/backtest/engine/', 'Open', 'Deferred', false],
  ['#42', 'LOW', 'Trading gateway has dummy-adapter (mock)', 'domains/trading/gateway/adapters/dummy-adapter.ts', 'Open', 'Deferred', false],
  ['#43', 'LOW', 'Copilot AI may return wrong pair analysis (BTC for gold)', 'domains/copilot/server/', 'Open', 'Phase C3', false],
  ['#44', 'LOW', 'Notification channels (email, webhook) are stubs', 'shared/notifications/channels/', 'Open', 'Deferred', false],
  ['#45', 'LOW', 'Sound manager is a stub', 'shared/sound-manager.ts', 'Open', 'Deferred', false],
  ['#46', 'LOW', 'Analytics module is a stub', 'shared/analytics.ts', 'Open', 'Deferred', false],
  ['#47', 'LOW', 'Brokers page uses affiliate links, no real broker API', 'routes/_authenticated/brokers.tsx', 'Open', 'Deferred', false],
];

// ── Build Document ──
const doc = new Document({
  styles: { default: { document: {
    run: { font: { ascii: 'Calibri' }, size: 22, color: c(P.body) },
    paragraph: { spacing: { line: 312 } },
  }}},
  sections: [
    // ── COVER SECTION ──
    {
      properties: { page: { margin: { top: 0, bottom: 0, left: 0, right: 0 },
        size: { width: 11906, height: 16838 } } },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 },
          children: [new TextRun({ text: 'VIXOR', size: 72, bold: true, color: c(P.accent), font: { ascii: 'Calibri' } })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: 'Comprehensive Codebase Audit Report', size: 36, bold: true, color: c(P.primary), font: { ascii: 'Calibri' } })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
          children: [new TextRun({ text: '47 Identified Problems  |  Full Roadmap Integration', size: 24, color: c(P.secondary), font: { ascii: 'Calibri' } })] }),
        new Paragraph({ spacing: { before: 1200 } }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
          children: [new TextRun({ text: 'Generated: 2026-07-25', size: 20, color: c(P.secondary), font: { ascii: 'Calibri' } })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: 'Branch: main  |  Repo: github.com/kam65624-cmd/vixor-APP', size: 20, color: c(P.secondary), font: { ascii: 'Calibri' } })] }),
      ],
    },
    // ── TOC SECTION ──
    {
      properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: [
        new Paragraph({ spacing: { after: 200 },
          children: [new TextRun({ text: 'Table of Contents', size: 32, bold: true, color: c(P.primary), font: { ascii: 'Calibri' } })] }),
        new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-3' }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ── BODY SECTION ──
    {
      properties: { page: { pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: [
        // ── 1. Executive Summary ──
        h1('1. Executive Summary'),
        bp('This report presents a comprehensive audit of the VIXOR trading dashboard application, a React 19.2.0 + TanStack Start 1.168.25 crypto trading platform deployed as a Telegram Mini App. The audit identified 47 distinct problems across 8 categories, ranging from critical functionality failures to low-priority code quality issues. Five of these problems are newly identified critical issues that directly impact user experience and were not part of the previous development roadmap.', [normal('This report presents a comprehensive audit of the VIXOR trading dashboard application, a React 19.2.0 + TanStack Start 1.168.25 crypto trading platform deployed as a Telegram Mini App. The audit identified ')]),
        bp('The five critical issues identified by the user are: (1) Charts do not render in Telegram WebView due to blocked external scripts, (2) the AssetRegistry is a static bottleneck that cannot dynamically register new assets, (3) the Home page shows derived data from trade records rather than real market data, (4) Portfolio data is computed from trade history rather than actual on-chain balances, and (5) the Token Detail page is empty for most tokens because it relies on a discovery API that returns no results. These issues are marked as new (not previously in the task backlog) and are prioritized for immediate resolution.', [normal('The five critical issues identified by the user are: (1) Charts do not render in Telegram WebView due to blocked external scripts, (2) the AssetRegistry is a static bottleneck that cannot dynamically register new assets, (3) the Home page shows derived data from trade records rather than real market data, (4) Portfolio data is computed from trade history rather than actual on-chain balances, and (5) the Token Detail page is empty for most tokens because it relies on a discovery API that returns no results.')]),
        bp('The remaining 42 issues span data integrity problems (mock/fake data in swap, arbitrage, whale, pulse, and community pages), architectural concerns (duplicated symbol maps, fragmented price sources, missing cache strategy), UI/UX gaps (missing localization, poor empty states), code quality issues (excessive any types, dead code), and infrastructure gaps (missing rate limiting, no retry logic for API calls).', [normal('The remaining 42 issues span data integrity problems (mock/fake data in swap, arbitrage, whale, pulse, and community pages), architectural concerns (duplicated symbol maps, fragmented price sources, missing cache strategy), UI/UX gaps (missing localization, poor empty states), code quality issues (excessive any types, dead code), and infrastructure gaps (missing rate limiting, no retry logic for API calls).')]),

        // ── 2. Audit Methodology ──
        h1('2. Audit Methodology'),
        p('The audit was conducted through systematic codebase analysis of the VIXOR application repository. The methodology involved reading every major route file, server function, domain module, shared utility, and component to identify issues across eight categories: Critical Functionality, Data Integrity, Architecture, Charts & Visualization, UI/UX, Code Quality, Security & Infrastructure, and Deferred/Stubs. Each problem was classified by severity (CRITICAL, HIGH, MEDIUM, LOW), mapped to the affected file with line references, and assigned a roadmap phase for resolution. Problems marked with the new flag were identified during this audit session and were not part of the previous task backlog.'),
        p('The VIXOR codebase consists of approximately 300+ source files organized under src/routes (page components), src/domains (business logic), src/shared (utilities and shared state), src/components (UI primitives), and src/lib (legacy utilities). The application uses Supabase for authentication and data persistence, Binance and TwelveData for market data, DexScreener and GeckoTerminal for DEX data, and lightweight-charts for native chart rendering alongside TradingView widget embeds.'),

        // ── 3. Critical Issues (Detailed) ──
        h1('3. Critical Issues (Detailed Analysis)'),
        h2('3.1 Charts Do Not Work in Telegram WebView [#01]'),
        p('The TradingViewChart component (src/components/vixor/TradingViewChart.tsx) loads an external JavaScript library from https://s3.tradingview.com/tv.js via a dynamically created script element. Telegram WebView blocks external script loading from untrusted domains for security reasons, which means the TradingView widget never initializes. This is a critical issue because VIXOR is primarily distributed as a Telegram Mini App, making the chart experience completely broken for the primary user base.'),
        p('The fix requires replacing all TradingView iframe/widget embeds with native chart components using the lightweight-charts library, which is already installed as a dependency and used by CandlestickChart.tsx and DexChart.tsx. The charts page (charts.tsx) already conditionally uses CandlestickChart for crypto pairs but falls back to TradingViewChart for forex pairs. The token detail page (-token-symbol-component.tsx) also uses TradingViewChart for forex/commodity assets. Both need to be migrated to native lightweight-charts implementations using real OHLCV data from Binance (crypto) or TwelveData (forex/commodities).'),
        p('Additionally, the TradingViewChart component uses Math.random() to generate container IDs (line 107), which is non-deterministic and can cause issues with React strict mode double-rendering. This should be replaced with a counter-based or useId()-based approach.'),

        h2('3.2 AssetRegistry Static Bottleneck [#02]'),
        p('The AssetRegistry (src/shared/asset-registry/types.ts) is designed as a static singleton with exactly 18 hardcoded asset definitions: 10 crypto pairs (BTC, ETH, SOL, BNB, XRP, ADA, DOGE, AVAX, DOT, LINK), 1 commodity (XAU/USD), 7 forex pairs, 1 index (NASDAQ), and 1 stock (AAPL). The registry is instantiated once with a fixed ASSETS array and provides lookup methods (get, find, byCategory, etc.).'),
        p('This design creates a fundamental bottleneck because: (1) DEX tokens discovered via DexScreener cannot be registered in the AssetRegistry since they are dynamic and constantly changing; (2) meme coins and new listings require code changes to add to the registry, which is impractical for a discovery-focused app; (3) the token detail page attempts to look up assets via the registry for configuration (decimals, pip size, volatility) but fails for any token not in the static list, falling back to defaults; (4) the analysis engine uses AssetRegistry.pairConfig() to get trading parameters, meaning only the 18 pre-registered assets can be properly analyzed.'),
        p('The solution is to make AssetRegistry support dynamic registration: keep the 18 static assets as defaults, but allow runtime registration of new assets when discovered. This requires adding a register() method, a fallback configuration generator for unknown assets, and a persistence layer (database or cache) for frequently used dynamic assets.'),

        h2('3.3 Home Page Data Issues [#03]'),
        p('The home page (src/routes/_authenticated/index.tsx) imports getDashboardData and getHomeMarketData from @/shared/data. The getHomeMarketData function (lines 1194-1297) does fetch real data from Binance (top 20 crypto tickers), CoinGecko (BTC dominance), and alternative.me (Fear & Greed Index). However, the getDashboardData function (lines 365-460) derives all portfolio metrics (holdings, totalValue, totalPnl, winRate, tradeCount, recentActivity, liveSignals) exclusively from the user trades table in Supabase.'),
        p('For a new user with no trades recorded, getDashboardData returns all zeros: zero holdings, zero total value, zero PnL, zero win rate, and empty arrays for recent activity and signals. This makes the dashboard appear completely empty and non-functional. The dashboard should show real market data (top movers, trending pairs, market overview) alongside user-specific data, ensuring the page is informative even for users with no trading history.'),

        h2('3.4 Portfolio Fake Data [#04]'),
        p('The portfolio page (src/routes/_authenticated/portfolio.tsx) calls getPortfolioData (lines 6-75 in shared/data/index.ts), which computes all holdings by aggregating the user trades table. It sums quantities, averages entry prices, and calculates PnL from exit prices. However, it does NOT query any real wallet balances or on-chain data. The displayed portfolio is entirely derived from the user manual trade entries, not from any actual holdings.'),
        p('Similarly, the wallet-web3 page (wallet-web3.tsx) does attempt to fetch real wallet balances via Phantom (Solana) and MetaMask (EVM) adapters, but the main portfolio page ignores this. The user sees what appears to be their portfolio but is actually just a summary of their trade journal. This is misleading and needs to be addressed by either: (a) clearly labeling it as Trade History Summary, or (b) integrating real on-chain balance fetching for connected wallets.'),

        h2('3.5 Token Detail Page Empty [#05]'),
        p('The token detail page (src/routes/_authenticated/-token-symbol-component.tsx, 2832 lines) fetches token data from /api/discover?search={symbol} (line 254), then filters the user trades and analyses by symbol. For most tokens, especially those not in the top DexScreener boosted/new lists, the /api/discover endpoint returns an empty data array. This means tokenData is null, displayPrice is null, displayChange is null, and the entire stats section shows dashes.'),
        p('The page has logic for three asset types (crypto, forex, commodity) with appropriate chart rendering for each, but the data population is broken because: (1) the discover API is designed for browsing, not for looking up specific tokens; (2) for CEX tokens like BTC, ETH, SOL, the page should use the existing Binance WebSocket for live price data (which it does), but still shows no historical data or token info; (3) the page needs a dedicated token lookup function that fetches data from CoinGecko or DexScreener by token address, not the discover search endpoint.'),

        // ── 4. High Priority Issues ──
        h1('4. High Priority Issues (Problems #06-#23)'),
        h2('4.1 Data Integrity Issues (#06-#15)'),
        p('Problems #06 through #15 all relate to pages and features that display mock, fake, or misleadingly derived data instead of real information. The arbitrage scanner (#06) explicitly returns mode: "mock" with empty opportunities. The swap page (#07-#08) has hardcoded prices (SOL: 145.23, ETH: 3450.0) and mock balances that do not reflect any real wallet state. The OHLCV fallback (#09) generates fake deterministic price offsets when both Binance and TwelveData fail, which could mislead traders into thinking they are seeing real candle data.'),
        p('Several data pages (whale #11, pulse #12, alpha #13, bonding curves #14, communities #15) all derive their content exclusively from the authenticated user own trades and signals in Supabase. A user with no trading history sees completely empty pages. These features should either aggregate real market data (whale alerts from on-chain monitoring, market pulse from social sentiment, real alpha signals from technical screening) or clearly indicate they are user-specific views.'),
        p('The market news function (#10) returns an empty array when FINNHUB_API_KEY is not set in the environment, silently failing without any user feedback. This should either show a meaningful message or fall back to a free news source.'),

        h2('4.2 Architecture Issues (#16-#20)'),
        p('The codebase has significant architectural duplication. Symbol mappings between user-friendly pair names and API-specific formats exist in three separate locations: TradingViewChart.tsx (SYMBOL_MAP), -token-symbol-component.tsx (TV_SYMBOL_MAP), and asset-registry/types.ts (AssetDefinition.symbols). Any new pair addition requires updating all three files, which is error-prone and violates DRY principles. The AssetRegistry was designed to be the single source of truth but is not actually used by the chart components.'),
        p('Price data is fetched from 5+ different providers (Binance REST API, Binance WebSocket, DexScreener REST, DexScreener WebSocket, TwelveData, Finnhub, CoinGecko, Frankfurter, GeckoTerminal) without a centralized caching or coordination strategy. Each provider has its own retry logic, timeout handling, and error management, leading to inconsistent behavior. The N+1 API call problem in discover-crypto-data.ts (#20) means enriching 20 tokens requires 20 individual pair lookups to DexScreener, which can exhaust the rate limit of 60 requests per minute.'),

        h2('4.3 Chart Issues (#21-#23)'),
        p('Beyond the critical TradingView WebView issue, there are additional chart problems. The DexChart and CandlestickChart components use CSS custom properties (var(--color-bullish), var(--color-background)) in their chart options. While this works in the browser, the lightweight-charts library resolves these at render time, and some environments may not support CSS variable resolution in canvas contexts. There is no fallback chart component when TradingView fails to load in restricted environments like Telegram WebView, leaving users with a blank space or just an error message.'),

        // ── 5. Medium Priority Issues ──
        h1('5. Medium Priority Issues (Problems #24-#40)'),
        h2('5.1 UI/UX Issues (#24-#29)'),
        p('The home page greeting (index.tsx:38) uses English-only strings (Good Morning, Good Afternoon, Good Evening) despite the application having i18n infrastructure with Arabic and English translations. For a Telegram Mini App targeting Arabic-speaking users, this is a significant localization gap that should be addressed by using the existing useI18n hook.'),
        p('New users with no trading history encounter empty states on most pages (portfolio, whale, pulse, alpha, signals, journal, etc.). While some pages have EmptyState components with calls-to-action, the overall experience is barren. A better approach would be to show educational content, market overviews, or onboarding guidance when user data is unavailable. The gold price (XAU/USD) is fetched via Frankfurter ECB exchange rates rather than real-time spot gold prices, leading to stale or inaccurate pricing for gold-related analysis.'),

        h2('5.2 Code Quality Issues (#30-#35)'),
        p('Utility functions like fmtPrice, fmtCompact, and formatPrice are duplicated across at least 5 files (index.tsx, discover.tsx, -token-symbol-component.tsx, charts.tsx, portfolio.tsx). These should be consolidated into a single shared utility. The codebase has excessive use of the any type, particularly in data mapping functions in shared/data/index.ts where Supabase query results are cast without proper type definitions. A dead file (token-symbol-component.tsx) exists alongside the actual component (-token-symbol-component.tsx), which can cause confusion.'),

        h2('5.3 Security & Infrastructure Issues (#36-#40)'),
        p('The DexScreener client makes API calls without any rate limiting, which is particularly dangerous given the N+1 enrichment pattern in discover-crypto-data.ts. The Binance public API is used without an API key, meaning requests are subject to stricter rate limits (1200 requests per minute for unauthenticated vs 6000 for authenticated). Several server functions lack proper retry logic with exponential backoff, making the application fragile under transient network failures. WebSocket connections to Binance and DexScreener have no error boundaries or reconnection logic beyond what the browser provides natively.'),

        // ── 6. Low Priority Issues ──
        h1('6. Low Priority Issues (Problems #41-#47)'),
        p('The low priority issues include: the backtest engine (#41) which uses simulated/synthetic data rather than historical real data; the trading gateway dummy adapter (#42) which is a mock implementation for testing; the copilot AI analysis (#43) which has been reported to return BTC-specific analysis when asked about gold charts; notification channels (#44) where email and webhook integrations are stub implementations; the sound manager (#45) which is a no-op stub; the analytics module (#46) which is also a stub; and the brokers page (#47) which displays affiliate links without real broker API integration. These are all deferred to future phases and do not impact core functionality.'),

        // ── 7. Full Problem Registry Table ──
        h1('7. Full Problem Registry'),
        p('The following table lists all 47 identified problems with their severity, affected files, current status, roadmap phase assignment, and whether they are newly identified in this audit.'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: thinBorders,
          rows: [
            new TableRow({ cantSplit: true, tableHeader: true, children: [
              headerCell('#', 8), headerCell('Severity', 12), headerCell('Problem', 30),
              headerCell('File(s)', 25), headerCell('Status', 10), headerCell('Phase', 10), headerCell('New', 5),
            ]}),
            ...problems.map(r => makeProblemRow(r[0], r[1], r[2], r[3], r[4], r[5], r[6])),
          ],
        }),

        // ── 8. Roadmap Integration ──
        h1('8. Roadmap Integration'),
        h2('8.1 Phase C1: Immediate Critical Fixes (Session 1)'),
        p('Phase C1 addresses the most impactful user-facing issues that must be resolved first. The primary focus is replacing TradingView embeds with native lightweight-charts across all pages (charts.tsx, token detail page, forex/commodity views) to fix the Telegram WebView incompatibility. This phase also includes fixing the N+1 API call problem in discover-crypto-data.ts by implementing batch token pair lookups, and adding proper CSS variable resolution or fallback colors for chart components.'),
        bp('Scope: Problems #01, #20, #21, #22, #23, #26', [normal('Scope: Problems #01, #20, #21, #22, #23, #26')]),
        bp('Estimated effort: 4-6 hours', [normal('Estimated effort: 4-6 hours')]),

        h2('8.2 Phase C2: Architecture Refactor (Session 2)'),
        p('Phase C2 restructures the core architecture to eliminate the AssetRegistry bottleneck and consolidate duplicated code. The AssetRegistry will be upgraded to support dynamic registration with a runtime register() method and fallback configuration generation. All symbol maps will be consolidated into a single source of truth. A centralized price cache with proper invalidation will be implemented, and rate limiting will be added to all external API clients.'),
        bp('Scope: Problems #02, #16, #17, #18, #30, #31, #32, #33, #36, #37, #38, #39, #40', [normal('Scope: Problems #02, #16, #17, #18, #30, #31, #32, #33, #36, #37, #38, #39, #40')]),
        bp('Estimated effort: 6-8 hours', [normal('Estimated effort: 6-8 hours')]),

        h2('8.3 Phase C3: Real Data Integration (Session 3)'),
        p('Phase C3 replaces all mock and derived data with real data sources. The home page will be enhanced to show real market data (trending pairs, top movers, market overview) for all users, not just derived trade data. The portfolio will be labeled correctly or integrated with real on-chain balance fetching. The gold price source will be upgraded from ECB exchange rates to real-time spot prices. The OHLCV fallback will be removed and replaced with proper error states. The copilot AI analysis will be fixed to use the correct pair context.'),
        bp('Scope: Problems #03, #04, #09, #27, #28, #29, #43', [normal('Scope: Problems #03, #04, #09, #27, #28, #29, #43')]),
        bp('Estimated effort: 5-7 hours', [normal('Estimated effort: 5-7 hours')]),

        h2('8.4 Phase C4: Token Detail & UX Polish (Session 4)'),
        p('Phase C4 fixes the token detail page by implementing a dedicated token lookup function (CoinGecko or DexScreener by address), populating real token metadata for CEX tokens, and ensuring proper data display for all asset types. UI polish includes adding Arabic localization for the home page greeting, improving empty states for new users, and ensuring consistent formatting across all pages.'),
        bp('Scope: Problems #05, #24, #25', [normal('Scope: Problems #05, #24, #25')]),
        bp('Estimated effort: 3-5 hours', [normal('Estimated effort: 3-5 hours')]),

        h2('8.5 Deferred: Future Phases'),
        p('Problems #06, #07, #08, #10, #11, #12, #13, #14, #15, #19, #34, #35, #41, #42, #44, #45, #46, #47 are deferred to future development phases. These include replacing mock data in swap and arbitrage pages, implementing real whale/pulse/alpha/community data sources, and building out stub features like notifications, sound, and analytics. These are lower priority because they do not impact the core trading and charting experience.'),

        // ── 9. Summary Statistics ──
        h1('9. Summary Statistics'),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE }, borders: thinBorders,
          rows: [
            new TableRow({ cantSplit: true, tableHeader: true, children: [
              headerCell('Severity', 30), headerCell('Count', 20), headerCell('New This Audit', 25), headerCell('In Current Phase', 25),
            ]}),
            ...[['CRITICAL', '5', '5', '5'], ['HIGH', '18', '0', '18'], ['MEDIUM', '17', '0', '17'], ['LOW', '7', '0', '7']].map(r =>
              new TableRow({ cantSplit: true, children: [
                cell(r[0], 30, { bold: true, color: r[0] === 'CRITICAL' ? P.red : r[0] === 'HIGH' ? P.orange : r[0] === 'MEDIUM' ? P.blue : P.secondary }),
                cell(r[1], 20), cell(r[2], 25), cell(r[3], 25),
              ]})
            ),
            new TableRow({ cantSplit: true, children: [
              cell('TOTAL', 30, { bold: true }), cell('47', 20, { bold: true }), cell('5', 25, { bold: true }), cell('47', 25, { bold: true }),
            ]}),
          ],
        }),
      ],
    },
  ],
});

// ── Generate ──
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('/home/z/my-project/download/VIXOR_Audit_Report_47_Problems.docx', buf);
  console.log('English report generated successfully.');
});
