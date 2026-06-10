-- User Watchlists
CREATE TABLE IF NOT EXISTS watchlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'My Watchlist',
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Watchlist Items
CREATE TABLE IF NOT EXISTS watchlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  watchlist_id UUID NOT NULL REFERENCES watchlists(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'forex', -- 'forex', 'crypto', 'commodity', 'stocks'
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(watchlist_id, pair)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_watchlists_user_id ON watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_items_watchlist_id ON watchlist_items(watchlist_id);

-- RLS
ALTER TABLE watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE watchlist_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own watchlists" ON watchlists FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create own watchlists" ON watchlists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own watchlists" ON watchlists FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own watchlists" ON watchlists FOR DELETE USING (user_id = auth.uid());

CREATE POLICY "Users can view items in own watchlists" ON watchlist_items FOR SELECT USING (
  watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can add items to own watchlists" ON watchlist_items FOR INSERT WITH CHECK (
  watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can update items in own watchlists" ON watchlist_items FOR UPDATE USING (
  watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
);
CREATE POLICY "Users can delete items from own watchlists" ON watchlist_items FOR DELETE USING (
  watchlist_id IN (SELECT id FROM watchlists WHERE user_id = auth.uid())
);

-- Auto-create default watchlist for new users
CREATE OR REPLACE FUNCTION create_default_watchlist()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO watchlists (user_id, name, is_default, sort_order)
  VALUES (NEW.id, 'My Watchlist', true, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_default_watchlist();
