-- ============================================================================
-- P0-S3-T3: Gamification Tables (MOXI Quest System + XP + Levels)
-- Builds on top of existing `rewards` infrastructure and `profiles.xp`.
-- Adds 6 tables:
--   xp_levels       — level definitions (1-100) with XP thresholds
--   missions        — available missions/quests (MOXI assigns these)
--   user_missions   — per-user mission progress
--   badges          — badge definitions
--   user_badges     — badges earned by users
--   xp_transactions — XP earn/spend ledger (immutable audit trail)
-- ============================================================================

-- ── 1. xp_levels ────────────────────────────────────────────────────────────
-- Static lookup table: level → XP required to reach it.
-- Seeded with 100 levels (Bronze 1-25, Silver 26-50, Gold 51-75, Platinum 76-100).

CREATE TABLE IF NOT EXISTS public.xp_levels (
  level           INT PRIMARY KEY CHECK (level BETWEEN 1 AND 100),
  xp_required     INT NOT NULL,          -- total cumulative XP to reach this level
  xp_to_next      INT,                   -- XP needed to advance to next level
  tier            TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze','silver','gold','platinum')),
  title           TEXT NOT NULL,         -- e.g. "Scout", "Hunter", "Ranger", "Apex"
  perks           JSONB NOT NULL DEFAULT '[]'::jsonb,  -- unlocked features/bonuses
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed 100 levels
INSERT INTO public.xp_levels (level, xp_required, xp_to_next, tier, title) VALUES
  -- Bronze: 1-25 (Scout tier)
  (1,    0,      100,  'bronze',   'Scout'),
  (2,    100,    150,  'bronze',   'Scout'),
  (3,    250,    200,  'bronze',   'Scout'),
  (4,    450,    250,  'bronze',   'Scout'),
  (5,    700,    300,  'bronze',   'Hunter'),
  (6,    1000,   350,  'bronze',   'Hunter'),
  (7,    1350,   400,  'bronze',   'Hunter'),
  (8,    1750,   450,  'bronze',   'Hunter'),
  (9,    2200,   500,  'bronze',   'Hunter'),
  (10,   2700,   600,  'bronze',   'Ranger'),
  (11,   3300,   650,  'bronze',   'Ranger'),
  (12,   3950,   700,  'bronze',   'Ranger'),
  (13,   4650,   750,  'bronze',   'Ranger'),
  (14,   5400,   800,  'bronze',   'Ranger'),
  (15,   6200,   900,  'bronze',   'Tracker'),
  (16,   7100,   950,  'bronze',   'Tracker'),
  (17,   8050,   1000, 'bronze',   'Tracker'),
  (18,   9050,   1050, 'bronze',   'Tracker'),
  (19,   10100,  1100, 'bronze',   'Tracker'),
  (20,   11200,  1200, 'bronze',   'Stalker'),
  (21,   12400,  1250, 'bronze',   'Stalker'),
  (22,   13650,  1300, 'bronze',   'Stalker'),
  (23,   14950,  1350, 'bronze',   'Stalker'),
  (24,   16300,  1400, 'bronze',   'Stalker'),
  (25,   17700,  1500, 'bronze',   'Elite Scout'),
  -- Silver: 26-50 (Predator tier)
  (26,   19200,  1600, 'silver',   'Predator'),
  (27,   20800,  1700, 'silver',   'Predator'),
  (28,   22500,  1800, 'silver',   'Predator'),
  (29,   24300,  1900, 'silver',   'Predator'),
  (30,   26200,  2000, 'silver',   'Apex Predator'),
  (31,   28200,  2100, 'silver',   'Apex Predator'),
  (32,   30300,  2200, 'silver',   'Apex Predator'),
  (33,   32500,  2300, 'silver',   'Apex Predator'),
  (34,   34800,  2400, 'silver',   'Apex Predator'),
  (35,   37200,  2500, 'silver',   'Phantom'),
  (36,   39700,  2600, 'silver',   'Phantom'),
  (37,   42300,  2700, 'silver',   'Phantom'),
  (38,   45000,  2800, 'silver',   'Phantom'),
  (39,   47800,  2900, 'silver',   'Phantom'),
  (40,   50700,  3000, 'silver',   'Ghost'),
  (41,   53700,  3100, 'silver',   'Ghost'),
  (42,   56800,  3200, 'silver',   'Ghost'),
  (43,   60000,  3300, 'silver',   'Ghost'),
  (44,   63300,  3400, 'silver',   'Ghost'),
  (45,   66700,  3500, 'silver',   'Shadow'),
  (46,   70200,  3600, 'silver',   'Shadow'),
  (47,   73800,  3700, 'silver',   'Shadow'),
  (48,   77500,  3800, 'silver',   'Shadow'),
  (49,   81300,  3900, 'silver',   'Shadow'),
  (50,   85200,  4000, 'silver',   'Elite Hunter'),
  -- Gold: 51-75 (Sentinel tier)
  (51,   89200,  4200, 'gold',     'Sentinel'),
  (52,   93400,  4400, 'gold',     'Sentinel'),
  (53,   97800,  4600, 'gold',     'Sentinel'),
  (54,   102400, 4800, 'gold',     'Sentinel'),
  (55,   107200, 5000, 'gold',     'Warlord'),
  (56,   112200, 5200, 'gold',     'Warlord'),
  (57,   117400, 5400, 'gold',     'Warlord'),
  (58,   122800, 5600, 'gold',     'Warlord'),
  (59,   128400, 5800, 'gold',     'Warlord'),
  (60,   134200, 6000, 'gold',     'Commander'),
  (61,   140200, 6200, 'gold',     'Commander'),
  (62,   146400, 6400, 'gold',     'Commander'),
  (63,   152800, 6600, 'gold',     'Commander'),
  (64,   159400, 6800, 'gold',     'Commander'),
  (65,   166200, 7000, 'gold',     'Overlord'),
  (66,   173200, 7200, 'gold',     'Overlord'),
  (67,   180400, 7400, 'gold',     'Overlord'),
  (68,   187800, 7600, 'gold',     'Overlord'),
  (69,   195400, 7800, 'gold',     'Overlord'),
  (70,   203200, 8000, 'gold',     'Titan'),
  (71,   211200, 8200, 'gold',     'Titan'),
  (72,   219400, 8400, 'gold',     'Titan'),
  (73,   227800, 8600, 'gold',     'Titan'),
  (74,   236400, 8800, 'gold',     'Titan'),
  (75,   245200, 9000, 'gold',     'Elite Sentinel'),
  -- Platinum: 76-100 (Apex tier)
  (76,   254200, 9500,  'platinum', 'Apex'),
  (77,   263700, 10000, 'platinum', 'Apex'),
  (78,   273700, 10500, 'platinum', 'Apex'),
  (79,   284200, 11000, 'platinum', 'Apex'),
  (80,   295200, 11500, 'platinum', 'Legend'),
  (81,   306700, 12000, 'platinum', 'Legend'),
  (82,   318700, 12500, 'platinum', 'Legend'),
  (83,   331200, 13000, 'platinum', 'Legend'),
  (84,   344200, 13500, 'platinum', 'Legend'),
  (85,   357700, 14000, 'platinum', 'Mythic'),
  (86,   371700, 14500, 'platinum', 'Mythic'),
  (87,   386200, 15000, 'platinum', 'Mythic'),
  (88,   401200, 15500, 'platinum', 'Mythic'),
  (89,   416700, 16000, 'platinum', 'Mythic'),
  (90,   432700, 17000, 'platinum', 'Immortal'),
  (91,   449700, 18000, 'platinum', 'Immortal'),
  (92,   467700, 19000, 'platinum', 'Immortal'),
  (93,   486700, 20000, 'platinum', 'Immortal'),
  (94,   506700, 21000, 'platinum', 'Immortal'),
  (95,   527700, 22000, 'platinum', 'Radiant'),
  (96,   549700, 23000, 'platinum', 'Radiant'),
  (97,   572700, 24000, 'platinum', 'Radiant'),
  (98,   596700, 25000, 'platinum', 'Radiant'),
  (99,   621700, 28300, 'platinum', 'Radiant'),
  (100,  650000, NULL,  'platinum', 'MOXI Master')
ON CONFLICT (level) DO NOTHING;


-- ── 2. missions ──────────────────────────────────────────────────────────────
-- Mission definitions (MOXI assigns these as quests to users).

CREATE TABLE IF NOT EXISTS public.missions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key              TEXT NOT NULL UNIQUE,   -- stable identifier, e.g. 'first_scan', 'whale_track_3'
  product          TEXT NOT NULL DEFAULT 'hunt' CHECK (product IN ('hunt','shield','trade','core')),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  mission_type     TEXT NOT NULL DEFAULT 'one_time' CHECK (mission_type IN ('one_time','daily','weekly','streak','milestone')),

  -- Requirements to complete
  required_action  TEXT NOT NULL,          -- e.g. 'complete_scan', 'track_signal', 'analyze_token'
  required_count   INT NOT NULL DEFAULT 1,
  required_params  JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Rewards
  xp_reward        INT NOT NULL DEFAULT 0,
  badge_id         UUID,                   -- optional badge reward (FK added after badges table)
  bonus_points     INT NOT NULL DEFAULT 0,

  -- Metadata
  difficulty       TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','medium','hard','legendary')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  icon             TEXT,                   -- lucide icon name
  color            TEXT,                   -- hex or css var

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_missions_product    ON public.missions(product);
CREATE INDEX idx_missions_type       ON public.missions(mission_type);
CREATE INDEX idx_missions_active     ON public.missions(is_active);
CREATE INDEX idx_missions_key        ON public.missions(key);

ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
-- All authenticated users can read active missions
CREATE POLICY "Authenticated can read active missions" ON public.missions FOR SELECT TO authenticated USING (is_active = true);
-- Service role can manage missions
CREATE POLICY "Service can manage missions" ON public.missions FOR ALL TO service_role WITH CHECK (true);


-- ── 3. user_missions ────────────────────────────────────────────────────────
-- Tracks per-user mission progress.

CREATE TABLE IF NOT EXISTS public.user_missions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_id       UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,

  status           TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','failed','expired')),
  progress         INT NOT NULL DEFAULT 0,          -- current count toward required_count
  required_count   INT NOT NULL DEFAULT 1,          -- snapshot at assignment time

  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at     TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ,                     -- for daily/weekly missions

  -- XP already awarded (prevent double-award)
  xp_awarded       INT NOT NULL DEFAULT 0,

  UNIQUE (user_id, mission_id, started_at)          -- allows re-assignment of daily missions
);

CREATE INDEX idx_user_missions_user_id    ON public.user_missions(user_id);
CREATE INDEX idx_user_missions_status     ON public.user_missions(status);
CREATE INDEX idx_user_missions_mission_id ON public.user_missions(mission_id);
CREATE INDEX idx_user_missions_user_status ON public.user_missions(user_id, status);

ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own missions" ON public.user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can manage user missions" ON public.user_missions FOR ALL TO service_role WITH CHECK (true);


-- ── 4. badges ────────────────────────────────────────────────────────────────
-- Badge definitions (visual achievements).

CREATE TABLE IF NOT EXISTS public.badges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key              TEXT NOT NULL UNIQUE,
  product          TEXT NOT NULL DEFAULT 'core' CHECK (product IN ('hunt','shield','trade','core')),
  name             TEXT NOT NULL,
  description      TEXT NOT NULL,
  icon             TEXT,                   -- SVG path or emoji
  color            TEXT DEFAULT '#6366F1',
  rarity           TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common','rare','epic','legendary')),
  category         TEXT NOT NULL DEFAULT 'achievement' CHECK (category IN ('achievement','level','streak','special','event')),
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active badges" ON public.badges FOR SELECT USING (is_active = true);
CREATE POLICY "Service can manage badges" ON public.badges FOR ALL TO service_role WITH CHECK (true);

-- Now add FK from missions to badges
ALTER TABLE public.missions
  ADD CONSTRAINT fk_missions_badge_id
  FOREIGN KEY (badge_id) REFERENCES public.badges(id) ON DELETE SET NULL;


-- ── 5. user_badges ───────────────────────────────────────────────────────────
-- Earned badges per user.

CREATE TABLE IF NOT EXISTS public.user_badges (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id         UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  source           TEXT,                   -- 'mission', 'level_up', 'manual', 'event'
  source_id        UUID,                   -- e.g. mission_id that triggered it

  UNIQUE (user_id, badge_id)               -- each badge awarded once
);

CREATE INDEX idx_user_badges_user_id  ON public.user_badges(user_id);
CREATE INDEX idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX idx_user_badges_earned   ON public.user_badges(earned_at DESC);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own badges" ON public.user_badges FOR SELECT USING (auth.uid() = user_id);
-- Any authenticated user can see other users' badges (public profile)
CREATE POLICY "Anyone can read badges" ON public.user_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service can award badges" ON public.user_badges FOR INSERT TO service_role WITH CHECK (true);


-- ── 6. xp_transactions ───────────────────────────────────────────────────────
-- Immutable XP ledger. Every XP change is recorded here.

CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount           INT NOT NULL,           -- positive = earned, negative = spent
  reason           TEXT NOT NULL,          -- human-readable reason
  source           TEXT NOT NULL,          -- 'mission', 'level_bonus', 'streak', 'admin'
  source_id        UUID,                   -- mission_id, badge_id, etc.
  balance_after    INT NOT NULL,           -- XP balance after this transaction
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_xp_transactions_user_id ON public.xp_transactions(user_id);
CREATE INDEX idx_xp_transactions_created ON public.xp_transactions(created_at DESC);
CREATE INDEX idx_xp_transactions_source  ON public.xp_transactions(source);

ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own XP history" ON public.xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service can insert XP transactions" ON public.xp_transactions FOR INSERT TO service_role WITH CHECK (true);


-- ── Seed initial missions ────────────────────────────────────────────────────

INSERT INTO public.missions (key, product, title, description, mission_type, required_action, required_count, xp_reward, difficulty, icon, color) VALUES
  -- HUNT missions
  ('first_radar_scan',      'hunt', 'First Blood',         'Open the Radar Feed and view your first token',    'one_time', 'view_radar',          1,  50,  'easy',      'Radio',     '#22D3A6'),
  ('track_first_signal',    'hunt', 'On the Hunt',         'Track your first signal from the analysis page',   'one_time', 'track_signal',        1,  100, 'easy',      'Target',    '#22D3A6'),
  ('analyze_5_tokens',      'hunt', 'Scout Report',        'Analyze 5 different tokens',                       'one_time', 'analyze_token',       5,  200, 'medium',    'BarChart2', '#22D3A6'),
  ('daily_radar_check',     'hunt', 'Daily Patrol',        'Check the Radar Feed 7 days in a row',             'streak',   'view_radar',          7,  300, 'medium',    'Calendar',  '#22D3A6'),
  ('discover_gem',          'hunt', 'Gem Hunter',          'Discover a token with 90%+ discovery score',        'one_time', 'discover_high_score', 1,  500, 'hard',      'Gem',       '#F59E0B'),
  -- SHIELD missions
  ('first_contract_scan',   'shield', 'Safety First',      'Run your first contract scan',                     'one_time', 'contract_scan',       1,  75,  'easy',      'Shield',    '#6366F1'),
  ('scan_5_contracts',      'shield', 'Forensic Analyst',  'Scan 5 contracts in SHIELD',                       'one_time', 'contract_scan',       5,  200, 'medium',    'Search',    '#6366F1'),
  ('open_case_file',        'shield', 'Investigator',      'Open your first case file',                        'one_time', 'create_case',         1,  150, 'easy',      'Folder',    '#6366F1'),
  ('catch_rug',             'shield', 'Rug Busted',        'Identify a DANGER verdict token before it rugs',   'one_time', 'flag_danger',         1,  1000,'legendary', 'AlertTriangle','#EF4444'),
  -- Core missions
  ('complete_profile',      'core', 'Identity Confirmed',  'Complete your profile setup',                      'one_time', 'complete_profile',    1,  50,  'easy',      'User',      '#9498A8'),
  ('daily_login_7',         'core', 'Committed',           'Log in 7 days in a row',                           'streak',   'login',               7,  200, 'easy',      'Zap',       '#9498A8'),
  ('daily_login_30',        'core', 'Dedicated',           'Log in 30 days in a row',                          'streak',   'login',               30, 1000,'hard',      'Crown',     '#F59E0B'),
  ('reach_level_10',        'core', 'Rising Star',         'Reach Level 10',                                   'milestone','level_up',            10, 500, 'medium',    'TrendingUp','#22D3A6'),
  ('reach_level_50',        'core', 'Veteran Hunter',      'Reach Level 50',                                   'milestone','level_up',            50, 2000,'hard',      'Award',     '#F59E0B'),
  ('reach_level_100',       'core', 'MOXI Master',         'Reach the maximum Level 100',                      'milestone','level_up',            100,10000,'legendary','Sparkles',  '#A855F7')
ON CONFLICT (key) DO NOTHING;


-- ── Seed initial badges ──────────────────────────────────────────────────────

INSERT INTO public.badges (key, product, name, description, rarity, category, color) VALUES
  ('first_blood',     'hunt',   'First Blood',      'Tracked your first signal',                   'common',    'achievement', '#22D3A6'),
  ('gem_hunter',      'hunt',   'Gem Hunter',        'Discovered a high-score token',               'epic',      'achievement', '#F59E0B'),
  ('rug_buster',      'shield', 'Rug Buster',        'Identified a danger token before it rugged',  'legendary', 'special',     '#EF4444'),
  ('forensic_expert', 'shield', 'Forensic Expert',   'Closed 10 case files',                        'rare',      'achievement', '#6366F1'),
  ('rising_star',     'core',   'Rising Star',       'Reached Level 10',                            'common',    'level',       '#22D3A6'),
  ('veteran',         'core',   'Veteran Hunter',    'Reached Level 50',                            'rare',      'level',       '#F59E0B'),
  ('moxi_master',     'core',   'MOXI Master',       'Reached the maximum Level 100',               'legendary', 'level',       '#A855F7'),
  ('committed',       'core',   'Committed',         '7-day login streak',                          'common',    'streak',      '#9498A8'),
  ('dedicated',       'core',   'Dedicated',         '30-day login streak',                         'epic',      'streak',      '#F59E0B')
ON CONFLICT (key) DO NOTHING;

-- Link badge rewards to missions
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'first_blood')     WHERE key = 'track_first_signal';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'gem_hunter')      WHERE key = 'discover_gem';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'rug_buster')      WHERE key = 'catch_rug';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'rising_star')     WHERE key = 'reach_level_10';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'veteran')         WHERE key = 'reach_level_50';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'moxi_master')     WHERE key = 'reach_level_100';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'committed')       WHERE key = 'daily_login_7';
UPDATE public.missions SET badge_id = (SELECT id FROM public.badges WHERE key = 'dedicated')       WHERE key = 'daily_login_30';
