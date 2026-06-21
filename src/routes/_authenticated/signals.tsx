import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDailySignals,
  getUserStrategy,
  updateUserStrategy,
  generateDailySignals,
  createAlert,
} from "@/domains/trading/functions";
import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Bell,
  Sparkles,
  Settings2,
  RefreshCw,
  Loader2,
  Target,
  Shield,
  Zap,
  BarChart3,
} from "lucide-react";
import { RecBadge, ConfidenceBar } from "@/components/vixor/atoms";
import { toTradingViewSymbol } from "@/components/vixor/TradingViewChart";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";
import { PaginationBar } from "@/components/vixor/PaginationBar";

export const Route = createFileRoute("/_authenticated/signals")({
  head: () => ({ meta: [{ title: "Daily Signals — Vixor" }] }),
  component: DailySignals,
});

// ── Axiom Design System ──
const S = {
  bg: "#0A0E1A",
  card: "#111827",
  cardBorder: "1px solid rgba(255,255,255,0.06)",
  divider: "1px solid rgba(255,255,255,0.06)",
  text1: "#F0F4FC",
  text2: "#7B8BA8",
  text3: "#4A5568",
  accent: "#3B82F6",
  accentLight: "#60A5FA",
  bullish: "#22C55E",
  bearish: "#EF4444",
  warning: "#F59E0B",
  font: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
  radius: 8,
  badgeRadius: 6,
} as const;

const cardStyle: React.CSSProperties = {
  background: S.card,
  border: S.cardBorder,
  borderRadius: S.radius,
};

const tabActive: React.CSSProperties = {
  padding: "0 12px",
  height: 32,
  borderRadius: S.badgeRadius,
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid rgba(59,130,246,0.3)",
  background: "rgba(59,130,246,0.15)",
  color: S.accentLight,
  cursor: "pointer",
  fontFamily: S.font,
};

const tabInactive: React.CSSProperties = {
  padding: "0 12px",
  height: 32,
  borderRadius: S.badgeRadius,
  fontSize: 12,
  fontWeight: 700,
  border: "1px solid transparent",
  background: "transparent",
  color: S.text2,
  cursor: "pointer",
  fontFamily: S.font,
};

const ALL_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "XAU/USD",
  "EUR/USD",
  "GBP/JPY",
  "SOL/USDT",
  "GBP/USD",
  "USD/JPY",
  "AUD/USD",
  "BNB/USDT",
];

const TRADING_STYLES = [
  { id: "Scalping", icon: "⚡", desc: "Fast trades, small targets" },
  { id: "Day Trading", icon: "☀️", desc: "Intra-day, medium targets" },
  { id: "Swing Trading", icon: "🌊", desc: "Multi-day, large targets" },
];

const RISK_LEVELS = [
  { id: "LOW", label: "Low", color: S.bullish },
  { id: "MEDIUM", label: "Medium", color: S.warning },
  { id: "HIGH", label: "High", color: S.bearish },
];

function DailySignals() {
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [showStrategy, setShowStrategy] = useState(false);
  const [filterRec, setFilterRec] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  // Fetch signals (paginated)
  const signalsFn = useStableServerFn(getDailySignals);
  const signalsQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["daily-signals", page, filterRec] as const,
        queryFn: () =>
          signalsFn({
            data: {
              limit: PAGE_SIZE,
              offset: (page - 1) * PAGE_SIZE,
              recommendation: filterRec ?? undefined,
            },
          }),
        staleTime: 120_000,
      }),
      [signalsFn, page, filterRec],
    ),
  );

  // Fetch user strategy
  const strategyFn = useStableServerFn(getUserStrategy);
  const strategyQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["user-strategy"] as const,
        queryFn: () => strategyFn({}),
        staleTime: 60_000,
      }),
      [strategyFn],
    ),
  );

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
  const signalsRaw = signalsQuery.data as
    | { items: any[]; total: number; hasMore: boolean }
    | undefined;
  const signalsTotal = signalsRaw?.total ?? 0;

  // Filter signals
  const filteredSignals = signalsRaw?.items ?? [];

  const filters = [
    { value: null as string | null, label: t("signals.all") },
    { value: "BUY", label: t("signals.buy") },
    { value: "SELL", label: t("signals.sell") },
    { value: "WAIT", label: t("signals.wait") },
  ];

  const riskColor = strategy?.risk_tolerance === "LOW"
    ? S.bullish
    : strategy?.risk_tolerance === "HIGH"
      ? S.bearish
      : S.warning;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, paddingBottom: 24, fontFamily: S.font }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.accent, marginBottom: 2 }}>
            {t("signals.vixorIntelligence")}
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: S.text1, margin: 0, letterSpacing: "-0.02em" }}>{t("signals.dailySignals")}</h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            style={{
              width: 36, height: 36, borderRadius: S.radius, ...cardStyle, border: S.cardBorder,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              opacity: generateMutation.isPending ? 0.5 : 1,
            }}
          >
            {generateMutation.isPending ? (
              <Loader2 style={{ width: 16, height: 16, color: S.accent, animation: "spin 1s linear infinite" }} />
            ) : (
              <RefreshCw style={{ width: 16, height: 16, color: S.text2 }} />
            )}
          </button>
          <button
            onClick={() => setShowStrategy(!showStrategy)}
            style={{
              width: 36, height: 36, borderRadius: S.radius, ...cardStyle, border: S.cardBorder,
              display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
            }}
          >
            <Settings2 style={{ width: 16, height: 16, color: S.text2 }} />
          </button>
        </div>
      </div>

      {/* Strategy Config (collapsible) */}
      {showStrategy && (
        <StrategyConfig
          strategy={strategy}
          onUpdate={() =>
            queryClient.invalidateQueries({ queryKey: ["user-strategy", "daily-signals"] })
          }
        />
      )}

      {/* Strategy Summary */}
      <div style={{ ...cardStyle, border: S.cardBorder, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Zap style={{ width: 16, height: 16, color: S.accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: S.accent }}>
            {t("signals.yourStrategy")}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: S.text2, textTransform: "uppercase", fontWeight: 700 }}>
              {t("signals.style")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>{strategy?.trading_style || "Day Trading"}</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: S.text2, textTransform: "uppercase", fontWeight: 700 }}>
              {t("signals.risk")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: riskColor }}>
              {strategy?.risk_tolerance || "MEDIUM"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: S.text2, textTransform: "uppercase", fontWeight: 700 }}>
              {t("signals.pairs")}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>{strategy?.pairs?.length ?? 4}</div>
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8 }}>
        {filters.map((f) => (
          <button
            key={f.label}
            onClick={() => {
              setFilterRec(f.value);
              setPage(1);
            }}
            style={filterRec === f.value ? tabActive : tabInactive}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Signals List */}
      {signalsQuery.isLoading ? (
        <div style={{ ...cardStyle, border: S.cardBorder, padding: 24, textAlign: "center" }}>
          <Loader2 style={{ width: 24, height: 24, color: S.accent, animation: "spin 1s linear infinite", margin: "0 auto 8px" }} />
          <div style={{ fontSize: 14, color: S.text2 }}>{t("signals.loadingSignals")}</div>
        </div>
      ) : filteredSignals.length === 0 ? (
        <div style={{ ...cardStyle, border: S.cardBorder, padding: 24, textAlign: "center" }}>
          <Sparkles style={{ width: 32, height: 32, color: S.text3, margin: "0 auto 8px", opacity: 0.3 }} />
          <div style={{ fontSize: 14, color: S.text2, marginBottom: 8 }}>{t("signals.noSignalsToday")}</div>
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            style={{
              padding: "0 16px", height: 36, borderRadius: S.radius, background: S.accent, color: "#fff",
              fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", opacity: generateMutation.isPending ? 0.5 : 1,
            }}
          >
            {generateMutation.isPending ? t("signals.generating") : t("signals.generateSignals")}
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
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
        <div style={{ ...cardStyle, border: "2px solid " + S.accent, borderLeft: "4px solid " + S.accent, padding: 12 }}>
          <div style={{ fontSize: 12, color: S.text2 }}>
            Generated{" "}
            <span style={{ color: S.accent, fontWeight: 700 }}>{generateMutation.data.generated}</span>{" "}
            signals for {generateMutation.data.date}
          </div>
        </div>
      )}

      {/* Pagination */}
      {signalsTotal > PAGE_SIZE && (
        <PaginationBar
          page={page}
          pageSize={PAGE_SIZE}
          total={signalsTotal}
          onPageChange={(p) => setPage(p)}
        />
      )}
    </div>
  );
}

// Signal Card Component
function SignalCard({
  signal,
  onSetAlert,
  isAlertLoading,
}: {
  signal: any;
  onSetAlert: (pair: string, entry: number) => void;
  isAlertLoading: boolean;
}) {
  const { t } = useI18n();
  const isBuy = signal.recommendation === "BUY";
  const isSell = signal.recommendation === "SELL";

  const iconBg = isBuy ? "rgba(34,197,94,0.1)" : isSell ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)";
  const iconColor = isBuy ? S.bullish : isSell ? S.bearish : S.warning;

  return (
    <div style={{ ...cardStyle, border: S.cardBorder, padding: 16 }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 40, height: 40, borderRadius: S.radius, background: iconBg,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {isBuy ? (
              <TrendingUp style={{ width: 20, height: 20, color: iconColor }} />
            ) : isSell ? (
              <TrendingDown style={{ width: 20, height: 20, color: iconColor }} />
            ) : (
              <Minus style={{ width: 20, height: 20, color: iconColor }} />
            )}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 700, fontFamily: S.mono, fontSize: 16, color: S.text1 }}>{signal.pair}</span>
              <RecBadge rec={signal.recommendation} />
            </div>
            <div style={{ fontSize: 12, color: S.text2, fontFamily: S.mono }}>{signal.timeframe}</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", color: S.text2, fontWeight: 700 }}>
            {t("signals.confidence")}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: S.mono, color: S.text1 }}>{signal.confidence}%</div>
        </div>
      </div>

      {/* Confidence bar */}
      <ConfidenceBar value={signal.confidence} />

      {/* Price levels */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 12 }}>
        <div style={{ padding: 8, borderRadius: S.badgeRadius, background: S.bg }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: S.text2, fontWeight: 700 }}>
            {t("signals.entry")}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: S.mono, color: S.text1 }}>
            {signal.entry
              ? Number(signal.entry).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "—"}
          </div>
        </div>
        <div style={{ padding: 8, borderRadius: S.badgeRadius, background: S.bg }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: S.bearish, fontWeight: 700 }}>
            {t("signals.stopLoss")}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: S.mono, color: S.bearish }}>
            {signal.stop_loss
              ? Number(signal.stop_loss).toLocaleString(undefined, { maximumFractionDigits: 2 })
              : "—"}
          </div>
        </div>
        <div style={{ padding: 8, borderRadius: S.badgeRadius, background: S.bg }}>
          <div style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.05em", color: S.bullish, fontWeight: 700 }}>
            {t("signals.takeProfit")}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: S.mono, color: S.bullish }}>
            {signal.take_profit?.[1]
              ? Number(signal.take_profit[1]).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })
              : "—"}
          </div>
        </div>
      </div>

      {/* Pattern & Reasons */}
      {signal.pattern && (
        <div style={{ marginTop: 12, fontSize: 12, color: S.text2 }}>
          <span style={{ fontWeight: 700, color: S.text1 }}>{signal.pattern}</span>
        </div>
      )}

      {signal.reasons && signal.reasons.length > 0 && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 2 }}>
          {signal.reasons.slice(0, 2).map((r: string, i: number) => (
            <div key={i} style={{ fontSize: 11, color: S.text2, display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span style={{ color: S.accent, marginTop: 1 }}>•</span>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r}</span>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <button
          onClick={() => onSetAlert(signal.pair, signal.entry)}
          disabled={isAlertLoading || !signal.entry}
          style={{
            flex: 1, height: 36, borderRadius: S.radius, ...cardStyle, border: S.cardBorder,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 12, fontWeight: 700, color: S.text2, cursor: (isAlertLoading || !signal.entry) ? "not-allowed" : "pointer",
            opacity: (isAlertLoading || !signal.entry) ? 0.5 : 1, background: S.card,
          }}
        >
          <Bell style={{ width: 14, height: 14 }} /> {t("signals.setAlert")}
        </button>
        <Link
          to="/charts"
          search={{ symbol: toTradingViewSymbol(signal.pair) }}
          style={{
            flex: 1, height: 36, borderRadius: S.radius, background: S.accent, color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            fontSize: 12, fontWeight: 700, textDecoration: "none",
          }}
        >
          <BarChart3 style={{ width: 14, height: 14 }} /> {t("signals.viewChart")}
        </Link>
      </div>
    </div>
  );
}

// Strategy Configuration Component
function StrategyConfig({ strategy, onUpdate }: { strategy: any; onUpdate: () => void }) {
  const { t } = useI18n();
  const updateFn = useStableServerFn(updateUserStrategy);

  const [pairs, setPairs] = useState<string[]>(
    strategy?.pairs || ["BTC/USDT", "ETH/USDT", "XAU/USD", "EUR/USD"],
  );
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
          preferredTimeframes:
            tradingStyle === "Scalping"
              ? ["5M", "15M", "1H"]
              : tradingStyle === "Day Trading"
                ? ["1H", "4H"]
                : ["4H", "1D"],
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
    setPairs((prev) => (prev.includes(pair) ? prev.filter((p) => p !== pair) : [...prev, pair]));
  };

  return (
    <div style={{ ...cardStyle, border: S.cardBorder, padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <Target style={{ width: 16, height: 16, color: S.accent }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: S.text1 }}>{t("signals.strategySetup")}</span>
      </div>

      {/* Trading Style */}
      <div>
        <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: S.text2, marginBottom: 6, display: "block" }}>
          {t("signals.tradingStyle")}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {TRADING_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setTradingStyle(s.id)}
              style={{
                height: 56, borderRadius: S.radius, fontSize: 12, fontWeight: 700, border: "1px solid",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, cursor: "pointer",
                background: tradingStyle === s.id ? "rgba(59,130,246,0.15)" : S.card,
                borderColor: tradingStyle === s.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                color: tradingStyle === s.id ? S.accentLight : S.text2,
              }}
            >
              <span style={{ fontSize: 16 }}>{s.icon}</span>
              <span style={{ fontSize: 10 }}>{s.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Risk Tolerance */}
      <div>
        <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: S.text2, marginBottom: 6, display: "block" }}>
          {t("signals.riskTolerance")}
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {RISK_LEVELS.map((r) => (
            <button
              key={r.id}
              onClick={() => setRiskTolerance(r.id)}
              style={{
                height: 40, borderRadius: S.radius, fontSize: 12, fontWeight: 700, border: "1px solid",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer",
                background: riskTolerance === r.id ? "rgba(59,130,246,0.15)" : S.card,
                borderColor: riskTolerance === r.id ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.06)",
                color: riskTolerance === r.id ? S.accentLight : S.text2,
              }}
            >
              <Shield style={{ width: 14, height: 14 }} />
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Pairs */}
      <div>
        <label style={{ fontSize: 10, textTransform: "uppercase", fontWeight: 700, color: S.text2, marginBottom: 6, display: "block" }}>
          {t("signals.preferredPairs")}
        </label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {ALL_PAIRS.map((pair) => (
            <button
              key={pair}
              onClick={() => togglePair(pair)}
              style={{
                padding: "0 10px", height: 28, borderRadius: S.badgeRadius, fontSize: 11, fontWeight: 700, cursor: "pointer",
                background: pairs.includes(pair) ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                color: pairs.includes(pair) ? S.accentLight : S.text2,
                border: pairs.includes(pair) ? "1px solid rgba(59,130,246,0.3)" : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {pair}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || pairs.length === 0}
        style={{
          width: "100%", height: 44, borderRadius: S.radius, background: S.accent, color: "#fff",
          fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          border: "none", cursor: "pointer", opacity: (saving || pairs.length === 0) ? 0.5 : 1,
          fontFamily: S.font, fontSize: 14,
        }}
      >
        {saving ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : null}
        {t("signals.saveStrategy")}
      </button>
    </div>
  );
}