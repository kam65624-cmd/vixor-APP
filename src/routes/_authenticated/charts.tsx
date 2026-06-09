import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { Search, Bell, Sparkles, Plus } from "lucide-react";
import { useState, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getMarketPrices } from "@/lib/vixor.functions";
import {
  TradingViewChart,
  toTradingViewSymbol,
  SYMBOL_MAP,
  getDisplayPair,
} from "@/components/vixor/TradingViewChart";
import { CreateAlertDialog } from "@/components/vixor/CreateAlertDialog";
import { AlertsList } from "@/components/vixor/AlertsList";
import { SectionTitle } from "@/components/vixor/atoms";
import { useStableServerFn } from "@/hooks/use-stable-server-fn";

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

  const currentSymbol = useMemo(() => toTradingViewSymbol(currentPair), [currentPair]);

  // Fetch market prices for the quick-select buttons
  const fetchPrices = useStableServerFn(getMarketPrices);

  const pricesQuery = useQuery(useMemo(() => ({
    queryKey: ["market-prices"] as const,
    queryFn: () => fetchPrices({}),
    staleTime: 60_000,
    refetchInterval: 120_000,
  }), [fetchPrices]));

  // Get current price for the selected pair
  const currentPrice = useMemo(() => {
    const priceData = pricesQuery.data?.find((p: any) => p.pair === currentPair);
    return priceData?.price ?? 0;
  }, [pricesQuery.data, currentPair]);

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

    // Check if it's a known pair
    const normalizedInput = searchInput.trim().toUpperCase();

    // Try direct match first
    if (SYMBOL_MAP[normalizedInput]) {
      changePair(normalizedInput);
      setSearchInput("");
      return;
    }

    // Try without slash
    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.replace("/", "").toUpperCase() === normalizedInput) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }

    // Try partial match
    for (const [pair] of Object.entries(SYMBOL_MAP)) {
      if (pair.toUpperCase().includes(normalizedInput)) {
        changePair(pair);
        setSearchInput("");
        return;
      }
    }

    // Try using it directly as a TradingView symbol
    if (normalizedInput.includes(":")) {
      setCurrentPair(getDisplayPair(normalizedInput));
      navigate({ to: "/charts", search: { symbol: normalizedInput } } as any);
      setSearchInput("");
    }
  }, [searchInput, changePair, navigate]);

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 h-10 rounded-xl bg-card border border-border">
          <Search className="size-4 text-muted-foreground" />
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
          className="size-10 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-colors"
        >
          <Search className="size-4 text-muted-foreground" />
        </button>
      </div>

      {/* Popular pairs quick-select */}
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

      {/* Symbol header */}
      <div className="vixor-card p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-xs text-muted-foreground font-semibold">{currentPair}</div>
            {currentPrice > 0 && (
              <>
                <div className="text-3xl font-bold font-mono">
                  $
                  {currentPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: currentPair.includes("JPY") ? 2 : 4,
                  })}
                </div>
                {pricesQuery.data?.find((p: any) => p.pair === currentPair)?.change24h !==
                  undefined && (
                  <div
                    className={`text-sm font-semibold font-mono ${
                      (pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0) >=
                      0
                        ? "text-bullish"
                        : "text-bearish"
                    }`}
                  >
                    {(pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0) >=
                    0
                      ? "+"
                      : ""}
                    {(
                      pricesQuery.data.find((p: any) => p.pair === currentPair)?.change24h ?? 0
                    ).toFixed(2)}
                    %
                  </div>
                )}
              </>
            )}
          </div>
          <button
            onClick={() => setShowAlertDialog(true)}
            className="size-9 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <Bell className="size-4" />
          </button>
        </div>
      </div>

      {/* TradingView Chart */}
      <TradingViewChart symbol={currentSymbol} interval="240" theme="dark" height="65vh" />

      {/* Action buttons */}
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
          onClick={() => navigate({ to: "/analyze" })}
          className="vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover"
        >
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="size-4 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Analyze
          </span>
        </button>

        <button
          onClick={() => {
            queryClient.invalidateQueries({ queryKey: ["alerts"] });
          }}
          className="vixor-card p-3 flex flex-col items-center gap-1.5 vixor-card-hover"
        >
          <div className="size-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Plus className="size-4 text-primary" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Watchlist
          </span>
        </button>
      </div>

      {/* My Alerts for this pair */}
      <div>
        <SectionTitle title="My Alerts" />
        <AlertsList pair={currentPair} />
      </div>

      {/* All Alerts */}
      <div>
        <SectionTitle title="All Alerts" />
        <AlertsList />
      </div>

      {/* Create Alert Dialog */}
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
