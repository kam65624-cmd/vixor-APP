/**
 * VIXOR — React Candlestick Chart
 * =================================
 * Thin React wrapper around `lightweight-charts` v5.
 * Renders OHLCV candlesticks with optional volume overlay.
 *
 * Usage:
 *   <CandlestickChartReact
 *     bars={ohlcvBars}
 *     height={320}
 *     showVolume
 *   />
 *
 * Data contract:
 *   - bars: OHLCVBar[] from @/domains/analysis/engine/core/types
 *   - time, open, high, low, close, volume all required
 *
 * Behavior:
 *   - Auto-fits to container width (ResizeObserver)
 *   - Dark-theme aware (reads CSS custom properties)
 *   - Gracefully renders empty state if bars.length === 0
 */

import { useEffect, useRef } from "react";
import {
  createChart,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type HistogramData,
  type UTCTimestamp,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import type { OHLCVBar } from "@/domains/analysis/engine/core/types";
import { BarChart3, Loader2 } from "lucide-react";

export interface CandlestickChartReactProps {
  bars: OHLCVBar[];
  height?: number;
  showVolume?: boolean;
  className?: string;
  /** Show last N bars (default: all) */
  visibleCount?: number;
}

const FALLBACK_COLORS = {
  background: "transparent",
  text: "#9CA3AF",
  bullish: "#10B981",
  bearish: "#EF4444",
  grid: "rgba(156, 163, 175, 0.1)",
  border: "rgba(156, 163, 175, 0.2)",
  volume: "rgba(107, 114, 128, 0.4)",
} as const;

function readThemeColor(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  return raw?.trim() || fallback;
}

export function CandlestickChartReact({
  bars,
  height = 320,
  showVolume = true,
  className,
  visibleCount,
}: CandlestickChartReactProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);

  // ── Build chart once on mount ────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const chart = createChart(el, {
      layout: {
        background: { type: ColorType.Solid, color: FALLBACK_COLORS.background },
        textColor: readThemeColor("--color-foreground", FALLBACK_COLORS.text),
        fontSize: 11,
        attributionLogo: false,
      },
      width: el.clientWidth,
      height,
      grid: {
        vertLines: { color: FALLBACK_COLORS.grid, style: LineStyle.Dotted },
        horzLines: { color: FALLBACK_COLORS.grid, style: LineStyle.Dotted },
      },
      rightPriceScale: { borderColor: FALLBACK_COLORS.border },
      timeScale: {
        borderColor: FALLBACK_COLORS.border,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: FALLBACK_COLORS.border, style: LineStyle.Dashed },
        horzLine: { color: FALLBACK_COLORS.border, style: LineStyle.Dashed },
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: readThemeColor("--color-bullish", FALLBACK_COLORS.bullish),
      downColor: readThemeColor("--color-bearish", FALLBACK_COLORS.bearish),
      borderUpColor: readThemeColor("--color-bullish", FALLBACK_COLORS.bullish),
      borderDownColor: readThemeColor("--color-bearish", FALLBACK_COLORS.bearish),
      wickUpColor: readThemeColor("--color-bullish", FALLBACK_COLORS.bullish),
      wickDownColor: readThemeColor("--color-bearish", FALLBACK_COLORS.bearish),
    });
    candleSeriesRef.current = candleSeries;

    let volumeSeries: ISeriesApi<"Histogram"> | null = null;
    if (showVolume) {
      volumeSeries = chart.addSeries(HistogramSeries, {
        color: FALLBACK_COLORS.volume,
        priceFormat: { type: "volume" },
        priceScaleId: "volume_scale",
      });
      chart.priceScale("volume_scale").applyOptions({
        scaleMargins: { top: 0.8, bottom: 0 },
      });
      volumeSeriesRef.current = volumeSeries;
    }

    chartRef.current = chart;

    // ── Resize observer ──────────────────────────────────────────────
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        chart.applyOptions({ width: Math.floor(entry.contentRect.width) });
      }
    });
    ro.observe(el);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
    };
  }, [height, showVolume]);

  // ── Update data when bars change ─────────────────────────────────────
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (!bars || bars.length === 0) {
      candleSeriesRef.current.setData([]);
      volumeSeriesRef.current?.setData([]);
      return;
    }

    const sliced = visibleCount && visibleCount < bars.length ? bars.slice(-visibleCount) : bars;

    const candleData: CandlestickData[] = sliced.map((b) => ({
      time: (b.time / 1000) as UTCTimestamp,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
    }));

    candleSeriesRef.current.setData(candleData);

    if (volumeSeriesRef.current && showVolume) {
      const volumeData: HistogramData[] = sliced.map((b) => ({
        time: (b.time / 1000) as UTCTimestamp,
        value: b.volume,
        color: b.close >= b.open ? `${FALLBACK_COLORS.bullish}66` : `${FALLBACK_COLORS.bearish}66`,
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    chartRef.current?.timeScale().fitContent();
  }, [bars, visibleCount, showVolume]);

  // ── Empty state ──────────────────────────────────────────────────────
  if (!bars || bars.length === 0) {
    return (
      <div
        className={className}
        style={{
          height,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          color: "var(--color-muted-foreground)",
          background: "var(--color-card)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
        }}
      >
        <BarChart3 size={28} style={{ opacity: 0.5 }} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>No chart data</span>
        <span style={{ fontSize: 10, opacity: 0.7 }}>
          Enter a token to fetch OHLCV from Binance
        </span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        height,
        width: "100%",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        overflow: "hidden",
        position: "relative",
      }}
    />
  );
}

/** Loading skeleton for the chart while bars are being fetched */
export function CandlestickChartSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      style={{
        height,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        color: "var(--color-muted-foreground)",
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
      }}
    >
      <Loader2 size={20} className="animate-spin" />
      <span style={{ fontSize: 12, fontWeight: 600 }}>Loading klines…</span>
    </div>
  );
}
