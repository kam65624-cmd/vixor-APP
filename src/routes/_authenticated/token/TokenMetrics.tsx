function MarketStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        background: "var(--color-background)",
      }}
    >
      <div
        style={{
          fontSize: "11px",
          fontWeight: 600,
          color: "var(--color-muted-foreground)",
          textTransform: "uppercase",
          letterSpacing: "0.05em",
          marginBottom: "3px",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: "var(--color-foreground)",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function QuickCalcRow({
  label,
  value,
  mono = false,
  valueColor,
}: {
  label: string;
  value: string;
  mono?: boolean;
  valueColor?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 0",
        borderBottom: `1px solid color-mix(in srgb, var(--color-primary) 4%, transparent)`,
      }}
    >
      <span
        style={{
          fontSize: "12px",
          color: "var(--color-muted-foreground)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: "12px",
          fontWeight: 700,
          fontFamily: mono ? "var(--font-mono)" : undefined,
          color: valueColor || "var(--color-foreground)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

function MetricCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "var(--color-background)",
        borderRadius: "8px",
        padding: "12px",
        border: `1px solid var(--color-border)`,
      }}
    >
      {children}
    </div>
  );
}

function MetricCardLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "11px",
        fontWeight: 600,
        color: "var(--color-muted-foreground)",
        textTransform: "uppercase",
        letterSpacing: "0.05em",
      }}
    >
      {children}
    </div>
  );
}

function MetricPill({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2px",
      }}
    >
      <span
        style={{
          fontSize: "13px",
          fontWeight: 700,
          fontFamily: "var(--font-mono)",
          color: color || "var(--color-foreground)",
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontSize: "10px",
          color: "var(--color-muted-foreground)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function PageScrollArea({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="scrollbar-hide"
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

export { MarketStat, QuickCalcRow, MetricCard, MetricCardLabel, MetricPill, PageScrollArea };
