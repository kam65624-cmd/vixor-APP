const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Header,
  Footer,
  AlignmentType,
  HeadingLevel,
  PageNumber,
  PageBreak,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  TableOfContents,
  SectionType,
  VerticalAlign,
} = require("docx");
const fs = require("fs");

// Palette: Deep Sea Blue-Gold (Tech Finance)
const P = {
  primary: "#0F2027",
  body: "#1C2A3D",
  secondary: "#4A6575",
  accent: "#D4AF37",
  surface: "#F5F7FA",
  red: "#C0392B",
  orange: "#E67E22",
  green: "#27AE60",
};
const c = (hex) => hex.replace("#", "");

// ─── Helpers ───
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 32,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 28,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 240, after: 120 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 24,
        color: c(P.secondary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}
function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [
      new TextRun({
        text,
        size: 22,
        color: c(P.body),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}
function bodyBold(text) {
  return new Paragraph({
    alignment: AlignmentType.LEFT,
    spacing: { line: 312, after: 60 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22,
        color: c(P.primary),
        font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
      }),
    ],
  });
}
function severityBadge(sev) {
  const colors = { Critical: P.red, High: P.orange, Medium: "#2980B9", Low: P.green };
  const col = colors[sev] || P.secondary;
  return new TextRun({
    text: ` [${sev}] `,
    bold: true,
    size: 20,
    color: c(col),
    font: { ascii: "Calibri" },
  });
}
function problemBlock(num, title, severity, file, desc, impact, fix) {
  const children = [
    new TextRun({
      text: `Problem #${num}: `,
      bold: true,
      size: 22,
      color: c(P.primary),
      font: { ascii: "Calibri" },
    }),
    severityBadge(severity),
    new TextRun({
      text: title,
      bold: true,
      size: 22,
      color: c(P.body),
      font: { ascii: "Calibri" },
    }),
  ];
  const rows = [
    new Paragraph({ spacing: { before: 200, after: 40 }, children }),
    new Paragraph({
      spacing: { after: 40 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: "File: ",
          bold: true,
          size: 20,
          color: c(P.secondary),
          font: { ascii: "Calibri" },
        }),
        new TextRun({ text: file, size: 20, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: "Description: ",
          bold: true,
          size: 20,
          color: c(P.secondary),
          font: { ascii: "Calibri" },
        }),
        new TextRun({ text: desc, size: 20, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      spacing: { after: 40 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: "Impact: ",
          bold: true,
          size: 20,
          color: c(P.secondary),
          font: { ascii: "Calibri" },
        }),
        new TextRun({ text: impact, size: 20, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
    new Paragraph({
      spacing: { after: 120 },
      indent: { left: 360 },
      children: [
        new TextRun({
          text: "Fix: ",
          bold: true,
          size: 20,
          color: c(P.secondary),
          font: { ascii: "Calibri" },
        }),
        new TextRun({ text: fix, size: 20, color: c(P.body), font: { ascii: "Calibri" } }),
      ],
    }),
  ];
  return rows;
}

// ─── All 47 Problems Data ───
const problems = [
  {
    num: 1,
    cat: "Discover",
    sev: "High",
    title: "Forex Section Shows 'Mock Data' Label in Production",
    file: "src/routes/_authenticated/discover.tsx:1517",
    desc: "The FOREX tab renders the literal text 'Mock data' next to a gold dot, telling users the forex prices are not real while the rest of the UI looks fully functional.",
    impact: "Users see 'Mock data' in production for the FOREX tab, destroying trust.",
    fix: "Either connect to real forex API (TwelveData is already configured) or remove the label and add a clear 'Demo' banner.",
  },
  {
    num: 2,
    cat: "Discover",
    sev: "Medium",
    title: "Duplicate SVG Gradient IDs Cause Rendering Bugs",
    file: "src/routes/_authenticated/discover.tsx:178",
    desc: "SparklineSVG uses id='spark-grad-up' and id='spark-grad-dn'. When multiple sparklines render, the IDs collide causing incorrect gradient application.",
    impact:
      "In 'Top Movers' + main list, sparkline fills may use wrong gradients, causing incorrect coloring.",
    fix: "Use unique IDs per instance with symbol hash.",
  },
  {
    num: 3,
    cat: "Discover",
    sev: "Critical",
    title: "Undefined Variable 'error' Causes Runtime Crash",
    file: "src/routes/_authenticated/discover.tsx:1646",
    desc: "Line 1646 references 'error' but it is never declared. The actual variable is 'effectiveError'. This causes a ReferenceError at runtime.",
    impact: "Crashes the Discover page for non-forex views when an error state triggers.",
    fix: "Replace 'error' with 'effectiveError' on line 1646.",
  },
  {
    num: 4,
    cat: "Discover",
    sev: "Low",
    title: "Inconsistent Price Formatting Between Crypto and Forex",
    file: "src/routes/_authenticated/discover.tsx:107-113",
    desc: "fmtPrice returns 4 decimal places for prices between $1-$1000 which is fine for crypto but wrong for forex pairs.",
    impact: "Minor formatting inconsistency if forex pairs ever hit the crypto formatting path.",
    fix: "Unify formatters or document the split.",
  },
  {
    num: 5,
    cat: "Discover",
    sev: "Medium",
    title: "Pervasive 'as any' Type Escapes in Navigation",
    file: "src/routes/_authenticated/discover.tsx (6 instances)",
    desc: "Six instances of 'as any' for navigate search params defeat TanStack Router's type-safe search param validation.",
    impact: "TypeScript cannot catch invalid search param shapes at compile time.",
    fix: "Define a proper DiscoverSearchSchema type and use it consistently.",
  },
  {
    num: 6,
    cat: "Discover",
    sev: "Medium",
    title: "Category Counts Misclassify Tokens by Chain",
    file: "src/routes/_authenticated/discover.tsx:1184-1201",
    desc: "MEME fallback counts ALL Solana and Ethereum tokens as 'meme', which is wrong. SOL, ETH, USDC are not memes.",
    impact: "Category tab badge counts are inaccurate. Meme count inflated, Crypto count deflated.",
    fix: "Use DexScreener's own categorization or proper heuristics.",
  },
  {
    num: 7,
    cat: "Discover",
    sev: "Low",
    title: "Precious Metals Count Hardcoded to 1",
    file: "src/routes/_authenticated/discover.tsx:1738",
    desc: "count={1} instead of dynamic count based on filtered pairs.",
    impact: "If more metals are added, count stays at 1.",
    fix: "Use filtered count.",
  },
  {
    num: 8,
    cat: "Discover",
    sev: "Medium",
    title: "Discovery Score Unbounded - Can Exceed 100",
    file: "src/routes/_authenticated/discover.tsx:1055",
    desc: "Formula: 80 + (boostAmount ?? 0) produces scores like 5080 for large boost amounts, breaking the /100 display.",
    impact: "Score gauge overflows. Displays as '5080/100'.",
    fix: "Clamp: Math.min(100, 80 + Math.min(boostAmount / 100, 20)).",
  },
  {
    num: 9,
    cat: "Home",
    sev: "Medium",
    title: "MoverCard Navigates to Generic /charts Instead of Token Detail",
    file: "src/routes/_authenticated/index.tsx:281",
    desc: "MoverCard onClick navigates to '/charts' regardless of which token was clicked. The item.symbol is available but not used.",
    impact:
      "Clicking any top gainer/loser goes to generic Charts page instead of that token's detail.",
    fix: "Navigate to /token/$symbol with item.symbol.",
  },
  {
    num: 10,
    cat: "Home",
    sev: "Medium",
    title: "CryptoListItem Also Navigates to /charts Instead of Token Detail",
    file: "src/routes/_authenticated/index.tsx:735",
    desc: "Same as #9 - all 8 live price list items navigate to generic Charts page.",
    impact: "Users lose context when clicking on specific tokens.",
    fix: "Navigate to /token/$symbol with the item's symbol.",
  },
  {
    num: 11,
    cat: "Home",
    sev: "Medium",
    title: "Eight 'as any' Casts on Navigation Calls",
    file: "src/routes/_authenticated/index.tsx (8 instances)",
    desc: "Eight 'as any' casts on navigate({ to: ... }) calls suppress TanStack Router's type-safe route checking.",
    impact: "A route rename would silently break these navigations.",
    fix: "Use properly typed route references.",
  },
  {
    num: 12,
    cat: "Home",
    sev: "Low",
    title: "Ticker Animation Uses Inline style Tag (Not Scoped)",
    file: "src/routes/_authenticated/index.tsx:141-146",
    desc: "MarketTicker renders a raw style tag with @keyframes ticker, injected every render and not scoped.",
    impact: "Duplicate style tags on multiple instances. Minor performance waste.",
    fix: "Move keyframes to global CSS or use single useEffect.",
  },
  {
    num: 13,
    cat: "Portfolio",
    sev: "Medium",
    title: "HoldingRow Uses 'any' Type for Holding Data",
    file: "src/routes/_authenticated/portfolio.tsx:169",
    desc: "holding: any - the entire holding object is untyped. All property accesses have zero type safety.",
    impact: "If server response shape changes, zero compile-time protection.",
    fix: "Define a Holding interface matching the API response shape.",
  },
  {
    num: 14,
    cat: "Portfolio",
    sev: "Medium",
    title: "History Tab is a Dead End",
    file: "src/routes/_authenticated/portfolio.tsx:150-158",
    desc: "The 'History' tab only shows EmptyState with a link to PnL Tracker. No actual trade history rendering.",
    impact: "Users expect trade history but get an empty state. The tab is misleading.",
    fix: "Implement trade history or remove the tab.",
  },
  {
    num: 15,
    cat: "Portfolio",
    sev: "Low",
    title: "Redundant String Template for CSS var()",
    file: "src/routes/_authenticated/portfolio.tsx:107",
    desc: "borderBottom uses unnecessary template literal wrapping for var().",
    impact: "No functional impact, just code noise.",
    fix: "Use plain string.",
  },
  {
    num: 16,
    cat: "Token Detail",
    sev: "High",
    title: "validateSearch Uses Unsafe Type Casts",
    file: "src/routes/_authenticated/token.$symbol.tsx:8",
    desc: "validateSearch uses 'as string' casts which allow any input through without actual validation.",
    impact: "Malformed URL params silently propagate into the component.",
    fix: "Use proper Zod or type-guard validation.",
  },
  {
    num: 17,
    cat: "Token Detail",
    sev: "High",
    title: "Trade Queries Ignore Symbol Parameter",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:232-248",
    desc: "tradesQuery fetches ALL user trades without symbol filter. Same for analysesQuery and watchlistQuery.",
    impact:
      "Every token page loads complete trade history, analyses, and watchlist - massive unnecessary data transfer.",
    fix: "Pass symbol/pair filters to server functions.",
  },
  {
    num: 18,
    cat: "Token Detail",
    sev: "Medium",
    title: "Discovery Score /100 Display with Unclamped Value",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:1308",
    desc: "Raw discoveryScore displayed next to /100 but can exceed 100, showing '5080/100'.",
    impact: "Visually broken score display.",
    fix: "Clamp display value: Math.min(score, 100).",
  },
  {
    num: 19,
    cat: "Token Detail",
    sev: "Medium",
    title: "Quick Trade Panel is Non-Functional",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:968-1185",
    desc: "The entire Quick Trade section is cosmetic. EXECUTE button navigates to /trade-desk without passing parameters.",
    impact: "Users may believe they can trade. All calculations are misleading - never used.",
    fix: "Pass parameters to trade-desk or remove panel.",
  },
  {
    num: 20,
    cat: "Token Detail",
    sev: "Medium",
    title: "Watchlist Toggle Only Navigates, Never Adds",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:876-883",
    desc: "The watchlist star button only navigates to /trackers. No API call to add token to watchlist.",
    impact: "Users cannot add tokens to watchlist from token detail page.",
    fix: "Implement watchlist add/remove mutation.",
  },
  {
    num: 21,
    cat: "Token Detail",
    sev: "Medium",
    title: "SPX Meme Token Misclassification",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:167",
    desc: "memeTokens array includes 'SPX' which could be S&P 500 index, not a meme coin.",
    impact: "S&P 500 tokens get misleading MEME badge and wrong UI sections.",
    fix: "Remove SPX from meme list or add disambiguation.",
  },
  {
    num: 22,
    cat: "Token Detail",
    sev: "Low",
    title: "Forex Session Timer Has Wrong Wraparound Logic",
    file: "src/routes/_authenticated/-token-symbol-component.tsx:1567",
    desc: "Sessions >2h away show as 'closed' instead of 'upcoming' due to threshold.",
    impact: "Users see sessions as closed when they are upcoming.",
    fix: "Show timing for all upcoming sessions.",
  },
  {
    num: 23,
    cat: "Token Detail",
    sev: "Medium",
    title: "Massive 2800-Line Single File Component",
    file: "src/routes/_authenticated/-token-symbol-component.tsx (2831 lines)",
    desc: "Single file contains token header, chart, trade panel, metrics, meme sections, crypto sections, forex indicator, etc.",
    impact:
      "Extremely hard to maintain, test, or review. Entire component re-renders on any state change.",
    fix: "Extract into separate component files.",
  },
  {
    num: 24,
    cat: "Asset Registry",
    sev: "High",
    title: "Base Prices Are Stale Hardcoded Values",
    file: "src/shared/asset-registry/types.ts:186-187",
    desc: "Every asset has hardcoded basePrice (BTC: 105000, SOL: 170, BNB: 650). Already wrong for some assets.",
    impact: "Any code using basePrice for calculations produces wrong results.",
    fix: "Fetch current prices at startup or add guard that basePrice is NEVER used for real calculations.",
  },
  {
    num: 25,
    cat: "Asset Registry",
    sev: "Medium",
    title: "Only 20 Assets - Missing Major Tokens",
    file: "src/shared/asset-registry/types.ts:171-663",
    desc: "Registry has only 20 assets. Missing: POL, UNI, ATOM, NEAR, ARB, OP, INJ, APT, SUI, SEI, TIA, JUP and many others.",
    impact:
      "AssetRegistry.find() returns undefined for missing pairs. Analysis engine can't provide configs.",
    fix: "Expand registry or make it dynamically extensible.",
  },
  {
    num: 26,
    cat: "Asset Registry",
    sev: "Low",
    title: "get() Throws While find() Returns Undefined",
    file: "src/shared/asset-registry/types.ts:686-690",
    desc: "Inconsistent API: get() throws Error, find() returns undefined. Callers must use different patterns.",
    impact: "Unnecessary complexity.",
    fix: "Make get() return undefined or rename to getOrFail().",
  },
  {
    num: 27,
    cat: "API",
    sev: "Critical",
    title: "copilot-stream.ts Syntax Error - Missing Bracket",
    file: "server/api/copilot-stream.ts:508",
    desc: "Line 508: 'const oxiCtx, persona] = await Promise.all([' - missing opening bracket before oxiCtx.",
    impact:
      "JavaScript syntax error prevents the copilot-stream API from compiling. MOXI agent streaming is completely broken.",
    fix: "Change 'const oxiCtx, persona]' to 'const [oxiCtx, persona]'.",
  },
  {
    num: 28,
    cat: "API",
    sev: "Critical",
    title: "Undefined Variable 'moxiCtx' After Destructuring",
    file: "server/api/copilot-stream.ts:512",
    desc: "Line 512 references 'moxiCtx' but the destructured variable is 'oxiCtx'. Causes ReferenceError.",
    impact: "Even after fixing #27, MOXI path crashes at runtime.",
    fix: "Change 'moxiCtx' to 'oxiCtx' on lines 512 and 521.",
  },
  {
    num: 29,
    cat: "API",
    sev: "High",
    title: "metrics.ts Destructuring Syntax Error",
    file: "server/api/metrics.ts:679",
    desc: "Line 679: 'const , r, st] = key.split(" | ");' - first variable name is empty.",
    impact: "Syntax error. The /api/metrics endpoint cannot compile. Monitoring is broken.",
    fix: "Change 'const , r, st]' to 'const [m, r, st]'.",
  },
  {
    num: 30,
    cat: "API",
    sev: "Low",
    title: "Typo in Market Overview Console Warnings",
    file: "server/api/market-overview.ts:167,172",
    desc: "'arket-overview]' instead of '[market-overview]'. Missing '[m' prefix.",
    impact: "Log messages harder to search/filter.",
    fix: "Fix the string prefix.",
  },
  {
    num: 31,
    cat: "API",
    sev: "Medium",
    title: "socialScore Hardcoded to 0 in Discover API",
    file: "server/api/discover.ts:212-213",
    desc: "DexScreener fallback path sets socialScore: 0. Community Sentiment section is useless for these tokens.",
    impact: "Token detail page shows no social data for fallback-sourced tokens.",
    fix: "Estimate from DexScreener data or integrate social API.",
  },
  {
    num: 32,
    cat: "API",
    sev: "Medium",
    title: "discoveryScore is a Fake Log-Based Value",
    file: "server/api/discover.ts:199",
    desc: "Comment admits 'Generate a fake discovery score'. Formula produces arbitrary values.",
    impact: "Discovery Score shown to users is meaningless.",
    fix: "Rename to compositeScore or integrate real scoring pipeline.",
  },
  {
    num: 33,
    cat: "API",
    sev: "Medium",
    title: "Deprecated In-Memory Rate Limiter Still Exported",
    file: "server/api/_security.ts:55-90",
    desc: "rateLimit() uses in-memory Map that doesn't work on serverless. Comment says DEPRECATED but still exported.",
    impact: "New endpoints using it would have no effective rate limiting in production.",
    fix: "Remove export or mark with @deprecated JSDoc.",
  },
  {
    num: 34,
    cat: "Security",
    sev: "High",
    title: "Nonce Verification Falls Back Silently on Redis Failure",
    file: "server/api/wallet/connect.ts:1726-1733",
    desc: "When Redis is unavailable, catch block logs warning and proceeds with sig-only verification.",
    impact: "Under Redis outage, replay attacks become possible.",
    fix: "Fail the request when Redis is unavailable or implement secondary nonce store.",
  },
  {
    num: 35,
    cat: "Security",
    sev: "Medium",
    title: "Missing CSRF Protection on Challenge Endpoint",
    file: "server/api/wallet/connect.ts:1640-1672",
    desc: "Challenge endpoint returns nonce as plain JSON without CSRF token or cookie binding.",
    impact: "Potential CSRF-style attack triggering challenge generation.",
    fix: "Use CSRF token or SameSite cookie.",
  },
  {
    num: 36,
    cat: "Security",
    sev: "Low",
    title: "IP Fingerprint Endpoint Missing CORS and Rate Limiting",
    file: "server/api/wallet/ip-fingerprint.ts:1773-1800",
    desc: "No handlePreflight(event) and no withRateLimit wrapper.",
    impact: "Cross-origin issues and potential abuse.",
    fix: "Add preflight handling and rate limiting.",
  },
  {
    num: 37,
    cat: "API",
    sev: "Medium",
    title: "Telegram Webhook Payload Parsing Inconsistency",
    file: "server/api/telegram-webhook.ts:1501-1504",
    desc: "Payload split by '_' while stars-webhook.ts uses ':'. Different separators for similar payloads.",
    impact: "Parsing could break with non-standard IDs.",
    fix: "Standardize separator or use JSON payloads.",
  },
  {
    num: 38,
    cat: "API",
    sev: "High",
    title: "generate-signals.ts: 'bars' Variable Has No Type Annotation",
    file: "server/api/generate-signals.ts:234-247",
    desc: "bars is declared with implicit 'any' type. Malformed data would silently propagate.",
    impact: "No type safety on candlestick data passed to analysis.",
    fix: "Add explicit OHLCV type annotation.",
  },
  {
    num: 39,
    cat: "Security",
    sev: "High",
    title: "P1 Validate Allows Unauthenticated Access in Production",
    file: "server/api/p1-validate.ts:928-931",
    desc: "When CRON_SECRET is not set, endpoint allows unauthenticated access, exposing system internals.",
    impact: "Internal system health data exposed to unauthenticated users.",
    fix: "Refuse requests when CRON_SECRET is not set in production.",
  },
  {
    num: 40,
    cat: "API",
    sev: "Medium",
    title: "p1-validate.ts Uses Relative Instead of Alias Imports",
    file: "server/api/p1-validate.ts (9 instances)",
    desc: "Multiple imports use '../../src/shared/' instead of '@/shared/'.",
    impact: "Inconsistent with project conventions. Break on structure changes.",
    fix: "Replace with '@/shared/' alias imports.",
  },
  {
    num: 41,
    cat: "API",
    sev: "Low",
    title: "Duplicate configureEventPersistence Import",
    file: "server/api/p1-validate.ts:885, 905",
    desc: "Function imported at top level AND inside handler.",
    impact: "Minor inefficiency.",
    fix: "Remove duplicate import.",
  },
  {
    num: 42,
    cat: "API",
    sev: "Low",
    title: "Memory Store Test Leaves Orphan Data",
    file: "server/api/p1-validate.ts:1081-1090",
    desc: "Test stores data but never calls MemoryStore.forget() to clean up.",
    impact: "Orphan test data in memory store and potentially database.",
    fix: "Add cleanup after test assertions.",
  },
  {
    num: 43,
    cat: "Security",
    sev: "Medium",
    title: "Health Endpoint Exposes Environment Variable Presence",
    file: "server/api/health.ts:97-107",
    desc: "envPresence reveals which services are configured (SUPABASE keys, Redis, etc.) to unauthenticated users.",
    impact: "Information disclosure guiding further attacks.",
    fix: "Remove sensitive keys from check or require authentication.",
  },
  {
    num: 44,
    cat: "Security",
    sev: "Low",
    title: "Discover API Has No Authentication",
    file: "server/api/discover.ts:225-391",
    desc: "No authentication check on /api/discover endpoint.",
    impact: "Unauthenticated users can enumerate tokens.",
    fix: "Add auth check or document public access intent.",
  },
  {
    num: 45,
    cat: "Security",
    sev: "Low",
    title: "Market Overview Endpoint Public (By Design)",
    file: "server/api/market-overview.ts:6-7",
    desc: "No authentication - public endpoint for real-time prices. Documented as intentional.",
    impact: "Acceptable for crypto app. No fix needed.",
    fix: "No fix needed - by design.",
  },
  {
    num: 46,
    cat: "Architecture",
    sev: "High",
    title: "Asset Registry Not Used in Token Page or Discover",
    file: "token.$symbol.tsx + discover.tsx",
    desc: "Token page has its own hardcoded TV_SYMBOL_MAP and detectAssetType() duplicating registry. Discover doesn't use registry at all.",
    impact: "Symbol mappings and categorization diverge over time.",
    fix: "Remove hardcoded maps. Use AssetRegistry everywhere.",
  },
  {
    num: 47,
    cat: "Code Quality",
    sev: "Low",
    title: "Duplicated Formatter Functions Across Pages",
    file: "discover.tsx, index.tsx, -token-symbol-component.tsx",
    desc: "fmtPrice, fmtCompact, fmtPct defined independently with slight variations in each file.",
    impact: "Inconsistent number formatting across pages.",
    fix: "Create shared formatters in @/shared/format.",
  },
];

// ─── Arabic Translations for Problems ───
const problemsAr = [
  {
    num: 1,
    title: "عرض بيانات بيان في تاب الفوركس",
    desc: "عرض الفوركس نص النص 'Mock data' مباشرة للمستخدم مما يدمر ثقة المستخدم.",
    impact: "المستخدمين يشوفوا بيانات مزيفة في الإنتاج.",
    fix: "ا\0631بط بـ API حقيقي للفوركس أو أزل العلامة.",
  },
  {
    num: 3,
    title: "متغير غير معرف 'error' يسبب انهيار التشغيل",
    desc: "السطر 1646 يرجع 'error' لكنه غير معرف. المتغير الصحيح هو 'effectiveError'.",
    impact: "يتعطل صفحة اكتشاف في صفحة الاكتشاف.",
    fix: "استبدل 'error' بـ 'effectiveError'.",
  },
  {
    num: 9,
    title: "الضغط على الرموز الأعلى بدلاً من تفاصيل التوكن",
    desc: "الضغط على أي توكن يذهب إلى /charts بدلاً من صفحة التفاصيل.",
    impact: "المستخدمين يفقدون السياق عند الضغط.",
    fix: "التوجيه إلى /token/$symbol.",
  },
  {
    num: 17,
    title: "استعلام الصفقات يحمل كل بيانات المتاجرة",
    desc: "كل صفحة توكن تحمل كل سجلات المتاجرة بدون تصفية.",
    impact: "أداء أداء غير ضروري وبطء في التحميل.",
    fix: "أرسل معلمات التصفية للسيرفر.",
  },
  {
    num: 19,
    title: "لوحة التداول السريع غير مفعلة",
    desc: "قسم التداول السريع تجميلي فقط. زر تنفيذ لا يرسل أي معلمات.",
    impact: "المستخدمين قد يظنوا أنهم يتداولون.",
    fix: "أرسل المعلمات للتداول أو أزل اللوحة.",
  },
  {
    num: 27,
    title: "خطأ نحوي في copilot-stream.ts - أقواس مفقودة",
    desc: "سطر 508: ناقص قوس مفتوح قبل '[', مما يمنع التركيب من التجميع.",
    impact: "واجهة MOXI معطلة بالكامل.",
    fix: "أضف '[' قبل oxiCtx.",
  },
  {
    num: 29,
    title: "خطأ نحوي في metrics.ts",
    desc: "اسم متغير فارغ في تجزئة البنية.",
    impact: "نقطة المراقبة معطلة.",
    fix: "أصلح اسم المتغير الأول.",
  },
  {
    num: 34,
    title: "تجاوز التحقق من Nonce يسكت صمتاً عند فشل Redis",
    desc: "عندما يكون Redis غير متاح، يتم التحقق بالتوقيع فقط.",
    impact: "هجمات الإعادة ممكنة عند انهيار Redis.",
    fix: "افشل الطلب عندما يكون Redis غير متاح.",
  },
  {
    num: 39,
    title: "نقطة P1 تسمح بالوصول غير المصادقة",
    desc: "عندما لا يكون CRON_SECRET، يسمح بالوصول غير المصادقة.",
    impact: "بيانات النظام مكشوفة.",
    fix: "ارفض الطلب في الإنتاج.",
  },
  {
    num: 46,
    title: "سجل الأصولات غير مستخدم في صفحة التوكن والاكتشاف",
    desc: "صفحة التوكن عندها TV_SYMBOL_MAP مخصص و detectAssetType() مكررة.",
    impact: "التصنيفات تتباعد مع الوقت.",
    fix: "استخدم AssetRegistry في كل مكان.",
  },
];

// ─── Summary Stats ───
const stats = { Critical: 3, High: 7, Medium: 22, Low: 10 };
const roadmapPhases = [
  {
    phase: "Phase 1 - Critical Fixes",
    tasks: "Fix #3, #27, #28, #29 (compilation crashes)",
    timeline: "1-2 days",
  },
  {
    phase: "Phase 2 - Security Hardening",
    tasks: "Fix #34, #35, #39, #43 (auth & nonce)",
    timeline: "2-3 days",
  },
  {
    phase: "Phase 3 - Navigation & Data Flow",
    tasks: "Fix #9, #10, #17, #46 (routing + queries)",
    timeline: "2-3 days",
  },
  {
    phase: "Phase 4 - Mock Data Replacement",
    tasks: "Fix #1, #24, #31, #32, #8 (real APIs)",
    timeline: "3-5 days",
  },
  {
    phase: "Phase 5 - Feature Completion",
    tasks: "Fix #14, #19, #20, #25, #46 (dead ends + registry)",
    timeline: "3-5 days",
  },
  {
    phase: "Phase 6 - Code Quality",
    tasks: "Fix #2, #5, #6, #11, #13, #23, #47 (types + refactor)",
    timeline: "3-5 days",
  },
];

// ─── Build Document ───
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22,
          color: c(P.body),
        },
        paragraph: { spacing: { line: 312 } },
      },
    },
  },
  sections: [
    // COVER
    {
      properties: {
        page: {
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
          size: { width: 11906, height: 16838 },
        },
      },
      children: [
        new Paragraph({ spacing: { before: 4000 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "VIXOR",
              size: 72,
              bold: true,
              color: c(P.accent),
              font: { ascii: "Calibri" },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 100 },
          children: [
            new TextRun({
              text: "Comprehensive Audit Report",
              size: 40,
              color: c(P.primary),
              font: { ascii: "Calibri" },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: "تقرير التدقيق الشامل",
              size: 32,
              color: c(P.secondary),
              font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 600, after: 100 },
          children: [
            new TextRun({
              text: "47 Problems Identified | Bilingual (EN + AR) | Merged with Roadmap",
              size: 22,
              color: c(P.secondary),
              font: { ascii: "Calibri" },
            }),
          ],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
          children: [
            new TextRun({
              text: "Date: 2025-07-25",
              size: 20,
              color: c(P.secondary),
              font: { ascii: "Calibri" },
            }),
          ],
        }),
      ],
    },
    // TOC
    {
      properties: { page: { margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "VIXOR Audit Report",
                  size: 18,
                  color: c(P.secondary),
                  font: { ascii: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: c(P.secondary),
                  font: { ascii: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 200 },
          children: [
            new TextRun({
              text: "Table of Contents",
              bold: true,
              size: 32,
              color: c(P.primary),
              font: { ascii: "Calibri" },
            }),
          ],
        }),
        new TableOfContents("TOC", { hyperlink: true, headingStyleRange: "1-3" }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // BODY
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "VIXOR Audit Report",
                  size: 18,
                  color: c(P.secondary),
                  font: { ascii: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  children: [PageNumber.CURRENT],
                  size: 18,
                  color: c(P.secondary),
                  font: { ascii: "Calibri" },
                }),
              ],
            }),
          ],
        }),
      },
      children: [
        // EXECUTIVE SUMMARY
        h1("Executive Summary"),
        body(
          "This report presents a comprehensive audit of the VIXOR crypto trading dashboard, identifying 47 distinct problems across the entire codebase. The audit covers all major areas including the Discover page, Home page, Portfolio, Token Detail page, Asset Registry, API routes, security, and code quality. The problems are categorized by severity: 3 Critical, 7 High, 22 Medium, and 10 Low.",
        ),
        body(
          "The three Critical issues are runtime crashes that prevent key features from working: an undefined variable reference in the Discover page, a syntax error in the copilot-stream API, and a variable name mismatch in the MOXI agent handler. These must be fixed immediately as they break existing functionality.",
        ),
        body(
          "A prioritized roadmap is provided at the end of this report, organized into 6 phases from critical fixes through code quality improvements. The total estimated effort ranges from 16 to 25 working days.",
        ),
        h1("ملخص تنفيذي"),
        body(
          "يقدم هذا التقرير الشامل للوحة تداول التجاري VIXOR، حيث تحدد 47 مشكلة منفصلة في كل الكود. المشاكل الثلاثة هي: 3 حرجة، 7 عالية، 22 متوسطة، 10 منخفضة.",
        ),
        body(
          "المشاكل الثلاثة هي أخطاء تشغيل في التشغيل: متغير غير معرف في صفحة الاكتشاف، خطأ نحوي في API المساعد، وخطأ اسم متغير في واجهة MOXI. هذه المشاكل يجب إصلاحها فوراً.",
        ),
        // SEVERITY SUMMARY
        h1("Severity Distribution"),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: ["Severity", "Count", "Percentage"].map(
                (h) =>
                  new TableCell({
                    shading: { fill: c(P.primary), type: ShadingType.CLEAR },
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: h,
                            bold: true,
                            color: "FFFFFF",
                            size: 20,
                            font: { ascii: "Calibri" },
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
            ...Object.entries(stats).map(
              ([sev, count]) =>
                new TableRow({
                  children: [sev, String(count), `${Math.round((count / 47) * 100)}%`].map(
                    (t, i) =>
                      new TableCell({
                        margins: { top: 40, bottom: 40, left: 120, right: 120 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: t,
                                size: 20,
                                color: c(P.body),
                                font: { ascii: "Calibri" },
                                bold: i === 0,
                              }),
                            ],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        }),
        // CATEGORY BREAKDOWN
        h1("Problems by Category"),
        body(
          "The 47 problems are distributed across the following categories. Each category is listed with its problem count and highest severity level found within that category.",
        ),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({
              tableHeader: true,
              children: ["Category", "Problems", "Highest Severity"].map(
                (h) =>
                  new TableCell({
                    shading: { fill: c(P.primary), type: ShadingType.CLEAR },
                    margins: { top: 60, bottom: 60, left: 120, right: 120 },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: h,
                            bold: true,
                            color: "FFFFFF",
                            size: 20,
                            font: { ascii: "Calibri" },
                          }),
                        ],
                      }),
                    ],
                  }),
              ),
            }),
            ...[
              ["Discover", "8", "Critical"],
              ["Home", "4", "Medium"],
              ["Portfolio", "3", "Medium"],
              ["Token Detail", "8", "High"],
              ["Asset Registry", "3", "High"],
              ["API", "11", "Critical"],
              ["Security", "5", "High"],
              ["Architecture", "1", "High"],
              ["Code Quality", "1", "Low"],
            ].map(
              ([cat, count, sev]) =>
                new TableRow({
                  children: [cat, count, sev].map(
                    (t, i) =>
                      new TableCell({
                        margins: { top: 40, bottom: 40, left: 120, right: 120 },
                        children: [
                          new Paragraph({
                            children: [
                              new TextRun({
                                text: t,
                                size: 20,
                                color: c(P.body),
                                font: { ascii: "Calibri" },
                                bold: i === 0,
                              }),
                            ],
                          }),
                        ],
                      }),
                  ),
                }),
            ),
          ],
        }),
        // ALL PROBLEMS (ENGLISH)
        h1("Detailed Problem Analysis (English)"),
        ...problems.flatMap((p) => [
          h2(`#${p.num}: ${p.title}`),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({ text: `Severity: `, bold: true, size: 20, color: c(P.secondary) }),
              severityBadge(p.sev),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            indent: { left: 360 },
            children: [
              new TextRun({ text: `File: `, bold: true, size: 20, color: c(P.secondary) }),
              new TextRun({ text: p.file, size: 20, color: c(P.body) }),
            ],
          }),
          body(p.desc),
          bodyBold("Impact: "),
          body(p.impact),
          bodyBold("Fix: "),
          body(p.fix),
        ]),
        // ALL PROBLEMS (ARABIC - KEY ONES)
        h1("تحليل المشاكل الرئيسية (عربي)"),
        body(
          "فيما يلي المشاكل الرئيسية التي تحتاج إلى اهتمام خاص:الأخطاء التشغيلية (انهيار التشغيل)، مشاكل الأمن (الأساس)، ومشاكل الهيكل الهندسي (التنقل \/ التحقق).",
        ),
        ...problemsAr.flatMap((p) => [
          h2(`مشكلة #${p.num}: ${p.title}`),
          body(p.desc),
          bodyBold("التأثير: "),
          body(p.impact),
          bodyBold("الإصلاح: "),
          body(p.fix),
        ]),
        // ROADMAP
        h1("Implementation Roadmap"),
        body(
          "The following roadmap organizes all 47 fixes into 6 prioritized phases. Each phase includes the problem numbers being addressed, the nature of the work, and an estimated timeline. Phases are ordered by priority: critical compilation crashes first, then security, then functional fixes, and finally code quality improvements.",
        ),
        ...roadmapPhases.flatMap((r, i) => [
          h2(`Phase ${i + 1}: ${r.phase.split(" - ")[1]}`),
          bodyBold("Problems: "),
          body(r.tasks),
          bodyBold("Timeline: "),
          body(r.timeline),
        ]),
        h2("Total Estimated Effort"),
        body(
          "The total estimated effort across all 6 phases ranges from 16 to 25 working days, depending on the complexity of API integrations and the depth of refactoring required for the token detail component. Phase 1 (Critical Fixes) should be completed first as it unblocks basic functionality. Phase 2 (Security Hardening) should follow immediately as it addresses potential attack vectors.",
        ),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/z/my-project/download/VIXOR_Audit_Report_47_Problems_EN_AR.docx", buf);
  console.log("Report generated successfully!");
});
