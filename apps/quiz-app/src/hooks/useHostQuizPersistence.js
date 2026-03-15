import { useEffect, useRef } from 'react';
import { saveHostSession, loadHostSession, clearHostSession, saveBuzzerState, clearBuzzerState } from '../utils/hostSessionPersistence';
import { ACTIONS } from '../components/host/hostQuizReducer';

/**
 * Handles session restore on mount and debounced session persistence.
 */
export function useHostQuizPersistence({ state, dispatch, navigate, buzzerEnabled, buzzer, setBuzzerEnabled }) {
  const saveTimerRef = useRef(null);
  const restoredRef = useRef(false);

  // Attempt session restore on mount
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;

    const saved = loadHostSession();
    if (saved && saved.phase !== 'packSelect' && saved.phase !== 'review' && saved.phase !== 'results' && saved.phase !== 'tournamentResults') {
      // Tournament mode: redirect to bracket page (DB is source of truth)
      if (saved.mode === 'tournament' && saved.tournamentId) {
        const resume = window.confirm('You have an active tournament. Return to the bracket?');
        if (resume) {
          clearHostSession();
          navigate(`/host/tournament/${saved.tournamentId}`);
        } else {
          clearHostSession();
          clearBuzzerState();
        }
        return;
      }
      const resume = window.confirm('You have an unfinished host quiz session. Resume where you left off?');
      if (resume) {
        dispatch({ type: ACTIONS.RESTORE_SESSION, savedState: saved });
        // Buzzer state already restored via lazy useState initializers
      } else {
        clearHostSession();
        clearBuzzerState();
        setBuzzerEnabled(false);
      }
    }
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced session persistence
  useEffect(() => {
    if (state.phase === 'packSelect' || state.phase === 'review' || state.phase === 'results' || state.phase === 'tournamentResults') return;

    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      if (state.mode === 'tournament' && state.tournamentId) {
        // Tournament mode: save only lightweight ref — DB is source of truth
        saveHostSession({
          mode: 'tournament',
          tournamentId: state.tournamentId,
          phase: state.phase,
          pack: state.pack,
        });
      } else {
        saveHostSession(state);
      }
      // Persist buzzer state alongside quiz state
      saveBuzzerState({
        buzzerEnabled,
        roomCode: buzzer.roomCode,
        roomId: buzzer.roomId,
      });
    }, 300);

    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [state, buzzerEnabled, buzzer.roomCode, buzzer.roomId]);
}
