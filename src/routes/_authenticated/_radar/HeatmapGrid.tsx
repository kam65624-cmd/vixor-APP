import { heatmapColor } from "./helpers";

function HeatmapGrid({ data }: { data: Array<{ symbol: string; change: number }> }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
        gap: 3,
        padding: "8px 16px 12px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-card)",
      }}
    >
      {data.map((d) => (
        <div
          key={d.symbol}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "8px 4px",
            borderRadius: 6,
            background: heatmapColor(d.change),
            minHeight: 52,
            transition: "transform 0.15s ease",
            cursor: "default" as const,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--color-foreground)",
              marginBottom: 2,
            }}
          >
            {d.symbol}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--font-mono)",
              color: d.change >= 0 ? "var(--color-bullish)" : "var(--color-bearish)",
            }}
          >
            {d.change >= 0 ? "+" : ""}
            {d.change.toFixed(2)}%
          </span>
        </div>
      ))}
    </div>
  );
}

export { HeatmapGrid };
