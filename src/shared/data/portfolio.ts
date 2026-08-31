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
