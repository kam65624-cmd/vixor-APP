// ── Token Icon Circle ───────────────────────────────────────────────────────
export function TokenIcon({
  symbol,
  color,
  size = 28,
}: {
  symbol: string;
  color: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `${color}22`,
        border: `1.5px solid ${color}44`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.42,
        fontWeight: 800,
        color,
        flexShrink: 0,
        letterSpacing: "-0.02em",
      }}
    >
      {symbol.slice(0, 2)}
    </div>
  );
}
