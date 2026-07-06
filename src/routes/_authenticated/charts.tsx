import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";
import { TradingViewChart, SYMBOL_MAP, INTERVAL_MAP } from "@/components/vixor/TradingViewChart";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: ChartsPage,
});

const CRYPTO_PAIRS = ["BTC/USDT", "ETH/USDT", "SOL/USDT"] as const;

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

const INTERVALS = ["1M", "5M", "15M", "1H", "4H", "1D", "1W"] as const;

function ChartsPage() {
  const [selectedPair, setSelectedPair] = useState<string>("BTC/USDT");
  const [selectedInterval, setSelectedInterval] = useState<string>("4H");

  const tvSymbol = useMemo(() => SYMBOL_MAP[selectedPair] || selectedPair, [selectedPair]);
  const tvInterval = useMemo(() => INTERVAL_MAP[selectedInterval] || "240", [selectedInterval]);

  return (
    <PageLayout title="Charts" badge="LIVE" badgeColor="var(--color-bullish)">
      {/* Pair selector */}
      <div
        style={{
          display: "flex",
          gap: "1px",
          background: "var(--color-border)",
          borderBottom: "1px solid var(--color-border)",
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        <div
          style={{
            padding: "6px 12px",
            background: "var(--color-muted)",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
          }}
        >
          Crypto
        </div>
        {CRYPTO_PAIRS.map((pair) => (
          <button
            key={pair}
            onClick={() => setSelectedPair(pair)}
            style={{
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: pair === selectedPair ? 700 : 500,
              color:
                pair === selectedPair ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              background: pair === selectedPair ? "var(--color-card)" : "var(--color-card)",
              borderBottom:
                pair === selectedPair ? "2px solid var(--color-bullish)" : "2px solid transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              marginBottom: "-1px",
            }}
          >
            {pair}
          </button>
        ))}
        <div
          style={{
            padding: "6px 12px",
            background: "var(--color-muted)",
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            display: "flex",
            alignItems: "center",
            whiteSpace: "nowrap",
            borderLeft: "2px solid var(--color-border)",
          }}
        >
          Forex
        </div>
        {FOREX_PAIRS.map((pair) => (
          <button
            key={pair}
            onClick={() => setSelectedPair(pair)}
            style={{
              padding: "7px 10px",
              fontSize: "12px",
              fontWeight: pair === selectedPair ? 700 : 500,
              color:
                pair === selectedPair ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              background: "var(--color-card)",
              borderBottom:
                pair === selectedPair ? "2px solid var(--color-bullish)" : "2px solid transparent",
              border: "none",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              marginBottom: "-1px",
            }}
          >
            {pair}
          </button>
        ))}
      </div>

      {/* Interval selector */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "2px",
          padding: "0 16px",
          borderBottom: "1px solid var(--color-border)",
          background: "var(--color-card)",
          height: "36px",
          flexShrink: 0,
          overflowX: "auto",
        }}
        className="scrollbar-hide"
      >
        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "var(--color-muted-foreground)",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginRight: "6px",
            whiteSpace: "nowrap",
          }}
        >
          TF:
        </span>
        {INTERVALS.map((tf) => (
          <button
            key={tf}
            onClick={() => setSelectedInterval(tf)}
            style={{
              padding: "5px 10px",
              fontSize: "12px",
              fontWeight: tf === selectedInterval ? 600 : 500,
              borderRadius: "4px",
              border: "none",
              cursor: "pointer",
              color:
                tf === selectedInterval
                  ? "var(--color-foreground)"
                  : "var(--color-muted-foreground)",
              background: tf === selectedInterval ? "rgba(124,155,196,0.08)" : "transparent",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
              borderBottom:
                tf === selectedInterval
                  ? "2px solid var(--color-primary)"
                  : "2px solid transparent",
              marginBottom: "-1px",
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Chart */}
      <PageScrollArea style={{ padding: "0", flex: 1 }}>
        <div style={{ padding: "8px", height: "100%" }}>
          <TradingViewChart symbol={tvSymbol} interval={tvInterval} theme="dark" height="70vh" />
        </div>
      </PageScrollArea>
    </PageLayout>
  );
}
