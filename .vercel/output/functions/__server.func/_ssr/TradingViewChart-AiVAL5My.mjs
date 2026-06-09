import { r as reactExports, j as jsxRuntimeExports } from "../_libs/react.mjs";
const SYMBOL_MAP = {
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
  "NASDAQ": "NASDAQ:NDX"
};
function getDisplayPair(symbol) {
  for (const [pair, sym] of Object.entries(SYMBOL_MAP)) {
    if (sym === symbol) return pair;
  }
  return symbol.replace(/^[A-Z]+:/, "");
}
function toTradingViewSymbol(pair) {
  return SYMBOL_MAP[pair] || pair;
}
function TradingViewChartInner({
  symbol,
  interval = "240",
  theme = "dark",
  height = "65vh"
}) {
  const containerRef = reactExports.useRef(null);
  const widgetRef = reactExports.useRef(null);
  const scriptRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    container.innerHTML = "";
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
          symbol,
          interval,
          timezone: "Etc/UTC",
          theme,
          style: "1",
          locale: "en",
          enable_publishing: false,
          allow_symbol_change: true,
          container_id: chartDiv.id,
          hide_top_toolbar: false,
          hide_legend: false,
          save_image: false,
          backgroundColor: "rgba(15, 17, 23, 1)",
          gridColor: "rgba(255, 255, 255, 0.03)"
        });
      } catch (err) {
        console.warn("[TradingView] Widget init error:", err);
      }
    }
    if (window.TradingView) {
      initWidget();
    } else {
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
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "div",
    {
      ref: containerRef,
      className: "w-full rounded-xl overflow-hidden border border-border",
      style: { height }
    }
  );
}
const TradingViewChart = reactExports.memo(TradingViewChartInner);
export {
  SYMBOL_MAP as S,
  TradingViewChart as T,
  getDisplayPair as g,
  toTradingViewSymbol as t
};
