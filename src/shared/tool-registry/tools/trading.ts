// ============================================================================
// VIXOR Tool Registrations — Trading Tools
// ============================================================================
//
// Wraps existing createServerFn functions as Tool Registry entries.
// This enables the AI Agent to discover and call these tools.
//
// IMPORTANT: The original createServerFn functions continue to work.
// These tool registrations are ADDITIVE — they add metadata and discovery
// on top of the existing implementations.
// ============================================================================

import { ToolRegistry, type ToolContext, type ToolResult } from "../types";
import { VixorEvents } from "@/shared/events";

// ── createAlert ──────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "createAlert",
  description:
    "Create a price alert for a trading pair. The alert will notify the user when the price reaches the target.",
  category: "trading",
  permissions: ["authenticated"],
  mutative: true,
  parameters: [
    {
      name: "pair",
      type: "string",
      description: "Trading pair (e.g., BTC/USDT, XAU/USD, EUR/USD)",
      required: true,
    },
    {
      name: "condition",
      type: "string",
      description: "Alert condition",
      required: true,
      enum: ["above", "below", "crosses_up", "crosses_down"],
    },
    {
      name: "targetPrice",
      type: "number",
      description: "Target price for the alert",
      required: true,
    },
    {
      name: "timeframe",
      type: "string",
      description: "Timeframe context (e.g., 1H, 4H, 1D)",
      required: false,
    },
    { name: "note", type: "string", description: "Optional note for the alert", required: false },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { data: alert, error } = await supabaseAdmin
        .from("price_alerts")
        .insert({
          user_id: context.userId,
          symbol: input.pair as string,
          pair: input.pair as string,
          condition: input.condition as "above" | "below" | "crosses_up" | "crosses_down",
          target_price: input.targetPrice as number,
          current_price: null,
          note: (input.note as string) || null,
          timeframe: (input.timeframe as string) || "1H",
          status: "active",
        })
        .select("*")
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      // Emit event
      void VixorEvents.emit("alert.created", {
        alertId: alert.id,
        userId: context.userId,
        pair: input.pair as string,
        condition: input.condition as string,
        targetPrice: input.targetPrice as number,
      });

      return { success: true, data: alert };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── fetchSignals ─────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "fetchSignals",
  description:
    "Fetch today's daily trading signals. Returns BUY/SELL/WAIT recommendations with confidence scores, entry/exit levels.",
  category: "trading",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    {
      name: "pair",
      type: "string",
      description: "Filter by trading pair (optional)",
      required: false,
    },
    {
      name: "timeframe",
      type: "string",
      description: "Filter by timeframe (optional)",
      required: false,
    },
    {
      name: "recommendation",
      type: "string",
      description: "Filter by recommendation type",
      required: false,
      enum: ["BUY", "SELL", "WAIT"],
    },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const today = new Date().toISOString().split("T")[0];
      let query = supabaseAdmin
        .from("daily_signals")
        .select("*")
        .eq("signal_date", today)
        .order("confidence", { ascending: false })
        .limit(20);

      if (input.pair) query = query.eq("pair", input.pair as string);
      if (input.timeframe) query = query.eq("timeframe", input.timeframe as string);
      if (input.recommendation)
        query = query.eq("recommendation", input.recommendation as "BUY" | "SELL" | "WAIT");

      const { data: signals, error } = await query;
      if (error) return { success: false, error: error.message };

      return { success: true, data: signals ?? [] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── getAssetState ────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "getAssetState",
  description:
    "Get current price and 24h change for a trading pair. Also returns asset metadata from the Asset Registry.",
  category: "market",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    {
      name: "pair",
      type: "string",
      description: "Trading pair (e.g., BTC/USDT, XAU/USD)",
      required: true,
    },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { fetchPrice } = await import("@/domains/market/server/price-fetcher");
      const { AssetRegistry } = await import("@/shared/asset-registry");

      const pair = input.pair as string;
      const asset = AssetRegistry.find(pair);

      const priceResult = await fetchPrice(pair);

      return {
        success: true,
        data: {
          pair,
          name: asset?.name || pair,
          category: asset?.category || "unknown",
          price: priceResult?.price ?? null,
          change24h: priceResult?.change24h ?? null,
          source: priceResult?.source || "unavailable",
          decimals: asset?.config.decimals ?? 2,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── listAlerts ───────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "listAlerts",
  description: "List the user's active and triggered price alerts.",
  category: "trading",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    { name: "pair", type: "string", description: "Filter by pair (optional)", required: false },
    {
      name: "status",
      type: "string",
      description: "Filter by status",
      required: false,
      enum: ["active", "triggered", "cancelled"],
    },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      let query = supabaseAdmin
        .from("price_alerts")
        .select("*")
        .eq("user_id", context.userId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (input.pair) query = query.eq("pair", input.pair as string);
      if (input.status)
        query = query.eq("status", input.status as "active" | "triggered" | "cancelled");
      else query = query.in("status", ["active", "triggered"]);

      const { data: alerts, error } = await query;
      if (error) return { success: false, error: error.message };

      return { success: true, data: alerts ?? [] };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── deleteAlert ──────────────────────────────────────────────────────────────

ToolRegistry.register({
  name: "deleteAlert",
  description: "Cancel/delete an active price alert.",
  category: "trading",
  permissions: ["authenticated"],
  mutative: true,
  parameters: [
    {
      name: "alertId",
      type: "string",
      description: "The ID of the alert to cancel",
      required: true,
    },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { supabaseAdmin } = await import("@/shared/supabase/client.server");

      const { error } = await supabaseAdmin
        .from("price_alerts")
        .update({ status: "cancelled" })
        .eq("id", input.alertId as string)
        .eq("user_id", context.userId);

      if (error) return { success: false, error: error.message };
      return { success: true, data: { ok: true } };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── scanOpportunities ─────────────────────────────────────────────────────

ToolRegistry.register({
  name: "scanOpportunities",
  description:
    "Scan the market for high-confidence trading opportunities across multiple pairs. Returns top 5 with entry/SL/TP.",
  category: "analysis",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [
    {
      name: "minConfidence",
      type: "number",
      description: "Minimum confidence score (0-100, default 65)",
      required: false,
    },
  ],
  execute: async (input, context: ToolContext): Promise<ToolResult> => {
    try {
      const { scanForOpportunities, setScanFetcher } =
        await import("@/domains/analysis/opportunity-scanner");
      const { fetchBinanceKlines, fetchTwelveDataKlines } =
        await import("@/domains/market/server/price-fetcher");
      const { AssetRegistry, POPULAR_PAIRS } = await import("@/shared/asset-registry");

      // Build a fetcher that routes to the right API per pair
      const pairs = POPULAR_PAIRS.map((p) => p.pair);
      setScanFetcher(async (pair: string, tf: string, limit: number) => {
        if (AssetRegistry.isCrypto(pair)) {
          const bars = await fetchBinanceKlines(pair, tf, limit);
          if (bars && bars.length > 20) return bars;
        }
        const tdBars = await fetchTwelveDataKlines(pair, tf, limit);
        return tdBars;
      });

      const minConf = (input.minConfidence as number) || 65;
      const result = await scanForOpportunities(pairs, {
        minConfidence: minConf,
        timeframes: ["1H", "4H"],
        maxResults: 5,
      });

      // Format for chat consumption
      const formatted = result.opportunities.map((o) => ({
        pair: o.pair,
        timeframe: o.timeframe,
        direction: o.direction,
        confidence: o.confidence,
        entry: o.entryPrice,
        stopLoss: o.stopLoss,
        takeProfits: o.takeProfits,
        riskReward: o.riskReward,
        signals: o.keySignals,
        regime: o.regime,
      }));

      // Update MOXI context cache with scan results
      try {
        const { setCachedOpportunities } = await import("@/domains/moxi/context-engine");
        setCachedOpportunities(result.opportunities);
      } catch {
        // Non-critical — cache update failure shouldn't block response
      }

      return {
        success: true,
        data: {
          opportunities: formatted,
          totalScanned: result.totalScanned,
          scanDurationMs: result.scanDurationMs,
        },
      };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});

// ── getEconomicCalendar ───────────────────────────────────────────────────

ToolRegistry.register({
  name: "getEconomicCalendar",
  description:
    "Fetches upcoming economic events filtered to high and medium impact. Returns time, currency, impact, forecast.",
  category: "market",
  permissions: ["authenticated"],
  mutative: false,
  parameters: [],
  execute: async (_input, _context: ToolContext): Promise<ToolResult> => {
    try {
      const { fetchEconomicCalendar, COUNTRY_FLAGS } =
        await import("@/domains/market/server/economic-calendar");

      const events = await fetchEconomicCalendar(7);

      // Filter to high + medium impact, format for chat
      const filtered = events
        .filter((e) => e.impact === "high" || e.impact === "medium")
        .slice(0, 15)
        .map((e) => ({
          title: e.title,
          date: e.date,
          currency: e.currency,
          impact: e.impact,
          forecast: e.forecast || null,
          previous: e.previous || null,
          country: e.country,
          flag: COUNTRY_FLAGS[e.country] || "",
        }));

      return { success: true, data: filtered };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  },
});
