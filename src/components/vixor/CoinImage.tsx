import { useState } from "react";
import { withAlpha, blendWithCard } from "@/shared/color-utils";

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
            "1px solid rgba(124,155,196,0.10)",
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
            ? withAlpha(color, 0.10)
            : blendWithCard("var(--color-foreground)", 0.06),
        border: `1px solid ${withAlpha(color, 0.20)}`,
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