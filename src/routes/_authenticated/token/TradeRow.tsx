import { memo } from "react";
import { DataRow, Badge } from "@/components/vixor/PageLayout";

const TokenTradeRow = memo(function TokenTradeRow({ trade }: { trade: any }) {
  const isPos = (trade.pnl || 0) >= 0;
  const isLong = trade.direction === "long";
  const fmtPrice = (n: number) => (n < 0.001 ? n.toFixed(8) : n < 1 ? n.toFixed(6) : n.toFixed(2));

  return (
    <DataRow>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          fontSize: "11px",
          fontFamily: "var(--font-mono)",
        }}
      >
        <div style={{ width: "50px" }}>
          <Badge
            label={(trade.direction || "").toUpperCase()}
            color={isLong ? "var(--color-bullish)" : "var(--color-bearish)"}
            small
          />
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            color: "var(--color-foreground)",
          }}
        >
          {fmtPrice(trade.entry_price)}
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            color: "var(--color-muted-foreground)",
          }}
        >
          {trade.exit_price ? fmtPrice(trade.exit_price) : "—"}
        </div>
        <div
          style={{
            width: "60px",
            textAlign: "right",
            color: "var(--color-muted-foreground)",
          }}
        >
          {trade.quantity ?? "—"}
        </div>
        <div
          style={{
            width: "80px",
            textAlign: "right",
            fontWeight: 700,
            color: isPos ? "var(--color-bullish)" : "var(--color-bearish)",
          }}
        >
          {trade.pnl != null ? (isPos ? "+" : "") + trade.pnl.toFixed(2) : "—"}
        </div>
        <div
          style={{
            width: "50px",
            textAlign: "right",
            color:
              trade.r_multiple && trade.r_multiple > 0
                ? "var(--color-bullish)"
                : "var(--color-muted-foreground)",
          }}
        >
          {trade.r_multiple ? `${trade.r_multiple.toFixed(1)}R` : "—"}
        </div>
        <div
          style={{
            flex: 1,
            textAlign: "right",
            color: "var(--color-muted-foreground)",
            fontSize: "10px",
          }}
        >
          {new Date(trade.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </div>
      </div>
    </DataRow>
  );
});

export { TokenTradeRow };
