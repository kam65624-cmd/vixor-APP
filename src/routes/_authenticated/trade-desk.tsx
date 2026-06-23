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
import {
  PageLayout,
  THEME,
  ScrollArea,
  Badge,
  EmptyState,
  SectionTitle,
} from "@/components/vixor/PageLayout";

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
  background: THEME.surface,
  border: `1px solid ${THEME.border}`,
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
  color: THEME.textSecondary,
};
const inputStyle = {
  background: THEME.rowHoverStrong,
  border: `1px solid ${THEME.border}`,
  color: THEME.text,
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
    <PageLayout
      title={t("tradeDesk.tradeDesk")}
      badge="TRADE DESK"
      badgeColor={THEME.green}
      description={t("tradeDesk.institutionalExecution")}
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
            borderLeft: `4px solid ${THEME.green}`,
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
            <Calculator className="size-4" style={{ color: THEME.green }} />
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
              background: THEME.rowHover,
              border: `1px solid ${THEME.border}`,
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
                color: THEME.green,
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
                  color: THEME.textSecondary,
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
                      ? THEME.green
                      : result.riskLevel === "MEDIUM"
                        ? THEME.amber
                        : THEME.red
                  }
                  small
                />
              )}
            </div>
          </div>

          {/* ── SAVE AS TRADE ── */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "16px",
              borderTop: `1px solid ${THEME.border}`,
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
              <Save className="size-3.5" style={{ color: THEME.green }} />
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
                      background: direction === "long" ? `${THEME.green}20` : THEME.rowHoverStrong,
                      border: `1px solid ${
                        direction === "long" ? `${THEME.green}66` : THEME.border
                      }`,
                      color: direction === "long" ? THEME.green : THEME.textSecondary,
                    }}
                  >
                    <ArrowUpRight className="size-3" />
                    Long
                  </button>
                  <button
                    onClick={() => setDirection("short")}
                    className="h-10 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors"
                    style={{
                      background: direction === "short" ? `${THEME.red}20` : THEME.rowHoverStrong,
                      border: `1px solid ${
                        direction === "short" ? `${THEME.red}66` : THEME.border
                      }`,
                      color: direction === "short" ? THEME.red : THEME.textSecondary,
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

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={handleSaveAsTrade}
                disabled={!entryPrice || saveMutation.isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all"
                style={{
                  background:
                    entryPrice && !saveMutation.isPending
                      ? saveSuccess
                        ? `${THEME.green}30`
                        : THEME.green
                      : THEME.rowHoverStrong,
                  color: saveSuccess
                    ? THEME.green
                    : entryPrice && !saveMutation.isPending
                      ? THEME.text
                      : THEME.textSecondary,
                  border: saveSuccess ? `1px solid ${THEME.green}66` : "none",
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
                  background: showCoach ? `${THEME.cyan}20` : THEME.rowHoverStrong,
                  border: `1px solid ${showCoach ? `${THEME.cyan}66` : THEME.border}`,
                  color: showCoach ? THEME.cyan : THEME.textSecondary,
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
                className="flex items-center justify-center gap-1 h-10 px-3 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: showGovernor ? `${THEME.amber}20` : THEME.rowHoverStrong,
                  border: `1px solid ${showGovernor ? `${THEME.amber}66` : THEME.border}`,
                  color: showGovernor ? THEME.amber : THEME.textSecondary,
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
              message='Use "Save as Trade" above to log your first position.'
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
                        trade.direction === "long" ? `${THEME.green}18` : `${THEME.red}18`,
                    }}
                  >
                    {trade.direction === "long" ? (
                      <ArrowUpRight className="size-4" style={{ color: THEME.green }} />
                    ) : (
                      <ArrowDownRight className="size-4" style={{ color: THEME.red }} />
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
                        color={trade.direction === "long" ? THEME.green : THEME.red}
                        small
                      />
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        ...mono,
                        color: THEME.textSecondary,
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
                        color: THEME.textSecondary,
                      }}
                    >
                      {new Date(trade.entry_date).toLocaleDateString()}
                    </div>
                    {trade.quantity && (
                      <div
                        style={{
                          fontSize: "10px",
                          ...mono,
                          color: THEME.textSecondary,
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
    </PageLayout>
  );
}
