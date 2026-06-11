// ============================================================================
// VIXOR Copilot Agent — Tool-Using Execution Agent
// ============================================================================
//
// This is the P1 Intelligence Layer Copilot.
// It can:
//   - Understand user intent (keyword-based, no LLM required)
//   - Execute tools via ToolRouter
//   - Store and retrieve memories
//   - Emit events
//
// The existing AI-based copilot (agent-orchestrator.ts) continues to work.
// This layer ADDS tool execution capability ON TOP of the existing system.
//
// Flow:
//   User message → Intent detection → Tool dispatch → Response
//   OR
//   User message → AI fallback (existing system) → Response
// ============================================================================

import { ToolRouter, type ToolContext } from "@/shared/tool-router";
import { MemoryStore } from "@/shared/memory";
import { VixorEvents } from "@/shared/events";

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

  // ── Alert intents ────────────────────────────────────────────────
  if (/(create|set|add|make|place).*(alert|notification|reminder)/i.test(lower) ||
      /alert.*above|alert.*below|notify.*when/i.test(lower)) {
    const pair = extractPair(lower);
    const condition = /above|over|higher/i.test(lower) ? "above"
      : /below|under|lower/i.test(lower) ? "below"
      : /cross.*up|break.*up/i.test(lower) ? "crosses_up"
      : /cross.*down|break.*down/i.test(lower) ? "crosses_down"
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
  if (/(signal|signals|recommendation|daily).*(today|signal|get|show|view)/i.test(lower) ||
      /what.*(signal|recommend|buy|sell)/i.test(lower)) {
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
  if (/(journal|note|diary|log|write|record).*(trade|entry|note|feeling|mood)/i.test(lower) ||
      /(write|add|create|log).*(note|journal|entry)/i.test(lower)) {
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
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT",
  "XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY", "GBP/JPY",
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
  if (/\bGOLD\b/i.test(text) || /\bXAU\b/i.test(text)) return "XAU/USD";
  if (/\bEURO\b/i.test(text) || /\bEUR\b/i.test(text)) return "EUR/USD";
  if (/\bPOUND\b/i.test(text) || /\bGBP\b/i.test(text)) return "GBP/USD";
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

// ── Copilot Agent Class ──────────────────────────────────────────────────────

export interface CopilotAgentResult {
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
 * Process a user message through the Copilot Agent.
 * Attempts intent detection → tool execution first.
 * Falls back to AI if no intent is detected.
 */
export async function processWithAgent(
  message: string,
  context: ToolContext,
  options?: { conversationId?: string },
): Promise<CopilotAgentResult> {
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
  const tool = ToolRouter.isValidTool(intent.toolName)
    ? ToolRegistry.get(intent.toolName)
    : null;

  if (!tool) {
    return {
      toolExecuted: false,
      response: "",
      shouldFallbackToAI: true,
    };
  }

  // Check for missing required params
  const requiredParams = tool.parameters.filter((p) => p.required);
  const missingParams = requiredParams.filter(
    (p) => intent.extractedParams[p.name] === undefined,
  );

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
  void MemoryStore.learn(context.userId, "behavior", "last_intent", intent.toolName, "copilot");
  if (intent.extractedParams.pair) {
    void MemoryStore.learn(
      context.userId,
      "preference",
      "queried_pair",
      intent.extractedParams.pair,
      "copilot",
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
      return `✅ Alert created for **${alert.pair}** ${alert.condition} $${alert.target_price} on ${alert.timeframe} timeframe. I'll notify you when the price reaches your target.`;
    }
    case "listAlerts": {
      const alerts = data as Array<Record<string, unknown>>;
      if (alerts.length === 0) return "You don't have any alerts yet. Would you like to create one?";
      const lines = alerts.slice(0, 5).map((a) =>
        `- **${a.pair}** ${a.condition} $${a.target_price} (${a.status})`
      );
      return `📋 Your alerts:\n${lines.join("\n")}${alerts.length > 5 ? `\n...and ${alerts.length - 5} more` : ""}`;
    }
    case "deleteAlert": {
      return "✅ Alert cancelled successfully.";
    }
    case "fetchSignals": {
      const signals = data as Array<Record<string, unknown>>;
      if (signals.length === 0) return "No signals available for today yet. Signals are generated daily at midnight UTC.";
      const lines = signals.slice(0, 5).map((s) =>
        `- **${s.pair}** (${s.timeframe}): ${s.recommendation} — Confidence: ${s.confidence}%, Entry: $${s.entry}`
      );
      return `📊 Today's signals:\n${lines.join("\n")}${signals.length > 5 ? `\n...and ${signals.length - 5} more` : ""}`;
    }
    case "analyzeAsset": {
      const analysis = data as Record<string, unknown>;
      return `📈 **${analysis.pair} Analysis** (${analysis.timeframe}):\n- Direction: **${analysis.trend}**\n- Recommendation: **${analysis.recommendation}** (Confidence: ${analysis.confidence}%)\n- Entry: $${analysis.entry}\n- Stop Loss: $${analysis.stop_loss}\n- Take Profit: ${JSON.stringify(analysis.take_profit)}\n- Pattern: ${analysis.pattern}`;
    }
    case "getAssetState": {
      const state = data as Record<string, unknown>;
      const change = state.change24h as number | undefined;
      const changeStr = change !== null && change !== undefined
        ? `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`
        : "N/A";
      return `💰 **${state.name}** (${state.pair}):\n- Price: $${state.price ?? "Unavailable"}\n- 24h Change: ${changeStr}\n- Category: ${state.category}`;
    }
    case "createJournalEntry": {
      return "📝 Journal entry saved! Keeping a trading diary is one of the best ways to improve your trading performance over time.";
    }
    case "fetchPortfolio": {
      const trades = data as Array<Record<string, unknown>>;
      if (trades.length === 0) return "Your trade journal is empty. Start by logging your first trade!";
      return `📊 You have ${trades.length} trade(s) in your journal. Would you like me to analyze your trading patterns?`;
    }
    default:
      return `Tool "${toolName}" executed successfully.`;
  }
}

// Need this import for the tool definition lookup
import { ToolRegistry } from "@/shared/tool-registry";
