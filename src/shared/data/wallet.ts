import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

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
        .select(
          "id, username, display_name, xp, streak_days, avatar_url, telegram_photo_url, referral_code",
        )
        .eq("id", userId)
        .single(),
    ]);

    // Build token balances from trades (aggregated by pair)
    const tokenMap = new Map<
      string,
      {
        symbol: string;
        amount: number;
        totalEntry: number;
        totalValue: number;
        pnl: number;
        tradeCount: number;
        lastPrice: number;
        direction: string;
      }
    >();

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
