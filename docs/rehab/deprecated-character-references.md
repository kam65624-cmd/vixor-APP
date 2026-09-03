# Deprecated Character References — VIXOR Day 1

Branch: rehab/baseline
Status: Inventory only — no references removed or renamed.

## Summary

| Character | Active/Historical/Dead/Ambiguous | Count | Action |
|-----------|----------------------------------|-------|--------|
| VIX | Active (UI copy) | 6+ route files | Replace in Day 2+ |
| SLY | Not found in active code | 0 | Confirm dead |

## VIX References — Detailed Inventory

All VIX references found in active route files under `src/routes/_authenticated/`:

| File | Line | Context | Classification | Notes |
|------|------|---------|----------------|-------|
| `src/routes/_authenticated/hunt/whales.tsx` | 348-360 | `VIX TRACKING {whalesTracked} WHALE WALLETS` | Active | UI copy in whales tracking page |
| `src/routes/_authenticated/hunt/verified.$id.tsx` | 386-398 | `VIX VERIFIED TOKEN DIRECTORY` | Active | UI copy in verified token directory |
| `src/routes/_authenticated/hunt/token.$address.tsx` | 520-532 | `VIX TRACKS 73 CONFIDENCE — SIGNALS CONVERGING BULLISH` | Active | UI copy in token detail page |
| `src/routes/_authenticated/hunt/radar.tsx` | 375-387 | `VIX SCANNED 1,247 TOKENS ACROSS 4 CHAINS IN 0.8s` | Active | UI copy in radar page |
| `src/routes/_authenticated/hunt/alpha.tsx` | 456-468 | `VIX DETECTED {realSignals.length} ALPHA SIGNALS — {accuracy}% ACCURACY THIS WEEK` | Active | UI copy in alpha signals page |
| `src/routes/_authenticated/shield/trust.$address.tsx` | 549-561 | `VIX +5.7% ON TRUST SCORE QUERIES TODAY` | Active | UI copy in trust score page |
| `src/routes/_authenticated/shield/scanner.tsx` | 742-754 | `VIX +8.2% ON SHIELD SCANS TODAY` | Active | UI copy in scanner page |
| `src/routes/_authenticated/shield/index.tsx` | 360-372 | `VIX +8.7% ON SHIELD SCANS TODAY` | Active | UI copy in shield dashboard |
| `src/routes/_authenticated/shield/exposure.tsx` | 343-355 | `VIX +5.2% ON EXPOSURE ANALYSIS` | Active | UI copy in exposure page |
| `src/routes/_authenticated/shield/cases.tsx` | 206-218 | `VIX +9.1% ON ACTIVE INVESTIGATIONS` | Active | UI copy in cases page |
| `src/routes/_authenticated/shield/alerts.tsx` | 259-271 | `VIX +12.4% ON SHIELD ALERTS TODAY` | Active | UI copy in alerts page |

### VIX Classification

**Classification: Active Obsolete**

- VIX is used as a UI micro-moment stat block across multiple active routes.
- It is not a functional persona but acts as a brand/metric label.
- All instances should be replaced with approved character names or removed in Day 2 character normalization.

### SLY References

No SLY references found in active source code after initial grep search.

**Classification: Dead / Not Present**

- SLY does not appear in current routes, components, or domains.
- If found in documentation or historical commits, classify as Historical.

## Action Plan

Day 2 will:
1. Replace all active VIX UI copy with approved character references or neutral copy.
2. Confirm SLY is not present in any active path.
3. Update the registry to ensure no obsolete character is resolved.
