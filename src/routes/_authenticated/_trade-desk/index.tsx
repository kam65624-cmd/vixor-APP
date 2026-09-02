import { useSearch } from "@tanstack/react-router";
import { ExternalLink } from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { createTrade, listTrades } from "@/domains/trades/functions";
import type { Trade, TradeDirection } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useSound } from "@/shared/hooks/use-sound";
import { CoachOverlay } from "@/components/vixor/CoachOverlay";
import { GovernorRiskPanel } from "@/components/vixor/GovernorRiskPanel";
import { PageLayout, ScrollArea } from "@/components/vixor/PageLayout";
import { getExchangeStatus, executeTrade } from "@/domains/trading/gateway/functions";
import type { ExchangeStatus, ExecuteTradeResult } from "@/domains/trading/gateway/functions";
import { PIP_SIZES, LOT_SIZES } from "./constants";
import type { RiskCalcResult, OrderSummary } from "./constants";
import { RiskCalculator } from "./RiskCalculator";
import { ActivePositions } from "./ActivePositions";
import { ExecutionDialog } from "./ExecutionDialog";
import { SwapPanel } from "./SwapPanel";

// ── Main component ──

export function TradeDesk() {
  const search = useSearch({ from: "/_authenticated/trade-desk" }) as {
    symbol?: string;
    price?: string;
    direction?: string;
  };
  const { t } = useI18n();
  const { play } = useSound();
  const queryClient = useQueryClient();
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [slPips, setSlPips] = useState("30");
  const [pair, setPair] = useState(search.symbol || "XAUUSD");
  const [direction, setDirection] = useState<TradeDirection>(
    (search.direction as TradeDirection) || "long",
  );
  const [entryPrice, setEntryPrice] = useState(search.price || "");
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
        },
      }),
    staleTime: 15_000,
  });

  const openTradesRaw = openTradesQuery.data as
    { items: Trade[]; total: number; hasMore: boolean } | undefined;
  const openTrades = openTradesRaw?.items ?? [];
  const openTradesTotal = openTradesRaw?.total ?? 0;

  const saveMutation = useMutation({
    mutationFn: (data: {
      pair: string;
      direction: TradeDirection;
      entry_price: number;
      amount: number;
      quantity?: number | null;
      stop_loss?: number | null;
      notes?: string | null;
      strategy?: string | null;
    }) =>
      createTradeFn({
        data: {
          pair: data.pair,
          direction: data.direction,
          entry_price: data.entry_price,
          amount: data.amount,
          stop_loss: data.stop_loss ?? undefined,
        },
      }),
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

  const result = useMemo((): RiskCalcResult | null => {
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
      amount: result ? parseFloat(result.lots) : (parseFloat(balance) * parseFloat(riskPct)) / 100,
      quantity: result ? parseFloat(result.lots) : null,
      stop_loss: sl > 0 ? Math.round(slPrice * 100000) / 100000 : null,
      notes: `Risk: ${riskPct}% · SL: ${slPips} pips`,
      strategy: "Risk Calculator",
    });
  }, [entryPrice, pair, slPips, direction, result, riskPct, balance, saveMutation]);

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
    const slPrice =
      sl > 0 ? (direction === "long" ? entry - sl * pipSize : entry + sl * pipSize) : null;
    const tpPrice =
      sl > 0
        ? direction === "long"
          ? entry + (sl * 2 * pipSize * sl) / sl
          : null // No TP calc needed — use SL mirror
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
  const orderSummary = useMemo((): OrderSummary | null => {
    if (!entryPrice) return null;
    const entry = parseFloat(entryPrice);
    const sl = parseFloat(slPips) || 0;
    const pipSize = PIP_SIZES[pair] || 0.0001;
    const slPrice =
      sl > 0 ? (direction === "long" ? entry - sl * pipSize : entry + sl * pipSize) : null;
    const estimatedCost = result ? parseFloat(result.lots) * entry : 0;
    return {
      entry,
      slPrice: slPrice ? Math.round(slPrice * 100000) / 100000 : null,
      quantity: result?.lots ?? "—",
      estimatedCost:
        estimatedCost > 0
          ? `$${estimatedCost.toLocaleString("en-US", { maximumFractionDigits: 2 })}`
          : "—",
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
            onClick={() => {
              window.location.href = "/settings#exchanges";
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 10px",
              borderRadius: "20px",
              border: `1px solid ${isExchangeConnected ? `${"var(--color-bullish)"}44` : "var(--color-border)"}`,
              background: isExchangeConnected
                ? `var(--bullish-bg)`
                : "color-mix(in srgb, var(--color-primary) 4%, transparent)",
              cursor: "pointer",
              fontSize: "11px",
              fontWeight: 600,
              color: isExchangeConnected ? "var(--color-bullish)" : "var(--color-muted-foreground)",
              transition: "all var(--transition-fast)",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: isExchangeConnected
                  ? "var(--color-bullish)"
                  : "var(--color-muted-foreground)",
                flexShrink: 0,
              }}
            />
            {isExchangeConnected ? `${exchangeName} Connected` : "No Exchange"}
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
        <RiskCalculator
          t={t}
          pair={pair}
          setPair={setPair}
          balance={balance}
          setBalance={setBalance}
          riskPct={riskPct}
          setRiskPct={setRiskPct}
          slPips={slPips}
          setSlPips={setSlPips}
          direction={direction}
          setDirection={setDirection}
          entryPrice={entryPrice}
          setEntryPrice={setEntryPrice}
          result={result}
          saveMutationPending={saveMutation.isPending}
          saveSuccess={saveSuccess}
          isPaperMode={isPaperMode}
          exchangeName={exchangeName}
          onSaveTrade={handleSaveAsTrade}
          onOpenExecute={handleOpenExecuteDialog}
          showCoach={showCoach}
          setShowCoach={setShowCoach}
          showGovernor={showGovernor}
          setShowGovernor={setShowGovernor}
        />

        <SwapPanel />

        <ActivePositions
          trades={openTrades}
          total={openTradesTotal}
          page={tradesPage}
          pageSize={TRADES_PAGE_SIZE}
          onPageChange={setTradesPage}
          t={t}
        />
      </ScrollArea>

      <ExecutionDialog
        open={showConfirmDialog}
        onClose={handleCloseDialog}
        execResult={execResult}
        isPending={executeMutation.isPending}
        isPaperMode={isPaperMode}
        exchangeName={exchangeName}
        exchangeStatus={exchangeStatus}
        direction={direction}
        pair={pair}
        orderSummary={orderSummary}
        onConfirm={handleConfirmExecution}
      />
    </PageLayout>
  );
}
