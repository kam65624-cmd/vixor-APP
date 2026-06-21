import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import {
  Search,
  Bell,
  Sparkles,
  Plus,
  Maximize2,
  CandlestickChart,
  Pencil,
  BarChart3,
  Star,
  Loader2,
  MessageSquare,
} from "lucide-react";
import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMarketPrices, getOHLCV } from "@/domains/market/functions";
import { quickAnalyze } from "@/domains/analysis/functions";
import {
  TradingViewChart,
  toTradingViewSymbol,
  SYMBOL_MAP,
  getDisplayPair,
  PAIR_DISPLAY_NAMES,
  INTERVAL_MAP,
} from "@/components/vixor/TradingViewChart";
import { CreateAlertDialog } from "@/components/vixor/CreateAlertDialog";
import { AlertsList } from "@/components/vixor/AlertsList";
import { SectionTitle } from "@/components/vixor/atoms";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { useI18n } from "@/shared/i18n";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: Charts,
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: (search.symbol as string) || "BINANCE:BTCUSDT",
  }),
});

// ── Axiom Design System ──
const S = {
  bg: "#0A0E1A",
  card: "#111827",
  cardBorder: "1px solid rgba(255,255,255,0.06)",
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

const POPULAR = [
  { pair: "BTC/USDT", icon: "₿" },
  { pair: "ETH/USDT", icon: "Ξ" },
  { pair: "XAU/USD", icon: "Au" },
  { pair: "EUR/USD", icon: "€" },
  { pair: "GBP/JPY", icon: "£" },
  { pair: "SOL/USDT", icon: "◎" },
];

const TIMEFRAMES = [
  { label: "1m", tv: "1" },
  { label: "5m", tv: "5" },
  { label: "15m", tv: "15" },
  { label: "30m", tv: "30" },
  { label: "1h", tv: "60" },
  { label: "4h", tv: "240" },
  { label: "1D", tv: "D" },
];

function Charts() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { symbol?: string };
  const queryClient = useQueryClient();
  const { t } = useI18n();

  // Current symbol state
  const [currentPair, setCurrentPair] = useState(() => {
    const sym = search.symbol || "BINANCE:BTCUSDT";
    return getDisplayPair(sym);
  });
  const [searchInput, setSearchInput] = useState("");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [currentInterval, setCurrentInterval] = useState("240"); // Default 4h
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer — prevents rapid re-analysis of the same pair
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setTimeout(() => setCooldownSeconds((prev) => prev - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldownSeconds]);

  const currentSymbol = useMemo(() => toTradingViewSymbol(currentPair), [currentPair]);

  // Fetch market prices for the quick-select buttons
  const fetchPrices = useStableServerFn(getMarketPrices);
  const fetchOHLCVFn = useStableServerFn(getOHLCV);
  const analyzeFn = useStableServerFn(quickAnalyze);

  const pricesQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["market-prices"] as const,
        queryFn: () => fetchPrices({}),
        staleTime: 30_000,
        refetchInterval: 60_000,
      }),
      [fetchPrices],
    ),
  );

  // Fetch OHLCV data for the price bar
  const ohlcvQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["ohlcv", currentPair, currentInterval] as const,
        queryFn: () =>
          fetchOHLCVFn({
            data: {
              pair: currentPair,
              interval:
                Object.entries(INTERVAL_MAP).find(([, tv]) => tv === currentInterval)?.[0] || "1H",
            },
          }),
        staleTime: 15_000,
        refetchInterval: 30_000,
      }),
      [fetchOHLCVFn, currentPair, currentInterval],
    ),
  );

  // Get current price for the selected pair
  const currentPrice = useMemo(() => {
    const priceData = pricesQuery.data?.find((p: any) => p.pair === currentPair);
    return priceData?.price ?? 0;
  }, [pricesQuery.data, currentPair]);

  // Get display name for current pair
  const displayName = PAIR_DISPLAY_NAMES[currentPair] || currentPair;

  // Determine decimal places based on pair
  const decimals = useMemo(() => {
    if (currentPair.includes("JPY")) return 2;
    if (currentPair === "XAU/USD") return 2;
    if (currentPair.includes("USDT") || currentPair.includes("USD")) return 2;
    return 4;
  }, [currentPair]);

  // Handle symbol change
  const changePair = useCallback(
    (pair: string) => {
      setCurrentPair(pair);
      const symbol = toTradingViewSymbol(pair);
      navigate({ to: "/charts", search: { symbol } } as any);
    },
    [navigate],
  );

  // Handle search
  const handleSearch = useCallback(() => {
    if (!searchInput.trim()) return;

    const normalizedInput = searchInput.trim().toUpperCase();

    if (SYMBOL_MAP[normalizedInput]) {
      changePair(normalizedInput);
      setSearchInput("");
      return;
    }

    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.replace("/", "").toUpperCase() === normalizedInput) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }

    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.toUpperCase().includes(normalizedInput)) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }

    if (normalizedInput.includes(":")) {
      setCurrentPair(getDisplayPair(normalizedInput));
      navigate({ to: "/charts", search: { symbol: normalizedInput } } as any);
      setSearchInput("");
    }
  }, [searchInput, changePair, navigate]);

  // Handle timeframe change
  const handleIntervalChange = useCallback((tvInterval: string) => {
    setCurrentInterval(tvInterval);
  }, []);

  // Handle ANALYZE button — directly run analysis with real OHLCV data
  const handleAnalyze = useCallback(async () => {
    if (cooldownSeconds > 0) {
      setAnalyzeError(
        `Please wait ${cooldownSeconds}s before analyzing again. Market data needs time to refresh.`,
      );
      return;
    }
    setIsAnalyzing(true);
    setAnalyzeError(null);

    try {
      // Map TradingView interval to our timeframe format
      const tf = Object.entries(INTERVAL_MAP).find(([, tv]) => tv === currentInterval)?.[0] || "1H";

      const { id } = await analyzeFn({
        data: {
          pair: currentPair,
          timeframe: tf,
          tradingStyle: "Day Trading",
        },
      });

      // Set cooldown — 60 seconds to prevent rapid re-analysis
      setCooldownSeconds(60);

      // Navigate to the analysis result page
      navigate({ to: "/analysis/$id", params: { id } });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setAnalyzeError(msg);
      setIsAnalyzing(false);
    }
  }, [analyzeFn, currentPair, currentInterval, navigate, cooldownSeconds]);

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)} B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)} M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)} K`;
    return vol.toFixed(2);
  };

  // Get active timeframe label
  const activeTfLabel = TIMEFRAMES.find((tf) => tf.tv === currentInterval)?.label || "4h";

  const change24h = pricesQuery.data?.find((p: any) => p.pair === currentPair)?.change24h ?? 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, fontFamily: S.font }}>
      {/* ── Search bar ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ ...cardStyle, flex: 1, display: "flex", alignItems: "center", gap: 8, padding: "0 12px", height: 40, borderRadius: S.radius }}>
          <Search style={{ width: 16, height: 16, color: S.text3, flexShrink: 0 }} />
          <input
            placeholder={t("charts.searchPair")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            style={{
              background: "transparent",
              flex: 1,
              fontSize: 13,
              border: "none",
              outline: "none",
              color: S.text1,
              fontFamily: S.font,
            }}
          />
        </div>
        <button
          onClick={handleSearch}
          style={{
            width: 40,
            height: 40,
            borderRadius: S.radius,
            background: S.accent,
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
        </button>
      </div>

      {/* ── Timeframe selector ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, overflowX: "auto", paddingBottom: 2 }}>
        {TIMEFRAMES.map((tf) => {
          const isActive = currentInterval === tf.tv;
          return (
            <button
              key={tf.label}
              onClick={() => setCurrentInterval(tf.tv)}
              style={{
                padding: "0 12px",
                height: 32,
                borderRadius: S.badgeRadius,
                fontSize: 11,
                fontWeight: 700,
                whiteSpace: "nowrap",
                border: isActive ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                background: isActive ? "rgba(59,130,246,0.15)" : "transparent",
                color: isActive ? S.accentLight : S.text2,
                cursor: "pointer",
                fontFamily: S.font,
              }}
            >
              {tf.label}
            </button>
          );
        })}
      </div>

      {/* ── Chart tools ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {[
          { Icon: Maximize2 },
          { Icon: CandlestickChart },
          { Icon: Pencil },
          { Icon: BarChart3 },
        ].map(({ Icon }, i) => (
          <button
            key={i}
            style={{
              width: 32,
              height: 32,
              borderRadius: S.badgeRadius,
              ...cardStyle,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: S.cardBorder,
              cursor: "pointer",
              color: S.text3,
            }}
          >
            <Icon style={{ width: 14, height: 14 }} />
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 10, fontFamily: S.mono, color: S.text3 }}>{activeTfLabel}</div>
      </div>

      {/* ── Price info bar ── */}
      <div style={{ ...cardStyle, border: S.cardBorder, padding: 12 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <div style={{ fontSize: 11, color: S.text2, fontWeight: 600, fontFamily: S.font }}>{displayName}</div>
            {currentPrice > 0 && (
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: S.mono, lineHeight: 1.2, color: S.text1 }}>
                $
                {currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}
              </div>
            )}
          </div>
          {change24h !== undefined && (
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              fontFamily: S.mono,
              padding: "2px 8px",
              borderRadius: S.badgeRadius,
              background: change24h >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)",
              color: change24h >= 0 ? S.bullish : S.bearish,
            }}>
              {change24h >= 0 ? "+" : ""}
              {change24h.toFixed(2)}%
            </div>
          )}
        </div>
        {/* OHLCV row */}
        {ohlcvQuery.data && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px 12px", fontSize: 11, fontFamily: S.mono }}>
            <span style={{ color: S.text2 }}>
              O: <span style={{ color: S.text1 }}>{ohlcvQuery.data.open?.toFixed(decimals)}</span>
            </span>
            <span style={{ color: S.text2 }}>
              H: <span style={{ color: S.bullish }}>{ohlcvQuery.data.high?.toFixed(decimals)}</span>
            </span>
            <span style={{ color: S.text2 }}>
              L: <span style={{ color: S.bearish }}>{ohlcvQuery.data.low?.toFixed(decimals)}</span>
            </span>
            <span style={{ color: S.text2 }}>
              C: <span style={{ color: S.text1 }}>{ohlcvQuery.data.close?.toFixed(decimals)}</span>
            </span>
            {ohlcvQuery.data.volume > 0 && (
              <span style={{ color: S.text2 }}>
                Vol: <span style={{ color: S.text1 }}>{formatVolume(ohlcvQuery.data.volume)}</span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── TradingView Chart ── */}
      <TradingViewChart
        symbol={currentSymbol}
        interval={currentInterval}
        theme="dark"
        height="55vh"
        onIntervalChange={handleIntervalChange}
      />

      {/* ── Popular pairs quick-select ── */}
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
        {POPULAR.map((p) => {
          const priceData = pricesQuery.data?.find((d: any) => d.pair === p.pair);
          const isActive = currentPair === p.pair;
          return (
            <button
              key={p.pair}
              onClick={() => changePair(p.pair)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "0 12px",
                height: 36,
                borderRadius: S.radius,
                fontSize: 12,
                fontWeight: 700,
                whiteSpace: "nowrap",
                border: isActive ? "1px solid rgba(59,130,246,0.3)" : S.cardBorder,
                background: isActive ? "rgba(59,130,246,0.15)" : S.card,
                color: isActive ? S.accentLight : S.text2,
                cursor: "pointer",
                fontFamily: S.font,
              }}
            >
              <span style={{ fontSize: 14 }}>{p.icon}</span>
              {p.pair}
              {priceData && (
                <span style={{ fontFamily: S.mono, fontSize: 10, opacity: 0.7 }}>
                  $
                  {Number(priceData.price).toLocaleString(undefined, {
                    maximumFractionDigits: priceData.pair?.includes("JPY") ? 2 : 2,
                  })}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Analysis Error ── */}
      {analyzeError && (
        <div style={{
          padding: 12,
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          color: S.bearish,
          fontSize: 12,
          fontWeight: 700,
          borderRadius: S.radius,
        }}>
          {analyzeError}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
        <button
          onClick={() => setShowAlertDialog(true)}
          style={{
            ...cardStyle,
            border: S.cardBorder,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            background: S.card,
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: S.radius,
            background: "rgba(59,130,246,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Bell style={{ width: 16, height: 16, color: S.accentLight }} />
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: S.text2,
          }}>
            {t("charts.setAlert")}
          </span>
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || cooldownSeconds > 0}
          style={{
            ...cardStyle,
            border: S.cardBorder,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            cursor: (isAnalyzing || cooldownSeconds > 0) ? "not-allowed" : "pointer",
            background: S.card,
            opacity: (isAnalyzing || cooldownSeconds > 0) ? 0.5 : 1,
            position: "relative",
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: S.radius,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: cooldownSeconds > 0 ? S.text3 : "rgba(59,130,246,0.15)",
          }}>
            {isAnalyzing ? (
              <Loader2 style={{ width: 16, height: 16, color: S.text1, animation: "spin 1s linear infinite" }} />
            ) : cooldownSeconds > 0 ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: S.text2 }}>{cooldownSeconds}s</span>
            ) : (
              <Sparkles style={{ width: 16, height: 16, color: S.accentLight }} />
            )}
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: S.text2,
          }}>
            {isAnalyzing
              ? t("charts.analyzing")
              : cooldownSeconds > 0
                ? t("charts.wait", { seconds: cooldownSeconds })
                : t("charts.analyze")}
          </span>
        </button>

        <button
          onClick={() => {
            const tf =
              Object.entries(INTERVAL_MAP).find(([, tv]) => tv === currentInterval)?.[0] || "1H";
            navigate({
              to: "/copilot",
              search: {
                chartPair: currentPair,
                chartTimeframe: tf,
                chartPrice: currentPrice || 0,
                chartSymbol: currentSymbol,
              },
            } as any);
          }}
          style={{
            ...cardStyle,
            border: S.cardBorder,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            background: S.card,
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: S.radius,
            background: "rgba(139,92,246,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <MessageSquare style={{ width: 16, height: 16, color: "#A78BFA" }} />
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: S.text2,
          }}>
            {t("charts.askCopilot") || "Ask AI"}
          </span>
        </button>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          }}
          style={{
            ...cardStyle,
            border: S.cardBorder,
            padding: 12,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            cursor: "pointer",
            background: S.card,
          }}
        >
          <div style={{
            width: 36,
            height: 36,
            borderRadius: S.radius,
            background: "rgba(59,130,246,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
            <Star style={{ width: 16, height: 16, color: S.accentLight }} />
          </div>
          <span style={{
            fontSize: 9,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            color: S.text2,
          }}>
            {t("charts.watchlist")}
          </span>
        </button>
      </div>

      {/* ── My Alerts for this pair ── */}
      <div>
        <SectionTitle title={t("charts.myAlerts")} />
        <AlertsList pair={currentPair} />
      </div>

      {/* ── All Alerts ── */}
      <div>
        <SectionTitle title={t("charts.allAlerts")} />
        <AlertsList />
      </div>

      {/* ── Create Alert Dialog ── */}
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        pair={currentPair}
        currentPrice={currentPrice || 0}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
      />
    </div>
  );
}