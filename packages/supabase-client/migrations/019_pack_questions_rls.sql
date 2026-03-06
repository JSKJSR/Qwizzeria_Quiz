-- Migration 019: Allow questions_master to be read via active pack membership
--
-- Problem: questions_master RLS policy "questions_select_public" requires
-- is_public=true AND status='active'. When questions belong to an active pack
-- but have is_public=false, the Supabase join in fetchPackPlayQuestions returns
-- null for all question fields — resulting in blank question text for non-admin users.
--
-- Fix: Add a new SELECT policy that allows reading any question that belongs
-- to at least one active pack. The pack is the access gate — if the pack is
-- active, its questions should be playable regardless of individual is_public flag.

CREATE POLICY "questions_select_via_active_pack"
  ON questions_master FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM pack_questions pq
      JOIN quiz_packs qp ON qp.id = pq.pack_id
      WHERE pq.question_id = questions_master.id
        AND qp.status = 'active'
    )
  );
