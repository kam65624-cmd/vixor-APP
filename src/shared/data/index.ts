import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { Database } from "database.types";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://ayrnkxllvyqhzhsnvfqw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || "";

let supabase: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (supabase) return supabase;
  supabase = createClient(supabaseUrl, {
    auth: { persistSession: false, apiKey: supabaseKey },
    db: { schema: Database },
  });
  return supabase;
}

// ── Portfolio & Holdings ─────────────────────────
export const getPortfolioData = createServerFn({
  validator: () => z.object({ walletAddress: z.string().optional(), chain: z.string().optional() }),
  queryFn: async ({ walletAddress, chain }) => {
    const db = getSupabase();
    if (!walletAddress) return { holdings: [], totalValue: "$0.00", totalPnl: "$0.00", totalPnlPct: "0%" };

    // Try real on-chain data via wallet adapter
    try {
      const { getPortfolio } = await import("@/domains/wallet/adapter").then(m => m.getPortfolio);
      const portfolio = await getPortfolio(walletAddress, chain);
      if (portfolio && portfolio.length > 0) {
        const totalValue = portfolio.reduce((s, h) => s + (h.value || 0), 0);
        const totalPnl = portfolio.reduce((s, h) => s + (h.pnl || 0), 0);
        return { holdings: portfolio, totalValue: `$${totalValue.toFixed(2)}`, totalPnl: totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`, totalPnlPct: `${((totalPnl / (totalValue || 1)) * 100).toFixed(1)}%` };
      }
    } catch {}

    // Fallback: Query trades from Supabase
    const { data: trades } = await db
      .from("trades")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (trades && trades.length > 0) {
      const holdings = [];
      const holdingMap = new Map<string, object>();
      for (const t of trades) {
        const sym = t.symbol || "UNKNOWN";
        const pnl = (t.exit_price || 0) - (t.entry_price || 0);
        const currentPrice = t.exit_price || t.entry_price || 0;
        const value = (t.size || 1) * currentPrice;
        if (holdingMap.has(sym)) {
          const e = holdingMap.get(sym)!;
          holdingMap.set(sym, { ...e, amount: `${((parseFloat(e.amount) + (parseFloat(t.size) || 1)).toFixed(4)}`, pnl: e.pnl + pnl, value: e.value + value, avgEntry: (e.avgEntry * (t.entry_price || 0) + (t.entry_price || 0)) / 2 });
        } else {
          holdingMap.set(sym, { symbol: sym, name: t.pair || sym, amount: `${(parseFloat(t.size) || 1).toFixed(4)}`, chain: t.chain || "Solana", pnl, pnlPct: t.entry_price ? ((currentPrice - t.entry_price) / t.entry_price * 100 : 0, value, avgEntry: t.entry_price || 0, allocation: 0 });
        }
      }
      const holdingsArr = [...holdingMap.values()].sort((a, b) => b.value - a.value);
      const totalValue = holdingsArr.reduce((s, h) => s + h.value, 0);
      const totalPnl = holdingsArr.reduce((s, h) => s + h.pnl, 0);
      return { holdings: holdingsArr, totalValue: `$${totalValue.toFixed(2)}`, totalPnl: totalPnl >= 0 ? `+$${totalPnl.toFixed(2)}` : `-$${Math.abs(totalPnl).toFixed(2)}`, totalPnlPct: totalValue > 0 ? `${((totalPnl / totalValue) * 100).toFixed(1)}%` };
    }
    return { holdings: [], totalValue: "$0.00", totalPnl: "$0.00", totalPnlPct: "0%" };
  },
});

// ── PnL / Trade History ─────────────────────────
export const getTradeHistory = createServerFn({
  validator: () => z.object({ userId: z.string(), limit: z.number().optional().default(50) }),
  queryFn: async ({ userId, limit = 50 }) => {
    const db = getSupabase();
    const { data: trades } = await db.from("trades").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(limit || 50);
    return { trades: trades || [] };
  },
});

// ── Trading Journal ─────────────────────────
export const getJournalEntries = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const { data: entries } = await db.from("trading_notes").select("*").eq("user_id", userId).order("created_at", { ascending: false });
    return { entries: entries || [] };
  },
});

// ── Points & Streaks ─────────────────────────
export const getUserPoints = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const [balance] = await db.from("points_balances").select("balance").eq("user_id", userId).single();
    const { data: transactions } = await db.from("points_transactions").select("delta, metadata").eq("user_id", userId).order("created_at", { ascending: false }).limit(100);
    const [streak] = await db.from("user_streaks").select("*").eq("user_id", userId).single();
    return { balance: balance || 0, recentTransactions: transactions || [], streak };
  },
});

// ── Referral Data ────────────────────────
export const getReferralData = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const { data: profile } = await db.from("profiles").select("referral_code, id, username, display_name").eq("id", userId).single();
    const { count: referredCount } = await db.from("profiles").select("id", { count: "count" }).as("c", { count: 0 }).eq("referred_by", userId));
    const { data: txs } = await db.from("points_transactions").select("delta, metadata").eq("user_id", userId).eq("metadata->reason", "referral_bonus").select("delta");
    const earnedPoints = txs?.reduce((s, t) => s + (t.delta || 0), 0);
    return {
      referralCode: profile?.referral_code || "VX" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      referredCount: referredCount?.count || 0,
      earnedPoints: earnedPoints || 0,
      username: profile?.display_name || "Anon",
      userId,
    };
  },
});

// ── Notifications ────────────────────────
export const getNotifications = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const { data: notifs } = await db.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
    return { notifications: notifs || [] };
  },
});

// ── User Settings ────────────────────────
export const getUserSettings = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const { data } = await db.from("user_settings").select("*").eq("user_id", userId).single();
    return { settings: data || {} };
  },
});

// ── User Profile ────────────────────────
export const getUserProfile = createServerFn({
  validator: () => z.object({ userId: z.string() }),
  queryFn: async ({ userId }) => {
    const db = getSupabase();
    const { data: profile } = await db.from("profiles").select("id, username, display_name, avatar_url, created_at, referral_code, daily_login_count").eq("id", userId).single();
    return { profile };
  },
});