import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageLayout, PageScrollArea } from "@/components/vixor/PageLayout";
import { CandlestickChart } from "@/components/vixor/CandlestickChart";
import { TradingViewChart, SYMBOL_MAP } from "@/components/vixor/TradingViewChart";

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

function ChartsPage() {
  const [selectedPair, setSelectedPair] = useState<string>("BTC/USDT");
  const [selectedInterval, setSelectedInterval] = useState<string>("4H");

  // Crypto pairs use native lightweight-charts, forex uses TradingView embed
  const isCrypto = useMemo(
    () =>
      selectedPair.includes("USDT") ||
      selectedPair.includes("BTC") ||
      selectedPair.includes("ETH") ||
      selectedPair.includes("SOL"),
    [selectedPair],
  );

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

      {/* Chart — native for crypto, TradingView embed for forex */}
      <PageScrollArea style={{ padding: "0", flex: 1 }}>
        <div style={{ padding: "8px", height: "100%", position: "relative" }}>
          {!selectedPair ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "70vh", color: "var(--color-muted-foreground)", background: "var(--color-card)", borderRadius: "12px", border: "1px solid var(--color-border)", padding: "32px", textAlign: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "var(--color-border)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "16px" }}>
                <span style={{ fontSize: "24px" }}>📉</span>
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-foreground)", marginBottom: "8px" }}>No chart data available</h3>
              <p style={{ fontSize: "14px", maxWidth: "280px", marginBottom: "24px" }}>Please select a trading pair from the menu above to view its live chart.</p>
              <button onClick={() => setSelectedPair("BTC/USDT")} style={{ padding: "10px 20px", background: "var(--color-bullish)", color: "var(--color-foreground)", borderRadius: "8px", fontWeight: 700, border: "none", cursor: "pointer", transition: "opacity 0.2s" }}>Select BTC/USDT</button>
            </div>
          ) : isCrypto ? (
            <CandlestickChart
              pair={selectedPair}
              interval={selectedInterval}
              height="70vh"
              onIntervalChange={setSelectedInterval}
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
