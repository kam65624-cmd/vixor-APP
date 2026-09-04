# Deprecated Character References — VIXOR Day 2 Update

Branch: rehab/baseline
Status: Active VIX UI text removed. CSS variable `var(--char-vix)` documented for future cleanup.

## Summary

| Character | Classification | Count | Day 2 Action |
|-----------|---------------|-------|--------------|
| VIX | Active Obsolete | 11 UI text blocks | Removed from active routes |
| VIX (CSS var) | Active Obsolete | 60+ CSS references | Documented; deferred to future visual refactor |
| SLY | Dead / Not Present | 0 | Confirmed dead |

## VIX UI Text — Removed in Day 2

All active VIX text references in route files have been replaced with neutral copy:

| File | Original | Replacement |
|------|----------|-------------|
| `src/routes/_authenticated/hunt/whales.tsx` | `VIX TRACKING {whalesTracked} WHALE WALLETS` | `TRACKING {whalesTracked} WHALE WALLETS` |
| `src/routes/_authenticated/hunt/verified.$id.tsx` | `VIX VERIFIED TOKEN DIRECTORY` | `VERIFIED TOKEN DIRECTORY` |
| `src/routes/_authenticated/hunt/token.$address.tsx` | `VIX TRACKS 73 CONFIDENCE — SIGNALS CONVERGING BULLISH` | `CONFIDENCE 73 — SIGNALS CONVERGING BULLISH` |
| `src/routes/_authenticated/hunt/radar.tsx` | `VIX SCANNED 1,247 TOKENS ACROSS 4 CHAINS IN 0.8s` | `SCANNED 1,247 TOKENS ACROSS 4 CHAINS IN 0.8s` |
| `src/routes/_authenticated/hunt/alpha.tsx` | `VIX DETECTED {realSignals.length} ALPHA SIGNALS — {accuracy}% ACCURACY THIS WEEK` | `DETECTED {realSignals.length} ALPHA SIGNALS — {accuracy}% ACCURACY THIS WEEK` |
| `src/routes/_authenticated/shield/trust.$address.tsx` | `VIX +5.7% ON TRUST SCORE QUERIES TODAY` | `+5.7% ON TRUST SCORE QUERIES TODAY` |
| `src/routes/_authenticated/shield/scanner.tsx` | `VIX +8.2% ON SHIELD SCANS TODAY` | `+8.2% ON SHIELD SCANS TODAY` |
| `src/routes/_authenticated/shield/index.tsx` | `VIX +8.7% ON SHIELD SCANS TODAY` | `+8.7% ON SHIELD SCANS TODAY` |
| `src/routes/_authenticated/shield/exposure.tsx` | `VIX +5.2% ON EXPOSURE ANALYSIS` | `+5.2% ON EXPOSURE ANALYSIS` |
| `src/routes/_authenticated/shield/cases.tsx` | `VIX +9.1% ON ACTIVE INVESTIGATIONS` | `+9.1% ON ACTIVE INVESTIGATIONS` |
| `src/routes/_authenticated/shield/alerts.tsx` | `VIX +12.4% ON SHIELD ALERTS TODAY` | `+12.4% ON SHIELD ALERTS TODAY` |

### Classification

**Active Obsolete (Text)**: VIX text used as a brand/metric label in micro-moment stat blocks. Replaced with neutral copy that conveys the same information without the obsolete character name.

## VIX CSS Variable — Documented for Future Cleanup

The CSS custom property `var(--char-vix)` (and variants `--char-vix-dim`, `--char-vix-border`) is used as a color token across hunt and shield routes.

**Classification: Active Obsolete (CSS)**

- Not a character identity but a legacy color variable name.
- Removing or renaming would be a visual change that requires design review.
- Deferred to a future visual refactor commit.

**Locations**:
- `src/routes/_authenticated/hunt/alpha.tsx` (13 references)
- `src/routes/_authenticated/hunt/radar.tsx` (8 references)
- `src/routes/_authenticated/hunt/verified.$id.tsx` (18 references)
- `src/routes/_authenticated/hunt/whales.tsx` (7 references)
- `src/routes/_authenticated/hunt/token.$address.tsx` (14 references)

## SLY References

**Classification: Dead / Not Present**

No SLY references found in active source code. Confirmed via grep search across `src/`. SLY is not used as a character, brand, or CSS variable name.

## Character Registry — Day 2

A canonical character registry was created at `packages/vixor-gamification/src/characters/`:

- `types.ts` — `CharacterId`, `CharacterRole`, `CharacterSurface`, `CharacterDefinition`
- `registry.ts` — `CHARACTER_REGISTRY`, `getCharacter`, `isActiveCharacter`, `isAllowedSurface`
- `index.ts` — public exports
- `registry.test.ts` — 15 test cases covering all registry invariants

**Active character IDs**: `moxi`, `mrVigo`, `drDex`, `echo`

VIX and SLY are not present in the registry and cannot be resolved as active characters.
