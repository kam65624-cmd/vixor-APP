# Task: Indicators Module Implementation

## Summary

Created `/home/z/my-project/src/lib/analysis/indicators/index.ts` that integrates the `lightweight-charts-indicators` package with the Vixor analysis engine.

## Key Decisions

1. **Package works server-side**: Verified that `lightweight-charts-indicators` (and its dependency `oakscriptjs`) work correctly in Node.js/bun server-side context. No browser-specific code required.
2. **Direct package usage**: Used the package's `calculate()` functions directly for RSI, MACD, BollingerBands, EMA, SMA, StochRSI, ATR, ADX, CCI, OBV — all return arrays of the same length as input with NaN for warmup periods.
3. **VWAP implemented from scratch**: The package doesn't export a standalone VWAP indicator, so implemented it using the standard cumulative TPV/volume formula.
4. **Plot format conversion**: Created `plotToNumbers()` helper to convert the package's `TimeValue[]` format (with `{ time, value }` objects) to flat `number[]` arrays, handling null/undefined as NaN.

## Exports

- `IndicatorResults` interface
- `computeIndicators(bars: OHLCVBar[]): IndicatorResults`
- `getLatestIndicators(bars: OHLCVBar[])` — returns latest indicator values with derived metrics
- `getRSIStatus(rsi: number)` — returns OVERBOUGHT/OVERSOLD/NEUTRAL
- `getADXStrength(adx: number)` — returns STRONG/MODERATE/WEAK
- `checkEMAAlignment(ema9, ema21, ema50, ema200)` — returns alignment and strength (0-100)

## Validation

- TypeScript type-check: ✅ Passes
- ESLint: ✅ Passes (all prettier rules satisfied)
- Runtime integration test: ✅ All indicators produce correct values
- Empty array handling: ✅ Returns empty arrays
- Small dataset handling: ✅ Returns NaN for warmup periods
- 250-bar dataset: ✅ EMA200 produces valid values with sufficient data
