import { getSupabase } from './index.js';

// ============================================================
// Buzzer Room CRUD
// ============================================================

/**
 * Create a new buzzer room.
 * @param {string} hostUserId - Host's auth user ID
 * @param {'host_quiz'|'tournament_match'} sessionType
 * @param {string} [sessionRef] - Optional FK to quiz session or tournament
 * @returns {Promise<{id: string, room_code: string, status: string}>}
 */
export async function createBuzzerRoom(hostUserId, sessionType, sessionRef = null) {
  const supabase = getSupabase();

  // Close any stale rooms first (non-blocking)
  supabase.rpc('close_stale_buzzer_rooms').then(() => { }, () => { });

  const { data, error } = await supabase
    .from('buzzer_rooms')
    .insert({
      host_user_id: hostUserId,
      session_type: sessionType,
      session_ref: sessionRef,
    })
    .select('id, room_code, status')
    .single();

  if (error) {
    throw new Error(`Failed to create buzzer room: ${error.message}`);
  }

  return data;
}

/**
 * Get a buzzer room by room code.
 * @param {string} roomCode - 6-char room code
 * @returns {Promise<object>} Room with participants
 */
export async function getBuzzerRoom(roomCode) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('buzzer_rooms')
    .select('id, room_code, host_user_id, session_type, session_ref, status, created_at, buzzer_participants(id, user_id, display_name, joined_at)')
    .eq('room_code', roomCode.toUpperCase())
    .in('status', ['waiting', 'active'])
    .single();

  if (error) {
    throw new Error(`Room not found or closed: ${error.message}`);
  }

  return data;
}

/**
 * Join a buzzer room as a participant.
 *
 * Uses INSERT ... ON CONFLICT DO NOTHING instead of upsert to avoid
 * triggering an implicit UPDATE path, which would fail the RLS USING
 * expression when no UPDATE policy was defined (the root cause of:
 * "new row violates row-level security policy for table buzzer_participants").
 *
 * If the user already has a participant row (returning after reset),
 * we fetch their existing record instead of re-inserting.
 *
 * @param {string} roomId - Room UUID
 * @param {string} userId - Participant's auth user ID
 * @param {string} displayName - Participant's display name
 * @returns {Promise<object>} Participant record
 */
export async function joinBuzzerRoom(roomId, userId, displayName) {
  const supabase = getSupabase();

  // Step 1: Attempt a clean INSERT. If the row already exists (duplicate
  // room_id+user_id), Supabase returns null data with no error when using
  // ignoreDuplicates:true — we handle that in Step 2.
  const { data: inserted, error: insertError } = await supabase
    .from('buzzer_participants')
    .insert({ room_id: roomId, user_id: userId, display_name: displayName })
    .select()
    .single();

  // Row inserted successfully — done.
  if (!insertError && inserted) {
    return inserted;
  }

  // If the error is a duplicate key violation (code 23505), the participant
  // already exists — fetch and return their existing record.
  if (insertError?.code === '23505') {
    const { data: existing, error: fetchError } = await supabase
      .from('buzzer_participants')
      .select()
      .eq('room_id', roomId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to re-join room: ${fetchError.message}`);
    }
    return existing;
  }

  // Any other error (e.g. RLS, room closed, network) — surface a clear message.
  if (insertError) {
    // Provide a friendlier message for common RLS / room-state errors
    const isRlsError =
      insertError.message?.includes('row-level security') ||
      insertError.code === '42501';
    if (isRlsError) {
      throw new Error(
        'The room is no longer accepting new participants. Please ask the host to check the room status.'
      );
    }
    throw new Error(`Failed to join room: ${insertError.message}`);
  }

  throw new Error('Failed to join room: unknown error.');
}

/**
 * Leave a buzzer room.
 * @param {string} roomId - Room UUID
 * @param {string} userId - Participant's auth user ID
 */
export async function leaveBuzzerRoom(roomId, userId) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('buzzer_participants')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to leave room: ${error.message}`);
  }
}

/**
 * Update room status (host only).
 * @param {string} roomId - Room UUID
 * @param {'waiting'|'active'|'closed'} status
 */
export async function updateBuzzerRoomStatus(roomId, status) {
  const supabase = getSupabase();

  const { error } = await supabase
    .from('buzzer_rooms')
    .update({ status })
    .eq('id', roomId);

  if (error) {
    throw new Error(`Failed to update room status: ${error.message}`);
  }
}

/**
 * Close a buzzer room (host only).
 * @param {string} roomId - Room UUID
 */
export async function closeBuzzerRoom(roomId) {
  return updateBuzzerRoomStatus(roomId, 'closed');
}

/**
 * Fetch participants in a room.
 * @param {string} roomId - Room UUID
 * @returns {Promise<Array>} List of participants
 */
export async function getBuzzerParticipants(roomId) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('buzzer_participants')
    .select('id, user_id, display_name, joined_at')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch participants: ${error.message}`);
  }

  return data || [];
}

// ============================================================
// Supabase Broadcast Channel (low-latency buzzer events)
// ============================================================

/**
 * Broadcast event types:
 *
 * Host → Participants:
 *   'question_open'  { questionId, allowedUserIds, hostTimestamp }
 *   'buzz_result'    { winnerId, winnerName, buzzes: [{userId, displayName, offset}] }
 *   'buzz_lock'      {}
 *   'buzz_reset'     {}
 *   'input_open'     { questionId, questionText, allowedUserIds, hostTimestamp }
 *   'input_lock'     {}
 *   'input_reset'    {}
 *   'room_closed'    {}
 *
 * Participant → Host:
 *   'buzz'           { userId, displayName, buzzOffset }
 *   'response'       { userId, displayName, text, questionId }
 *
 * System:
 *   'participant_joined'  { userId, displayName }
 *   'participant_left'    { userId }
 */

/**
 * Subscribe to a buzzer Broadcast channel.
 * @param {string} roomCode - 6-char room code (used as channel name)
 * @param {object} handlers - Event handler callbacks
 * @param {function} [handlers.onQuestionOpen] - ({ questionId, allowedUserIds, hostTimestamp }) => void
 * @param {function} [handlers.onBuzz] - ({ userId, displayName, buzzOffset }) => void
 * @param {function} [handlers.onBuzzResult] - ({ winnerId, winnerName, buzzes }) => void
 * @param {function} [handlers.onBuzzLock] - () => void
 * @param {function} [handlers.onBuzzReset] - () => void
 * @param {function} [handlers.onInputOpen] - ({ questionId, questionText, allowedUserIds, hostTimestamp }) => void
 * @param {function} [handlers.onResponse] - ({ userId, displayName, text, questionId }) => void
 * @param {function} [handlers.onInputLock] - () => void
 * @param {function} [handlers.onInputReset] - () => void
 * @param {function} [handlers.onRoomClosed] - () => void
 * @param {function} [handlers.onParticipantJoined] - ({ userId, displayName }) => void
 * @param {function} [handlers.onParticipantLeft] - ({ userId }) => void
 * @param {function} [handlers.onStatusChange] - (status: 'SUBSCRIBED'|'TIMED_OUT'|'CLOSED'|'CHANNEL_ERROR') => void
 * @returns {object} Supabase Broadcast channel
 */
export function subscribeBuzzerChannel(roomCode, handlers = {}) {
  const supabase = getSupabase();
  const channelName = `buzzer:${roomCode.toUpperCase()}`;

  const channel = supabase.channel(channelName, {
    config: { broadcast: { self: false } },
  });

  if (handlers.onQuestionOpen) {
    channel.on('broadcast', { event: 'question_open' }, (payload) => {
      handlers.onQuestionOpen(payload.payload);
    });
  }

  if (handlers.onBuzz) {
    channel.on('broadcast', { event: 'buzz' }, (payload) => {
      handlers.onBuzz(payload.payload);
    });
  }

  if (handlers.onBuzzResult) {
    channel.on('broadcast', { event: 'buzz_result' }, (payload) => {
      handlers.onBuzzResult(payload.payload);
    });
  }

  if (handlers.onBuzzLock) {
    channel.on('broadcast', { event: 'buzz_lock' }, () => {
      handlers.onBuzzLock();
    });
  }

  if (handlers.onBuzzReset) {
    channel.on('broadcast', { event: 'buzz_reset' }, () => {
      handlers.onBuzzReset();
    });
  }

  if (handlers.onInputOpen) {
    channel.on('broadcast', { event: 'input_open' }, (payload) => {
      handlers.onInputOpen(payload.payload);
    });
  }

  if (handlers.onResponse) {
    channel.on('broadcast', { event: 'response' }, (payload) => {
      handlers.onResponse(payload.payload);
    });
  }

  if (handlers.onInputLock) {
    channel.on('broadcast', { event: 'input_lock' }, () => {
      handlers.onInputLock();
    });
  }

  if (handlers.onInputReset) {
    channel.on('broadcast', { event: 'input_reset' }, () => {
      handlers.onInputReset();
    });
  }

  if (handlers.onTimerSync) {
    channel.on('broadcast', { event: 'timer_sync' }, (payload) => {
      handlers.onTimerSync(payload.payload);
    });
  }

  if (handlers.onScorePublish) {
    channel.on('broadcast', { event: 'score_publish' }, (payload) => {
      handlers.onScorePublish(payload.payload);
    });
  }

  if (handlers.onRoomClosed) {
    channel.on('broadcast', { event: 'room_closed' }, () => {
      handlers.onRoomClosed();
    });
  }

  if (handlers.onParticipantJoined) {
    channel.on('broadcast', { event: 'participant_joined' }, (payload) => {
      handlers.onParticipantJoined(payload.payload);
    });
  }

  if (handlers.onParticipantLeft) {
    channel.on('broadcast', { event: 'participant_left' }, (payload) => {
      handlers.onParticipantLeft(payload.payload);
    });
  }

  channel.subscribe((status) => {
    if (handlers.onStatusChange) {
      handlers.onStatusChange(status);
    }
  });

  return channel;
}

/**
 * Send a broadcast event on a buzzer channel.
 * @param {object} channel - Supabase Broadcast channel
 * @param {string} event - Event name (e.g. 'buzz', 'question_open')
 * @param {object} payload - Event data
 */
export function sendBuzzerEvent(channel, event, payload = {}) {
  channel.send({
    type: 'broadcast',
    event,
    payload,
  });
}

/**
 * Unsubscribe from a buzzer channel.
 * @param {object} channel - Channel returned by subscribeBuzzerChannel
 */
export function unsubscribeBuzzer(channel) {
  if (channel) {
    const supabase = getSupabase();
    supabase.removeChannel(channel);
  }
}
