// ============================================================================
// MOXI — Types
// ============================================================================

/** MOXI persona configuration — defines personality, expertise, and style */
export interface MoxiPersona {
  /** Display name */
  name: string;
  /** Core personality description */
  personality: string;
  /** Primary expertise areas */
  expertise: string[];
  /** Communication style (formal, casual, mixed) */
  communicationStyle: "formal" | "casual" | "mixed";
  /** Avatar variant identifier (maps to NFT traits) */
  avatarVariant: MoxiAvatarVariant;
  /** Optional NFT token ID for this user's unique MOXI */
  nftTokenId?: string;
  /** User ID this persona belongs to */
  userId?: string;
  /** Whether the user has customized their MOXI */
  isCustomized: boolean;
}

/** Avatar visual variants — each maps to a distinct 2.5D look */
export type MoxiAvatarVariant =
  "default" | "bull" | "bear" | "crystal" | "flame" | "ocean" | "phantom" | "nova";

/** MOXI's response from the server */
export interface MoxiResponse {
  response: string;
  agent: "moxi";
  toolExecuted?: boolean;
  toolName?: string;
  /** Proactive insight MOXI detected on its own */
  proactiveInsight?: MoxiProactiveInsight;
}

/** A proactive insight MOXI generates independently (not from user message) */
export interface MoxiProactiveInsight {
  type: "price_alert" | "signal_update" | "market_shift" | "risk_warning" | "opportunity";
  title: string;
  body: string;
  severity: "info" | "warning" | "critical";
  /** Related pair if applicable */
  pair?: string;
  /** ISO timestamp */
  detectedAt: string;
}

/** MOXI quick action — a preset prompt the user can tap */
export interface MoxiQuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: string;
  category: "analysis" | "signals" | "alerts" | "data";
}

/** Full MOXI context built by context-engine, formatted for the prompt */
export interface MoxiFormattedContext {
  traderProfile: string;
  activePositions: string;
  recentAnalyses: string;
  dailySignals: string;
  watchlist: string;
  livePrices: string;
  upcomingEvents: string;
  memoryContext: string;
  toolDescriptions: string;
}

/** Default MOXI persona */
export const DEFAULT_MOXI_PERSONA: MoxiPersona = {
  name: "MOXI",
  personality:
    "A sharp, proactive AI trading companion. Confident but never arrogant. Speaks directly with traders in their language — SMC, order flow, liquidity. Has a slight edge of humor. Always data-driven. Proactively spots opportunities and risks the trader might miss.",
  expertise: [
    "SMC/ICT Technical Analysis",
    "Multi-timeframe market structure",
    "Signal tracking & monitoring",
    "Risk awareness & position management",
    "Economic event timing",
    "Portfolio overview & performance",
  ],
  communicationStyle: "mixed",
  avatarVariant: "default",
  isCustomized: false,
};

// ═══════════════════════════════════════════════════════════════════════════════
// VIXOR AI Agent Types (Coach, Analyst, Governor, Hunter)
// ═══════════════════════════════════════════════════════════════════════════════

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

/** MOXI quick actions shown in the chat welcome screen */
export const MOXI_QUICK_ACTIONS: MoxiQuickAction[] = [
  {
    id: "moxi-market",
    label: "What's the market doing?",
    prompt:
      "Give me a quick market summary — what's moving, what's quiet, any events I should know about?",
    icon: "Activity",
    category: "data",
  },
  {
    id: "moxi-signals",
    label: "Check my signals",
    prompt: "What's the status of my active signals? Any close to TP or SL?",
    icon: "Radio",
    category: "signals",
  },
  {
    id: "moxi-analyze",
    label: "Analyze a pair",
    prompt: "Run a full SMC analysis on XAU/USD on the 1H timeframe",
    icon: "Target",
    category: "analysis",
  },
  {
    id: "moxi-alert",
    label: "Set a price alert",
    prompt: "I want to set an alert for BTC/USDT when it crosses above $110,000",
    icon: "Bell",
    category: "alerts",
  },
  {
    id: "moxi-portfolio",
    label: "How's my portfolio?",
    prompt:
      "Give me an overview of my portfolio — win rate, recent performance, anything I should adjust?",
    icon: "PieChart",
    category: "data",
  },
  {
    id: "moxi-opportunities",
    label: "Find opportunities",
    prompt:
      "Based on my watchlist and the current market, are there any setups I should be looking at right now?",
    icon: "Sparkles",
    category: "analysis",
  },
];
