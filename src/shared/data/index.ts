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

// ── Yield Data (for yield page) ────────────────────────
export const getYieldData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "closed")
      .order("created_at", { ascending: false });

    const allClosed = trades || [];
    const profitable = allClosed.filter((t) => (t.pnl ?? 0) > 0);

    const totalYield = profitable.reduce((s, t) => s + (t.pnl ?? 0), 0);
    const avgYield = profitable.length > 0 ? totalYield / profitable.length : 0;
    const bestYield = profitable.length > 0
      ? Math.max(...profitable.map((t) => t.pnl ?? 0))
      : 0;
    const bestTrade = profitable.find((t) => t.pnl === bestYield) || null;

    // Build yield positions from profitable trades
    const yieldPositions = profitable.map((t) => {
      const entryDate = new Date(t.entry_date || t.created_at);
      const exitDate = new Date(t.exit_date || t.created_at);
      const durationMs = exitDate.getTime() - entryDate.getTime();
      const durationDays = Math.max(1, Math.ceil(durationMs / (1000 * 60 * 60 * 24)));
      const yieldPct = t.entry_price > 0 ? ((t.pnl ?? 0) / (t.entry_price * (t.quantity || 1))) * 100 : 0;

      return {
        id: t.id,
        pair: t.pair,
        yield: t.pnl ?? 0,
        yieldPct,
        duration: durationDays,
        entryPrice: t.entry_price,
        exitPrice: t.exit_price ?? t.entry_price,
        direction: t.direction,
        quantity: t.quantity ?? 1,
        rMultiple: t.r_multiple,
        entryDate: t.entry_date || t.created_at,
        exitDate: t.exit_date || t.created_at,
      };
    });

    return {
      totalYield,
      avgYield,
      bestYield,
      bestTrade: bestTrade ? {
        pair: bestTrade.pair,
        yield: bestTrade.pnl ?? 0,
        direction: bestTrade.direction,
      } : null,
      yieldCount: profitable.length,
      totalClosed: allClosed.length,
      positions: yieldPositions,
    };
  });

// ── Predictions Data (for predictions page) ────────────────────────
export const getPredictionsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: analyses }, { data: signals }] = await Promise.all([
      supabase
        .from("analyses")
        .select("id, pair, recommendation, confidence, pattern, trend, status, entry, stop_loss, take_profit, created_at, timeframe, reasons, risk_level")
        .eq("user_id", userId)
        .eq("status", "complete")
        .order("created_at", { ascending: false })
        .limit(50),
      supabase
        .from("daily_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Build predictions from analyses
    const analysisPredictions = (analyses || []).map((a) => ({
      id: a.id,
      source: "analysis" as const,
      pair: a.pair || "—",
      predictedDirection: a.recommendation || "WAIT",
      confidence: a.confidence ?? 0,
      pattern: a.pattern,
      trend: a.trend,
      entry: a.entry,
      stopLoss: a.stop_loss,
      takeProfit: a.take_profit,
      timeframe: a.timeframe,
      reasons: a.reasons,
      riskLevel: a.risk_level,
      createdAt: a.created_at,
      // No actual outcome data available — mark as pending
      outcome: null as string | null,
      correct: null as boolean | null,
    }));

    // Build predictions from daily_signals
    const signalPredictions = (signals || []).map((s) => ({
      id: s.id,
      source: "signal" as const,
      pair: s.pair,
      predictedDirection: s.recommendation,
      confidence: s.confidence,
      pattern: s.pattern,
      trend: null,
      entry: s.entry,
      stopLoss: s.stop_loss,
      takeProfit: s.take_profit,
      timeframe: s.timeframe,
      reasons: s.reasons,
      riskLevel: null,
      createdAt: s.created_at,
      outcome: null as string | null,
      correct: null as boolean | null,
    }));

    // Merge and sort by date
    const allPredictions = [...analysisPredictions, ...signalPredictions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const totalPredictions = allPredictions.length;
    const buyPredictions = allPredictions.filter((p) => p.predictedDirection === "BUY").length;
    const sellPredictions = allPredictions.filter((p) => p.predictedDirection === "SELL").length;
    const avgConfidence = totalPredictions > 0
      ? Math.round(allPredictions.reduce((s, p) => s + p.confidence, 0) / totalPredictions)
      : 0;
    const predictionsWithOutcome = allPredictions.filter((p) => p.correct !== null);
    const accuracy = predictionsWithOutcome.length > 0
      ? Math.round((predictionsWithOutcome.filter((p) => p.correct).length / predictionsWithOutcome.length) * 100)
      : 0;

    return {
      predictions: allPredictions,
      totalPredictions,
      buyPredictions,
      sellPredictions,
      avgConfidence,
      accuracy,
    };
  });

// ── Wallet Data (for wallet-web3 page) ────────────────────────
export const getWalletData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: trades }, { data: profile }] = await Promise.all([
      supabase
        .from("trades")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, username, display_name, xp, streak_days, avatar_url, telegram_photo_url, referral_code")
        .eq("id", userId)
        .single(),
    ]);

    // Build token balances from trades (aggregated by pair)
    const tokenMap = new Map<string, {
      symbol: string;
      amount: number;
      totalEntry: number;
      totalValue: number;
      pnl: number;
      tradeCount: number;
      lastPrice: number;
      direction: string;
    }>();

    for (const t of trades || []) {
      const sym = t.pair || "UNKNOWN";
      const qty = t.quantity || 1;
      const exitVal = (t.exit_price || t.entry_price) * qty;
      const pnl = t.pnl ?? ((t.exit_price || 0) - t.entry_price) * qty;

      if (tokenMap.has(sym)) {
        const existing = tokenMap.get(sym)!;
        existing.amount += qty;
        existing.totalEntry += t.entry_price * qty;
        existing.totalValue += exitVal;
        existing.pnl += pnl;
        existing.tradeCount += 1;
        existing.lastPrice = t.exit_price || t.entry_price;
        existing.direction = t.direction;
      } else {
        tokenMap.set(sym, {
          symbol: sym,
          amount: qty,
          totalEntry: t.entry_price * qty,
          totalValue: exitVal,
          pnl,
          tradeCount: 1,
          lastPrice: t.exit_price || t.entry_price,
          direction: t.direction,
        });
      }
    }

    const tokens = [...tokenMap.values()].sort((a, b) => b.totalValue - a.totalValue);
    const totalPortfolioValue = tokens.reduce((s, t) => s + t.totalValue, 0);
    const totalPnl = tokens.reduce((s, t) => s + t.pnl, 0);
    const activeTrades = (trades || []).filter((t) => t.status === "open").length;

    // Recent transactions
    const recentTxns = (trades || []).slice(0, 20).map((t) => ({
      id: t.id,
      pair: t.pair,
      type: t.direction === "long" ? "BUY" : "SELL",
      amount: t.quantity ?? 1,
      price: t.entry_price,
      pnl: t.pnl,
      status: t.status,
      createdAt: t.created_at,
    }));

    return {
      tokens,
      totalPortfolioValue,
      totalPnl,
      activeTrades,
      totalTrades: trades?.length ?? 0,
      recentTransactions: recentTxns,
      profile: profile || null,
    };
  });

// ── Communities Data (for communities page) ────────────────────────
export const getCommunitiesData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: strategies }, { data: notes }] = await Promise.all([
      supabase
        .from("user_strategies")
        .select("id, user_id, name, pairs, trading_style, risk_tolerance, preferred_timeframes, is_active, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("trading_notes")
        .select("id, user_id, title, content, pair, tags, mood, is_pinned, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    // Community strategies (user's own strategies shared as community strategies)
    const communityStrategies = (strategies || []).map((s) => ({
      id: s.id,
      name: s.name,
      pairs: s.pairs || [],
      tradingStyle: s.trading_style,
      riskTolerance: s.risk_tolerance,
      timeframes: s.preferred_timeframes || [],
      isActive: s.is_active,
      createdAt: s.created_at,
    }));

    // Community discussions (user's journal entries as community posts)
    const communityPosts = (notes || []).map((n) => ({
      id: n.id,
      title: n.title,
      content: n.content,
      pair: n.pair,
      tags: n.tags || [],
      mood: n.mood,
      isPinned: n.is_pinned,
      createdAt: n.created_at,
    }));

    // Count unique active traders (unique user_ids in notes)
    const uniqueTraders = new Set((notes || []).map((n) => n.user_id)).size;

    return {
      strategies: communityStrategies,
      posts: communityPosts,
      strategyCount: (strategies || []).length,
      postCount: (notes || []).length,
      activeTraders: uniqueTraders,
    };
  });

// ── Whale Alerts Data ────────────────────────
export const getWhaleData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const allTrades = trades || [];

    // Compute trade value (quantity * entry_price) and sort descending
    const tradesWithValue = allTrades.map((t) => ({
      ...t,
      tradeValue: (t.quantity || 1) * (t.entry_price || 0),
    }));

    const sorted = tradesWithValue.sort((a, b) => b.tradeValue - a.tradeValue);
    const topWhales = sorted.slice(0, 20);

    // 24h volume
    const now = Date.now();
    const dayAgo = now - 24 * 60 * 60 * 1000;
    const recentTrades = allTrades.filter((t) => new Date(t.created_at).getTime() > dayAgo);
    const volume24h = recentTrades.reduce((sum, t) => sum + (t.quantity || 1) * (t.entry_price || 0), 0);

    // Biggest trade
    const biggest = topWhales[0] || null;

    return {
      whaleTrades: topWhales,
      stats: {
        volume24h,
        largeTradeCount: topWhales.length,
        biggestTrade: biggest ? biggest.tradeValue : 0,
        biggestPair: biggest?.pair || "—",
      },
    };
  });

// ── Bonding Curves / Accumulation Data ────────────────────────
export const getBondingCurveData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const allTrades = trades || [];

    // Group trades by pair
    const pairMap = new Map<
      string,
      {
        pair: string;
        buyCount: number;
        sellCount: number;
        totalBuys: number;
        totalSells: number;
        totalVolume: number;
        lastTradeAt: string;
      }
    >();

    for (const t of allTrades) {
      const pair = t.pair || "UNKNOWN";
      const qty = t.quantity || 1;
      const price = t.entry_price || 0;
      const value = qty * price;
      const isBuy = t.direction === "long";

      if (pairMap.has(pair)) {
        const entry = pairMap.get(pair)!;
        if (isBuy) {
          entry.buyCount++;
          entry.totalBuys += qty;
        } else {
          entry.sellCount++;
          entry.totalSells += qty;
        }
        entry.totalVolume += value;
        if (new Date(t.created_at).getTime() > new Date(entry.lastTradeAt).getTime()) {
          entry.lastTradeAt = t.created_at;
        }
      } else {
        pairMap.set(pair, {
          pair,
          buyCount: isBuy ? 1 : 0,
          sellCount: isBuy ? 0 : 1,
          totalBuys: isBuy ? qty : 0,
          totalSells: isBuy ? 0 : qty,
          totalVolume: value,
          lastTradeAt: t.created_at,
        });
      }
    }

    // Sort by buy/sell ratio (accumulation signal)
    const pairs = [...pairMap.values()]
      .map((p) => ({
        ...p,
        ratio: p.buyCount > 0 && p.sellCount > 0
          ? p.buyCount / p.sellCount
          : p.buyCount > 0
            ? p.buyCount
            : 0,
      }))
      .sort((a, b) => b.ratio - a.ratio);

    // Pairs being accumulated (buy count > sell count)
    const accumulating = pairs.filter((p) => p.buyCount > p.sellCount);

    // Most traded pair
    const mostTraded = pairs.length > 0
      ? pairs.reduce((a, b) => (a.totalVolume > b.totalVolume ? a : b))
      : null;

    return {
      pairs,
      accumulating,
      stats: {
        accumulatingCount: accumulating.length,
        uniquePairs: pairs.length,
        mostTradedPair: mostTraded?.pair || "—",
        mostTradedVolume: mostTraded?.totalVolume || 0,
      },
    };
  });

// ── Alpha Signals Data ────────────────────────
export const getAlphaData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .eq("recommendation", "BUY")
      .gte("confidence", 70)
      .order("confidence", { ascending: false })
      .limit(30);

    const { data: analyses } = await supabase
      .from("analyses")
      .select("*")
      .eq("user_id", userId)
      .eq("recommendation", "BUY")
      .eq("status", "complete")
      .gte("confidence", 70)
      .order("confidence", { ascending: false })
      .limit(20);

    const allSignals = signals || [];
    const allAnalyses = analyses || [];

    // Combine into a unified alpha feed
    const alphaFeed = [
      ...allSignals.map((s) => ({
        id: s.id,
        source: "signal" as const,
        pair: s.pair,
        confidence: s.confidence,
        pattern: s.pattern,
        entry: s.entry,
        stopLoss: s.stop_loss,
        takeProfit: s.take_profit,
        timeframe: s.timeframe,
        reasons: s.reasons,
        createdAt: s.created_at,
      })),
      ...allAnalyses.map((a) => ({
        id: a.id,
        source: "analysis" as const,
        pair: a.pair,
        confidence: a.confidence,
        pattern: a.pattern,
        entry: a.entry,
        stopLoss: a.stop_loss,
        takeProfit: a.take_profit,
        timeframe: a.timeframe,
        reasons: a.reasons,
        createdAt: a.created_at,
      })),
    ].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0));

    const avgConfidence = alphaFeed.length > 0
      ? Math.round(alphaFeed.reduce((s, a) => s + (a.confidence ?? 0), 0) / alphaFeed.length)
      : 0;
    const highestConf = alphaFeed.length > 0 ? (alphaFeed[0].confidence ?? 0) : 0;
    const highestPair = alphaFeed.length > 0 ? alphaFeed[0].pair : "—";

    return {
      alphaFeed,
      stats: {
        activeBuySignals: alphaFeed.length,
        avgConfidence,
        highestConfidence: highestConf,
        highestConfidencePair: highestPair,
        signalCount: allSignals.length,
        analysisCount: allAnalyses.length,
      },
    };
  });

// ── Market Pulse Data ────────────────────────
export const getPulseData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: trades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(30);

    const { data: signals } = await supabase
      .from("daily_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    const allTrades = trades || [];
    const allSignals = signals || [];

    // Build pulse feed from trades
    const pulseFeed = allTrades.map((t) => ({
      id: t.id,
      type: "trade" as const,
      action: t.direction === "long" ? "BOUGHT" : "SOLD",
      pair: t.pair || "—",
      price: t.entry_price,
      quantity: t.quantity,
      pnl: t.pnl,
      status: t.status,
      createdAt: t.created_at,
    }));

    // Build pulse feed from signals
    const signalFeed = allSignals.map((s) => ({
      id: s.id,
      type: "signal" as const,
      action: s.recommendation,
      pair: s.pair || "—",
      confidence: s.confidence,
      pattern: s.pattern,
      createdAt: s.created_at,
    }));

    // Merge and sort by time
    const combined = [
      ...pulseFeed.map((p) => ({ ...p, _time: new Date(p.createdAt).getTime() })),
      ...signalFeed.map((s) => ({ ...s, _time: new Date(s.createdAt).getTime() })),
    ].sort((a, b) => b._time - a._time);

    // Stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const tradesToday = allTrades.filter((t) => new Date(t.created_at) >= todayStart).length;
    const signalsToday = allSignals.filter((s) => new Date(s.created_at) >= todayStart).length;

    // Most active pair
    const pairCounts = new Map<string, number>();
    for (const t of allTrades) {
      const pair = t.pair || "—";
      pairCounts.set(pair, (pairCounts.get(pair) || 0) + 1);
    }
    let mostActivePair = "—";
    let maxCount = 0;
    for (const [pair, count] of pairCounts) {
      if (count > maxCount) {
        maxCount = count;
        mostActivePair = pair;
      }
    }

    return {
      feed: combined,
      stats: {
        tradesToday,
        signalsToday,
        mostActivePair,
        totalTrades: allTrades.length,
        totalSignals: allSignals.length,
      },
    };
  });

// ── Perpetuals / Positions Data ────────────────────────
export const getPerpetualsData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Open positions
    const { data: openTrades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "open")
      .order("created_at", { ascending: false });

    // Recent closed trades
    const { data: closedTrades } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", userId)
      .neq("status", "open")
      .order("exit_date", { ascending: false })
      .limit(20);

    const openPositions = (openTrades || []).map((t) => ({
      id: t.id,
      pair: t.pair || "—",
      direction: t.direction === "long" ? "LONG" : "SHORT",
      entryPrice: t.entry_price || 0,
      quantity: t.quantity || 1,
      stopLoss: t.stop_loss,
      takeProfit: t.take_profit,
      pnl: t.pnl || 0,
      rMultiple: t.r_multiple || 0,
      createdAt: t.created_at,
      entryDate: t.entry_date,
    }));

    const closedPerformance = (closedTrades || []).map((t) => ({
      id: t.id,
      pair: t.pair || "—",
      direction: t.direction === "long" ? "LONG" : "SHORT",
      entryPrice: t.entry_price || 0,
      exitPrice: t.exit_price || 0,
      quantity: t.quantity || 1,
      pnl: t.pnl || 0,
      rMultiple: t.r_multiple || 0,
      status: t.status,
      createdAt: t.created_at,
      exitDate: t.exit_date,
    }));

    // Compute stats
    const totalUnrealizedPnl = openPositions.reduce((sum, p) => sum + p.pnl, 0);
    const totalRealizedPnl = closedPerformance.reduce((sum, t) => sum + t.pnl, 0);

    // Best performing pair from closed trades
    const pairPnlMap = new Map<string, number>();
    for (const t of closedPerformance) {
      pairPnlMap.set(t.pair, (pairPnlMap.get(t.pair) || 0) + t.pnl);
    }
    let bestPair = "—";
    let bestPnl = -Infinity;
    for (const [pair, pnl] of pairPnlMap) {
      if (pnl > bestPnl) {
        bestPnl = pnl;
        bestPair = pair;
      }
    }
    if (bestPnl === -Infinity) bestPnl = 0;

    const winningTrades = closedPerformance.filter((t) => t.pnl > 0).length;
    const totalClosed = closedPerformance.length;
    const winRate = totalClosed > 0 ? Math.round((winningTrades / totalClosed) * 100) : 0;

    return {
      openPositions,
      closedPerformance,
      stats: {
        openCount: openPositions.length,
        totalUnrealizedPnl,
        totalRealizedPnl,
        bestPair,
        bestPairPnl: bestPnl,
        winRate,
        totalClosed,
      },
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