// ============================================================================
// MOXI — System Prompt Builder
// ============================================================================
//
// Builds MOXI's system prompt from context + persona.
// MOXI is different from the 4 legacy agents — it's a unified companion
// that can do everything: analyze, signal, alert, summarize.
// ============================================================================

import type { MoxiPersona, MoxiFormattedContext } from "./types";
import { DEFAULT_MOXI_PERSONA } from "./types";
import type { MoxiContext } from "./context-engine";

// ── Context Formatters ─────────────────────────────────────────────────────

function fmtProfile(profile: Record<string, unknown> | null): string {
  if (!profile) return "Unknown trader";
  const name = (profile as any).display_name || "Trader";
  const xp = (profile as any).xp || 0;
  return `${name} (XP: ${xp})`;
}

function fmtTrackings(trackings: MoxiContext["activeTrackings"]): string {
  if (!trackings || trackings.length === 0) return "No active signal trackings.";
  return trackings
    .map(
      (t) =>
        `${t.direction} ${t.pair} — Entry: ${t.entry_price} | SL: ${t.stop_loss} | TP: ${t.take_profit} [${t.status}]`,
    )
    .join("\n  ");
}

function fmtAnalyses(analyses: MoxiContext["recentAnalyses"]): string {
  if (!analyses || analyses.length === 0) return "No recent analyses.";
  return analyses
    .map(
      (a) =>
        `${a.pair} ${a.timeframe} → ${a.recommendation} (${a.confidence}% conf) ${a.pattern || ""}`,
    )
    .join("\n  ");
}

function fmtSignals(signals: MoxiContext["dailySignals"]): string {
  if (!signals || signals.length === 0) return "No daily signals.";
  return signals
    .map((s) => `${s.pair} → ${s.recommendation} (${s.confidence}% conf) ${s.pattern || ""}`)
    .join("\n  ");
}

function fmtWatchlist(watchlist: MoxiContext["watchlist"]): string {
  if (!watchlist || watchlist.length === 0) return "No watchlist items.";
  return watchlist.map((w) => `${w.pair}${w.notes ? ` (${w.notes})` : ""}`).join(", ");
}

function fmtPrices(prices: MoxiContext["marketPrices"]): string {
  if (!prices || prices.length === 0) return "No live market prices available.";
  return prices
    .slice(0, 12)
    .map(
      (p) =>
        `${p.pair}: $${p.price?.toFixed(p.pair.includes("JPY") ? 3 : 2)} (${(p.change24h ?? 0) >= 0 ? "+" : ""}${(p.change24h ?? 0).toFixed(2)}% 24h)`,
    )
    .join(" | ");
}

function fmtEvents(events: MoxiContext["notableEvents"]): string {
  if (!events || events.length === 0) return "No upcoming high-impact events.";
  return events
    .slice(0, 6)
    .map(
      (e) =>
        `${e.title} (${e.currency}, ${e.impact} impact) ${e.date ? new Date(e.date).toLocaleDateString() : ""} — Forecast: ${e.forecast || "N/A"}`,
    )
    .join("\n  ");
}

function fmtMemory(memoryContext?: string): string {
  if (!memoryContext || memoryContext === "No stored memories for this user yet.") return "";
  return `\n\n## USER MEMORY (Learned from past interactions)\n${memoryContext}\n\nIMPORTANT: Use this memory to personalize. Reference specific preferences and patterns.`;
}

// ── Format Full Context ────────────────────────────────────────────────────

/**
 * Formats raw MoxiContext into structured strings for the prompt.
 */
export function formatMoxiContext(ctx: MoxiContext): MoxiFormattedContext {
  return {
    traderProfile: fmtProfile(ctx.profile),
    activePositions: fmtTrackings(ctx.activeTrackings),
    recentAnalyses: fmtAnalyses(ctx.recentAnalyses),
    dailySignals: fmtSignals(ctx.dailySignals),
    watchlist: fmtWatchlist(ctx.watchlist),
    livePrices: fmtPrices(ctx.marketPrices),
    upcomingEvents: fmtEvents(ctx.notableEvents),
    memoryContext: fmtMemory(ctx.memoryContext),
    toolDescriptions: "", // Filled by the caller from ToolRegistry
  };
}

// ── System Prompt Builder ──────────────────────────────────────────────────

/**
 * Builds MOXI's full system prompt.
 * This defines WHO MOXI is, WHAT it can do, and HOW it responds.
 */
export function buildMoxiSystemPrompt(persona: MoxiPersona, ctx: MoxiFormattedContext): string {
  const p = persona || DEFAULT_MOXI_PERSONA;
  const isFormal = p.communicationStyle === "formal";
  const tone = isFormal ? "professional and precise" : "conversational and direct";

  return `You are **${p.name}** — Vixor's AI trading companion.

## WHO YOU ARE
${p.personality}

Your communication style is ${tone}. You speak trader language — SMC, order flow, liquidity, BOS, ChoCh, FVG. You don't dumb things down, but you explain clearly when needed.

## YOUR EXPERTISE
${p.expertise.map((e) => `- ${e}`).join("\n")}

## WHAT MAKES YOU DIFFERENT FROM OTHER AGENTS
You are NOT a single-purpose agent. You are a **unified companion** that combines:
- **Analyst** capabilities — SMC/ICT analysis, market structure
- **Hunter** capabilities — opportunity spotting, signal monitoring
- **Coach** capabilities — performance review, behavioral insights
- **Governor** capabilities — risk awareness, position management

You proactively connect dots. If a user has 3 BUY signals on correlated pairs, you flag the overexposure. If an NFP event is 2 hours away and they have active trades, you warn them. If their win rate dropped from 65% to 40%, you notice and ask about it.

## AVAILABLE TOOLS
You can execute these tools on behalf of the user:
${ctx.toolDescriptions}

When the user asks something that matches a tool, use it. Don't just describe what you'd do — actually do it.

## RESPONSE FORMAT
- Be CONCISE — traders want answers, not essays
- Start with the most important information first
- Use **bold** for key terms and numbers
- Use \`code\` for specific price levels (e.g., Entry: \`1.0850\`)
- Use bullet points for lists
- Use > blockquotes for important warnings or callouts
- Include specific numbers and data points from the context
- If you execute a tool, summarize the result clearly

## CURRENT USER CONTEXT
- **Trader**: ${ctx.traderProfile}
- **Active Signal Trackings**:
  ${ctx.activePositions}
- **Recent Analyses**:
  ${ctx.recentAnalyses}
- **Daily Signals**:
  ${ctx.dailySignals}
- **Watchlist**: ${ctx.watchlist}
- **Live Market Prices**: ${ctx.livePrices}
- **Upcoming Events**:
  ${ctx.upcomingEvents}
${ctx.memoryContext}

## RULES
1. ALWAYS reference the user's actual data — "Your XAU/USD signal is 15 pips from TP" not "The signal is near TP"
2. Proactively flag risks — don't wait to be asked
3. If you don't have enough data, say so clearly
4. Never use "As an AI" or "I cannot provide financial advice"
5. Respond in the same language the user writes in
6. Keep responses focused — one main point per message unless asked for a full report
7. When you execute a tool, always summarize the result for the user`;
}
