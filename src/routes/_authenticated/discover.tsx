import { createFileRoute } from "@tanstack/react-router";
import {
  Compass,
  Search,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  BarChart2,
  ExternalLink,
  Plus,
  Trash2,
  Eye,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  StickyNote,
  CalendarClock,
  Pencil,
  ListPlus,
  MoreHorizontal,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMarketNews,
  getMarketPrices,
  getDailySignals,
  getWatchlists,
  addToWatchlist,
  removeFromWatchlist,
  updateWatchlistItem,
  getEconomicCalendar,
  createWatchlist,
  deleteWatchlist,
  renameWatchlist,
} from "@/lib/vixor.functions";
import { useStableServerFn } from "@/shared/hooks/use-stable-server-fn";
import { Skeleton } from "@/components/ui/skeleton";
import { RecBadge } from "@/components/vixor/atoms";
import { useI18n } from "@/shared/i18n";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/_authenticated/discover")({
  head: () => ({ meta: [{ title: "Discover — Vixor" }] }),
  component: Discover,
});

const TABS = [
  "discover.watchlist",
  "discover.scanner",
  "discover.calendar",
  "discover.news",
  "discover.heatmap",
] as const;

function DiscoverNews() {
  const { t } = useI18n();
  const fetchMarketNews = useStableServerFn(getMarketNews);

  const [category, setCategory] = useState<"forex" | "general" | "crypto" | "merger">("forex");

  const {
    data: news = [],
    isLoading,
    error,
  } = useQuery(
    useMemo(
      () => ({
        queryKey: ["marketNews", category] as const,
        queryFn: () => fetchMarketNews({ data: { category } }),
        refetchInterval: 60_000,
        staleTime: 30_000,
      }),
      [fetchMarketNews, category],
    ),
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Category Sub-tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(["forex", "general", "crypto", "merger"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap border transition-all ${
              category === cat
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat === "merger"
              ? t("discover.merger")
              : cat === "forex"
                ? t("discover.forex")
                : cat === "crypto"
                  ? t("discover.crypto")
                  : t("discover.general")}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="vixor-card p-4 flex gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="vixor-card p-6 text-center text-muted-foreground text-sm">
          {t("discover.failedToLoadNews")}
        </div>
      ) : news.length === 0 ? (
        <div className="vixor-card p-6 text-center text-muted-foreground text-sm">
          {t("discover.noNewsArticles")}
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="vixor-card p-4 flex gap-4 hover:border-primary/50 transition-colors group cursor-pointer"
            >
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5 text-[10px] font-bold text-muted-foreground">
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded capitalize">
                      {item.source}
                    </span>
                    <span>•</span>
                    <span>{formatTimeAgo(item.time)}</span>
                  </div>
                  <h3 className="font-bold text-sm text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 font-medium">
                    {item.summary}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary mt-2">
                  {t("discover.readFullArticle")} <ExternalLink className="size-3" />
                </div>
              </div>
              {item.image && (
                <div className="size-20 rounded-lg overflow-hidden shrink-0 border border-border bg-muted">
                  <img
                    src={item.image}
                    alt=""
                    className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const AVAILABLE_PAIRS = [
  { pair: "BTC/USDT", category: "crypto" as const },
  { pair: "ETH/USDT", category: "crypto" as const },
  { pair: "SOL/USDT", category: "crypto" as const },
  { pair: "BNB/USDT", category: "crypto" as const },
  { pair: "XRP/USDT", category: "crypto" as const },
  { pair: "EUR/USD", category: "forex" as const },
  { pair: "GBP/USD", category: "forex" as const },
  { pair: "USD/JPY", category: "forex" as const },
  { pair: "GBP/JPY", category: "forex" as const },
  { pair: "AUD/USD", category: "forex" as const },
  { pair: "XAU/USD", category: "commodity" as const },
  { pair: "USD/CHF", category: "forex" as const },
];

type CategoryFilter = "all" | "forex" | "crypto" | "commodity";

function DiscoverWatchlist() {
  const { t } = useI18n();
  const queryClient = useQueryClient();

  // Selected watchlist state
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string | null>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameWatchlistName, setRenameWatchlistName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch all watchlists with their items
  const fetchWatchlists = useStableServerFn(getWatchlists);
  const fetchPrices = useStableServerFn(getMarketPrices);
  const addFn = useStableServerFn(addToWatchlist);
  const removeFn = useStableServerFn(removeFromWatchlist);
  const updateFn = useStableServerFn(updateWatchlistItem);
  const createFn = useStableServerFn(createWatchlist);
  const deleteFn = useStableServerFn(deleteWatchlist);
  const renameFn = useStableServerFn(renameWatchlist);

  const { data: watchlists = [], isLoading: watchlistsLoading } = useQuery(
    useMemo(
      () => ({
        queryKey: ["user-watchlists"] as const,
        queryFn: () => fetchWatchlists({}),
        staleTime: 30_000,
      }),
      [fetchWatchlists],
    ),
  );

  const { data: prices = [], isLoading: pricesLoading } = useQuery(
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

  // Build price map for quick lookup
  const priceMap = useMemo(() => {
    const map = new Map<string, any>();
    for (const p of prices) {
      map.set(p.pair, p);
    }
    return map;
  }, [prices]);

  // Derive the current watchlist from selected ID or default
  const currentWatchlist = useMemo(() => {
    if (!watchlists || watchlists.length === 0) return null;
    if (selectedWatchlistId) {
      return watchlists.find((w: any) => w.id === selectedWatchlistId) ?? null;
    }
    // Auto-select default watchlist
    const defaultWl = watchlists.find((w: any) => w.is_default) ?? watchlists[0];
    return defaultWl;
  }, [watchlists, selectedWatchlistId]);

  const items = (currentWatchlist as any)?.items ?? [];
  const addedPairs = new Set(items.map((i: any) => i.pair));

  // Create watchlist mutation
  const createMutation = useMutation({
    mutationFn: (vars: { name: string; isDefault?: boolean }) =>
      createFn({ data: vars }),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
      setShowCreateDialog(false);
      setNewWatchlistName("");
      if (data?.id) {
        setSelectedWatchlistId(data.id);
      }
    },
  });

  // Delete watchlist mutation
  const deleteMutation = useMutation({
    mutationFn: (vars: { watchlistId: string }) =>
      deleteFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
      setSelectedWatchlistId(null);
      setShowDeleteDialog(false);
    },
  });

  // Rename watchlist mutation
  const renameMutation = useMutation({
    mutationFn: (vars: { watchlistId: string; name: string }) =>
      renameFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
      setShowRenameDialog(false);
      setRenameWatchlistName("");
    },
  });

  // Add mutation
  const addMutation = useMutation({
    mutationFn: (vars: { watchlistId?: string; pair: string; category: string }) =>
      addFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
    },
  });

  // Remove mutation
  const removeMutation = useMutation({
    mutationFn: (vars: { itemId: string }) =>
      removeFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
    },
  });

  // Update notes mutation
  const updateMutation = useMutation({
    mutationFn: (vars: { itemId: string; notes?: string; sortOrder?: number }) =>
      updateFn({ data: vars }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-watchlists"] });
    },
  });

  // Category filter for adding pairs
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const filteredPairs = useMemo(() => {
    let filtered = AVAILABLE_PAIRS;
    if (categoryFilter !== "all") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.pair.toLowerCase().includes(q));
    }
    return filtered;
  }, [categoryFilter, searchQuery]);

  const getCategoryBadge = (cat: string) => {
    const styles: Record<string, string> = {
      forex: "bg-primary/10 text-primary border-primary/20",
      crypto: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      commodity: "bg-orange-500/10 text-orange-600 border-orange-500/20",
      stocks: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    };
    return styles[cat] ?? styles.forex;
  };

  const handleAddPair = (pair: string, category: string) => {
    addMutation.mutate({
      pair,
      category,
      watchlistId: currentWatchlist?.id,
    });
  };

  const handleRemove = (itemId: string) => {
    removeMutation.mutate({ itemId });
  };

  const handleSaveNotes = (itemId: string) => {
    updateMutation.mutate({ itemId, notes: notesValue });
    setEditingNotes(null);
  };

  const handleMoveUp = (item: any, index: number) => {
    if (index === 0) return;
    const prevItem = items[index - 1];
    updateMutation.mutate({ itemId: item.id, sortOrder: prevItem.sort_order });
    updateMutation.mutate({ itemId: prevItem.id, sortOrder: item.sort_order });
  };

  const handleMoveDown = (item: any, index: number) => {
    if (index === items.length - 1) return;
    const nextItem = items[index + 1];
    updateMutation.mutate({ itemId: item.id, sortOrder: nextItem.sort_order });
    updateMutation.mutate({ itemId: nextItem.id, sortOrder: item.sort_order });
  };

  const handleCreateWatchlist = () => {
    if (!newWatchlistName.trim()) return;
    createMutation.mutate({ name: newWatchlistName.trim() });
  };

  const handleDeleteWatchlist = () => {
    if (!currentWatchlist) return;
    deleteMutation.mutate({ watchlistId: currentWatchlist.id });
  };

  const handleRenameWatchlist = () => {
    if (!currentWatchlist || !renameWatchlistName.trim()) return;
    renameMutation.mutate({ watchlistId: currentWatchlist.id, name: renameWatchlistName.trim() });
  };

  const isLoading = watchlistsLoading || pricesLoading;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header with Watchlist Switcher */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Watchlist Switcher Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1.5 min-w-0 group">
                <h2 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                  {currentWatchlist?.name ?? t("discover.yourWatchlist")}
                </h2>
                <ChevronDown className="size-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {watchlists.map((wl: any) => (
                <DropdownMenuItem
                  key={wl.id}
                  onClick={() => setSelectedWatchlistId(wl.id)}
                  className={currentWatchlist?.id === wl.id ? "bg-primary/10" : ""}
                >
                  <span className="truncate">{wl.name}</span>
                  {wl.is_default && (
                    <span className="ml-auto text-[9px] font-bold text-muted-foreground">
                      {t("discover.default") ?? "Default"}
                    </span>
                  )}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
                <ListPlus className="size-3.5 mr-2" />
                <span>{t("discover.newWatchlist") ?? "New Watchlist"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Watchlist Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {currentWatchlist && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="size-8 rounded-lg flex items-center justify-center bg-card border border-border hover:border-primary/30 hover:text-primary transition-colors">
                  <MoreHorizontal className="size-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => {
                    setRenameWatchlistName(currentWatchlist.name ?? "");
                    setShowRenameDialog(true);
                  }}
                >
                  <Pencil className="size-3.5 mr-2" />
                  <span>{t("discover.renameWatchlist") ?? "Rename"}</span>
                </DropdownMenuItem>
                {!currentWatchlist.is_default && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => setShowDeleteDialog(true)}
                      className="text-bearish focus:text-bearish"
                    >
                      <Trash2 className="size-3.5 mr-2" />
                      <span>{t("discover.deleteWatchlist") ?? "Delete Watchlist"}</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            onClick={() => setShowCreateDialog(true)}
            className="size-8 rounded-lg flex items-center justify-center bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            title={t("discover.newWatchlist") ?? "New Watchlist"}
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      {/* Subtitle with item count */}
      {currentWatchlist && items.length > 0 && (
        <p className="text-xs text-muted-foreground -mt-2">
          {items.length} {items.length === 1 ? "pair" : "pairs"}
          {!currentWatchlist.is_default && (
            <span className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded border bg-card border-border text-muted-foreground">
              {currentWatchlist.name}
            </span>
          )}
        </p>
      )}

      {/* Watchlist Items */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vixor-card p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-8 w-16 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        /* Empty State */
        <div className="vixor-card p-8 text-center border-dashed">
          <Eye className="size-10 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-foreground mb-1">{t("discover.watchlistEmpty")}</h3>
          <p className="text-xs text-muted-foreground mb-4">{t("discover.addFirstPair")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item: any, index: number) => {
            const priceData = priceMap.get(item.pair);
            const change = priceData?.change24h ?? 0;
            const isPositive = change >= 0;

            return (
              <div
                key={item.id}
                className="vixor-card p-3 group hover:border-primary/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {/* Pair Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-bold text-sm font-mono">{item.pair}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border capitalize ${getCategoryBadge(item.category)}`}
                      >
                        {t(`discover.${item.category}`)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {priceData ? (
                        <>
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            ${Number(priceData.price).toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: item.pair?.includes("JPY") ? 2 : 4,
                            })}
                          </span>
                          <span
                            className={`text-[10px] font-bold font-mono px-1.5 py-0.5 rounded ${
                              isPositive
                                ? "bg-bullish/10 text-bullish"
                                : "bg-bearish/10 text-bearish"
                            }`}
                          >
                            {isPositive ? "+" : ""}
                            {change.toFixed(2)}%
                          </span>
                        </>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </div>
                    {/* Notes */}
                    {item.notes && editingNotes !== item.id && (
                      <button
                        onClick={() => {
                          setEditingNotes(item.id);
                          setNotesValue(item.notes ?? "");
                        }}
                        className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <StickyNote className="size-3" />
                        <span className="truncate max-w-[180px]">{item.notes}</span>
                      </button>
                    )}
                    {editingNotes === item.id && (
                      <div className="flex items-center gap-1 mt-1">
                        <input
                          type="text"
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder={t("discover.addNotes")}
                          className="flex-1 h-6 px-2 text-[10px] bg-card border border-border rounded outline-none focus:border-primary"
                          maxLength={200}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveNotes(item.id);
                            if (e.key === "Escape") setEditingNotes(null);
                          }}
                        />
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="text-[10px] font-bold text-primary px-2 py-0.5 hover:underline"
                        >
                          {t("common.save")}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1">
                    <a
                      href={`/analyze?pair=${encodeURIComponent(item.pair)}`}
                      className="size-7 rounded-lg flex items-center justify-center bg-card border border-border hover:border-primary/30 hover:text-primary transition-colors"
                      title={t("discover.analyzePair")}
                    >
                      <Eye className="size-3" />
                    </a>
                    <a
                      href={`/charts?symbol=BINANCE:${item.pair.replace("/", "")}`}
                      className="size-7 rounded-lg flex items-center justify-center bg-card border border-border hover:border-primary/30 hover:text-primary transition-colors"
                      title={t("discover.viewChart")}
                    >
                      <BarChart2 className="size-3" />
                    </a>
                    <button
                      onClick={() => {
                        setEditingNotes(item.id);
                        setNotesValue(item.notes ?? "");
                      }}
                      className="size-7 rounded-lg flex items-center justify-center bg-card border border-border hover:border-primary/30 hover:text-primary transition-colors"
                      title={t("discover.notes")}
                    >
                      <MessageSquare className="size-3" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="size-7 rounded-lg flex items-center justify-center bg-card border border-border hover:border-bearish/30 hover:text-bearish transition-colors"
                      title={t("discover.removePair")}
                    >
                      <Trash2 className="size-3" />
                    </button>
                    {/* Reorder buttons */}
                    <div className="flex flex-col">
                      <button
                        onClick={() => handleMoveUp(item, index)}
                        disabled={index === 0}
                        className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronUp className="size-3" />
                      </button>
                      <button
                        onClick={() => handleMoveDown(item, index)}
                        disabled={index === items.length - 1}
                        className="size-4 flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-20 transition-colors"
                      >
                        <ChevronDown className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Pair Section */}
      <div className="space-y-3">
        <h3 className="font-bold text-sm">{t("discover.addPair")}</h3>

        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="size-3.5 text-muted-foreground" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("discover.searchPair")}
            className="w-full h-9 pl-9 pr-4 bg-card border border-border rounded-lg text-xs outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Category filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {(["all", "forex", "crypto", "commodity"] as CategoryFilter[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold capitalize whitespace-nowrap border transition-all ${
                categoryFilter === cat
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "all"
                ? t("discover.allCategories")
                : cat === "forex"
                  ? t("discover.forex")
                  : cat === "crypto"
                    ? t("discover.crypto")
                    : t("discover.commodity")}
            </button>
          ))}
        </div>

        {/* Grid of available pairs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {filteredPairs.map((p) => {
            const isAdded = addedPairs.has(p.pair);
            const priceData = priceMap.get(p.pair);
            return (
              <div
                key={p.pair}
                className={`vixor-card p-3 flex items-center justify-between gap-2 transition-colors ${
                  isAdded
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:border-primary/50"
                }`}
                onClick={() => {
                  if (!isAdded) handleAddPair(p.pair, p.category);
                }}
              >
                <div className="min-w-0">
                  <div className="font-bold text-xs font-mono truncate">{p.pair}</div>
                  {priceData && (
                    <div className="text-[9px] text-muted-foreground font-mono">
                      ${Number(priceData.price).toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: p.pair.includes("JPY") ? 2 : 4,
                      })}
                    </div>
                  )}
                </div>
                {isAdded ? (
                  <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap">
                    {t("discover.alreadyAdded")}
                  </span>
                ) : (
                  <div className="size-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Plus className="size-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Create Watchlist Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("discover.createWatchlist") ?? "Create Watchlist"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={newWatchlistName}
              onChange={(e) => setNewWatchlistName(e.target.value)}
              placeholder={t("discover.watchlistNamePlaceholder") ?? "Watchlist name"}
              className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
              maxLength={50}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateWatchlist();
              }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowCreateDialog(false)}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.cancel") ?? "Cancel"}
            </button>
            <button
              onClick={handleCreateWatchlist}
              disabled={!newWatchlistName.trim() || createMutation.isPending}
              className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {createMutation.isPending ? "..." : (t("common.create") ?? "Create")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Watchlist Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("discover.renameWatchlist") ?? "Rename Watchlist"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <input
              type="text"
              value={renameWatchlistName}
              onChange={(e) => setRenameWatchlistName(e.target.value)}
              placeholder={t("discover.watchlistNamePlaceholder") ?? "Watchlist name"}
              className="w-full h-10 px-3 bg-card border border-border rounded-lg text-sm outline-none focus:border-primary transition-colors"
              maxLength={50}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameWatchlist();
              }}
            />
          </div>
          <DialogFooter>
            <button
              onClick={() => setShowRenameDialog(false)}
              className="px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("common.cancel") ?? "Cancel"}
            </button>
            <button
              onClick={handleRenameWatchlist}
              disabled={!renameWatchlistName.trim() || renameMutation.isPending}
              className="px-4 py-2 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {renameMutation.isPending ? "..." : (t("common.save") ?? "Save")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Watchlist Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("discover.deleteWatchlistTitle") ?? "Delete Watchlist?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("discover.deleteWatchlistDescription") ?? 
                `Are you sure you want to delete "${currentWatchlist?.name ?? ""}"? All items in this watchlist will be permanently removed. This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("common.cancel") ?? "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteWatchlist}
              disabled={deleteMutation.isPending}
              className="bg-bearish text-white hover:bg-bearish/90"
            >
              {deleteMutation.isPending ? "..." : (t("discover.deleteWatchlist") ?? "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DiscoverScanner() {
  const { t } = useI18n();
  const fetchSignals = useStableServerFn(getDailySignals);
  const { data: signals = [], isLoading } = useQuery(
    useMemo(
      () => ({
        queryKey: ["daily-signals"] as const,
        queryFn: () => fetchSignals({ data: {} }),
        staleTime: 120_000,
      }),
      [fetchSignals],
    ),
  );

  const activeSignals = signals.filter((s: any) => s.recommendation !== "WAIT");

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-2 gap-3 mb-2">
        <button className="h-10 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center gap-1.5 border border-primary/20">
          <Flame className="size-4" /> {t("discover.hotBreakouts")}
        </button>
        <button className="h-10 rounded-lg bg-card text-muted-foreground font-bold text-xs flex items-center justify-center gap-1.5 border border-border">
          <Layers className="size-4" /> {t("discover.volumeSpikes")}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vixor-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-4 w-10" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : activeSignals.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <Flame className="size-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">{t("discover.noActiveSignals")}</div>
          <div className="text-[10px] text-muted-foreground mt-1">{t("discover.signalsDaily")}</div>
        </div>
      ) : (
        activeSignals.map((s: any) => {
          const isBuy = s.recommendation === "BUY";
          return (
            <div
              key={s.id}
              className="vixor-card p-4 border-l-4"
              style={{ borderLeftColor: isBuy ? "var(--color-bullish)" : "var(--color-bearish)" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg font-mono">{s.pair}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                  {s.timeframe}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm font-bold">
                <RecBadge rec={s.recommendation} />
                <span className="text-muted-foreground font-medium">
                  {s.confidence}% {t("signals.confidence").toLowerCase()}
                </span>
                <a
                  href={`/charts?symbol=BINANCE:${s.pair.replace("/", "")}`}
                  className="ml-auto text-xs font-bold text-primary hover:underline"
                >
                  {t("discover.analyze")}
                </a>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function DiscoverHeatmap() {
  const { t } = useI18n();
  const fetchPrices = useStableServerFn(getMarketPrices);
  const { data: prices = [], isLoading } = useQuery(
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

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm">{t("discover.marketHeatmap")}</h3>
          <p className="text-[10px] text-muted-foreground">{t("discover.24hChange")}</p>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-bold text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-bullish" /> {t("discover.gain")}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-2 rounded-full bg-bearish" /> {t("discover.loss")}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-lg h-20 shimmer" />
          ))}
        </div>
      ) : prices.length === 0 ? (
        <div className="vixor-card p-6 text-center">
          <BarChart2 className="size-6 text-muted-foreground/30 mx-auto mb-2" />
          <div className="text-xs text-muted-foreground">{t("discover.noHeatmapData")}</div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {prices.map((p: any) => {
            const change = p.change24h ?? 0;
            const isPositive = change >= 0;
            const intensity = Math.min(Math.abs(change) / 3, 1);
            return (
              <div
                key={p.pair}
                className={`rounded-lg p-3 text-center border transition-all cursor-pointer hover:scale-[1.02] ${
                  isPositive
                    ? "bg-bullish/5 border-bullish/20 hover:border-bullish/40"
                    : "bg-bearish/5 border-bearish/20 hover:border-bearish/40"
                }`}
                style={{
                  backgroundColor: isPositive
                    ? `rgba(34, 197, 94, ${0.05 + intensity * 0.2})`
                    : `rgba(239, 68, 68, ${0.05 + intensity * 0.2})`,
                }}
              >
                <div className="font-bold text-xs font-mono mb-1">{p.pair}</div>
                <div
                  className={`text-sm font-bold font-mono ${isPositive ? "text-bullish" : "text-bearish"}`}
                >
                  {isPositive ? "+" : ""}
                  {change.toFixed(2)}%
                </div>
                <div className="text-[9px] text-muted-foreground font-mono mt-0.5">
                  $
                  {Number(p.price).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: p.pair?.includes("JPY") ? 2 : 4,
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="vixor-card p-4 flex flex-col items-center justify-center text-center border-dashed">
        <BarChart2 className="size-6 text-muted-foreground/30 mb-2" />
        <div className="text-xs text-muted-foreground font-medium">
          {t("discover.interactiveHeatmapSoon")}
        </div>
        <div className="text-[10px] text-muted-foreground">
          With sector analysis & historical comparison
        </div>
      </div>
    </div>
  );
}

function DiscoverCalendar() {
  const { t } = useI18n();
  const fetchCalendar = useStableServerFn(getEconomicCalendar);
  const [dateFilter, setDateFilter] = useState<"today" | "week" | "nextweek">("week");
  const [impactFilter, setImpactFilter] = useState<"all" | "high" | "medium" | "low">("all");
  const [currencyFilter, setCurrencyFilter] = useState<"all" | "USD" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "CHF" | "NZD">("all");

  const daysMap = { today: 1, week: 7, nextweek: 14 };

  const { data: events = [], isLoading } = useQuery(
    useMemo(
      () => ({
        queryKey: ["economic-calendar", dateFilter] as const,
        queryFn: () => fetchCalendar({ data: { days: daysMap[dateFilter] } }),
        staleTime: 300_000,
      }),
      [fetchCalendar, dateFilter],
    ),
  );

  const filteredEvents = useMemo(() => {
    let filtered = events as any[];
    if (impactFilter !== "all") {
      filtered = filtered.filter((e) => e.impact === impactFilter);
    }
    if (currencyFilter !== "all") {
      filtered = filtered.filter((e) => e.currency === currencyFilter);
    }
    return filtered;
  }, [events, impactFilter, currencyFilter]);

  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups: Record<string, any[]> = {};
    for (const evt of filteredEvents) {
      const d = new Date(evt.date);
      const key = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      if (!groups[key]) groups[key] = [];
      groups[key].push(evt);
    }
    return groups;
  }, [filteredEvents]);

  const flagMap: Record<string, string> = { US: "🇺🇸", EU: "🇪🇺", UK: "🇬🇧", JP: "🇯🇵", AU: "🇦🇺", CA: "🇨🇦", CH: "🇨🇭", NZ: "🇳🇿" };

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Date Selector */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {(["today", "week", "nextweek"] as const).map((df) => (
          <button
            key={df}
            onClick={() => setDateFilter(df)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
              dateFilter === df
                ? "bg-primary/10 border-primary text-primary"
                : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {df === "today" ? t("discover.today") : df === "week" ? t("discover.thisWeek") : t("discover.nextWeek")}
          </button>
        ))}
      </div>

      {/* Filters Row */}
      <div className="flex gap-2 flex-wrap">
        {/* Impact Filter */}
        <div className="flex gap-1 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("discover.impactLevel")}</span>
          {(["all", "high", "medium", "low"] as const).map((imp) => (
            <button
              key={imp}
              onClick={() => setImpactFilter(imp)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                impactFilter === imp
                  ? imp === "high" ? "bg-bearish/15 border-bearish/40 text-bearish" : imp === "medium" ? "bg-neutral-wait/15 border-neutral-wait/40 text-neutral-wait" : imp === "low" ? "bg-muted border-border text-muted-foreground" : "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {imp === "all" ? t("discover.allImpacts") : imp === "high" ? t("discover.high") : imp === "medium" ? t("discover.medium") : t("discover.low")}
            </button>
          ))}
        </div>

        {/* Currency Filter */}
        <div className="flex gap-1 items-center flex-wrap">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("discover.currency") || "Currency"}</span>
          {(["all", "USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"] as const).map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrencyFilter(cur)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-all ${
                currencyFilter === cur
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {cur === "all" ? t("discover.allImpacts") : cur}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="vixor-card p-4">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="vixor-card p-8 text-center">
          <CalendarClock className="size-8 text-muted-foreground/20 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-foreground mb-1">{t("discover.noEvents")}</h3>
        </div>
      ) : (
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => (
            <div key={dateKey}>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 sticky top-0 bg-background py-1">
                {dateKey}
              </h3>
              <div className="space-y-2">
                {dayEvents.map((evt) => {
                  const eventDate = new Date(evt.date);
                  const timeStr = eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                  const impactColor = evt.impact === "high" ? "bg-bearish/15 text-bearish border-bearish/40" : evt.impact === "medium" ? "bg-neutral-wait/15 text-neutral-wait border-neutral-wait/40" : "bg-muted text-muted-foreground border-border";
                  const impactBorder = evt.impact === "high" ? "border-l-bearish border-l-[3px]" : evt.impact === "medium" ? "border-l-neutral-wait border-l-[3px]" : "";
                  return (
                    <div
                      key={evt.id}
                      className={`vixor-card p-3 flex items-center gap-3 ${impactBorder}`}
                      style={evt.impact === "high" ? { borderInlineStartColor: "var(--color-bearish)", borderInlineStartWidth: "3px" } : evt.impact === "medium" ? { borderInlineStartColor: "var(--color-neutral-wait)", borderInlineStartWidth: "3px" } : undefined}
                    >
                      <span className="text-xl shrink-0">{flagMap[evt.country] || "🌍"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm truncate">{evt.title}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${impactColor}`}>
                            {evt.impact === "high" ? t("discover.high") : evt.impact === "medium" ? t("discover.medium") : t("discover.low")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-mono font-bold">{evt.currency}</span>
                          <span>·</span>
                          <span className="font-mono">{timeStr}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end shrink-0 gap-0.5">
                        {evt.actual && (
                          <div className="text-right">
                            <span className="text-[9px] text-muted-foreground">{t("discover.actual")}: </span>
                            <span className="text-xs font-mono font-bold text-foreground">{evt.actual}</span>
                          </div>
                        )}
                        {evt.forecast && (
                          <div className="text-right">
                            <span className="text-[9px] text-muted-foreground">{t("discover.forecast")}: </span>
                            <span className="text-xs font-mono text-muted-foreground">{evt.forecast}</span>
                          </div>
                        )}
                        {evt.previous && (
                          <div className="text-right">
                            <span className="text-[9px] text-muted-foreground">{t("discover.previous")}: </span>
                            <span className="text-xs font-mono text-muted-foreground">{evt.previous}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Discover() {
  const { t } = useI18n();
  const [tab, setTab] = useState<(typeof TABS)[number]>("discover.watchlist");

  return (
    <div className="space-y-6 pb-6">
      <div className="pt-2">
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Compass className="size-6 text-primary" /> {t("discover.marketExplorer")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">{t("discover.whatsMoving")}</p>
      </div>

      {/* Global Search */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="size-4 text-muted-foreground" />
        </div>
        <input
          type="text"
          placeholder={t("discover.searchPlaceholder")}
          className="w-full h-12 pl-10 pr-4 bg-card border border-border rounded-xl text-sm outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 p-1 bg-card border border-border rounded-xl overflow-x-auto">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 min-w-[60px] h-9 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap ${tab === tabKey ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {t(tabKey)}
          </button>
        ))}
      </div>

      {tab === "discover.watchlist" && <DiscoverWatchlist />}
      {tab === "discover.scanner" && <DiscoverScanner />}
      {tab === "discover.calendar" && <DiscoverCalendar />}
      {tab === "discover.news" && <DiscoverNews />}
      {tab === "discover.heatmap" && <DiscoverHeatmap />}
    </div>
  );
}

function formatTimeAgo(timestamp: number) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
