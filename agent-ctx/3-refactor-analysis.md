# Task 3: Refactor -analysis-id-component.tsx (3179 lines → 11 focused modules)

## Objective
Split the monolithic 3179-line React component file into smaller, focused modules under `src/routes/_authenticated/analysis/`.

## What was done

### Files created (11 new modules)

| File | Lines | Responsibility |
|------|-------|----------------|
| `constants.ts` | ~30 | Style constants (CARD, MONO, LABEL, GREEN_GRAD), TABS array, Scenario interface |
| `utils.ts` | ~45 | `highlightSMC()` SMC/ICT term highlighter, `relTime()` relative time formatter |
| `ChartCanvasOverlay.tsx` | ~170 | Bbox-based canvas overlay (FVG/OB/Liquidity/SR/Pivots from normalized boxes) |
| `ChartWithAnnotations.tsx` | ~310 | Price-to-pixel chart annotations (FVG/OB/SR/Liquidity/Entry/SL/TP lines) — extracted but unused in current flow |
| `BackHeader.tsx` | ~100 | Navigation back button, bookmark, share dropdown (X/Telegram) |
| `HeroSignalCard.tsx` | ~280 | Main signal card (pair, recommendation pill, entry/SL/TP grid, confidence bar, source badge, track button) + VixorVerdictBox |
| `AnalysisNotesSection.tsx` | ~230 | Notes CRUD: list, add, edit, delete with NoteEditorDialog integration |
| `NewsImpactSection.tsx` | ~210 | News Impact tab: sentiment overview, AI verdict, news article cards with impact badges |
| `TradeSetupTab.tsx` | ~340 | Trade Setup tab: reasons list, reasoning trail, execution scenarios (conservative/balanced/aggressive) |
| `MarketContextTab.tsx` | ~210 | Market Context tab: key SMC levels, liquidity pools, market structure |
| `ManagementTab.tsx` | ~140 | Management tab: step-by-step management, risk factors, risk disclaimer |
| `index.tsx` | ~230 | Main `AnalysisResult` component — composes all sub-modules, handles queries/mutations/state |

### File modified (1)

| File | Before | After |
|------|--------|-------|
| `-analysis-id-component.tsx` | 3179 lines | 3 lines (re-export) |

### Backward compatibility
- The route file `analysis.$id.tsx` uses `lazyRouteComponent(() => import("./-analysis-id-component"), "AnalysisResult")` — this continues to work via the re-export.
- No changes needed to any consumer files.

## Architecture decisions

1. **Barrel re-export**: `-analysis-id-component.tsx` re-exports `AnalysisResult` from `./analysis` so the existing lazy route import is untouched.
2. **Constants/types in shared module**: `CARD`, `MONO`, `LABEL`, `GREEN_GRAD`, `TABS`, `Scenario` are co-located in `constants.ts` since they're used across multiple modules.
3. **Utilities separate**: `highlightSMC` and `relTime` are pure functions with no React dependencies, placed in `utils.ts`.
4. **ChartWithAnnotations preserved but not wired**: The original file defined this component (~530 lines) but never rendered it in `AnalysisResult`. It's extracted for potential future use.
5. **Each tab is its own component**: Trade Setup, Market Context, News Impact, and Management are separate files that receive only the data they need as props.

## Line count reduction
- Largest file before: 3179 lines (single file)
- Largest file after: ~340 lines (TradeSetupTab.tsx)
- Average file size: ~170 lines
- Total across all modules: ~2095 lines (slight reduction from removing duplicated inline styles/imports)
