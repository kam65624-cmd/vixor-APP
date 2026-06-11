// ============================================================================
// VIXOR Tool Registrations — Journal & Analysis Tools
// ============================================================================

import { ToolRegistry, type ToolContext, type ToolResult } from "../types";

// ── createJournalEntry ──────────────────────────────────────────────────────

ToolRegistry.register({
  name: "createJournalEntry",
  description: "Create a trading journal note. Can include mood, pair context, and link to an analysis.",
  category: "journal",
  permissions: ["authenticated"],
  mutative: true,
  parameters: [
    { name: "content", type: "string", description: "The journal entry content", required: true },
    { name: "pair", type: "string", description: "Related trading pair (optional)", required: false },
    { name: "mood", type: "string", description: "Trading mood", required: false, enum: ["confident", "cautious", "anxious", "neutral"] },
    { name: "analysisId", type: "string", description: "Link to an analysis ID (optional)", required: false },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");
      const { VixorEvents } = await import("@/shared/events");

      const { data: note, error } = await supabaseAdmin
        .from("trading_notes")
        .insert({
          user_id: context.userId,
          content: input.content as string,
          pair: (input.pair as string) || null,
          mood: (input.mood as string) || null,
          analysis_id: (input.analysisId as string) || null,
        })
        .select("*")
        .single();

      if (error) return { success: false, error: error.message };

      void VixorEvents.emit("journal.created", {
        noteId: note.id,
        userId: context.userId,
        pair: (input.pair as string) || undefined,
        mood: (input.mood as string) || undefined,
      });

      return { success: true, data: note };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── analyzeAsset ─────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "analyzeAsset",
  description: "Run SMC/ICT technical analysis on a trading pair. Returns market structure, order blocks, FVGs, liquidity zones, and a trade recommendation.",
  category: "analysis",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    { name: "pair", type: "string", description: "Trading pair to analyze (e.g., BTC/USDT, XAU/USD)", required: true },
    { name: "timeframe", type: "string", description: "Analysis timeframe (e.g., 1H, 4H, 1D)", required: false },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { runLocalAnalysis } = await import("@/domains/analysis/engine/engine");
      const { fetchBinanceKlines, fetchTwelveDataKlines } = await import("@/domains/market/server/price-fetcher");
      const { AssetRegistry } = await import("@/shared/asset-registry");
      const { VixorEvents } = await import("@/shared/events");

      const pair = input.pair as string;
      const tf = (input.timeframe as string) || "4H";

      // Fetch OHLCV data
      let bars;
      if (AssetRegistry.isCrypto(pair)) {
        bars = await fetchBinanceKlines(pair, tf, 200);
      }
      if (!bars || bars.length <= 20) {
        const tdBars = await fetchTwelveDataKlines(pair, tf, 200);
        if (tdBars.length > 20) bars = tdBars;
      }

      // Run analysis
      const result = runLocalAnalysis({
        pair,
        timeframe: tf,
        tradingStyle: "Day Trading",
        bars: bars && bars.length > 20 ? bars : undefined,
      });

      void VixorEvents.emit("analysis.created", {
        analysisId: `tool-${Date.now()}`,
        pair,
        timeframe: tf,
        userId: context.userId,
        recommendation: result.recommendation,
        confidence: result.confidence,
      });

      return { success: true, data: result };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── fetchPortfolio ───────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "fetchPortfolio",
  description: "Get the user's trade history, PnL stats, and equity curve data.",
  category: "portfolio",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    { name: "limit", type: "number", description: "Max number of trades to return (default 20)", required: false },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const limit = (input.limit as number) || 20;

      const { data: trades, error } = await supabaseAdmin
        .from("trades")
        .select("*")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) return { success: false, error: error.message };

      return { success: true, data: trades ?? [] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});
