# Task: Implement Vixor Local Trading Analysis Engine — Pattern Detection & Risk/Reward

## Summary

Created 3 production-ready TypeScript files for the Vixor local trading analysis engine that replaces Gemini AI for chart analysis. All files compile cleanly with zero TypeScript errors.

## Files Created/Updated

### 1. `/src/lib/analysis/patterns/candlestick-patterns.ts`

- **20 candlestick pattern detectors** with full mathematical implementations
- Each pattern returns `{ name, index, type, reliability, description }`
- Uses existing `CandlePattern` interface from core/types (type: "BULLISH" | "BEARISH" | "NEUTRAL")
- Includes local `shortTermTrend()` helper using linear regression on closes
- Uses `avgBodySize(bars, period, endIdx?)` from candle-utils for context-aware body size
- Filters patterns with reliability > 50, sorted by reliability descending

**Bullish Reversal (7):** Bullish Engulfing, Hammer, Morning Star, Bullish Harami, Piercing Line, Three White Soldiers, Bullish Doji Star

**Bearish Reversal (7):** Bearish Engulfing, Shooting Star, Evening Star, Bearish Harami, Dark Cloud Cover, Three Black Crows, Bearish Doji Star

**Continuation/Indecision (6):** Rising Three Methods, Falling Three Methods, Spinning Top, Marubozu Bullish, Marubozu Bearish, Tweezer Top/Bottom

### 2. `/src/lib/analysis/patterns/chart-formations.ts`

- **11 chart formation detectors** using swing point analysis and trendline fitting
- Conforms to existing `ChartFormation` interface (type: "BULLISH" | "BEARISH", targetPrice?, stopPrice?)
- Local helpers: `sameLevel()`, `troughBetween()`, `peakBetween()`, `linearSlope()`, `trendlineSlope()`, `shortTermTrend()`
- Filters formations with reliability > 40, sorted descending

**Formations:** Double Top, Double Bottom, Head and Shoulders, Inverse Head and Shoulders, Ascending Triangle, Descending Triangle, Bull Flag, Bear Flag, Rising Wedge, Falling Wedge, Cup and Handle

### 3. `/src/lib/analysis/risk/risk-reward.ts`

- **Risk-reward calculator** with ATR-based stops and S/R validation
- **Position sizing calculator** using fixed-percentage risk model
- Entry: slight limit order offset (0.1 ATR from current price)
- Stop Loss: max(nearest support cushion, 1.5× ATR) for BUY; min(nearest resistance cushion, 1.5× ATR) for SELL
- Take Profits: 1:1, 1:2, 1:3 R-multiples with S/R level adjustment
- Invalidation: 2× ATR beyond stop-loss
- Downgrades to WAIT when RR < 1.5 or trend is NEUTRAL
- Exports: `calculateRiskReward()`, `calculatePositionSize()`, `rrRatio()`

## Key Design Decisions

- Adapted to existing project types (`CandlePattern.type: "BULLISH"|"BEARISH"|"NEUTRAL"`, `ChartFormation` with `targetPrice?`/`stopPrice?`)
- `shortTermTrend()` implemented locally in both pattern files since it's not in candle-utils
- Used `avgBodySize(bars, period, endIdx?)` with correct 2-3 argument signature
- Removed unused `atr` import from risk-reward.ts (ATR value is passed as parameter)
