import { useRef } from "react";
import type { MarketToken } from "./server-fn";
import { formatPrice } from "./helpers";

function TickerStrip({ tokens }: { tokens: MarketToken[] }) {
  const stripRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={stripRef}
      className="scrollbar-hide"
      style={{
        display: "flex",
        gap: 2,
        overflowX: "auto",
        padding: "8px 0",
        borderBottom: "1px solid var(--color-border)",
        flexShrink: 0,
      }}
    >
      {tokens.map((t) => {
        const isUp = t.change24h >= 0;
        return (
          <div
            key={t.symbol}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "6px 14px",
              background: "var(--color-card)",
              borderRadius: 6,
              border: "1px solid var(--color-border)",
              minWidth: 160,
              flexShrink: 0,
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-foreground)" }}>
                {t.symbol}
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--color-muted-foreground)",
                    fontWeight: 500,
                    marginLeft: 3,
                  }}
                >
                  /USDT
                </span>
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "right" as const }}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-foreground)",
                }}
              >
                ${formatPrice(t.price)}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  fontFamily: "var(--font-mono)",
                  color: isUp ? "var(--color-bullish)" : "var(--color-bearish)",
                }}
              >
                {isUp ? "+" : ""}
                {t.change24h.toFixed(2)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { TickerStrip };
