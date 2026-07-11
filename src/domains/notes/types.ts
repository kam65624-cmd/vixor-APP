export interface TradingNote {
  id: string;
  analysis_id: string;
  user_id: string;
  title: string;
  content: string;
  mood: Mood;
  pair: string;
  tags: string[];
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type Mood = "bullish" | "bearish" | "neutral" | "confident" | "cautious" | "anxious";