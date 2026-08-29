import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/shared/supabase/auth-middleware";

// ── Communities Data (for communities page) ────────────────────────
export const getCommunitiesData = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const [{ data: strategies }, { data: notes }] = await Promise.all([
      supabase
        .from("user_strategies")
        .select(
          "id, user_id, name, pairs, trading_style, risk_tolerance, preferred_timeframes, is_active, created_at",
        )
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
