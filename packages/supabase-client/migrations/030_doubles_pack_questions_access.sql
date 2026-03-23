-- Migration 030: Allow authenticated users to read pack_questions for doubles-enabled packs
--
-- Problem: pack_questions_select_public requires is_public=true, but doubles packs
-- often have is_public=false. This blocks trial/pro users from fetching questions.
--
-- Solution: Add a policy that allows any authenticated user to read pack_questions
-- when the parent pack is active, non-expired, and has doubles enabled in config.

CREATE POLICY "pack_questions_select_doubles"
  ON pack_questions FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM quiz_packs
      WHERE quiz_packs.id = pack_questions.pack_id
        AND quiz_packs.status = 'active'
        AND (quiz_packs.expires_at IS NULL OR quiz_packs.expires_at > now())
        AND (quiz_packs.config->>'doubles_enabled')::boolean = true
    )
  );
