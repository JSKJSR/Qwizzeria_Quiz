-- ============================================================
-- Migration 021: Fix Buzzer Participants RLS Policies
--
-- Problem: After a buzzer reset, some users got:
--   "new row violates row-level security policy (USING expression)
--    for table buzzer_participants"
--
-- Root cause: joinBuzzerRoom() used upsert(), which Supabase
-- executes as INSERT + UPDATE internally. The original schema had
-- no UPDATE policy on buzzer_participants, so the USING expression
-- for the implicit UPDATE check always failed for returning users.
--
-- Fix:
--   1. Add an UPDATE policy so users can refresh their own row
--      (e.g. display_name update on re-join).
--   2. Tighten the INSERT policy to also require the room to be
--      open (waiting or active) — prevents joining closed rooms.
--   3. The app-layer joinBuzzerRoom() is also changed to use
--      INSERT ... ON CONFLICT DO NOTHING instead of upsert, so
--      the UPDATE path is only triggered when truly needed.
--
-- Run this in Supabase SQL Editor after 020_buzzer_rooms.sql.
-- ============================================================

-- 1. Drop & recreate insert policy with room-status guard
DROP POLICY IF EXISTS "buzzer_participants_insert" ON buzzer_participants;
CREATE POLICY "buzzer_participants_insert"
  ON buzzer_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM buzzer_rooms
      WHERE buzzer_rooms.id = buzzer_participants.room_id
        AND buzzer_rooms.status IN ('waiting', 'active')
    )
  );

-- 2. Add UPDATE policy (missing — caused the upsert RLS failure)
--    Users can update their own participant row (e.g. displayName refresh).
DROP POLICY IF EXISTS "buzzer_participants_update_own" ON buzzer_participants;
CREATE POLICY "buzzer_participants_update_own"
  ON buzzer_participants FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM buzzer_rooms
      WHERE buzzer_rooms.id = buzzer_participants.room_id
        AND buzzer_rooms.status IN ('waiting', 'active')
    )
  );

-- 3. Reload schema cache
NOTIFY pgrst, 'reload schema';
