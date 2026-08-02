// ============================================================================
// VIXOR DexChart — Native lightweight-charts for DEX/meme tokens
// ============================================================================
// Uses GeckoTerminal OHLCV data (server-side) + lightweight-charts.
// Features: candlesticks, volume, SMA/EMA/Bollinger overlays, RSI sub-chart,
// live price line, real-time candle updates.
// ============================================================================

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getDexOHLCV } from "@/domains/market/functions";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  CrosshairMode,
  LineStyle,
  type IChartApi,
  type ISeriesApi,
  type IPriceLine,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type DeepPartial,
  type ChartOptions,
  type Time,
  type LineWidth,
} from "lightweight-charts";

// ── Types ──

interface DexChartProps {
  chainId: string;
  pairAddress: string;
  height?: string;
  livePrice?: number | null;
}

interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ── Chart Options ──

const CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#0B0D10" },
    textColor: "#9CA3AF",
    fontSize: 11,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  grid: {
    vertLines: { color: "rgba(99,102,241,0.04)" },
    horzLines: { color: "rgba(99,102,241,0.04)" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "rgba(99,102,241,0.3)", labelBackgroundColor: "#6366F1" },
    horzLine: { color: "rgba(99,102,241,0.3)", labelBackgroundColor: "#6366F1" },
  },
  rightPriceScale: {
    borderColor: "rgba(99,102,241,0.08)",
    scaleMargins: { top: 0.05, bottom: 0.25 },
  },
  timeScale: {
    borderColor: "rgba(99,102,241,0.08)",
    timeVisible: true,
    rightOffset: 5,
    barSpacing: 8,
  },
  handleScroll: { vertTouchDrag: false },
};

// ── Timeframes & Networks ──

const INTERVALS = [
  { key: "minute", label: "1M" },
  { key: "5minute", label: "5M" },
  { key: "15minute", label: "15M" },
  { key: "hour", label: "1H" },
  { key: "4hour", label: "4H" },
  { key: "day", label: "1D" },
] as const;

const TF_MAP: Record<string, { tf: string; agg: number }> = {
  minute: { tf: "minute", agg: 1 },
  "5minute": { tf: "minute", agg: 5 },
  "15minute": { tf: "minute", agg: 15 },
  hour: { tf: "hour", agg: 1 },
  "4hour": { tf: "hour", agg: 4 },
  day: { tf: "day", agg: 1 },
};

const TF_WINDOW_SECS: Record<string, number> = {
  minute: 60,
  "5minute": 300,
  "15minute": 900,
  hour: 3600,
  "4hour": 14400,
  day: 86400,
};

const NETWORK_MAP: Record<string, string> = {
  ethereum: "eth",
  solana: "solana",
  base: "base",
  arbitrum: "arbitrum",
  polygon: "polygon_pos",
  bsc: "bsc",
  avalanche: "avax",
};

// ══════════════════════════════════════════════════════════════════════════
// Indicator Calculations
// ══════════════════════════════════════════════════════════════════════════

function calcSMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else {
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += closes[j];
      result.push(sum / period);
    }
  }
  return result;
}

function calcEMA(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  const k = 2 / (period + 1);
  let ema: number | null = null;
  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      result.push(null);
    } else if (ema === null) {
      // First EMA value = SMA of first `period` values
      let sum = 0;
      for (let j = i - period + 1; j <= i; j++) sum += closes[j];
      ema = sum / period;
      result.push(ema);
    } else {
      ema = closes[i] * k + ema * (1 - k);
      result.push(ema);
    }
  }
  return result;
}

function calcBollingerBands(
  closes: number[],
  period: number,
  stdMultiplier: number,
): { upper: (number | null)[]; middle: (number | null)[]; lower: (number | null)[] } {
  const middle = calcSMA(closes, period);
  const upper: (number | null)[] = [];
  const lower: (number | null)[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (middle[i] === null) {
      upper.push(null);
      lower.push(null);
      continue;
    }
    let sumSq = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sumSq += (closes[j] - middle[i]!) ** 2;
    }
    const std = Math.sqrt(sumSq / period);
    upper.push(middle[i]! + stdMultiplier * std);
    lower.push(middle[i]! - stdMultiplier * std);
  }

  return { upper, middle, lower };
}

function calcRSI(closes: number[], period: number): (number | null)[] {
  const result: (number | null)[] = [];
  if (closes.length < period + 1) return closes.map(() => null);

  let avgGain = 0;
  let avgLoss = 0;

  // First RSI: simple averages
  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = 0; i < closes.length; i++) {
    if (i < period) {
      result.push(null);
      continue;
    }
    if (i === period) {
      const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
      result.push(100 - 100 / (1 + rs));
      continue;
    }
    // Smoothed averages
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result.push(100 - 100 / (1 + rs));
  }

  return result;
}

// ══════════════════════════════════════════════════════════════════════════
// Component
// ══════════════════════════════════════════════════════════════════════════

function DexChartInner({ chainId, pairAddress, height = "400px", livePrice }: DexChartProps) {
  const mainContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const rsiSeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const priceLineRef = useRef<IPriceLine | null>(null);
  const lastBarRef = useRef<KlineBar | null>(null);
  const allBarsRef = useRef<KlineBar[]>([]);
  // Overlay series refs
  const overlayRefs = useRef<Record<string, ISeriesApi<"Line"> | null>>({
    sma7: null,
    sma25: null,
    sma99: null,
    ema21: null,
    bbUpper: null,
    bbMiddle: null,
    bbLower: null,
  });

  const [activeInterval, setActiveInterval] = useState("hour");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchDexOHLCV = useStableServerFn(getDexOHLCV);

  // ── Initialize main chart ──
  useEffect(() => {
    if (!mainContainerRef.current) return;

    const chart = createChart(mainContainerRef.current, {
      ...CHART_OPTIONS,
      width: mainContainerRef.current.clientWidth,
      height: mainContainerRef.current.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22D3A6",
      downColor: "#FB4667",
      borderDownColor: "#FB4667",
      borderUpColor: "#22D3A6",
      wickDownColor: "#FB4667",
      wickUpColor: "#22D3A6",
      lastValueVisible: true,
      priceLineVisible: false,
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    // Pre-create overlay line series (hidden by default)
    const createOverlay = (
      id: string,
      color: string,
      lineWidth: LineWidth = 1,
      lineStyle: LineStyle = LineStyle.Solid,
    ) => {
      const s = chart.addSeries(LineSeries, {
        color,
        lineWidth,
        lineStyle,
        priceLineVisible: false,
        lastValueVisible: true,
        pointMarkersVisible: false,
        visible: false,
      });
      overlayRefs.current[id] = s;
      return s;
    };
    createOverlay("sma7", "#FBBF24");
    createOverlay("sma25", "#3B82F6");
    createOverlay("sma99", "#F97316");
    createOverlay("ema21", "#A78BFA");
    createOverlay("bbUpper", "rgba(99,102,241,0.5)", 1, LineStyle.Dashed);
    createOverlay("bbMiddle", "rgba(99,102,241,0.3)", 1, LineStyle.Dotted);
    createOverlay("bbLower", "rgba(99,102,241,0.5)", 1, LineStyle.Dashed);

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        chart.applyOptions({ width: w, height: h });
      }
    });
    observer.observe(mainContainerRef.current);

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volRef.current = volumeSeries;

    // Sync time scale with RSI chart
    chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && rsiChartRef.current) {
        rsiChartRef.current.timeScale().setVisibleLogicalRange(range);
      }
    });

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
      priceLineRef.current = null;
      overlayRefs.current = {
        sma7: null,
        sma25: null,
        sma99: null,
        ema21: null,
        bbUpper: null,
        bbMiddle: null,
        bbLower: null,
      };
    };
  }, []);

  // ── Apply OHLCV data to chart ──
  const applyData = useCallback((bars: KlineBar[]) => {
    if (!candleRef.current || bars.length === 0) return;

    // Deduplicate by time, sort ascending
    const deduped = new Map<number, KlineBar>();
    for (const bar of bars) deduped.set(bar.time, bar);
    const sorted = Array.from(deduped.values()).sort((a, b) => a.time - b.time);

    allBarsRef.current = sorted;

    const candles: CandlestickData[] = sorted.map((k) => ({
      time: k.time as unknown as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    const volumes: HistogramData[] = sorted.map((k) => ({
      time: k.time as unknown as Time,
      value: k.volume,
      color: k.close >= k.open ? "rgba(34,211,166,0.3)" : "rgba(251,70,103,0.3)",
    }));

    candleRef.current?.setData(candles);
    volRef.current?.setData(volumes);
    chartRef.current?.timeScale().fitContent();

    // Store last bar
    lastBarRef.current = sorted[sorted.length - 1];

    // Price line
    const lastClose = sorted[sorted.length - 1].close;
    const prevClose = sorted.length > 1 ? sorted[sorted.length - 2].close : lastClose;
    if (priceLineRef.current && candleRef.current) {
      candleRef.current.removePriceLine(priceLineRef.current);
    }
    if (candleRef.current) {
      priceLineRef.current = candleRef.current.createPriceLine({
        price: lastClose,
        color: lastClose >= prevClose ? "#22D3A6" : "#FB4667",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "",
      });
    }

    // Apply indicators
    applyIndicators(sorted);
  }, []);

  // ── Calculate & apply indicators ──
  const applyIndicators = useCallback((sorted: KlineBar[]) => {
    if (sorted.length < 2) return;
    const closes = sorted.map((k) => k.close);
    const times = sorted.map((k) => k.time as unknown as Time);
    const refs = overlayRefs.current;

    // SMA 7
    if (refs.sma7) {
      const vals = calcSMA(closes, 7);
      refs.sma7.setData(
        vals
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
    }

    // SMA 25
    if (refs.sma25) {
      const vals = calcSMA(closes, 25);
      refs.sma25.setData(
        vals
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
    }

    // SMA 99
    if (refs.sma99) {
      const vals = calcSMA(closes, 99);
      refs.sma99.setData(
        vals
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
    }

    // EMA 21
    if (refs.ema21) {
      const vals = calcEMA(closes, 21);
      refs.ema21.setData(
        vals
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
    }

    // Bollinger Bands (20, 2)
    if (refs.bbUpper && refs.bbMiddle && refs.bbLower) {
      const bb = calcBollingerBands(closes, 20, 2);
      refs.bbUpper.setData(
        bb.upper
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
      refs.bbMiddle.setData(
        bb.middle
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
      refs.bbLower.setData(
        bb.lower
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
    }

    // RSI (14)
    if (rsiSeriesRef.current) {
      const rsiVals = calcRSI(closes, 14);
      rsiSeriesRef.current.setData(
        rsiVals
          .map((v, i) => (v !== null ? { time: times[i], value: v } : null))
          .filter(Boolean) as LineData[],
      );
      rsiChartRef.current?.timeScale().fitContent();
    }
  }, []);

  // ── Live price update ──
  useEffect(() => {
    if (!livePrice || livePrice <= 0 || !candleRef.current || !lastBarRef.current) return;

    const lastBar = lastBarRef.current;
    const windowSecs = TF_WINDOW_SECS[activeInterval] || 3600;
    const now = Math.floor(Date.now() / 1000);
    const currentCandleStart = Math.floor(now / windowSecs) * windowSecs;

    const updated: CandlestickData = {
      time: lastBar.time as unknown as Time,
      open: lastBar.open,
      high: Math.max(lastBar.high, livePrice),
      low: Math.min(lastBar.low, livePrice),
      close: livePrice,
    };
    candleRef.current.update(updated);
    lastBarRef.current = {
      ...lastBar,
      high: Math.max(lastBar.high, livePrice),
      low: Math.min(lastBar.low, livePrice),
      close: livePrice,
    };

    // Update price line
    if (priceLineRef.current && candleRef.current) {
      const isUp = livePrice >= lastBar.open;
      try {
        candleRef.current.removePriceLine(priceLineRef.current);
      } catch {
        /* */
      }
      priceLineRef.current = candleRef.current.createPriceLine({
        price: livePrice,
        color: isUp ? "#22D3A6" : "#FB4667",
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: "",
      });
    }
  }, [livePrice, activeInterval]);

  // ── Load OHLCV data ──
  const loadData = useCallback(
    async (intervalKey: string) => {
      if (!candleRef.current) return;
      setLoading(true);
      setError(null);

      const cfg = TF_MAP[intervalKey] || { tf: "hour", agg: 1 };
      let bars: KlineBar[] = [];

      // Strategy 1: Server-side fetch
      try {
        const serverBars: any = await fetchDexOHLCV({
          data: { chainId, pairAddress, interval: cfg.tf, limit: 200, aggregate: cfg.agg },
        });
        if (Array.isArray(serverBars) && serverBars.length > 0) {
          bars = serverBars.map((b: any) => ({
            time: b.time,
            open: b.open,
            high: b.high,
            low: b.low,
            close: b.close,
            volume: b.volume || 0,
          }));
        }
      } catch (e) {
        console.warn("[DexChart] Server OHLCV failed, trying direct fetch:", e);
      }

      // Strategy 2: Direct client-side fetch
      if (bars.length === 0) {
        try {
          const network = NETWORK_MAP[chainId.toLowerCase()] || chainId.toLowerCase();
          const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}/ohlcv/${cfg.tf}?aggregate=${cfg.agg}&limit=200`;
          const res = await fetch(url, { headers: { Accept: "application/json" } });
          if (res.ok) {
            const json = await res.json();
            const raw = json?.data;
            if (raw?.attributes?.ohlcv_list && Array.isArray(raw.attributes.ohlcv_list)) {
              bars = raw.attributes.ohlcv_list.map((c: any) => ({
                time: c[0],
                open: c[1],
                high: c[2],
                low: c[3],
                close: c[4],
                volume: c[5] || 0,
              }));
            } else if (Array.isArray(raw) && raw.length > 0) {
              bars = raw.map((c: any) => ({
                time: c.attributes.time,
                open: c.attributes.open,
                high: c.attributes.high,
                low: c.attributes.low,
                close: c.attributes.close,
                volume: c.attributes.volume || 0,
              }));
            }
          }
        } catch (e) {
          console.warn("[DexChart] Direct GeckoTerminal fetch failed:", e);
        }
      }

      if (bars.length === 0) {
        setError("no_data");
      } else {
        applyData(bars);
      }
      setLoading(false);
    },
    [chainId, pairAddress, fetchDexOHLCV, applyData],
  );

  useEffect(() => {
    loadData(activeInterval);
  }, [activeInterval, loadData]);

  // ── Indicator label color helper ──
  const btnStyle = (active: boolean, color: string): React.CSSProperties => ({
    padding: "2px 6px",
    borderRadius: "3px",
    border: "none",
    fontSize: "9px",
    fontWeight: 600,
    fontFamily: "system-ui, sans-serif",
    cursor: "pointer",
    background: active ? color : "transparent",
    color: active ? "#000" : "#6B7280",
    transition: "all 0.15s",
    opacity: active ? 1 : 0.7,
  });

  // ── Render ──
  return (
    <div style={{ position: "relative", height, borderBottom: "1px solid var(--color-border)" }}>
      {/* Toolbar: Timeframes */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {/* Timeframes */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            background: "rgba(11,13,16,0.9)",
            padding: "3px",
            borderRadius: "6px",
            border: "1px solid var(--color-border)",
          }}
        >
          {INTERVALS.map((tf) => (
            <button
              key={tf.key}
              onClick={() => setActiveInterval(tf.key)}
              style={btnStyle(activeInterval === tf.key, "#6366F1")}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11,13,16,0.7)",
            zIndex: 5,
          }}
        >
          <span style={{ fontSize: "12px", color: "#9CA3AF", fontFamily: "system-ui" }}>
            Loading chart...
          </span>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#0B0D10",
            zIndex: 10,
            gap: "10px",
          }}
        >
          <svg
            style={{ width: 36, height: 36, opacity: 0.35 }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"
            />
          </svg>
          <div style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 600 }}>
            Chart data unavailable
          </div>
          <button
            onClick={() => loadData(activeInterval)}
            style={{
              fontSize: "11px",
              color: "#6366F1",
              background: "none",
              border: "1px solid #6366F1",
              borderRadius: "6px",
              padding: "6px 14px",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Main chart container */}
      <div ref={mainContainerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export const DexChart = memo(DexChartInner);
