// ============================================================================
// Vixor Market Snapshot — Real Data Builder for Grounded Analysis
// ============================================================================
//
// Builds a MarketSnapshot from REAL market data (Binance/TwelveData OHLCV)
// and mathematically computes all indicators. This snapshot is then injected
// into the AI prompt — the model NEVER receives vague descriptions, only
// concrete numbers derived from actual price action.
//
// CRITICAL RULE: If candleCount < 30, the caller MUST NOT send to OpenRouter.
// ============================================================================

import { fetchBinanceKlines, fetchTwelveDataKlines } from "@/domains/market/server/price-fetcher";
import { computeIndicators, type IndicatorResults } from "@/domains/analysis/engine/indicators";
import { AssetRegistry } from "@/shared/asset-registry";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MarketSnapshot {
  symbol: string;
  timeframe: string;
  currentPrice: number;
  ohlcv: {
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  indicators: {
    rsi14: number;
    macd: { value: number; signal: number; histogram: number };
    ema20: number;
    ema50: number;
    atr14: number;
    volumeAvg20: number;
  };
  dataQuality: {
    candleCount: number;
    lastUpdateSecondsAgo: number;
    source: "binance" | "twelveData" | "synthetic" | "none";
  };
}

// ---------------------------------------------------------------------------
// Build MarketSnapshot — fetches real OHLCV and computes indicators
// ---------------------------------------------------------------------------

export async function buildMarketSnapshot(
  pair: string,
  timeframe: string = "1H",
  minCandles: number = 50,
): Promise<MarketSnapshot> {
  const startTime = Date.now();
  let bars: Array<{
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }> = [];
  let source: "binance" | "twelveData" | "synthetic" | "none" = "none";

  // ── Source 1: Binance for crypto pairs ──
  const isCrypto =
    pair.includes("USDT") || pair.includes("BTC") || pair.includes("ETH") || pair.includes("SOL");

  if (isCrypto) {
    try {
      const klines = await fetchBinanceKlines(pair, timeframe, 200);
      if (klines.length >= minCandles) {
        bars = klines;
        source = "binance";
      }
    } catch (err) {
      console.warn(
        `[MarketSnapshot] Binance failed for ${pair}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── Source 2: TwelveData for forex/commodity ──
  if (bars.length < minCandles) {
    try {
      const klines = await fetchTwelveDataKlines(pair, timeframe, 200);
      if (klines.length >= minCandles) {
        bars = klines;
        source = "twelveData";
      }
    } catch (err) {
      console.warn(
        `[MarketSnapshot] TwelveData failed for ${pair}:`,
        err instanceof Error ? err.message : String(err),
      );
    }
  }

  // ── Source 3: Binance fallback for any pair ──
  if (bars.length < minCandles) {
    try {
      const klines = await fetchBinanceKlines(pair, timeframe, 200);
      if (klines.length >= 20) {
        bars = klines;
        source = "binance";
      }
    } catch {
      // Non-fatal
    }
  }

  // ── Source 4: TwelveData 1D as last resort ──
  if (bars.length < 20) {
    try {
      const klines = await fetchTwelveDataKlines(pair, "1D", 100);
      if (klines.length >= 20) {
        bars = klines;
        source = "twelveData";
      }
    } catch {
      // Non-fatal
    }
  }

  // ── Compute indicators from the OHLCV bars ──
  const ohlcvBars = bars.map((b) => ({
    timestamp: b.time,
    open: b.open,
    high: b.high,
    low: b.low,
    close: b.close,
    volume: b.volume,
  }));

  const currentPrice = bars.length > 0 ? bars[bars.length - 1]!.close : 0;

  // Compute all indicators via the existing indicator engine
  const indicators = bars.length >= 14 ? computeIndicators(ohlcvBars as any) : null;
  const last = bars.length - 1;

  // Extract latest values
  const rsi14 = indicators?.rsi[last] ?? NaN;
  const macdValue = indicators?.macd.macd[last] ?? NaN;
  const macdSignal = indicators?.macd.signal[last] ?? NaN;
  const macdHistogram = indicators?.macd.histogram[last] ?? NaN;
  const ema20 = indicators?.ema.ema21[last] ?? NaN; // Closest to EMA20
  const ema50 = indicators?.ema.ema50[last] ?? NaN;
  const atr14 = indicators?.atr[last] ?? NaN;

  // Volume average (last 20 candles)
  const volumeSlice = bars.slice(-20);
  const volumeAvg20 =
    volumeSlice.length > 0
      ? volumeSlice.reduce((sum, b) => sum + b.volume, 0) / volumeSlice.length
      : 0;

  return {
    symbol: pair,
    timeframe,
    currentPrice,
    ohlcv: ohlcvBars,
    indicators: {
      rsi14,
      macd: { value: macdValue, signal: macdSignal, histogram: macdHistogram },
      ema20,
      ema50,
      atr14,
      volumeAvg20,
    },
    dataQuality: {
      candleCount: bars.length,
      lastUpdateSecondsAgo: bars.length > 0 ? Math.round((Date.now() - startTime) / 1000) : 999999,
      source,
    },
  };
}

// ---------------------------------------------------------------------------
// Validate that a sourceField string actually exists in the snapshot
// ---------------------------------------------------------------------------

export function isValidSourceField(fieldPath: string, snapshot: MarketSnapshot): boolean {
  // Map of valid top-level field prefixes
  const validPrefixes: Record<string, string[]> = {
    ohlcv: ["ohlcv"],
    "indicators.rsi14": ["indicators", "rsi14"],
    "indicators.macd": ["indicators", "macd"],
    "indicators.macd.value": ["indicators", "macd", "value"],
    "indicators.macd.signal": ["indicators", "macd", "signal"],
    "indicators.macd.histogram": ["indicators", "macd", "histogram"],
    "indicators.ema20": ["indicators", "ema20"],
    "indicators.ema50": ["indicators", "ema50"],
    "indicators.atr14": ["indicators", "atr14"],
    "indicators.volumeAvg20": ["indicators", "volumeAvg20"],
    currentPrice: ["currentPrice"],
    dataQuality: ["dataQuality"],
    "dataQuality.candleCount": ["dataQuality", "candleCount"],
  };

  // Direct match or prefix match
  if (validPrefixes[fieldPath]) return true;

  // Check if any valid prefix is a prefix of the fieldPath
  return Object.keys(validPrefixes).some(
    (prefix) =>
      fieldPath.startsWith(prefix) &&
      (fieldPath.length === prefix.length || fieldPath[prefix.length] === "."),
  );
}

// ---------------------------------------------------------------------------
// Serialize snapshot for AI prompt (compact, no noise)
// ---------------------------------------------------------------------------

export function formatSnapshotForPrompt(snapshot: MarketSnapshot): string {
  const { symbol, timeframe, currentPrice, indicators, dataQuality } = snapshot;
  const bars = snapshot.ohlcv;

  // Only include the last 50 candles to keep prompt manageable
  const recentBars = bars.slice(-50);

  const ohlcvStr = recentBars
    .map(
      (b) =>
        `  {t:${b.timestamp}, o:${b.open}, h:${b.high}, l:${b.low}, c:${b.close}, v:${b.volume.toFixed(0)}}`,
    )
    .join(",\n");

  return `## Market Data: ${symbol} | ${timeframe}

### Data Quality
- candles: ${dataQuality.candleCount}
- source: ${dataQuality.source}
- currentPrice: ${currentPrice}

### OHLCV (last ${recentBars.length} bars)
[\n${ohlcvStr}\n]

### Computed Indicators
- RSI(14): ${indicators.rsi14.toFixed(2)}
- MACD: value=${indicators.macd.value.toFixed(4)}, signal=${indicators.macd.signal.toFixed(4)}, histogram=${indicators.macd.histogram.toFixed(4)}
- EMA(20): ${indicators.ema20.toFixed(2)}
- EMA(50): ${indicators.ema50.toFixed(2)}
- ATR(14): ${indicators.atr14.toFixed(2)}
- Volume Avg(20): ${indicators.volumeAvg20.toFixed(0)}`;
}
