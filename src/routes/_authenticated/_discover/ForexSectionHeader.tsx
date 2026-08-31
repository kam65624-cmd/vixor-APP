// ── Forex Section Header ────────────────────────────────────────────────────

export function ForexSectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div
      style={{
        padding: "10px 12px 4px",
        fontSize: "9px",
        fontWeight: 700,
        color: "var(--color-muted-foreground)",
        textTransform: "uppercase" as const,
        letterSpacing: "0.08em",
        fontFamily: "var(--font-sans)",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      <span
        style={{
          width: "2px",
          height: "10px",
          borderRadius: "1px",
          background: "var(--color-primary)",
          display: "inline-block",
        }}
      />
      {title}
      <span style={{ fontSize: "8px", color: "var(--color-muted-foreground)", opacity: 0.7 }}>
        ({count})
      </span>
    </div>
  );
}
