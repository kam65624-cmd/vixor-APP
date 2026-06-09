"use client";

import { useEffect, useRef, memo } from "react";

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

interface TradingViewChartProps {
  symbol: string; // TradingView symbol like "BINANCE:BTCUSDT"
  interval?: string;
  theme?: "dark" | "light";
  height?: string;
}

// Declare TradingView widget type on window
declare global {
  interface Window {
    TradingView?: {
      widget: new (config: Record<string, unknown>) => unknown;
    };
  }
}

function TradingViewChartInner({
  symbol,
  interval = "240",
  theme = "dark",
  height = "65vh",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<unknown>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

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
        widgetRef.current = new window.TradingView.widget({
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
  }, [symbol, interval, theme]);

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden border border-border"
      style={{ height }}
    />
  );
}

export const TradingViewChart = memo(TradingViewChartInner);
