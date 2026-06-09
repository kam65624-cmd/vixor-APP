import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDailySignals, getUserStrategy, updateUserStrategy,
  generateDailySignals, createAlert,
} from "@/lib/vixor.functions";
import { useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Minus, Bell, Sparkles, Settings2,
  RefreshCw, Loader2, Target, Shield, Zap, BarChart3,
} from "lucide-react";
import { RecBadge, ConfidenceBar } from "@/components/vixor/atoms";
import { toTradingViewSymbol } from "@/components/vixor/TradingViewChart";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Daily Signals — Vixor" }] }),
  component: DailySignals,
});

const ALL_PAIRS = [
  "BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD", "GBP/JPY", "SOL/USDT",
  "GBP/USD", "USD/JPY", "AUD/USD", "BNB/USDT",
];

const TRADING_STYLES = [
  { id: "Scalping", icon: "⚡", desc: "Fast trades, small targets" },
  { id: "Day Trading", icon: "☀️", desc: "Intra-day, medium targets" },
  { id: "Swing Trading", icon: "🌊", desc: "Multi-day, large targets" },
];

const RISK_LEVELS = [
  { id: "LOW", label: "Low", color: "text-bullish" },
  { id: "MEDIUM", label: "Medium", color: "text-neutral-wait" },
  { id: "HIGH", label: "High", color: "text-bearish" },
];

function DailySignals() {
  const queryClient = useQueryClient();
  const [showStrategy, setShowStrategy] = useState(false);
  const [filterRec, setFilterRec] = useState<string | null>(null);

  // Fetch signals
  const signalsFn = useStableServerFn(getDailySignals);
  const signalsQuery = useQuery(useMemo(() => ({
    queryKey: ["daily-signals"] as const,
    queryFn: () => signalsFn({ data: {} }),
    staleTime: 120_000,
  }), [signalsFn]));

  // Fetch user strategy
  const strategyFn = useStableServerFn(getUserStrategy);
  const strategyQuery = useQuery(useMemo(() => ({
    queryKey: ["user-strategy"] as const,
    queryFn: () => strategyFn({}),
    staleTime: 60_000,
  }), [strategyFn]));

  // Generate signals mutation
  const generateFn = useStableServerFn(generateDailySignals);
  const generateMutation = useMutation({
    mutationFn: () => generateFn({}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["daily-signals"] });
    },
  });

  // Create alert from signal
  const createAlertFn = useStableServerFn(createAlert);
  const alertMutation = useMutation({
    mutationFn: (data: { pair: string; entry: number }) =>
      createAlertFn({
        data: {
          symbol: toTradingViewSymbol(data.pair),
          pair: data.pair,
          condition: "above" as const,
          targetPrice: data.entry,
          timeframe: "1H",
        },
      }),
  });

  const strategy = strategyQuery.data;
  const signals = signalsQuery.data;

  // Filter signals
  const filteredSignals = (signals ?? []).filter((s: any) => {
    if (filterRec && s.recommendation !== filterRec) return false;
    return true;
  });

  return (
    <div className="space-y-5 pb-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Vixor Intelligence</div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Signals</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors disabled:opacity-50"
          >
            {generateMutation.isPending ? (
              <Loader2 className="size-4 animate-spin text-primary" />
            ) : (
              <RefreshCw className="size-4 text-muted-foreground" />
            )}
          </button>
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            className="size-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
          >
            <Settings2 className="size-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Strategy Config (collapsible) */}
      {showStrategy && (
        <StrategyConfig
          strategy={strategy}
          onUpdate={() => queryClient.invalidateQueries({ queryKey: ["user-strategy", "daily-signals"] })}
        />
      )}

      {/* Strategy Summary */}
      <div className="vixor-card p-4">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="size-4 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Your Strategy</span>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Style</div>
            <div className="text-sm font-bold">{strategy?.trading_style || "Day Trading"}</div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Risk</div>
            <div className={`text-sm font-bold ${
              strategy?.risk_tolerance === "LOW" ? "text-bullish" : strategy?.risk_tolerance === "HIGH" ? "text-bearish" : "text-neutral-wait"
            }`}>
              {strategy?.risk_tolerance || "MEDIUM"}
            </div>
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Pairs</div>
            <div className="text-sm font-bold">{strategy?.pairs?.length ?? 4}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { value: null, label: "All" },
          { value: "BUY", label: "Buy" },
          { value: "SELL", label: "Sell" },
          { value: "WAIT", label: "Wait" },
        ].map(f => (
          <button
            key={f.label}
            onClick={() => setFilterRec(f.value)}
            className={`px-3 h-8 rounded-lg text-xs font-bold transition-all ${
              filterRec === f.value
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-card-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {signalsQuery.isLoading ? (
        <div className="vixor-card p-6 text-center">
          <Loader2 className="size-6 animate-spin mx-auto text-primary mb-2" />
          <div className="text-sm text-muted-foreground">Loading signals...</div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <Sparkles className="size-8 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-sm text-muted-foreground mb-2">No signals for today yet</div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="px-4 h-9 rounded-xl gradient-primary text-primary-foreground text-xs font-bold glow-primary disabled:opacity-50"
          >
            {generateMutation.isPending ? "Generating..." : "Generate Signals"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSignals.map((signal: any) => (
            <SignalCard
              key={signal.id}
              signal={signal}
              onSetAlert={(pair, entry) => alertMutation.mutate({ pair, entry })}
              isAlertLoading={alertMutation.isPending}
            />
          ))}
        </div>
      )}

      {generateMutation.isSuccess && generateMutation.data && (
        <div className="vixor-card p-3 border-l-4 border-l-primary">
          <div className="text-xs text-muted-foreground">
            Generated <span className="text-primary font-bold">{generateMutation.data.generated}</span> signals for {generateMutation.data.date}
          </div>
        </div>
      )}
    </div>
  );
}

// Signal Card Component
function SignalCard({ signal, onSetAlert, isAlertLoading }: { signal: any; onSetAlert: (pair: string, entry: number) => void; isAlertLoading: boolean }) {
  const isBuy = signal.recommendation === "BUY";
  const isSell = signal.recommendation === "SELL";

  return (
    <div className="vixor-card p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className={`size-10 rounded-xl flex items-center justify-center ${
            isBuy ? "bg-bullish/10" : isSell ? "bg-bearish/10" : "bg-neutral-wait/10"
          }`}>
            {isBuy ? <TrendingUp className="size-5 text-bullish" /> :
             isSell ? <TrendingDown className="size-5 text-bearish" /> :
             <Minus className="size-5 text-neutral-wait" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold font-mono text-base">{signal.pair}</span>
              <RecBadge rec={signal.recommendation} />
            </div>
            <div className="text-xs text-muted-foreground font-mono">{signal.timeframe}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">Confidence</div>
          <div className="text-lg font-bold font-mono">{signal.confidence}%</div>
        </div>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={signal.confidence} />

      {/* Price levels */}
      <div className="grid grid-cols-3 gap-3 mt-3">
        <div className="p-2 rounded-lg bg-background">
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Entry</div>
          <div className="text-sm font-bold font-mono">{signal.entry ? Number(signal.entry).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</div>
        </div>
        <div className="p-2 rounded-lg bg-background">
          <div className="text-[9px] uppercase tracking-wider text-bearish font-bold">Stop Loss</div>
          <div className="text-sm font-bold font-mono text-bearish">{signal.stop_loss ? Number(signal.stop_loss).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</div>
        </div>
        <div className="p-2 rounded-lg bg-background">
          <div className="text-[9px] uppercase tracking-wider text-bullish font-bold">Take Profit</div>
          <div className="text-sm font-bold font-mono text-bullish">
            {signal.take_profit?.[1] ? Number(signal.take_profit[1]).toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}
          </div>
        </div>
      </div>

      {/* Pattern & Reasons */}
      {signal.pattern && (
        <div className="mt-3 text-xs text-muted-foreground">
          <span className="font-bold text-foreground">{signal.pattern}</span>
        </div>
      )}

      {signal.reasons && signal.reasons.length > 0 && (
        <div className="mt-2 space-y-0.5">
          {signal.reasons.slice(0, 2).map((r: string, i: number) => (
            <div key={i} className="text-[11px] text-muted-foreground flex items-start gap-1.5">
              <span className="text-primary mt-0.5">•</span>
              <span className="line-clamp-1">{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onSetAlert(signal.pair, signal.entry)}
          disabled={isAlertLoading || !signal.entry}
          className="flex-1 h-9 rounded-xl bg-card border border-border flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground hover:bg-card-hover hover:text-foreground transition-colors disabled:opacity-50"
        >
          <Bell className="size-3.5" /> Set Alert
        </button>
        <Link
          to="/charts"
          search={{ symbol: toTradingViewSymbol(signal.pair) }}
          className="flex-1 h-9 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center gap-1.5 text-xs font-bold glow-primary"
        >
          <BarChart3 className="size-3.5" /> View Chart
        </Link>
      </div>
    </div>
  );
}

// Strategy Configuration Component
function StrategyConfig({ strategy, onUpdate }: { strategy: any; onUpdate: () => void }) {
  const updateFn = useStableServerFn(updateUserStrategy);

  const [pairs, setPairs] = useState<string[]>(strategy?.pairs || ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD"]);
  const [tradingStyle, setTradingStyle] = useState(strategy?.trading_style || "Day Trading");
  const [riskTolerance, setRiskTolerance] = useState(strategy?.risk_tolerance || "MEDIUM");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFn({
        data: {
          pairs,
          tradingStyle: tradingStyle as "Scalping" | "Day Trading" | "Swing Trading",
          riskTolerance: riskTolerance as "LOW" | "MEDIUM" | "HIGH",
          preferredTimeframes: tradingStyle === "Scalping" ? ["5M", "15M", "1H"] : tradingStyle === "Day Trading" ? ["1H", "4H"] : ["4H", "1D"],
        },
      });
      onUpdate();
    } catch (err) {
      console.error("Failed to save strategy:", err);
    } finally {
      setSaving(false);
    }
  };

  const togglePair = (pair: string) => {
    setPairs(prev => prev.includes(pair) ? prev.filter(p => p !== pair) : [...prev, pair]);
  };

  return (
    <div className="vixor-card p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center gap-2">
        <Target className="size-4 text-primary" />
        <span className="text-sm font-bold">Strategy Setup</span>
      </div>

      {/* Trading Style */}
      <div>
        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Trading Style</label>
        <div className="grid grid-cols-3 gap-2">
          {TRADING_STYLES.map(s => (
            <button
              key={s.id}
              onClick={() => setTradingStyle(s.id)}
              className={`h-14 rounded-xl text-xs font-bold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                tradingStyle === s.id
                  ? "bg-primary text-primary-foreground border-primary glow-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              <span className="text-base">{s.icon}</span>
              <span className="text-[10px]">{s.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Risk Tolerance</label>
        <div className="grid grid-cols-3 gap-2">
          {RISK_LEVELS.map(r => (
            <button
              key={r.id}
              onClick={() => setRiskTolerance(r.id)}
              className={`h-10 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                riskTolerance === r.id
                  ? "bg-primary text-primary-foreground border-primary glow-primary"
                  : "bg-card border-border text-muted-foreground hover:bg-card-hover"
              }`}
            >
              <Shield className="size-3.5" />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Pairs */}
      <div>
        <label className="text-[10px] uppercase font-bold text-muted-foreground mb-1.5 block">Preferred Pairs</label>
        <div className="flex flex-wrap gap-1.5">
          {ALL_PAIRS.map(pair => (
            <button
              key={pair}
              onClick={() => togglePair(pair)}
              className={`px-2.5 h-7 rounded-lg text-[11px] font-bold transition-all ${
                pairs.includes(pair)
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || pairs.length === 0}
        className="w-full h-11 rounded-xl gradient-primary text-primary-foreground font-bold flex items-center justify-center gap-2 glow-primary disabled:opacity-50"
      >
        {saving ? <Loader2 className="size-4 animate-spin" /> : null}
        Save Strategy
      </button>
    </div>
  );
}
