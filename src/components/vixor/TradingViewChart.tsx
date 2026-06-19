"use client";

import { useEffect, useRef, memo, useCallback, useState } from "react";

// Symbol mapping: user-friendly pair names to TradingView symbols
export const SYMBOL_MAP: Record<string, string> = {
  "BTC/USDT": "BINANCE:BTCUSDT",
  "ETH/USDT": "BINANCE:ETHUSDT",
  "XAU/USD": "OANDA:XAUUSD",
  "EUR/USD": "FX:EURUSD",
  "GBP/JPY": "FX:GBPJPY",
  "SOL/USDT": "BINANCE:SOLUSDT",
  "BTC/USD": "BITSTAMP:BTCUSD",
  "ETH/USD": "BITSTAMP:ETHUSD",
  "GBP/USD": "FX:GBPUSD",
  "USD/JPY": "FX:USDJPY",
  "AUD/USD": "FX:AUDUSD",
  "NZD/USD": "FX:NZDUSD",
  "USD/CAD": "FX:USDCAD",
  "USD/CHF": "FX:USDCHF",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  SPX500: "SP:SPX",
  NASDAQ: "NASDAQ:NDX",
};

// Reverse map for display
export function getDisplayPair(symbol: string): string {
  for (const [pair, sym] of Object.entries(SYMBOL_MAP)) {
    if (sym === symbol) return pair;
  }
  return symbol.replace(/^[A-Z]+:/, "");
}

export function toTradingViewSymbol(pair: string): string {
  return SYMBOL_MAP[pair] || pair;
}

// Pair display name mapping
export const PAIR_DISPLAY_NAMES: Record<string, string> = {
  "BTC/USDT": "Bitcoin / Tether",
  "ETH/USDT": "Ethereum / Tether",
  "XAU/USD": "Gold Spot / U.S. Dollar",
  "EUR/USD": "Euro / U.S. Dollar",
  "GBP/JPY": "British Pound / Japanese Yen",
  "SOL/USDT": "Solana / Tether",
  "BTC/USD": "Bitcoin / U.S. Dollar",
  "ETH/USD": "Ethereum / U.S. Dollar",
  "GBP/USD": "British Pound / U.S. Dollar",
  "USD/JPY": "U.S. Dollar / Japanese Yen",
  "AUD/USD": "Australian Dollar / U.S. Dollar",
  "NZD/USD": "New Zealand Dollar / U.S. Dollar",
  "USD/CAD": "U.S. Dollar / Canadian Dollar",
  "USD/CHF": "U.S. Dollar / Swiss Franc",
  AAPL: "Apple Inc.",
  TSLA: "Tesla Inc.",
  SPX500: "S&P 500 Index",
  NASDAQ: "NASDAQ Composite",
};

// Interval mapping for TradingView
export const INTERVAL_MAP: Record<string, string> = {
  "1M": "1",
  "5M": "5",
  "15M": "15",
  "30M": "30",
  "1H": "60",
  "4H": "240",
  "1D": "D",
  "1W": "W",
};

interface TradingViewChartProps {
  symbol: string; // TradingView symbol like "BINANCE:BTCUSDT"
  interval?: string;
  theme?: "dark" | "light";
  height?: string;
  onIntervalChange?: (interval: string) => void;
  chartContainerRef?: React.RefObject<HTMLDivElement | null>;
}

function TradingViewChartInner({
  symbol,
  interval = "240",
  theme = "dark",
  height = "65vh",
  onIntervalChange,
  chartContainerRef,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync the internal ref to the external ref for screenshot capture
  useEffect(() => {
    if (chartContainerRef && "current" in chartContainerRef) {
      (chartContainerRef as React.MutableRefObject<HTMLDivElement | null>).current =
        containerRef.current;
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    setHasError(false);
    setIsLoaded(false);

    // Clean up any existing content
    const container = containerRef.current;
    container.innerHTML = "";

    // Create a unique container ID for the widget
    const widgetId = `tv_widget_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    // Build the widget container structure
    const widgetContainer = document.createElement("div");
    widgetContainer.className = "tradingview-widget-container";
    widgetContainer.style.height = "100%";
    widgetContainer.style.width = "100%";

    const widgetDiv = document.createElement("div");
    widgetDiv.id = widgetId;
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    widgetContainer.appendChild(widgetDiv);
    container.appendChild(widgetContainer);

    // Create the embed script for the TradingView Advanced Chart Widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.type = "text/javascript";

    const config = {
      autosize: true,
      symbol: symbol,
      interval: interval,
      timezone: "Etc/UTC",
      theme: theme,
      style: "1",
      locale: "en",
      enable_publishing: false,
      allow_symbol_change: true,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: "rgba(15, 17, 23, 1)",
      gridColor: "rgba(255, 255, 255, 0.03)",
      withdateranges: true,
      details: true,
      hotlist: false,
      calendar: false,
      show_popup_button: true,
      popup_width: "1000",
      popup_height: "650",
    };

    script.textContent = JSON.stringify(config);

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = () => {
      console.warn("[TradingView] Failed to load Advanced Chart Widget script");
      setHasError(true);
    };

    widgetContainer.appendChild(script);

    return () => {
      widgetRefCleanup(container, widgetContainer);
    };
  }, [symbol, interval, theme]);

  if (hasError) {
    return (
      <div
        className="w-full rounded-xl overflow-hidden border border-border flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center p-6 text-muted-foreground">
          <svg
            className="mx-auto mb-3 size-10 opacity-40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <div className="text-sm font-semibold mb-1">Chart Loading Failed</div>
          <div className="text-xs opacity-70">
            Unable to load TradingView widget. Check your connection and try again.
          </div>
          <button
            onClick={() => {
              setHasError(false);
              // Force re-render by toggling a key-equivalent
              const container = containerRef.current;
              if (container) {
                container.innerHTML = "";
              }
            }}
            className="mt-3 px-4 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-border"
      style={{ height }}
    />
  );
}

function widgetRefCleanup(
  container: HTMLDivElement,
  widgetContainer: HTMLElement,
) {
  if (container && container.contains(widgetContainer)) {
    container.innerHTML = "";
  }
}

export const TradingViewChart = memo(TradingViewChartInner);
