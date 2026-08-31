import { ArrowUpRight, ArrowDownRight } from "lucide-react";

import type { Trade } from "@/domains/trades/types";
import { SectionTitle, EmptyState, Badge } from "@/components/vixor/PageLayout";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { card, mono } from "./constants";

export interface ActivePositionsProps {
  trades: Trade[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  t: (key: string) => string;
}

export function ActivePositions({
  trades,
  total,
  page,
  pageSize,
  onPageChange,
  t,
}: ActivePositionsProps) {
  return (
    <div style={{ marginTop: "24px" }} className="animate-slide-up">
      <SectionTitle title={t("tradeDesk.activePositions")} count={trades.length} />

      {trades.length === 0 ? (
        <EmptyState
          icon="📊"
          title={t("tradeDesk.noPositions")}
          message='Use "Save as Trade" or "Execute" above to log your first position.'
        />
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            padding: "0 16px 16px",
          }}
        >
          {trades.map((trade) => (
            <div key={trade.id} className="p-3 flex items-center gap-3" style={card}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  background:
                    trade.direction === "long"
                      ? `color-mix(in srgb, var(--color-bullish) 10%, transparent)`
                      : `color-mix(in srgb, var(--color-bearish) 10%, transparent)`,
                }}
              >
                {trade.direction === "long" ? (
                  <ArrowUpRight className="size-4" style={{ color: "var(--color-bullish)" }} />
                ) : (
                  <ArrowDownRight className="size-4" style={{ color: "var(--color-bearish)" }} />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="text-sm font-bold" style={mono}>
                    {trade.pair}
                  </span>
                  <Badge
                    label={trade.direction.toUpperCase()}
                    color={
                      trade.direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)"
                    }
                    small
                  />
                </div>
                <div
                  style={{
                    fontSize: "10px",
                    ...mono,
                    color: "var(--color-muted-foreground)",
                    marginTop: "2px",
                  }}
                >
                  Entry: {trade.entry_price}
                  {trade.stop_loss && ` · SL: ${trade.stop_loss}`}
                  {trade.take_profit && ` · TP: ${trade.take_profit}`}
                </div>
              </div>
              <div
                style={{
                  textAlign: "right",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    ...mono,
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {new Date(trade.entry_date).toLocaleDateString()}
                </div>
                {trade.quantity && (
                  <div
                    style={{
                      fontSize: "10px",
                      ...mono,
                      color: "var(--color-muted-foreground)",
                    }}
                  >
                    {trade.quantity} lots
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {total > pageSize && (
        <div style={{ padding: "0 16px 16px" }}>
          <PaginationBar
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  );
}
