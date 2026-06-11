// ============================================================================
// Vixor Chart Intelligence — Chart Session Context
// ============================================================================
//
// Manages the chart context when a user is viewing a TradingView chart
// inside Vixor. This is the HIGHEST accuracy path — no screenshot needed.
//
// When the user is on the charts page and asks the copilot a question,
// the system automatically knows:
//   - Which symbol they're viewing
//   - What timeframe they're on
//   - The current price (from live data)
//
// This eliminates the need for screenshots for in-app chart questions.
// ============================================================================

import {
  type ChartContext,
  createSessionContext,
} from "./chart-context";

// ── Chart Session Store ──
// In a server-rendered app, we can't persist this across requests on the server.
// Instead, the client sends the chart context with each request.
// This module provides the TYPES and HELPERS for that flow.

export interface ChartSession {
  /** Trading pair (e.g., "XAU/USD") */
  pair: string;

  /** Timeframe (e.g., "1H", "4H") */
  timeframe: string;

  /** Current price from live market data */
  currentPrice: number;

  /** TradingView symbol format (e.g., "BINANCE:BTCUSDT") */
  tradingViewSymbol: string;

  /** When this session was last updated */
  updatedAt: number;
}

// ── Convert a ChartSession to a ChartContext ──
export function sessionToContext(session: ChartSession): ChartContext {
  return createSessionContext({
    symbol: session.pair,
    timeframe: session.timeframe,
    currentPrice: session.currentPrice,
  });
}

// ── Build a context string for AI prompts ──
export function buildChartSessionPrompt(context: ChartContext): string {
  if (!context.symbol) return "";

  const parts: string[] = [
    `## Current Chart Context`,
    `- Asset: ${context.symbol}`,
  ];

  if (context.timeframe) {
    parts.push(`- Timeframe: ${context.timeframe}`);
  }

  if (context.currentPrice) {
    parts.push(`- Current Price: ${context.currentPrice}`);
  }

  parts.push(`- Source: Live TradingView widget (highest accuracy)`);

  if (context.visibleIndicators.length > 0) {
    parts.push(`- Visible Indicators: ${context.visibleIndicators.join(", ")}`);
  }

  parts.push("");
  parts.push("The user is currently viewing this chart. Any questions they ask are likely about THIS asset and THIS timeframe. Use this context to provide relevant analysis.");

  return parts.join("\n");
}
