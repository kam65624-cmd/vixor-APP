# VIXOR APP — Phase 2: Competitor Research & Market Benchmark

**Agent:** Agent 3 — UI/UX · **Date:** 2026-10-30 · **Branch:** `uiux/vixor-app-phase-1`
**Method:** public-page observation of 11 products (live fetch 2026-10-30, standard desktop UA + headless browser as fallback; no login, no paywall bypass, no ToS-restricted scraping, no asset copying) + the repo's own reference library (`skills/design/design-systems/brand-inspiration/*/DESIGN.md`) + clearly-marked model knowledge where live fetch was blocked. Anti-bot-challenged sites were **not** circumvented.

**Live fetch status:** Linear ✅ · Vercel ✅ (+/geist) · Stripe ✅ · Notion ✅ (+/pricing) · Figma ✅ · Perplexity ❌ (Cloudflare challenge; repo-library + marked model knowledge) · TradingView ✅ (+/markets) · Datadog ✅ · DEX Screener ⚠️ (main app challenged; official docs ✅) · Birdeye ✅ (birdeye.so — note: birdeye.com is a different company) · Coinbase ⚠️ (main challenged; blog ✅).

**Evidence tags:** [observed live] · [repo reference library] · [model knowledge, not live-verified]

---

## 1. Per-product analysis (12 dimensions each — condensed to decision-relevant findings)

### 1.1 Linear — premium SaaS shell benchmark — relevance: **High**
- [observed live + repo library] Near-black `#08090a` canvas; **elevation by luminance step, not shadows**; borders as `rgba(255,255,255,0.05–0.08)` hairlines; radius scale 2–22px; cards never solid (`rgba(255,255,255,0.02–0.05)` fills).
- Typography: Inter Variable at signature weight **510** (never 700); display tracking −1.58px@72px; Berkeley Mono for technical labels.
- Nav: Cmd+K-first; app shell = navigation rail + contextual sidebar with **persisted user layout prefs**; features named as **workflows, not modules** ("Intake and integrations", "Planning and monitoring").
- Marketing hero = **simulated live product UI** (issue pager, activity feed with timestamps) — the product demonstrates itself.
- Dataviz: hierarchy carried by rows/labels/status dots, not charts — a "command center" can read as intelligence without heavy charting.
- Weak for VIXOR: fully achromatic palette (VIXOR needs semantic bullish/bearish); cold for retail trading audiences.
- Avoid copying: `#5e6ad2` indigo (their brand); their exact type weights.

### 1.2 Vercel — dark premium aesthetic + state coverage — relevance: **High**
- [observed live + repo library] Two-voice type system: Geist sans (400/500/600 only) for narrative + **Geist Mono (12–13px) for every technical eyebrow/label**; single mesh gradient treated as one object (never split into swatches).
- [observed live, /geist] State coverage as **named components**: Empty State, Loading Dots, Skeleton, Spinner, Status Dot, Load More — state design is an explicit part of the system, not an afterthought.
- "Ask AI" action in top nav; agent-first onboarding ("Paste to your agent"); "Recently shipped" cadence for freshness.
- Hairline `#ebebeb` + stacked micro-shadows (`0 1px 1px #00000005`…); cards never float on heavy shadows.
- Weak: engineer-only tone; near-zero chroma risks inertness for retail.

### 1.3 Stripe — financial-grade polish — relevance: **High** (financial DNA)
- [repo library + observed live] **Tabular figures (`tnum`) on every money cell** at 14px; Sohne display at weight **300** with negative tracking (light mode); animated big-number telemetry as hero viz ("US$1.9tn processed, 99.999% uptime").
- One filled pill per band (single CTA discipline); 44×44px touch targets (AAA); case-study cards each carrying 2–3 quantified proof lines.
- 32px padding / 12px radius / 1px `#e3e8ee` hairline; Level-2 soft blue shadows `rgba(0,55,112,0.08)`.
- Weak for VIXOR: light-mode-first; weight-300 display on dark mobile risks halation at 13–14px (avoid on dark).

### 1.4 Notion — information density + discovery — relevance: **Medium-High**
- [observed live] **Verb-based product nav** ("Capture — Bring everything into one system of record", "Find — Get answers, instantly—with citations", "Automate — Keep work moving 24/7"); agent use-case gallery with arrow links (jobs-to-be-done as discovery surface).
- [repo library] Real product UI embedded in hero (kanban breaking out of hero band, deep diffuse shadow); 8px-radius buttons (deliberately not pills); 15+ locale selector; monthly/yearly toggle with savings nudge; Free tier lists AI as trial line items.
- Weak for VIXOR: pastel rainbow tints + cute illustration — fatal to a trading product's instrument-panel credibility.

### 1.5 Figma — taxonomy & lifecycle badges — relevance: **Medium**
- [observed live] Three-axis mega-nav (use case × role × org) — navigation tax for a many-audience product; 11 sub-products visible = fragmentation. **Inline lifecycle badges ("New", "Beta")** in nav; mono uppercase eyebrows; single-voice variable type at fine weight increments (320–540).
- Lesson for VIXOR: "Beta" chips for experimental features without color noise; **avoid** product-count sprawl — VIXOR must feel like ONE command center, not 11 tools.

### 1.6 Perplexity — AI-first UX (evidence-first) — relevance: **High** (AI-UX reference)
- [repo library; live blocked] Strict **3-level dark surface rule** ("do not invent a 4th"); **one accent per view**; answer column capped 720px for reading; bold **only for headings, never inline emphasis**; `tnum, ss01` for numeric data; JetBrains Mono for code/citations.
- The empty state **is the product** (centered query bar + suggested prompts); citations `[1][2][3]` attached to claims with hover source previews; stepped loading status ("Searching → Reading sources → Writing").
- Lesson for VIXOR: **every MOXI/MR.VIGO claim should carry source chips (Birdeye/GoPlus/Jupiter) + timestamp** — evidence-first AI output is the single highest-leverage differentiator vs signal-sellers.
- Avoid: chat-transcript-only layouts (VIXOR needs cards/tables, not a wall of chat).

### 1.7 TradingView — domain density benchmark — relevance: **High** (closest domain competitor)
- [observed live] Homepage **is** a live dashboard (widget mosaic: market summary, BTC-dominance donut, DXY, commodities, 10Y yield, inflation) — every module with tabs + "See all…" escape; per-asset-class sub-modules (gainers/losers/volatility); **search is the first nav item**; session toggles (Regular/Pre-market) inline in widgets; Earnings rows with **Actual vs Estimate pairs**.
- Social-proof de-risking in hero CTA: "**$0 forever, no credit card needed**" + "Join 100 million traders".
- Sparklines in quote rows; community idea cards with Long/Short tags; density with drill-down on everything.
- Avoid: 100+ indicator chart-terminal complexity — VIXOR sells *decisions*, not charting; the chart must be copilot-annotated, never a toolbar wall.

### 1.8 Datadog — dashboard grid + telemetry — relevance: **Medium**
- [model knowledge + observed screenshots] Widget-tile grid (timeseries/toplist/query value/heatmap/host map) with per-widget timeframes; hover-intent analytics on nav (160ms delay constant in JS); geo-localized marketing.
- Lesson for VIXOR: **per-widget timeframe selectors (24H/7D/30D)** on cards; instrument dock/nav hover events for analytics.
- Avoid: 30+ product mega-menu sprawl; enterprise beige-purple; metrics-first coldness for retail Telegram users.

### 1.9 DEX Screener — crypto-native cautionary tale — relevance: **High** (domain, cautionary)
- [docs observed live; app blocked] Table-first token discovery; **embeds TradingView rather than building charts**; zero-login public data; public API + websockets; **documented ranking factor families** (market activity, community engagement, trust/audits) while keeping exact weights secret.
- ⚠️ **Pay-for-visibility economy** (Boosts, "Golden Ticker" recolors a token's symbol gold platform-wide) — purchasable visibility contaminates ranking neutrality. **VIXOR must never sell placement — and should say so.**
- Reactions (🚀🔥💩🚩) as sentiment input; web-only vs mobile capability split acknowledged openly.

### 1.10 Birdeye (birdeye.so) — direct data competitor — relevance: **High**
- [observed live] **Search-first hero** ("Search token name, address, wallet…" before signup); audience-segmented front door (Retail → Terminal / Institutions → Peak / Builders → Data API); smart-money flows as a named, marketable primitive; two-track trust (KOL wall + institutional testimonials); stat blocks (41M users / 400+ exchanges / 30B+ trades).
- Lesson for VIXOR: paste-anything search that auto-routes (address → MR.VIGO case; symbol → token view; @wallet → whale flow); publish VIXOR's own counters (wallets tracked, tokens scanned, signals resolved).
- Avoid: desktop-terminal-first assumptions (VIXOR is Telegram-mobile-first); generic institutional blue.

### 1.11 Coinbase — trust & scarcity of accent — relevance: **Medium-High** (trust reference)
- [repo library + blog observed] "Institutional financial brand that happens to trade crypto": pure-white canvas, **one brand blue `#0052ff` used scarcely**, near-black `#0a0b0d` full-bleed editorial heroes carrying product-UI cards; CoinbaseDisplay at **weight 400** with −2px tracking (editorial calm); Coinbase Mono for numbers; semantic up `#05b169` / down `#cf202f`; 44px pill targets; card-on-card layering without decorative shadows; "Learn" as a top-level nav concept.
- Lesson for VIXOR: **scarcity of accent** (indigo = primary actions only; purple = AI/crew identity only); education surface in settings/premium; dark featured pricing tier on `--surface-hero`.

---

## 2. Comparison matrix

| Product | What works well | What feels outdated/confusing | VIXOR learns | VIXOR avoids | Relevance | Adaptation without copying |
|---|---|---|---|---|---|---|
| Linear | Luminance-stepped dark surfaces; rgba-white whisper borders; weight-510 discipline; Cmd+K; workflow-named features; hero = simulated product | Achromatic cold; no dataviz | Dark surface grammar; keyboard-first; workflow naming | Pure-achromatic palette | High | Apply luminance ladder to VIXOR's own `#08090c→#101114→#16171c`; never reuse `#5e6ad2` |
| Vercel | Sans+mono two-voice type; state coverage as named components; "Ask AI" in nav | Engineer-only tone | Mono eyebrows for metrics; states inventory as gate | Mega-menu on mobile | High | JetBrains Mono labels + VIXOR states matrix; own gradients |
| Stripe | `tnum` money cells; one CTA per band; big-number telemetry; 44px targets | Light-first; weight-300 on dark (halation) | Tabular figures everywhere; trust stats; 44px targets | Thin display type on dark mobile | High | `font-feature-settings:"tnum"` on all price/PnL cells; VIXOR trust bar |
| Notion | Verb-based nav; jobs-to-be-done gallery; locale switcher; savings toggle | Pastel tint chaos; cute illustration | Discovery through use-case lists; pricing density done right | Pastel decoration on semantic UI | Med-High | VIXOR "what can your crew do" gallery (per character, 3 arrow-linked use cases) |
| Figma | Lifecycle badges in nav; mono uppercase eyebrows | 11 products = nav tax | "BETA" chips on experimental features | Fragmented product identity | Medium | Beta chips without color noise; keep ONE command center |
| Perplexity | 3-surface rule; one accent per view; citations as first-class UI; stepped loading | Sparse chrome | **Evidence chips on every AI claim**; 3-surface rule | Chat-log-only layout | High | Source chips (Birdeye/GoPlus/Jupiter + timestamp) with VIXOR's own `--bullish` verified dot |
| TradingView | Homepage-as-dashboard; search-first nav; tabs + "See all" everywhere; session toggles inline | Chart-tool overload; overwhelming density for novices | Tabbed widget mosaic home; sparkline rows; free-tier de-risking copy | 100+ indicator terminal complexity | High | Home = tabbed cards (Today/Radar/Signals) + "See all →"; dark + copilot-annotated |
| Datadog | Widget-tile grid; per-widget timeframes; hover-intent telemetry | 30+ product sprawl; enterprise tone | 24H/7D/30D selectors on VIXOR cards; hover analytics | Product-count sprawl | Medium | Patterns only, not their purple |
| DEX Screener | Zero-login data; documented ranking factors; TradingView embeds | **Pay-for-visibility (Boosts/Golden Ticker)**; secret-scoring vibe | Ranking transparency (publish factor families) | **Selling placement — fatal to trust** | High (cautionary) | VIXOR Signal Score = published factor weights (security/momentum/smart-money/liquidity) |
| Birdeye | Search-as-hero; audience segmentation; smart-money flows as named primitive; stat blocks | Desktop-first; generic institutional blue | Paste-anything omnibox → auto-route; own counters | Desktop-only assumptions | High | VIXOR indigo; address/symbol/@wallet routing to cases |
| Coinbase | One-blue scarcity; weight-400 display calm; "Learn" nav; dark featured tier | SKU-list nav | Accent scarcity (indigo=actions, purple=crew); education surface; dark premium tier | SKU-list navigation | Med-High | Scarcity rules written into VIXOR design-system doc |

---

## 3. Top 10 patterns VIXOR should adopt (ranked)

1. **Evidence-first AI output** — source chips + timestamps on every MOXI/MR.VIGO claim (Perplexity citations × Notion "answers with citations"). Highest-leverage differentiator vs signal-sellers.
2. **`tnum` tabular figures + mono for all numerics** (Stripe/Binance pattern) — prices, PnL, TP/SL that don't reflow while live-updating.
3. **Luminance-stepped dark surfaces + rgba-white whisper borders** (Linear/Perplexity 3-surface rule) — formalize VIXOR's existing ladder; cap at the existing 4 layers; never drop-shadow elevation.
4. **Search/paste-anything as hero entry** (Birdeye/TradingView/Linear Cmd+K) — one omnibox routing address/symbol/@wallet → token view / MR.VIGO case / whale flow.
5. **Widget-mosaic home with tabs + "See all"** (TradingView/Datadog) — tabbed cards (Today/Radar/Signals) with per-widget timeframes.
6. **One-accent-per-view + semantic color apartheid** (Perplexity/Coinbase) — green/red only ever means market direction; indigo only primary actions; purple only AI/crew identity.
7. **Live product simulation on premium/paywall surfaces** (Linear/Stripe/Notion) — animated MOXI case assembling: evidence cards flowing in, DR.DEX gauge filling, ECHO verdict stamping.
8. **State-coverage inventory as a design gate** (Vercel Geist) — named loading/empty/error/degraded/offline/stale/RTL states per screen; checked like tests.
9. **Ranking/score transparency** (DEX Screener docs as the prompt; the anti-pattern is opacity) — publish Signal/Trust Score factor families; state "we never sell placement".
10. **Two-track trust bar + free-tier de-risking** (TradingView "$0 forever" + Stripe uptime stats + Birdeye counters) — persistent thin bar: wallets tracked · tokens scanned · signals resolved.

## 4. Top 5 things to avoid

1. **Pay-for-visibility mechanics of any kind** (DEX Screener Boosts/Golden Ticker) — a trading-intelligence product that sells placement becomes a paid-shill platform. VIXOR lists must be provably unsellable — and say so.
2. **Mega-menu / SKU-list navigation sprawl** (Figma 11 products, Datadog 30+, Coinbase SKU nav) — a Telegram mini-app has room for ~5 primary + More; anything wider buries the daily loop.
3. **Pastel/rainbow decoration inside the product** (Notion tints, Figma blocks) — VIXOR's color budget is fully spent on semantics + two brand hues; decoration competes with market-direction color.
4. **Charting-terminal complexity** (TradingView 100+ indicators, drawing toolbars) — VIXOR sells decisions with evidence; the chart is copilot-annotated, never a toolbar wall.
5. **Opaque scoring & unexplained AI output** — black-box scores read as manipulation risk; every score and claim needs a visible "why" (factor breakdown, source chip, confidence).

## 5. Three identity directions for VIXOR's "Premium Intelligent Command Center"

**Direction 1 — "Mission Briefing Room"** *(Linear-grade instrument panel)*
Mood: pre-flight calm — an ops room two minutes before market open; nothing moves unless it means something. Type: Inter 400/500/590 + JetBrains Mono telemetry 12–14px `tnum`; display −1px tracking; body never exceeds 590. Surfaces: existing 4-layer ladder with all borders as `rgba(255,255,255,0.06–0.10)`; elevation by luminance, never drop shadows; sunken wells for chart containers. Motion: 150–250ms ease-out, state-driven only; zero ambient loops; dock indicator is the only persistent motion. *Rationale: traders make money by reading instruments instantly — chrome must be nearly invisible so the signal is the loudest thing on screen.*

**Direction 2 — "Signal over Chrome"** *(semantic-color apartheid; TradingView density × Perplexity restraint)*
Mood: a Bloomberg-terminal heir that learned restraint — dense but quiet, confident in green/red. Type: one variable sans for narrative + one mono for numbers; bold reserved exclusively for verdicts ("VERDICT: LONG"), never inline emphasis. Color: strict 3-surface rule; `--bullish/--bearish/--neutral-wait` appear only as text, delta chips, and 8%-opacity tints on data — never decoration; indigo = primary actions; purple = crew/AI identity (avatar rings, copilot chrome). Motion: number-first — prices tick, sparklines draw, gauges fill; entrances 120ms fades; nothing bounces. *Rationale: in a trading terminal, color IS information — if the brand ever means "up", the user stops trusting what green means.*

**Direction 3 — "Evidence Glass"** *(Stripe-grade polish wrapped around provenance)*
Mood: private-bank terminal where every claim comes with a receipt. Type: editorial display moments (premium page, EOD summaries) at max 590 with tight tracking (never 300 on dark); data UI at 400/500. Surfaces: translucent evidence cards (`rgba(255,255,255,0.03)` + inner 1px gradient border indigo→transparent) for AI insights; the VIXOR mesh gradient (indigo→purple) used exactly once per surface — hero and premium moments only; citation chips (source label + age) docked to the bottom of every insight card. Motion: progressive assembly — copilot answers stream in as cards stacking with 100ms stagger; evidence chips attach with 150ms settle; the only sparkle-grade moment of the year is the streak milestone. *Rationale: AI trading advice is a trust product — visible provenance converts "believing the bot" into "checking the receipt", which is what justifies the premium tier.*

---

## 6. Mapping to VIXOR's audit findings (Phase 1 cross-reference)

| Benchmark lesson | Maps to issue |
|---|---|
| Search-first hero + omnibox routing | UX-01 (domain discoverability), workflow shortcuts (audit §6) |
| Dock ≤5 + More; avoid mega-nav | UX-03 (dock density) |
| States inventory as gate (Vercel) | UX-04 (silent errors), audit §9; DATA-04 degraded modes |
| `tnum` + mono numerics; provenance labels | audit §2 (dashboard comprehension), UX-14 |
| Desktop composition (not stretched mobile) | audit §8 (desktop under-designed) |
| Trust bar + free-tier de-risking copy | premium page (DATA-02 context); UX-16 verification |
| Scoring transparency | Signal/Trust Score surfaces (hunt/shield) |
| One-accent-per-view discipline | consistency (audit §7); token system governance |
| Reduced-motion / a11y as gate | UX-06, UX-14 |

**Recommendation to owner (Gate 2 input):** pursue **Direction 2 as the spine** (it extends the existing V6 semantic system with least risk), borrowing Direction 1's surface/border grammar and Direction 3's evidence-glass treatment for AI-insight cards and premium moments. All three are compatible with the current token architecture — no rebrand required.
