export const ACTIONS = {
  SELECT_PACK: 'SELECT_PACK',
  SET_PLAYER: 'SET_PLAYER',
  ACCEPT_RULES: 'ACCEPT_RULES',
  UPDATE_RESPONSE: 'UPDATE_RESPONSE',
  SUBMIT_PART: 'SUBMIT_PART',
  TIMER_EXPIRED: 'TIMER_EXPIRED',
  START_PART2: 'START_PART2',
  SUBMIT_PART2: 'SUBMIT_PART2',
  TIMER_EXPIRED_PART2: 'TIMER_EXPIRED_PART2',
  GO_TO_BREAK: 'GO_TO_BREAK',
  FINISH_QUIZ: 'FINISH_QUIZ',
  RESTORE_SESSION: 'RESTORE_SESSION',
  SET_SESSION_ID: 'SET_SESSION_ID',
  RESET: 'RESET',
};

export const initialState = {
  phase: 'select',
  pack: null,
  playerName: '',
  passiveParticipant: null,
  part1Questions: [],
  part2Questions: [],
  responses: {},
  part1Locked: false,
  part2Locked: false,
  timerMinutes: 60,
  timerStartedAt: null,
  part1SessionId: null,
  part2SessionId: null,
};

/**
 * Split questions into two parts at the given split index.
 */
function splitQuestions(questions, splitIndex) {
  const idx = Math.min(splitIndex, questions.length);
  return {
    part1: questions.slice(0, idx),
    part2: questions.slice(idx),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SELECT_PACK: {
      const { pack, questions, config } = action.payload;
      const splitIndex = config?.doubles_split_index || Math.ceil(questions.length / 2);
      const timerMinutes = config?.doubles_timer_minutes || 60;
      const { part1, part2 } = splitQuestions(questions, splitIndex);

      return {
        ...initialState,
        phase: 'playerSetup',
        pack,
        part1Questions: part1,
        part2Questions: part2,
        timerMinutes,
      };
    }

    case ACTIONS.SET_PLAYER: {
      const payload = action.payload;
      const playerName = typeof payload === 'string' ? payload.trim() : payload.playerName.trim();
      const passiveParticipant = typeof payload === 'string' ? null : (payload.passiveParticipant || null);
      return {
        ...state,
        phase: 'rules',
        playerName,
        passiveParticipant,
      };
    }

    case ACTIONS.ACCEPT_RULES:
      return {
        ...state,
        phase: 'part1',
        timerStartedAt: new Date().toISOString(),
      };

    case ACTIONS.UPDATE_RESPONSE:
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: action.payload.text,
        },
      };

    case ACTIONS.SUBMIT_PART:
    case ACTIONS.TIMER_EXPIRED:
      return {
        ...state,
        phase: 'part1Review',
        part1Locked: true,
      };

    case ACTIONS.GO_TO_BREAK:
      return {
        ...state,
        phase: 'break',
      };

    case ACTIONS.START_PART2:
      return {
        ...state,
        phase: 'part2',
        timerStartedAt: new Date().toISOString(),
      };

    case ACTIONS.SUBMIT_PART2:
    case ACTIONS.TIMER_EXPIRED_PART2:
      return {
        ...state,
        phase: 'part2Review',
        part2Locked: true,
      };

    case ACTIONS.FINISH_QUIZ:
      return {
        ...state,
        phase: 'results',
      };

    case ACTIONS.SET_SESSION_ID: {
      const key = action.payload.part === 1 ? 'part1SessionId' : 'part2SessionId';
      return {
        ...state,
        [key]: action.payload.sessionId,
      };
    }

    case ACTIONS.RESTORE_SESSION:
      return {
        ...action.payload,
      };

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}
