// ============================================================================
// VIXOR DexChart — Native lightweight-charts for DEX/meme tokens
// ============================================================================
// Uses GeckoTerminal OHLCV data + lightweight-charts (same engine as TradingView).
// Replaces the blocked DexScreener iframe with a real interactive chart.
// ============================================================================

import { memo, useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getDexOHLCV } from "@/domains/market/functions";
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
  type DeepPartial,
  type ChartOptions,
} from "lightweight-charts";

interface DexChartProps {
  chainId: string;
  pairAddress: string;
  height?: string;
}

interface KlineBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const CHART_OPTIONS: DeepPartial<ChartOptions> = {
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

const INTERVALS = [
  { key: "minute", label: "1M" },
  { key: "5minute", label: "5M" },
  { key: "15minute", label: "15M" },
  { key: "hour", label: "1H" },
  { key: "4hour", label: "4H" },
  { key: "day", label: "1D" },
] as const;

function DexChartInner({ chainId, pairAddress, height = "400px" }: DexChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const [activeInterval, setActiveInterval] = useState("hour");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDexOHLCV = useStableServerFn(getDexOHLCV);

  // Initialize chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      ...CHART_OPTIONS,
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#0ECB81",
      downColor: "#F6465D",
      borderDownColor: "#F6465D",
      borderUpColor: "#0ECB81",
      wickDownColor: "#F6465D",
      wickUpColor: "#0ECB81",
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
    });
    chart.priceScale("volume").applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        chart.applyOptions({ width: w, height: h });
      }
    });
    observer.observe(containerRef.current);

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volRef.current = volumeSeries;

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volRef.current = null;
    };
  }, []);

  // Load data
  const loadData = useCallback(
    async (interval: string) => {
      if (!candleRef.current) return;
      setLoading(true);
      setError(null);

      try {
        const data: KlineBar[] = await fetchDexOHLCV({
          data: { chainId, pairAddress, interval, limit: 200 },
        });

        if (!data || data.length === 0) {
          setError("No chart data available");
          setLoading(false);
          return;
        }

        const candles: CandlestickData[] = data.map((k) => ({
          time: k.time as unknown as import("lightweight-charts").Time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
        }));

        const volumes: HistogramData[] = data.map((k) => ({
          time: k.time as unknown as import("lightweight-charts").Time,
          value: k.volume,
          color: k.close >= k.open ? "rgba(14,203,129,0.3)" : "rgba(246,70,93,0.3)",
        }));

        candleRef.current?.setData(candles);
        volRef.current?.setData(volumes);
        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        setError("Failed to load chart data");
      }
      setLoading(false);
    },
    [chainId, pairAddress, fetchDexOHLCV],
  );

  useEffect(() => {
    loadData(activeInterval);
  }, [activeInterval, loadData]);

  return (
    <div style={{ position: "relative", height, borderBottom: "1px solid var(--color-border)" }}>
      {/* Timeframe selector */}
      <div
        style={{
          position: "absolute",
          top: "8px",
          left: "8px",
          zIndex: 10,
          display: "flex",
          gap: "3px",
          background: "rgba(11,13,16,0.85)",
          padding: "3px",
          borderRadius: "6px",
          border: "1px solid var(--color-border)",
        }}
      >
        {INTERVALS.map((tf) => (
          <button
            key={tf.key}
            onClick={() => setActiveInterval(tf.key)}
            style={{
              padding: "3px 8px",
              borderRadius: "4px",
              border: "none",
              fontSize: "10px",
              fontWeight: activeInterval === tf.key ? 700 : 500,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: "pointer",
              background: activeInterval === tf.key ? "var(--color-primary)" : "transparent",
              color: activeInterval === tf.key ? "#000" : "var(--color-muted-foreground)",
              transition: "all 0.15s",
            }}
          >
            {tf.label}
          </button>
        ))}
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
          <span
            style={{
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              fontFamily: "'JetBrains Mono', monospace",
            }}
          >
            Loading chart...
          </span>
        </div>
      )}

      {/* Error overlay */}
      {error && !loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(11,13,16,0.9)",
            zIndex: 5,
            gap: "8px",
          }}
        >
          <span style={{ fontSize: "24px" }}>📊</span>
          <span
            style={{
              fontSize: "11px",
              color: "var(--color-muted-foreground)",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            {error}
          </span>
          <button
            onClick={() => loadData(activeInterval)}
            style={{
              padding: "5px 14px",
              borderRadius: "6px",
              border: "1px solid var(--color-border)",
              background: "var(--color-card)",
              color: "var(--color-foreground)",
              fontSize: "10px",
              cursor: "pointer",
              fontFamily: "'Inter', system-ui, sans-serif",
            }}
          >
            Retry
          </button>
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export const DexChart = memo(DexChartInner);
