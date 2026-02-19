-- ============================================================
-- Migration 006: Role-Based Access Control (RBAC)
-- Two-Gate security model adapted for Qwizzeria
-- Run this in Supabase SQL Editor (or via CLI migration)
-- ============================================================

-- ============================================================
-- A1. Add role column to user_profiles
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'premium', 'editor', 'admin', 'superadmin'));

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles (role);

-- ============================================================
-- A2. Gate 1: Feature Access table
-- ============================================================

CREATE TABLE IF NOT EXISTS feature_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key TEXT NOT NULL
    CHECK (feature_key IN ('free_quiz', 'pack_browse', 'pack_premium', 'host_quiz', 'admin_cms')),
  grantee_type TEXT NOT NULL CHECK (grantee_type IN ('user', 'group')),
  grantee_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(feature_key, grantee_type, grantee_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_access_grantee
  ON feature_access (grantee_type, grantee_id);

ALTER TABLE feature_access ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- A3. Gate 2: Content Permissions table
-- ============================================================

CREATE TABLE IF NOT EXISTS content_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_type TEXT NOT NULL CHECK (resource_type IN ('pack', 'category')),
  resource_id TEXT NOT NULL,            -- pack UUID (as text) or category name
  grantee_type TEXT NOT NULL CHECK (grantee_type IN ('user', 'group')),
  grantee_id UUID NOT NULL,
  access_level TEXT NOT NULL DEFAULT 'read'
    CHECK (access_level IN ('read', 'write', 'manage')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(resource_type, resource_id, grantee_type, grantee_id)
);

CREATE INDEX IF NOT EXISTS idx_content_permissions_grantee
  ON content_permissions (grantee_type, grantee_id);

CREATE INDEX IF NOT EXISTS idx_content_permissions_resource
  ON content_permissions (resource_type, resource_id);

CREATE TRIGGER content_permissions_updated_at
  BEFORE UPDATE ON content_permissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

ALTER TABLE content_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- A4. Helper Functions
-- ============================================================

-- get_role(): returns current user's role from user_profiles
CREATE OR REPLACE FUNCTION public.get_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_role text;
BEGIN
  SELECT role INTO current_role
  FROM public.user_profiles
  WHERE id = auth.uid();

  RETURN COALESCE(current_role, 'user');
END;
$$;

-- is_admin(): true if admin or superadmin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.get_role() IN ('admin', 'superadmin');
END;
$$;

-- is_superadmin(): true if superadmin only
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN public.get_role() = 'superadmin';
END;
$$;

-- has_feature_access(feature_key): Gate 1 check
-- Returns true if user is admin/superadmin (bypass) or has explicit feature grant
CREATE OR REPLACE FUNCTION public.has_feature_access(p_feature TEXT)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p_user_id UUID;
  p_role TEXT;
BEGIN
  p_user_id := auth.uid();
  IF p_user_id IS NULL THEN RETURN false; END IF;

  -- Admin/superadmin bypass all feature checks
  p_role := public.get_role();
  IF p_role IN ('admin', 'superadmin') THEN RETURN true; END IF;

  -- Premium users automatically have pack_premium access
  IF p_feature = 'pack_premium' AND p_role = 'premium' THEN RETURN true; END IF;

  -- Editor+ users automatically have admin_cms access
  IF p_feature = 'admin_cms' AND p_role = 'editor' THEN RETURN true; END IF;

  -- Check explicit user-level grant
  IF EXISTS (
    SELECT 1 FROM public.feature_access
    WHERE feature_key = p_feature
      AND grantee_type = 'user'
      AND grantee_id = p_user_id
  ) THEN RETURN true; END IF;

  RETURN false;
END;
$$;

-- has_content_permission(resource_type, resource_id, required_level):
-- Gate 2 check. Returns true if user has the required access level
CREATE OR REPLACE FUNCTION public.has_content_permission(
  p_resource_type TEXT,
  p_resource_id TEXT,
  p_required_level TEXT DEFAULT 'read'
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  p_user_id UUID;
  p_access TEXT;
BEGIN
  p_user_id := auth.uid();
  IF p_user_id IS NULL THEN RETURN false; END IF;

  -- Admin/superadmin bypass
  IF public.is_admin() THEN RETURN true; END IF;

  -- Check user-level grant
  SELECT access_level INTO p_access
  FROM public.content_permissions
  WHERE resource_type = p_resource_type
    AND resource_id = p_resource_id
    AND grantee_type = 'user'
    AND grantee_id = p_user_id;

  IF p_access IS NULL THEN RETURN false; END IF;

  -- Level hierarchy: manage > write > read
  IF p_required_level = 'read' THEN RETURN true; END IF;
  IF p_required_level = 'write' THEN RETURN p_access IN ('write', 'manage'); END IF;
  IF p_required_level = 'manage' THEN RETURN p_access = 'manage'; END IF;

  RETURN false;
END;
$$;

-- ============================================================
-- A5. Replace existing RLS policies with RBAC-based versions
-- ============================================================

-- ————————————————————————————————
-- questions_master: Drop old, create new
-- ————————————————————————————————

DROP POLICY IF EXISTS "Public questions are readable by everyone" ON questions_master;
DROP POLICY IF EXISTS "Admins can manage all questions" ON questions_master;

-- Anyone can read public+active questions
CREATE POLICY "questions_select_public"
  ON questions_master FOR SELECT
  USING (is_public = true AND status = 'active');

-- Admin/superadmin can read ALL questions
CREATE POLICY "questions_select_admin"
  ON questions_master FOR SELECT
  USING (public.is_admin());

-- Editors can read questions in categories they have content_permission on
CREATE POLICY "questions_select_editor"
  ON questions_master FOR SELECT
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('category', category, 'read')
  );

-- Admin/superadmin can insert/update/delete any question
CREATE POLICY "questions_insert_admin"
  ON questions_master FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "questions_update_admin"
  ON questions_master FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "questions_delete_admin"
  ON questions_master FOR DELETE
  USING (public.is_admin());

-- Editors can insert questions in their granted categories
CREATE POLICY "questions_insert_editor"
  ON questions_master FOR INSERT
  WITH CHECK (
    public.get_role() = 'editor'
    AND public.has_content_permission('category', category, 'write')
  );

-- Editors can update questions in their granted categories
CREATE POLICY "questions_update_editor"
  ON questions_master FOR UPDATE
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('category', category, 'write')
  );

-- ————————————————————————————————
-- quiz_packs: Drop old, create new
-- ————————————————————————————————

DROP POLICY IF EXISTS "Public active packs are readable by everyone" ON quiz_packs;
DROP POLICY IF EXISTS "Admins can read all packs" ON quiz_packs;
DROP POLICY IF EXISTS "Admins can insert packs" ON quiz_packs;
DROP POLICY IF EXISTS "Admins can update packs" ON quiz_packs;
DROP POLICY IF EXISTS "Admins can delete packs" ON quiz_packs;

-- Everyone can see public+active packs
CREATE POLICY "packs_select_public"
  ON quiz_packs FOR SELECT
  USING (is_public = true AND status = 'active');

-- Admin/superadmin can read all packs
CREATE POLICY "packs_select_admin"
  ON quiz_packs FOR SELECT
  USING (public.is_admin());

-- Editors can read packs they have content_permission on
CREATE POLICY "packs_select_editor"
  ON quiz_packs FOR SELECT
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('pack', id::text, 'read')
  );

-- Admin/superadmin full CRUD
CREATE POLICY "packs_insert_admin"
  ON quiz_packs FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "packs_update_admin"
  ON quiz_packs FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "packs_delete_admin"
  ON quiz_packs FOR DELETE
  USING (public.is_admin());

-- Editors can insert packs (they manage what they create)
CREATE POLICY "packs_insert_editor"
  ON quiz_packs FOR INSERT
  WITH CHECK (public.get_role() = 'editor');

-- Editors can update packs they have write permission on
CREATE POLICY "packs_update_editor"
  ON quiz_packs FOR UPDATE
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('pack', id::text, 'write')
  );

-- ————————————————————————————————
-- pack_questions: Drop old, create new
-- ————————————————————————————————

DROP POLICY IF EXISTS "Pack questions readable if pack is public and active" ON pack_questions;
DROP POLICY IF EXISTS "Admins can read all pack questions" ON pack_questions;
DROP POLICY IF EXISTS "Admins can insert pack questions" ON pack_questions;
DROP POLICY IF EXISTS "Admins can update pack questions" ON pack_questions;
DROP POLICY IF EXISTS "Admins can delete pack questions" ON pack_questions;

-- Readable if parent pack is public+active
CREATE POLICY "pack_questions_select_public"
  ON pack_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM quiz_packs
      WHERE quiz_packs.id = pack_questions.pack_id
        AND quiz_packs.is_public = true
        AND quiz_packs.status = 'active'
    )
  );

-- Admin/superadmin access
CREATE POLICY "pack_questions_select_admin"
  ON pack_questions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "pack_questions_insert_admin"
  ON pack_questions FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "pack_questions_update_admin"
  ON pack_questions FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "pack_questions_delete_admin"
  ON pack_questions FOR DELETE
  USING (public.is_admin());

-- Editors can manage pack_questions for packs they have write access to
CREATE POLICY "pack_questions_select_editor"
  ON pack_questions FOR SELECT
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('pack', pack_id::text, 'read')
  );

CREATE POLICY "pack_questions_insert_editor"
  ON pack_questions FOR INSERT
  WITH CHECK (
    public.get_role() = 'editor'
    AND public.has_content_permission('pack', pack_id::text, 'write')
  );

CREATE POLICY "pack_questions_update_editor"
  ON pack_questions FOR UPDATE
  USING (
    public.get_role() = 'editor'
    AND public.has_content_permission('pack', pack_id::text, 'write')
  );

-- ————————————————————————————————
-- user_profiles: Add admin read-all using is_admin()
-- ————————————————————————————————

DROP POLICY IF EXISTS "Admins can read all profiles" ON user_profiles;

-- Admins can read all profiles
CREATE POLICY "profiles_select_admin"
  ON user_profiles FOR SELECT
  USING (public.is_admin());

-- Superadmins can update any profile (role assignment)
CREATE POLICY "profiles_update_superadmin"
  ON user_profiles FOR UPDATE
  USING (public.is_superadmin());

-- ————————————————————————————————
-- feature_access: Only admin/superadmin can manage
-- ————————————————————————————————

CREATE POLICY "feature_access_select_admin"
  ON feature_access FOR SELECT
  USING (public.is_admin());

CREATE POLICY "feature_access_insert_superadmin"
  ON feature_access FOR INSERT
  WITH CHECK (public.is_superadmin());

CREATE POLICY "feature_access_delete_superadmin"
  ON feature_access FOR DELETE
  USING (public.is_superadmin());

-- Users can check their own feature access (needed for frontend gating)
CREATE POLICY "feature_access_select_own"
  ON feature_access FOR SELECT
  USING (grantee_type = 'user' AND grantee_id = auth.uid());

-- ————————————————————————————————
-- content_permissions: Only admin/superadmin can manage
-- ————————————————————————————————

CREATE POLICY "content_permissions_select_admin"
  ON content_permissions FOR SELECT
  USING (public.is_admin());

CREATE POLICY "content_permissions_insert_superadmin"
  ON content_permissions FOR INSERT
  WITH CHECK (public.is_superadmin());

CREATE POLICY "content_permissions_update_superadmin"
  ON content_permissions FOR UPDATE
  USING (public.is_superadmin());

CREATE POLICY "content_permissions_delete_superadmin"
  ON content_permissions FOR DELETE
  USING (public.is_superadmin());

-- Users can check their own content permissions
CREATE POLICY "content_permissions_select_own"
  ON content_permissions FOR SELECT
  USING (grantee_type = 'user' AND grantee_id = auth.uid());

-- ============================================================
-- A6. Update admin-only RPC functions to use is_admin()
-- ============================================================

-- get_admin_analytics: replace JWT check with is_admin()
CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin() THEN
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

-- get_pack_performance: replace JWT check with is_admin()
CREATE OR REPLACE FUNCTION get_pack_performance()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin() THEN
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

-- get_hardest_questions: replace JWT check with is_admin()
CREATE OR REPLACE FUNCTION get_hardest_questions(result_limit INT DEFAULT 10)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
BEGIN
  IF NOT public.is_admin() THEN
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

-- ============================================================
-- A7. Migrate existing is_premium users
-- Sets role = 'premium' for any user whose auth.users.raw_app_meta_data
-- contains is_premium = true, if they currently have the default 'user' role.
-- ============================================================

UPDATE user_profiles
SET role = 'premium'
WHERE role = 'user'
  AND id IN (
    SELECT id FROM auth.users
    WHERE raw_app_meta_data ->> 'is_premium' = 'true'
  );

-- Also migrate existing admins from app_metadata to DB role
UPDATE user_profiles
SET role = 'admin'
WHERE role = 'user'
  AND id IN (
    SELECT id FROM auth.users
    WHERE raw_app_meta_data ->> 'role' = 'admin'
  );

-- ============================================================
-- A8. Seed default feature access for all existing users
-- Give all existing users access to the standard features
-- ============================================================

INSERT INTO feature_access (feature_key, grantee_type, grantee_id)
SELECT 'free_quiz', 'user', id FROM user_profiles
ON CONFLICT DO NOTHING;

INSERT INTO feature_access (feature_key, grantee_type, grantee_id)
SELECT 'pack_browse', 'user', id FROM user_profiles
ON CONFLICT DO NOTHING;

INSERT INTO feature_access (feature_key, grantee_type, grantee_id)
SELECT 'host_quiz', 'user', id FROM user_profiles
ON CONFLICT DO NOTHING;

-- ============================================================
-- A9. Admin RPC: Get all users with emails (for user management UI)
-- ============================================================

CREATE OR REPLACE FUNCTION get_all_users_admin(
  search_query TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL,
  result_limit INT DEFAULT 50,
  result_offset INT DEFAULT 0
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  total_count INT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Get total count for pagination
  SELECT COUNT(*) INTO total_count
  FROM user_profiles up
  JOIN auth.users u ON u.id = up.id
  WHERE (role_filter IS NULL OR up.role = role_filter)
    AND (search_query IS NULL OR (
      up.display_name ILIKE '%' || search_query || '%'
      OR u.email ILIKE '%' || search_query || '%'
    ));

  -- Get paginated results
  SELECT json_build_object(
    'users', COALESCE(json_agg(row_data), '[]'::JSON),
    'total', total_count
  ) INTO result
  FROM (
    SELECT
      up.id,
      up.display_name,
      u.email,
      up.role,
      up.avatar_url,
      up.created_at,
      up.updated_at
    FROM user_profiles up
    JOIN auth.users u ON u.id = up.id
    WHERE (role_filter IS NULL OR up.role = role_filter)
      AND (search_query IS NULL OR (
        up.display_name ILIKE '%' || search_query || '%'
        OR u.email ILIKE '%' || search_query || '%'
      ))
    ORDER BY up.created_at DESC
    LIMIT result_limit
    OFFSET result_offset
  ) AS row_data;

  RETURN result;
END;
$$;
