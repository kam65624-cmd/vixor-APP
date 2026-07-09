// ============================================================================
// TradingView Ticker Tape Widget
// ============================================================================
//
// Horizontal scrolling price tape for crypto/forex pairs.
// Uses TradingView's hosted embed widget — no data costs.
//
// Usage:
//   <TradingViewTickerTape symbols={["BINANCE:BTCUSDT", "BINANCE:ETHUSDT"]} />
// ============================================================================

"use client";

import { useEffect, useRef, memo } from "react";

interface TradingViewTickerTapeProps {
  /** TradingView symbols e.g. ["BINANCE:BTCUSDT", "OANDA:XAUUSD"] */
  symbols?: string[];
  /** Color theme (default "dark") */
  theme?: "dark" | "light";
  /** Show symbol logo (default true) */
  showSymbolLogo?: boolean;
  /** Whether to use color theme based on "isTransparent" (default true) */
  isTransparent?: boolean;
  /** Display mode: "adaptive" auto-adjusts height on mobile */
  displayMode?: "adaptive" | "regular";
}

function TradingViewTickerTapeInner({
  symbols = [
    "BINANCE:BTCUSDT",
    "BINANCE:ETHUSDT",
    "BINANCE:SOLUSDT",
    "OANDA:XAUUSD",
    "FX:EURUSD",
    "FX:GBPJPY",
  ],
  theme = "dark",
  showSymbolLogo = true,
  isTransparent = true,
  displayMode = "adaptive",
}: TradingViewTickerTapeProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = "";

    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js";
    script.async = true;
    script.type = "text/javascript";

    script.textContent = JSON.stringify({
      symbols: symbols.map((s) => ({
        proName: s,
        title: s.replace(/^[A-Z]+:/, ""),
      })),
      showSymbolLogo,
      isTransparent,
      displayMode,
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
  }, [symbols, theme, showSymbolLogo, isTransparent, displayMode]);

  return <div ref={containerRef} style={{ width: "100%", overflow: "hidden" }} />;
}

export const TradingViewTickerTape = memo(TradingViewTickerTapeInner);
