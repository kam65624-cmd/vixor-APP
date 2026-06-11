// ============================================================================
// Copilot Domain — Types
// ============================================================================

export type AgentId = "market_analyst" | "risk_manager" | "news_analyst" | "strategy_builder";

export interface AgentDefinition {
  id: AgentId;
  name: string;
  nameAr: string;
  description: string;
  systemPrompt: (context: UserContext) => string;
  capabilities: string[];
  icon: string;
  color: string;
}

export interface UserContext {
  profile: any;
  recentAnalyses: any[];
  signals: any[];
  alerts: any[];
  strategy: any;
  watchlist: any[];
  marketPrices: any[];
  economicEvents: any[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

// ── Chart Session Context (from TradingView widget) ──
export interface ChartSessionContext {
  /** Trading pair the user is currently viewing */
  pair: string;
  /** Timeframe on the chart */
  timeframe: string;
  /** Current price from live data */
  currentPrice: number;
  /** TradingView symbol format */
  tradingViewSymbol: string;
}

export interface AgentResponse {
  response: string;
  agent: AgentId;
}

export interface ConsensusResponse {
  responses: { agent: AgentId; response: string }[];
  synthesis: string;
}

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}
