import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Portfolio & Holdings ─────────────────────────
export const getPortfolioData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!trades || trades.length === 0) {
      return { holdings: [], totalValue: 0, totalPnl: 0, totalPnlPct: 0, tradeCount: 0 };
    }

    const holdingMap = new Map<
      string,
      {
        symbol: string;
        name: string;
        amount: number;
        avgEntry: number;
        pnl: number;
        value: number;
        chain: string;
        pnlPct: number;
      }
    >();

    for (const t of trades) {
      const sym = t.pair || "UNKNOWN";
      const pnl = (t.exit_price || 0) - t.entry_price;
      const currentPrice = t.exit_price || t.entry_price;
      const qty = t.quantity || 1;
      const value = qty * currentPrice;

      if (holdingMap.has(sym)) {
        const e = holdingMap.get(sym)!;
        e.amount += qty;
        e.pnl += pnl;
        e.value += value;
        e.avgEntry = (e.avgEntry + t.entry_price) / 2;
      } else {
        holdingMap.set(sym, {
          symbol: sym,
          name: sym,
          amount: qty,
          avgEntry: t.entry_price,
          pnl,
          value,
          chain: "SOL",
          pnlPct: t.entry_price ? ((currentPrice - t.entry_price) / t.entry_price) * 100 : 0,
        });
      }
    }

    const holdingsArr = [...holdingMap.values()].sort((a, b) => b.value - a.value);
    const totalValue = holdingsArr.reduce((s, h) => s + h.value, 0);
    const totalPnl = holdingsArr.reduce((s, h) => s + h.pnl, 0);
    const totalPnlPct = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

    return {
      holdings: holdingsArr,
      totalValue,
      totalPnl,
      totalPnlPct,
      tradeCount: trades.length,
    };
  });

// ── Trade History (for PnL page) ─────────────────────────
export const getTradeHistory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ limit: z.number().optional() }).parse(d ?? {}))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const limit = data.limit || 50;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    return { trades: trades || [] };
  });

// ── Trading Journal ─────────────────────────
export const getJournalEntries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: entries } = await supabase
      .from("trading_notes")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    return { entries: entries || [] };
  });

// ── Points & Streaks ─────────────────────────
export const getUserPoints = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: balance } = await supabase
      .from("points_balances")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const { data: transactions } = await supabase
      .from("points_transactions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: streak } = await supabase
      .from("user_streaks")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return {
      balance: balance?.balance ?? 0,
      lifetimeEarned: balance?.lifetime_earned ?? 0,
      recentTransactions: transactions || [],
      streak,
    };
  });

// ── Referral Data ────────────────────────
export const getReferralData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code, id, username, display_name, streak_days, xp")
      .eq("id", userId)
      .single();

    const { count: referredCount } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", userId);

    const { data: txs } = await supabase
      .from("points_transactions")
      .select("delta, reason, created_at")
      .eq("user_id", userId)
      .eq("reason", "referral_bonus");

    const earnedPoints = txs?.reduce((s, t) => s + (t.delta || 0), 0) ?? 0;

    return {
      referralCode: profile?.referral_code || "VX" + userId.slice(0, 6).toUpperCase(),
      referredCount: referredCount ?? 0,
      earnedPoints,
      username: profile?.display_name || profile?.username || "Trader",
      streakDays: profile?.streak_days ?? 0,
      xp: profile?.xp ?? 0,
    };
  });

// ── Notifications ────────────────────────
export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: notifs } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return { notifications: notifs || [] };
  });

// ── User Settings ────────────────────────
export const getUserSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { settings: data || null };
  });

// ── User Profile ────────────────────────
export const getUserProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { profile };
  });

// ── Mark Notification Read ────────────────────────
export const markNotificationRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) => z.object({ id: z.string() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", data.id);
    return { success: true };
  });

// ── Update User Settings ────────────────────────
export const updateUserSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((d: unknown) =>
    z
      .object({
        preferred_llm_provider: z.string().optional(),
        notification_channels: z.any().optional(),
        telegram_chat_id: z.string().nullable().optional(),
        webhook_url: z.string().nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("user_settings")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("user_settings").update(data).eq("user_id", userId);
    } else {
      await supabase.from("user_settings").insert({ user_id: userId, ...data });
    }
    return { success: true };
  });

// ── Daily Signals (for signals page) ────────────────────────
export const getDailySignals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    return { signals: signals || [] };
  });

// ── Recent Analyses (for vision page) ────────────────────────
export const getRecentAnalyses = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);

    return { analyses: analyses || [] };
  });

// ── Watchlist Data (for trackers page) ────────────────────────
export const getWatchlistData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: watchlists } = await supabase
      .from("watchlists")
      .select("id, name, is_default, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    // watchlist_items doesn't have user_id — join via watchlists
    const { data: items } = await supabase
      .from("watchlist_items")
      .select("*")
      .order("added_at", { ascending: false })
      .limit(100);

    const { data: alerts } = await supabase
      .from("price_alerts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    return {
      watchlists: watchlists || [],
      watchlistItems: items || [],
      priceAlerts: alerts || [],
    };
  });

// ── Premium Plans & Subscription ────────────────────────
export const getPremiumData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: plans } = await supabase
      .from("premium_plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const { data: sub } = await supabase
      .from("premium_subscriptions")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    return { plans: plans || [], subscription: sub || null };
  });

// ── Dashboard Aggregated Data ────────────────────────
export const getDashboardData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [
      { data: trades },
      { data: signals },
      { data: analyses },
      { data: profile },
    ] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      supabase.from("daily_signals").select("*").order("created_at", { ascending: false }).limit(5),
      supabase.from("analyses").select("id, pair, recommendation, confidence, created_at, status").eq("user_id", userId).order("created_at", { ascending: false }).limit(5),
      supabase.from("profiles").select("username, display_name, xp, streak_days").eq("id", userId).single(),
    ]);

    // Compute portfolio from trades
    const holdingMap = new Map<string, { symbol: string; amount: number; value: number; pnl: number; pnlPct: number; up: boolean }>();
    for (const t of trades || []) {
      const sym = t.pair || "UNKNOWN";
      const pnl = (t.exit_price || 0) - t.entry_price;
      const price = t.exit_price || t.entry_price;
      const qty = t.quantity || 1;
      const value = qty * price;
      const pnlPct = t.entry_price ? ((price - t.entry_price) / t.entry_price) * 100 : 0;
      if (holdingMap.has(sym)) {
        const e = holdingMap.get(sym)!;
        e.amount += qty;
        e.value += value;
        e.pnl += pnl;
        e.pnlPct = pnlPct;
        e.up = pnlPct >= 0;
      } else {
        holdingMap.set(sym, { symbol: sym, amount: qty, value, pnl, pnlPct, up: pnlPct >= 0 });
      }
    }
    const holdings = [...holdingMap.values()].sort((a, b) => b.value - a.value).slice(0, 5);
    const totalValue = holdings.reduce((s, h) => s + h.value, 0);
    const totalPnl = holdings.reduce((s, h) => s + h.pnl, 0);
    const totalPnlPct = totalValue > 0 ? (totalPnl / totalValue) * 100 : 0;

    // Recent activity from trades
    const recentActivity = (trades || []).slice(0, 5).map((t) => ({
      msg: `${t.direction === "long" ? "Bought" : "Shorted"} ${t.quantity || 0} ${t.pair} at $${t.entry_price}`,
      time: formatRelativeTime(t.created_at),
      type: t.direction as "buy" | "sell",
      pnl: t.pnl != null ? (t.pnl >= 0 ? `+$${t.pnl.toFixed(2)}` : `-$${Math.abs(t.pnl).toFixed(2)}`) : "",
    }));

    // Signals from daily_signals
    const liveSignals = (signals || []).slice(0, 5).map((s) => ({
      token: s.pair.split("/")[0] || s.pair,
      type: s.recommendation as "BUY" | "SELL" | "WAIT",
      reason: s.reasons?.[0] || "Technical analysis signal",
      confidence: s.confidence,
      price: s.entry ? `$${s.entry}` : "—",
    }));

    return {
      holdings,
      totalValue,
      totalPnl,
      totalPnlPct,
      tradeCount: trades?.length ?? 0,
      recentActivity,
      liveSignals,
      profile: profile || null,
    };
  });

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}