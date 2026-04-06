-- Phase 12d: Weekly League system
-- Run in Supabase SQL Editor

-- League definitions: Bronze(1) → Silver(2) → Gold(3) → Diamond(4)
-- Users earn weekly XP; top N promote, bottom N demote each Monday

-- Store user league assignments and weekly XP
CREATE TABLE IF NOT EXISTS user_leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  league TEXT NOT NULL DEFAULT 'bronze' CHECK (league IN ('bronze', 'silver', 'gold', 'diamond')),
  week_start DATE NOT NULL,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  final_rank INTEGER,
  promoted BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_user_leagues_week ON user_leagues(week_start, league);
CREATE INDEX IF NOT EXISTS idx_user_leagues_user ON user_leagues(user_id, week_start DESC);

-- RLS
ALTER TABLE user_leagues ENABLE ROW LEVEL SECURITY;

-- Users can read all league entries (leaderboard is public)
CREATE POLICY user_leagues_select ON user_leagues
  FOR SELECT USING (true);

-- Users can insert/update their own
CREATE POLICY user_leagues_insert ON user_leagues
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_leagues_update ON user_leagues
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can manage all
CREATE POLICY user_leagues_admin ON user_leagues
  FOR ALL USING (is_admin());

-- RPC: Get current week start (Monday)
CREATE OR REPLACE FUNCTION get_current_week_start()
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT date_trunc('week', CURRENT_DATE)::DATE;
$$;

-- RPC: Get or create league entry for current week
CREATE OR REPLACE FUNCTION get_user_league(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_week DATE := date_trunc('week', CURRENT_DATE)::DATE;
  prev_week DATE := current_week - INTERVAL '7 days';
  result RECORD;
  prev_league TEXT;
BEGIN
  -- Try to get existing entry for this week
  SELECT * INTO result
  FROM user_leagues
  WHERE user_id = target_user_id AND week_start = current_week;

  IF result IS NULL THEN
    -- Get previous week's league (or default to bronze)
    SELECT league INTO prev_league
    FROM user_leagues
    WHERE user_id = target_user_id AND week_start = prev_week;

    prev_league := COALESCE(prev_league, 'bronze');

    -- Create entry for current week, carrying league forward
    INSERT INTO user_leagues (user_id, week_start, league, weekly_xp)
    VALUES (target_user_id, current_week, prev_league, 0)
    ON CONFLICT (user_id, week_start) DO NOTHING
    RETURNING * INTO result;

    -- Re-fetch in case of conflict
    IF result IS NULL THEN
      SELECT * INTO result
      FROM user_leagues
      WHERE user_id = target_user_id AND week_start = current_week;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'league', result.league,
    'weekly_xp', result.weekly_xp,
    'week_start', result.week_start
  );
END;
$$;

-- RPC: Add weekly XP (called after quiz completion alongside gamification sync)
CREATE OR REPLACE FUNCTION add_weekly_league_xp(target_user_id UUID, xp_amount INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_week DATE := date_trunc('week', CURRENT_DATE)::DATE;
  prev_week DATE := current_week - INTERVAL '7 days';
  user_league TEXT;
BEGIN
  -- Look up current or previous league (don't blindly default to bronze)
  SELECT league INTO user_league
  FROM user_leagues
  WHERE user_id = target_user_id AND week_start = current_week;

  IF user_league IS NULL THEN
    SELECT league INTO user_league
    FROM user_leagues
    WHERE user_id = target_user_id AND week_start = prev_week;
  END IF;

  user_league := COALESCE(user_league, 'bronze');

  -- Upsert: create entry if missing, add XP
  INSERT INTO user_leagues (user_id, week_start, league, weekly_xp)
  VALUES (target_user_id, current_week, user_league, xp_amount)
  ON CONFLICT (user_id, week_start)
  DO UPDATE SET weekly_xp = user_leagues.weekly_xp + xp_amount;
END;
$$;

-- RPC: Get league standings for a specific league and week
CREATE OR REPLACE FUNCTION get_league_standings(
  target_league TEXT DEFAULT NULL,
  target_week DATE DEFAULT NULL,
  result_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  week_date DATE := COALESCE(target_week, date_trunc('week', CURRENT_DATE)::DATE);
  league_filter TEXT := COALESCE(target_league, 'bronze');
  result JSONB;
BEGIN
  SELECT jsonb_agg(row_data ORDER BY weekly_xp DESC)
  INTO result
  FROM (
    SELECT jsonb_build_object(
      'user_id', ul.user_id,
      'display_name', COALESCE(up.display_name, 'Anonymous'),
      'league', ul.league,
      'weekly_xp', ul.weekly_xp,
      'rank', ROW_NUMBER() OVER (ORDER BY ul.weekly_xp DESC)
    ) AS row_data
    FROM user_leagues ul
    LEFT JOIN user_profiles up ON up.id = ul.user_id
    WHERE ul.week_start = week_date
      AND ul.league = league_filter
    ORDER BY ul.weekly_xp DESC
    LIMIT result_limit
  ) sub;

  RETURN COALESCE(result, '[]'::JSONB);
END;
$$;

-- RPC: Process weekly league promotions/demotions
-- Should be called via a cron job or Edge Function every Monday
CREATE OR REPLACE FUNCTION process_league_promotions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  last_week DATE := (date_trunc('week', CURRENT_DATE) - INTERVAL '7 days')::DATE;
  current_week DATE := date_trunc('week', CURRENT_DATE)::DATE;
  league_name TEXT;
  rec RECORD;
  total_in_league INTEGER;
  promote_count INTEGER;
  demote_count INTEGER;
  rank_counter INTEGER;
  promotions INTEGER := 0;
  demotions INTEGER := 0;
  next_league TEXT;
  prev_league TEXT;
BEGIN
  -- Idempotency: skip if already processed (final_rank set means this week was done)
  SELECT COUNT(*) INTO promote_count
  FROM user_leagues
  WHERE week_start = last_week AND final_rank IS NOT NULL;

  IF promote_count > 0 THEN
    RETURN jsonb_build_object('skipped', true, 'reason', 'already_processed', 'week', last_week);
  END IF;

  -- Process each league
  FOREACH league_name IN ARRAY ARRAY['bronze', 'silver', 'gold', 'diamond'] LOOP
    -- Count users in this league last week
    SELECT COUNT(*) INTO total_in_league
    FROM user_leagues
    WHERE week_start = last_week AND league = league_name;

    IF total_in_league = 0 THEN CONTINUE; END IF;

    -- Top 20% promote (min 1), bottom 20% demote (min 1)
    promote_count := GREATEST(1, total_in_league / 5);
    demote_count := GREATEST(1, total_in_league / 5);

    -- Determine next/prev leagues
    next_league := CASE league_name
      WHEN 'bronze' THEN 'silver'
      WHEN 'silver' THEN 'gold'
      WHEN 'gold' THEN 'diamond'
      ELSE NULL
    END;

    prev_league := CASE league_name
      WHEN 'diamond' THEN 'gold'
      WHEN 'gold' THEN 'silver'
      WHEN 'silver' THEN 'bronze'
      ELSE NULL
    END;

    -- Rank users in this league
    rank_counter := 0;
    FOR rec IN
      SELECT user_id, weekly_xp
      FROM user_leagues
      WHERE week_start = last_week AND league = league_name
      ORDER BY weekly_xp DESC
    LOOP
      rank_counter := rank_counter + 1;

      -- Update rank
      UPDATE user_leagues
      SET final_rank = rank_counter
      WHERE user_id = rec.user_id AND week_start = last_week;

      -- Promote top users (if not already diamond)
      IF rank_counter <= promote_count AND next_league IS NOT NULL AND rec.weekly_xp > 0 THEN
        UPDATE user_leagues SET promoted = true
        WHERE user_id = rec.user_id AND week_start = last_week;

        INSERT INTO user_leagues (user_id, week_start, league, weekly_xp)
        VALUES (rec.user_id, current_week, next_league, 0)
        ON CONFLICT (user_id, week_start) DO UPDATE SET league = next_league;

        promotions := promotions + 1;

      -- Demote bottom users (if not already bronze)
      ELSIF rank_counter > (total_in_league - demote_count) AND prev_league IS NOT NULL THEN
        UPDATE user_leagues SET promoted = false
        WHERE user_id = rec.user_id AND week_start = last_week;

        INSERT INTO user_leagues (user_id, week_start, league, weekly_xp)
        VALUES (rec.user_id, current_week, prev_league, 0)
        ON CONFLICT (user_id, week_start) DO UPDATE SET league = prev_league;

        demotions := demotions + 1;

      -- Stay in same league
      ELSE
        INSERT INTO user_leagues (user_id, week_start, league, weekly_xp)
        VALUES (rec.user_id, current_week, league_name, 0)
        ON CONFLICT (user_id, week_start) DO NOTHING;
      END IF;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'processed_week', last_week,
    'promotions', promotions,
    'demotions', demotions
  );
END;
$$;
