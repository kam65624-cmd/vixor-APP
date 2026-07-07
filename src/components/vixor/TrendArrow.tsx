interface TrendArrowProps {
  /** "up" = bullish, "down" = bearish, "neutral" = flat */
  direction: "up" | "down" | "neutral";
  /** Size in px — default 14 */
  size?: number;
  /** Additional className */
  className?: string;
}

/**
 * TrendArrow — directional arrow indicator for price changes.
 * Uses CSS custom properties for theming:
 *   up      → var(--color-bullish)
 *   down    → var(--color-bearish)
 *   neutral → var(--color-muted-foreground)
 */
export function TrendArrow({ direction, size = 14, className }: TrendArrowProps) {
  const color =
    direction === "up"
      ? "var(--color-bullish)"
      : direction === "down"
        ? "var(--color-bearish)"
        : "var(--color-muted-foreground)";

  const rotation = direction === "down" ? "rotate(180deg)" : "none";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ color, transform: rotation, transition: "transform 0.2s ease" }}
      className={className}
    >
      <path d="M8 2L14 10H10V14H6V10H2L8 2Z" fill="currentColor" />
    </svg>
  );
}
