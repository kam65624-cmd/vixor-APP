"use client";

import { useEffect, useRef, memo, useCallback } from "react";

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
  "AAPL": "NASDAQ:AAPL",
  "TSLA": "NASDAQ:TSLA",
  "SPX500": "SP:SPX",
  "NASDAQ": "NASDAQ:NDX",
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
  "AAPL": "Apple Inc.",
  "TSLA": "Tesla Inc.",
  "SPX500": "S&P 500 Index",
  "NASDAQ": "NASDAQ Composite",
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

// Declare TradingView widget type on window
declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => {
        activeChart: () => {
          onIntervalChanged: () => {
            subscribe: (null_: null, cb: () => void) => void;
          };
          interval: () => string;
        };
      };
    };
  }
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
  const widgetRef = useRef<unknown>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  // Sync the internal ref to the external ref for screenshot capture
  useEffect(() => {
    if (chartContainerRef && "current" in chartContainerRef) {
      (chartContainerRef as React.MutableRefObject<HTMLDivElement | null>).current = containerRef.current;
    }
  });

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up any existing widget content
    const container = containerRef.current;
    container.innerHTML = "";

    // Create the inner div for the chart
    const chartDiv = document.createElement("div");
    chartDiv.id = `tv_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;
    chartDiv.style.height = "100%";
    chartDiv.style.width = "100%";
    container.appendChild(chartDiv);

    function initWidget() {
      if (!window.TradingView) return;

      try {
        const widget = new window.TradingView.widget({
          autosize: true,
          symbol: symbol,
          interval: interval,
          timezone: "Etc/UTC",
          theme: theme,
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartDiv.id,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: "rgba(15, 17, 23, 1)",
          gridColor: "rgba(255, 255, 255, 0.03)",
        });
        widgetRef.current = widget;

        // Listen for interval changes from the TradingView widget
        if (onIntervalChange && widget && typeof (widget as any).activeChart === "function") {
          try {
            const chart = (widget as any).activeChart();
            if (chart && chart.onIntervalChanged) {
              chart.onIntervalChanged().subscribe(null, () => {
                try {
                  const currentInterval = chart.interval();
                  if (currentInterval && onIntervalChange) {
                    onIntervalChange(currentInterval);
                  }
                } catch (e) {
                  // Ignore errors from interval subscription
                }
              });
            }
          } catch (e) {
            // Widget may not support interval subscription
          }
        }
      } catch (err) {
        console.warn("[TradingView] Widget init error:", err);
      }
    }

    // Check if the script is already loaded
    if (window.TradingView) {
      initWidget();
    } else {
      // Remove any previously added script
      const existingScript = document.querySelector(
        'script[src="https://s3.tradingview.com/tv.js"]'
      );
      if (existingScript) {
        existingScript.remove();
      }

      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      script.onerror = () => {
        console.warn("[TradingView] Failed to load script");
        // Show fallback
        container.innerHTML = `
          <div class="flex items-center justify-center h-full text-muted-foreground">
            <div class="text-center p-6">
              <div class="text-lg font-semibold mb-2">Chart Loading Failed</div>
              <div class="text-sm">Unable to load TradingView widget. Please check your internet connection and try again.</div>
            </div>
          </div>
        `;
      };
      document.head.appendChild(script);
      scriptRef.current = script;
    }

    return () => {
      // Cleanup: remove the widget and script
      widgetRef.current = null;
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
      if (scriptRef.current && scriptRef.current.parentNode) {
        scriptRef.current.parentNode.removeChild(scriptRef.current);
        scriptRef.current = null;
      }
    };
  }, [symbol, interval, theme, onIntervalChange]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-border"
      style={{ height }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartInner);
