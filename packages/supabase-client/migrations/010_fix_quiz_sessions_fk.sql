-- Migration 010: Fix missing FK on quiz_sessions.quiz_pack_id
-- Migration 001 created quiz_pack_id without FK.
-- Migration 003 used ADD COLUMN IF NOT EXISTS which was a no-op
-- since the column already existed, so the FK was never added.
-- This causes PostgREST to reject embedded resource queries like
-- quiz_packs(title) with a 400 error.

-- Add FK constraint if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_type = 'FOREIGN KEY'
      AND table_name = 'quiz_sessions'
      AND constraint_name = 'quiz_sessions_quiz_pack_id_fkey'
  ) THEN
    ALTER TABLE quiz_sessions
      ADD CONSTRAINT quiz_sessions_quiz_pack_id_fkey
      FOREIGN KEY (quiz_pack_id) REFERENCES quiz_packs(id) ON DELETE SET NULL;
  END IF;
END;
$$;

-- Force PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
