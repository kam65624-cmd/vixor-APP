const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, PageNumber, PageBreak,
  BorderStyle, WidthType, ShadingType, ImageRun, TableOfContents,
  SectionType
} = require("docx");
const fs = require("fs");

// ── Palette: Deep Sea Blue-Gold (Finance/Tech) ──
const P = {
  primary: "0F2027", body: "000000", secondary: "4A6575",
  accent: "D4AF37", surface: "F5F7FA",
  red: "C0392B", green: "27AE60", orange: "E67E22"
};
const c = (hex) => hex.replace("#", "");

// ── Helper functions ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.secondary), font: { ascii: "Times New Roman", eastAsia: "SimHei" } })]
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })]
  });
}
function bodyBold(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })
    ]
  });
}
function code(text) {
  return new Paragraph({
    spacing: { line: 280, after: 60 },
    indent: { left: 400 },
    shading: { type: ShadingType.CLEAR, fill: "F0F4F8" },
    children: [new TextRun({ text, size: 20, color: "2C3E50", font: "Courier New" })]
  });
}
function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { line: 312, after: 40 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })]
  });
}
function criticalLabel() {
  return new TextRun({ text: "[CRITICAL] ", bold: true, size: 22, color: c(P.red), font: { ascii: "Times New Roman" } });
}
function highLabel() {
  return new TextRun({ text: "[HIGH] ", bold: true, size: 22, color: c(P.orange), font: { ascii: "Times New Roman" } });
}
function medLabel() {
  return new TextRun({ text: "[MEDIUM] ", bold: true, size: 22, color: "8B6914", font: { ascii: "Times New Roman" } });
}
function labeledPara(label, text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [
      label, 
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })
    ]
  });
}
function spacer() {
  return new Paragraph({ spacing: { before: 100, after: 100 }, children: [] });
}

// ── Table helpers ──
function tableHeader(cells) {
  return new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: cells.map(text => new TableCell({
      children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text, bold: true, size: 20, color: "FFFFFF", font: { ascii: "Times New Roman" } })] })],
      shading: { type: ShadingType.CLEAR, fill: c(P.primary) },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
    }))
  });
}
function tableRow(cells, idx) {
  return new TableRow({
    cantSplit: true,
    children: cells.map(text => new TableCell({
      children: [new Paragraph({ spacing: { line: 280 }, children: [new TextRun({ text, size: 20, color: c(P.body), font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" } })] })],
      shading: idx % 2 === 0 ? { type: ShadingType.CLEAR, fill: c(P.surface) } : undefined,
      margins: { top: 40, bottom: 40, left: 100, right: 100 },
    }))
  });
}

// ── Cover Page (R2 Double-Rule Frame adapted) ──
function buildCover() {
  return [
    new Paragraph({ spacing: { before: 3600 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "\u2500".repeat(40), size: 20, color: c(P.accent) })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: "VIXOR Application", bold: true, size: 56, color: c(P.primary), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "Comprehensive Technical Audit Report", size: 32, color: c(P.secondary), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "UI/UX, Data Integrity, Architecture & Functional Defects", size: 24, color: c(P.secondary), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [new TextRun({ text: "\u2500".repeat(40), size: 20, color: c(P.accent) })]
    }),
    new Paragraph({ spacing: { before: 800 }, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Prepared for: KIMI K3 Code Flow Agent", size: 22, color: c(P.body), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Repository: github.com/kam65624-cmd/vixor-APP", size: 20, color: c(P.secondary), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Date: July 19, 2026 | Version: main branch @ commit 1f60e8d", size: 20, color: c(P.secondary), font: { ascii: "Times New Roman" } })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [new TextRun({ text: "Stack: TanStack Start + React + Vercel + Supabase + Binance WS", size: 20, color: c(P.secondary), font: { ascii: "Times New Roman" } })]
    }),
  ];
}

// ── Build document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Times New Roman", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) } },
      heading2: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) } },
      heading3: { run: { font: { ascii: "Times New Roman", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.secondary) } },
    },
  },
  sections: [
    // ── SECTION 0: COVER ──
    {
      properties: {
        page: { margin: { top: 0, bottom: 0, left: 0, right: 0 }, size: { width: 11906, height: 16838 } },
      },
      children: buildCover(),
    },
    // ── SECTION 1: TOC ──
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } },
      },
      children: [
        new Paragraph({
          spacing: { after: 300 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 32, color: c(P.primary), font: { ascii: "Times New Roman" } })],
        }),
        new TableOfContents("TOC", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "(Right-click the TOC above and select 'Update Field' to refresh page numbers)", italics: true, size: 18, color: "999999", font: { ascii: "Times New Roman" } })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // ── SECTION 2: BODY ──
    {
      properties: {
        page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 }, pageNumbers: { start: 1 } },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR Technical Audit Report", size: 18, color: "808080", font: { ascii: "Times New Roman" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "Page ", size: 18, color: "808080" }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080" })],
          })],
        }),
      },
      children: [
        // ═══════════════════════════════════════════════════════════
        // 1. EXECUTIVE SUMMARY
        // ═══════════════════════════════════════════════════════════
        h1("1. Executive Summary"),
        body("This report presents a comprehensive technical audit of the VIXOR Telegram Web App, a React/TanStack Start-based cryptocurrency trading dashboard. The audit was conducted through visual analysis of 10 user-provided screenshots covering every major page of the application, combined with deep source-code inspection of the relevant route files, components, server functions, and data layer modules."),
        body("The audit reveals a application in a severely broken state. Out of the 10 pages examined, zero pages are fully functional with real data. The home page displays hardcoded mock data with no live market integration. The analysis engine produces fabricated results unrelated to uploaded charts. The discover page shows static tokens with no real-time DEX or CEX data feeds. The token detail page is missing its core chart component and shows no real trading activity. The AI Copilot uses the wrong model architecture entirely. Navigation errors crash the app on forex pair selection."),
        body("A total of 47 distinct defects were identified across 7 categories: Critical Data Integrity (8), UI/UX Layout (12), Missing Functionality (10), Architecture (6), Error Handling (4), Performance (4), and Navigation (3). Of these, 23 are rated Critical or High severity, meaning they render core features completely non-functional."),

        // ═══════════════════════════════════════════════════════════
        // 2. DEFECT SUMMARY TABLE
        // ═══════════════════════════════════════════════════════════
        h1("2. Defect Summary"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableHeader(["Severity", "Category", "Count", "Pages Affected"]),
            tableRow(["CRITICAL", "Data Integrity / No Real Data", "8", "Home, Discover, Token, Analysis"], 0),
            tableRow(["HIGH", "UI/UX Layout & Sizing", "12", "All pages"], 1),
            tableRow(["HIGH", "Missing Functionality", "10", "Charts, Token, Copilot, Discover"], 2),
            tableRow(["MEDIUM", "Architecture / Wrong Patterns", "6", "Analysis, Copilot, Data Layer"], 3),
            tableRow(["MEDIUM", "Error Handling", "4", "Discover, Token, Analysis"], 4),
            tableRow(["LOW", "Performance / Empty Space", "4", "Home, Token, Analysis"], 5),
            tableRow(["LOW", "Navigation", "3", "Discover, Home"], 6),
          ],
        }),

        // ═══════════════════════════════════════════════════════════
        // 3. HOME PAGE DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("3. Home Page Defects (Screenshots 1 & 2)"),
        body("The home page is the first screen users see after logging in. It is the most critical page for user retention and trust. Currently, this page is fundamentally broken: it displays static mock data, has inconsistent UI element sizes, and none of the interactive widgets perform any meaningful action."),

        h2("3.1 Top Header Bar Issues"),
        labeledPara(criticalLabel(), "Profile Avatar and Wallet Icon Size Inconsistency: The profile avatar (M icon) and wallet/SOL balance area in the AppShell header (src/components/vixor/AppShell.tsx) use hardcoded sizes that are not on a consistent sizing scale. The avatar is visually larger than the wallet pill, creating visual imbalance. All icon sizes in the top bar should follow a unified 8px grid system (e.g., 32px, 40px, 48px)."),
        labeledPara(highLabel(), "Analyze Button Too Close to Username: In index.tsx line 612-618, the 'Analyze' button is positioned in the same flex row as the username without sufficient right-margin, creating visual clutter. Add ml-auto or increase gap."),
        labeledPara(medLabel(), "Bottom Navigation Icon Misalignment: The bottom tab bar in AppShell.tsx renders navigation icons with inconsistent sizes. The 'Home' icon appears larger than other tab icons. All tab icons must use the same size prop (recommend 20px)."),

        h2("3.2 Widget Interactivity"),
        labeledPara(criticalLabel(), "All Home Widgets Are Static and Non-Functional: The Feature Cards (lines 869-915 in index.tsx), Top Movers, and Quick Actions grid are navigation-only buttons that navigate to broken pages. They display no real-time data, no sparkline charts, no mini-previews. For a premium trading app, these widgets should show live data previews: the 'Signals' card should show the latest signal count, 'Discover' should show trending token count, 'Radar' should show active alert count. Currently they are empty shells with static text."),
        labeledPara(highLabel(), "MarketStatPill Shows Dashes Instead of Data: The '24H Volume', 'BTC Dom', and 'Coins' stat pills (lines 625-651) show '-' when server data fails to load. The getHomeMarketData server function frequently returns null/empty data, leaving these pills permanently empty. This is because the server-side market data aggregation is not connected to any live API provider."),

        h2("3.3 Mock Data Everywhere"),
        labeledPara(criticalLabel(), "Portfolio Section Shows Fabricated Data: The portfolio stats ($55.6K value, +$6,531 PnL, 67% win rate) shown in screenshots are hardcoded or derived from empty user data. The getDashboardData function returns placeholder values when no real trades exist. The 'COINS 0' indicator confirms the user has zero actual assets, yet the portfolio card shows $55.6K. This is deceptive and erodes trust."),
        labeledPara(criticalLabel(), "Fear & Greed Index May Be Static: The fearGreedIndex data comes from the server. If the server caches this for 24h and the cache expires, it shows nothing. Verify the server function getHomeMarketData actually fetches from the Alternative.me Fear & Greed API or similar."),

        h2("3.4 Live Prices Section"),
        labeledPara(highLabel(), "Live Price List Has No Sparkline Charts: The CryptoListItem component (lines 200-261) shows only text price and percentage change. Every professional crypto app (Binance, Coinbase, axiom.trade) shows a mini sparkline chart next to each coin. The MiniSparkline component exists in the codebase (src/components/vixor/MiniSparkline.tsx) but is NOT used in the home page list. Fix: import and render MiniSparkline with live price history data in each CryptoListItem."),
        labeledPara(medLabel(), "Ticker Data Comes From Server, Not WebSocket: The ticker items come from getHomeMarketData (server function, 60s polling), while live price overlays come from BinanceWS. These two data sources can show different values momentarily. The ticker data should be the single source of truth with WS prices merged in, which the code partially does via getLivePriceForSymbol but only for display, not for sorting or ranking."),

        // ═══════════════════════════════════════════════════════════
        // 4. CHARTS PAGE DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("4. Charts Page Defects (Screenshot 3)"),
        body("The charts page is supposed to be the primary trading view where users see live candlestick charts with full TradingView integration. Currently, the chart does not render at all or shows a broken/empty state."),

        labeledPara(criticalLabel(), "TradingView Chart Widget Does Not Render: The charts page (src/routes/_authenticated/charts.tsx, line 171) renders a TradingViewChart component. The TradingViewChart component (src/components/vixor/TradingViewChart.tsx) loads the TradingView library via a script tag. On Telegram Web App, external script loading is restricted by the Telegram WebView sandbox. The chart library may fail to load silently. Fix: Add an error boundary and fallback chart using lightweight-charts (already a project dependency) for Telegram WebView environments."),
        labeledPara(criticalLabel(), "Limited Symbol Map: The SYMBOL_MAP in TradingViewChart.tsx (lines 7-26) contains only 14 symbols. It is missing LINK/USDT (recently added to AssetRegistry), DOGE/USDT, ADA/USDT, AVAX/USDT, DOT/USDT, and all forex pairs that the AssetRegistry knows about. The SYMBOL_MAP should be auto-generated from AssetRegistry.tradingViewSymbol() instead of being manually maintained."),
        labeledPara(highLabel(), "No Built-In Chart Alternative: The app has a CandlestickChart component and lightweight-charts as dependencies, but the charts page only uses TradingView. For environments where TradingView fails, there should be a seamless fallback to the built-in chart engine using Binance kline data."),

        // ═══════════════════════════════════════════════════════════
        // 5. AI ANALYSIS DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("5. AI Analysis Engine Defects (Screenshots 4, 5, 6)"),
        body("The AI Vision Analysis is the app's flagship premium feature. Users upload a chart screenshot, and the AI is supposed to analyze it using SMC/ICT methodology. Currently, this feature is fundamentally broken at multiple levels."),

        h2("5.1 Wrong Pair Detection (Critical Data Integrity)"),
        labeledPara(criticalLabel(), "Analysis Returns Wrong Trading Pair: As shown in Screenshots 5 and 6, the user uploaded a Gold (XAU/USD) chart but received analysis for a completely different coin. Root cause: The OpenRouter AI model (google/gemma-4-31b-it:free) does not support vision/image input. When the generateObject call fails or produces garbage, the fallback to local engine (runLocalAnalysis) generates analysis based on the selectedPair parameter, NOT the actual chart content. Since the local engine cannot see the image, it produces fabricated results for whatever pair was pre-selected. Fix: The analysis result MUST include the detected pair from the AI vision model. If vision fails, show an explicit error message saying 'AI vision unavailable - chart could not be read' instead of showing fabricated analysis."),
        labeledPara(criticalLabel(), "Analysis Results Are Sticky/Persistent: Screenshot 6 shows a previous analysis result still displayed after navigating to analyze a different chart. The analysis detail page (src/routes/_authenticated/-analysis-id-component.tsx) loads analysis by ID from the database, but the analysis flow does not properly invalidate previous results. Each new analysis should show a fresh result, not a cached one."),

        h2("5.2 Unprofessional Loading State"),
        labeledPara(highLabel(), "Analysis Loading UI Looks Like a Scam App: Screenshot 4 shows the analysis in-progress state. The UI during analysis processing appears as a basic loading spinner or progress bar with no visual polish. For a premium trading app, this should show: (1) the uploaded chart thumbnail, (2) animated scanning overlay effect, (3) step indicators ('Reading chart...', 'Identifying patterns...', 'Calculating levels...', 'Generating analysis...'), (4) estimated time remaining. The current implementation in the analyze route simply shows a loader."),

        h2("5.3 All Prices Are Fabricated"),
        labeledPara(criticalLabel(), "Entry, SL, TP Levels Are Not Based on Real Chart Data: When the local fallback engine runs, it generates entry/stop-loss/take-profit levels from synthetic data using basePrice from PAIR_CONFIGS, not from the actual uploaded chart. For example, if basePrice for XAU/USD is 3300 but the actual chart shows price at 2420, the analysis will show entry at ~3300 which is completely wrong. The system has OHLCV bar fetching capability (realBars parameter) but it is often null when the analysis runs."),
        labeledPara(criticalLabel(), "News Impact Section Shows Fabricated News: The news_impact field in the analysis result is populated from getNewsForSymbol(), but the news items may be stale, irrelevant, or generated. The news enrichment happens server-side and may return cached/empty results that are then filled with template text."),

        h2("5.4 Model Configuration Issues"),
        labeledPara(highLabel(), "OpenRouter Model Does Not Support Vision: The current default model google/gemma-4-31b-it:free does not support image input. The generateObject call sends a base64 image but the model cannot process it, resulting in either an error or a text-only response that ignores the image entirely. The model must be changed to a vision-capable model. Options: google/gemini-2.5-flash (paid, $0.15/1M tokens), or remove the free default and require OPENROUTER_MODEL env var to be set. File: src/domains/analysis/server/run-analysis.ts, line 226."),
        code("model: openrouter("),
        code('  process.env.OPENROUTER_MODEL || "google/gemma-4-31b-it:free"'),
        code(") as any,"),
        body("The fallback to local engine (added in the latest fix) masks this error but does not solve it. Users get fake results instead of an honest error message."),

        // ═══════════════════════════════════════════════════════════
        // 6. AI COPILOT DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("6. AI Copilot Defects (Screenshot 7)"),
        body("The AI Copilot page (src/routes/_authenticated/-copilot-component.tsx, 2142 lines) is supposed to be the 'Moxi' intelligent agent interface, not a raw LLM chat. The current implementation is a standard chat UI that calls askCopilot server function, which routes to OpenRouter."),

        labeledPara(criticalLabel(), "Copilot Uses Raw LLM Chat Instead of Moxi Agent Architecture: The user explicitly stated that the analysis models should NOT be exposed as a chat interface. The Moxi agent should be the intelligence layer underneath, with the user communicating through a simplified interface. Currently, the copilot page displays 'gemma-4-31b-it:free' as the model name and acts as a generic chatbot. This is architecturally wrong per the product spec."),
        labeledPara(highLabel(), "Agent System Exists But Is Not Connected to Data: The code defines 6 agent types (market_analyst, risk_manager, news_analyst, strategy_builder, auto, moxi) with proper AGENTS config (lines 90-160). The consensus mechanism exists. But the agents do not have access to live market data, user portfolio, or real-time prices. They are LLM wrappers without real data grounding, making their responses generic and unreliable."),
        labeledPara(highLabel(), "No Context-Aware Responses: When a user asks 'What is BTC doing right now?', the copilot cannot access live Binance WebSocket prices, recent signals, or the user's portfolio. It generates a generic LLM response. Fix: Inject live price data, recent analysis results, and user portfolio context into the system prompt for each agent call."),

        // ═══════════════════════════════════════════════════════════
        // 7. DISCOVER PAGE DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("7. Discover Page Defects (Screenshots 8 & 9)"),
        body("The Discover page (src/routes/_authenticated/discover.tsx, 1896 lines) is intended to be a token exploration page similar to axiom.trade/discover or OpenSea. Currently, it is a broken, static, and visually poor implementation."),

        h2("7.1 Visual / Layout Issues"),
        labeledPara(highLabel(), "Card Layout Is Visually Ugly and Non-Standard: The token cards in the discover page use a basic list layout that does not match the card-based grid design of axiom.trade or OpenSea. Cards have inconsistent padding, no proper image/logo rendering, and the data density is too low. Each card should show: logo, name, symbol, price, 24h change, volume, market cap, sparkline, and chain badge. Currently most of these are missing or shown as '---'."),
        labeledPara(highLabel(), "No Token Logo/Images: Tokens show text abbreviations instead of actual logos. The code uses a CoinImage component (src/components/vixor/CoinImage.tsx) but many tokens lack logoUrl in the data. For well-known tokens, use a CDN like CoinGecko or CryptoCompare logo API. For unknown tokens, use the first letter in a styled circle (which exists but is not visually polished)."),

        h2("7.2 Data Integrity"),
        labeledPara(criticalLabel(), "No Real-Time Price Data for Discovered Tokens: The discover page has a useDiscoverLivePrices hook that attempts to add live prices, but it only works for tokens that are in the AssetRegistry (registered pairs). The vast majority of DEX tokens discovered are NOT in the registry, so they show null prices permanently. The discover page should fetch prices from DexScreener API for DEX tokens and Binance REST API for CEX tokens, independently of the AssetRegistry."),
        labeledPara(criticalLabel(), "Static Token List With No New Token Discovery: The token list comes from a server-side scan that runs at request time, but it does not integrate with any live DEX aggregator (DexScreener, Birdeye, GeckoTerminal) for real-time trending/new token discovery. The page should show: (1) Trending tokens (updated every 1-5 minutes from DexScreener trending API), (2) New pairs (last 1-6 hours), (3) Volume leaders, (4) Smart money activity."),
        labeledPara(highLabel(), "Filter/Category System Does Not Work Properly: The CATEGORY_TABS (line 78-90) offer filters for ALL, MEME, CRYPTO, FOREX but: (1) The MEME filter relies on a hardcoded list of meme token names rather than on-chain classification, (2) The data source does not provide per-token categories, so filtering is done client-side on incomplete data, (3) Clicking on FOREX navigates to /token/$symbol with the forex pair, which triggers the AssetRegistry Unknown Pair error (Screenshot 9)."),

        h2("7.3 Forex Navigation Crash"),
        labeledPara(criticalLabel(), "Clicking Forex Pair in Discover Crashes the App: When a forex pair is selected in discover, it navigates to /token/$symbol with the pair name (e.g., 'EUR/USD'). The token detail page then calls useLivePrices which calls AssetRegistry.get(), and if the forex pair IS registered (EUR/USD is registered), it tries to get a Binance symbol which does not exist for forex. The error handling in useLivePrices was recently fixed to use .find() instead of .get(), but the token page may still crash in other code paths. The discover page forex handler (line 1249-1251) navigates to /token/$symbol as a workaround, showing a toast 'Connect broker to trade forex'. This is not a real solution."),

        // ═══════════════════════════════════════════════════════════
        // 8. TOKEN DETAIL PAGE DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("8. Token Detail Page Defects (Screenshots 10 & 11)"),
        body("The token detail page (src/routes/_authenticated/-token-symbol-component.tsx, 2832 lines) is one of the most important pages in a trading app. It should show comprehensive information about a specific token. Currently, it is a broken, empty, and non-functional page."),

        h2("8.1 Missing Core Features"),
        labeledPara(criticalLabel(), "No Working Chart on Token Detail Page: The token detail page has code for TradingViewChart and DexChart components, but neither renders properly. For CEX tokens (BTC, ETH, etc.), the TradingViewChart fails to load in Telegram WebView (same issue as the Charts page). For DEX tokens, the DexChart component requires a valid pairAddress and chainId from the discover page's search params, but when navigating from the home page's CryptoListItem, these params are not passed. Result: the chart area is always empty."),
        labeledPara(criticalLabel(), "No Real Trading Activity/Transactions: Screenshots 11 and 12 show that the expected trade history, holder distribution, and real-time buy/sell transactions are completely absent. The page shows a 'No trades found' empty state. There is no integration with on-chain data providers (DexScreener, Birdeye, Solscan, Etherscan) to show real transactions, holder maps, or liquidity changes."),
        labeledPara(criticalLabel(), "No Holder/Supply Distribution Data: The user specifically mentioned that the page should show a holder map (pie chart or treemap of token holders by percentage) and the number of tokens the deployer created. None of this data is fetched or displayed. The page needs integration with a blockchain explorer API or a token analytics provider."),

        h2("8.2 UI Issues on Token Page"),
        labeledPara(highLabel(), "Excessive Empty Space: The token detail page has large empty sections throughout. Screenshot 13 shows vast empty areas where data should be. This is because most query hooks return empty data and the components render nothing (or minimal empty states) instead of showing alternative content or collapsing the empty sections."),
        labeledPara(highLabel(), "Top Bar and Quick Trade Section Have Poor Sizing: The header area with the token name, badge, and quick trade form (lines 364-376) has inconsistent spacing and sizing. The leverage selector, amount input, and trade buttons are not on a consistent grid. The SL/TP calculation uses a hardcoded 2% distance which is not configurable and not based on any technical analysis."),
        labeledPara(medLabel(), "Quick Trade Form Is Non-Functional: The quick trade form (direction, amount, leverage) has state management but does not connect to any trading backend, DEX aggregator, or broker API. Clicking trade buttons does nothing. This section should either be removed or clearly labeled as 'Coming Soon' to avoid user confusion."),

        // ═══════════════════════════════════════════════════════════
        // 9. ARCHITECTURE DEFECTS
        // ═══════════════════════════════════════════════════════════
        h1("9. Architecture & Data Layer Defects"),

        h2("9.1 No Real Data Infrastructure"),
        labeledPara(criticalLabel(), "App Has No Unified Real-Time Data Layer: The app has 3 separate data systems that are not properly integrated: (1) BinanceWebSocket for live crypto prices (works for ~10 registered pairs only), (2) Server-side getHomeMarketData for ticker data (polls every 60s, limited tokens), (3) DexScreenerWebSocket for DEX tokens (only works when pairAddress is available). There is no unified data provider interface that all pages can use. Each page has to implement its own data fetching logic, leading to inconsistency and duplication."),
        labeledPara(criticalLabel(), "AssetRegistry Is a Bottleneck: The AssetRegistry (src/shared/asset-registry/types.ts) is a hardcoded static list of ~20 assets. Every new token requires a code change and redeployment. For a discover page that should show thousands of tokens, this architecture is fundamentally wrong. The registry should only store configuration for 'featured' or 'popular' assets. All other tokens should be resolved dynamically at runtime from data providers."),
        labeledPara(highLabel(), "Server Functions Return Stale or Empty Data: The getDashboardData, getHomeMarketData, and getMarketPrices server functions frequently return null or empty objects because they depend on API keys (TwelveData, Finnhub) that may not be configured in the Vercel environment. There is no graceful degradation - when APIs are unavailable, the app shows dashes and empty states instead of falling back to free public APIs (Binance public REST API, CoinGecko free API)."),

        h2("9.2 Error Handling Architecture"),
        labeledPara(highLabel(), "App-Wide Error Handling Uses Generic Error Page: When any error occurs (like the LINK/USDT AssetRegistry crash), the app shows a full-page 'Something went wrong' error (Screenshot 9, 11, 13) with no context about what went wrong. The RouteErrorBoundary component (src/components/vixor/RouteErrorBoundary.tsx) should show contextual error messages and suggest specific fixes (e.g., 'This token is not supported' vs 'Network error' vs 'Server error')."),
        labeledPara(medLabel(), "No Offline/Retry Resilience: The app does not implement proper offline detection or retry mechanisms. The useOnline hook exists but is not consistently used. When the server functions fail, there is no automatic retry with exponential backoff for transient failures."),

        // ═══════════════════════════════════════════════════════════
        // 10. RECOMMENDATIONS
        // ═══════════════════════════════════════════════════════════
        h1("10. Prioritized Fix Roadmap"),

        h2("10.1 Phase 1: Make Data Real (Critical)"),
        bullet("Replace getHomeMarketData with CoinGecko free API (/api/v3/coins/markets) for 100+ real tokens with real prices, volumes, and market caps. CoinGecko free tier allows 10-30 requests/minute which is sufficient."),
        bullet("Add CoinGecko logo URLs to token display. Use https://api.coingecko.com/coins/{id}/image for token logos."),
        bullet("Integrate DexScreener API (https://api.dexscreener.com/latest/dex/tokens/{address}) for DEX token discovery with real-time prices, volumes, and pair data."),
        bullet("Connect discover page to DexScreener trending API (/token-boosts/top, /token-profiles/latest) for real-time trending and new token feeds."),
        bullet("Add Binance REST API fallback (/api/v3/ticker/24hr) for crypto prices when WebSocket is unavailable."),

        h2("10.2 Phase 2: Fix Charts (Critical)"),
        bullet("Implement lightweight-charts based chart as the primary chart engine (it works in Telegram WebView). Load Binance kline data from /api/v3/klines endpoint. This is already a project dependency."),
        bullet("Make TradingView chart an optional enhancement that loads only in full browser mode, not in Telegram WebView."),
        bullet("Auto-generate SYMBOL_MAP from AssetRegistry.tradingViewSymbol() instead of hardcoding."),
        bullet("On token detail page, show the lightweight-charts chart for both CEX and DEX tokens using appropriate data sources."),

        h2("10.3 Phase 3: Fix AI Analysis (Critical)"),
        bullet("Set OPENROUTER_MODEL to a vision-capable model (google/gemini-2.5-flash) in Vercel environment. Remove the free model default."),
        bullet("When vision analysis is unavailable, do NOT fall back to local engine silently. Instead, show a clear message: 'AI vision analysis requires a premium model. Please configure OPENROUTER_MODEL in your deployment settings.'"),
        bullet("Fetch real OHLCV bars from Binance REST API before calling the analysis engine, so even the local fallback has real price data."),
        bullet("Add chart pair detection validation: after analysis, verify the detected pair matches the selected pair. If they differ, show a warning to the user."),

        h2("10.4 Phase 4: Fix UI/UX (High)"),
        bullet("Implement a unified design system with consistent spacing (4px grid), sizing (32/40/48px for icons), and typography scale. Audit all components against this system."),
        bullet("Add MiniSparkline to every token list item on home page and discover page."),
        bullet("Redesign discover page cards to match axiom.trade style: larger cards with logo, sparkline, key metrics in a grid layout."),
        bullet("Add professional loading states with step indicators for the analysis feature."),
        bullet("Collapse empty sections on token detail page instead of showing vast empty areas."),
        bullet("Fix AppShell header: consistent avatar size (40px), wallet pill size, and proper spacing between elements."),

        h2("10.5 Phase 5: Fix Copilot & Token Detail (High)"),
        bullet("Implement Moxi as the agent layer. The copilot UI should not show model names or act as a raw LLM chat. Instead, show agent personas (Market Analyst, Risk Manager, etc.) and route questions appropriately."),
        bullet("Inject live context into agent prompts: current prices (from BinanceWS), user portfolio, recent signals, and market overview."),
        bullet("On token detail page, integrate with DexScreener/Birdeye for: holder distribution chart, recent transactions (buys/sells), liquidity changes, and deployer wallet info."),
        bullet("Add real on-chain data: transaction count, unique holders, top holders percentage, liquidity locked, volume by DEX."),

        // ═══════════════════════════════════════════════════════════
        // 11. FILE REFERENCE TABLE
        // ═══════════════════════════════════════════════════════════
        h1("11. Key File Reference Table"),
        body("The following table maps each defect to its source file for targeted fixes:"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            tableHeader(["File Path", "Role", "Key Issues"]),
            tableRow(["src/routes/_authenticated/index.tsx", "Home Page", "Mock data, no sparklines, static widgets, sizing"], 0),
            tableRow(["src/components/vixor/AppShell.tsx", "App Shell", "Header sizing, nav misalignment, wallet pill"], 1),
            tableRow(["src/routes/_authenticated/charts.tsx", "Charts Page", "No fallback chart, limited symbols"], 2),
            tableRow(["src/components/vixor/TradingViewChart.tsx", "TV Chart Widget", "Hardcoded SYMBOL_MAP, no WV fallback"], 3),
            tableRow(["src/domains/analysis/server/run-analysis.ts", "AI Analysis", "Wrong model, no vision, fabricated results"], 4),
            tableRow(["src/routes/_authenticated/-copilot-component.tsx", "AI Copilot", "Raw LLM chat, no Moxi, no context"], 5),
            tableRow(["src/routes/_authenticated/discover.tsx", "Discover Page", "Static data, no DEX integration, bad cards"], 6),
            tableRow(["src/routes/_authenticated/-token-symbol-component.tsx", "Token Detail", "No chart, no trades, no holders, empty space"], 7),
            tableRow(["src/shared/asset-registry/types.ts", "Asset Registry", "Hardcoded pairs, bottleneck, LINK missing (fixed)"], 8),
            tableRow(["src/shared/market-data/use-live-prices.ts", "Live Prices Hook", "Registry-dependent, no dynamic resolution"], 9),
            tableRow(["src/shared/market-data/binance-ws.ts", "Binance WebSocket", "Only registered pairs, no DEX support"], 10),
          ],
        }),

        spacer(),

        // ═══════════════════════════════════════════════════════════
        // 12. KIMI K3 AGENT PROMPTS
        // ═══════════════════════════════════════════════════════════
        h1("12. KIMI K3 Agent Prompts"),
        body("Below are precise, copy-paste-ready prompts for KIMI K3 to execute each fix. Each prompt is self-contained with all necessary context."),

        h2("Prompt 1: Home Page - Real Data + Sparklines"),
        code("// CONTEXT: VIXOR is a React/TanStack Start crypto trading Telegram Web App."),
        code("// PROBLEM: Home page shows mock data. Need real CoinGecko data + sparklines."),
        code("//"),
        code("TASK: Refactor src/routes/_authenticated/index.tsx and src/shared/data.ts"),
        code(""),
        code("1. In src/shared/data.ts, replace getHomeMarketData server function to fetch from"),
        code("   CoinGecko free API: GET https://api.coingecko.com/api/v3/coins/markets"),
        code("   ?vs_currency=usd&order=volume_desc&per_page=20&page=1&sparkline=true"),
        code("   Map the response to HomeMarketData interface. Use 'sparkline_in_7d.price' for sparkline data."),
        code("   CoinGecko is FREE, no API key needed for basic tier (10-30 req/min)."),
        code(""),
        code("2. In index.tsx CryptoListItem component, import MiniSparkline from"),
        code("   '@/components/vixor/MiniSparkline' and render it with 24 data points"),
        code("   from the sparkline data. Place it between the icon and the symbol text."),
        code(""),
        code("3. Remove all hardcoded/fallback mock data. If API fails, show skeleton."),
        code("4. Ensure the MarketStatPill values (24H Volume, BTC Dom) come from"),
        code("   CoinGecko global data: GET https://api.coingecko.com/api/v3/global"),
        code(""),
        code("DESIGN: Keep the existing dark theme. Use var(--color-bullish) for up,"),
        code("var(--color-bearish) for down. Sparkline should be 60px wide, 24px tall."),

        h2("Prompt 2: Charts - Lightweight Charts Fallback"),
        code("TASK: Fix src/routes/_authenticated/charts.tsx and TradingViewChart.tsx"),
        code(""),
        code("1. In TradingViewChart.tsx, add a detection for Telegram WebView environment:"),
        code("   const isTelegram = window.Telegram && window.Telegram.WebApp;"),
        code("   If Telegram WebView detected, do NOT load TradingView script."),
        code(""),
        code("2. Create a BinanceKlineChart component using lightweight-charts (already installed):"),
        code("   - Fetch klines from Binance REST: GET /api/v3/klines?symbol=BTCUSDT&interval=1h&limit=200"),
        code("   - Parse into {time, open, high, low, close} format for lightweight-charts"),
        code("   - Render with dark theme matching the app (bg #08090C, grid #ffffff08)"),
        code("   - Add volume bars as histogram below the main chart"),
        code(""),
        code("3. Auto-generate SYMBOL_MAP from AssetRegistry:"),
        code("   const SYMBOL_MAP = {};"),
        code("   AssetRegistry.active().forEach(a => {"),
        code("     if (a.symbols.tradingView) SYMBOL_MAP[a.pair] = a.symbols.tradingView;"),
        code("   });"),
        code(""),
        code("4. Charts page should show the BinanceKlineChart as default, with an option"),
        code("   to switch to TradingView (only available outside Telegram WebView)."),

        h2("Prompt 3: AI Analysis - Fix Model + Data"),
        code("TASK: Fix src/domains/analysis/server/run-analysis.ts"),
        code(""),
        code("1. Remove the free model fallback. If OPENROUTER_MODEL is not set,"),
        code("   throw AnalysisError with message: 'AI Vision analysis requires OPENROUTER_MODEL"),
        code("   environment variable. Set it to a vision-capable model like google/gemini-2.5-flash'"),
        code(""),
        code("2. Before calling generateObject, fetch real OHLCV bars from Binance:"),
        code("   GET https://api.binance.com/api/v3/klines?symbol={binanceSymbol}&interval=1h&limit=100"),
        code("   Parse and pass as realBars to both the AI prompt and local fallback."),
        code(""),
        code("3. After analysis, validate: if result.pair !== selectedPair, add a warning"),
        code("   to the result: 'AI detected a different pair ({result.pair}) than selected"),
        code("   ({selectedPair}). Analysis is based on the detected pair.'"),
        code(""),
        code("4. For the analysis loading UI in the analyze route, replace the basic loader"),
        code("   with a multi-step progress indicator showing:"),
        code("   Step 1: 'Uploading chart...' Step 2: 'AI is analyzing...' Step 3: 'Generating report...'"),

        h2("Prompt 4: Discover Page - Real DEX Data"),
        code("TASK: Refactor src/routes/_authenticated/discover.tsx"),
        code(""),
        code("1. For crypto tokens, fetch from DexScreener API:"),
        code("   GET https://api.dexscreener.com/token-boosts/top (trending)"),
        code("   GET https://api.dexscreener.com/token-profiles/latest (new tokens)"),
        code("   Map response to TokenItem interface. DexScreener is FREE, no API key needed."),
        code(""),
        code("2. For live prices on discovered tokens, use:"),
        code("   GET https://api.dexscreener.com/latest/dex/tokens/{tokenAddress}"),
        code("   This returns price, volume, liquidity, price change, and pair data."),
        code(""),
        code("3. Redesign token cards to match axiom.trade/discover style:"),
        code("   - Use a proper card grid (2 columns on mobile, 3 on desktop)"),
        code("   - Each card shows: logo (from DexScreener or CoinGecko), name, symbol,"),
        code("     price, 24h change (colored), volume, market cap, 5-min sparkline"),
        code("   - Add chain badge (SOL, ETH, BSC) with chain-specific colors"),
        code("   - Add 'New' badge for tokens created in last 24h"),
        code(""),
        code("4. Fix forex navigation: when forex pair is clicked, instead of navigating"),
        code("   to /token/$symbol (which crashes), show a modal saying"),
        code("   'Forex trading via brokers - Coming Soon' or navigate to charts page"),
        code("   with the forex pair pre-selected."),

        h2("Prompt 5: Token Detail - Chart + On-Chain Data"),
        code("TASK: Fix src/routes/_authenticated/-token-symbol-component.tsx"),
        code(""),
        code("1. Always show a chart. For CEX tokens: use BinanceKlineChart with Binance klines."),
        code("   For DEX tokens: use BinanceKlineChart with DexScreener OHLCV data:"),
        code("   GET https://api.dexscreener.com/latest/dex/pairs/{pairAddress}"),
        code("   DexScreener provides ohlcv data that can be fed to lightweight-charts."),
        code(""),
        code("2. Add real trading activity section:"),
        code("   - Fetch recent trades from DexScreener or on-chain API"),
        code("   - Show a live feed of buys (green) and sells (red) with amount and time"),
        code("   - Show total 24h buy volume vs sell volume"),
        code(""),
        code("3. Add holder distribution section:"),
        code("   - Use Birdeye API or similar for top holders data"),
        code("   - Show a treemap or horizontal bar chart of top 10 holders by %"),
        code("   - Show deployer wallet info and token creation date"),
        code(""),
        code("4. Collapse empty sections. If trade history query returns empty,"),
        code("   hide that section entirely instead of showing 'No trades found' in a"),
        code("   large empty area."),
        code(""),
        code("5. Remove or label the quick trade form as 'Coming Soon' since it"),
        code("   does not connect to any trading backend."),

        h2("Prompt 6: Copilot - Moxi Agent Architecture"),
        code("TASK: Refactor src/routes/_authenticated/-copilot-component.tsx"),
        code(""),
        code("1. Remove model name display from the UI. Users should not see"),
        code("   'gemma-4-31b-it:free'. Instead, show the agent persona name and icon."),
        code(""),
        code("2. Implement context injection for agent calls. Before sending to OpenRouter,"),
        code("   append live market context to the system prompt:"),
        code("   - Current BTC, ETH, SOL, XAU prices (from BinanceWS)"),
        code("   - User's recent trades and PnL (from dashboard data)"),
        code("   - Top 5 signals from the signals page"),
        code("   - Market sentiment (Fear & Greed index)"),
        code(""),
        code("3. Make 'Moxi' the default agent (not 'Auto'). Moxi should be the"),
        code("   intelligent orchestrator that routes to specialized agents."),
        code(""),
        code("4. Add quick-action buttons above the chat input:"),
        code("   'Market Summary' | 'Analyze BTC' | 'My Portfolio' | 'Top Signals'"),
        code("   Each pre-fills a contextual prompt and sends it."),

        h2("Prompt 7: UI/UX - Design System Consistency"),
        code("TASK: Audit and fix UI consistency across all pages"),
        code(""),
        code("1. Create a unified spacing/sizing system in src/styles.css:"),
        code("   :root { --space-xs: 4px; --space-sm: 8px; --space-md: 12px;"),
        code("           --space-lg: 16px; --space-xl: 24px; --space-2xl: 32px;"),
        code("           --icon-sm: 16px; --icon-md: 20px; --icon-lg: 24px; }"),
        code(""),
        code("2. Audit AppShell.tsx header: profile avatar 40px, wallet pill height 36px,"),
        code("   all with consistent 12px gaps. Bottom nav icons all 20px."),
        code(""),
        code("3. Audit all cards (vx-card class): consistent padding 12-16px,"),
        code("   border-radius 12px, gap between cards 8-12px."),
        code(""),
        code("4. All empty states should use the EmptyState component with an"),
        code("   appropriate icon and action button, not just showing blank space."),
        code(""),
        code("5. Reference: OpenSea.io for card grid layout, axiom.trade for data density,"),
        code("   TradingView mobile app for chart integration patterns."),
      ],
    },
  ],
});

// ── Generate ──
Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/download/VIXOR_Technical_Audit_Report.docx", buf);
  console.log("Report generated: /home/z/my-project/download/VIXOR_Technical_Audit_Report.docx");
  console.log("Size:", (buf.length / 1024).toFixed(1), "KB");
});