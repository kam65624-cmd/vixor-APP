# VIXOR APP — Phase 1: Feature Preservation Map

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1` · **Base:** `main@b893b62`

**Rule of record (from owner's master prompt):** a feature is *preserved* only if its **behavior** remains functional in the new UI — not merely that its route exists. No route may be removed or renamed without explicit owner approval. No feature may be hidden by deleting its entry point. This map is the contract for Phase 4 implementation and QA.

**Status legend:** ✅ mapped & preserved by design · 🔒 requires owner approval before any relocation/merge · ⏳ verification pending (test in Phase 4/6)

---

## 1. Navigation entry points (IA layer)

| Feature | Current location | Phase 4 target | Status |
|---|---|---|---|
| Dynamic dock (10 items, 4 groups, drag-scroll, auto-center active) | `BottomBar.tsx` + `DynamicDock.tsx` | Preserved; **density proposal** (5+More) is a Gate-2 decision — dock item order/labels may change only with approval | 🔒 |
| More panel (4 categories, 14 items + language toggle) | `MorePanel.tsx` | Preserved; category structure may be re-grouped with approval | 🔒 |
| Top nav (logo, SOL/BTC live, points, wallet, avatar, bell) | `TopNav.tsx` + subcomponents | Preserved as-is; only visual refinement | ✅ |
| MOXI floating copilot (global) | `FloatingCopilot.tsx` | Preserved; visual polish only | ✅ |
| Page transition / route loading / error boundaries / 404 | `__root.tsx`, `RouteLoading`, `RouteErrorBoundary` | Preserved | ✅ |
| Offline banner + `useOnline` | AppShell | Preserved | ✅ |
| Onboarding modal (first run, localStorage `vixor-onboarded`) | `OnboardingModal.tsx` | Preserved; copy/visual polish only | ✅ |
| Telegram profile auto-sync + account linking | AppShell effects (`syncTelegramProfile`, `linkTelegramAccount`) | Preserved untouched (behavioral — no visual change permitted) | ✅ ⏳ |
| Language toggle EN/AR (+ RTL) | `LanguageToggle.tsx`, i18n provider, nav-strings | Preserved; **full-coverage AR audit** is a Phase 4 task | ✅ ⏳ |

## 2. Auth & account

| Feature | Current | Target | Status |
|---|---|---|---|
| Telegram WebApp auto-signin | `/auth` + `telegramSignIn` | Untouched logic; error/recovery UX improved | ✅ (logic 🔒 no-touch) |
| Telegram Login Widget (browser) | `/auth` widget mount + timeout | Preserved | ✅ |
| Email/password fallback | `/auth` hidden form | Preserved | ✅ |
| Session check + redirect | `/auth` → `/` | Preserved | ✅ |
| Points / XP / level / referral / premium data | profile, rewards, referral, premium pages | Preserved; presentation only | ✅ ⏳ |

## 3. Home & market data

| Feature | Current | Target | Status |
|---|---|---|---|
| Live ticker marquee (tripled array, 40s) | home `MarketTicker` | Preserved; add `prefers-reduced-motion` gate (fix, not removal) | ✅ |
| Market stat pills (FNG, global, etc.) | home + `getHomeMarketData` | Preserved | ✅ |
| MOXI time-of-day greeting + quick actions | home | Preserved (personality is a brand asset) | ✅ |
| BinanceWS SOL price + BTC live indicator | AppShell + TopNav | Preserved (real data; no mock) | ✅ |
| Unified feed / SmartTabs / SmartBottomSheet | home | Preserved | ✅ |

## 4. Discovery & token intelligence

| Feature | Current | Target | Status |
|---|---|---|---|
| DexScreener boosted feed (client CORS) + pair enrichment | `/discover` | Preserved; add explicit live/degraded status chip (fix) | ✅ |
| Forex sections + session indicator + rates | `/discover`, `-discover-forex-data`, exchangerate-api | Preserved | ✅ |
| Filter panel → URL params (liquidity/volume/honeypot/smart-money) | `/discover` `FilterPanel` | Preserved | ✅ |
| Pull-to-refresh | `/discover` | Preserved | ✅ |
| Token detail multi-asset sections (crypto/forex/meme/commodity) | `/token/$symbol` + `token/` components | Preserved; **fix param-dependence** (fallback fetch by symbol) is a Gate-2 item | 🔒 |
| Analysis create (upload/analyzing/preview; points economy) | `/analyze` + `_analyze-page` | Preserved; stage visuals polished | ✅ ⏳ |
| Analysis detail tabs + annotated chart + news impact + notes CRUD | `/analysis/$id` | Preserved | ✅ ⏳ |
| Alpha + smart money (Birdeye) | `/alpha`, `/hunt/alpha` | Preserved | ✅ |
| Signals feed (technical + daily cron) + tracking creation | `/signals` | Preserved (data wiring confirmed current) | ✅ ⏳ |

## 5. HUNT (MR.VIGO)

| Feature | Current | Target | Status |
|---|---|---|---|
| Trending radar (chain filters, search) | `/hunt/radar` | Preserved; add IA entry (Gate-2 decision) | 🔒 |
| Whale wallets + flows | `/hunt/whales` | Preserved | ✅ |
| Hunt token deep view | `/hunt/token/$address` | Preserved | ✅ |
| Verified directory | `/hunt/verified/$id` | Preserved | ✅ |
| MR.VIGO investigation flow | `/investigate` | Preserved; TS-error re-verification task | ⏳ |

## 6. SHIELD (DR.DEX)

| Feature | Current | Target | Status |
|---|---|---|---|
| Forensics dashboard (KPIs, alerts, history) | `/shield` | Preserved; component extraction (badges/mappers) | ✅ |
| Scanner (GoPlus/rugcheck) | `/shield/scanner`, `/shield/trust/$address` | Preserved | ✅ |
| Cases / alerts / exposure | `/shield/*` | Preserved | ✅ |
| Risk decision surface (paper decisions) | `/risk` | Preserved (paper-only semantics unchanged) | ✅ ⏳ |

## 7. Trade & portfolio

| Feature | Current | Target | Status |
|---|---|---|---|
| Risk calculator (balance/risk%/SL pips/lots) | `/trade-desk` | Preserved | ✅ |
| Execution dialog + `LEGACY_EXECUTION_DISABLED` guard | `/trade-desk` `ExecutionDialog` | Preserved **exactly** — guard flow is a safety property | 🔒 no visual restructuring without QA replay |
| Exchange status + open positions (paginated) | `/trade-desk` | Preserved | ✅ |
| Swap stack (Jupiter + 1inch quotes/txs, save execution) | `/swap` + `SwapPanel` | Preserved | ✅ ⏳ |
| Coach overlay + governor risk panel + sound | `/trade-desk` | Preserved | ✅ |
| Portfolio + performance; PnL; backtest; charts; journal; weekly review | respective pages | Preserved | ✅ ⏳ |

## 8. Loop & progression

| Feature | Current | Target | Status |
|---|---|---|---|
| Morning prep / session tracking / EOD review forms | `/daily-loop` | Preserved; phase visuals polished | ✅ ⏳ |
| Streaks + history pagination + AnalystReportPanel | `/daily-loop`, `/loop` (legacy alias kept until owner approves removal) | Preserved; `/loop` 🔒 consolidation candidate | 🔒 |
| Rewards / referral / notifications / profile | respective pages | Preserved | ✅ ⏳ |

## 9. Wallet & admin

| Feature | Current | Target | Status |
|---|---|---|---|
| Multi-chain wallet connect (Phantom/MetaMask/TON/WalletConnect) + wallet modal | AppShell modal + `/wallet-web3` | Preserved; **ENG-01 dependency fix required** for WalletConnect path | ⏳ |
| Exchange credentials CRUD + test connection | `/settings` | Preserved exactly (security-adjacent) | 🔒 presentation-only |
| Admin API keys vault | `/admin/api-keys` (admin-gated) | Preserved; keep admin gating untouched | ✅ |

## 10. V2 surfaces & legacy archive

| Feature | Current | Target | Status |
|---|---|---|---|
| V2 onboarding/discover/case workflow | `/v2/*` | Preserved as experimental track; no merge into main IA without owner approval + this map update | 🔒 |
| Archive domains (paper-trading, arbitrage, experiment, broker) | `archive/domains/*` | Untouched, read-only | ✅ |
| `$null` file | repo root | Untouched, never opened (handoff instruction) | ✅ |

## 11. Verification plan (Phase 6 hooks)

1. **Automated:** `design-token-hygiene`, `nav-strings`, `characters-i18n`, `character-registry` tests + full Vitest suite must stay green after every stage.
2. **Visual regression:** baseline screenshots (`docs/uiux/screenshots/baseline/`) re-captured per stage; before/after committed per stage.
3. **Journeys (browser):** sign-in fallback chain → home → discover → token detail → analysis → track signal → daily loop EOD → settings language switch AR → verify RTL. Authenticated journeys require owner-provided staging or test credentials — otherwise **Not Verified** and logged as such.
4. **Data integrity:** every list/detail page checked against its real source (no mock substitution); degraded modes (missing optional keys) explicitly designed, not accidental.
