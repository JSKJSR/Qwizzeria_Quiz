import { detectMediaType } from '@/utils/mediaDetector';

export const SECONDS_PER_QUESTION = 15;

export const QUESTION_COUNTS = [
  { label: '9', categories: 3, perCategory: 3 },
  { label: '18', categories: 6, perCategory: 3 },
  { label: '27', categories: 9, perCategory: 3 },
];

export const ACTIONS = {
  LOAD_SUCCESS: 'LOAD_SUCCESS',
  LOAD_ERROR: 'LOAD_ERROR',
  SELECT_QUESTION: 'SELECT_QUESTION',
  BACK_TO_GRID: 'BACK_TO_GRID',
  REVEAL_ANSWER: 'REVEAL_ANSWER',
  ANSWER_AND_NEXT: 'ANSWER_AND_NEXT',
  RESET: 'RESET',
};

export const initialState = {
  phase: 'loading', // loading | grid | question | answer | results | error
  topics: [],
  allQuestions: [],
  currentQuestion: null,
  completedQuestionIds: [],
  results: [], // { questionId, isCorrect, skipped, points }
  score: 0,
  streak: 0,
  bestStreak: 0,
  error: null,
};

export function enrichWithMedia(q) {
  const rawMediaUrl = q.media_url || q.mediaUrl;
  const media = rawMediaUrl ? detectMediaType(rawMediaUrl) : { type: 'none', embedUrl: null };
  return { ...q, mediaType: media.type, embedUrl: media.embedUrl };
}

function applyAnswer(state, { isCorrect, skipped }) {
  const q = state.currentQuestion;
  const earnedPoints = isCorrect ? q.points : 0;
  const newStreak = isCorrect ? state.streak + 1 : 0;
  return {
    completedQuestionIds: [...state.completedQuestionIds, q.id],
    results: [...state.results, { questionId: q.id, isCorrect, skipped, points: earnedPoints }],
    score: state.score + earnedPoints,
    streak: newStreak,
    bestStreak: Math.max(state.bestStreak, newStreak),
  };
}

export function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.LOAD_SUCCESS:
      return {
        ...initialState,
        phase: 'grid',
        topics: action.topics,
        allQuestions: action.allQuestions,
      };

    case ACTIONS.LOAD_ERROR:
      return { ...initialState, phase: 'error', error: action.error };

    case ACTIONS.SELECT_QUESTION:
      return { ...state, phase: 'question', currentQuestion: action.question };

    case ACTIONS.BACK_TO_GRID:
      return { ...state, phase: 'grid', currentQuestion: null };

    case ACTIONS.REVEAL_ANSWER:
      return { ...state, phase: 'answer' };

    case ACTIONS.ANSWER_AND_NEXT: {
      const { nextQuestion } = action;
      const answered = applyAnswer(state, action);
      const allDone = answered.completedQuestionIds.length >= state.allQuestions.length;
      return {
        ...state,
        ...answered,
        phase: allDone ? 'results' : 'question',
        currentQuestion: allDone ? null : nextQuestion,
      };
    }

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}
