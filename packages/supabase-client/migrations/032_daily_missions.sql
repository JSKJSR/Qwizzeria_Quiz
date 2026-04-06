-- Phase 12c: Daily Missions system
-- Run in Supabase SQL Editor

-- Store user mission progress per day
CREATE TABLE IF NOT EXISTS daily_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mission_key TEXT NOT NULL,
  target INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, mission_date, mission_key)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_daily_mission_user_date
  ON daily_mission_progress(user_id, mission_date);

-- RLS
ALTER TABLE daily_mission_progress ENABLE ROW LEVEL SECURITY;

-- Users can read their own missions
CREATE POLICY daily_missions_select ON daily_mission_progress
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own missions
CREATE POLICY daily_missions_insert ON daily_mission_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own missions
CREATE POLICY daily_missions_update ON daily_mission_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin can read all (for analytics)
CREATE POLICY daily_missions_admin_select ON daily_mission_progress
  FOR SELECT USING (is_admin());

-- RPC: Get or initialize today's missions for a user
-- Uses a deterministic seed (user_id + date) to pick 3 missions per day
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
  -- Check if user already has missions for today
  SELECT COUNT(*) INTO existing_count
  FROM daily_mission_progress
  WHERE user_id = target_user_id AND mission_date = today;

  IF existing_count > 0 THEN
    -- Return existing missions
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

  -- Define mission pool (key, target, xp_reward)
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

  -- Deterministic seed from user_id + date for consistent daily missions
  seed_hash := md5(target_user_id::TEXT || today::TEXT);

  -- Pick 3 unique missions using the hash
  selected_missions := ARRAY[]::JSONB[];
  i := 0;
  WHILE array_length(selected_missions, 1) IS NULL OR array_length(selected_missions, 1) < 3 LOOP
    idx := (('x' || substring(seed_hash from (i * 2 + 1) for 2))::BIT(8)::INTEGER) % pool_size;
    mission := mission_pool->idx;

    -- Avoid duplicates
    IF NOT mission = ANY(selected_missions) THEN
      selected_missions := array_append(selected_missions, mission);
    END IF;
    i := i + 1;
    -- Safety: prevent infinite loop
    IF i > 20 THEN EXIT; END IF;
  END LOOP;

  -- Insert the selected missions
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

  -- Return the missions
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

-- RPC: Update mission progress after a quiz
-- Called after quiz completion with event data
CREATE OR REPLACE FUNCTION update_mission_progress(
  target_user_id UUID,
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  is_pack_quiz BOOLEAN DEFAULT FALSE,
  is_perfect BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  result JSONB;
  rec RECORD;
  new_progress INTEGER;
  newly_completed JSONB[] := ARRAY[]::JSONB[];
  total_xp_earned INTEGER := 0;
BEGIN
  -- Process each active mission for today
  FOR rec IN
    SELECT * FROM daily_mission_progress
    WHERE user_id = target_user_id
      AND mission_date = today
      AND completed_at IS NULL
  LOOP
    new_progress := rec.progress;

    CASE rec.mission_key
      WHEN 'answer_10', 'answer_20' THEN
        new_progress := rec.progress + questions_answered;
      WHEN 'correct_5', 'correct_10' THEN
        new_progress := rec.progress + correct_answers;
      WHEN 'play_quiz', 'play_3_quizzes' THEN
        new_progress := rec.progress + quizzes_completed;
      WHEN 'streak_3', 'streak_5' THEN
        new_progress := GREATEST(rec.progress, best_streak);
      WHEN 'perfect_quiz' THEN
        IF is_perfect THEN new_progress := 1; END IF;
      WHEN 'play_pack' THEN
        IF is_pack_quiz THEN new_progress := rec.progress + 1; END IF;
    END CASE;

    -- Cap at target
    new_progress := LEAST(new_progress, rec.target);

    -- Update if changed
    IF new_progress <> rec.progress THEN
      UPDATE daily_mission_progress
      SET progress = new_progress,
          completed_at = CASE WHEN new_progress >= rec.target THEN now() ELSE NULL END
      WHERE id = rec.id;

      -- Track newly completed missions
      IF new_progress >= rec.target AND rec.progress < rec.target THEN
        newly_completed := array_append(newly_completed, jsonb_build_object(
          'mission_key', rec.mission_key,
          'xp_reward', rec.xp_reward
        ));
        total_xp_earned := total_xp_earned + rec.xp_reward;
      END IF;
    END IF;
  END LOOP;

  -- Award mission XP to user_profiles
  IF total_xp_earned > 0 THEN
    UPDATE user_profiles
    SET xp_total = xp_total + total_xp_earned
    WHERE id = target_user_id;
  END IF;

  -- Return update result
  result := jsonb_build_object(
    'newly_completed', to_jsonb(newly_completed),
    'xp_earned', total_xp_earned
  );

  RETURN result;
END;
$$;
