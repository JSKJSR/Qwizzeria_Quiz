-- ============================================================
-- Migration 012: Fix quiz pack RBAC visibility
--
-- Implements the following access matrix for quiz_packs:
--
--   Role          Premium  Host  Public
--   superadmin    Yes      Yes   Yes
--   admin         Yes      Yes   Yes
--   editor        Yes      Yes   Yes
--   premium       Yes      No    Yes
--   user          No       No    Yes
--
-- Previously, the public SELECT policy lumped all non-admin
-- users together. Now we have granular policies per role tier.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Drop existing SELECT policies
DROP POLICY IF EXISTS "packs_select_public" ON quiz_packs;
DROP POLICY IF EXISTS "packs_select_admin" ON quiz_packs;
DROP POLICY IF EXISTS "packs_select_editor" ON quiz_packs;

-- 2. Everyone can see public, active, non-host, non-premium packs
CREATE POLICY "packs_select_public"
  ON quiz_packs FOR SELECT
  USING (
    is_public = true
    AND status = 'active'
    AND is_host = false
    AND is_premium = false
  );

-- 3. Premium+ users can also see premium packs (active, non-host)
CREATE POLICY "packs_select_premium"
  ON quiz_packs FOR SELECT
  USING (
    is_premium = true
    AND status = 'active'
    AND is_host = false
    AND public.get_role() IN ('premium', 'editor', 'admin', 'superadmin')
  );

-- 4. Editor+ users can also see host packs (active)
CREATE POLICY "packs_select_host"
  ON quiz_packs FOR SELECT
  USING (
    is_host = true
    AND status = 'active'
    AND public.get_role() IN ('editor', 'admin', 'superadmin')
  );

-- 5. Admin/superadmin see ALL packs (including draft, archived, etc.)
CREATE POLICY "packs_select_admin"
  ON quiz_packs FOR SELECT
  USING (public.is_admin());

-- 6. Reload schema cache
NOTIFY pgrst, 'reload schema';
