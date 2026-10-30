# VIXOR APP — Phase 0: Baseline & Repository Map

**Agent:** Agent 3 — UI/UX Design Director + Frontend Engineering
**Date:** 2026-10-30
**Repository:** `kam65624-cmd/vixor-APP` (public)
**Working branch:** `uiux/vixor-app-phase-1` (created from verified `origin/main`)
**Delivery mode:** Draft PR only — no merge, no deploy, no production changes. All output awaits owner approval.

---

## 1. Commit Baseline

| Item | Value | Evidence |
|---|---|---|
| `main` SHA (remote, verified) | `b893b6299f3bc9cfd4e8ab0361d61e60f80cf661` | `git rev-parse origin/main` after fresh `git fetch --prune` (2026-10-30) |
| `main` SHA (local clone) | `b893b6299f3bc9cf…` (identical) | `git rev-parse HEAD` at clone time |
| Working branch base | `b893b62` (same commit — zero drift) | branch created 2026-10-30, `git status` clean |
| Working branch HEAD | advances with staged Phase commits — see `implementation-changelog.md` | — |
| Production SHA | **Not Verified** — deployment target is Vercel (per `vercel.json`), but no production URL is recorded anywhere in the repo; prior handoff notes reference a "published site" (hydration error `#418`) without a URL. Marked Not Verified rather than guessed. | `docs/HANDOFF_2026-10-24.md` |
| Working tree at branch creation | Clean (fresh clone; no uncommitted changes) | `git status --short` empty |
| Git tags | none | `git tag` → empty |

Latest `main` history (top 12):

```
b893b62 Merge pull request #25 from kam65624-cmd/handoff/2026-10-24-vixor-app
e58a60d docs: finalize VIXOR APP handoff details
c87c679 chore: preserve VIXOR APP audit handoff
7859d9d Merge PR #23: Security: stop tracking .env (file kept on disk)
bbed012 chore(security): stop tracking .env (rotation-only strategy)
3e08e8e chore(env): add VITE_MIXPANEL_TOKEN to .env.example
df47588 feat(hunt): wire Smart Money tokens to Alpha Signals UI
a3b364c/a4099f5 style(birdeye): Smart Money formatting
c117dc4 feat(birdeye): add Smart Money endpoints
a501054 feat(Phase 4.2): Rate limiting on GoPlus and Birdeye API calls
```

---

## 2. Framework, Toolchain & Dependencies

| Layer | Technology | Version pin |
|---|---|---|
| Runtime | Node | >= 20 (sandbox uses 24) |
| Package manager | pnpm (corepack) | `pnpm@9.15.0` (`packageManager` field); install uses `--frozen-lockfile` on Vercel |
| Meta-framework | **TanStack Start** (SSR via srvx/nitro/h3) + **TanStack Router** (file-based routes) | Start `1.168.x`, Router `1.170.15` |
| UI runtime | React 19 + React DOM 19 | `^19.2.0` |
| Build | Vite 7 (+ `scripts/fix-vercel-bundle.mjs` post-build) | `^7.3.1` |
| Language | TypeScript (strict), ESLint 9 flat config, Prettier | TS `^5.8.3` |
| Styling | **Tailwind CSS v4** (`@theme inline` token bridge, `tw-animate-css`) | `^4.2.1` |
| Component library | **shadcn/ui** on Radix primitives (~40 components in `src/components/ui/`) + custom `src/components/vixor/*` | Radix `^1–2.x` |
| Charts | Recharts `^2.15`, `lightweight-charts ^5.2` (+indicators), TradingView embeds, DEX/DexTools charts | — |
| Motion | Framer Motion `^12.40` + CSS keyframe utilities (`vixor-page-enter`, flash highlights) | — |
| State/data | TanStack Query 5, Zustand 5, immer | — |
| AI | `ai` SDK 6 + `@ai-sdk/openai|google|openai-compatible`, OpenRouter, z.ai/Anthropic/Groq providers (`src/shared/llm/`) | — |
| Wallets/chain | `@tonconnect/sdk`, wagmi 3/viem, `@solana/wallet-adapter*` + web3.js, ethers 6, bs58, noble/ed25519, tweetnacl | — |
| Telegram | `@telegram-apps/sdk` 3.11 (Mini App), bot webhook + **Telegram Stars** payments | — |
| Backend | Supabase JS 2 (auth + Postgres + RLS), `server/api/*` serverless functions, Upstash Redis (rate limiting) | — |
| Analytics/observability | Mixpanel (`src/shared/analytics.ts`), Sentry (`src/shared/sentry.ts`), structured logger | — |
| Tests/QA | Vitest 2 + Testing Library 16 + jsdom (70 files / 1010 tests at last handoff), Storybook 10 (`src/**/*.stories.tsx`), Husky + lint-staged | — |
| i18n | EN/AR with RTL (`src/shared/i18n/`, Amiri Arabic fonts in `/fonts/arabic`) | — |

Feature flags of record (`.env.example`): `VITE_ENABLE_REAL_TRADES=false` (paper-only by default), `VITE_ENABLE_AI_ANALYSIS=true`, `VITE_ENABLE_ALPHA_FEATURES=false`; financial execution additionally guarded by `LEGACY_EXECUTION_DISABLED` (security module). Supabase env is REQUIRED for auth/persistence; most market-data keys are OPTIONAL with graceful fallbacks (Birdeye → null-fallback; OpenRouter → local SMC/ICT engine).

---

## 3. Application Architecture Map

### 3.1 Route tree (`src/routes/`)

- `__root.tsx` — providers (QueryClient, I18nProvider, Sentry, analytics), `AppShell`, global + route error boundaries, 404, Toaster (sonner).
- `auth.tsx` — public auth entry.
- `_authenticated/` (pathless auth group), ~45 page files + co-located feature folders:
  - **Core dashboard:** `index.tsx` (home: live ticker via BinanceWS SOL, MOXI quick actions, market stats).
  - **Token intelligence:** `token.$symbol.tsx` + `token/` (Crypto/Forex/Meme/Commodity sections, TokenMetrics, TradeRow, ForexSessionIndicator); `analysis/` (+`analysis.$id.tsx`) with HeroSignalCard, ChartWithAnnotations, TradeSetup/Management tabs, NewsImpact; `analyze.tsx` + `_analyze-page/` (Upload→Analyzing→Preview stages); `alpha.tsx`, `signals.tsx`, `predictions.tsx`, `opportunities.tsx`.
  - **HUNT domain (MR.VIGO):** `hunt/{radar, whales, alpha, token.$address, verified.$id}.tsx`; older siblings `whale.tsx`, `investigate.tsx`, `radar.tsx` + `_radar/` (BlipCard, HeatmapGrid, TickerStrip, RadarPulse, AlertsLogEntry, DemoNotice).
  - **SHIELD domain (DR.DEX):** `shield/{index, scanner, cases, alerts, exposure, trust.$address}.tsx`; `risk.tsx`.
  - **Trade & portfolio:** `trade-desk.tsx` + `_trade-desk/` (SwapPanel, RiskCalculator, ExecutionDialog, TokenAnalysisPanel, ActivePositions); `swap.tsx` + `_swap/` (TokenSelectorModal); `portfolio.tsx`, `pnl.tsx`, `backtest.tsx`, `charts.tsx`, `journal.tsx`, `tracking.tsx`, `trackers.tsx`.
  - **Loop & progression:** `daily-loop.tsx` + `_daily-loop/` (MorningPrep/SessionTracking/EodReview phases, Today/History tabs, StreakWidget); `loop.tsx`; `rewards.tsx`, `referral.tsx`, `profile.tsx`, `premium.tsx` (Telegram Stars), `notifications.tsx`.
  - **Discovery (multi-asset):** `discover.tsx` + `_discover/` (FilterPanel, TokenRow, ForexPairRow, SmartMoneyBar, SparklineSVG, NewBadge); `vision.tsx`, `pulse.tsx`.
  - **System:** `settings.tsx` + `_settings/` (ExchangeCard, SettingRow, ToggleSwitch, LanguageToggle); `wallet-web3.tsx` (multi-chain wallet hub); `admin/api-keys.tsx` (admin-gated).
  - Helper files co-located with `-` prefix (e.g. `-token-symbol-component.tsx`) — deliberately excluded from route generation (router warns about them; keep naming as-is).
- `v2/` — newer surfaces: `onboarding.tsx`, `index.tsx`, `discover.tsx`, `case/$caseId.tsx` + `{evidence, risk, decision}.tsx` (case workflow from the rehab program).
- Legacy `archive/domains/*` (paper-trading engine, arbitrage strategies, experiment, broker) — preserved read-only; do not delete or rewire.

### 3.2 Domains (`src/domains/`)

`moxi` (AI crew: agent/hunter/analyst/coach/governor agents, context engine, persona), `analysis` (engine: SMC/ICT — order blocks, FVG, BOS/CHoCH, liquidity; regime detector; MTFA; news sentiment; calendar impact; opportunity scanner), `discovery` (clients: birdeye, helius, dexscreener, mobula, lunarcrush, twitter + scoring), `signal-tracking` (transition engine, auto-track), `daily-loop`, `echo` (outcome learning), `mr-vigo` (investigation), `dr-dex` (candlestick/pattern analyzers), `shield` (GoPlus, rugcheck, trust-score), `trade` (jupiter/1inch clients, pattern detector), `trading` (gateway adapters: binance, bybit, okx, exness, ccxt-generic, dummy), `wallet` (phantom, metamask, walletconnect, telegram adapters), `case` (providers: security-scan, discovery, evidence, outcome, token-intelligence + mock variants), `risk-governor`, `backtest` (candle-path simulator, state machine), `chart-intelligence` (chart-vision/validation/session), `chart-truth` (price reconciler, truth-score engine), `market`, `trades` (weekly review, performance), `notes`, `strategy` (script runtime), `watchlist`, `user` (telegram verify).

### 3.3 Shared (`src/shared/`)

`data/*` — 12 domain-grouped server-fn data modules (dashboard, discovery, forex, portfolio, signals, market, watchlist, wallet, user, communities, strategy, trading) + barrel re-export (split done in agent-ctx Task 8; preserve).
`design/tokens.ts` — TS mirror of CSS tokens. `market-data/*` — gateways: Binance WS, DexScreener WS, Helius RPC, Finnhub, market-data-gateway + live-price hooks. `security/*` — api-auth, CSP, rate-limits, sanitize, legacy-execution guard (Agent 2's area; preserve). `llm/*` — provider router. `i18n/` — EN/AR translations + nav-strings (tested). `supabase/` — client, server client, auth middleware/attacher. `notifications/channels/` — in-app, email, telegram, webhook. Plus: events (query invalidation), resilience (rate-limiter, circuit breaker, redis), jobs (scheduler, vixor-jobs), observability (perf, error-handler), sound-manager, telegram helpers, hooks (use-mobile, use-online, use-pull-to-refresh, use-signal-monitor, use-render-guard, use-stable-server-fn).

### 3.4 Server (`server/api/`) + infra

`stars-webhook`, `telegram-webhook`, `generate-signals` (Vercel cron daily), `check-alerts` (cron), `migrate`, `health`, `metrics`, `p1-validate`, `reanalysis-cron`, `echo-stats`, `market-data-health`, admin api-keys — **Agent 2 ownership**. `vercel.json`: pnpm build, two crons. `supabase/` — 48 migration files — **Agent 2 ownership; never touched by Agent 3**.

### 3.5 In-repo agent skills (`skills/`, 69 top-level)

Z.ai-style skill library snapshot; relevant to this assignment: `ui-ux-pro-max` (data packs: colors, typography, ux-guidelines, ui-reasoning, stacks incl. react/shadcn), `design` (horizontal-craft: laws-of-ux, anti-ai-slop, grid-system, state-coverage, accessibility, animation-discipline + **brand-inspiration library, 100+ brands incl. linear-app, vercel, stripe, notion, figma, binance, coinbase, kraken**), `visual-design-foundations`, `agent-browser`, `charts`, `fullstack-dev`, `web-reader`, `web-search`. Verified in `skills-register.md`.

---

## 4. Existing Design System (state at baseline)

**V6 "Command Center" (2026/2027), documented in `DESIGN_TOKENS.md` + `src/styles.css` (2267 lines):**

- 4-layer surface ladder (dark: `#08090c → #101114 → #16171c/#16171c-elevated → #0c0d12 hero`; light equivalents) + glass 2.0 (`--glass-bg/blur/border`).
- Semantic trading colors (`--bullish #22d3a6`, `--bearish #fb4667`, `--neutral-wait #f5a623`, TP1–3 spectrum) with 8% bg / 20% border variants; **gold reserved for premium only**.
- Brand: indigo `--primary #6366f1` + purple secondary `#8b5cf6`; hero gradient; one mesh per surface.
- Character tokens (official registry, tested): MOXI cyan `#06b6d4`, MR.VIGO purple `#8b5cf6`, DR.DEX + ECHO tokens; domain accents: HUNT neon lime `#39ff14`, SHIELD gold `#ffd700` (+ shield semantic scale safe/caution/suspicious/danger/unknown).
- Type: Inter (sans/display) + JetBrains Mono (all financial numbers — enforced rule); 8-level V5 scale (display 32 → micro 11).
- Radius 4–24 + pill; spacing 4px base (xs–3xl); 6-level shadows; motion tokens (100/180/240/400ms + 3 easing curves).
- Bridge tokens registered in `@theme inline` for Tailwind (`--color-*` → utilities like `text-bullish`).
- `vx-*` utility primitives (card, glass, input, badge variants, btn variants).
- Governance already present: `src/__tests__/design-token-hygiene.test.ts` (token hygiene), character-registry test, characters-i18n test, nav-strings test; Storybook stories for atoms, EmptyState, PaginationBar, MiniSparkline, LiveDot, RouteLoading, PageLayout, ExpandableWidget.

**Assessment:** a strong, opinionated foundation exists. Phase 3 must **extend and discipline** it (states, density, motion rules, RTL parity, data-viz grammar) — not replace it. Any token change must keep `design-token-hygiene.test.ts` green.

---

## 5. Ownership Map & Parallel-Work Boundaries

| Area | Owner | Agent 3 action |
|---|---|---|
| `server/api/*`, `supabase/` migrations, payments (Stars), auth/CSP/security | Agent 2 (backend) | Never modify. Flag frontend-visible needs in `ux-issue-register.md` as "requires Agent 2 coordination". |
| Open PR #26 (premium activation fix, draft) & #27 (Stars atomic fulfillment) | Payments/backend stream | Avoid `premium.tsx` business logic and all `server/api` files; premium-page *visual* changes only with explicit note in changelog. |
| All merged history incl. handoff PR #25 (security/CSP/env hygiene), market/OHLCV work, Smart Money wiring, `design-token-hygiene` test, i18n nav-strings, character registry | Prior agents/owner | Preserve everything; no rewrites; incremental diffs only. |
| `$null` zero-byte file at repo root | Unknown (handoff instruction) | Preserve untouched, never open. |
| Routes/IA/design system/components/responsive/a11y/i18n surfaces | **Agent 3** | This assignment. |

Conflict check performed (2026-10-30): 34 branches inventoried; 27 PRs (25 closed, 2 open — both payments/backend). No branch named `uiux/*` exists prior to mine → no naming collision. Fresh clone + clean tree at branch creation → no dirty-state risk.

---

## 6. Known Issues Carried Into This Assignment (from prior audits — to re-verify in Phase 1)

From `docs/AUDIT_FULL_2026.md` (2026-09-28 — may be partially stale; many PRs merged since):

1. TS errors in `investigate.tsx` + `mr-vigo/functions.ts` (severity unknown now — re-verify via `typecheck`).
2. Character decision loop not fully wired (paper decisions not reaching ECHO; `assessToken` built but no UI calls it).
3. Missing auth guards on some public server functions (trade domain) — Agent 2's to fix; UI implications noted in my register.
4. Dual tables `user_trades` vs `trades` (dashboard/PnL vs echo/stats read different tables) — data-integrity risk visible in UI; requires Agent 2.
5. `/signals` route not confirmed wired to `daily_signals` cron table.
6. React hydration error `#418` on published site — root cause unproven.
7. No root `README.md` (repo hygiene).

From handoff: Stars payment idempotency unresolved (Agent 2). 3D character (MOXI) repair pending approved original asset — do not substitute unrelated model/static image.

---

## 7. Risks Specific to the UI/UX Assignment

1. **Token governance:** `design-token-hygiene.test.ts` + bridge-token convention constrain how tokens may change — every Phase 3+ change must keep the test green.
2. **i18n/RTL:** all user-facing strings must ship EN+AR; `nav-strings` and `characters-i18n` tests enforce nav coverage; AR/RTL layout regressions are a top QA risk (mirror-aware spacing/margins).
3. **TanStack Router conventions:** file-based routing with `-`-prefixed helpers; route renames/deletions are forbidden without owner approval (feature-preservation rule).
4. **Live-data surfaces:** many pages depend on optional API keys with graceful fallbacks; visual QA must cover *degraded* states (unavailable banners), not only happy paths.
5. **Two parallel route generations (`_authenticated/*` vs `v2/*`)**: IA consolidation is a likely Phase 4 proposal — but any merge/dedup of routes requires owner approval and a feature-preservation map first.
6. **Storybook/Vitest gates:** husky + lint-staged run eslint/prettier per commit; CI expectations (build, typecheck) must stay green — verified per stage, recorded in QA report.
7. **Production baseline gap:** no production URL available from the repo → visual baseline limited to local dev run; browser journeys behind auth marked **Not Verified** unless the owner provides a staging URL or test credentials.

---

## 8. Phase 0 Verification Log

| Check | Result | Evidence |
|---|---|---|
| Token identity & scopes | OK — `kam65624-cmd`, scopes `repo, workflow, project, audit_log` | GitHub API `GET /user` (2026-10-30) |
| Repo visibility/default branch | public, `main` | `GET /repos/...` |
| Fresh clone, clean tree | OK | `git status --short` empty |
| Branches inventoried | 34 (incl. 30 `rehab/*`, `feat/*`, `fix/*`, `handoff/*`) | `GET /branches` |
| PRs inventoried | 27 total; open: #26, #27 (payments/backend) | `GET /pulls?state=all` |
| `origin/main` unchanged post-fetch | `b893b62` | `git fetch --prune` + `rev-parse` |
| Working branch created | `uiux/vixor-app-phase-1` from `b893b62` | `git checkout -b` output |
| Working tree clean on branch | yes | `git status` |

**Baseline conclusion:** the repository is in a clean, merge-consistent state with no overlapping frontend work in flight. It is safe to proceed to Phase 1 (full application audit) under the preservation rules in `feature-preservation-map.md`.
