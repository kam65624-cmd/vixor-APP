// ============================================================================
// Watchlist Domain — Types
// ============================================================================

export interface Watchlist {
  id: string;
  user_id: string;
  name: string;
  is_default: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items?: WatchlistItem[];
}

export interface WatchlistItem {
  id: string;
  watchlist_id: string;
  pair: string;
  category: "forex" | "crypto" | "commodity" | "stocks";
  notes: string | null;
  sort_order: number;
  added_at: string;
}

export interface CreateWatchlistInput {
  name: string;
  isDefault?: boolean;
}

export interface RenameWatchlistInput {
  watchlistId: string;
  name: string;
}
