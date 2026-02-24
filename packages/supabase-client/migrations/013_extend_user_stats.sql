-- 013_extend_user_stats.sql
-- Extend get_user_stats RPC to include strongest/weakest categories

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
  strong_cat TEXT;
  weak_cat TEXT;
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

  -- Strongest category: highest accuracy with at least 3 attempts
  SELECT qm.category INTO strong_cat
  FROM question_attempts qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  JOIN questions_master qm ON qm.id = qa.question_id
  WHERE qs.user_id = target_user_id
    AND qs.status = 'completed'
    AND qa.is_correct IS NOT NULL
  GROUP BY qm.category
  HAVING COUNT(*) >= 3
  ORDER BY (COUNT(*) FILTER (WHERE qa.is_correct = true))::NUMERIC / COUNT(*) DESC
  LIMIT 1;

  -- Weakest category: lowest accuracy with at least 3 attempts
  SELECT qm.category INTO weak_cat
  FROM question_attempts qa
  JOIN quiz_sessions qs ON qs.id = qa.session_id
  JOIN questions_master qm ON qm.id = qa.question_id
  WHERE qs.user_id = target_user_id
    AND qs.status = 'completed'
    AND qa.is_correct IS NOT NULL
  GROUP BY qm.category
  HAVING COUNT(*) >= 3
  ORDER BY (COUNT(*) FILTER (WHERE qa.is_correct = true))::NUMERIC / COUNT(*) ASC
  LIMIT 1;

  result := json_build_object(
    'total_quizzes', total_q,
    'total_score', total_s,
    'accuracy_pct', acc,
    'favorite_category', fav_cat,
    'packs_completed', packs_done,
    'strongest_category', strong_cat,
    'weakest_category', weak_cat
  );

  RETURN result;
END;
$$;
