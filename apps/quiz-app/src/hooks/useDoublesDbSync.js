import { useRef, useEffect, useCallback } from 'react';
import {
  createQuizSession,
  updateSessionMetadata,
  completeQuizSession,
} from '@qwizzeria/supabase-client';
import { ACTIONS } from '@/components/doubles/doublesReducer';

/**
 * Hook to sync doubles quiz state with the database.
 * Creates sessions on part start, periodically syncs during active parts,
 * and saves final responses on part submit.
 */
export default function useDoublesDbSync(state, dispatch, userId) {
  const dbSyncRef = useRef(null);

  // Periodic DB sync every 30s during active parts
  useEffect(() => {
    const isActive = state.phase === 'part1' || state.phase === 'part2';
    if (!isActive) return;

    dbSyncRef.current = setInterval(() => {
      const sessionId = state.phase === 'part1' ? state.part1SessionId : state.part2SessionId;
      if (sessionId) {
        const partNumber = state.phase === 'part1' ? 1 : 2;
        const timerMinutes = partNumber === 1 ? state.part1TimerMinutes : state.part2TimerMinutes;
        updateSessionMetadata(sessionId, {
          format: 'doubles',
          part: partNumber,
          player_name: state.playerName,
          passive_user_id: state.passiveParticipant?.userId || null,
          passive_player_name: state.passiveParticipant?.displayName || null,
          responses: state.responses,
          timer_started_at: state.timerStartedAt,
          timer_duration_seconds: timerMinutes * 60,
        }).catch(() => {});
      }
    }, 30000);

    return () => clearInterval(dbSyncRef.current);
  }, [state.phase, state.part1SessionId, state.part2SessionId, state.playerName, state.passiveParticipant?.displayName, state.responses, state.timerStartedAt, state.part1TimerMinutes, state.part2TimerMinutes]);

  const createPartSession = useCallback(async (partNumber) => {
    if (!userId) return;

    try {
      const questions = partNumber === 1 ? state.part1Questions : state.part2Questions;
      const session = await createQuizSession({
        userId,
        isFreeQuiz: false,
        totalQuestions: questions.length,
        quizPackId: state.pack.id,
      });

      dispatch({
        type: ACTIONS.SET_SESSION_ID,
        payload: { part: partNumber, sessionId: session.id },
      });

      const timerMinutes = partNumber === 1 ? state.part1TimerMinutes : state.part2TimerMinutes;
      await updateSessionMetadata(session.id, {
        format: 'doubles',
        part: partNumber,
        player_name: state.playerName,
        passive_user_id: null,
        passive_player_name: state.passiveParticipant?.displayName || null,
        responses: {},
        timer_started_at: new Date().toISOString(),
        timer_duration_seconds: timerMinutes * 60,
      });
    } catch {
      // Non-blocking — local state is the source of truth
    }
  }, [userId, state.pack, state.part1Questions, state.part2Questions, state.playerName, state.passiveParticipant, state.part1TimerMinutes, state.part2TimerMinutes, dispatch]);

  const savePartToDb = useCallback(async (partNumber) => {
    const sessionId = partNumber === 1 ? state.part1SessionId : state.part2SessionId;
    if (!sessionId) return;

    try {
      const questions = partNumber === 1 ? state.part1Questions : state.part2Questions;
      const answeredCount = questions.filter(q => state.responses[q.id]?.trim()).length;

      const timerMinutes = partNumber === 1 ? state.part1TimerMinutes : state.part2TimerMinutes;
      await updateSessionMetadata(sessionId, {
        format: 'doubles',
        part: partNumber,
        player_name: state.playerName,
        passive_user_id: null,
        passive_player_name: state.passiveParticipant?.displayName || null,
        responses: state.responses,
        timer_started_at: state.timerStartedAt,
        timer_duration_seconds: timerMinutes * 60,
      });

      await completeQuizSession(sessionId, answeredCount);
    } catch {
      // Non-blocking
    }
  }, [state]);

  return { createPartSession, savePartToDb };
}
