// ── NEW Badge ─────────────────────────────────────────────────────────────────

export function NewBadge() {
  return (
    <span
      style={{
        fontSize: "7px",
        fontWeight: 800,
        padding: "1px 4px",
        borderRadius: "3px",
        background: "var(--color-bullish)",
        color: "var(--color-buy-text)",
        letterSpacing: "0.04em",
        lineHeight: 1,
        animation: "pulse-dot 2s ease-in-out infinite",
      }}
    >
      NEW
    </span>
  );
}
