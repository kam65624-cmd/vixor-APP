CREATE TABLE trading_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  pair TEXT, -- optional: link to a trading pair like "BTC/USD"
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL, -- optional: link to an analysis
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  tags TEXT[] DEFAULT '{}', -- array of tags like ['setup', 'lesson', 'review']
  mood TEXT CHECK (mood IN ('confident', 'cautious', 'anxious', 'neutral')) DEFAULT 'neutral',
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE trading_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notes" ON trading_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON trading_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON trading_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON trading_notes FOR DELETE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_trading_notes_user_id ON trading_notes(user_id);
CREATE INDEX idx_trading_notes_pair ON trading_notes(pair) WHERE pair IS NOT NULL;
CREATE INDEX idx_trading_notes_analysis_id ON trading_notes(analysis_id) WHERE analysis_id IS NOT NULL;
CREATE INDEX idx_trading_notes_pinned ON trading_notes(user_id, is_pinned) WHERE is_pinned = true;

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trading_notes_updated_at
  BEFORE UPDATE ON trading_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
