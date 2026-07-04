import { useState } from "react";

// ── Coin Image Component ──────────────────────────────────────────────────
// Shared component for rendering a token image or a styled letter abbreviation
// fallback. Used across dashboard, portfolio, and bags pages.

export function CoinImage({
  symbol,
  image,
  size = 26,
  up,
}: {
  symbol: string;
  image?: string;
  size?: number;
  up?: boolean;
}) {
  const color =
    up !== undefined
      ? up
        ? "var(--color-bullish)"
        : "var(--color-bearish)"
      : "var(--color-muted-foreground)";
  const [imgError, setImgError] = useState(false);
  const hasImg = image && !imgError;

  if (hasImg) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          flexShrink: 0,
          overflow: "hidden",
          border:
            "1px solid color-mix(in oklab, var(--color-foreground) 10%, transparent)",
        }}
      >
        <img
          src={image}
          alt={symbol}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          onError={() => setImgError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        flexShrink: 0,
        background:
          up !== undefined
            ? `color-mix(in oklab, ${color} 10%, transparent)`
            : `color-mix(in oklab, var(--color-foreground) 6%, var(--color-card))`,
        border: `1px solid color-mix(in oklab, ${color} 20%, transparent)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: Math.max(7, size * 0.32),
        fontWeight: 800,
        color,
      }}
    >
      {symbol.slice(0, 2).toUpperCase()}
    </div>
  );
}

export default CoinImage;