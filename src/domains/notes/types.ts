// ============================================================================
// Notes Domain — Types
// ============================================================================

export type Mood = "confident" | "cautious" | "anxious" | "neutral";

export interface TradingNote {
  id: string;
  user_id: string;
  pair: string | null;
  analysis_id: string | null;
  title: string;
  content: string;
  tags: string[];
  mood: Mood;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteInput {
  pair?: string | null;
  analysis_id?: string | null;
  title: string;
  content: string;
  tags?: string[];
  mood?: Mood;
  is_pinned?: boolean;
}

export interface UpdateNoteInput {
  noteId: string;
  title?: string;
  content?: string;
  tags?: string[];
  mood?: Mood;
  is_pinned?: boolean;
  pair?: string | null;
  analysis_id?: string | null;
}

export interface ListNotesFilters {
  pair?: string;
  analysis_id?: string;
  tags?: string[];
  pinnedOnly?: boolean;
  mood?: Mood;
}
