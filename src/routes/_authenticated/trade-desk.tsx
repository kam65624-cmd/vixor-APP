"use client";

import { createFileRoute } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Target,
  Shield,
  Calculator,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Save,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { createTrade, listTrades } from "@/domains/trades/functions";
import type { Trade, TradeDirection } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { cn } from "@/shared/utils";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { CoachOverlay } from "@/components/vixor/CoachOverlay";
import { GovernorRiskPanel } from "@/components/vixor/GovernorRiskPanel";

export const Route = createFileRoute("/_authenticated/trade-desk")({
  head: () => ({ meta: [{ title: "Trade Desk — Vixor" }] }),
  component: TradeDesk,
});

const PAIRS = ["XAUUSD", "EURUSD", "GBPUSD", "USDJPY", "BTCUSD"];
const PIP_SIZES: Record<string, number> = {
  EURUSD: 0.0001,
  GBPUSD: 0.0001,
  USDJPY: 0.01,
  XAUUSD: 0.1,
  BTCUSD: 1,
};
const LOT_SIZES: Record<string, number> = {
  EURUSD: 100000,
  GBPUSD: 100000,
  USDJPY: 100000,
  XAUUSD: 100,
  BTCUSD: 1,
};

const card = {
  background: "#111827",
  border: "1px solid rgba(255,255,255,0.06)",
  borderRadius: "12px",
};
const mono = { fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', monospace" };
const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#7B8BA8",
};
const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.06)",
  color: "#F0F4FC",
  outline: "none",
} as React.CSSProperties;

function TradeDesk() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [slPips, setSlPips] = useState("30");
  const [pair, setPair] = useState("XAUUSD");
  const [direction, setDirection] = useState<TradeDirection>("long");
  const [entryPrice, setEntryPrice] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCoach, setShowCoach] = useState(false);
  const [showGovernor, setShowGovernor] = useState(false);

  const createTradeFn = useStableServerFn(createTrade);
  const fetchOpenTrades = useStableServerFn(listTrades);

  // Pagination state for open positions
  const [tradesPage, setTradesPage] = useState(1);
  const TRADES_PAGE_SIZE = 10;

  const openTradesQuery = useQuery({
    queryKey: ["open-trades-desk", tradesPage],
    queryFn: () =>
      fetchOpenTrades({
        data: {
          status: "open",
          limit: TRADES_PAGE_SIZE,
          offset: (tradesPage - 1) * TRADES_PAGE_SIZE,
        },
      }),
    staleTime: 15_000,
  });

  const openTradesRaw = openTradesQuery.data as
    | { items: Trade[]; total: number; hasMore: boolean }
    | undefined;
  const openTrades = openTradesRaw?.items ?? [];
  const openTradesTotal = openTradesRaw?.total ?? 0;

  const saveMutation = useMutation({
    mutationFn: (data: {
      pair: string;
      direction: TradeDirection;
      entry_price: number;
      quantity?: number | null;
      stop_loss?: number | null;
      notes?: string | null;
      strategy?: string | null;
    }) => createTradeFn({ data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open-trades-desk"] });
      queryClient.invalidateQueries({ queryKey: ["open-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trade-stats"] });
      queryClient.invalidateQueries({ queryKey: ["equity-curve"] });
      queryClient.invalidateQueries({ queryKey: ["recent-closed-trades"] });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  const result = useMemo(() => {
    const bal = parseFloat(balance) || 0;
    const risk = parseFloat(riskPct) || 0;
    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const lotSize = LOT_SIZES[pair] || 100000;

    if (bal <= 0 || risk <= 0 || sl <= 0) return null;

    const riskAmount = bal * (risk / 100);
    const pipValue = pipSize * lotSize;
    const lots = riskAmount / (sl * pipValue);

    return {
      lots: lots.toFixed(2),
      riskAmount: riskAmount.toFixed(2),
      riskLevel: risk <= 1 ? "LOW" : risk <= 2 ? "MEDIUM" : "HIGH",
    };
  }, [balance, riskPct, slPips, pair]);

  const handleSaveAsTrade = useCallback(() => {
    if (!entryPrice || !pair) return;

    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const entry = parseFloat(entryPrice);

    // Calculate SL/TP from pips
    const slPrice = direction === "long" ? entry - sl * pipSize : entry + sl * pipSize;

    saveMutation.mutate({
      pair,
      direction,
      entry_price: entry,
      quantity: result ? parseFloat(result.lots) : null,
      stop_loss: sl > 0 ? Math.round(slPrice * 100000) / 100000 : null,
      notes: `Risk: ${riskPct}% · SL: ${slPips} pips`,
      strategy: "Risk Calculator",
    });
  }, [entryPrice, pair, slPips, direction, result, riskPct, saveMutation]);

  return (
    <div
      className="w-full"
      style={{
        background: "#0A0E1A",
        color: "#F0F4FC",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      {/* AI Coach Overlay */}
      {showCoach && entryPrice && (
        <CoachOverlay
          token={pair}
          action={direction === "long" ? "buy" : "sell"}
          amount={parseFloat(balance) * (parseFloat(riskPct) / 100)}
          chain={"forex"}
          currentPrice={parseFloat(entryPrice)}
          onClose={() => setShowCoach(false)}
        />
      )}

      {/* Governor Risk Panel */}
      {showGovernor && entryPrice && (
        <GovernorRiskPanel
          action={direction === "long" ? "buy" : "sell"}
          token={pair}
          amount={parseFloat(balance) * (parseFloat(riskPct) / 100)}
          currentPrice={parseFloat(entryPrice)}
          portfolioValue={parseFloat(balance) || 10000}
          onClose={() => setShowGovernor(false)}
        />
      )}
      <div className="flex items-center gap-3">
        <div
          className="size-10 rounded-xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #3B82F6, #2563EB)", borderRadius: "12px" }}
        >
          <LayoutDashboard className="size-5" style={{ color: "#fff" }} />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">
            {t("tradeDesk.tradeDesk")}
          </h1>
          <div className="mt-1" style={labelStyle}>
            {t("tradeDesk.institutionalExecution")}
          </div>
        </div>
      </div>

      {/* RISK CALCULATOR */}
      <div className="p-5" style={{ ...card, marginTop: "24px", borderLeft: "4px solid #3B82F6" }}>
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-4" style={{ color: "#3B82F6" }} />
          <h2 style={labelStyle}>{t("tradeDesk.riskCalculator")}</h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="col-span-2 flex flex-col gap-1.5">
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
          className="p-4 rounded-xl text-center"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "12px",
          }}
        >
          <div className="mb-1" style={{ ...labelStyle }}>
            {t("tradeDesk.recommendedLotSize")}
          </div>
          <div className="text-3xl font-bold mb-2" style={{ ...mono, color: "#3B82F6" }}>
            {result ? result.lots : "0.00"}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-bold" style={{ ...mono, color: "#7B8BA8" }}>
              Risk: ${result?.riskAmount || "0.00"}
            </span>
            {result && (
              <span
                className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase"
                style={{
                  background:
                    result.riskLevel === "LOW"
                      ? "rgba(34,197,94,0.15)"
                      : result.riskLevel === "MEDIUM"
                        ? "rgba(245,158,11,0.15)"
                        : "rgba(239,68,68,0.15)",
                  color:
                    result.riskLevel === "LOW"
                      ? "#22C55E"
                      : result.riskLevel === "MEDIUM"
                        ? "#F59E0B"
                        : "#EF4444",
                }}
              >
                {result.riskLevel === "LOW"
                  ? t("tradeDesk.lowRisk")
                  : result.riskLevel === "MEDIUM"
                    ? t("tradeDesk.mediumRisk")
                    : t("tradeDesk.highRisk")}
              </span>
            )}
          </div>
        </div>

        {/* ── SAVE AS TRADE ── */}
        <div
          style={{
            marginTop: "16px",
            paddingTop: "16px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Save className="size-3.5" style={{ color: "#3B82F6" }} />
            <span style={labelStyle}>Save as Trade</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Direction */}
            <div className="flex flex-col gap-1.5">
              <label style={labelStyle}>Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setDirection("long")}
                  className="h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                  style={{
                    background:
                      direction === "long" ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)",
                    border:
                      direction === "long"
                        ? "1px solid rgba(34,197,94,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    color: direction === "long" ? "#22C55E" : "#7B8BA8",
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
                      direction === "short" ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
                    border:
                      direction === "short"
                        ? "1px solid rgba(239,68,68,0.4)"
                        : "1px solid rgba(255,255,255,0.06)",
                    color: direction === "short" ? "#EF4444" : "#7B8BA8",
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

          <div className="flex gap-2">
            <button
              onClick={handleSaveAsTrade}
              disabled={!entryPrice || saveMutation.isPending}
              className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all"
              style={{
                background:
                  entryPrice && !saveMutation.isPending
                    ? saveSuccess
                      ? "rgba(34,197,94,0.2)"
                      : "linear-gradient(135deg, #3B82F6, #2563EB)"
                    : "rgba(255,255,255,0.05)",
                color: saveSuccess
                  ? "#22C55E"
                  : entryPrice && !saveMutation.isPending
                    ? "#fff"
                    : "#7B8BA8",
                border: saveSuccess ? "1px solid rgba(34,197,94,0.4)" : "none",
                opacity: !entryPrice || saveMutation.isPending ? 0.5 : 1,
              }}
            >
              {saveMutation.isPending ? (
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
            <button
              onClick={() => {
                setShowCoach(!showCoach);
                setShowGovernor(false);
              }}
              disabled={!entryPrice}
              className="flex items-center justify-center gap-1 h-10 px-3 rounded-lg text-xs font-bold transition-all"
              style={{
                background: showCoach ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.05)",
                border: showCoach
                  ? "1px solid rgba(56,189,248,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: showCoach ? "#38BDF8" : "#7B8BA8",
                opacity: !entryPrice ? 0.5 : 1,
              }}
              title="AI Coach — Get coaching feedback"
            >
              <MessageSquare className="size-3.5" />
              Coach
            </button>
            <button
              onClick={() => {
                setShowGovernor(!showGovernor);
                setShowCoach(false);
              }}
              disabled={!entryPrice}
              className="flex items-center justify-center gap-1 h-10 px-3 rounded-lg text-xs font-bold transition-all"
              style={{
                background: showGovernor ? "rgba(245,158,11,0.15)" : "rgba(255,255,255,0.05)",
                border: showGovernor
                  ? "1px solid rgba(245,158,11,0.4)"
                  : "1px solid rgba(255,255,255,0.06)",
                color: showGovernor ? "#F59E0B" : "#7B8BA8",
                opacity: !entryPrice ? 0.5 : 1,
              }}
              title="Risk Governor — Assess trade risk"
            >
              <Shield className="size-3.5" />
              Risk
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE POSITIONS */}
      <div className="flex flex-col gap-3" style={{ marginTop: "24px" }}>
        <div className="flex items-center gap-2 px-1">
          <Activity className="size-4" style={{ color: "#7B8BA8" }} />
          <h2 style={labelStyle}>{t("tradeDesk.activePositions")}</h2>
        </div>

        {openTrades.length === 0 ? (
          <div className="p-6 text-center" style={card}>
            <div
              className="size-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "rgba(59,130,246,0.1)" }}
            >
              <LayoutDashboard className="size-6" style={{ color: "#3B82F6" }} />
            </div>
            <p className="text-sm font-medium" style={{ color: "#7B8BA8" }}>
              {t("tradeDesk.noPositions")}
            </p>
            <p className="text-xs mt-1" style={{ color: "#4A5568" }}>
              Use "Save as Trade" above to log your first position.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {openTrades.map((trade) => (
              <div key={trade.id} className="p-3 flex items-center gap-3" style={card}>
                <div
                  className="size-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background:
                      trade.direction === "long" ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
                  }}
                >
                  {trade.direction === "long" ? (
                    <ArrowUpRight className="size-4" style={{ color: "#22C55E" }} />
                  ) : (
                    <ArrowDownRight className="size-4" style={{ color: "#EF4444" }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={mono}>
                      {trade.pair}
                    </span>
                    <span
                      className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{
                        background:
                          trade.direction === "long"
                            ? "rgba(34,197,94,0.15)"
                            : "rgba(239,68,68,0.15)",
                        color: trade.direction === "long" ? "#22C55E" : "#EF4444",
                      }}
                    >
                      {trade.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px]" style={{ ...mono, color: "#7B8BA8" }}>
                    Entry: {trade.entry_price}
                    {trade.stop_loss && ` · SL: ${trade.stop_loss}`}
                    {trade.take_profit && ` · TP: ${trade.take_profit}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px]" style={{ ...mono, color: "#7B8BA8" }}>
                    {new Date(trade.entry_date).toLocaleDateString()}
                  </div>
                  {trade.quantity && (
                    <div className="text-[10px]" style={{ ...mono, color: "#7B8BA8" }}>
                      {trade.quantity} lots
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {openTradesTotal > TRADES_PAGE_SIZE && (
          <PaginationBar
            page={tradesPage}
            pageSize={TRADES_PAGE_SIZE}
            total={openTradesTotal}
            onPageChange={setTradesPage}
          />
        )}
      </div>
    </div>
  );
}
