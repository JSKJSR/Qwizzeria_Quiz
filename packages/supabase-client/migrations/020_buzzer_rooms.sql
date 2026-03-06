-- ============================================================
-- Migration 020: Buzzer Rooms
--
-- Adds buzzer_rooms and buzzer_participants tables for
-- real-time buzzer feature in host quiz and tournament modes.
-- Uses Supabase Broadcast (not postgres_changes) for low-latency
-- buzz events — these tables handle room/participant state only.
--
-- Run this in Supabase SQL Editor.
-- ============================================================

-- 1. Room code generation function
CREATE OR REPLACE FUNCTION generate_room_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code TEXT := '';
  i INT;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- 2. Buzzer rooms table
CREATE TABLE IF NOT EXISTS buzzer_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) NOT NULL UNIQUE DEFAULT generate_room_code(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id),
  session_type TEXT NOT NULL CHECK (session_type IN ('host_quiz', 'tournament_match')),
  session_ref UUID,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'active', 'closed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Buzzer participants table
CREATE TABLE IF NOT EXISTS buzzer_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES buzzer_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  display_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_buzzer_rooms_code ON buzzer_rooms(room_code);
CREATE INDEX IF NOT EXISTS idx_buzzer_rooms_host ON buzzer_rooms(host_user_id);
CREATE INDEX IF NOT EXISTS idx_buzzer_rooms_status ON buzzer_rooms(status);
CREATE INDEX IF NOT EXISTS idx_buzzer_participants_room ON buzzer_participants(room_id);
CREATE INDEX IF NOT EXISTS idx_buzzer_participants_user ON buzzer_participants(user_id);

-- 5. Enable RLS
ALTER TABLE buzzer_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE buzzer_participants ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for buzzer_rooms

-- Any authenticated user can read active/waiting rooms (needed to join by code)
DROP POLICY IF EXISTS "buzzer_rooms_select_active" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_select_active"
  ON buzzer_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL AND status IN ('waiting', 'active'));

-- Host can read all their own rooms (including closed, for history)
DROP POLICY IF EXISTS "buzzer_rooms_select_own" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_select_own"
  ON buzzer_rooms FOR SELECT
  USING (host_user_id = auth.uid());

-- Only authenticated users can create rooms
DROP POLICY IF EXISTS "buzzer_rooms_insert" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_insert"
  ON buzzer_rooms FOR INSERT
  WITH CHECK (host_user_id = auth.uid());

-- Host can update their own rooms (change status)
DROP POLICY IF EXISTS "buzzer_rooms_update_own" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_update_own"
  ON buzzer_rooms FOR UPDATE
  USING (host_user_id = auth.uid());

-- Host can delete their own rooms
DROP POLICY IF EXISTS "buzzer_rooms_delete_own" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_delete_own"
  ON buzzer_rooms FOR DELETE
  USING (host_user_id = auth.uid());

-- Admin can manage all rooms
DROP POLICY IF EXISTS "buzzer_rooms_admin" ON buzzer_rooms;
CREATE POLICY "buzzer_rooms_admin"
  ON buzzer_rooms FOR ALL
  USING (is_admin());

-- 7. RLS Policies for buzzer_participants

-- Anyone can see participants in rooms they can see
DROP POLICY IF EXISTS "buzzer_participants_select" ON buzzer_participants;
CREATE POLICY "buzzer_participants_select"
  ON buzzer_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM buzzer_rooms
      WHERE buzzer_rooms.id = buzzer_participants.room_id
        AND (buzzer_rooms.host_user_id = auth.uid() OR buzzer_rooms.status IN ('waiting', 'active'))
    )
    AND auth.uid() IS NOT NULL
  );

-- Authenticated users can join rooms (insert themselves)
DROP POLICY IF EXISTS "buzzer_participants_insert" ON buzzer_participants;
CREATE POLICY "buzzer_participants_insert"
  ON buzzer_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can remove themselves, host can remove anyone in their room
DROP POLICY IF EXISTS "buzzer_participants_delete" ON buzzer_participants;
CREATE POLICY "buzzer_participants_delete"
  ON buzzer_participants FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM buzzer_rooms
      WHERE buzzer_rooms.id = buzzer_participants.room_id
        AND buzzer_rooms.host_user_id = auth.uid()
    )
  );

-- Admin can manage all participants
DROP POLICY IF EXISTS "buzzer_participants_admin" ON buzzer_participants;
CREATE POLICY "buzzer_participants_admin"
  ON buzzer_participants FOR ALL
  USING (is_admin());

-- 8. Updated_at trigger
DROP TRIGGER IF EXISTS trg_buzzer_room_updated ON buzzer_rooms;
CREATE TRIGGER trg_buzzer_room_updated
  BEFORE UPDATE ON buzzer_rooms
  FOR EACH ROW EXECUTE FUNCTION update_tournament_updated_at();

-- 9. Auto-close stale rooms (older than 4 hours)
-- Can be called periodically or on room fetch
CREATE OR REPLACE FUNCTION close_stale_buzzer_rooms()
RETURNS INT AS $$
DECLARE
  closed_count INT;
BEGIN
  UPDATE buzzer_rooms
  SET status = 'closed', updated_at = now()
  WHERE status IN ('waiting', 'active')
    AND created_at < now() - INTERVAL '4 hours';
  GET DIAGNOSTICS closed_count = ROW_COUNT;
  RETURN closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Reload schema cache
NOTIFY pgrst, 'reload schema';
