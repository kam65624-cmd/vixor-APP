// ============================================================================
// TradingView Mini Symbol Overview Widget
// ============================================================================
//
// Compact card with sparkline chart + price for a single trading pair.
// Uses TradingView's hosted embed widget.
//
// Usage:
//   <TradingViewMiniChart symbol="BINANCE:BTCUSDT" />
// ============================================================================

"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewMiniChartProps {
  /** TradingView symbol e.g. "BINANCE:BTCUSDT" */
  symbol: string;
  /** Color theme (default "dark") */
  theme?: "dark" | "light";
  /** Width in pixels (default 100%) */
  width?: number | string;
  /** Height in pixels (default 120) */
  height?: number;
}

function TradingViewMiniChartInner({
  symbol,
  theme = "dark",
  width = "100%",
  height = 120,
}: TradingViewMiniChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const script = document.createElement("script");
    script.src =
      "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbol,
      width: typeof width === "number" ? width : undefined,
      height,
      isTransparent: true,
      colorTheme: theme,
      locale: "en",
      dateRange: "1D",
      color: theme === "dark" ? "rgba(124,155,196,1)" : "rgba(90,127,166,1)",
      trendLineColor: "rgba(124,155,196,1)",
      isWidget: true,
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container.contains(widgetContainer)) {
        container.innerHTML = "";
      }
    };
  }, [symbol, theme, width, height]);

  return (
    <div
      ref={containerRef}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: `${height}px`,
        overflow: "hidden",
        borderRadius: "var(--radius-lg)",
      }}
    />
  );
}

export const TradingViewMiniChart = memo(TradingViewMiniChartInner);
