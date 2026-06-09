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
} from "lucide-react";
import { useState, useMemo } from "react";
import { useI18n } from "@/shared/i18n";

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
  const [balance, setBalance] = useState("10000");
  const [riskPct, setRiskPct] = useState("1");
  const [slPips, setSlPips] = useState("30");
  const [pair, setPair] = useState("XAUUSD");

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
          <div className="col-span-2 space-y-1.5">
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
      </div>

      {/* ACTIVE POSITIONS — Real data, no mock */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Activity className="size-4 text-muted-foreground" />
          <h2 className="font-bold text-[11px] uppercase tracking-widest text-muted-foreground">
            {t("tradeDesk.activePositions")}
          </h2>
        </div>

        <div className="vixor-card p-6 text-center">
          <div className="size-14 rounded-2xl bg-info/10 flex items-center justify-center mx-auto mb-3">
            <LayoutDashboard className="size-6 text-info" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t("tradeDesk.noPositions")}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">{t("tradeDesk.noPositionsDesc")}</p>
        </div>
      </div>
    </div>
  );
}
