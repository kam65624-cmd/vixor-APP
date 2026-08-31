// ============================================================================
// MOXI — Notification Hub
// ============================================================================
//
// Proactive notifications that MOXI generates independently.
// Unlike the current notification system (user-triggered), MOXI watches
// the user's data and surfaces insights they might miss.
//
// Integration points:
// - Called by cron jobs (alert-checker, signal-monitor)
// - Called by askMoxi when it detects something notable
// - Can be polled by the frontend for a "MOXI insights" feed
// ============================================================================

import type { MoxiProactiveInsight } from "./types";

/** Severity priority for sorting */
const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  warning: 1,
  info: 2,
};

// ── Insight Generators ────────────────────────────────────────────────────

/**
 * Check if the user has correlated/overexposed positions.
 * E.g., 3 BUY signals on EUR/USD, GBP/USD, AUD/USD = long USD overexposure.
 */
export function detectOverexposure(
  trackings: Array<{
    pair: string;
    direction: string;
    status?: string;
  }>,
): MoxiProactiveInsight | null {
  if (!trackings || trackings.length < 2) return null;

  const directions = trackings.filter(
    (t) => t.status === "active" || t.status === "pending" || !t.status,
  );
  if (directions.length < 2) return null;

  const buys = directions.filter((t) => t.direction === "BUY");
  const sells = directions.filter((t) => t.direction === "SELL");

  // Extract base/quote currencies
  const longCurrencies = new Set<string>();
  const shortCurrencies = new Set<string>();

  for (const t of buys) {
    const parts = t.pair.split("/");
    if (parts.length === 2) {
      longCurrencies.add(parts[0]);
      shortCurrencies.add(parts[1]);
    }
  }

  // Check if 2+ buys share the same base currency
  for (const curr of longCurrencies) {
    const sameBase = buys.filter((t) => t.pair.startsWith(curr + "/"));
    if (sameBase.length >= 2) {
      const pairs = sameBase.map((t) => t.pair).join(", ");
      return {
        type: "risk_warning",
        title: `Overexposed to ${curr}`,
        body: `You have ${sameBase.length} active BUY signals on ${curr} pairs (${pairs}). Consider the correlation risk — if ${curr} weakens, all positions lose simultaneously.`,
        severity: "warning",
        pair: sameBase[0].pair,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  // Same for sells
  for (const curr of shortCurrencies) {
    const sameQuote = sells.filter((t) => t.pair.endsWith("/" + curr));
    if (sameQuote.length >= 2) {
      const pairs = sameQuote.map((t) => t.pair).join(", ");
      return {
        type: "risk_warning",
        title: `Heavy ${curr} short exposure`,
        body: `${sameQuote.length} active SELL signals involve selling ${curr} (${pairs}). Correlated risk — if ${curr} strengthens, all positions lose.`,
        severity: "warning",
        pair: sameQuote[0].pair,
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

/**
 * Check if any tracked signal is close to TP or SL.
 */
export function detectSignalProximity(
  trackings: Array<{
    pair: string;
    direction: string;
    entry_price: number | null;
    stop_loss: number | null;
    take_profit: string | number | null;
    status: string;
  }>,
  currentPrices: Array<{ pair: string; price: number }>,
): MoxiProactiveInsight[] {
  if (!trackings || !currentPrices) return [];

  const insights: MoxiProactiveInsight[] = [];
  const priceMap = new Map(currentPrices.map((p) => [p.pair, p.price]));

  for (const t of trackings) {
    if (t.status !== "active" && t.status !== "pending") continue;

    const current = priceMap.get(t.pair);
    if (!current) continue;

    const tp =
      t.take_profit != null
        ? typeof t.take_profit === "string"
          ? parseFloat(t.take_profit)
          : t.take_profit
        : null;
    const sl = t.stop_loss;
    const entry = t.entry_price;

    if (!tp || !sl || !entry) continue;

    const entryToSl = Math.abs(entry - (sl ?? 0));
    const entryToTp = Math.abs((tp as number) - entry);
    const totalRange = entryToSl + entryToTp;

    if (totalRange === 0) continue;

    // Distance from current to TP/SL as percentage of total range
    const distToTp = Math.abs(current - tp) / totalRange;
    const distToSl = Math.abs(current - (t.stop_loss ?? 0)) / totalRange;

    if (distToTp < 0.1) {
      insights.push({
        type: "signal_update",
        title: `${t.pair} near Take Profit`,
        body: `Your ${t.direction} ${t.pair} is within 10% of TP (\`${tp}\`). Current: \`${current.toFixed(t.pair.includes("JPY") ? 3 : 2)}\`. Consider taking partial profits.`,
        severity: "info",
        pair: t.pair,
        detectedAt: new Date().toISOString(),
      });
    }

    if (distToSl < 0.15) {
      insights.push({
        type: "risk_warning",
        title: `${t.pair} approaching Stop Loss`,
        body: `Your ${t.direction} ${t.pair} is within 15% of SL (\`${t.stop_loss}\`). Current: \`${current.toFixed(t.pair.includes("JPY") ? 3 : 2)}\`. Be ready.`,
        severity: "critical",
        pair: t.pair,
        detectedAt: new Date().toISOString(),
      });
    }
  }

  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

/**
 * Check for upcoming high-impact economic events that could affect
 * the user's active positions.
 */
export function detectEventRisk(
  trackings: Array<{ pair: string }>,
  events: Array<{ title: string; currency?: string; impact?: string; date?: string }>,
): MoxiProactiveInsight | null {
  if (!trackings?.length || !events?.length) return null;

  // Get currencies from user's active positions
  const userCurrencies = new Set<string>();
  for (const t of trackings) {
    const parts = t.pair.split("/");
    if (parts.length === 2) {
      userCurrencies.add(parts[0]);
      userCurrencies.add(parts[1]);
    }
  }

  // Find high-impact events within 4 hours affecting user's currencies
  const now = Date.now();
  const fourHours = 4 * 60 * 60 * 1000;

  for (const event of events) {
    if (event.impact !== "HIGH" && event.impact !== "high") continue;
    if (!event.currency || !userCurrencies.has(event.currency)) continue;
    if (!event.date) continue;

    const eventTime = new Date(event.date).getTime();
    const timeUntil = eventTime - now;

    if (timeUntil > 0 && timeUntil < fourHours) {
      const hours = Math.floor(timeUntil / (1000 * 60 * 60));
      const mins = Math.floor((timeUntil % (1000 * 60 * 60)) / (1000 * 60));

      return {
        type: "market_shift",
        title: `High-impact event in ${hours}h ${mins}m`,
        body: `**${event.title}** (${event.currency}) in ${hours}h ${mins}m. You have active positions involving ${event.currency}. Consider tightening stops or reducing exposure before the event.`,
        severity: "warning",
        detectedAt: new Date().toISOString(),
      };
    }
  }

  return null;
}

// ── Generate All Insights ─────────────────────────────────────────────────

/**
 * Run all MOXI insight generators and return sorted results.
 * This is what the frontend calls to show MOXI's proactive feed.
 */
export async function generateMoxiInsights(
  userId: string,
  supabase: any,
): Promise<MoxiProactiveInsight[]> {
  const ctx = await import("./context-engine").then((m) => m.buildMoxiContext(userId, supabase));

  const insights: MoxiProactiveInsight[] = [];

  // Overexposure check
  const overexposure = detectOverexposure(ctx.activeTrackings);
  if (overexposure) insights.push(overexposure);

  // Signal proximity check
  const proximityInsights = detectSignalProximity(
    ctx.activeTrackings.map((t) => ({
      ...t,
      take_profit: Array.isArray(t.take_profit) ? t.take_profit[0] : t.take_profit,
    })),
    ctx.marketPrices,
  );
  insights.push(...proximityInsights);

  // Event risk check
  const eventRisk = detectEventRisk(ctx.activeTrackings, ctx.notableEvents);
  if (eventRisk) insights.push(eventRisk);

  // Sort by severity
  return insights.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}
