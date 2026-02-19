-- ============================================================
-- Migration 008: Add "Host" pack category
--
-- Adds is_host boolean to quiz_packs. Host packs are only
-- visible to admin/superadmin users. Regular users cannot
-- see or access them.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Add is_host column
ALTER TABLE quiz_packs
  ADD COLUMN IF NOT EXISTS is_host BOOLEAN NOT NULL DEFAULT false;

-- 2. Update public SELECT policy to exclude host packs
DROP POLICY IF EXISTS "packs_select_public" ON quiz_packs;
CREATE POLICY "packs_select_public"
  ON quiz_packs FOR SELECT
  USING (is_public = true AND status = 'active' AND is_host = false);

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
