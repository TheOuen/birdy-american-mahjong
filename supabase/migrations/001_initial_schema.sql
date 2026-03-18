-- American Mahjong — Initial Schema
-- Run this migration after connecting to Supabase

-- ============================================
-- 1. Profiles (extends Supabase auth.users)
-- ============================================
CREATE TABLE profiles (
  id              uuid REFERENCES auth.users PRIMARY KEY,
  display_name    text,
  avatar_url      text,
  games_played    integer DEFAULT 0,
  games_won       integer DEFAULT 0,
  rating          integer DEFAULT 1000,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read any profile (for display names in games)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (true);

-- Users can update their own profile
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. Games (room state)
-- ============================================
CREATE TABLE games (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code            text UNIQUE,
  status          text DEFAULT 'waiting'
                  CHECK (status IN ('waiting', 'charleston', 'playing', 'finished', 'abandoned')),
  type            text DEFAULT 'private'
                  CHECK (type IN ('private', 'public')),
  host_id         uuid REFERENCES profiles(id),
  current_turn    uuid REFERENCES profiles(id),
  turn_order      uuid[],
  dealer_index    integer DEFAULT 0,
  wall            jsonb,
  discard_pile    jsonb DEFAULT '[]'::jsonb,
  charleston_step text,
  round           integer DEFAULT 1,
  winner_id       uuid REFERENCES profiles(id),
  winning_method  text CHECK (winning_method IN ('self_draw', 'discard', NULL)),
  winning_hand_id uuid,
  turn_timer_sec  integer DEFAULT 30,
  created_at      timestamptz DEFAULT now(),
  finished_at     timestamptz
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Players in a game can read it (but wall is filtered in app logic)
CREATE POLICY "games_select" ON games
  FOR SELECT USING (true);

-- Host can create games
CREATE POLICY "games_insert" ON games
  FOR INSERT WITH CHECK (auth.uid() = host_id);

-- Game updates handled by Edge Functions with service role
-- Players cannot directly update game state

-- ============================================
-- 3. Game Players (per-player state in a game)
-- ============================================
CREATE TABLE game_players (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         uuid REFERENCES games(id) ON DELETE CASCADE,
  user_id         uuid REFERENCES profiles(id),
  seat            integer CHECK (seat BETWEEN 0 AND 3),
  hand            jsonb DEFAULT '[]'::jsonb,
  exposed         jsonb DEFAULT '[]'::jsonb,
  is_bot          boolean DEFAULT false,
  is_dead         boolean DEFAULT false,
  score           integer DEFAULT 0,
  connected       boolean DEFAULT true,
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, seat)
);

ALTER TABLE game_players ENABLE ROW LEVEL SECURITY;

-- Players can see their own hand; see other players' exposed tiles only
CREATE POLICY "game_players_select_own" ON game_players
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      -- Other players can see everything except hand
      EXISTS (
        SELECT 1 FROM game_players gp
        WHERE gp.game_id = game_players.game_id
        AND gp.user_id = auth.uid()
      )
    )
  );

-- Insert handled by Edge Functions with service role

-- ============================================
-- 4. NMJL Hands (admin-editable yearly card)
-- ============================================
CREATE TABLE nmjl_hands (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year            integer NOT NULL,
  category        text NOT NULL,
  pattern         text NOT NULL,
  pattern_parsed  jsonb NOT NULL,
  suits_rule      text,
  concealed       boolean DEFAULT false,
  points          integer DEFAULT 25,
  sort_order      integer DEFAULT 0,
  active          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE nmjl_hands ENABLE ROW LEVEL SECURITY;

-- Anyone can read the card (needed for in-game reference)
CREATE POLICY "nmjl_hands_select" ON nmjl_hands
  FOR SELECT USING (true);

-- Admin-only write (enforced via is_admin function)
-- Will be created after admin function exists

-- ============================================
-- 5. Matchmaking Queue
-- ============================================
CREATE TABLE matchmaking_queue (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES profiles(id) UNIQUE,
  joined_at       timestamptz DEFAULT now()
);

ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;

-- Users can manage their own queue entry
CREATE POLICY "queue_select" ON matchmaking_queue
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "queue_insert" ON matchmaking_queue
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "queue_delete" ON matchmaking_queue
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. Helper Functions
-- ============================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Admin check function
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT COALESCE(
      (auth.jwt()->'user_metadata'->>'role') = 'admin',
      false
    )
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Promote user to admin
CREATE OR REPLACE FUNCTION promote_to_admin(user_email text)
RETURNS void AS $$
DECLARE
  target_id uuid;
BEGIN
  SELECT id INTO target_id FROM auth.users WHERE email = user_email;
  IF target_id IS NULL THEN
    RAISE EXCEPTION 'User not found: %', user_email;
  END IF;
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Admin Policies (depend on is_admin)
-- ============================================

CREATE POLICY "nmjl_hands_admin_insert" ON nmjl_hands
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "nmjl_hands_admin_update" ON nmjl_hands
  FOR UPDATE USING (is_admin());

CREATE POLICY "nmjl_hands_admin_delete" ON nmjl_hands
  FOR DELETE USING (is_admin());

-- Admin can manage all games
CREATE POLICY "games_admin_update" ON games
  FOR UPDATE USING (is_admin());

CREATE POLICY "games_admin_delete" ON games
  FOR DELETE USING (is_admin());
