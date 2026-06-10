const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, PageBreak, TableOfContents, LevelFormat
} = require("docx");
const fs = require("fs");

// ── Palette: Deep Sea Blue-Gold (Finance / Investment / Premium) ──
const P = {
  primary: "#0F2027",
  body: "#000000",
  secondary: "#4A6575",
  accent: "#D4AF37",
  surface: "#F5F7FA",
  cover: {
    titleColor: "FFFFFF",
    subtitleColor: "B0B8C0",
    metaColor: "90989F",
    footerColor: "687078",
  },
  table: {
    headerBg: "0F2027",
    headerText: "FFFFFF",
    accentLine: "D4AF37",
    innerLine: "D0D8D0",
    surface: "F0F4F8",
  }
};
const c = (hex) => hex.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB };

// ── Helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function p(text) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function pBold(text) {
  return new Paragraph({
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}
function pMixed(runs) {
  return new Paragraph({
    spacing: { line: 312, after: 120 },
    alignment: AlignmentType.JUSTIFIED,
    children: runs.map(r => new TextRun({ size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, ...r })),
  });
}
function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
  });
}
function bulletBold(label, text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { line: 312, after: 60 },
    children: [
      new TextRun({ text: label, bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } }),
      new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } }),
    ],
  });
}

// ── Table Builder ──
function makeTable(headers, rows, colWidths) {
  const hdrCells = headers.map((h, i) =>
    new TableCell({
      width: { size: colWidths[i], type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, fill: c(P.table.headerBg) },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 20, color: c(P.table.headerText), font: { ascii: "Calibri", eastAsia: "SimHei" } })] })],
    })
  );
  const dataRows = rows.map((row, ri) =>
    new TableRow({
      cantSplit: true,
      children: row.map((cell, ci) =>
        new TableCell({
          width: { size: colWidths[ci], type: WidthType.PERCENTAGE },
          shading: ri % 2 === 0 ? { type: ShadingType.CLEAR, fill: c(P.surface) } : undefined,
          margins: { top: 50, bottom: 50, left: 100, right: 100 },
          children: [new Paragraph({ children: [new TextRun({ text: String(cell), size: 20, color: c(P.body), font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })] })],
        })
      ),
    })
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: c(P.table.accentLine) },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: c(P.table.innerLine) },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: hdrCells }),
      ...dataRows,
    ],
  });
}

// ── Separator ──
function sep() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: c(P.accent) } },
    children: [],
  });
}

// ═══════════════════════════════════════════════════════════════
// COVER SECTION
// ═══════════════════════════════════════════════════════════════
const coverChildren = [
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        width: { size: 100, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: "0F2027" },
        borders: allNoBorders,
        children: [
          new Paragraph({ spacing: { before: 3600 }, children: [] }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { line: 1200, lineRule: "atLeast" },
            children: [new TextRun({ text: "VIXOR MASTER V2", bold: true, size: 72, color: "D4AF37", font: { ascii: "Calibri", eastAsia: "SimHei" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, line: 600, lineRule: "atLeast" },
            children: [new TextRun({ text: "Architecture Transformation Mission", size: 36, color: "B0B8C0", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
            children: [new TextRun({ text: "Trading Intelligence Operating System", size: 28, color: "D4AF37", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200 },
            children: [new TextRun({ text: "Complete Engineering Blueprint", size: 24, color: "90989F", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          }),
          sep(),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 600 },
            children: [new TextRun({ text: "CONFIDENTIAL", bold: true, size: 20, color: "D4AF37", font: { ascii: "Calibri", eastAsia: "SimHei" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
            children: [new TextRun({ text: "Date: 2026-06-11  |  Version: 2.0  |  Classification: Internal", size: 18, color: "90989F", font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" } })],
          }),
        ],
      })],
    })],
  }),
];

// ═══════════════════════════════════════════════════════════════
// BODY CONTENT
// ═══════════════════════════════════════════════════════════════
const body = [];

// ─── PHASE 1: VALIDATE AUDIT FINDINGS ───
body.push(h1("PHASE 1: Audit Findings Validation"));
body.push(p("This phase re-validates every critical finding from the forensic audit of the Vixor platform. Each issue is traced to its exact file, execution path, and risk severity. The verdict for each finding is: Confirmed, Partially Confirmed, or False Positive. Every determination is backed by direct code evidence from the actual source tree at /home/z/my-project/."));

body.push(h2("1.1 fix-vercel-bundle.mjs API Interception"));
body.push(pBold("Verdict: CONFIRMED - CRITICAL"));
body.push(p("The script at scripts/fix-vercel-bundle.mjs (256 lines) performs four sequential post-build patching steps on the Vercel serverless bundle. The most dangerous step is addApiRouteInterception() (lines 146-245), which injects a __vixor_api__() function into the server entry point that short-circuits ALL /api/* routes with static JSON stub responses. This means every API route is intercepted before reaching the actual application code."));
body.push(bulletBold("File: ", "scripts/fix-vercel-bundle.mjs"));
body.push(bulletBold("Execution Path: ", "Vite build completes -> node scripts/fix-vercel-bundle.mjs runs -> addApiRouteInterception() modifies .vercel/output/functions/__server.func/index.mjs -> __vixor_api__() is injected as the first handler in the fetch() method -> all /api/* requests return static stubs"));
body.push(bulletBold("Affected Routes: ", "/api/check-alerts returns {status:ok, message:Alert check endpoint active}, /api/generate-signals returns {status:ok}, /api/telegram-webhook returns {status:ok}, /api/migrate returns migration info"));
body.push(bulletBold("Risk Severity: ", "CRITICAL - All backend API functionality is effectively disabled. The Vercel cron defined in vercel.json fires every 5 minutes but does nothing. Telegram webhooks are swallowed. Signal generation is disabled. The interceptor pattern itself is a latent threat as it runs before all application code and could be modified to log or redirect any request."));
body.push(bulletBold("CORS Issue: ", "All intercepted responses set Access-Control-Allow-Origin: * (wildcard CORS), allowing any website to call these endpoints."));

body.push(h2("1.2 Alert System Execution Path"));
body.push(pBold("Verdict: CONFIRMED (Working Code) - BUT DISABLED by API Interception"));
body.push(p("The alert system code is fully implemented and production-quality. The execution path is: User creates alert via createAlert serverFn (src/domains/trading/functions.ts) -> INSERT into price_alerts table -> Vercel cron triggers /api/check-alerts every 5 minutes -> checkAllAlerts() in src/domains/trading/trading/server/alert-checker.ts -> fetchPrice() from Binance/TwelveData -> isConditionMet() checks above/below/crosses_up/crosses_down -> UPDATE to triggered + INSERT notification + sendTelegramAlert(). However, because the fix-vercel-bundle.mjs intercepts the /api/check-alerts route, the cron fires but the actual checking code NEVER RUNS."));
body.push(bulletBold("Code File: ", "src/domains/trading/server/alert-checker.ts"));
body.push(bulletBold("Functions File: ", "src/domains/trading/functions.ts (7 functions: createAlert, listAlerts, deleteAlert, updateAlert, runAlertCheck, generateDailySignals, getDailySignals, getUserStrategy, updateUserStrategy)"));
body.push(bulletBold("Risk Severity: ", "HIGH - Working code but disabled at deployment level. Alerts are created and stored but never checked or delivered."));

body.push(h2("1.3 Payment Verification Flow"));
body.push(pBold("Verdict: CONFIRMED - CRITICAL"));
body.push(p("There are two payment paths in the platform, and both are completely unverified. First, subscribePremium in src/domains/user/functions.ts (lines 85-108) allows any authenticated user to subscribe to any premium plan by simply calling the server function with a plan_id. The code directly inserts into premium_subscriptions with status:active without any payment confirmation. Second, purchasePack (lines 61-83) credits points to any user who calls it with a pack_id, again with zero payment verification. The code comment explicitly states: 'PURCHASES (instant grant; no payments yet)'. For Telegram Stars payments, the webhook at src/routes/api/telegram-webhook.ts processes successful_payment events but performs NO signature verification - anyone can POST a forged payment event and receive points."));
body.push(bulletBold("Files: ", "src/domains/user/functions.ts (subscribePremium, purchasePack), src/routes/api/telegram-webhook.ts"));
body.push(bulletBold("Risk Severity: ", "CRITICAL - Free premium access, infinite free points, payment fraud via spoofed webhooks"));

body.push(h2("1.4 Telegram Webhook Security"));
body.push(pBold("Verdict: CONFIRMED - CRITICAL"));
body.push(p("The Telegram webhook at src/routes/api/telegram-webhook.ts accepts any POST request without verifying the X-Telegram-Bot-Api-Secret-Token header. Telegram supports a secret_token parameter when setting webhooks, but neither the h3 version nor the TanStack Start version checks this header. Additionally, the payment payload parsing is fragile: const [userId, packId] = payload.split('_') will break if a userId or packId contains underscores, and there is no validation that the userId is a valid UUID or that the user exists. On the positive side, the Telegram initData verification in src/domains/user/server/telegram-verify.ts is correctly implemented with HMAC-SHA256 and 24-hour freshness enforcement."));
body.push(bulletBold("Files: ", "src/routes/api/telegram-webhook.ts, src/domains/user/server/telegram-verify.ts"));
body.push(bulletBold("Risk Severity: ", "CRITICAL - No webhook secret verification enables forged payment events and unauthorized bot commands"));

body.push(h2("1.5 OIDC Exposure"));
body.push(pBold("Verdict: CONFIRMED - CRITICAL"));
body.push(p("The file .env.production at the project root contains a live Vercel OIDC JWT token. The JWT includes claims for owner_id, project_id (vixor-app), user_id, environment:development, and plan:hobby. The token's expiration is approximately June 2026. This JWT grants access to Vercel project deployment APIs and environment variables. While .gitignore includes .env*, this file is still present in the workspace, likely created after the initial commit or tracked before the gitignore was updated. Any developer or tool with access to the repository can extract this token and gain deployment-level access to the Vercel project."));
body.push(bulletBold("File: ", ".env.production"));
body.push(bulletBold("Risk Severity: ", "CRITICAL - Exposed cloud infrastructure credentials"));

body.push(h2("1.6 Triple Code Duplication"));
body.push(pBold("Verdict: CONFIRMED - With Nuance"));
body.push(p("The codebase is in a half-completed migration from src/lib/ to src/shared/ + src/domains/. The duplication breaks down into: (A) src/lib/analysis/ contains 8,081 lines of full duplicate code mirroring src/domains/analysis/engine/ with only 1 line of difference (news_impact optional vs required). (B) src/integrations/supabase/ contains 5 re-export shim files (11 lines total) pointing to src/shared/supabase/. (C) src/lib/ contains 7 utility re-export shims (22 lines) pointing to src/shared/. (D) src/lib/i18n/ contains 1,265 lines of stale translations missing 24 notes-related keys. (E) src/server/ contains 9 re-export shims. (F) src/hooks/ contains 3 re-export shims. (G) src/lib/vixor.functions.ts is a 123-line re-export barrel actively imported by 14 route/component files. (H) Root-level duplicate files with (1) suffix total ~9,600 lines. (I) The vixor-APP/ orphan directory is 549 MB of complete project backup. Total recoverable: ~254,924 lines."));
body.push(bulletBold("Risk Severity: ", "MEDIUM - Maintenance burden, stale code, confusion for new developers"));

body.push(h2("1.7 Settings Persistence"));
body.push(pBold("Verdict: CONFIRMED - CRITICAL"));
body.push(p("The settings page at src/routes/_authenticated/settings.tsx uses useState for all settings: dark mode, haptics, sound, price alerts, and news alerts. None of these values are persisted to the database. On page refresh, all settings revert to hardcoded defaults (dark=true, haptics=true, sound=true, priceAlerts=true, newsAlerts=false). The Trading Profile section is completely hardcoded with static display values: Risk Tolerance always shows Moderate, Preferred Pairs always shows BTC/ETH/EUR/USD, Trading Style always shows Swing. These are not connected to the user_strategies table which already exists in the database and has an updateUserStrategy server function. Only language selection persists, via localStorage in the I18nProvider, not through the settings page itself."));
body.push(bulletBold("File: ", "src/routes/_authenticated/settings.tsx"));
body.push(bulletBold("Risk Severity: ", "CRITICAL - All user preferences lost on refresh"));

body.push(h2("1.8 Dead Routes"));
body.push(pBold("Verdict: FALSE POSITIVE"));
body.push(p("Initial audit suspected several routes might be stubs or dead. Deep inspection confirms ALL routes have real, functional implementations with database-backed server functions: /trade-desk (381 lines, lot calculator + DB trade creation), /discover (~1,100 lines, 5 tabs with real data), /premium (215 lines, subscription plans + Telegram Stars), /referral (170 lines, referral codes + tiers), /profile (314 lines, XP/badges/stats/sign-out). No stubs found."));

body.push(h2("1.9 Dead AI Code"));
body.push(pBold("Verdict: PARTIALLY CONFIRMED"));
body.push(p("Three categories of dead AI code exist: (1) generateOHLCV() in src/domains/analysis/engine/core/candle-utils.ts (~40 lines) - a deterministic fake OHLCV data generator using seeded PRNG. It is never called from the main analysis path. The engine explicitly returns WAIT/15% confidence when no real data is available. (2) generateNewsContext() in src/domains/analysis/engine/engine.ts (~170 lines) - hardcoded fake news headlines for XAU/USD, EUR/USD, BTC/USD, ETH/USDT, GBP/JPY. The function is defined but news_impact is set to undefined on line 292, so it never runs. (3) src/lib/vixor-mock.ts (15 lines) - exports only type definitions that are superseded by src/domains/analysis/types.ts. Zero imports from any file. However, the Copilot AI system itself is fully operational with 4 specialized agents, multi-agent consensus, and proper conversation persistence."));

body.push(h2("1.10 Signal Generation Pipeline"));
body.push(pBold("Verdict: CONFIRMED (Working Code) - BUT DISABLED by API Interception + Minor Issue"));
body.push(p("The signal generation pipeline is fully implemented with a sophisticated local analysis engine. Execution: Cron triggers /api/generate-signals -> For each of 6 pairs x 2 timeframes (12 total) -> fetchBinanceKlines or fetchTwelveDataKlines (200 bars) -> runLocalAnalysis with full SMC/ICT pipeline (8-step: market structure, SMC concepts, BOS/CHoCH, patterns, indicators, risk-reward, confluence scoring, composition) -> INSERT into daily_signals table. The pipeline is disabled by the same API interception issue as alerts. Minor issue: when both Binance and TwelveData fail to return 20+ bars, generateDailySignals still calls runLocalAnalysis with undefined bars, producing low-confidence WAIT signals via generateFallbackResult() instead of hard-failing like createAnalysis/quickAnalyze do."));

body.push(sep());

// ─── PHASE 2: BUILD THE VIXOR NEURAL SYSTEM ───
body.push(h1("PHASE 2: Vixor Neural System Design"));
body.push(p("This phase analyzes the current platform as a connected system, identifies all disconnected entities, maps current and missing connections, and designs the Vixor Neural Graph V2 architecture. The goal is to transform Vixor from a collection of isolated features into a deeply interconnected Trading Intelligence Operating System where every entity enriches every other entity."));

body.push(h2("2.1 Current Entity Map"));
body.push(p("The platform currently has 14 primary entities. The table below shows each entity, its database table, its current connections, and what it is missing."));
body.push(makeTable(
  ["Entity", "DB Table", "Current Connections", "Missing Connections"],
  [
    ["User", "profiles", "analyses, alerts, notes, trades, loops, convos, strategies, watchlists, streaks", "signals (indirect), portfolio (computed), calendar, news, referral tracking"],
    ["Asset", "N/A (no table)", "N/A - assets are strings in pairs", "NO asset entity exists - no metadata, no history, no correlation tracking"],
    ["Watchlist", "watchlists + watchlist_items", "user", "NO connection to alerts, signals, analysis, portfolio, or news"],
    ["Analysis", "analyses", "user, trades (optional FK)", "NO connection to signals, alerts, watchlist, daily loop, or journal"],
    ["Signal", "daily_signals", "NONE (no user_id, no RLS)", "NO connection to user, strategy, portfolio, trades, alerts, or analysis"],
    ["Alert", "price_alerts", "user, notifications", "NO connection to signals, analysis, watchlist, or trades"],
    ["Trade", "trades", "user, analysis (optional FK)", "NO connection to signals, daily loop, journal, or alerts"],
    ["Portfolio", "N/A (computed from trades)", "trades", "NO connection to analysis, signals, watchlist, market data"],
    ["Journal", "trading_notes", "user, analysis (optional FK)", "NO connection to trades, daily loop, alerts, or signals"],
    ["Daily Loop", "daily_loops + user_streaks", "user", "NO connection to trades, journal, analysis, or alerts"],
    ["Calendar", "N/A (fetched from API)", "NONE", "NO connection to user, signals, analysis, or daily loop"],
    ["Copilot", "copilot_conversations + messages", "user (8 parallel context queries)", "NO persistent memory across conversations, NO learning from user behavior"],
    ["News", "N/A (fetched from API)", "NONE", "NO connection to analysis, signals, alerts, or user interests"],
    ["Premium", "premium_subscriptions", "user, plans", "NO connection to usage tracking or feature gating beyond analysis points"],
  ],
  [12, 14, 32, 42]
));

body.push(h2("2.2 Connection Density Analysis"));
body.push(p("Of 91 possible bidirectional connections between 14 entities, only 18 currently exist. This is a connection density of approximately 20%. The platform is structurally a hub-and-spoke model with User at the center, rather than a neural graph where entities enrich each other. The most critical gaps are:"));
body.push(bullet("Signals have ZERO connections to any user-specific entity (no user_id, no strategy link)"));
body.push(bullet("Watchlists are isolated from alerts, analysis, and signals despite being the natural entry point for all three"));
body.push(bullet("Trades are not connected to the signals that triggered them, the analysis that justified them, or the journal entries reflecting on them"));
body.push(bullet("Daily Loop is completely disconnected from actual trading activity despite being designed as a daily trading routine tracker"));
body.push(bullet("Calendar events have no connection to volatility alerts, analysis context, or daily loop preparation"));
body.push(bullet("Copilot has no persistent memory - it fetches fresh context on every message but cannot learn from patterns across conversations"));

body.push(h2("2.3 Vixor Neural Graph V2"));
body.push(p("The Neural Graph V2 design connects every entity through meaningful, bidirectional relationships. Each connection is designed to either (a) improve user decision-making, (b) enable AI personalization, or (c) create retention loops. Below is the complete specification with exact database, API, frontend, and server changes required."));

body.push(h3("2.3.1 Signal-to-Everything Connections"));
body.push(pBold("Database Changes:"));
body.push(makeTable(
  ["Change", "SQL", "Purpose"],
  [
    ["Add user_id to daily_signals", "ALTER TABLE daily_signals ADD COLUMN user_id UUID REFERENCES auth.users(id);", "Enable personalized signals per user strategy"],
    ["Add strategy_id to daily_signals", "ALTER TABLE daily_signals ADD COLUMN strategy_id UUID REFERENCES user_strategies(id);", "Link signals to the strategy that generated them"],
    ["Add signal_id to trades", "ALTER TABLE trades ADD COLUMN signal_id UUID REFERENCES daily_signals(id);", "Track which signal triggered a trade"],
    ["Add signal_id to price_alerts", "ALTER TABLE price_alerts ADD COLUMN signal_id UUID REFERENCES daily_signals(id);", "Auto-create alerts from signal entry/SL/TP"],
    ["Create signal_reactions table", "CREATE TABLE signal_reactions (id UUID PK, user_id UUID, signal_id UUID, reaction TEXT, created_at TIMESTAMPTZ);", "Track user feedback on signals for learning"],
  ],
  [28, 48, 24]
));
body.push(pBold("API Changes:"));
body.push(bullet("getDailySignals: filter by user_id when present, fall back to global signals"));
body.push(bullet("createTrade: accept optional signal_id parameter, auto-populate entry/SL/TP from signal"));
body.push(bullet("createAlert: accept optional signal_id parameter, auto-create alert at signal's entry price"));
body.push(pBold("Frontend Changes:"));
body.push(bullet("Signals page: add 'Trade This Signal' button that pre-fills Trade Desk"));
body.push(bullet("Signals page: add 'Set Alert' button that creates alert at signal's entry price"));
body.push(bullet("Trade Desk: show linked signal details when trade was created from a signal"));

body.push(h3("2.3.2 Watchlist-to-Analysis/Alerts/Signals Connections"));
body.push(pBold("Database Changes:"));
body.push(makeTable(
  ["Change", "SQL", "Purpose"],
  [
    ["Add auto_alert to watchlist_items", "ALTER TABLE watchlist_items ADD COLUMN auto_alert BOOLEAN DEFAULT false;", "Enable automatic alert creation for watched pairs"],
    ["Add alert_threshold_pct to watchlist_items", "ALTER TABLE watchlist_items ADD COLUMN alert_threshold_pct NUMERIC DEFAULT 2.0;", "Percentage move threshold for auto-alerts"],
  ],
  [32, 48, 20]
));
body.push(pBold("Server Changes:"));
body.push(bullet("After adding a pair to watchlist, if auto_alert is true, automatically create a price alert at threshold_pct from current price"));
body.push(bullet("generateDailySignals: prioritize pairs in user's watchlist when generating personalized signals"));
body.push(pBold("Frontend Changes:"));
body.push(bullet("Watchlist item: add toggle for 'Auto-Alert' with threshold percentage"));
body.push(bullet("Watchlist item: add 'Analyze' button that triggers quickAnalyze for that pair"));

body.push(h3("2.3.3 Trade-to-Everything Connections"));
body.push(pBold("Database Changes:"));
body.push(makeTable(
  ["Change", "SQL", "Purpose"],
  [
    ["Add daily_loop_id to trades", "ALTER TABLE trades ADD COLUMN daily_loop_id UUID REFERENCES daily_loops(id);", "Link trades to the day's trading loop"],
    ["Add journal_entry_id to trades", "ALTER TABLE trades ADD COLUMN note_id UUID REFERENCES trading_notes(id);", "Link trade to its journal reflection"],
    ["Add mood_at_open/mood_at_close to trades", "ALTER TABLE trades ADD COLUMN mood_at_open TEXT, mood_at_close TEXT;", "Track emotional state at trade open/close"],
  ],
  [28, 48, 24]
));
body.push(pBold("Frontend Changes:"));
body.push(bullet("Trade close flow: prompt for journal note and mood assessment"));
body.push(bullet("Daily Loop: show all trades opened/closed during that day's sessions"));
body.push(bullet("Portfolio: show journal sentiment alongside trade P&L for pattern detection"));

body.push(h3("2.3.4 Calendar-to-Analysis/Alerts/DailyLoop Connections"));
body.push(pBold("Database Changes:"));
body.push(makeTable(
  ["Change", "SQL", "Purpose"],
  [
    ["Create economic_events_cache table", "CREATE TABLE economic_events_cache (id UUID PK, event_date DATE, event_time TIMESTAMPTZ, currency TEXT, impact TEXT, title TEXT, actual TEXT, forecast TEXT, previous TEXT, fetched_at TIMESTAMPTZ);", "Cache calendar events for cross-referencing"],
    ["Add high_impact_events to daily_loops", "ALTER TABLE daily_loops ADD COLUMN high_impact_events JSONB DEFAULT '[]';", "Include relevant events in morning prep"],
  ],
  [28, 48, 24]
));
body.push(pBold("Server Changes:"));
body.push(bullet("getTodayLoop: automatically fetch and include today's high-impact events for user's watchlist currencies"));
body.push(bullet("Alert checker: before major economic events, send warning notifications to users with open positions in affected currencies"));
body.push(bullet("Analysis engine: include upcoming economic events as context in analysis results"));

body.push(h3("2.3.5 Copilot Persistent Memory"));
body.push(pBold("Database Changes:"));
body.push(makeTable(
  ["Change", "SQL", "Purpose"],
  [
    ["Create copilot_memory table", "CREATE TABLE copilot_memory (id UUID PK, user_id UUID REFERENCES auth.users(id), memory_type TEXT, content JSONB, source_conversation_id UUID, confidence NUMERIC, created_at TIMESTAMPTZ, expires_at TIMESTAMPTZ);", "Persistent memory across conversations"],
    ["Create user_behavioral_patterns table", "CREATE TABLE user_behavioral_patterns (id UUID PK, user_id UUID REFERENCES auth.users(id), pattern_type TEXT, pattern_data JSONB, confidence NUMERIC, observed_count INT DEFAULT 1, last_observed_at TIMESTAMPTZ, created_at TIMESTAMPTZ);", "Detected behavioral patterns"],
  ],
  [28, 48, 24]
));
body.push(pBold("Server Changes:"));
body.push(bullet("After every copilot conversation, extract and store key insights into copilot_memory"));
body.push(bullet("Before generating copilot response, load relevant memories (last 30 days) as additional context"));
body.push(bullet("After every trade close, analyze trade against user's behavioral patterns and update patterns"));
body.push(pBold("Frontend Changes:"));
body.push(bullet("Copilot: show 'Memory' section with key insights the AI remembers about the user"));
body.push(bullet("Copilot: allow user to delete or edit specific memories"));

body.push(sep());

// ─── PHASE 3: TRADING OS GAP ───
body.push(h1("PHASE 3: Trading Operating System Gap Analysis"));
body.push(p("This phase compares Vixor against seven major competitors across four dimensions: features Vixor already has, features Vixor lacks, features competitors cannot offer, and unique moat opportunities. The analysis identifies why users would open Vixor daily and why they would pay monthly."));

body.push(h2("3.1 Competitive Feature Matrix"));
body.push(makeTable(
  ["Feature", "Vixor", "TradingView", "TrendSpider", "ForexFactory", "Notion", "ChatGPT", "DexScreener", "CMC"],
  [
    ["Real-time Prices", "Yes", "Yes", "Yes", "Limited", "No", "No", "Yes", "Yes"],
    ["Chart Analysis", "AI + Local", "Manual", "Auto", "No", "No", "Text only", "Basic", "No"],
    ["SMC/ICT Detection", "Yes (8-step)", "No", "Partial", "No", "No", "No", "No", "No"],
    ["AI Copilot", "4 Agents", "No", "No", "No", "No", "General AI", "No", "No"],
    ["Trading Signals", "Auto-gen", "Community", "Auto", "No", "No", "No", "No", "No"],
    ["Price Alerts", "Yes", "Yes", "Yes", "No", "No", "No", "Yes", "Yes"],
    ["Journal", "Basic", "No", "No", "No", "Flexible", "No", "No", "No"],
    ["Daily Routine", "Yes", "No", "No", "No", "Templates", "No", "No", "No"],
    ["Portfolio Tracking", "Basic", "Basic", "Yes", "No", "Manual", "No", "Yes", "Yes"],
    ["Economic Calendar", "Yes", "Yes", "No", "Yes", "No", "No", "No", "No"],
    ["Mobile (Telegram)", "Yes", "Yes", "No", "Yes", "Yes", "Yes", "No", "Yes"],
    ["Crypto + Forex", "Both", "Both", "Both", "Forex", "N/A", "N/A", "Crypto", "Crypto"],
    ["Behavioral Analysis", "No", "No", "No", "No", "No", "No", "No", "No"],
    ["Trading DNA", "No", "No", "No", "No", "No", "No", "No", "No"],
    ["AI Coach", "No", "No", "No", "No", "No", "No", "No", "No"],
  ],
  [18, 10, 12, 12, 10, 8, 10, 10, 10]
));

body.push(h2("3.2 What Vixor Already Has (Unique Advantages)"));
body.push(bullet("Multi-Agent AI Copilot: 4 specialized agents (Market Analyst, Risk Manager, News Analyst, Strategy Builder) with consensus mode. No competitor offers this."));
body.push(bullet("Local Analysis Engine: 8-step SMC/ICT pipeline with 74 candlestick patterns, 20 chart formations, 8 harmonic patterns, and 12-indicator confluence scoring. Runs without API keys."));
body.push(bullet("Daily Trading Loop: Structured daily routine with morning prep, session tracking, and EOD review. No other trading platform has this."));
body.push(bullet("Auto Signal Generation: Daily signals for 6 pairs x 2 timeframes using the local analysis engine. Cron-based, fully automated."));
body.push(bullet("Telegram Mini App: Full platform accessible via Telegram with Telegram Stars payments and bot notifications."));
body.push(bullet("Points Economy: Flexible monetization via points for analyses, with premium subscription option and Telegram Stars purchases."));

body.push(h2("3.3 What Vixor Lacks (Critical Gaps)"));
body.push(bullet("Real Portfolio Intelligence: Portfolio is basic trade CRUD. No real-time P&L, no position tracking, no account sync, no broker integration."));
body.push(bullet("Behavioral Pattern Detection: No analysis of trading mistakes, revenge trading, overtrading, or streak deterioration. The data exists in trades/daily_loops but is never analyzed."));
body.push(bullet("Trading DNA Classification: No automatic classification of trader type (scalper, day trader, swing, position, ICT, SMC, news)."));
body.push(bullet("AI Coach / Intervention: No real-time detection of emotional trading, risk violations, or pattern-based coaching."));
body.push(bullet("Social/Community: No signal sharing, no trade sharing, no community analysis, no leaderboards."));
body.push(bullet("Advanced Charting: TradingView widget is embedded but not integrated. No drawing tools, no multi-timeframe overlay, no custom indicators on chart."));
body.push(bullet("Historical Data: No historical trade analysis, no equity curve persistence, no seasonality detection, no backtesting."));
body.push(bullet("Notification System: Alerts are checked via cron every 5 minutes. No push notifications, no WebSocket real-time, no in-app notification center with real-time updates."));

body.push(h2("3.4 What Competitors Cannot Offer (Vixor Moat)"));
body.push(p("The combination of local SMC/ICT analysis + multi-agent AI copilot + daily trading loop + Telegram native + behavioral intelligence creates a moat that no single competitor can replicate. TradingView has charts but no AI. ChatGPT has AI but no charts or trading tools. TrendSpider has automation but no daily routine or behavioral coaching. Notion has flexibility but no domain intelligence. The moat is the NEURAL CONNECTION between all these systems - when your copilot understands your portfolio, your recent mistakes, your trading DNA, and today's economic calendar simultaneously, that is something no competitor can build without starting from the same integrated foundation."));

body.push(h2("3.5 Why Users Would Open Vixor Daily"));
body.push(bullet("Morning: Daily Loop morning prep with AI-generated market bias based on their portfolio, watchlist, and calendar events"));
body.push(bullet("Pre-Market: New signals waiting, auto-generated overnight, filtered by their strategy and watchlist"));
body.push(bullet("During Market: AI Copilot available 24/7 with full context of their positions, alerts, and recent mistakes"));
body.push(bullet("Alert: Real-time price alerts delivered via Telegram, not just in-app"));
body.push(bullet("EOD: Daily Loop review with automatic trade import and behavioral coaching"));
body.push(bullet("Weekend: Weekly performance review, behavioral pattern insights, strategy adjustment recommendations"));

body.push(h2("3.6 Why Users Would Pay Monthly"));
body.push(bullet("Premium AI: Unlimited copilot conversations with persistent memory, trading DNA analysis, and AI coaching interventions"));
body.push(bullet("Signal Quality: Personalized signals based on their strategy, not generic broadcasts"));
body.push(bullet("Behavioral Intelligence: Pattern detection that prevents costly mistakes - the ROI of avoiding one revenge trade pays for months of subscription"));
body.push(bullet("Portfolio Intelligence: Real-time P&L, risk exposure analysis, and correlation detection across positions"));
body.push(bullet("Telegram Native: Full platform in Telegram Mini App with instant notifications and Stars payments - convenience worth paying for"));

body.push(sep());

// ─── PHASE 4: AI EVOLUTION ───
body.push(h1("PHASE 4: Vixor Intelligence Layer V2"));
body.push(p("This phase designs the complete AI evolution from the current copilot system to a full Trading Intelligence Layer. The current copilot is a good foundation - it has 4 specialized agents, consensus mode, and rich context gathering (8 parallel queries). The evolution adds persistent memory, behavioral analysis, trading DNA classification, AI coaching, and context-aware intelligence. Every design decision is grounded in the actual codebase and database schema."));

body.push(h2("4.1 Trader Memory Engine"));
body.push(p("The current copilot has no persistent memory. Every conversation starts fresh, re-fetching 8 context queries. The Trader Memory Engine transforms this from a stateless chatbot into an AI that knows the trader's history, patterns, and tendencies. Memory is stored in a new copilot_memory table with typed entries, confidence scores, and expiration. After each conversation, a memory extraction pass identifies and stores key insights. Before each new conversation, relevant memories are loaded as additional context. The memory types are: trade_pattern (recurring trading behaviors), mistake_pattern (recurring mistakes), strength_pattern (consistent strengths), preference_pattern (communication and analysis preferences), and market_insight (market observations that proved correct)."));
body.push(makeTable(
  ["Memory Type", "Source", "Example", "Retention"],
  [
    ["trade_pattern", "Trades + Journal", "User tends to overtrade during London session on GBP/JPY", "90 days"],
    ["mistake_pattern", "Trades + Daily Loop", "User moves stop loss to break-even too early, missing 60% of winners", "180 days"],
    ["strength_pattern", "Trades + Analysis", "User's BTC/USDT longs have 72% win rate with 2.1R average", "180 days"],
    ["preference_pattern", "Copilot conversations", "User prefers concise analysis with focus on key levels, not narrative", "365 days"],
    ["market_insight", "Analysis + Signals", "User correctly identified XAU/USD bullish bias before NFP 3 times", "90 days"],
  ],
  [18, 18, 40, 14]
));
body.push(pBold("Implementation Architecture:"));
body.push(bullet("Memory Extraction: After every copilot conversation, a dedicated LLM call extracts structured memories from the conversation using a system prompt that identifies patterns, mistakes, and insights"));
body.push(bullet("Memory Storage: INSERT into copilot_memory with type, content (JSONB), source_conversation_id, confidence (0-1), and expires_at"));
body.push(bullet("Memory Retrieval: Before every copilot response, SELECT relevant memories WHERE user_id = ? AND (expires_at IS NULL OR expires_at > now()) ORDER BY confidence DESC LIMIT 10"));
body.push(bullet("Memory Consolidation: Daily cron job that merges similar memories, updates confidence scores, and expires stale entries"));
body.push(bullet("Database Migration: 20260611000000_add_copilot_memory.sql creating copilot_memory and user_behavioral_patterns tables"));

body.push(h2("4.2 Trading DNA System"));
body.push(p("The Trading DNA System automatically classifies users into trader types based on their actual trading behavior, not self-reported preferences. Classification is performed by analyzing trade duration, hold times, R-multiples, session preferences, and instrument choices. The system uses a weighted scoring model across 7 DNA dimensions."));
body.push(makeTable(
  ["DNA Dimension", "Data Source", "Scoring Metric", "Trader Types"],
  [
    ["Time Horizon", "trades.entry_date - trades.exit_date", "Average hold time", "Scalper (<2h), Day (2h-24h), Swing (1d-2w), Position (>2w)"],
    ["Instrument Preference", "trades.pair + watchlist_items.pair", "Pair frequency distribution", "Crypto-native, Forex-native, Commodity-focused, Multi-asset"],
    ["Risk Profile", "trades.stop_loss / trades.entry_price", "Average risk per trade", "Conservative (<1%), Moderate (1-2%), Aggressive (>2%)"],
    ["Analysis Style", "analyses + user_strategies", "SMC/ICT vs technical vs fundamental usage", "ICT/SMC, Technical, Fundamental, Hybrid"],
    ["Session Activity", "daily_loops sessions", "Which sessions are actively traded", "Asian, London, NY, Overlap, Multi-session"],
    ["Win/Loss Pattern", "trades.pnl + trades.r_multiple", "Win rate, R-distribution, streak patterns", "High-win-rate, High-R, Streak-prone"],
    ["Emotional Profile", "daily_loops.emotional_state + trades", "Emotional state correlation with P&L", "Disciplined, Emotional, Revenge-prone, Streak-dependent"],
  ],
  [16, 22, 20, 42]
));
body.push(pBold("Implementation:"));
body.push(bullet("Compute DNA on trade close: after every trade update with status=closed, trigger calculateTradingDNA(userId) server function"));
body.push(bullet("Store DNA in profiles table: ALTER TABLE profiles ADD COLUMN trading_dna JSONB DEFAULT '{}'"));
body.push(bullet("DNA structure: {timeHorizon: {type: 'swing', score: 0.82}, instrumentPreference: {type: 'crypto-native', score: 0.91}, ...}"));
body.push(bullet("Use DNA in copilot context: include trading_dna in the 8-parallel-query context fetch so agents personalize responses"));
body.push(bullet("Use DNA in signal generation: filter signals by user's DNA type (scalper gets shorter timeframes, swing gets 4H+1D)"));
body.push(bullet("Display DNA on Profile page: visual radar chart showing 7 DNA dimensions"));

body.push(h2("4.3 AI Coach"));
body.push(p("The AI Coach is an always-on background system that monitors user behavior and intervenes when it detects harmful patterns. Unlike the copilot which responds to user messages, the coach proactively reaches out. Interventions are triggered by specific behavioral signals and delivered through notifications and Telegram messages."));
body.push(makeTable(
  ["Detection", "Trigger", "Intervention", "Severity"],
  [
    ["Revenge Trading", "User opens trade within 10 min of loss on same pair + emotional state = frustrated", "Telegram message: 'You just closed a loss on XAU/USD. Your history shows 78% of immediate re-entries on this pair result in larger losses. Consider waiting 30 minutes.'", "High"],
    ["Overtrading", "User exceeds their average daily trade count by 2x + daily P&L is negative", "In-app notification: 'You have taken 8 trades today (your average is 3). Current P&L is -$120. Your win rate drops to 31% after 5 trades. Consider stepping away.'", "High"],
    ["Risk Violation", "Trade size exceeds 3% of estimated account or stop loss not set within 5 minutes", "Immediate alert: 'This trade risks 4.2% of your account. Your trading DNA shows optimal performance at 1-2% risk. Consider reducing position size.'", "Critical"],
    ["Streak Deterioration", "3 consecutive losses with decreasing R-multiples (each loss bigger than the last)", "Copilot proactive message: 'I notice your last 3 losses have been -1.2R, -1.8R, -2.4R. This escalating pattern often precedes larger drawdowns. Would you like to review your approach?'", "Medium"],
    ["Missed Session", "User's active session (London/NY) started but daily loop not opened", "Telegram reminder: 'London session is starting. You haven't completed your morning prep yet. Your win rate is 23% higher on days you complete the daily loop.'", "Low"],
    ["Emotional State Alert", "Daily loop emotional state = 'frustrated' or 'anxious' + open positions exist", "In-app banner: 'You marked your emotional state as frustrated with open positions. Your historical P&L when frustrated averages -0.8R per trade. Consider closing positions or taking a break.'", "High"],
  ],
  [14, 22, 42, 10]
));
body.push(pBold("Implementation Architecture:"));
body.push(bullet("Detection Engine: server-side functions that run after trade creation, trade close, daily loop update, and on cron schedule"));
body.push(bullet("Rule Store: JSON-based rules in a new ai_coach_rules table, allowing dynamic rule updates without code changes"));
body.push(bullet("Intervention Delivery: Dual channel - in-app notification (INSERT into notifications table) + Telegram message (if user has linked account)"));
body.push(bullet("Feedback Loop: User can dismiss or acknowledge interventions. Dismissal data feeds back into rule confidence scoring."));
body.push(bullet("Database: CREATE TABLE ai_coach_interventions (id UUID PK, user_id UUID, rule_id TEXT, trigger_data JSONB, intervention_text TEXT, channel TEXT, status TEXT DEFAULT 'sent', user_feedback TEXT, created_at TIMESTAMPTZ)"));

body.push(h2("4.4 Context-Aware Copilot V2"));
body.push(p("The current copilot gathers 8 parallel context queries before every message. V2 extends this with persistent memory, trading DNA, AI coach insights, and real-time portfolio state. The key improvement is that the copilot will understand not just what the user is asking, but who the user is as a trader, what they've been through recently, and what risks they're currently exposed to."));
body.push(pBold("V2 Context Enrichment (added to existing 8 queries):"));
body.push(makeTable(
  ["Context Source", "Current", "V2 Addition", "Impact"],
  [
    ["Trading DNA", "Not fetched", "profiles.trading_dna JSONB", "Agents personalize advice by trader type"],
    ["Recent Memories", "Not fetched", "copilot_memory (last 30 days, confidence > 0.5)", "Agents reference past conversations and patterns"],
    ["Coach Interventions", "Not fetched", "ai_coach_interventions (last 7 days)", "Agents know what behavioral warnings were given"],
    ["Open Positions", "Not fetched", "trades WHERE status='open' + live prices", "Agents understand current exposure and risk"],
    ["Pending Alerts", "Fetched (price_alerts)", "Expanded with signal_id links", "Agents know which signals user is watching"],
    ["Weekly Performance", "Not fetched", "Aggregated from trades (last 7 days)", "Agents reference recent performance trends"],
    ["Behavioral Patterns", "Not fetched", "user_behavioral_patterns table", "Agents proactively warn about detected patterns"],
  ],
  [18, 14, 28, 40]
));
body.push(pBold("Agent System Prompt Evolution:"));
body.push(p("Each agent's system prompt will be dynamically composed from the user's context. The Market Analyst agent will say different things to a scalper vs a swing trader. The Risk Manager agent will adjust its advice based on the user's risk profile DNA. The Strategy Builder agent will reference past mistakes stored in memory. This is not a generic chatbot - it is a personalized trading mentor that evolves with the user."));

body.push(sep());

// ─── PHASE 5: LAUNCH READINESS ───
body.push(h1("PHASE 5: Launch Readiness Assessment"));
body.push(p("This phase evaluates whether Vixor can launch publicly, scoring six critical dimensions and identifying specific launch blockers, risks, and prerequisites. Every score is based on actual code analysis, not theoretical assessment."));

body.push(h2("5.1 Launch Readiness Scores"));
body.push(makeTable(
  ["Dimension", "Score", "Status", "Key Issues"],
  [
    ["Security", "2/10", "NOT READY", "8 CRITICAL vulnerabilities: OIDC token exposure, no payment verification, no webhook security, unauthenticated DDL execution, no CSRF, no RLS on daily_signals, settings not persisted, admin client falls back to anon key"],
    ["Stability", "5/10", "PARTIAL", "Core app renders and functions, but API interception disables all backend features. Build requires post-build patching. ESM circular import was resolved but fragile."],
    ["Product Depth", "6/10", "PARTIAL", "Good feature coverage (14 entities, 77 server functions), but many features are disconnected. Settings don't persist. Portfolio is basic. No behavioral intelligence."],
    ["User Retention", "4/10", "NOT READY", "No retention loops. Daily Loop exists but doesn't connect to actual trading. No push notifications. No behavioral hooks. No social features. Settings lost on refresh."],
    ["Scalability", "5/10", "PARTIAL", "Vercel serverless scales horizontally. Supabase handles RLS. Redis cache exists. But: no rate limiting, N+1 queries in getTradeStats, TwelveData API has no rate protection, 549 MB of dead files in repo."],
    ["Revenue Readiness", "2/10", "NOT READY", "Payment system is completely bypassable. subscribePremium requires no payment. purchasePack requires no payment. Telegram webhook is unverified. Points economy exists but monetization is trivially circumventable."],
  ],
  [14, 8, 12, 66]
));

body.push(h2("5.2 Launch Blockers (Must Fix Before Any Public Launch)"));
body.push(makeTable(
  ["#", "Blocker", "Severity", "Files Affected", "Fix Effort"],
  [
    ["1", "API route interception disables all backend features", "CRITICAL", "scripts/fix-vercel-bundle.mjs", "Medium - Remove addApiRouteInterception, fix underlying routing"],
    ["2", "No payment verification on subscribePremium", "CRITICAL", "src/domains/user/functions.ts", "High - Integrate Stripe or verify Telegram Stars server-side"],
    ["3", "No payment verification on purchasePack", "CRITICAL", "src/domains/user/functions.ts", "High - Same as above"],
    ["4", "Telegram webhook has no signature verification", "CRITICAL", "src/routes/api/telegram-webhook.ts", "Low - Add X-Telegram-Bot-Api-Secret-Token check"],
    ["5", "OIDC token exposed in .env.production", "CRITICAL", ".env.production", "Low - Delete file, rotate token"],
    ["6", "Unauthenticated DDL execution (applySignalBadgeMigration)", "CRITICAL", "src/domains/analysis/functions.ts", "Low - Add requireSupabaseAuth or remove function"],
    ["7", "CSRF protection disabled", "HIGH", "src/start.ts", "Low - Remove disableCsrfMiddlewareWarning"],
    ["8", "daily_signals has no RLS", "HIGH", "supabase/migrations/*", "Low - ALTER TABLE daily_signals ENABLE ROW LEVEL SECURITY"],
    ["9", "Settings not persisted", "HIGH", "src/routes/_authenticated/settings.tsx", "Medium - Implement user_settings table + CRUD"],
  ],
  [4, 36, 10, 32, 18]
));

body.push(h2("5.3 Launch Risks (Could Derail Post-Launch)"));
body.push(bullet("API Key Exhaustion: No rate limiting on TwelveData API calls. A single user could exhaust the monthly quota in minutes by rapidly refreshing market data pages."));
body.push(bullet("AI Cost Explosion: No rate limiting on copilot conversations. Each message triggers 8 parallel DB queries + 1-5 LLM API calls (consensus mode = 5 calls). A single power user could cost $50+/day in AI API fees."));
body.push(bullet("Signal Reliability: When Binance/TwelveData both fail, signal generator produces low-confidence WAIT signals instead of failing. Users may lose trust in signal quality."));
body.push(bullet("Data Loss: Settings, trading profile, and preferences are lost on refresh. Users will perceive the app as broken."));
body.push(bullet("Build Fragility: The entire Vercel deployment depends on a 256-line post-build patcher that mutates generated code. Any Vercel or Nitro update could break this in ways that are extremely difficult to debug."));
body.push(bullet("Schema Drift: TypeScript types in src/shared/supabase/types.ts do not match the actual migration schema (profiles.total_xp vs xp, missing score columns). This will cause runtime errors."));

body.push(h2("5.4 Launch Prerequisites (Minimum Viable Launch)"));
body.push(p("The minimum requirements for a controlled beta launch with real users:"));
body.push(bullet("Fix all 9 launch blockers listed above"));
body.push(bullet("Remove addApiRouteInterception from fix-vercel-bundle.mjs so that cron jobs and webhooks actually work"));
body.push(bullet("Add rate limiting to copilot and market data endpoints"));
body.push(bullet("Implement settings persistence"));
body.push(bullet("Add Stripe integration for premium subscriptions"));
body.push(bullet("Verify Telegram webhook secret"));
body.push(bullet("Add RLS to daily_signals"));
body.push(bullet("Remove dead code (254,924 lines) to reduce build size and maintenance burden"));
body.push(bullet("Add error monitoring (Sentry or equivalent)"));
body.push(bullet("Set up automated database backups"));

body.push(sep());

// ─── PHASE 6: MASTER ROADMAP ───
body.push(h1("PHASE 6: Master Execution Roadmap"));
body.push(p("This roadmap is organized into 6 priority tiers (P0-P5) with concrete tasks derived from actual code analysis. Every task includes files affected, database tables affected, APIs affected, estimated complexity, estimated engineering time, and dependency order. This is an execution plan, not a wish list."));

body.push(h2("6.1 P0: Critical Fixes (Week 1-2)"));
body.push(p("These are launch blockers that must be completed before any user-facing deployment. They address the 8 CRITICAL security vulnerabilities and the API interception issue."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Remove API route interception from fix-vercel-bundle.mjs", "scripts/fix-vercel-bundle.mjs", "None", "All /api/* routes", "Medium", "2 days", "None"],
    ["Delete .env.production and rotate OIDC token", ".env.production", "None", "None", "Low", "0.5 day", "None"],
    ["Add requireSupabaseAuth to applySignalBadgeMigration", "src/domains/analysis/functions.ts", "None", "applySignalBadgeMigration", "Low", "0.5 day", "None"],
    ["Add RLS to daily_signals", "New migration file", "daily_signals", "getDailySignals", "Low", "0.5 day", "None"],
    ["Add auth to /api/migrate endpoint", "src/routes/api/migrate.ts", "None", "/api/migrate", "Low", "0.5 day", "None"],
    ["Verify Telegram webhook secret", "src/routes/api/telegram-webhook.ts", "None", "/api/telegram-webhook", "Low", "1 day", "None"],
    ["Enable CSRF protection", "src/start.ts, vite.config.ts", "None", "All serverFn POST", "Low", "1 day", "None"],
    ["Fix admin client fallback to anon key", "src/shared/supabase/client.server.ts", "None", "All admin operations", "Low", "0.5 day", "None"],
    ["Make CRON_SECRET mandatory in production", "src/routes/api/check-alerts.ts, generate-signals.ts", "None", "/api/check-alerts, /api/generate-signals", "Low", "0.5 day", "None"],
    ["Delete vixor-APP/ orphan directory (549 MB)", "vixor-APP/", "None", "None", "Low", "0.5 day", "None"],
    ["Delete root-level duplicate files", "* (1).tsx files at root", "None", "None", "Low", "0.5 day", "None"],
  ],
  [22, 22, 10, 18, 10, 8, 10]
));

body.push(h2("6.2 P1: Neural Connections (Week 3-5)"));
body.push(p("These tasks create the neural connections between entities, transforming Vixor from a hub-and-spoke model to an interconnected graph. Each connection enables new AI capabilities and retention loops."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Add user_id + strategy_id to daily_signals", "New migration, src/domains/trading/types.ts, functions.ts", "daily_signals", "generateDailySignals, getDailySignals", "Medium", "2 days", "P0"],
    ["Add signal_id to trades", "New migration, src/domains/trades/types.ts, functions.ts, routes/trade-desk.tsx", "trades", "createTrade, listTrades", "Medium", "2 days", "P0"],
    ["Add signal_id to price_alerts", "New migration, src/domains/trading/types.ts, functions.ts, components/CreateAlertDialog.tsx", "price_alerts", "createAlert", "Medium", "1 day", "P0"],
    ["Add daily_loop_id + note_id + mood to trades", "New migration, src/domains/trades/types.ts, functions.ts", "trades", "createTrade, updateTrade", "Medium", "2 days", "P0"],
    ["Create economic_events_cache table", "New migration, new domain file", "economic_events_cache", "getEconomicCalendar", "Medium", "3 days", "P0"],
    ["Add high_impact_events to daily_loops", "New migration, src/domains/daily-loop/functions.ts", "daily_loops", "getTodayLoop", "Medium", "2 days", "Economic events cache"],
    ["Add auto_alert to watchlist_items", "New migration, src/domains/watchlist/types.ts, functions.ts", "watchlist_items", "addToWatchlist, updateWatchlistItem", "Medium", "2 days", "P0"],
    ["Implement settings persistence", "New migration (user_settings), src/routes/_authenticated/settings.tsx", "user_settings (new)", "New CRUD functions", "Medium", "3 days", "P0"],
  ],
  [22, 26, 14, 18, 10, 8, 12]
));

body.push(h2("6.3 P2: Intelligence Layer (Week 6-9)"));
body.push(p("These tasks build the AI evolution described in Phase 4: persistent memory, trading DNA, AI coach, and context-aware copilot V2."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Create copilot_memory + user_behavioral_patterns tables", "New migration", "copilot_memory, user_behavioral_patterns", "New CRUD functions", "Medium", "2 days", "P1"],
    ["Implement memory extraction after copilot conversations", "src/domains/copilot/server/agent-orchestrator.ts, new file: memory-extractor.ts", "copilot_memory", "askCopilot, getConsensus", "High", "3 days", "copilot_memory table"],
    ["Implement memory retrieval before copilot responses", "src/domains/copilot/functions.ts, agent-orchestrator.ts", "copilot_memory", "askCopilot, getConsensus", "Medium", "2 days", "Memory extraction"],
    ["Implement Trading DNA calculation", "New file: src/domains/user/dna-calculator.ts, src/domains/user/functions.ts", "profiles.trading_dna (new column)", "New calculateTradingDNA function", "High", "5 days", "P1 (trades schema)"],
    ["Display Trading DNA on Profile page", "src/routes/_authenticated/profile.tsx", "profiles", "getMe", "Medium", "2 days", "DNA calculation"],
    ["Create AI Coach rule engine", "New domain: src/domains/coach/, new migration for ai_coach_interventions + ai_coach_rules", "ai_coach_interventions, ai_coach_rules", "New CRUD + trigger functions", "High", "5 days", "P1 (neural connections)"],
    ["Implement revenge trading detection", "src/domains/coach/rules/revenge-trading.ts", "trades, daily_loops", "updateTrade (hook)", "Medium", "2 days", "AI Coach rule engine"],
    ["Implement overtrading detection", "src/domains/coach/rules/overtrading.ts", "trades", "createTrade (hook)", "Medium", "2 days", "AI Coach rule engine"],
    ["Implement risk violation detection", "src/domains/coach/rules/risk-violation.ts", "trades", "createTrade (hook)", "Medium", "1 day", "AI Coach rule engine"],
    ["Implement streak deterioration detection", "src/domains/coach/rules/streak-deterioration.ts", "trades", "updateTrade (hook)", "Medium", "1 day", "AI Coach rule engine"],
    ["Upgrade Copilot to V2 context enrichment", "src/domains/copilot/functions.ts, agent-orchestrator.ts, agents.ts", "copilot_memory, user_behavioral_patterns, profiles.trading_dna", "askCopilot, getConsensus", "Medium", "3 days", "Memory + DNA"],
  ],
  [22, 26, 18, 16, 10, 8, 14]
));

body.push(h2("6.4 P3: Retention Engine (Week 10-12)"));
body.push(p("These tasks create the daily habit loops and retention mechanisms that ensure users return to Vixor every trading day."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Real-time notifications via Supabase Realtime", "New file: src/domains/notifications/realtime.ts, __root.tsx", "notifications", "New subscription endpoints", "High", "5 days", "P0"],
    ["Weekly performance report generation", "New file: src/domains/reports/weekly-report.ts, new route", "trades, daily_loops, analyses (aggregation)", "New getWeeklyReport serverFn", "High", "5 days", "P2 (DNA + patterns)"],
    ["Daily signal push via Telegram", "src/domains/trading/functions.ts, telegram utilities", "daily_signals, profiles", "generateDailySignals", "Medium", "2 days", "P0 (API interception fix)"],
    ["Streak gamification (badges, milestones)", "src/routes/_authenticated/profile.tsx, new components", "user_streaks, profiles", "getStreak, new badge functions", "Medium", "3 days", "P0"],
    ["Morning briefing auto-generation", "New file: src/domains/coach/morning-briefing.ts", "daily_signals, economic_events_cache, user_strategies", "New generateMorningBriefing serverFn", "High", "3 days", "P1 + P2"],
    ["Social signal sharing", "New domain: src/domains/social/, new migration", "shared_signals (new), signal_reactions (new)", "New CRUD functions", "High", "7 days", "P1 (signal connections)"],
  ],
  [22, 26, 18, 16, 10, 8, 14]
));

body.push(h2("6.5 P4: Monetization (Week 13-15)"));
body.push(p("These tasks build the revenue infrastructure that converts users from free to paid."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Stripe integration for premium subscriptions", "New domain: src/domains/payment/, src/routes/_authenticated/premium.tsx", "premium_subscriptions, new: stripe_customers, stripe_payments", "New payment webhooks, subscribePremium (rewrite)", "High", "7 days", "P0 (security fixes)"],
    ["Feature gating by subscription tier", "All domain functions.ts files, middleware", "premium_subscriptions", "All serverFns", "Medium", "5 days", "Stripe integration"],
    ["AI usage metering and limits", "src/domains/copilot/functions.ts, new metering module", "New: ai_usage_tracking", "askCopilot, getConsensus", "Medium", "3 days", "P2 (Intelligence layer)"],
    ["Premium signal tiers (free vs premium signals)", "src/domains/trading/functions.ts, signals.tsx", "daily_signals", "getDailySignals", "Medium", "2 days", "Stripe + feature gating"],
    ["Referral reward system (points for referrals)", "src/domains/user/functions.ts, referral.tsx", "points_transactions, profiles", "claimReferral", "Low", "2 days", "P0"],
    ["Leaderboard (top signal performers)", "New domain: src/domains/leaderboard/, new route", "New: leaderboard_snapshots", "New getLeaderboard serverFn", "Medium", "3 days", "P3 (social signals)"],
  ],
  [22, 26, 18, 16, 10, 8, 14]
));

body.push(h2("6.6 P5: Scale (Week 16-20)"));
body.push(p("These tasks prepare the platform for growth beyond the initial user base."));
body.push(makeTable(
  ["Task", "Files Affected", "Tables", "APIs", "Complexity", "Time", "Depends On"],
  [
    ["Rate limiting for all endpoints", "New middleware file, all domain functions.ts", "None", "All serverFns + API routes", "Medium", "3 days", "P0"],
    ["Query optimization (getTradeStats, reorderWatchlist)", "src/domains/trades/functions.ts, watchlist/functions.ts", "None", "getTradeStats, reorderWatchlist", "Medium", "2 days", "None"],
    ["Remove 254,924 lines of dead code", "src/lib/analysis/, src/lib/i18n/, src/integrations/, src/hooks/, src/server/ shims, root duplicates", "None", "None", "Low", "3 days", "P0 (migration of vixor.functions.ts importers)"],
    ["Error monitoring (Sentry integration)", "src/shared/error-capture.ts, src/server.ts, src/start.ts", "None", "All", "Medium", "2 days", "P0"],
    ["Automated database backups", "Supabase dashboard config + new cron endpoint", "All", "New /api/backup-status", "Low", "1 day", "None"],
    ["Fix schema drift (TypeScript types vs migrations)", "src/shared/supabase/types.ts", "profiles (total_xp, level, score columns)", "getMe", "Medium", "2 days", "P0"],
    ["WebSocket real-time prices", "New service: src/domains/market/websocket.ts, charts.tsx", "None", "New WS endpoints", "High", "7 days", "P3 (real-time notifs)"],
    ["Pair format standardization", "Multiple route + domain files", "None", "Multiple", "Medium", "2 days", "None"],
    ["CDN for static assets", "Vercel config, vite.config.ts", "None", "None", "Low", "1 day", "None"],
  ],
  [22, 26, 10, 18, 10, 8, 14]
));

body.push(sep());

// ─── APPENDIX: EXECUTION SUMMARY ───
body.push(h1("Appendix: Execution Summary"));
body.push(h2("Total Effort Estimate"));
body.push(makeTable(
  ["Phase", "Duration", "Tasks", "Critical Path"],
  [
    ["P0: Critical Fixes", "Week 1-2", "11 tasks", "API interception removal, security fixes"],
    ["P1: Neural Connections", "Week 3-5", "8 tasks", "Signal-to-everything, settings persistence"],
    ["P2: Intelligence Layer", "Week 6-9", "11 tasks", "Memory engine, DNA, AI Coach"],
    ["P3: Retention Engine", "Week 10-12", "6 tasks", "Real-time notifications, weekly reports"],
    ["P4: Monetization", "Week 13-15", "6 tasks", "Stripe integration, feature gating"],
    ["P5: Scale", "Week 16-20", "9 tasks", "Rate limiting, dead code removal, WebSocket"],
  ],
  [22, 14, 12, 52]
));
body.push(p("Total estimated timeline: 20 weeks (5 months) from start to production-scale platform. The critical path runs through P0 -> P1 -> P2, as the Intelligence Layer depends on both security fixes and neural connections. P3 and P4 can partially overlap once their dependencies are met. P5 can begin as soon as P0 is complete and run in parallel with other phases."));

body.push(h2("Database Migration Summary"));
body.push(p("The following new tables and columns are required across all phases:"));
body.push(makeTable(
  ["Phase", "New Tables", "New Columns", "Modified Tables"],
  [
    ["P0", "None", "None", "daily_signals (RLS)"],
    ["P1", "user_settings, economic_events_cache, signal_reactions", "daily_signals: user_id, strategy_id | trades: signal_id, daily_loop_id, note_id, mood_at_open, mood_at_close | price_alerts: signal_id | daily_loops: high_impact_events | watchlist_items: auto_alert, alert_threshold_pct | profiles: trading_dna", "5 tables"],
    ["P2", "copilot_memory, user_behavioral_patterns, ai_coach_interventions, ai_coach_rules", "profiles: trading_dna (JSONB)", "2 new + 1 modified"],
    ["P3", "shared_signals, leaderboard_snapshots", "None", "2 new"],
    ["P4", "stripe_customers, stripe_payments, ai_usage_tracking", "None", "3 new"],
    ["P5", "None", "None", "None"],
  ],
  [8, 32, 36, 24]
));

body.push(h2("Key Architecture Decisions"));
body.push(bulletBold("Remove fix-vercel-bundle.mjs API interception entirely. ", "The underlying routing issue should be fixed at the Nitro/TanStack Start level, not by post-build patching. The NFT traceable imports function can remain, but everything else must go."));
body.push(bulletBold("Adopt Stripe for payment processing. ", "Telegram Stars alone is insufficient for a global product. Stripe provides webhook verification, subscription management, and payment confirmation that the current system entirely lacks."));
body.push(bulletBold("Implement Supabase Realtime for notifications. ", "The 5-minute cron interval for alert checking is too slow for a trading platform. Supabase Realtime provides WebSocket-based real-time updates with minimal infrastructure cost."));
body.push(bulletBold("Use JSONB for flexible schema extensions. ", "Trading DNA, behavioral patterns, and coach rules all use JSONB columns, allowing rapid iteration without schema migrations for each change."));
body.push(bulletBold("Build AI Coach as a rule engine, not hard-coded logic. ", "Rules stored in the database can be updated without code deployment, enabling rapid iteration on behavioral detection patterns."));
body.push(bulletBold("Delete 254,924 lines of dead code before adding new features. ", "The codebase is carrying 549 MB of orphan directory, 8,081 lines of duplicate analysis engine, and hundreds of re-export shims. Cleaning this first makes every subsequent task easier and safer."));

// ═══════════════════════════════════════════════════════════════
// ASSEMBLE DOCUMENT
// ═══════════════════════════════════════════════════════════════
const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" },
          size: 22,
          color: c(P.body),
        },
        paragraph: {
          spacing: { line: 312 },
        },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 480, after: 200, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 280, after: 120, line: 312 } },
      },
    },
  },
  sections: [
    // Cover section
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 0, bottom: 0, left: 0, right: 0 },
        },
      },
      children: coverChildren,
    },
    // TOC section
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: [
        new Paragraph({
          spacing: { after: 200 },
          children: [new TextRun({ text: "Table of Contents", bold: true, size: 36, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
        }),
        new TableOfContents("TOC", {
          hyperlink: true,
          headingStyleRange: "1-3",
        }),
        new Paragraph({
          spacing: { before: 200 },
          children: [new TextRun({ text: "Right-click the Table of Contents and select 'Update Field' to refresh page numbers.", italics: true, size: 18, color: c(P.secondary) })],
        }),
        new Paragraph({ children: [new PageBreak()] }),
      ],
    },
    // Body section
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: "VIXOR MASTER V2  |  Architecture Transformation Mission", size: 16, color: c(P.secondary), font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })],
          })],
        }),
      },
      children: body,
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const outPath = "/home/z/my-project/download/VIXOR_MASTER_V2_Architecture_Transformation.docx";
  fs.writeFileSync(outPath, buf);
  console.log("Document generated: " + outPath);
  console.log("Size: " + (buf.length / 1024 / 1024).toFixed(2) + " MB");
});
