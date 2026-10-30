# VIXOR — Design System (Phase 3): Component Canon & Token Additions

**Agent:** Agent 3 — UI/UX · **Branch:** `uiux/vixor-app-phase-1` · **Status: PROPOSED (Gate 2)**
**Companion docs:** `design-direction.md` (why), `DESIGN_TOKENS.md` (V6 source of truth), `baseline-and-repository-map.md` (existing inventory).

**Principle:** one canonical primitive per job. Existing components are *kept* (preservation rule); the canon defines which one wins when several compete, and what Phase 4 converges toward. No parallel systems are introduced.

---

## 1. Token additions (V6.1 — the Phase 3 deliverable in `src/styles.css`)

| Token / utility | Value | Purpose |
|---|---|---|
| `--verified` (+`-dim`, `-border`) | `#22d3ee` family | Source-verified chips, evidence provenance (cyan = checked; coherent with `--shield-safe`) — resolves semantic-green conflict (Direction §3.4) |
| `--focus-ring` | `0 0 0 2px var(--background), 0 0 0 4px var(--color-primary)` | Single visible focus treatment (`.vx-focus-ring:focus-visible`) — UX-14 fix |
| `.vx-num` | mono stack + `font-variant-numeric: tabular-nums` | ALL numerics law (UX-14; benchmark pattern #2) |
| `--text-weight-strong` | `590` | The new "bold" (Linear discipline; `font-bold` migrates during Phase 4) |
| RTL flip utility `[dir="rtl"] [data-flip]` | `scaleX(-1)` | Directional icon mirroring (Phase 4 usage) |

**Note (corrected during Phase 3):** the global `prefers-reduced-motion` CSS gate **already exists in V6** (`styles.css` L2201–2232) — it is documented, not re-added. Remaining gap: JS-driven motion (framer springs) gated in Phase 4 via `useReducedMotion()` (UX-06, corrected). All additions are additive; `design-token-hygiene.test.ts` must stay green (verified per stage). No existing token is renamed or removed.

## 2. Component canon (which primitive wins)

| Job | Canonical primitive | Migrating away from (Phase 4, staged) |
|---|---|---|
| Page scaffold | `PageLayout` family (PageBadge/StatsRow/DataRow/ScrollArea/ProgressBar) | hand-rolled page layout (home, legacy pages) |
| Buttons | shadcn `Button` (cva) styled by tokens | inline `style={{}}` buttons (TopNav etc.), ad-hoc `vx-btn-*` (kept as CSS compat layer) |
| Inputs/Selects | shadcn `Input/Select` + `vx-input` for dark fields | ad-hoc dark inputs |
| Modals/Drawers | shadcn `Dialog/Sheet` + existing glass bottom sheets | hand-rolled overlay divs (wallet modal in AppShell) |
| Tabs | `SmartTabs` (app) / shadcn `Tabs` (settings forms) | — |
| Navigation | Dock + More panel (IA per design-direction §9, owner decision) + **new omnibox** (cmdk exists in deps) | — |
| Cards | `vx-card`/`vx-card-hover` + shadcn `Card`; **new `EvidenceCard`** (glass, inner gradient border, source-chip footer) for AI output only | glass on content cards (prohibited) |
| Tables | shadcn `Table` + `DataRow` dense rows with sparklines | ad-hoc row markup |
| Badges | shadcn `Badge` + **new `SeverityBadge`/`CaseStatusBadge`** (extracted from shield pages — UX-13) + `BetaChip` (Figma pattern) | duplicated mappers |
| Status | `LiveDot` (+ `--verified` dot variant for sources) | color-only dots |
| Alerts/Toasts | sonner Toaster (global) + `role="alert"` banner patterns | — |
| Loading | `Skeleton`/`SkeletonRow` shimmer (named per states matrix) | spinners for content |
| Empty | `EmptyState` (+ per-variant: no-results / no-data-yet / unavailable-with-retry) | blank regions |
| Error | RouteErrorBoundary (route) + query `isError` → EmptyState(error) with retry | silent `[]` returns (UX-04) |
| Charts | Recharts (dashboards) + lightweight-charts (candles) + TradingView embeds — unchanged | — |
| Search/Filters | `FilterPanel` (discover) + **omnibox (new, cmdk)** | per-page search inputs |
| Pagination | `PaginationBar` | ad-hoc pagination |
| Numbers | `.vx-num` | raw `font-mono` classes |

## 3. State matrix (design gate — every screen, every stage)

| State | Treatment | Owner component |
|---|---|---|
| loading | Skeleton shimmer matched to final layout shape | `Skeleton`/`SkeletonRow` |
| empty | `EmptyState` + one action ("Discover tokens", "Scan a token") + illustration-free | `EmptyState` |
| error | `EmptyState(error)` + explicit retry + source named | query layer |
| degraded | source chip "UNAVAILABLE" (e.g. BIRDEYE) + age of last good data | source chip |
| offline | existing `useOnline` banner (`role="alert"`) | AppShell |
| stale | age label ("12s ago") on live blocks | provenance label |
| RTL | mirrored via logical utilities (`ms-/me-/ps-/pe-`), directional icons flipped | global |

## 4. New components to build in Phase 4 (after Gate 2)

1. **`Omnibox`** (cmdk) — paste address/symbol/@wallet; routes to token/case/whale; recent searches; keyboard-first.
2. **`EvidenceCard`** — AI-insight container: claim, source chips (favicon-style label + age + `--verified` dot), confidence meter, actions. Used by copilot surfaces only.
3. **`SourceChip`** — provenance label component (BIRDEYE · 12s ago) reusable in any data block.
4. **`TimeframeChips`** — 24H/7D/30D per metric card.
5. **`SeverityBadge` / `CaseStatusBadge`** — extracted from shield (behavior-identical; UX-13).
6. **`BetaChip`** — experimental feature tagging (Figma lifecycle pattern).
7. **`DirectionDelta`** — arrow + sign + color (never color-only; UX-14).

## 5. Interaction rules (micro-interactions with intent)

- Hover: lighten/luminance step only (no scale on cards; scale ≤1.02 reserved for dock buttons on press `whileTap 0.88` — existing behavior kept).
- Focus: `--focus-ring` visible ring on every interactive element.
- Press: 0.96–0.88 scale on dock/actions (existing motion tokens).
- Data arrival: flash-highlight existing utility, gated by reduced-motion.
- Confirmation: destructive actions require explicit confirm dialog (existing `EditAlertDialog` pattern extended to new surfaces).
- Sound: existing `sound-manager` stays opt-in (settings toggle preserved).

## 6. Iconography & RTL

- Lucide (existing) — no new icon libraries.
- Icons that encode direction flip in RTL (`dir=rtl [data-flip] { transform: scaleX(-1) }` utility to add in Phase 4).
- Arabic: Amiri display (existing) + pending Arabic UI body face decision (design-direction §4.4 — owner item).

## 7. Responsive rules (breakpoints of record)

- **390–430px (primary, Telegram):** single column; dock; bottom sheets; 44px targets; safe-area insets (existing).
- **768px (tablet):** dock persists; content max-w 640px centered; two-col where `PageLayout` supports.
- **≥1024px (desktop):** `main + 360px rail` grids on Home/Discover/Desk/Analysis (design-direction §10); dock centers as island; top nav gains breadcrumb context.
- Touch targets ≥44px everywhere (TopNav buttons migrate in Phase 4 — UX-14).

## 8. Governance (already in place — restated as gates)

1. `design-token-hygiene.test.ts` green after every stage (no hardcoded colors in new code; tokens via `var()`/bridge).
2. Storybook story per new component (`Omnibox`, `EvidenceCard`, `SourceChip`, badges, `DirectionDelta`).
3. `nav-strings` + `characters-i18n` tests updated with any new nav/label terms (EN+AR).
4. `tsc --noEmit` + ESLint + full Vitest per stage; axe-core per stage; AR render pass per stage.
5. Before/after screenshots per stage → `docs/uiux/screenshots/` (baseline committed at `0a4fb79`).
