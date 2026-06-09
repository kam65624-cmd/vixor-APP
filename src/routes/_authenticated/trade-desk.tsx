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
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/shared/i18n";
import { createTrade, listTrades } from "@/domains/trades/functions";
import type { Trade, TradeDirection } from "@/domains/trades/types";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { cn } from "@/shared/utils";

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

  const createTradeFn = useStableServerFn(createTrade);
  const fetchOpenTrades = useStableServerFn(listTrades);

  const openTradesQuery = useQuery({
    queryKey: ["open-trades-desk"],
    queryFn: () => fetchOpenTrades({ data: { status: "open", limit: 50 } }),
    staleTime: 15_000,
  });

  const openTrades = (openTradesQuery.data ?? []) as Trade[];

  const saveMutation = useMutation({
    mutationFn: (data: { pair: string; direction: TradeDirection; entry_price: number; quantity?: number | null; stop_loss?: number | null; notes?: string | null; strategy?: string | null }) => createTradeFn({ data }),
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
    const slPrice = direction === "long"
      ? entry - sl * pipSize
      : entry + sl * pipSize;

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
    <div className="space-y-6 pb-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl gradient-primary flex items-center justify-center glow-primary">
          <LayoutDashboard className="size-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight leading-none">
            {t("tradeDesk.tradeDesk")}
          </h1>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">
            {t("tradeDesk.institutionalExecution")}
          </div>
        </div>
      </div>

      {/* RISK CALCULATOR */}
      <div className="vixor-card p-5 border-l-4 border-l-primary">
        <div className="flex items-center gap-2 mb-4">
          <Calculator className="size-4 text-primary" />
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("tradeDesk.riskCalculator")}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="col-span-2 space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              {t("tradeDesk.tradingPair")}
            </label>
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value)}
              className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors cursor-pointer"
            >
              {PAIRS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              {t("tradeDesk.balance")} ($)
            </label>
            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              {t("tradeDesk.riskPct")}
            </label>
            <input
              type="number"
              step="0.1"
              value={riskPct}
              onChange={(e) => setRiskPct(e.target.value)}
              className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted-foreground">
              {t("tradeDesk.stopLossPips")}
            </label>
            <input
              type="number"
              value={slPips}
              onChange={(e) => setSlPips(e.target.value)}
              className="w-full h-12 px-3 bg-card-hover border border-border rounded-xl text-sm font-mono outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="bg-card-hover p-4 rounded-xl border border-border text-center">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            {t("tradeDesk.recommendedLotSize")}
          </div>
          <div className="text-3xl font-bold font-mono text-primary mb-2">
            {result ? result.lots : "0.00"}
          </div>
          <div className="flex items-center justify-center gap-3">
            <span className="text-xs font-mono text-muted-foreground font-bold">
              Risk: ${result?.riskAmount || "0.00"}
            </span>
            {result && (
              <span
                className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${result.riskLevel === "LOW" ? "bg-bullish/10 text-bullish" : result.riskLevel === "MEDIUM" ? "bg-neutral-wait/10 text-neutral-wait" : "bg-bearish/10 text-bearish"}`}
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
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <Save className="size-3.5 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Save as Trade
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            {/* Direction */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Direction</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setDirection("long")}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors",
                    direction === "long"
                      ? "bg-bullish/15 border-bullish/40 text-bullish"
                      : "bg-card-hover border-border text-muted-foreground hover:border-bullish/30",
                  )}
                >
                  <ArrowUpRight className="size-3" />
                  Long
                </button>
                <button
                  onClick={() => setDirection("short")}
                  className={cn(
                    "h-10 rounded-lg border text-xs font-bold uppercase flex items-center justify-center gap-1 transition-colors",
                    direction === "short"
                      ? "bg-bearish/15 border-bearish/40 text-bearish"
                      : "bg-card-hover border-border text-muted-foreground hover:border-bearish/30",
                  )}
                >
                  <ArrowDownRight className="size-3" />
                  Short
                </button>
              </div>
            </div>

            {/* Entry Price */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-muted-foreground">Entry Price</label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="0.00"
                className="w-full h-10 px-3 bg-card-hover border border-border rounded-lg text-sm font-mono outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <button
            onClick={handleSaveAsTrade}
            disabled={!entryPrice || saveMutation.isPending}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 h-10 rounded-lg text-xs font-bold transition-all",
              entryPrice && !saveMutation.isPending
                ? "gradient-primary text-primary-foreground glow-primary active:scale-[0.98]"
                : "bg-muted text-muted-foreground cursor-not-allowed",
              saveSuccess && "bg-bullish/20 text-bullish border border-bullish/40",
            )}
          >
            {saveMutation.isPending ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saveSuccess ? (
              <>
                <Target className="size-3.5" />
                Trade Saved!
              </>
            ) : (
              <>
                <Save className="size-3.5" />
                Save as Trade
              </>
            )}
          </button>
        </div>
      </div>

      {/* ACTIVE POSITIONS — Real data from trades table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("tradeDesk.activePositions")}
          </h2>
        </div>

        {openTrades.length === 0 ? (
          <div className="vixor-card p-6 text-center">
            <div className="size-14 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-3">
              <LayoutDashboard className="size-6 text-info" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{t("tradeDesk.noPositions")}</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Use "Save as Trade" above to log your first position.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {openTrades.map((trade) => (
              <div
                key={trade.id}
                className="vixor-card p-3 flex items-center gap-3"
              >
                <div className={cn(
                  "size-9 rounded-lg flex items-center justify-center shrink-0",
                  trade.direction === "long" ? "bg-bullish/10" : "bg-bearish/10",
                )}>
                  {trade.direction === "long" ? (
                    <ArrowUpRight className="size-4 text-bullish" />
                  ) : (
                    <ArrowDownRight className="size-4 text-bearish" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono">{trade.pair}</span>
                    <span className={cn(
                      "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded",
                      trade.direction === "long"
                        ? "bg-bullish/15 text-bullish"
                        : "bg-bearish/15 text-bearish",
                    )}>
                      {trade.direction.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-mono">
                    Entry: {trade.entry_price}
                    {trade.stop_loss && ` · SL: ${trade.stop_loss}`}
                    {trade.take_profit && ` · TP: ${trade.take_profit}`}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-muted-foreground font-mono">
                    {new Date(trade.entry_date).toLocaleDateString()}
                  </div>
                  {trade.quantity && (
                    <div className="text-[10px] text-muted-foreground font-mono">
                      {trade.quantity} lots
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
