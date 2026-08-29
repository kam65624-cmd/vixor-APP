// ── Smart Money Bar ──────────────────────────────────────────────────────────

export function SmartMoneyBar({ pct }: { pct?: number }) {
  if (pct === undefined || pct === null) return null;
  const clamped = Math.min(100, Math.max(0, pct));
  const color =
    clamped >= 50
      ? "var(--color-bullish)"
      : clamped >= 25
        ? "var(--color-neutral-wait)"
        : "var(--color-bearish)";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginTop: "1px" }}>
      <div
        style={{
          width: "40px",
          height: "2.5px",
          borderRadius: "2px",
          background: "var(--color-border)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${clamped}%`,
            height: "100%",
            background: color,
            borderRadius: "2px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span
        style={{
          fontSize: "7px",
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          color,
          lineHeight: 1,
        }}
      >
        {clamped.toFixed(0)}%
      </span>
    </div>
  );
}
