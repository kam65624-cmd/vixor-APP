// ============================================================================
// MOXI — Tool Definitions
// ============================================================================
//
// A registry of actions MOXI can perform. These define the schema for
// tools that MOXI can invoke during conversation. The actual execution
// happens in functions.ts (moxiQuickAction) which maps these tool names
// to existing app logic.
//
// These definitions are used for:
// 1. MOXI's system prompt awareness of its capabilities
// 2. The UI layer to show available quick actions
// 3. Future tool-calling integration with LLM function calling
// ============================================================================

export interface MoxiToolParam {
  name: string;
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  enum?: string[];
}

export interface MoxiToolDefinition {
  /** Unique tool identifier */
  name: string;
  /** Human-readable description for the LLM */
  description: string;
  /** Parameter schema */
  params: MoxiToolParam[];
  /** The action category for UI grouping */
  category: "analysis" | "signals" | "alerts" | "data";
}

// ─── Tool Registry ──────────────────────────────────────────────────────────

export const MOXI_TOOLS: MoxiToolDefinition[] = [
  {
    name: "analyzePair",
    description:
      "Run an SMC/ICT technical analysis on a given pair and timeframe. Returns market structure, order blocks, FVGs, and entry/SL/TP levels.",
    category: "analysis",
    params: [
      {
        name: "pair",
        type: "string",
        description: "Trading pair, e.g. 'EUR/USD', 'BTC/USDT', 'XAU/USD'",
        required: true,
      },
      {
        name: "timeframe",
        type: "string",
        description: "Chart timeframe",
        required: false,
        enum: ["1m", "5m", "15m", "30m", "1H", "4H", "1D", "1W"],
      },
    ],
  },
  {
    name: "trackSignal",
    description:
      "Convert an analysis into a signal tracking with entry, SL, and TP levels. MOXI will monitor the price and notify when levels are hit.",
    category: "signals",
    params: [
      {
        name: "analysisId",
        type: "string",
        description: "The ID of the analysis to convert into a tracked signal",
        required: true,
      },
    ],
  },
  {
    name: "createPriceAlert",
    description:
      "Create a price alert that fires when a pair reaches a target price. Conditions: above, below, crosses_up, crosses_down.",
    category: "alerts",
    params: [
      {
        name: "pair",
        type: "string",
        description: "Trading pair, e.g. 'EUR/USD'",
        required: true,
      },
      {
        name: "condition",
        type: "string",
        description: "Alert trigger condition",
        required: true,
        enum: ["above", "below", "crosses_up", "crosses_down"],
      },
      {
        name: "price",
        type: "number",
        description: "Target price for the alert",
        required: true,
      },
      {
        name: "note",
        type: "string",
        description: "Optional note about why this alert was set",
        required: false,
      },
    ],
  },
  {
    name: "getMarketSummary",
    description:
      "Returns the current market state — major pair prices, 24h changes, and any notable events or economic catalysts on the horizon.",
    category: "data",
    params: [],
  },
  {
    name: "getPortfolio",
    description:
      "Returns the user's current portfolio — holdings, total PnL, trade count, and performance breakdown.",
    category: "data",
    params: [],
  },
  {
    name: "getWatchlist",
    description: "Returns the user's watchlist with current prices and any notes they've added.",
    category: "data",
    params: [],
  },
  {
    name: "getSignalStatus",
    description:
      "Returns all active signal trackings with their current status, price distance to entry/SL/TP, and MFE/MAE stats.",
    category: "signals",
    params: [],
  },
];

// ─── Lookup Helpers ─────────────────────────────────────────────────────────

/** Get a tool definition by name */
export function getMoxiTool(name: string): MoxiToolDefinition | undefined {
  return MOXI_TOOLS.find((t) => t.name === name);
}

/** Get all tools in a given category */
export function getMoxiToolsByCategory(
  category: MoxiToolDefinition["category"],
): MoxiToolDefinition[] {
  return MOXI_TOOLS.filter((t) => t.category === category);
}

/** Get tool names as a comma-separated string (for prompt injection) */
export function getMoxiToolNames(): string {
  return MOXI_TOOLS.map((t) => t.name).join(", ");
}
