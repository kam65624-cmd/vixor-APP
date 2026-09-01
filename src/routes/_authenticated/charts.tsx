import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";
import { CandlestickChart } from "@/components/vixor/CandlestickChart";
import { TradingViewChart, SYMBOL_MAP } from "@/components/vixor/TradingViewChart";
import { useLivePrices } from "@/shared/market-data";
import { useQuery } from "@tanstack/react-query";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { getCandles, getTicker } from "@/domains/trade/functions";
import { TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: ChartsPage,
});

const CRYPTO_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "DOGE/USDT",
  "ADA/USDT",
  "AVAX/USDT",
  "DOT/USDT",
  "LINK/USDT",
  "NEAR/USDT",
  "INJ/USDT",
] as const;

const FOREX_PAIRS = [
  "XAU/USD",
  "EUR/USD",
  "GBP/JPY",
  "USD/JPY",
  "GBP/USD",
  "AUD/USD",
  "USD/CAD",
  "USD/CHF",
] as const;

function formatPrice(p: number): string {
  if (p >= 1000) return `$${p.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (p >= 1) return `$${p.toFixed(4)}`;
  return `$${p.toFixed(6)}`;
}

function formatCompact(v: number): string {
  if (v >= 1e12) return `$${(v / 1e12).toFixed(1)}T`;
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
}

function ChartsPage() {
  const [selectedPair, setSelectedPair] = useState<string>("BTC/USDT");
  const [selectedInterval, setSelectedInterval] = useState<string>("4H");

  const symbol = selectedPair.replace("/", "");
  const intervalMap: Record<string, string> = {
    "1M": "1m",
    "5M": "5m",
    "15M": "15m",
    "1H": "1h",
    "4H": "4h",
    "1D": "1d",
    "1W": "1w",
  };
  const interval = intervalMap[selectedInterval] || "4h";

  const stableCandles = useStableServerFn(getCandles);
  const stableTicker = useStableServerFn(getTicker);

  const {
    data: candles,
    isLoading: candlesLoading,
    isError: candlesError,
  } = useQuery({
    queryKey: ["candles", symbol, interval],
    queryFn: () => stableCandles({ data: { symbol, interval, limit: 200 } }),
    staleTime: 60_000,
  });

  const { data: ticker } = useQuery({
    queryKey: ["ticker", symbol],
    queryFn: () => stableTicker({ data: { symbol } }),
    staleTime: 30_000,
  });

  const isCrypto = useMemo(
    () =>
      selectedPair.includes("USDT") ||
      selectedPair.includes("BTC") ||
      selectedPair.includes("ETH") ||
      selectedPair.includes("SOL"),
    [selectedPair],
  );

  const priceChange = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const isUp = priceChange >= 0;

  return (
    <PageLayout title="Charts" badge="LIVE" badgeColor="var(--color-bullish)">
      {/* Live Price Bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-lg font-extrabold text-foreground">{selectedPair}</span>
          {ticker && (
            <>
              <span className="text-lg font-bold font-mono text-foreground">
                {formatPrice(parseFloat(ticker.lastPrice))}
              </span>
              <div
                className={`flex items-center gap-1 text-xs font-bold font-mono ${isUp ? "text-bullish" : "text-bearish"}`}
              >
                {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {isUp ? "+" : ""}
                {priceChange.toFixed(2)}%
              </div>
            </>
          )}
        </div>
        {ticker && (
          <div className="flex items-center gap-4 text-xs font-mono text-muted-foreground">
            <span>
              H{" "}
              <span className="text-foreground font-semibold">
                {formatPrice(parseFloat(ticker.highPrice))}
              </span>
            </span>
            <span>
              L{" "}
              <span className="text-foreground font-semibold">
                {formatPrice(parseFloat(ticker.lowPrice))}
              </span>
            </span>
            <span>
              Vol{" "}
              <span className="text-foreground font-semibold">
                {formatCompact(parseFloat(ticker.quoteVolume))}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Pair Selector */}
      <div className="flex items-center gap-px border-b border-border bg-muted/30 overflow-x-auto scrollbar-hide flex-shrink-0">
        <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 shrink-0">
          Crypto
        </div>
        {CRYPTO_PAIRS.map((pair) => {
          const isActive = pair === selectedPair;
          return (
            <button
              key={pair}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? "text-foreground bg-card border-b-2 border-bullish"
                  : "text-muted-foreground hover:text-foreground/80 hover:bg-card/50 border-b-2 border-transparent"
              }`}
            >
              {pair.replace("/USDT", "")}
            </button>
          );
        })}
        <div className="px-3 py-2 text-xs font-bold text-muted-foreground uppercase tracking-widest bg-muted/50 shrink-0 border-l border-border">
          Forex
        </div>
        {FOREX_PAIRS.map((pair) => {
          const isActive = pair === selectedPair;
          return (
            <button
              key={pair}
              onClick={() => setSelectedPair(pair)}
              className={`px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? "text-foreground bg-card border-b-2 border-bullish"
                  : "text-muted-foreground hover:text-foreground/80 hover:bg-card/50 border-b-2 border-transparent"
              }`}
            >
              {pair}
            </button>
          );
        })}
      </div>

      {/* Chart */}
      <PageScrollArea style={{ padding: "0", flex: 1 }}>
        <div className="p-2 h-full relative">
          {isCrypto ? (
            <CandlestickChart
              pair={selectedPair}
              interval={selectedInterval}
              height="70vh"
              onIntervalChange={setSelectedInterval}
              initialData={candles}
            />
          ) : (
            <TradingViewChart
              symbol={SYMBOL_MAP[selectedPair] || selectedPair}
              interval={
                {
                  "1M": "1",
                  "5M": "5",
                  "15M": "15",
                  "1H": "60",
                  "4H": "240",
                  "1D": "D",
                  "1W": "W",
                }[selectedInterval] || "240"
              }
              theme="dark"
              height="70vh"
              onIntervalChange={(tvInterval) => {
                const reverseMap: Record<string, string> = {
                  "1": "1M",
                  "5": "5M",
                  "15": "15M",
                  "60": "1H",
                  "240": "4H",
                  D: "1D",
                  W: "1W",
                };
                const tf = reverseMap[tvInterval];
                if (tf) setSelectedInterval(tf);
              }}
            />
          )}
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}
