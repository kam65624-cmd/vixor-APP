import { memo } from "react";
import { useLivePrices } from "@/shared/market-data";

// ── Live BTC Price Indicator (navbar) ─────────────────────────────────────

export const LivePriceIndicator = memo(function LivePriceIndicator() {
  const { getPrice } = useLivePrices({ pairs: ["BTC/USDT"] });
  const btc = getPrice("BTC/USDT");

  if (!btc) return null;

  const isUp = btc.change24h >= 0;
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-lg"
      style={{
        background: isUp
          ? "color-mix(in srgb, var(--color-bullish) 6%, transparent)"
          : "color-mix(in srgb, var(--color-bearish) 6%, transparent)",
        border:
          "1px solid " +
          (isUp
            ? "color-mix(in srgb, var(--color-bullish) 12%, transparent)"
            : "color-mix(in srgb, var(--color-bearish) 12%, transparent)"),
      }}
    >
      <span className="text-xs font-bold" style={{ color: "var(--color-muted-foreground)" }}>
        BTC
      </span>
      <span
        className="text-xs font-bold"
        style={{ fontFamily: "var(--font-mono)", color: "var(--color-foreground)" }}
      >
        $
        {btc.price >= 1000
          ? btc.price.toLocaleString("en-US", { maximumFractionDigits: 0 })
          : btc.price.toFixed(2)}
      </span>
      <span
        className="text-xs font-bold"
        style={{
          fontFamily: "var(--font-mono)",
          color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
        }}
      >
        {isUp ? "+" : ""}
        {btc.change24h.toFixed(2)}%
      </span>
    </div>
  );
});
