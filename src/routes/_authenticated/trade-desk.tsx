import { createFileRoute } from "@tanstack/react-router";
import {
  Target,
  Shield,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  Save,
  Loader2,
  MessageSquare,
  Zap,
  X,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { withAlpha } from "@/shared/color-utils";
import { createTrade, listTrades } from "@/domains/trades/functions";
import type { Trade, TradeDirection } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useSound } from "@/shared/hooks/use-sound";
import { PaginationBar } from "@/components/vixor/PaginationBar";
import { CoachOverlay } from "@/components/vixor/CoachOverlay";
import { GovernorRiskPanel } from "@/components/vixor/GovernorRiskPanel";
import {
  PageLayout, 
  ScrollArea,
  Badge,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";
import { getExchangeStatus, executeTrade } from "@/domains/trading/gateway/functions";
import type { ExchangeStatus, ExecuteTradeResult } from "@/domains/trading/gateway/functions";

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
  background: "var(--color-card)",
  border: `1px solid ${"var(--color-border)"}`,
  borderRadius: "12px",
};
const mono = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const labelStyle = {
  fontSize: "10px",
  fontWeight: 700,
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "var(--color-muted-foreground)",
};
const inputStyle = {
  background: "rgba(124,155,196,0.06)",
  border: `1px solid ${"var(--color-border)"}`,
  color: "var(--color-foreground)",
  outline: "none",
} as React.CSSProperties;

function TradeDesk() {
  const { t } = useI18n();
  const { play } = useSound();
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

  // ── Execution state ──
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [execResult, setExecResult] = useState<ExecuteTradeResult | null>(null);

  const createTradeFn = useStableServerFn(createTrade);
  const fetchOpenTrades = useStableServerFn(listTrades);
  const fetchExchangeStatus = useStableServerFn(getExchangeStatus);
  const executeTradeFn = useStableServerFn(executeTrade);

  // ── Exchange status query ──
  const exchangeQuery = useQuery({
    queryKey: ["exchange-status"],
    queryFn: () => fetchExchangeStatus({}),
    staleTime: 60_000,
  });

  const exchangeStatus = exchangeQuery.data as ExchangeStatus | undefined;

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
      play("success");
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  });

  // ── Execute trade mutation ──
  const executeMutation = useMutation({
    mutationFn: (data: {
      exchangeId: string;
      symbol: string;
      side: "buy" | "sell";
      quantity: number;
      price?: number;
      orderType: "market" | "limit" | "stop_loss" | "take_profit";
      stopLoss?: number | null;
      takeProfit?: number | null;
      pair: string;
      direction: "long" | "short";
      notes?: string | null;
      strategy?: string | null;
    }) => executeTradeFn({ data }),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["open-trades-desk"] });
      queryClient.invalidateQueries({ queryKey: ["open-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trade-stats"] });
      queryClient.invalidateQueries({ queryKey: ["equity-curve"] });
      setExecResult(result);
      play("trade");
    },
    onError: (error: Error) => {
      setExecResult({
        success: false,
        error: error.message,
        isPaperTrade: !exchangeStatus?.connected,
      });
      play("error");
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

  // ── Execution helpers ──
  const isExchangeConnected = exchangeStatus?.connected ?? false;
  const exchangeName = exchangeStatus?.exchangeName ?? "";
  const isPaperMode = !isExchangeConnected;

  const handleOpenExecuteDialog = useCallback(() => {
    if (!entryPrice || !pair) return;
    setExecResult(null);
    setShowConfirmDialog(true);
  }, [entryPrice, pair]);

  const handleConfirmExecution = useCallback(() => {
    if (!entryPrice || !pair) return;

    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const entry = parseFloat(entryPrice);
    const slPrice = sl > 0
      ? (direction === "long" ? entry - sl * pipSize : entry + sl * pipSize)
      : null;
    const tpPrice = sl > 0
      ? (direction === "long" ? entry + sl * 2 * pipSize * sl / sl : null) // No TP calc needed — use SL mirror
      : null;

    // Map symbol format for exchange (XAUUSD → XAUUSDT, EURUSD → EURUSDT, etc.)
    const exchangeSymbol = pair.replace("USD", "USDT");

    executeMutation.mutate({
      exchangeId: exchangeStatus?.exchangeId ?? "",
      symbol: exchangeSymbol,
      side: direction === "long" ? "buy" : "sell",
      quantity: result ? parseFloat(result.lots) : 0.01,
      price: entry,
      orderType: "market",
      stopLoss: slPrice,
      takeProfit: null,
      pair,
      direction,
      notes: `Risk: ${riskPct}% · SL: ${slPips} pips`,
      strategy: "Trade Desk",
    });
  }, [entryPrice, pair, slPips, direction, result, riskPct, executeMutation, exchangeStatus]);

  const handleCloseDialog = useCallback(() => {
    if (executeMutation.isPending) return; // Don't close while executing
    setShowConfirmDialog(false);
    // Clear result after a short delay so user sees it before dialog closes
    setTimeout(() => setExecResult(null), 300);
  }, [executeMutation.isPending]);

  // Computed order summary for the dialog
  const orderSummary = useMemo(() => {
    if (!entryPrice) return null;
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const slPrice = sl > 0 ? (direction === "long" ? entry - sl * pipSize : entry + sl * pipSize) : null;
    const estimatedCost = result ? parseFloat(result.lots) * entry : 0;
    return {
      entry,
      slPrice: slPrice ? Math.round(slPrice * 100000) / 100000 : null,
      quantity: result?.lots ?? "—",
      estimatedCost: estimatedCost > 0 ? `$${estimatedCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "—",
    };
  }, [entryPrice, pair, direction, slPips, result]);

  return (
    <PageLayout
      title={t("tradeDesk.tradeDesk")}
      badge="TRADE DESK"
      badgeColor={"var(--color-bullish)"}
      description={t("tradeDesk.institutionalExecution")}
      banner={
        /* Exchange Status Pill */
        <div style={{ padding: "6px 16px" }}>
          <button
            onClick={() => { window.location.href = "/settings#exchanges"; }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              border: `1px solid ${isExchangeConnected ? `${"var(--color-bullish)"}44` : "var(--color-border)"}`,
              background: isExchangeConnected ? `rgba(14,203,129,0.08)` : "rgba(124,155,196,0.04)",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              color: isExchangeConnected ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              transition: "all 0.15s ease",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isExchangeConnected ? "var(--color-bullish)" : "var(--color-muted-foreground)",
                flexShrink: 0,
              }}
            />
            {isExchangeConnected
              ? `${exchangeName} Connected`
              : "No Exchange"}
            <ExternalLink className="size-3" style={{ opacity: 0.5 }} />
          </button>
        </div>
      }
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

      <ScrollArea>
        {/* RISK CALCULATOR */}
        <div
          style={{
            ...card,
            margin: "16px 16px 0",
            padding: "20px",
            borderLeft: `4px solid ${"var(--color-bullish)"}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginBottom: "16px",
            }}
          >
            <Calculator className="size-4" style={{ color: "var(--color-bullish)" }} />
            <h2 style={labelStyle}>{t("tradeDesk.riskCalculator")}</h2>
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
              padding: "16px",
              borderRadius: "12px",
              textAlign: "center",
              background: "rgba(124,155,196,0.03)",
              border: `1px solid ${"var(--color-border)"}`,
            }}
          >
            <div style={{ ...labelStyle, marginBottom: "4px" }}>
              {t("tradeDesk.recommendedLotSize")}
            </div>
            <div
              style={{
                fontSize: "30px",
                fontWeight: 700,
                ...mono,
                color: "var(--color-bullish)",
                marginBottom: "8px",
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
                      background: direction === "long" ? `${"var(--color-bullish)"}20` : "rgba(124,155,196,0.06)",
                      border: `1px solid ${
                        direction === "long" ? `${"var(--color-bullish)"}66` : "var(--color-border)"
                      }`,
                      color: direction === "long" ? "var(--color-bullish)" : "var(--color-muted-foreground)",
                    }}
                  >
                    <ArrowUpRight className="size-3" />
                    Long
                  </button>
                  <button
                    onClick={() => setDirection("short")}
                    className="h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                    style={{
                      background: direction === "short" ? `${"var(--color-bearish)"}20` : "rgba(124,155,196,0.06)",
                      border: `1px solid ${
                        direction === "short" ? `${"var(--color-bearish)"}66` : "var(--color-border)"
                      }`,
                      color: direction === "short" ? "var(--color-bearish)" : "var(--color-muted-foreground)",
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
                onClick={handleSaveAsTrade}
                disabled={!entryPrice || saveMutation.isPending}
                className="flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all"
                style={{
                  background:
                    entryPrice && !saveMutation.isPending
                      ? saveSuccess
                        ? `rgba(14,203,129,0.19)`
                        : "var(--color-bullish)"
                      : "rgba(124,155,196,0.06)",
                  color: saveSuccess
                    ? "var(--color-bullish)"
                    : entryPrice && !saveMutation.isPending
                      ? "var(--color-foreground)"
                      : "var(--color-muted-foreground)",
                  border: saveSuccess ? `1px solid ${"var(--color-bullish)"}66` : "none",
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

              {/* Execute on Exchange (right half) — more prominent */}
              <button
                onClick={handleOpenExecuteDialog}
                disabled={!entryPrice}
                className="flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all"
                style={{
                  background: entryPrice
                    ? "linear-gradient(135deg, var(--color-bullish), rgba(14,203,129,0.70))"
                    : "rgba(124,155,196,0.06)",
                  color: entryPrice ? "var(--color-foreground)" : "var(--color-muted-foreground)",
                  boxShadow: entryPrice
                    ? "0 2px 12px rgba(14,203,129,0.30)"
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
                  background: showCoach ? `${"var(--color-info)"}20` : "rgba(124,155,196,0.06)",
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
                  background: showGovernor ? `${"var(--color-neutral-wait)"}20` : "rgba(124,155,196,0.06)",
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

        {/* ACTIVE POSITIONS */}
        <div style={{ marginTop: "24px" }}>
          <SectionTitle title={t("tradeDesk.activePositions")} count={openTrades.length} />

          {openTrades.length === 0 ? (
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
                gap: "8px",
                padding: "0 16px 16px",
              }}
            >
              {openTrades.map((trade) => (
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
                        trade.direction === "long" ? `rgba(14,203,129,0.10)` : `rgba(246,70,93,0.10)`,
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
                        color={trade.direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)"}
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

          {openTradesTotal > TRADES_PAGE_SIZE && (
            <div style={{ padding: "0 16px 16px" }}>
              <PaginationBar
                page={tradesPage}
                pageSize={TRADES_PAGE_SIZE}
                total={openTradesTotal}
                onPageChange={setTradesPage}
              />
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ═══ EXECUTION CONFIRMATION DIALOG ═══ */}
      {showConfirmDialog && (
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
            if (e.target === e.currentTarget) handleCloseDialog();
          }}
        >
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0, 0, 0, 0.7)",
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
              boxShadow: "0 24px 48px rgba(0, 0, 0, 0.5)",
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
                      ? `rgba(245,158,11,0.15)`
                      : `rgba(14,203,129,0.15)`,
                  }}
                >
                  <Zap
                    className="size-4"
                    style={{ color: isPaperMode ? "var(--color-neutral-wait)" : "var(--color-bullish)" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}>
                    {execResult ? "Execution Result" : "Confirm Execution"}
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--color-muted-foreground)", marginTop: "1px" }}>
                    {isPaperMode ? "Paper Trading Mode" : `via ${exchangeName}`}
                  </div>
                </div>
              </div>
              {!executeMutation.isPending && (
                <button
                  onClick={handleCloseDialog}
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "8px",
                    border: "none",
                    background: "rgba(124,155,196,0.06)",
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
              {!execResult && !executeMutation.isPending && (
                <>
                  {/* Order Summary */}
                  <div
                    style={{
                      padding: "12px",
                      borderRadius: "10px",
                      background: "rgba(124,155,196,0.03)",
                      border: `1px solid ${"var(--color-border)"}`,
                      marginBottom: "16px",
                    }}
                  >
                    {/* Direction row */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Direction</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        {direction === "long" ? (
                          <ArrowUpRight className="size-3" style={{ color: "var(--color-bullish)" }} />
                        ) : (
                          <ArrowDownRight className="size-3" style={{ color: "var(--color-bearish)" }} />
                        )}
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            ...mono,
                            color: direction === "long" ? "var(--color-bullish)" : "var(--color-bearish)",
                          }}
                        >
                          {direction.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Pair */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Pair</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, ...mono, color: "var(--color-foreground)" }}>
                        {pair}
                      </span>
                    </div>

                    {/* Entry */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Entry Price</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, ...mono, color: "var(--color-foreground)" }}>
                        {orderSummary?.entry ?? "—"}
                      </span>
                    </div>

                    {/* Quantity */}
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                      <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Quantity</span>
                      <span style={{ fontSize: "13px", fontWeight: 700, ...mono, color: "var(--color-foreground)" }}>
                        {orderSummary?.quantity ?? "—"} lots
                      </span>
                    </div>

                    {/* SL */}
                    {orderSummary?.slPrice && (
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                        <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Stop Loss</span>
                        <span style={{ fontSize: "13px", fontWeight: 700, ...mono, color: "var(--color-bearish)" }}>
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
                      <span style={{ ...labelStyle, color: "var(--color-muted-foreground)" }}>Est. Cost</span>
                      <span style={{ fontSize: "13px", fontWeight: 800, ...mono, color: "var(--color-foreground)" }}>
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
                      background: isPaperMode
                        ? `rgba(245,158,11,0.08)`
                        : `rgba(14,203,129,0.08)`,
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
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "var(--color-muted-foreground)" }}>
                      {isPaperMode
                        ? "No exchange connected — will use Paper Trading (DummyAdapter)"
                        : `Order will be sent to ${exchangeName}${exchangeStatus?.maskedKey ? ` (${exchangeStatus.maskedKey})` : ""}`}
                    </span>
                  </div>
                </>
              )}

              {/* Loading state */}
              {executeMutation.isPending && (
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
              {execResult && !executeMutation.isPending && (
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
                          background: `rgba(14,203,129,0.15)`,
                        }}
                      >
                        <CheckCircle className="size-6" style={{ color: "var(--color-bullish)" }} />
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}>
                        {execResult.isPaperTrade ? "Paper Trade Executed" : "Order Submitted"}
                      </div>
                      {execResult.orderResult && (
                        <div
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            background: "rgba(124,155,196,0.03)",
                            border: `1px solid ${"var(--color-border)"}`,
                            width: "100%",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                            <span style={{ ...labelStyle }}>Order ID</span>
                            <span style={{ fontSize: "11px", ...mono, color: "var(--color-foreground)" }}>
                              {execResult.orderResult.id}
                            </span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
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
                            <span style={{ fontSize: "11px", ...mono, color: "var(--color-foreground)" }}>
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
                          background: `rgba(246,70,93,0.15)`,
                        }}
                      >
                        <AlertCircle className="size-6" style={{ color: "var(--color-bearish)" }} />
                      </div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--color-foreground)" }}>
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
            {!execResult && !executeMutation.isPending && (
              <div
                style={{
                  padding: "0 16px 16px",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <button
                  onClick={handleCloseDialog}
                  className="flex-1 h-11 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: "rgba(124,155,196,0.06)",
                    border: `1px solid ${"var(--color-border)"}`,
                    color: "var(--color-muted-foreground)",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmExecution}
                  className="flex-1 h-11 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
                  style={{
                    background: isPaperMode
                      ? "linear-gradient(135deg, var(--color-neutral-wait), rgba(245,158,11,0.70))"
                      : "linear-gradient(135deg, var(--color-bullish), rgba(14,203,129,0.70))",
                    color: "var(--color-foreground)",
                    boxShadow: `0 2px 12px ${withAlpha(isPaperMode ? "var(--color-neutral-wait)" : "var(--color-bullish)", 0.30)}`,
                    border: "none",
                  }}
                >
                  <Zap className="size-3.5" />
                  {isPaperMode ? "Confirm Paper Trade" : "Confirm Execution"}
                </button>
              </div>
            )}

            {/* Post-result close button */}
            {execResult && !executeMutation.isPending && (
              <div style={{ padding: "0 16px 16px" }}>
                <button
                  onClick={handleCloseDialog}
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
      )}
    </PageLayout>
  );
}