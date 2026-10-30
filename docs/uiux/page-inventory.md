# VIXOR APP — Phase 1: Full Page Inventory

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1` · **Base:** `main@b893b62`

**Method & confidence legend** (applies to every row below):
- **[R]** Route file read line-by-line (high confidence).
- **[S]** Server-fn usage map extracted via code search (`useStableServerFn(...)` call sites) + component import surface (medium-high confidence).
- **[V]** Visually verified in local dev render (`http://localhost:8080`, no auth session — degraded states); screenshots in `docs/uiux/screenshots/baseline/`.
- Runtime behaviors that require authenticated data (real Supabase rows, paid keys) are **Not Verified** in this pass — flagged per row.
- Priorities: **P0** = daily-use surfaces & monetization; **P1** = core workflows with lower traffic; **P2** = secondary tools; **P3** = candidates for consolidation (require owner approval before any change).

---

## 1. Summary table (all routes)

| Route | Page | Purpose | Primary data source(s) | Method | Pri |
|---|---|---|---|---|---|
| `/auth` | Sign-in | Telegram-first auth (WebApp auto-signin → widget → email fallback) | `telegramSignIn` server fn + Supabase auth | R,V | P0 |
| `/` | Home / dashboard | Live ticker, greeting, market stats, MOXI quick actions, unified feed | `getDashboardData`, `getMe`, `getHomeMarketData` (FNG + CoinGecko global), BinanceWS SOL, `useLivePrices` | R,V | P0 |
| `/discover` | Multi-asset discovery | Crypto/forex feed, filters, smart-money bar, sparklines | DexScreener REST (client CORS), exchangerate-api, FOREX_PAIRS config | R,V | P0 |
| `/analyze` | Chart analysis entry | Upload/choose → analyzing → preview stages; points economy | `getMe`, `createAnalysis` | S | P0 |
| `/signals` | Signals feed | Technical signals + daily cron signals; tracking creation | `getTechnicalSignals`, `getDailySignals`, `createSignalTracking`, `getUserSignalTrackings` | S | P0 |
| `/swap` | Token swap | Jupiter/1inch quotes, token selector modal | `getPopularSwapTokens`, `getEvmSwapTokens`, `getJupiterSwapQuote/Tx`, `get1inchSwapQuote/Tx`, `saveSwapExecution` (via SwapPanel) | S | P0 |
| `/trade-desk` | Trade desk | Risk calculator, execution dialog, open positions, exchange status, coach/governor overlays, swap panel | `createTrade`, `listTrades`, `getExchangeStatus`, `executeTrade` (guarded by `LEGACY_EXECUTION_DISABLED`) | R,V | P0 |
| `/alpha` | Alpha signals | Alpha feed + smart money | `getAlphaData`, `getTrendingTokens`, `getSmartMoneyTokens` | S | P0 |
| `/portfolio` | Portfolio | Holdings, performance | `getPortfolioData`, `getPerformance` | S | P1 |
| `/charts` | Charts | Candles + ticker via Binance | `getCandles`, `getTicker` | S | P1 |
| `/token/$symbol` | Token detail (multi-asset) | Crypto/forex/meme/commodity sections; trades; watchlist | URL search params (chain/price/change/name/dexUrl/pairAddress) + `getTradeHistory`, `getRecentAnalyses`, `getWatchlistData` | R,V | P0 |
| `/analysis` | Analysis list | Saved analyses; track-from-analysis | `getAnalysis`, `createSignalTracking` | S | P1 |
| `/analysis/$id` | Analysis detail | Tabs: setup/management/market context; annotated chart; news impact; notes | `getAnalysis($id)`; notes: `getNotesByAnalysis`, `deleteNote` | S | P1 |
| `/hunt/radar` | Token radar (HUNT) | Trending tokens, chain filters, search | `getTrendingTokens` (Birdeye/DexScreener server-side) | R,V | P0 |
| `/hunt/whales` | Whale tracking | Wallet list + flows | `getWhaleWallets` | S | P0 |
| `/hunt/alpha` | Hunt alpha | Trending + smart money | `getTrendingTokens`, `getSmartMoneyTokens` | S | P1 |
| `/hunt/token/$address` | Hunt token detail | Token deep-view from hunt | `getTokenDetail` | S | P1 |
| `/hunt/verified/$id` | Verified directory | Verified token profiles | `getTokenDetail` | S | P2 |
| `/shield` | SHIELD forensics dashboard | Alerts, scan history, KPI stats | `getShieldAlerts`, `getScanHistory` | R,V | P0 |
| `/shield/scanner` | Security scanner | Address scan → GoPlus/rugcheck results | `scanToken` | S | P0 |
| `/shield/trust/$address` | Trust score lookup | Per-token trust score | `scanToken` | S | P1 |
| `/shield/cases` | Security cases | Case list + statuses | `getScanHistory` | S | P1 |
| `/shield/alerts` | Security alerts | Alert feed | `getShieldAlerts` | S | P1 |
| `/shield/exposure` | Exposure analysis | Watchlist-based exposure | `getWatchlist` | S | P2 |
| `/risk` | DR.DEX risk decision surface | Paper decision logging + risk assessment | `logPaperDecision` (paper-only, no DB write) | S | P1 |
| `/investigate` | MR.VIGO investigation | Token investigation workflow | mr-vigo domain fns (prior audit flagged TS errors — re-verify) | S | P2 |
| `/echo` | ECHO outcome learning | Stats panel + overview | `getEchoOverview` (+ `/api/echo-stats`) | S | P1 |
| `/daily-loop` | Daily loop | Morning prep / session tracking / EOD review; streaks; history | `getTodayLoop`, `updateMorningPrep/SessionTracking/EodReview`, `getLoopHistory`, `getStreak` | R,V | P0 |
| `/loop` | Loop (legacy alias) | Older loop surface | daily-loop domain fns | S | P3 |
| `/journal` | Trading journal | Entries + create | `getJournalEntries`, `createJournalEntry` | S | P1 |
| `/tracking` | Signal tracking | Active trackings | signal-tracking domain fns | S | P1 |
| `/trackers` | Trackers list | Watchlist-based trackers | `getWatchlistData` | S | P2 |
| `/pnl` | PnL tracker | Trade PnL views | `getUserTrades` (⚠️ `user_trades` table — see issue register) | S | P1 |
| `/backtest` | Strategy lab | Backtest runs; gated by `getMe` | `getMe` + backtest engine | S | P2 |
| `/predictions` | Predictions | Prediction feed | `getPredictionsData` | S | P3 |
| `/pulse` | Pulse & whale | Community/market pulse | `getPulseData` | S | P2 |
| `/whale` | Whale (legacy sibling of /hunt/whales) | Whale data | `getWhaleData` | S | P3 (duplicate-risk) |
| `/vision` | Vision AI | Recent analyses gallery | `getRecentAnalyses` | S | P3 |
| `/radar` | Radar (legacy sibling of /hunt/radar) | Blips, heatmap, ticker strip, alerts log | `getDailySignals`, `getRadarBlips`, Binance server-fn | S | P3 (duplicate-risk) |
| `/opportunities` | Opportunities | Opportunity list | discovery/scoring domain | S | P2 |
| `/notifications` | Notifications | Feed + read states | `getNotifications` | S | P1 |
| `/profile` | Profile | XP, level, points, referral, recent analyses | `getUserProfile`, `getUserPoints`, `getDashboardData`, `getPortfolioData`, `getReferralData`, `getRecentAnalyses` | S | P1 |
| `/rewards` | Rewards | Points + referral | `getUserPoints`, `getReferralData` | S | P1 |
| `/referral` | Referral | Referral stats + share | `getReferralData` | S | P2 |
| `/premium` | Premium (Telegram Stars) | Plans, subscribe | `getPremiumData`, `subscribeToPlan` (⚠️ known open work — PR #26 addresses activation-without-payment; PR #27 atomic fulfillment) | R,V | P0 |
| `/settings` | Settings | Preferences (sound/dark/compact), language, exchange credentials CRUD + test connection | `getUserSettings`, `updateUserSettings`, `getExchangeCredentials`, `saveExchangeCredentials`, `testExchangeConnection`, `deleteExchangeCredentials` | R,V | P0 |
| `/wallet-web3` | Wallet hub | Multi-chain wallet connect (Phantom/MetaMask/TON/WalletConnect), balances, tx | wallet adapter domain (⚠️ undeclared `@walletconnect/sign-client` import — see issue register) | S | P1 |
| `/admin/api-keys` | Admin API keys | Key vault management (admin-gated) | api-keys admin-guard domain | S | P2 |
| `/review` | Weekly review | Weekly trade review | `getWeeklyReview` | S | P2 |
| `/v2` | V2 home | New generation surface | v2 domain | S | P2 |
| `/v2/onboarding` | V2 onboarding | Character-guided case walkthrough | case fixtures + character registry | R,V | P2 |
| `/v2/discover` | V2 discover | New discovery surface | discovery domain | S | P2 |
| `/v2/case/$caseId` (+/evidence,/risk,/decision) | V2 case workflow | Evidence → risk → decision with MR.VIGO/DR.DEX/ECHO | case domain (mock providers in dev) | S | P2 |
| 404 | Not found | Root NotFoundComponent | — | R | P1 |

**Entry-point coverage (IA):** Dock (`BottomBar.dockItems`): `/`, `/discover`, `/analyze`, `/signals`, `/swap`, `/trade-desk`, `/alpha`, `/portfolio`, `/charts`, More-panel. More panel (`MorePanel.moreNavCategories`): `/radar`, `/pulse`, `/predictions`, `/daily-loop`, `/backtest`, `/vision`, `/trackers`, `/pnl`, `/journal`, `/settings`, `/profile`, `/premium`, `/rewards`, `/referral`. **Not reachable from dock/panel:** `/hunt/*`, `/shield/*`, `/echo`, `/investigate`, `/risk`, `/whale`, `/loop`, `/tracking`, `/opportunities`, `/notifications`, `/wallet-web3`, `/admin/api-keys`, `/review`, `/v2/*`, `/analysis/$id` — these depend on in-page cross-links (home quick actions, token rows, character surfaces). This is the single largest IA finding (see issue register UX-01).

---

## 2. Per-domain detail (selected P0/P1 pages — full 12-field format)

### `/auth` [R,V] — P0
- **Purpose:** sign in (Telegram WebApp auto → Telegram widget → email/password fallback behind "Other sign-in options").
- **Features:** env detection (`webapp|widget|manual`), busy/error states, feature marketing list, 200-free-points hook, password visibility toggle, auto-redirect if session exists.
- **Data:** `telegramSignIn` server fn; `supabase.auth.getUser()`.
- **Interactions:** sign-in submit, widget mount (waits for `Telegram.LoginWidget` up to 5s, timeout state), email mode toggle (signin/signup), eye toggle.
- **Current UX:** solid fallback chain; error surface is a single string — no per-cause recovery guidance; widget timeout messaging exists.
- **Visual:** dark, feature grid with icons; on-brand.
- **Responsive:** [V] renders correctly at 390×844.
- **Proposed:** add per-error recovery actions (retry / email fallback CTA), success feedback via toast, AR strings for all auth copy (verify coverage).
- **Regression risk:** auth is a P0 safety area — any change must not touch `telegramSignIn`/Supabase logic (Agent 2 boundary).

### `/` Home [R,V] — P0
- **Purpose:** daily entry: orientation (greeting by time of day + MOXI voice), live market pulse, quick actions.
- **Features:** time-sliced MOXI greeting; `MarketTicker` (CSS marquee 40s, tripled array, gradient masks); stat pills (with hover glow); SmartTabs; UnifiedFeed; SmartBottomSheet; MOXI quick-action prompts; EnergyOrb FX; skeleton shimmer loading.
- **Data:** `getDashboardData`, `getMe`, `getHomeMarketData` (Fear&Greed via alternative.me, CoinGecko global), BinanceWS SOL price (AppShell), `useLivePrices`.
- **Interactions:** quick-action prompts → routes; ticker items; tab switching; bottom sheet.
- **Current UX:** strong first screen; MOXI greeting adds personality. Issues: page title says "HUNT — Token Discovery Terminal" on the home dashboard (branding/IA confusion — home is not HUNT); ticker animation `prefers-reduced-motion` not respected (marquee loops regardless).
- **Visual:** [V] good baseline; stat pills use `CardGradientOverlay` + hover glow — consistent with V6.
- **Responsive:** [V] 390×844 & 1440×900 OK; top nav hides SOL price on <sm (kept BTC indicator).
- **Proposed:** retitle home as its own surface; add reduced-motion respect for marquee; unify greeting/AR.
- **Regression risk:** low (presentation-only edits); keep `getDashboardData` wiring untouched.

### `/discover` [R,V] — P0
- **Purpose:** multi-asset discovery (crypto + forex).
- **Features:** category tabs + sort; FilterPanel (liquidity/volume/honeypot/smart-money); search; live prices hook; forex sections with session indicator; sparklines; NewBadge; pull-to-refresh (PullIndicator + hook).
- **Data:** DexScreener REST **client-side** (`token-boosts/latest/v1` + per-token pair fetch), exchangerate-api forex, FOREX_PAIRS config.
- **Interactions:** filters apply → URL search params; row taps → `/token/$symbol`; pull-to-refresh.
- **Current UX/Visual:** [V] dense but organized; forex/crypto mixed without a clear mode boundary; error path returns `[]` silently (empty feed with no reason — data-integrity/UX gap).
- **Responsive:** [V] OK at 390 & 1440.
- **Proposed:** explicit data-source status chip (live/degraded/unavailable); separated FOREX mode; consistent empty/error states via `EmptyState`.
- **Regression risk:** medium — client-side fetch chain is fragile (CORS depends on DexScreener policy); changes must not alter request semantics.

### `/hunt/radar` [R,V] — P0
- **Features:** chain filters (All/Solana/ETH/BSC/Base), search, trending rows → `/hunt/token/$address`.
- **Data:** `getTrendingTokens` (server).
- **Issues:** header comment says "Mock Data" while data is real (stale comment — hygiene); title "Token Radar — HUNT" (fine); [V] renders well.
- **Proposed:** remove stale mock comments; add source/age chip per row (Birdeye).
- **Regression risk:** low.

### `/shield` [R,V] — P0
- **Features:** KPI stats (tokens scanned), alerts preview, scan history, severity color coding (shield semantic scale), case statuses.
- **Data:** `getShieldAlerts`, `getScanHistory`.
- **Issues:** [V] 676-line monolith (maintainability); same stale "Mock Data" comment pattern; duplicate severity/status mappers likely repeated across shield pages (consolidation candidate — component, not route change).
- **Proposed:** extract `SeverityBadge`/`CaseStatusBadge` shared components; keep routes intact.
- **Regression risk:** low-medium (shared extraction must be behavior-identical).

### `/trade-desk` [R,V] — P0
- **Features:** URL param prefill (symbol/price/direction); risk calculator (balance, risk %, SL pips/lots); exchange status; open positions (paginated); execution dialog (confirm → result, guarded by `LEGACY_EXECUTION_DISABLED`); CoachOverlay; GovernorRiskPanel; SwapPanel; sound feedback.
- **Data:** `createTrade`, `listTrades`, `getExchangeStatus`, `executeTrade` + full swap stack.
- **Issues:** [V] good structure; execution guard messaging visible; legacy execution message needs AR coverage; guard rail = paper-only default.
- **Regression risk:** HIGH — any restructuring must preserve the execution dialog's guard flow exactly; proposed changes are presentation-layer only.

### `/daily-loop` [R,V] — P0
- **Features:** Today/History tabs; morning prep (bias, emotional state), session tracking, EOD review forms; streak widget; history pagination; AnalystReportPanel.
- **Data:** 6 daily-loop server fns (all wired — confirms prior audit item #9 is resolved at wiring level).
- **Proposed:** phase-based visual progression (morning → session → EOD) using character tokens; streak milestone motion (single orchestrated moment).
- **Regression risk:** low.

### `/settings` [R,V] — P0
- **Features:** server settings (fetched via `getUserSettings`); local prefs (sound, dark, compact, chart-on-hover, auto-refresh, trade confirmations, 2FA toggle UI); language toggle (EN/AR); slippage + chain selectors; exchange credentials CRUD (add/test/delete with toast feedback).
- **Issues:** [V] 801-line page; `twoFactor` toggle is UI-only (no enforcement visible — must verify with Agent 2; do not present as security feature); darkMode toggle present — verify it actually toggles theme class (token test expects `.dark` variant behavior).
- **Regression risk:** medium (credentials CRUD is a real security-adjacent flow — presentation-only edits).

### `/premium` [R,V] — P0
- **Features:** plan cards from `getPremiumData` (DB plans with fallback constants when DB empty); subscribe mutation; success/error banners; state per-plan busy.
- **Data:** `getPremiumData`; `subscribeToPlan` (⚠️ upserts `active` subscription without payment verification — **known open work: PR #26 (draft) + PR #27 address this stream; Agent 3 must not modify the logic — flagged in issue register as backend-owned**).
- **Proposed (visual only):** gold-premium treatment audit, feature-by-value comparison, Stars payment copy clarity — pending PR #26/#27 resolution to avoid conflicts.
- **Regression risk:** medium (overlap with open PRs — coordinate timing).

### `/token/$symbol` [R,V] — P0
- **Features:** multi-asset sections (crypto/forex/meme/commodity) chosen by asset class; metrics; trade rows; watchlist; forex session indicator; gauge bars.
- **Data:** display data passed via **URL search params** (`validateSearch`: chain/price/change24h/name/dexUrl/pairAddress) + `getTradeHistory`, `getRecentAnalyses`, `getWatchlistData`.
- **Issues:** direct deep link without params → blank price/name (data-integrity + UX gap — see register UX-05); asset-class routing logic must be verified.
- **Regression risk:** medium.

### `/v2/onboarding` [R,V] — P2
- **Features:** 3-step character-guided walkthrough (welcome → network → ready) using MOXI + case fixtures; explicit "No wallet, no real trades" trust copy.
- **Proposed:** keep as sandbox demo; measure completion in Mixpanel before promoting.
- **Regression risk:** low (isolated surface).

### `/echo` [S] — P1 · **Not visually verified this pass** (auth-dependent data)
- Stats panel + `getEchoOverview`; reads `trades` table (⚠️ dual-table split with `user_trades` — data-integrity risk visible to users; Agent 2 coordination — see register DATA-01).

### `/wallet-web3` [S] — P1
- Multi-chain wallet hub; **blocked dependency issue** (`@walletconnect/sign-client` undeclared import — dep-scan warning at dev boot; see register ENG-01). Not visually verified.

---

## 3. Loading / error / empty state coverage (static pass)

| Pattern | Present? | Evidence |
|---|---|---|
| Skeleton shimmer | ✅ home, discover, settings, charts (custom `Skeleton` + `SkeletonRow` in PageLayout) | [R] |
| `EmptyState` component | ✅ `components/vixor/EmptyState` + stories; used on multiple pages | [R] |
| Error states per query | ⚠️ partial — `isError` handled inconsistently; `/discover` swallows errors to `[]` | [R] |
| Offline banner | ✅ AppShell `useOnline` + `role="alert"` banner | [R] |
| Route-level loading/error boundary | ✅ RouteLoading + RouteErrorBoundary + 404 | [R] |
| Toast system | ✅ sonner (Toaster in root) | [R] |
| Pull-to-refresh | ✅ discover (+ PullIndicator) | [R] |
| Reduced-motion respect | ⚠️ only partial (marquee/flash animations not gated) | [R] |
| RTL/AR verification | ❌ Not Verified (no automated AR pass at baseline) | — |

## 4. Console observations (local dev, no auth session)

- 2 page errors per page in sandbox — consistent with unreachable placeholder Supabase + restricted external APIs (expected degraded-state noise); **not classified as product defects without isolation** — production check Not Verified.
- Vite dep-scan warning: `@walletconnect/sign-client` imported but not declared (ENG-01).
- Hydration error `#418` (prior handoff, published site): root cause still unproven — carries over (ENG-02).
