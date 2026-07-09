// ============================================================================
// VIXOR Candlestick Chart — lightweight-charts v5.2
// ============================================================================
//
// Native candlestick chart using TradingView's lightweight-charts library.
// Replaces/supplements the TradingView iframe embed with a proper DOM-integrated
// chart that supports real-time updates, custom styling, and zero external iframes.
//
// Usage:
//   <CandlestickChart pair="BTC/USDT" interval="1H" height="400px" />
// ============================================================================

"use client";

import { useEffect, useRef, memo, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getChartOHLCV } from "@/domains/market/functions";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type Time,
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";

// ── Types ──

export interface KlineBar {
  time: number; // Unix seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  /** Trading pair e.g. "BTC/USDT" */
  pair: string;
  /** Timeframe: "1M" | "5M" | "15M" | "1H" | "4H" | "1D" | "1W" */
  interval?: string;
  /** CSS height (default "400px") */
  height?: string;
  /** Show volume sub-chart (default true) */
  showVolume?: boolean;
  /** Initial OHLCV data (if available client-side) */
  initialData?: KlineBar[];
  /** Callback when timeframe changes */
  onIntervalChange?: (interval: string) => void;
}

// ── Chart Options ──

const VIXOR_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: { type: ColorType.Solid, color: "#0B0D10" },
    textColor: "#9CA3AF",
    fontSize: 11,
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
  },
  grid: {
    vertLines: { color: "rgba(124,155,196,0.04)" },
    horzLines: { color: "rgba(124,155,196,0.04)" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "rgba(124,155,196,0.3)", labelBackgroundColor: "#7C9BC4" },
    horzLine: { color: "rgba(124,155,196,0.3)", labelBackgroundColor: "#7C9BC4" },
  },
  rightPriceScale: {
    borderColor: "rgba(124,155,196,0.08)",
    scaleMargins: { top: 0.05, bottom: 0.25 },
  },
  timeScale: {
    borderColor: "rgba(124,155,196,0.08)",
    timeVisible: true,
    rightOffset: 5,
    barSpacing: 8,
  },
  handleScroll: { vertTouchDrag: false },
};

const TIMEFRAMES = ["1M", "5M", "15M", "1H", "4H", "1D", "1W"] as const;

// ── Component ──

function CandlestickChartInner({
  pair,
  interval = "1H",
  height = "400px",
  showVolume = true,
  initialData,
  onIntervalChange,
}: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [activeInterval, setActiveInterval] = useState(interval);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ohlcValues, setOhlcValues] = useState<{
    o: number;
    h: number;
    l: number;
    c: number;
  } | null>(null);

  // ── Initialize Chart ──
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...VIXOR_CHART_OPTIONS,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    // Candlestick series (main)
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#0ECB81",
      downColor: "#F6465D",
      borderDownColor: "#F6465D",
      borderUpColor: "#0ECB81",
      wickDownColor: "#F6465D",
      wickUpColor: "#0ECB81",
    });

    // Volume series (sub-chart)
    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });

      chart.priceScale("volume").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
    }

    // Crosshair move handler — show OHLCV tooltip
    chart.subscribeCrosshairMove((param) => {
      if (param.time) {
        const candleData = param.seriesData.get(candleSeries) as CandlestickData | undefined;
        if (candleData) {
          setOhlcValues({
            o: candleData.open,
            h: candleData.high,
            l: candleData.low,
            c: candleData.close,
          });
        }
      } else {
        setOhlcValues(null);
      }
    });

    // Resize observer
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height: h } = entry.contentRect;
        chart.applyOptions({ width, height: h });
      }
    });
    observer.observe(containerRef.current);

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showVolume]);

  // ── Load Data ──
  const loadOHLCV = useCallback(
    async (tf: string) => {
      if (!candleSeriesRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const data: KlineBar[] = await getChartOHLCV({ data: { pair, interval: tf, limit: 300 } });

        if (!data || data.length === 0) {
          setError("No chart data available");
          return;
        }

        // Convert to lightweight-charts format
        const candles: CandlestickData[] = data.map((k) => ({
          time: k.time as Time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
        }));

        const volume: HistogramData[] = data.map((k) => ({
          time: k.time as Time,
          value: k.volume,
          color: k.close >= k.open ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)",
        }));

        candleSeriesRef.current!.setData(candles);
        if (volumeSeriesRef.current && showVolume) {
          volumeSeriesRef.current!.setData(volume);
        }

        chartRef.current?.timeScale().fitContent();
      } catch (err: any) {
        console.error("[CandlestickChart] Failed to load data:", err);
        setError(err.message || "Failed to load chart data");
      } finally {
        setLoading(false);
      }
    },
    [pair, showVolume],
  );

  // Load on mount or when initialData changes
  useEffect(() => {
    if (initialData && candleSeriesRef.current) {
      const candles: CandlestickData[] = initialData.map((k) => ({
        time: k.time as Time,
        open: k.open,
        high: k.high,
        low: k.low,
        close: k.close,
      }));

      const volume: HistogramData[] = initialData.map((k) => ({
        time: k.time as Time,
        value: k.volume,
        color: k.close >= k.open ? "rgba(14,203,129,0.25)" : "rgba(246,70,93,0.25)",
      }));

      candleSeriesRef.current!.setData(candles);
      if (volumeSeriesRef.current && showVolume) {
        volumeSeriesRef.current!.setData(volume);
      }
      chartRef.current?.timeScale().fitContent();
      setLoading(false);
    } else {
      loadOHLCV(activeInterval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pair]);

  // ── Timeframe Handler ──
  const handleIntervalChange = useCallback(
    (tf: string) => {
      setActiveInterval(tf);
      onIntervalChange?.(tf);
      loadOHLCV(tf);
    },
    [loadOHLCV, onIntervalChange],
  );

  // ── Render ──
  const fmt = (n: number) =>
    n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Timeframe selector + OHLCV info bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 8px",
          borderBottom: "0.5px solid rgba(124,155,196,0.08)",
          background: "rgba(124,155,196,0.02)",
          flexShrink: 0,
          gap: "4px",
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        {/* Timeframe buttons */}
        <div style={{ display: "flex", gap: "2px" }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => handleIntervalChange(tf)}
              style={{
                fontSize: "10px",
                fontWeight: activeInterval === tf ? 700 : 500,
                padding: "3px 8px",
                borderRadius: "4px",
                border: "none",
                cursor: "pointer",
                color:
                  activeInterval === tf
                    ? "var(--color-foreground)"
                    : "var(--color-muted-foreground)",
                background: activeInterval === tf ? "rgba(124,155,196,0.12)" : "transparent",
                whiteSpace: "nowrap",
                transition: "all 0.1s ease",
              }}
            >
              {tf}
            </button>
          ))}
        </div>

        {/* OHLCV values */}
        {ohlcValues && (
          <div
            style={{
              display: "flex",
              gap: "10px",
              fontSize: "10px",
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              color: "var(--color-muted-foreground)",
              flexShrink: 0,
            }}
          >
            <span>
              O{" "}
              <span style={{ color: "var(--color-foreground)", fontWeight: 600 }}>
                {fmt(ohlcValues.o)}
              </span>
            </span>
            <span>
              H{" "}
              <span style={{ color: "var(--color-bullish)", fontWeight: 600 }}>
                {fmt(ohlcValues.h)}
              </span>
            </span>
            <span>
              L{" "}
              <span style={{ color: "var(--color-bearish)", fontWeight: 600 }}>
                {fmt(ohlcValues.l)}
              </span>
            </span>
            <span>
              C{" "}
              <span
                style={{
                  color:
                    ohlcValues.c >= ohlcValues.o ? "var(--color-bullish)" : "var(--color-bearish)",
                  fontWeight: 600,
                }}
              >
                {fmt(ohlcValues.c)}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height,
          position: "relative",
          background: "#0B0D10",
          borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
        }}
      >
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
              zIndex: 10,
              borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            }}
          >
            <div
              style={{
                width: "24px",
                height: "24px",
                border: "2px solid rgba(124,155,196,0.15)",
                borderTopColor: "var(--color-primary)",
                borderRadius: "50%",
                animation: "spin 0.7s linear infinite",
              }}
            />
          </div>
        )}

        {/* Error state */}
        {error && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(11,13,16,0.85)",
              zIndex: 10,
              borderRadius: "0 0 var(--radius-lg) var(--radius-lg)",
            }}
          >
            <div style={{ textAlign: "center", padding: "16px" }}>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--color-muted-foreground)",
                  marginBottom: "8px",
                }}
              >
                {error}
              </div>
              <button
                onClick={() => loadOHLCV(activeInterval)}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  padding: "6px 16px",
                  borderRadius: "6px",
                  border: "0.5px solid var(--color-border)",
                  background: "var(--color-primary)",
                  color: "var(--color-background)",
                  cursor: "pointer",
                }}
              >
                Retry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export const CandlestickChart = memo(CandlestickChartInner);
