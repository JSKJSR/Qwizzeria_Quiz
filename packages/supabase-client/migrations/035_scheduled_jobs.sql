-- Phase 12f: Scheduled jobs for gamification
-- Run in Supabase SQL Editor
--
-- Two mechanisms:
--   1. Lazy streak freeze reset — auto-resets on first daily interaction (no cron needed)
--   2. pg_cron league promotions — batch job every Monday at 00:05 UTC

------------------------------------------------------------------------
-- 1. LAZY STREAK FREEZE RESET
------------------------------------------------------------------------
-- Rewrites reset_monthly_streak_freezes to auto-detect user tier from
-- the subscriptions table, so it can be called without passing the tier.
-- Then hooks into get_daily_missions so it fires on the user's first
-- dashboard visit each month — self-healing, zero client changes.

CREATE OR REPLACE FUNCTION reset_monthly_streak_freezes(target_user_id UUID, user_tier TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month DATE := date_trunc('month', CURRENT_DATE)::DATE;
  last_reset DATE;
  resolved_tier TEXT;
  new_freezes INTEGER;
BEGIN
  SELECT streak_freeze_last_reset INTO last_reset
  FROM user_profiles
  WHERE id = target_user_id;

  -- Only reset once per month
  IF last_reset IS NOT NULL AND last_reset >= current_month THEN
    RETURN;
  END IF;

  -- Auto-detect tier if not provided
  IF user_tier IS NOT NULL THEN
    resolved_tier := user_tier;
  ELSE
    SELECT tier INTO resolved_tier
    FROM subscriptions
    WHERE user_id = target_user_id
      AND status = 'active'
    ORDER BY current_period_end DESC NULLS LAST
    LIMIT 1;

    resolved_tier := COALESCE(resolved_tier, 'free');
  END IF;

  -- Determine freezes by tier
  new_freezes := CASE resolved_tier
    WHEN 'pro' THEN 30
    WHEN 'basic' THEN 3
    ELSE 1
  END;

  UPDATE user_profiles
  SET streak_freezes_remaining = new_freezes,
      streak_freeze_last_reset = current_month
  WHERE id = target_user_id;
END;
$$;

-- Hook lazy freeze reset into get_daily_missions (runs once per day per user).
-- This ensures freezes reset on the user's first interaction each month,
-- with zero client-side changes.
CREATE OR REPLACE FUNCTION get_daily_missions(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  result JSONB;
  seed_hash TEXT;
  mission_pool JSONB;
  selected_missions JSONB[];
  mission JSONB;
  i INTEGER;
  pool_size INTEGER;
  idx INTEGER;
  existing_count INTEGER;
BEGIN
  -- Lazy streak freeze reset (idempotent, skips if already done this month)
  PERFORM reset_monthly_streak_freezes(target_user_id);

  -- Check if user already has missions for today
  SELECT COUNT(*) INTO existing_count
  FROM daily_mission_progress
  WHERE user_id = target_user_id AND mission_date = today;

  IF existing_count > 0 THEN
    SELECT jsonb_agg(
      jsonb_build_object(
        'mission_key', mission_key,
        'target', target,
        'progress', progress,
        'xp_reward', xp_reward,
        'completed_at', completed_at
      )
    ) INTO result
    FROM daily_mission_progress
    WHERE user_id = target_user_id AND mission_date = today;

    RETURN result;
  END IF;

  -- Define mission pool
  mission_pool := '[
    {"key": "answer_10", "target": 10, "xp": 50, "label": "Answer 10 questions"},
    {"key": "answer_20", "target": 20, "xp": 100, "label": "Answer 20 questions"},
    {"key": "correct_5", "target": 5, "xp": 40, "label": "Get 5 correct answers"},
    {"key": "correct_10", "target": 10, "xp": 80, "label": "Get 10 correct answers"},
    {"key": "play_quiz", "target": 1, "xp": 30, "label": "Complete a quiz"},
    {"key": "play_3_quizzes", "target": 3, "xp": 75, "label": "Complete 3 quizzes"},
    {"key": "streak_3", "target": 3, "xp": 60, "label": "Get a 3-answer streak"},
    {"key": "streak_5", "target": 5, "xp": 100, "label": "Get a 5-answer streak"},
    {"key": "perfect_quiz", "target": 1, "xp": 120, "label": "Get 100% on a quiz"},
    {"key": "play_pack", "target": 1, "xp": 50, "label": "Play a quiz pack"}
  ]'::JSONB;

  pool_size := jsonb_array_length(mission_pool);
  seed_hash := md5(target_user_id::TEXT || today::TEXT);

  selected_missions := ARRAY[]::JSONB[];
  i := 0;
  WHILE array_length(selected_missions, 1) IS NULL OR array_length(selected_missions, 1) < 3 LOOP
    idx := (('x' || substring(seed_hash from (i * 2 + 1) for 2))::BIT(8)::INTEGER) % pool_size;
    mission := mission_pool->idx;

    IF NOT mission = ANY(selected_missions) THEN
      selected_missions := array_append(selected_missions, mission);
    END IF;
    i := i + 1;
    IF i > 20 THEN EXIT; END IF;
  END LOOP;

  FOR i IN 1..array_length(selected_missions, 1) LOOP
    mission := selected_missions[i];
    INSERT INTO daily_mission_progress (user_id, mission_date, mission_key, target, xp_reward)
    VALUES (
      target_user_id,
      today,
      mission->>'key',
      (mission->>'target')::INTEGER,
      (mission->>'xp')::INTEGER
    )
    ON CONFLICT (user_id, mission_date, mission_key) DO NOTHING;
  END LOOP;

  SELECT jsonb_agg(
    jsonb_build_object(
      'mission_key', mission_key,
      'target', target,
      'progress', progress,
      'xp_reward', xp_reward,
      'completed_at', completed_at
    )
  ) INTO result
  FROM daily_mission_progress
  WHERE user_id = target_user_id AND mission_date = today;

  RETURN result;
END;
$$;

------------------------------------------------------------------------
-- 2. PG_CRON: WEEKLY LEAGUE PROMOTIONS
------------------------------------------------------------------------
-- Requires the pg_cron extension to be enabled in Supabase Dashboard:
--   Database > Extensions > search "pg_cron" > Enable
--
-- Once enabled, run the SELECT below to schedule the job.
-- If pg_cron is not yet enabled, skip the SELECT — the function
-- itself (process_league_promotions) is already deployed and can
-- be called manually via: SELECT process_league_promotions();

-- Enable extension (no-op if already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule: every Monday at 00:05 UTC
-- The 5-minute offset avoids running exactly at midnight when
-- date_trunc('week') transitions.
SELECT cron.schedule(
  'weekly-league-promotions',           -- job name
  '5 0 * * 1',                          -- cron: 00:05 every Monday
  $$SELECT process_league_promotions()$$
);
