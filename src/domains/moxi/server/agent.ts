// ============================================================================
// MOXI — Intent Detection & Tool Execution Agent
// ============================================================================
//
// P1 Intelligence Layer.
// It can:
//   - Understand user intent (keyword-based, no LLM required)
//   - Execute tools via ToolRouter
//   - Store and retrieve memories
//   - Emit events
//
// Flow:
//   User message → Intent detection → Tool dispatch → Response
//   OR
//   User message → AI fallback (existing system) → Response
// ============================================================================

import { ToolRouter } from "@/shared/tool-router";
import { type ToolContext, ToolRegistry } from "@/shared/tool-registry";
import { MemoryStore } from "@/shared/memory";
import { VixorEvents } from "@/shared/events";

// Ensure tools are registered when agent is used.
// This is critical for Vercel serverless where API handlers
// run in separate contexts from the SSR handler.
import "@/shared/tool-registry/bootstrap";

// ── Intent Detection ─────────────────────────────────────────────────────────

interface IntentMatch {
  toolName: string;
  confidence: number;
  extractedParams: Record<string, unknown>;
}

/**
 * Detect user intent from a natural language message.
 * Uses keyword matching — NO LLM required.
 * Returns the best matching tool and extracted parameters.
 */
function detectIntent(message: string): IntentMatch | null {
  const lower = message.toLowerCase();

  // ── Scan opportunities intent ─────────────────────────────────
  if (
    /(scan|find|search|look.*for|what.*setup|any.*opportunit)/i.test(lower) &&
    /(opportunit|setup|trade|signal|buy|sell|entry)/i.test(lower)
  ) {
    const minConfidence = extractMinConfidence(lower);
    return {
      toolName: "scanOpportunities",
      confidence: 0.85,
      extractedParams: {
        ...(minConfidence != null ? { minConfidence } : {}),
      },
    };
  }

  // ── Economic calendar intent ───────────────────────────────────
  if (
    /(calendar|event|news|economic|schedule|nfp|cpi|fomc|employment|gdp)/i.test(lower) &&
    /(upcoming|this.*week|next|what.*event|when|schedule|calendar)/i.test(lower)
  ) {
    return {
      toolName: "getEconomicCalendar",
      confidence: 0.85,
      extractedParams: {},
    };
  }

  // ── Alert intents ────────────────────────────────────────────────
  if (
    /(create|set|add|make|place).*(alert|notification|reminder)/i.test(lower) ||
    /alert.*above|alert.*below|notify.*when/i.test(lower)
  ) {
    const pair = extractPair(lower);
    const condition = /above|over|higher/i.test(lower)
      ? "above"
      : /below|under|lower/i.test(lower)
        ? "below"
        : /cross.*up|break.*up/i.test(lower)
          ? "crosses_up"
          : /cross.*down|break.*down/i.test(lower)
            ? "crosses_down"
            : "above";
    const price = extractPrice(lower);

    return {
      toolName: "createAlert",
      confidence: 0.85,
      extractedParams: {
        ...(pair ? { pair } : {}),
        condition,
        ...(price ? { targetPrice: price } : {}),
      },
    };
  }

  // ── List alerts ─────────────────────────────────────────────────
  if (/(list|show|view|check|my).*(alert|alerts|notification)/i.test(lower)) {
    const pair = extractPair(lower);
    return {
      toolName: "listAlerts",
      confidence: 0.9,
      extractedParams: {
        ...(pair ? { pair } : {}),
      },
    };
  }

  // ── Delete alert ────────────────────────────────────────────────
  if (/(delete|cancel|remove|clear).*(alert|notification)/i.test(lower)) {
    return {
      toolName: "deleteAlert",
      confidence: 0.8,
      extractedParams: {},
    };
  }

  // ── Signal intents ──────────────────────────────────────────────
  if (
    /(signal|signals|recommendation|daily).*(today|signal|get|show|view)/i.test(lower) ||
    /what.*(signal|recommend|buy|sell)/i.test(lower)
  ) {
    const pair = extractPair(lower);
    return {
      toolName: "fetchSignals",
      confidence: 0.85,
      extractedParams: {
        ...(pair ? { pair } : {}),
      },
    };
  }

  // ── Analysis intents ───────────────────────────────────────────
  if (/(analyze|analysis|chart|technical|smc|ict|structure)/i.test(lower)) {
    const pair = extractPair(lower);
    const timeframe = extractTimeframe(lower);
    return {
      toolName: "analyzeAsset",
      confidence: 0.8,
      extractedParams: {
        ...(pair ? { pair } : {}),
        ...(timeframe ? { timeframe } : {}),
      },
    };
  }

  // ── Price / asset state intents ────────────────────────────────
  if (/(price|current|latest|quote|how much|what.*(price|rate))/i.test(lower)) {
    const pair = extractPair(lower);
    if (pair) {
      return {
        toolName: "getAssetState",
        confidence: 0.85,
        extractedParams: { pair },
      };
    }
  }

  // ── Journal intents ────────────────────────────────────────────
  if (
    /(journal|note|diary|log|write|record).*(trade|entry|note|feeling|mood)/i.test(lower) ||
    /(write|add|create|log).*(note|journal|entry)/i.test(lower)
  ) {
    return {
      toolName: "createJournalEntry",
      confidence: 0.8,
      extractedParams: {
        content: message,
      },
    };
  }

  // ── Portfolio intents ──────────────────────────────────────────
  if (/(portfolio|trade.*history|pnl|profit|loss|equity|my.*trade)/i.test(lower)) {
    return {
      toolName: "fetchPortfolio",
      confidence: 0.8,
      extractedParams: {},
    };
  }

  return null;
}

// ── Parameter Extraction Helpers ──────────────────────────────────────────────

const COMMON_PAIRS = [
  "BTC/USDT",
  "ETH/USDT",
  "SOL/USDT",
  "BNB/USDT",
  "XRP/USDT",
  "ADA/USDT",
  "DOGE/USDT",
  "AVAX/USDT",
  "XAU/USD",
  "EUR/USD",
  "GBP/USD",
  "USD/JPY",
  "GBP/JPY",
];

function extractPair(text: string): string | null {
  const upper = text.toUpperCase();
  for (const pair of COMMON_PAIRS) {
    if (upper.includes(pair.replace("/", "")) || upper.includes(pair)) {
      return pair;
    }
  }
  // Try common abbreviations
  if (/\bBTC\b/i.test(text)) return "BTC/USDT";
  if (/\bETH\b/i.test(text)) return "ETH/USDT";
  if (/\bSOL\b/i.test(text)) return "SOL/USDT";
  if (/\bBNB\b/i.test(text)) return "BNB/USDT";
  if (/\bXRP\b/i.test(text)) return "XRP/USDT";
  if (/\bADA\b/i.test(text)) return "ADA/USDT";
  if (/\bDOGE\b/i.test(text)) return "DOGE/USDT";
  if (/\bAVAX\b/i.test(text)) return "AVAX/USDT";
  if (/\bGOLD\b/i.test(text) || /\bXAU\b/i.test(text)) return "XAU/USD";
  if (/\bEURO\b/i.test(text) || /\bEUR\b/i.test(text)) return "EUR/USD";
  if (/\bPOUND\b/i.test(text) || /\bGBP\b/i.test(text)) return "GBP/USD";
  if (/\bYEN\b/i.test(text) || /\bJPY\b/i.test(text)) return "USD/JPY";
  return null;
}

function extractPrice(text: string): number | null {
  // Match patterns like "$100000", "100000", "at 3300"
  const match = text.match(/\$?(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : null;
}

function extractTimeframe(text: string): string | null {
  const upper = text.toUpperCase();
  if (/\b1H\b|\b1HOUR\b|\bHOURLY\b/i.test(upper)) return "1H";
  if (/\b4H\b|\b4HOUR\b/i.test(upper)) return "4H";
  if (/\b1D\b|\bDAILY\b|\bDAY\b/i.test(upper)) return "1D";
  if (/\b15M\b|\b15MIN\b/i.test(upper)) return "15M";
  return null;
}

/**
 * Extract a minimum confidence number from text.
 * Matches patterns like "above 70", "confidence 80", "min score 65", "> 75".
 */
function extractMinConfidence(text: string): number | null {
  // "above 70", "above 70%", "> 75", ">75"
  const aboveMatch = text.match(/(?:above|over|greater than|more than|>\s*)\s*(\d+)/i);
  if (aboveMatch) {
    const val = parseInt(aboveMatch[1]!, 10);
    if (val >= 0 && val <= 100) return val;
  }
  // "confidence 80", "min confidence 65", "minimum 70"
  const confMatch = text.match(/(?:confidence|min.*score|minimum|at least)\s*(\d+)/i);
  if (confMatch) {
    const val = parseInt(confMatch[1]!, 10);
    if (val >= 0 && val <= 100) return val;
  }
  return null;
}

// ── MOXI Agent Result ──────────────────────────────────────────────────────────

export interface AgentResult {
  /** Whether a tool was executed */
  toolExecuted: boolean;
  /** Tool name that was executed */
  toolName?: string;
  /** Tool execution result */
  toolResult?: unknown;
  /** User-friendly response text */
  response: string;
  /** Whether to fall back to AI */
  shouldFallbackToAI: boolean;
}

/**
 * Process a user message through the MOXI Agent.
 * Attempts intent detection → tool execution first.
 * Falls back to AI if no intent is detected.
 */
export async function processWithAgent(
  message: string,
  context: ToolContext,
  options?: { conversationId?: string },
): Promise<AgentResult> {
  // 1. Try intent detection
  const intent = detectIntent(message);

  if (!intent) {
    // No tool intent detected — fall back to AI
    return {
      toolExecuted: false,
      response: "",
      shouldFallbackToAI: true,
    };
  }

  // 2. Check if required params are present
  const tool = ToolRouter.isValidTool(intent.toolName) ? ToolRegistry.get(intent.toolName) : null;

  if (!tool) {
    return {
      toolExecuted: false,
      response: "",
      shouldFallbackToAI: true,
    };
  }

  // Check for missing required params
  const requiredParams = tool.parameters.filter((p) => p.required);
  const missingParams = requiredParams.filter((p) => intent.extractedParams[p.name] === undefined);

  if (missingParams.length > 0) {
    // We detected intent but are missing required params
    const paramNames = missingParams.map((p) => p.description).join(", ");
    return {
      toolExecuted: false,
      response: `I'd like to help with that! I need a bit more information: ${paramNames}. Could you provide those details?`,
      shouldFallbackToAI: false,
    };
  }

  // 3. Execute tool via ToolRouter
  const result = await ToolRouter.dispatch(intent.toolName, intent.extractedParams, context, {
    conversationId: options?.conversationId,
  });

  // 4. Learn from user behavior
  void MemoryStore.learn(context.userId, "behavior", "last_intent", intent.toolName, "moxi");
  if (intent.extractedParams.pair) {
    void MemoryStore.learn(
      context.userId,
      "preference",
      "queried_pair",
      intent.extractedParams.pair,
      "moxi",
    );
  }

  // 5. Format response
  if (result.success) {
    return {
      toolExecuted: true,
      toolName: intent.toolName,
      toolResult: result.data,
      response: formatToolResponse(intent.toolName, result.data),
      shouldFallbackToAI: false,
    };
  } else {
    return {
      toolExecuted: true,
      toolName: intent.toolName,
      response: `I tried to execute ${intent.toolName} but encountered an issue: ${result.error}. Let me try a different approach.`,
      shouldFallbackToAI: true,
    };
  }
}

// ── Response Formatting ──────────────────────────────────────────────────────

function formatToolResponse(toolName: string, data: unknown): string {
  switch (toolName) {
    case "createAlert": {
      const alert = data as Record<string, unknown>;
      return `Alert created for **${alert.pair}** ${alert.condition} $${alert.target_price} on ${alert.timeframe} timeframe. I'll notify you when the price reaches your target.`;
    }
    case "listAlerts": {
      const alerts = data as Array<Record<string, unknown>>;
      if (alerts.length === 0)
        return "You don't have any alerts yet. Would you like to create one?";
      const lines = alerts
        .slice(0, 5)
        .map((a) => `- **${a.pair}** ${a.condition} $${a.target_price} (${a.status})`);
      return `Your alerts:\n${lines.join("\n")}${alerts.length > 5 ? `\n...and ${alerts.length - 5} more` : ""}`;
    }
    case "deleteAlert": {
      return "Alert cancelled successfully.";
    }
    case "fetchSignals": {
      const signals = data as Array<Record<string, unknown>>;
      if (signals.length === 0)
        return "No signals available for today yet. Signals are generated daily at midnight UTC.";
      const lines = signals
        .slice(0, 5)
        .map(
          (s) =>
            `- **${s.pair}** (${s.timeframe}): ${s.recommendation} — Confidence: ${s.confidence}%, Entry: $${s.entry}`,
        );
      return `Today's signals:\n${lines.join("\n")}${signals.length > 5 ? `\n...and ${signals.length - 5} more` : ""}`;
    }
    case "analyzeAsset": {
      const analysis = data as Record<string, unknown>;
      return `**${analysis.pair} Analysis** (${analysis.timeframe}):
- Direction: **${analysis.trend}**
- Recommendation: **${analysis.recommendation}** (Confidence: ${analysis.confidence}%)
- Entry: $${analysis.entry}
- Stop Loss: $${analysis.stop_loss}
- Take Profit: ${JSON.stringify(analysis.take_profit)}
- Pattern: ${analysis.pattern}`;
    }
    case "getAssetState": {
      const state = data as Record<string, unknown>;
      const change = state.change24h as number | undefined;
      const changeStr =
        change !== null && change !== undefined
          ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
          : "N/A";
      return `**${state.name}** (${state.pair}):
- Price: $${state.price ?? "Unavailable"}
- 24h Change: ${changeStr}
- Category: ${state.category}`;
    }
    case "createJournalEntry": {
      return "Journal entry saved! Keeping a trading diary is one of the best ways to improve your trading performance over time.";
    }
    case "fetchPortfolio": {
      const trades = data as Array<Record<string, unknown>>;
      if (trades.length === 0)
        return "Your trade journal is empty. Start by logging your first trade!";
      return `You have ${trades.length} trade(s) in your journal. Would you like me to analyze your trading patterns?`;
    }
    case "scanOpportunities": {
      const scanData = data as Record<string, unknown>;
      const opportunities = (scanData.opportunities || []) as Array<Record<string, unknown>>;
      const totalScanned = (scanData.totalScanned as number) || 0;

      if (opportunities.length === 0) {
        return `Scanned ${totalScanned} pair/timeframe combinations. No opportunities above the confidence threshold right now. The market might be in a wait-and-see mode.`;
      }

      const lines = opportunities.map(
        (o) =>
          `- **${o.pair}** (${o.timeframe}): **${o.direction}** — Confidence: ${o.confidence}% | Entry: ${o.entry} | SL: ${o.stopLoss} | TP: ${JSON.stringify(o.takeProfits)} | R:R ${o.riskReward}x | ${Array.isArray(o.signals) ? o.signals.slice(0, 2).join(", ") : ""}`,
      );

      return `**Market Scan** (scanned ${totalScanned} combinations):\n${lines.join("\n")}`;
    }
    case "getEconomicCalendar": {
      const events = data as Array<Record<string, unknown>>;
      if (events.length === 0) {
        return "No high or medium impact economic events in the next 7 days. Quiet on the macro front.";
      }

      const lines = events.map(
        (e) =>
          `- ${e.flag || ""} **${e.title}** (${e.currency}, **${e.impact}** impact) — ${new Date(e.date as string).toLocaleString()} | Forecast: ${e.forecast || "N/A"} | Previous: ${e.previous || "N/A"}`,
      );

      return `**Upcoming Economic Events** (${events.length} high/medium impact):\n${lines.join("\n")}`;
    }
    default:
      return `Tool "${toolName}" executed successfully.`;
  }
}
