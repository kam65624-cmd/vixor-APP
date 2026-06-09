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
} from "lucide-react";
import { useState, useCallback, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMarketPrices, getOHLCV } from "@/lib/vixor.functions";
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
import { useStableServerFn } from "@/hooks/use-stable-server-fn";
import html2canvas from "html2canvas";

export const Route = createFileRoute("/_authenticated/charts")({
  head: () => ({ meta: [{ title: "Charts — Vixor" }] }),
  component: Charts,
  validateSearch: (search: Record<string, unknown>) => ({
    symbol: (search.symbol as string) || "BINANCE:BTCUSDT",
  }),
});

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

  // Current symbol state
  const [currentPair, setCurrentPair] = useState(() => {
    const sym = search.symbol || "BINANCE:BTCUSDT";
    return getDisplayPair(sym);
  });
  const [searchInput, setSearchInput] = useState("");
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [currentInterval, setCurrentInterval] = useState("240"); // Default 4h
  const [isCapturing, setIsCapturing] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);

  const currentSymbol = useMemo(() => toTradingViewSymbol(currentPair), [currentPair]);

  // Fetch market prices for the quick-select buttons
  const fetchPrices = useStableServerFn(getMarketPrices);
  const fetchOHLCVFn = useStableServerFn(getOHLCV);

  const pricesQuery = useQuery(
    useMemo(
      () => ({
        queryKey: ["market-prices"] as const,
        queryFn: () => fetchPrices({}),
        staleTime: 60_000,
        refetchInterval: 120_000,
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
        staleTime: 30_000,
        refetchInterval: 60_000,
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

  // Handle ANALYZE button - capture screenshot and navigate
  const handleAnalyze = useCallback(async () => {
    if (!chartContainerRef.current) {
      // Fallback: navigate to analyze without screenshot
      navigate({ to: "/analyze" });
      return;
    }

    setIsCapturing(true);
    try {
      const canvas = await html2canvas(chartContainerRef.current, {
        backgroundColor: "#0f1117",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      const imageBase64 = canvas.toDataURL("image/png");
      // Navigate to analyze with the captured image and current pair
      navigate({
        to: "/analyze",
        search: { screenshot: imageBase64, pair: currentPair },
      } as any);
    } catch (err) {
      console.error("Failed to capture chart:", err);
      // Fallback: navigate to analyze without screenshot
      navigate({ to: "/analyze" });
    } finally {
      setIsCapturing(false);
    }
  }, [navigate, currentPair]);

  // Format volume
  const formatVolume = (vol: number) => {
    if (vol >= 1_000_000_000) return `${(vol / 1_000_000_000).toFixed(2)} B`;
    if (vol >= 1_000_000) return `${(vol / 1_000_000).toFixed(2)} M`;
    if (vol >= 1_000) return `${(vol / 1_000).toFixed(2)} K`;
    return vol.toFixed(2);
  };

  // Get active timeframe label
  const activeTfLabel =
    TIMEFRAMES.find((tf) => tf.tv === currentInterval)?.label || "4h";

  return (
    <div className="flex flex-col gap-3 animate-in fade-in duration-500">
      {/* ── Search bar ── */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-card border border-border">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            placeholder="Search pair… (e.g. BTC/USDT)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="bg-transparent flex-1 text-sm outline-none text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={handleSearch}
          className="size-10 rounded-xl gradient-primary text-primary-foreground flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {/* ── Timeframe selector ── */}
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.label}
            onClick={() => setCurrentInterval(tf.tv)}
            className={`px-3 h-8 rounded-lg text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              currentInterval === tf.tv
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:bg-card-hover hover:text-foreground"
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* ── Chart tools ── */}
      <div className="flex items-center gap-1.5">
        <button className="size-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground">
          <Maximize2 className="size-3.5" />
        </button>
        <button className="size-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground">
          <CandlestickChart className="size-3.5" />
        </button>
        <button className="size-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground">
          <Pencil className="size-3.5" />
        </button>
        <button className="size-8 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors text-muted-foreground hover:text-foreground">
          <BarChart3 className="size-3.5" />
        </button>
        <div className="flex-1" />
        <div className="text-[10px] font-mono text-muted-foreground">{activeTfLabel}</div>
      </div>

      {/* ── Price info bar ── */}
      <div className="vixor-card p-3">
        <div className="flex items-start justify-between mb-1.5">
          <div>
            <div className="text-xs text-muted-foreground font-semibold">{displayName}</div>
            {currentPrice > 0 && (
              <div className="text-2xl font-bold font-mono leading-tight">
                $
                {currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: decimals,
                  maximumFractionDigits: decimals,
                })}
              </div>
            )}
          </div>
          {pricesQuery.data?.find((p: any) => p.pair === currentPair)?.change24h !==
            undefined && (
            <div
              className={`text-sm font-semibold font-mono px-2 py-0.5 rounded-lg ${
                (pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0) >= 0
                  ? "text-bullish bg-bullish/10"
                  : "text-bearish bg-bearish/10"
              }`}
            >
              {(pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0) >= 0
                ? "+"
                : ""}
              {(pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0).toFixed(
                2,
              )}
              %
            </div>
          )}
        </div>
        {/* OHLCV row */}
        {ohlcvQuery.data && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] font-mono">
            <span className="text-muted-foreground">
              O: <span className="text-foreground">{ohlcvQuery.data.open?.toFixed(decimals)}</span>
            </span>
            <span className="text-muted-foreground">
              H:{" "}
              <span className="text-bullish">{ohlcvQuery.data.high?.toFixed(decimals)}</span>
            </span>
            <span className="text-muted-foreground">
              L: <span className="text-bearish">{ohlcvQuery.data.low?.toFixed(decimals)}</span>
            </span>
            <span className="text-muted-foreground">
              C: <span className="text-foreground">{ohlcvQuery.data.close?.toFixed(decimals)}</span>
            </span>
            {ohlcvQuery.data.volume > 0 && (
              <span className="text-muted-foreground">
                Vol:{" "}
                <span className="text-foreground">{formatVolume(ohlcvQuery.data.volume)}</span>
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
        chartContainerRef={chartContainerRef}
      />

      {/* ── Popular pairs quick-select ── */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
        {POPULAR.map((p) => {
          const priceData = pricesQuery.data?.find((d: any) => d.pair === p.pair);
          const isActive = currentPair === p.pair;
          return (
            <button
              key={p.pair}
              onClick={() => changePair(p.pair)}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                isActive
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "bg-card border border-border text-muted-foreground hover:bg-card-hover hover:text-foreground"
              }`}
            >
              <span className="text-sm">{p.icon}</span>
              {p.pair}
              {priceData && (
                <span className="font-mono text-[10px] opacity-70">
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

      {/* ── Action buttons ── */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setShowAlertDialog(true)}
          className="vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover"
        >
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell className="size-4 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Set Alert
          </span>
        </button>

        <button
          onClick={handleAnalyze}
          disabled={isCapturing}
          className="vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover relative"
        >
          <div className="size-9 rounded-xl gradient-primary flex items-center justify-center glow-primary">
            {isCapturing ? (
              <Loader2 className="size-4 text-primary-foreground animate-spin" />
            ) : (
              <Sparkles className="size-4 text-primary-foreground" />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            {isCapturing ? "Capturing…" : "Analyze"}
          </span>
        </button>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          }}
          className="vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover"
        >
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Star className="size-4 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Watchlist
          </span>
        </button>
      </div>

      {/* ── My Alerts for this pair ── */}
      <div>
        <SectionTitle title="My Alerts" />
        <AlertsList pair={currentPair} />
      </div>

      {/* ── All Alerts ── */}
      <div>
        <SectionTitle title="All Alerts" />
        <AlertsList />
      </div>

      {/* ── Create Alert Dialog ── */}
      <CreateAlertDialog
        open={showAlertDialog}
        onOpenChange={setShowAlertDialog}
        pair={currentPair}
        currentPrice={currentPrice || 68000}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ["alerts"] })}
      />
    </div>
  );
}
