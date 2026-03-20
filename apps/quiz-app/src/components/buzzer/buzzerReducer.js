export const INITIAL_STATE = {
  joined: false,
  phase: 'loading',
  errorInfo: null,
  buzzResult: null,
  connectionStatus: 'connecting',
  myResponses: {},
  currentQuestionId: null,
  currentQuestionText: '',
  inputText: '',
  inputLocked: false,
  viewingQuestionId: null,
  questionHistory: [],
  savedFlash: false,
  timerLeft: null,
  scoreOverlay: null,
  retryCount: 0,
};

export const ACTIONS = {
  SET_JOINED: 'SET_JOINED',
  SET_PHASE: 'SET_PHASE',
  SET_ERROR_INFO: 'SET_ERROR_INFO',
  SET_BUZZ_RESULT: 'SET_BUZZ_RESULT',
  SET_CONNECTION_STATUS: 'SET_CONNECTION_STATUS',
  SET_TIMER_LEFT: 'SET_TIMER_LEFT',
  SET_SCORE_OVERLAY: 'SET_SCORE_OVERLAY',
  SET_INPUT_TEXT: 'SET_INPUT_TEXT',
  SET_INPUT_LOCKED: 'SET_INPUT_LOCKED',
  SET_VIEWING_QUESTION_ID: 'SET_VIEWING_QUESTION_ID',
  SET_SAVED_FLASH: 'SET_SAVED_FLASH',
  INCREMENT_RETRY_COUNT: 'INCREMENT_RETRY_COUNT',
  ADD_QUESTION_HISTORY: 'ADD_QUESTION_HISTORY',
  OPEN_QUESTION: 'OPEN_QUESTION',
  OPEN_INPUT: 'OPEN_INPUT',
  RESET_BUZZE: 'RESET_BUZZE',
  RESET_INPUT: 'RESET_INPUT',
  SET_MY_RESPONSES: 'SET_MY_RESPONSES',
  ROOM_CLOSED: 'ROOM_CLOSED',
};

export function buzzerReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_JOINED:
      return { ...state, joined: action.payload };
    case ACTIONS.SET_PHASE:
      return { ...state, phase: action.payload };
    case ACTIONS.SET_ERROR_INFO:
      return { ...state, errorInfo: action.payload };
    case ACTIONS.SET_BUZZ_RESULT:
      return { ...state, buzzResult: action.payload };
    case ACTIONS.SET_CONNECTION_STATUS:
      return { ...state, connectionStatus: action.payload };
    case ACTIONS.SET_TIMER_LEFT:
      return { ...state, timerLeft: action.payload };
    case ACTIONS.SET_SCORE_OVERLAY:
      return { ...state, scoreOverlay: action.payload };
    case ACTIONS.SET_INPUT_TEXT:
      return { ...state, inputText: action.payload };
    case ACTIONS.SET_INPUT_LOCKED:
      return { ...state, inputLocked: action.payload };
    case ACTIONS.SET_SAVED_FLASH:
      return { ...state, savedFlash: action.payload };
    case ACTIONS.SET_VIEWING_QUESTION_ID:
      return { ...state, viewingQuestionId: action.payload };
    case ACTIONS.INCREMENT_RETRY_COUNT:
      return { ...state, retryCount: state.retryCount + 1 };
    
    case ACTIONS.ADD_QUESTION_HISTORY: {
      const { id, text } = action.payload;
      if (state.questionHistory.some((q) => q.id === id)) return state;
      return { ...state, questionHistory: [...state.questionHistory, { id, text }] };
    }

    case ACTIONS.OPEN_QUESTION:
      return {
        ...state,
        buzzResult: null,
        phase: action.payload.phase,
      };

    case ACTIONS.OPEN_INPUT: {
      const newHistory = state.questionHistory.some((q) => q.id === action.payload.questionId)
        ? state.questionHistory
        : [...state.questionHistory, { id: action.payload.questionId, text: action.payload.questionText || '' }];
      return {
        ...state,
        currentQuestionId: action.payload.questionId,
        currentQuestionText: action.payload.questionText,
        viewingQuestionId: action.payload.questionId,
        inputLocked: false,
        questionHistory: newHistory,
        phase: action.payload.phase,
      };
    }

    case ACTIONS.RESET_BUZZE:
      return {
        ...state,
        buzzResult: null,
        phase: 'waiting',
      };

    case ACTIONS.RESET_INPUT:
      return {
        ...state,
        myResponses: {},
        currentQuestionId: null,
        currentQuestionText: '',
        inputText: '',
        inputLocked: false,
        viewingQuestionId: null,
        questionHistory: [],
        timerLeft: null,
        phase: 'waiting',
      };

    case ACTIONS.SET_MY_RESPONSES:
      return {
        ...state,
        myResponses: { ...state.myResponses, ...action.payload },
      };

    case ACTIONS.ROOM_CLOSED:
      return {
        ...state,
        connectionStatus: 'disconnected',
        phase: 'closed',
      };

    default:
      return state;
  }
}
