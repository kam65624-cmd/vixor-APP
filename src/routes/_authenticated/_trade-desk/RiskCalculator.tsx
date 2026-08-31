import {
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Loader2,
  MessageSquare,
  Zap,
  Target,
  Shield,
} from "lucide-react";

import type { TradeDirection } from "@/domains/trades/types";
import { Badge } from "@/components/vixor/PageLayout";
import { PAIRS, card, mono, labelStyle, inputStyle } from "./constants";
import type { RiskCalcResult } from "./constants";

export interface RiskCalculatorProps {
  t: (key: string) => string;
  pair: string;
  setPair: (v: string) => void;
  balance: string;
  setBalance: (v: string) => void;
  riskPct: string;
  setRiskPct: (v: string) => void;
  slPips: string;
  setSlPips: (v: string) => void;
  direction: TradeDirection;
  setDirection: (d: TradeDirection) => void;
  entryPrice: string;
  setEntryPrice: (v: string) => void;
  result: RiskCalcResult | null;
  saveMutationPending: boolean;
  saveSuccess: boolean;
  isPaperMode: boolean;
  exchangeName: string;
  onSaveTrade: () => void;
  onOpenExecute: () => void;
  showCoach: boolean;
  setShowCoach: (v: boolean) => void;
  showGovernor: boolean;
  setShowGovernor: (v: boolean) => void;
}

export function RiskCalculator({
  t,
  pair,
  setPair,
  balance,
  setBalance,
  riskPct,
  setRiskPct,
  slPips,
  setSlPips,
  direction,
  setDirection,
  entryPrice,
  setEntryPrice,
  result,
  saveMutationPending,
  saveSuccess,
  isPaperMode,
  exchangeName,
  onSaveTrade,
  onOpenExecute,
  showCoach,
  setShowCoach,
  showGovernor,
  setShowGovernor,
}: RiskCalculatorProps) {
  return (
    <div
      className="animate-slide-up"
      style={{
        ...card,
        margin: "16px 16px 0",
        padding: "20px",
        borderLeft: "4px solid var(--color-bullish)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
          paddingBottom: "14px",
          borderBottom: "1px solid color-mix(in srgb, var(--color-foreground) 6%, transparent)",
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "10px",
            background: "color-mix(in srgb, var(--color-bullish) 12%, transparent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Calculator className="size-4" style={{ color: "var(--color-bullish)" }} />
        </div>
        <div>
          <h2 style={{ ...labelStyle, fontSize: "13px", color: "var(--color-foreground)" }}>
            {t("tradeDesk.riskCalculator")}
          </h2>
          <p
            style={{
              fontSize: "12px",
              color: "var(--color-muted-foreground)",
              marginTop: "2px",
            }}
          >
            Position size & risk management
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
        <div className="sm:col-span-2 flex flex-col gap-1.5">
          <label style={labelStyle}>{t("tradeDesk.tradingPair")}</label>
          <select
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="w-full h-12 px-3 rounded-xl text-sm cursor-pointer"
            style={{ ...inputStyle, ...mono }}
          >
            {PAIRS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{t("tradeDesk.balance")} ($)</label>
          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-full h-12 px-3 rounded-xl text-sm"
            style={{ ...inputStyle, ...mono }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{t("tradeDesk.riskPct")}</label>
          <input
            type="number"
            step="0.1"
            value={riskPct}
            onChange={(e) => setRiskPct(e.target.value)}
            className="w-full h-12 px-3 rounded-xl text-sm"
            style={{ ...inputStyle, ...mono }}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label style={labelStyle}>{t("tradeDesk.stopLossPips")}</label>
          <input
            type="number"
            value={slPips}
            onChange={(e) => setSlPips(e.target.value)}
            className="w-full h-12 px-3 rounded-xl text-sm"
            style={{ ...inputStyle, ...mono }}
          />
        </div>
      </div>

      <div
        style={{
          padding: "20px",
          borderRadius: "14px",
          textAlign: "center",
          background:
            "linear-gradient(135deg, color-mix(in srgb, var(--color-bullish) 6%, transparent), color-mix(in srgb, var(--color-bullish) 2%, transparent))",
          border: "1px solid color-mix(in srgb, var(--color-bullish) 15%, transparent)",
        }}
      >
        <div style={{ ...labelStyle, marginBottom: "8px", opacity: 0.8 }}>
          {t("tradeDesk.recommendedLotSize")}
        </div>
        <div
          key={result?.lots}
          className={result ? "animate-data-update" : ""}
          style={{
            fontSize: "36px",
            fontWeight: 800,
            ...mono,
            color: "var(--color-bullish)",
            marginBottom: "10px",
            textShadow: "0 0 20px color-mix(in srgb, var(--color-bullish) 40%, transparent)",
            letterSpacing: "-0.02em",
          }}
        >
          {result ? result.lots : "0.00"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
          }}
        >
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              ...mono,
              color: "var(--color-muted-foreground)",
            }}
          >
            Risk: ${result?.riskAmount || "0.00"}
          </span>
          {result && (
            <Badge
              label={
                result.riskLevel === "LOW"
                  ? t("tradeDesk.lowRisk")
                  : result.riskLevel === "MEDIUM"
                    ? t("tradeDesk.mediumRisk")
                    : t("tradeDesk.highRisk")
              }
              color={
                result.riskLevel === "LOW"
                  ? "var(--color-bullish)"
                  : result.riskLevel === "MEDIUM"
                    ? "var(--color-neutral-wait)"
                    : "var(--color-bearish)"
              }
              small
            />
          )}
        </div>
      </div>

      {/* ── SAVE AS TRADE + EXECUTE ── */}
      <div
        style={{
          marginTop: "16px",
          paddingTop: "16px",
          borderTop: `1px solid ${"var(--color-border)"}`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: "12px",
          }}
        >
          <Save className="size-3.5" style={{ color: "var(--color-bullish)" }} />
          <span style={labelStyle}>Save as Trade</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          {/* Direction */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Direction</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setDirection("long")}
                className="h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                style={{
                  background:
                    direction === "long"
                      ? `${"var(--color-bullish)"}20`
                      : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                  border: `1px solid ${
                    direction === "long" ? `${"var(--color-bullish)"}66` : "var(--color-border)"
                  }`,
                  color:
                    direction === "long" ? "var(--color-bullish)" : "var(--color-muted-foreground)",
                }}
              >
                <ArrowUpRight className="size-3" />
                Long
              </button>
              <button
                onClick={() => setDirection("short")}
                className="h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                style={{
                  background:
                    direction === "short"
                      ? `${"var(--color-bearish)"}20`
                      : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
                  border: `1px solid ${
                    direction === "short" ? `${"var(--color-bearish)"}66` : "var(--color-border)"
                  }`,
                  color:
                    direction === "short"
                      ? "var(--color-bearish)"
                      : "var(--color-muted-foreground)",
                }}
              >
                <ArrowDownRight className="size-3" />
                Short
              </button>
            </div>
          </div>

          {/* Entry Price */}
          <div className="flex flex-col gap-1.5">
            <label style={labelStyle}>Entry Price</label>
            <input
              type="number"
              step="any"
              value={entryPrice}
              onChange={(e) => setEntryPrice(e.target.value)}
              placeholder="0.00"
              className="w-full h-10 px-3 rounded-lg text-sm"
              style={{ ...inputStyle, ...mono }}
            />
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div className="grid grid-cols-2 gap-2">
          {/* Save Trade (left half) */}
          <button
            onClick={onSaveTrade}
            disabled={!entryPrice || saveMutationPending}
            className="flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all"
            style={{
              background:
                entryPrice && !saveMutationPending
                  ? saveSuccess
                    ? `color-mix(in srgb, var(--color-bullish) 19%, transparent)`
                    : "var(--color-bullish)"
                  : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              color: saveSuccess
                ? "var(--color-bullish)"
                : entryPrice && !saveMutationPending
                  ? "var(--color-foreground)"
                  : "var(--color-muted-foreground)",
              border: saveSuccess ? `1px solid ${"var(--color-bullish)"}66` : "none",
              opacity: !entryPrice || saveMutationPending ? 0.5 : 1,
            }}
          >
            {saveMutationPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saveSuccess ? (
              <>
                <Target className="size-3.5" />
                Saved!
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save Trade
              </>
            )}
          </button>

          {/* Execute on Exchange (right half) — more prominent */}
          <button
            onClick={onOpenExecute}
            disabled={!entryPrice}
            className="flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all"
            style={{
              background: entryPrice
                ? "linear-gradient(135deg, var(--color-bullish), color-mix(in srgb, var(--color-bullish) 70%, transparent))"
                : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              color: entryPrice ? "var(--color-foreground)" : "var(--color-muted-foreground)",
              boxShadow: entryPrice
                ? "0 2px 12px color-mix(in srgb, var(--color-bullish) 30%, transparent)"
                : "none",
              opacity: !entryPrice ? 0.5 : 1,
              border: "none",
            }}
          >
            <Zap className="size-3.5" />
            {isPaperMode ? "Paper Trade" : `Execute via ${exchangeName}`}
          </button>
        </div>

        {/* Coach + Risk buttons (underneath) */}
        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
          <button
            onClick={() => {
              setShowCoach(!showCoach);
              setShowGovernor(false);
            }}
            disabled={!entryPrice}
            className="flex items-center justify-center gap-1 h-10 px-3 rounded-lg text-xs font-bold transition-all flex-1"
            style={{
              background: showCoach
                ? `${"var(--color-info)"}20`
                : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              border: `1px solid ${showCoach ? `${"var(--color-info)"}66` : "var(--color-border)"}`,
              color: showCoach ? "var(--color-info)" : "var(--color-muted-foreground)",
              opacity: !entryPrice ? 0.5 : 1,
            }}
            title="AI Coach — Get coaching feedback"
          >
            <MessageSquare className="size-3.5" />
            <span className="hidden sm:inline">Coach</span>
          </button>
          <button
            onClick={() => {
              setShowGovernor(!showGovernor);
              setShowCoach(false);
            }}
            disabled={!entryPrice}
            className="flex items-center justify-center gap-1 h-10 px-3 rounded-lg text-xs font-bold transition-all flex-1"
            style={{
              background: showGovernor
                ? `${"var(--color-neutral-wait)"}20`
                : "color-mix(in srgb, var(--color-primary) 6%, transparent)",
              border: `1px solid ${showGovernor ? `${"var(--color-neutral-wait)"}66` : "var(--color-border)"}`,
              color: showGovernor ? "var(--color-neutral-wait)" : "var(--color-muted-foreground)",
              opacity: !entryPrice ? 0.5 : 1,
            }}
            title="Risk Governor — Assess trade risk"
          >
            <Shield className="size-3.5" />
            <span className="hidden sm:inline">Risk</span>
          </button>
        </div>
      </div>
    </div>
  );
}
