function GaugeBar({
  value,
  max = 100,
  color,
  label,
}: {
  value: number;
  max?: number;
  color: string;
  label: string;
}) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "4px",
        }}
      >
        <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>
          {label}
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            fontFamily: "var(--font-mono)",
            color,
          }}
        >
          {value}/{max}
        </span>
      </div>
      <div
        style={{
          width: "100%",
          height: "6px",
          borderRadius: "3px",
          background: "var(--color-background)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: "3px",
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export { GaugeBar };
