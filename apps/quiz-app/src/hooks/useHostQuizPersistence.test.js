import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useHostQuizPersistence } from './useHostQuizPersistence';

// Mock hostSessionPersistence
const mockLoadHostSession = vi.fn();
const mockSaveHostSession = vi.fn();
const mockClearHostSession = vi.fn();
const mockSaveBuzzerState = vi.fn();
const mockClearBuzzerState = vi.fn();

vi.mock('../utils/hostSessionPersistence', () => ({
  loadHostSession: (...args) => mockLoadHostSession(...args),
  saveHostSession: (...args) => mockSaveHostSession(...args),
  clearHostSession: (...args) => mockClearHostSession(...args),
  saveBuzzerState: (...args) => mockSaveBuzzerState(...args),
  clearBuzzerState: (...args) => mockClearBuzzerState(...args),
}));

vi.mock('../components/host/hostQuizReducer', () => ({
  ACTIONS: { RESTORE_SESSION: 'RESTORE_SESSION' },
}));

describe('useHostQuizPersistence', () => {
  const defaultProps = {
    state: { phase: 'packSelect', mode: 'standard', tournamentId: null, pack: null },
    dispatch: vi.fn(),
    navigate: vi.fn(),
    buzzerEnabled: false,
    buzzer: { roomCode: null, roomId: null },
    setBuzzerEnabled: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    // Reset window.confirm
    vi.spyOn(window, 'confirm').mockImplementation(() => false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does nothing when no saved session exists', () => {
    mockLoadHostSession.mockReturnValue(null);
    renderHook(() => useHostQuizPersistence(defaultProps));
    expect(defaultProps.dispatch).not.toHaveBeenCalled();
    expect(defaultProps.navigate).not.toHaveBeenCalled();
  });

  it('restores a saved standard session when user confirms', () => {
    const savedState = { phase: 'grid', mode: 'standard', pack: { id: 1 } };
    mockLoadHostSession.mockReturnValue(savedState);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderHook(() => useHostQuizPersistence(defaultProps));

    expect(defaultProps.dispatch).toHaveBeenCalledWith({
      type: 'RESTORE_SESSION',
      savedState,
    });
  });

  it('clears session when user declines restore', () => {
    const savedState = { phase: 'grid', mode: 'standard' };
    mockLoadHostSession.mockReturnValue(savedState);
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    renderHook(() => useHostQuizPersistence(defaultProps));

    expect(mockClearHostSession).toHaveBeenCalled();
    expect(mockClearBuzzerState).toHaveBeenCalled();
    expect(defaultProps.setBuzzerEnabled).toHaveBeenCalledWith(false);
  });

  it('redirects to tournament bracket page when tournament session exists and user confirms', () => {
    const savedState = { phase: 'bracket', mode: 'tournament', tournamentId: 'abc-123' };
    mockLoadHostSession.mockReturnValue(savedState);
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderHook(() => useHostQuizPersistence(defaultProps));

    expect(mockClearHostSession).toHaveBeenCalled();
    expect(defaultProps.navigate).toHaveBeenCalledWith('/host/tournament/abc-123');
  });

  it('does not restore packSelect phase sessions', () => {
    mockLoadHostSession.mockReturnValue({ phase: 'packSelect', mode: 'standard' });
    renderHook(() => useHostQuizPersistence(defaultProps));
    expect(defaultProps.dispatch).not.toHaveBeenCalled();
  });

  it('persists state after 300ms debounce when in active phase', () => {
    mockLoadHostSession.mockReturnValue(null);
    const state = { phase: 'grid', mode: 'standard', tournamentId: null, pack: null };
    const props = { ...defaultProps, state };

    renderHook(() => useHostQuizPersistence(props));

    expect(mockSaveHostSession).not.toHaveBeenCalled();

    act(() => { vi.advanceTimersByTime(300); });

    expect(mockSaveHostSession).toHaveBeenCalledWith(state);
    expect(mockSaveBuzzerState).toHaveBeenCalled();
  });

  it('does not persist when in packSelect phase', () => {
    mockLoadHostSession.mockReturnValue(null);
    renderHook(() => useHostQuizPersistence(defaultProps));

    act(() => { vi.advanceTimersByTime(500); });

    expect(mockSaveHostSession).not.toHaveBeenCalled();
  });

  it('saves lightweight ref for tournament mode with DB ID', () => {
    mockLoadHostSession.mockReturnValue(null);
    const state = { phase: 'bracket', mode: 'tournament', tournamentId: 'tid-1', pack: { id: 'p1' } };
    const props = { ...defaultProps, state };

    renderHook(() => useHostQuizPersistence(props));
    act(() => { vi.advanceTimersByTime(300); });

    expect(mockSaveHostSession).toHaveBeenCalledWith({
      mode: 'tournament',
      tournamentId: 'tid-1',
      phase: 'bracket',
      pack: { id: 'p1' },
    });
  });
});
