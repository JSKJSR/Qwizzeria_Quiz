-- ============================================================
-- Migration 004: Phase 5 — Retention, Leaderboards, Analytics
-- ============================================================

-- A1. user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON user_profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
  ON user_profiles FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public read for leaderboard display names (only display_name + avatar_url, no sensitive data)
CREATE POLICY "Public can read profiles for leaderboards"
  ON user_profiles FOR SELECT USING (true);

-- A2. quiz_sessions status column
ALTER TABLE quiz_sessions
  ADD COLUMN IF NOT EXISTS status TEXT
    NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned'));

-- Backfill existing sessions
UPDATE quiz_sessions
  SET status = CASE
    WHEN completed_at IS NOT NULL THEN 'completed'
    ELSE 'abandoned'
  END
  WHERE status = 'in_progress'
    AND (completed_at IS NOT NULL OR started_at < now() - INTERVAL '1 day');

-- A3. Indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_completed
  ON quiz_sessions (user_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_status_in_progress
  ON quiz_sessions (status)
  WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS idx_sessions_pack_score
  ON quiz_sessions (quiz_pack_id, score DESC);

-- ============================================================
-- A4. Postgres RPC functions (SECURITY DEFINER)
-- ============================================================

-- get_user_stats: aggregate stats for a user
CREATE OR REPLACE FUNCTION get_user_stats(target_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_q INT;
  total_s INT;
  acc NUMERIC;
  fav_cat TEXT;
  packs_done INT;
BEGIN
  SELECT COUNT(*), COALESCE(SUM(score), 0)
  INTO total_q, total_s
  FROM quiz_sessions
  WHERE user_id = target_user_id AND status = 'completed';

  SELECT ROUND(
    COALESCE(
      COUNT(*) FILTER (WHERE is_correct = true)::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE is_correct IS NOT NULL), 0) * 100,
      0
    ), 1
  )
  INTO acc
  FROM question_attempts qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  WHERE qs.user_id = target_user_id AND qs.status = 'completed';

  SELECT qm.category INTO fav_cat
  FROM question_attempts qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  JOIN questions_master qm ON qm.id = qa.question_id
  WHERE qs.user_id = target_user_id AND qs.status = 'completed'
  GROUP BY qm.category
  ORDER BY COUNT(*) DESC
  LIMIT 1;

  SELECT COUNT(DISTINCT quiz_pack_id) INTO packs_done
  FROM quiz_sessions
  WHERE user_id = target_user_id
    AND status = 'completed'
    AND quiz_pack_id IS NOT NULL;

  result := json_build_object(
    'total_quizzes', total_q,
    'total_score', total_s,
    'accuracy_pct', acc,
    'favorite_category', fav_cat,
    'packs_completed', packs_done
  );

  RETURN result;
END;
$$;

-- get_global_leaderboard: top users by total score
CREATE OR REPLACE FUNCTION get_global_leaderboard(
  time_filter TEXT DEFAULT 'all_time',
  result_limit INT DEFAULT 50
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cutoff_date TIMESTAMPTZ;
  result JSON;
BEGIN
  cutoff_date := CASE time_filter
    WHEN 'this_week' THEN date_trunc('week', now())
    WHEN 'this_month' THEN date_trunc('month', now())
    ELSE '1970-01-01'::TIMESTAMPTZ
  END;

  SELECT json_agg(row_data ORDER BY row_data->>'total_score' DESC) INTO result
  FROM (
    SELECT json_build_object(
      'user_id', qs.user_id,
      'display_name', COALESCE(up.display_name, split_part(u.email, '@', 1)),
      'total_score', SUM(qs.score),
      'quizzes_played', COUNT(*),
      'avg_accuracy', ROUND(
        COALESCE(
          (SELECT COUNT(*) FILTER (WHERE qa2.is_correct = true)::NUMERIC /
           NULLIF(COUNT(*) FILTER (WHERE qa2.is_correct IS NOT NULL), 0) * 100
           FROM question_attempts qa2
           JOIN quiz_sessions s2 ON s2.id = qa2.session_id
           WHERE s2.user_id = qs.user_id
             AND s2.status = 'completed'
             AND s2.completed_at >= cutoff_date
          ), 0
        ), 1
      )
    ) AS row_data
    FROM quiz_sessions qs
    LEFT JOIN user_profiles up ON up.id = qs.user_id
    LEFT JOIN auth.users u ON u.id = qs.user_id
    WHERE qs.user_id IS NOT NULL
      AND qs.status = 'completed'
      AND qs.completed_at >= cutoff_date
    GROUP BY qs.user_id, up.display_name, u.email
    ORDER BY SUM(qs.score) DESC
    LIMIT result_limit
  ) sub;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- get_pack_leaderboard: top scores for a specific pack
CREATE OR REPLACE FUNCTION get_pack_leaderboard(
  target_pack_id UUID,
  result_limit INT DEFAULT 10
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT
      qs.user_id,
      COALESCE(up.display_name, split_part(u.email, '@', 1)) AS display_name,
      MAX(qs.score) AS best_score,
      MAX(qs.completed_at) AS best_date
    FROM quiz_sessions qs
    LEFT JOIN user_profiles up ON up.id = qs.user_id
    LEFT JOIN auth.users u ON u.id = qs.user_id
    WHERE qs.quiz_pack_id = target_pack_id
      AND qs.user_id IS NOT NULL
      AND qs.status = 'completed'
    GROUP BY qs.user_id, up.display_name, u.email
    ORDER BY MAX(qs.score) DESC
    LIMIT result_limit
  ) AS row_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- get_admin_analytics: platform-level stats (admin-only)
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  IF COALESCE(
    current_setting('request.jwt.claims', true)::JSON -> 'app_metadata' ->> 'role',
    ''
  ) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_sessions', (SELECT COUNT(*) FROM quiz_sessions WHERE status = 'completed'),
    'avg_score', (SELECT ROUND(COALESCE(AVG(score), 0)::NUMERIC, 1) FROM quiz_sessions WHERE status = 'completed'),
    'active_users_7d', (
      SELECT COUNT(DISTINCT user_id)
      FROM quiz_sessions
      WHERE started_at >= now() - INTERVAL '7 days'
        AND user_id IS NOT NULL
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- get_pack_performance: per-pack metrics (admin-only)
CREATE OR REPLACE FUNCTION get_pack_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  IF COALESCE(
    current_setting('request.jwt.claims', true)::JSON -> 'app_metadata' ->> 'role',
    ''
  ) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT
      qp.id,
      qp.title,
      qp.play_count AS plays,
      ROUND(COALESCE(AVG(qs.score), 0)::NUMERIC, 1) AS avg_score,
      ROUND(
        COALESCE(
          COUNT(*) FILTER (WHERE qs.status = 'completed')::NUMERIC /
          NULLIF(COUNT(*), 0) * 100,
          0
        ), 1
      ) AS completion_rate
    FROM quiz_packs qp
    LEFT JOIN quiz_sessions qs ON qs.quiz_pack_id = qp.id
    WHERE qp.status = 'active'
    GROUP BY qp.id, qp.title, qp.play_count
    ORDER BY qp.play_count DESC
  ) AS row_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;

-- get_hardest_questions: lowest accuracy questions (admin-only)
CREATE OR REPLACE FUNCTION get_hardest_questions(result_limit INT DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  IF COALESCE(
    current_setting('request.jwt.claims', true)::JSON -> 'app_metadata' ->> 'role',
    ''
  ) != 'admin' THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT json_agg(row_data) INTO result
  FROM (
    SELECT
      qm.id,
      LEFT(qm.question_text, 100) AS question_text,
      qm.category,
      COUNT(*) AS total_attempts,
      ROUND(
        COUNT(*) FILTER (WHERE qa.is_correct = true)::NUMERIC /
        NULLIF(COUNT(*), 0) * 100, 1
      ) AS accuracy_pct
    FROM question_attempts qa
    JOIN questions_master qm ON qm.id = qa.question_id
    WHERE qa.is_correct IS NOT NULL
    GROUP BY qm.id, qm.question_text, qm.category
    HAVING COUNT(*) >= 3
    ORDER BY accuracy_pct ASC
    LIMIT result_limit
  ) AS row_data;

  RETURN COALESCE(result, '[]'::JSON);
END;
$$;
