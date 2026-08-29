function DemoNotice() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 16px",
        background: "color-mix(in srgb, var(--color-gold) 10%, transparent)",
        borderBottom: "1px solid color-mix(in srgb, var(--color-gold) 0.20%, transparent)",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 800,
          padding: "1px 6px",
          borderRadius: 3,
          background: "color-mix(in srgb, var(--color-gold) 13%, transparent)",
          color: "var(--color-gold)",
          letterSpacing: "0.06em",
        }}
      >
        DEMO
      </span>
      <span style={{ fontSize: 11, color: "var(--color-muted-foreground)" }}>
        Showing simulated data — API connections unavailable
      </span>
    </div>
  );
}

export { DemoNotice };
