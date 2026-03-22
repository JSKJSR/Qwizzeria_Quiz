-- ============================================================
-- Migration 029: Pack Expiration
--
-- Adds an optional expires_at timestamp to quiz_packs.
-- After expiration, packs are hidden from non-admin users
-- via updated RLS policies. NULL = never expires.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Add expires_at column (nullable, defaults to NULL = no expiration)
ALTER TABLE quiz_packs ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Partial index for efficient expiration queries
CREATE INDEX IF NOT EXISTS idx_quiz_packs_expires_at
  ON quiz_packs (expires_at) WHERE expires_at IS NOT NULL;

-- ————————————————————————————————
-- 3. Update RLS policies to include expiration check
-- ————————————————————————————————

-- 3a. quiz_packs: public SELECT (from migration 015)
DROP POLICY IF EXISTS "packs_select_public" ON quiz_packs;
CREATE POLICY "packs_select_public"
  ON quiz_packs FOR SELECT
  USING (
    status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  );

-- 3b. pack_questions: public SELECT (from migration 006)
DROP POLICY IF EXISTS "pack_questions_select_public" ON pack_questions;
CREATE POLICY "pack_questions_select_public"
  ON pack_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_packs
      WHERE quiz_packs.id = pack_questions.pack_id
        AND quiz_packs.is_public = true
        AND quiz_packs.status = 'active'
        AND (quiz_packs.expires_at IS NULL OR quiz_packs.expires_at > now())
    )
  );

-- 3c. questions_master: SELECT via active pack (from migration 019)
DROP POLICY IF EXISTS "questions_select_via_active_pack" ON questions_master;
CREATE POLICY "questions_select_via_active_pack"
  ON questions_master FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM pack_questions pq
      JOIN quiz_packs qp ON qp.id = pq.pack_id
      WHERE pq.question_id = questions_master.id
        AND qp.status = 'active'
        AND (qp.expires_at IS NULL OR qp.expires_at > now())
    )
  );

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
