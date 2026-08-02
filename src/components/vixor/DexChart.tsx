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
    background: { type: ColorType.Solid, color: "var(--color-background)" },
    textColor: "#9CA3AF",
    fontSize: 11,
    fontFamily: "var(--font-sans)",
  },
  grid: {
    vertLines: { color: "rgba(99,102,241,0.04)" },
    horzLines: { color: "rgba(99,102,241,0.04)" },
  },
  crosshair: {
    mode: CrosshairMode.Normal,
    vertLine: { color: "rgba(99,102,241,0.3)", labelBackgroundColor: "var(--color-primary)" },
    horzLine: { color: "rgba(99,102,241,0.3)", labelBackgroundColor: "var(--color-primary)" },
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
      upColor: "var(--color-bullish)",
      downColor: "var(--color-bearish)",
      borderDownColor: "var(--color-bearish)",
      borderUpColor: "var(--color-bullish)",
      wickDownColor: "var(--color-bearish)",
      wickUpColor: "var(--color-bullish)",
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

  // Load data via direct GeckoTerminal CORS API with proper aggregate parameters
  const loadData = useCallback(
    async (intervalKey: string) => {
      if (!candleRef.current) return;
      setLoading(true);
      setError(null);

      try {
        // GeckoTerminal v2 network IDs (verified against /api/v2/networks)
        const networkMap: Record<string, string> = {
          ethereum: "eth",
          solana: "solana",
          base: "base",
          arbitrum: "arbitrum",
          polygon: "polygon_pos",
          bsc: "bsc",
          avalanche: "avax",
        };
        const network = networkMap[chainId.toLowerCase()] || chainId.toLowerCase();

        const tfMap: Record<string, { tf: string; agg: number }> = {
          minute: { tf: "minute", agg: 1 },
          "5minute": { tf: "minute", agg: 5 },
          "15minute": { tf: "minute", agg: 15 },
          hour: { tf: "hour", agg: 1 },
          "4hour": { tf: "hour", agg: 4 },
          day: { tf: "day", agg: 1 },
        };
        const cfg = tfMap[intervalKey] || { tf: "hour", agg: 1 };

        const url = `https://api.geckoterminal.com/api/v2/networks/${network}/pools/${pairAddress}/ohlcv/${cfg.tf}?aggregate=${cfg.agg}&limit=200`;

        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error("GeckoTerminal API non-200");

        const json = await res.json();

        // GeckoTerminal v2 returns { data: { attributes: { ohlcv_list: [[t,o,h,l,c,v], ...] } } }
        // Handle both old format (data = array of objects) and new format (data.attributes.ohlcv_list = array of arrays)
        let data: KlineBar[] = [];
        const rawBars = json?.data;

        if (Array.isArray(rawBars) && rawBars.length > 0) {
          // Legacy format: data is an array of { attributes: { time, open, ... } }
          data = rawBars
            .map((c: any) => ({
              time: c.attributes.time,
              open: c.attributes.open,
              high: c.attributes.high,
              low: c.attributes.low,
              close: c.attributes.close,
              volume: c.attributes.volume || 0,
            }))
            .sort((a: any, b: any) => a.time - b.time);
        } else if (rawBars?.attributes?.ohlcv_list && Array.isArray(rawBars.attributes.ohlcv_list)) {
          // Current format: data.attributes.ohlcv_list is [[t, o, h, l, c, v], ...]
          data = rawBars.attributes.ohlcv_list
            .map((c: any) => ({
              time: c[0],
              open: c[1],
              high: c[2],
              low: c[3],
              close: c[4],
              volume: c[5] || 0,
            }))
            .sort((a: any, b: any) => a.time - b.time);
        } else {
          throw new Error("No GeckoTerminal bars");
        }

        // Deduplicate by time (keep last) and sort ascending
        const deduped = new Map<number, KlineBar>();
        for (const bar of data) {
          deduped.set(bar.time, bar);
        }
        const sorted = Array.from(deduped.values()).sort((a, b) => a.time - b.time);

        const candles: CandlestickData[] = sorted.map((k) => ({
          time: k.time as unknown as import("lightweight-charts").Time,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
        }));

        const volumes: HistogramData[] = sorted.map((k) => ({
          time: k.time as unknown as import("lightweight-charts").Time,
          value: k.volume,
          color: k.close >= k.open ? "rgba(34,211,166,0.3)" : "rgba(251,70,103,0.3)",
        }));

        candleRef.current?.setData(candles);
        volRef.current?.setData(volumes);
        chartRef.current?.timeScale().fitContent();
      } catch (err) {
        // Fallback to DexScreener iframe embed when GeckoTerminal data is unavailable
        setError("fallback");
      }
      setLoading(false);
    },
    [chainId, pairAddress],
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
              fontFamily: "var(--font-mono)",
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
              fontFamily: "var(--font-mono)",
            }}
          >
            Loading chart...
          </span>
        </div>
      )}

      {/* Error / Fallback — DexScreener iframes are blocked in Telegram WebView (X-Frame-Options),
          so we show a proper error state with a link to DexScreener instead */}
      {error && !loading && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--color-background)",
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
          <div style={{ fontSize: "12px", color: "var(--color-muted-foreground)", fontWeight: 600 }}>
            Chart data unavailable
          </div>
          <a
            href={`https://dexscreener.com/${chainId}/${pairAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: "11px",
              color: "var(--color-primary)",
              textDecoration: "none",
              fontWeight: 600,
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid var(--color-primary)",
              background: "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            }}
          >
            View on DexScreener →
          </a>
        </div>
      )}

      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}

export const DexChart = memo(DexChartInner);
