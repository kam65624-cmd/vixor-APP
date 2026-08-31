// ============================================================================
// Daily Loop Domain — Types
// ============================================================================

export type MarketBias = "bullish" | "bearish" | "neutral";
export type EmotionalState = "disciplined" | "anxious" | "fomo" | "revenge" | "calm" | "tired";
export type TradingSession = "london" | "ny" | "asian";

export interface DailyLoop {
  id: string;
  user_id: string;
  date: string;
  morning_prep_completed: boolean;
  morning_prep_at: string | null;
  market_bias: MarketBias | null;
  key_levels: string | null;
  watchlist_reviewed: boolean;
  london_session_traded: boolean;
  london_session_notes: string | null;
  ny_session_traded: boolean;
  ny_session_notes: string | null;
  asian_session_traded: boolean;
  asian_session_notes: string | null;
  eod_review_completed: boolean;
  eod_review_at: string | null;
  daily_pnl: number | null;
  trades_taken: number;
  rules_followed: number;
  rules_broken: number;
  emotional_state: EmotionalState;
  lessons_learned: string | null;
  tomorrow_plan: string | null;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_completed_date: string | null;
  updated_at: string;
}

export interface MorningPrepInput {
  market_bias: MarketBias;
  key_levels: string;
  watchlist_reviewed: boolean;
}

export interface SessionTrackingInput {
  session: TradingSession;
  traded: boolean;
  notes: string;
}

export interface EodReviewInput {
  daily_pnl?: number | null;
  trades_taken?: number;
  rules_followed?: number;
  rules_broken?: number;
  emotional_state: EmotionalState;
  lessons_learned: string;
  tomorrow_plan: string;
}
