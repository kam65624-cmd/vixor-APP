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

// ═══════════════════════════════════════════════════════════════════════════════
// Phase C.1 — VIXOR AI 4 Agents Types
// ═══════════════════════════════════════════════════════════════════════════════

/** Agent IDs for the 4 new VIXOR AI agents. */
export type VixorAgentId = "coach" | "analyst" | "governor" | "hunter";

/** Decision types stored in vixor_decisions table. */
export type DecisionType = "suggestion" | "warning" | "block" | "alert" | "report";

/** Feedback states for decisions. */
export type DecisionFeedback = "accepted" | "rejected" | "dismissed" | "expired";

/** Severity levels for decisions. */
export type DecisionSeverity = "low" | "medium" | "high" | "critical";

/** Sentiment for Coach responses. */
export type CoachSentiment = "bullish" | "bearish" | "neutral";

/** Risk levels for Coach and Governor. */
export type RiskLevel = "low" | "medium" | "high";

/** Trade actions. */
export type TradeAction = "buy" | "sell";

/** Signal types for Hunter agent. */
export type HunterSignal = "strong_buy" | "buy" | "hold" | "sell";

// ── Coach Agent ─────────────────────────────────────────────────────────────

/** Input parameters for the Coach agent. */
export interface CoachInput {
  userId: string;
  token: string;
  action: TradeAction;
  amount: number;
  chain: string;
  currentPrice: number;
}

/** Output from the Coach agent. */
export interface CoachResponse {
  decisionId: string;
  comment: string;
  sentiment: CoachSentiment;
  riskLevel: RiskLevel;
  suggestion: string;
  confidence: number;
}

// ── Analyst Agent ───────────────────────────────────────────────────────────

/** Input parameters for the Behavioral Analyst agent. */
export interface AnalystInput {
  userId: string;
  memories: string;
  analyses: number;
  trades: number;
  portfolio: number;
}

/** Output from the Behavioral Analyst agent. */
export interface AnalystReport {
  decisionId: string;
  statsSummary: string;
  behavioralPatterns: string;
  recommendations: string;
  learningResources: string;
  confidence: number;
}

// ── Governor Agent ──────────────────────────────────────────────────────────

/** Input parameters for the Risk Governor agent. */
export interface GovernorInput {
  userId: string;
  action: TradeAction;
  token: string;
  amount: number;
  currentPrice: number;
  portfolioValue: number;
}

/** User risk profile built by the Governor from memory. */
export interface RiskProfile {
  style: string;
  tolerance: string;
  weakness: string;
  strength: string;
  preferredChains: string[];
  preferredTokens: string[];
  activeHours: string;
  avgSession: string;
}

/** Decision from the Risk Governor agent. */
export type RiskDecisionType = "allow" | "warn" | "block";

/** Output from the Risk Governor agent. */
export interface RiskDecision {
  decisionId: string;
  decision: RiskDecisionType;
  riskScore: number;
  reason: string;
  suggestion: string;
  riskProfile: RiskProfile;
  severity: DecisionSeverity;
  confidence: number;
}

// ── Hunter Agent ────────────────────────────────────────────────────────────

/** Input parameters for the Smart Money Hunter agent. */
export interface HunterInput {
  token: string;
  chain: string;
  smartMoneyActivity: string;
  priceData: string;
  volumeData: string;
}

/** Output from the Smart Money Hunter agent. */
export interface HunterScore {
  decisionId: string;
  score: number;
  signal: HunterSignal;
  reasoning: string;
  wallets: string[];
  confidence: number;
}
