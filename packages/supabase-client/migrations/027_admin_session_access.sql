-- Migration 027: Admin read/update access to quiz_sessions
-- Required for admin Doubles Sessions page (grading)
-- Run in Supabase SQL Editor

-- Admin can read all quiz_sessions (not just their own)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quiz_sessions'
      AND policyname = 'admin_read_all_sessions'
  ) THEN
    CREATE POLICY "admin_read_all_sessions"
      ON quiz_sessions FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- Admin can update quiz_sessions (for grading metadata)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'quiz_sessions'
      AND policyname = 'admin_update_all_sessions'
  ) THEN
    CREATE POLICY "admin_update_all_sessions"
      ON quiz_sessions FOR UPDATE
      USING (is_admin());
  END IF;
END $$;
