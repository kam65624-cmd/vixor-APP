// ============================================================================
// TradingView Technical Analysis Widget
// ============================================================================
//
// Gauge showing Buy/Sell/Neutral based on moving averages & oscillators.
// Uses TradingView's hosted embed widget.
//
// Usage:
//   <TradingViewTechAnalysis symbol="BINANCE:BTCUSDT" />
// ============================================================================

"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewTechAnalysisProps {
  /** TradingView symbol e.g. "BINANCE:BTCUSDT" */
  symbol: string;
  /** Color theme (default "dark") */
  theme?: "dark" | "light";
  /** Width in pixels (default "100%") */
  width?: number | string;
  /** Whether transparent (default true) */
  isTransparent?: boolean;
}

function TradingViewTechAnalysisInner({
  symbol,
  theme = "dark",
  width = "100%",
  isTransparent = true,
}: TradingViewTechAnalysisProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-technical-analysis.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      interval: "1h",
      width: typeof width === "number" ? width : undefined,
      isTransparent,
      height: 400,
      symbol,
      showIntervalTabs: true,
      colorTheme: theme,
      locale: "en",
    });

    widgetContainer.appendChild(script);
    container.appendChild(widgetContainer);

    return () => {
      if (container.contains(widgetContainer)) {
        container.innerHTML = "";
      }
    };
  }, [symbol, theme, width, isTransparent]);

  return (
    <div
      ref={containerRef}
      style={{ width: typeof width === "number" ? `${width}px` : width, overflow: "hidden" }}
    />
  );
}

export const TradingViewTechAnalysis = memo(TradingViewTechAnalysisInner);
