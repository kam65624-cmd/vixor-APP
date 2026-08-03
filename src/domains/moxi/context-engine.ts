// ============================================================================
// MOXI — Context Engine
// ============================================================================
//
// Assembles real-time context for MOXI's system prompt. Fetches user profile,
// active trackings, recent analyses, watchlist, live prices, daily signals,
// and economic events — all from the existing codebase data layer.
// ============================================================================

import { fetchPrices, POPULAR_PAIRS } from "@/domains/market/server/price-fetcher";
import type { PriceResult } from "@/domains/market/server/price-fetcher";
import type { SignalTracking } from "@/domains/signal-tracking/types";

// ─── MoxiContext Shape ──────────────────────────────────────────────────────

export interface MoxiContext {
  /** User profile row from `profiles` table */
  profile: Record<string, unknown> | null;
  /** Active strategy from `user_strategies` */
  strategy: Record<string, unknown> | null;
  /** Active (non-terminal) signal trackings */
  activeTrackings: Pick<
    SignalTracking,
    "pair" | "direction" | "entry_price" | "stop_loss" | "take_profit" | "status"
  >[];
  /** Last 5 user analyses */
  recentAnalyses: Array<{
    id: string;
    pair: string;
    timeframe: string;
    recommendation: string;
    confidence: number;
    pattern?: string;
    status?: string;
    created_at: string;
  }>;
  /** Daily signals (last 5) */
  dailySignals: Array<{
    pair: string;
    timeframe?: string;
    recommendation: string;
    confidence: number;
    pattern?: string;
  }>;
  /** Watchlist items */
  watchlist: Array<{ pair: string; notes?: string; category?: string }>;
  /** Live market prices */
  marketPrices: PriceResult[];
  /** Notable economic/market events */
  notableEvents: Array<{
    title: string;
    date?: string;
    impact?: string;
    currency?: string;
    forecast?: string;
    previous?: string;
  }>;
  /** ISO timestamp of when context was built */
  currentTime: string;
  /** Learned user memory from MemoryStore (if available) */
  memoryContext?: string;
}

// ─── Build Full Context ─────────────────────────────────────────────────────

/**
 * Assembles all real-time data needed for MOXI's system prompt.
 * Uses existing data-fetching patterns from the MOXI domain — no new
 * data fetching logic, just parallel aggregation.
 */
export async function buildMoxiContext(userId: string, supabase: any): Promise<MoxiContext> {
  const [
    profileResult,
    strategyResult,
    trackingsResult,
    analysesResult,
    signalsResult,
    watchlistResult,
    alertsResult,
    marketPrices,
    economicEvents,
  ] = await Promise.all([
    // User profile
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),

    // Active strategy
    supabase
      .from("user_strategies")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle(),

    // Active signal trackings (non-terminal statuses)
    supabase
      .from("signal_tracking")
      .select("pair, direction, entry_price, stop_loss, take_profit, status")
      .eq("user_id", userId)
      .in("status", ["pending", "active"])
      .order("created_at", { ascending: false })
      .limit(20),

    // Recent analyses (last 5)
    supabase
      .from("analyses")
      .select("id, pair, timeframe, recommendation, confidence, pattern, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),

    // Daily signals (last 5)
    supabase
      .from("daily_signals")
      .select("pair, timeframe, recommendation, confidence, pattern")
      .order("signal_date", { ascending: false })
      .limit(5),

    // Watchlist items
    (async () => {
      try {
        const { data } = await supabase
          .from("watchlist_items")
          .select("pair, notes, category")
          .limit(20);
        return { data: data ?? [] };
      } catch {
        return { data: [] };
      }
    })(),

    // Active price alerts (for status endpoint)
    supabase
      .from("price_alerts")
      .select("pair, condition, target_price, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .limit(10),

    // Live market prices — fetch for popular pairs + watchlist + tracked pairs
    (async (): Promise<PriceResult[]> => {
      try {
        // We'll get watchlist + trackings from the other queries, but we need
        // prices now. Start with popular pairs (always available), then we
        // augment with pair-specific prices below.
        const pairs = POPULAR_PAIRS.map((p) => p.pair);
        return await fetchPrices(pairs);
      } catch {
        return [];
      }
    })(),

    // Economic events
    (async () => {
      try {
        const { fetchEconomicCalendar } = await import("@/domains/market/server/economic-calendar");
        return await fetchEconomicCalendar(3); // Next 3 days is enough for MOXI
      } catch {
        return [];
      }
    })(),
  ]);

  // ── Augment prices with watchlist + tracked signal pairs ──
  const extraPairs: string[] = [];
  const watchlistItems = watchlistResult.data ?? [];
  for (const w of watchlistItems) {
    if (w.pair && !extraPairs.includes(w.pair)) extraPairs.push(w.pair);
  }
  const trackings = trackingsResult.data ?? [];
  for (const t of trackings) {
    if (t.pair && !extraPairs.includes(t.pair)) extraPairs.push(t.pair);
  }
  // Filter out pairs we already have from POPULAR_PAIRS
  const existingPairs = new Set(marketPrices.map((p) => p.pair));
  const newPairs = extraPairs.filter((p) => !existingPairs.has(p));

  let extraPrices: PriceResult[] = [];
  if (newPairs.length > 0) {
    try {
      extraPrices = await fetchPrices(newPairs);
    } catch {
      // Non-fatal
    }
  }

  // Merge prices, dedup by pair (prefer live over extra)
  const allPrices = [...marketPrices];
  for (const ep of extraPrices) {
    if (!allPrices.some((p) => p.pair === ep.pair)) {
      allPrices.push(ep);
    }
  }

  // ── Load user memory (non-critical) ──
  let memoryContext: string | undefined;
  try {
    const { MemoryStore } = await import("@/shared/memory");
    memoryContext = await MemoryStore.contextForPrompt(userId);
  } catch {
    // Non-critical — MOXI works fine without memory
  }

  return {
    profile: profileResult.data ?? null,
    strategy: strategyResult.data ?? null,
    activeTrackings: (trackingsResult.data ?? []).map((t: any) => ({
      pair: t.pair,
      direction: t.direction,
      entry_price: t.entry_price,
      stop_loss: t.stop_loss,
      take_profit: t.take_profit,
      status: t.status,
    })),
    recentAnalyses: analysesResult.data ?? [],
    dailySignals: signalsResult.data ?? [],
    watchlist: watchlistItems,
    marketPrices: allPrices,
    notableEvents: economicEvents,
    currentTime: new Date().toISOString(),
    memoryContext:
      memoryContext && memoryContext !== "No stored memories for this user yet."
        ? memoryContext
        : undefined,
  };
}
