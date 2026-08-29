import {
  Zap,
  X,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import type { TradeDirection } from "@/domains/trades/types";
import type { ExchangeStatus, ExecuteTradeResult } from "@/domains/trading/gateway/functions";
import { withAlpha } from "@/shared/color-utils";
import { Badge } from "@/components/vixor/PageLayout";
import { labelStyle, mono } from "./constants";
import type { OrderSummary } from "./constants";

export interface ExecutionDialogProps {
  open: boolean;
  onClose: () => void;
  execResult: ExecuteTradeResult | null;
  isPending: boolean;
  isPaperMode: boolean;
  exchangeName: string;
  exchangeStatus: ExchangeStatus | undefined;
  direction: TradeDirection;
  pair: string;
  orderSummary: OrderSummary | null;
  onConfirm: () => void;
}

export function ExecutionDialog({
  open,
  onClose,
  execResult,
  isPending,
  isPaperMode,
  exchangeName,
  exchangeStatus,
  direction,
  pair,
  orderSummary,
  onConfirm,
}: ExecutionDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "color-mix(in srgb, var(--color-background) 30%, transparent)",
          backdropFilter: "blur(4px)",
        }}
      />

      {/* Dialog card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "380px",
          background: "var(--color-card)",
          border: `1px solid ${"var(--color-border)"}`,
          borderRadius: "16px",
          overflow: "hidden",
          boxShadow: "0 24px 48px color-mix(in srgb, var(--color-background) 50%, transparent)",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 16px 12px",
            borderBottom: `1px solid ${"var(--color-border)"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: isPaperMode
                  ? `color-mix(in srgb, var(--color-neutral-wait) 15%, transparent)`
                  : `color-mix(in srgb, var(--color-bullish) 15%, transparent)`,
              }}
            >
              <Zap
                className="size-4"
                style={{
                  color: isPaperMode ? "var(--color-neutral-wait)" : "var(--color-bullish)",
                }}
              />
            </div>
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}>
                {execResult ? "Execution Result" : "Confirm Execution"}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--color-muted-foreground)",
                  marginTop: "1px",
                }}
              >
                {isPaperMode ? "Paper Trading Mode" : `via ${exchangeName}`}
              </div>
            </div>
          </div>
          {!isPending && (
            <button
              onClick={onClose}
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "8px",
                border: "none",
                background: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                color: "var(--color-muted-foreground)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X className="size-4" />
            </button>
          )}
        </div>

        {/* Body */}
        <div style={{ padding: "16px" }}>
          {!execResult && !isPending && (
            <>
              {/* Order Summary */}
              <div
                style={{
                  padding: "12px",
                  borderRadius: "10px",
                  background: "color-mix(in srgb, var(--color-primary) 3%, transparent)",
                  border: `1px solid ${"var(--color-border)"}`,
                  marginBottom: "16px",
                }}
              >
                {/* Direction row */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                    Direction
                  </span>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                    {direction === "long" ? (
                      <ArrowUpRight className="size-3" style={{ color: "var(--color-bullish)" }} />
                    ) : (
                      <ArrowDownRight
                        className="size-3"
                        style={{ color: "var(--color-bearish)" }}
                      />
                    )}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 800,
                        ...mono,
                        color:
                          direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)",
                      }}
                    >
                      {direction.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Pair */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                    Pair
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      ...mono,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {pair}
                  </span>
                </div>

                {/* Entry */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                    Entry Price
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      ...mono,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {orderSummary?.entry ?? "—"}
                  </span>
                </div>

                {/* Quantity */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                    Quantity
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      ...mono,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {orderSummary?.quantity ?? "—"} lots
                  </span>
                </div>

                {/* SL */}
                {orderSummary?.slPrice && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                      Stop Loss
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        ...mono,
                        color: "var(--color-bearish)",
                      }}
                    >
                      {orderSummary.slPrice}
                    </span>
                  </div>
                )}

                {/* Estimated Cost */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    paddingTop: "8px",
                    borderTop: `1px solid ${"var(--color-border)"}`,
                  }}
                >
                  <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>
                    Est. Cost
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 800,
                      ...mono,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {orderSummary?.estimatedCost ?? "—"}
                  </span>
                </div>
              </div>

              {/* Exchange info */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 10px",
                  borderRadius: "8px",
                  background: isPaperMode ? `var(--neutral-wait-bg)` : `var(--bullish-bg)`,
                  marginBottom: "16px",
                }}
              >
                <span
                  style={{
                    width: "6px",
                    height: "6px",
                    borderRadius: "50%",
                    background: isPaperMode ? "var(--color-neutral-wait)" : "var(--color-bullish)",
                  }}
                />
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  {isPaperMode
                    ? "No exchange connected — will use Paper Trading (DummyAdapter)"
                    : `Order will be sent to ${exchangeName}${exchangeStatus?.maskedKey ? ` (${exchangeStatus.maskedKey})` : ""}`}
                </span>
              </div>
            </>
          )}

          {/* Loading state */}
          {isPending && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "24px 0",
              }}
            >
              <Loader2 className="size-8 animate-spin" style={{ color: "var(--color-bullish)" }} />
              <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-foreground)" }}>
                {isPaperMode ? "Simulating paper trade..." : `Submitting to ${exchangeName}...`}
              </div>
              <div style={{ fontSize: "11px", color: "var(--color-muted-foreground)" }}>
                This may take a few seconds
              </div>
            </div>
          )}

          {/* Success / Error result */}
          {execResult && !isPending && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                padding: "16px 0",
              }}
            >
              {execResult.success ? (
                <>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `color-mix(in srgb, var(--color-bullish) 15%, transparent)`,
                    }}
                  >
                    <CheckCircle className="size-6" style={{ color: "var(--color-bullish)" }} />
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-foreground)",
                    }}
                  >
                    {execResult.isPaperTrade ? "Paper Trade Executed" : "Order Submitted"}
                  </div>
                  {execResult.orderResult && (
                    <div
                      style={{
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: "color-mix(in srgb, var(--color-primary) 3%, transparent)",
                        border: `1px solid ${"var(--color-border)"}`,
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ ...labelStyle }}>Order ID</span>
                        <span
                          style={{
                            fontSize: "11px",
                            ...mono,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {execResult.orderResult.id}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "4px",
                        }}
                      >
                        <span style={{ ...labelStyle }}>Status</span>
                        <Badge
                          label={execResult.orderResult.status.toUpperCase()}
                          color={
                            execResult.orderResult.status === "filled"
                              ? "var(--color-bullish)"
                              : "var(--color-neutral-wait)"
                          }
                          small
                        />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ ...labelStyle }}>Filled @</span>
                        <span
                          style={{
                            fontSize: "11px",
                            ...mono,
                            color: "var(--color-foreground)",
                          }}
                        >
                          {execResult.orderResult.price}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: `color-mix(in srgb, var(--color-bearish) 15%, transparent)`,
                    }}
                  >
                    <AlertCircle className="size-6" style={{ color: "var(--color-bearish)" }} />
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "var(--color-foreground)",
                    }}
                  >
                    Execution Failed
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--color-bearish)",
                      textAlign: "center",
                      lineHeight: 1.4,
                      padding: "0 8px",
                      wordBreak: "break-word",
                    }}
                  >
                    {execResult.error}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer buttons */}
        {!execResult && !isPending && (
          <div
            style={{
              padding: "0 16px 16px",
              display: "flex",
              gap: "8px",
            }}
          >
            <button
              onClick={onClose}
              className="flex-1 h-11 rounded-xl text-xs font-bold transition-all"
              style={{
                background: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                border: `1px solid ${"var(--color-border)"}`,
                color: "var(--color-muted-foreground)",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              style={{
                background: isPaperMode
                  ? "linear-gradient(135deg, var(--color-neutral-wait), color-mix(in srgb, var(--color-neutral-wait) 70%, transparent))"
                  : "linear-gradient(135deg, var(--color-bullish), color-mix(in srgb, var(--color-bullish) 70%, transparent))",
                color: "var(--color-foreground)",
                boxShadow: `0 2px 12px ${withAlpha(isPaperMode ? "var(--color-neutral-wait)" : "var(--color-bullish)", 0.3)}`,
                border: "none",
              }}
            >
              <Zap className="size-3.5" />
              {isPaperMode ? "Confirm Paper Trade" : "Confirm Execution"}
            </button>
          </div>
        )}

        {/* Post-result close button */}
        {execResult && !isPending && (
          <div style={{ padding: "0 16px 16px" }}>
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl text-xs font-bold transition-all"
              style={{
                background: "var(--color-foreground)",
                border: "none",
                color: "var(--color-background)",
              }}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
