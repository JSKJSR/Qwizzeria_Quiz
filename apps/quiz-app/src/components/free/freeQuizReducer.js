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
  SUBMIT_ANSWER: 'SUBMIT_ANSWER',
  CONTINUE: 'CONTINUE',
  OVERRIDE_CORRECT: 'OVERRIDE_CORRECT',
  RESET: 'RESET',
};

export const initialState = {
  phase: 'loading', // loading | grid | question | feedback | results | error
  topics: [],
  allQuestions: [],
  currentQuestion: null,
  completedQuestionIds: [],
  results: [], // { questionId, isCorrect, skipped, points, userAnswer, xpEarned }
  score: 0,
  streak: 0,
  bestStreak: 0,
  error: null,
  // Gamification fields
  userAnswer: '',
  isCorrect: false,
  questionXP: 0,
  sessionXP: 0,
};

export function enrichWithMedia(q) {
  const rawMediaUrl = q.media_url || q.mediaUrl;
  const media = rawMediaUrl ? detectMediaType(rawMediaUrl) : { type: 'none', embedUrl: null };
  return { ...q, mediaType: media.type, embedUrl: media.embedUrl };
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
      return { ...state, phase: 'grid', currentQuestion: null, userAnswer: '', isCorrect: false, questionXP: 0 };

    case ACTIONS.SUBMIT_ANSWER: {
      const { userAnswer, isCorrect, xpEarned } = action;
      const q = state.currentQuestion;
      const earnedPoints = isCorrect ? q.points : 0;
      const newStreak = isCorrect ? state.streak + 1 : 0;
      return {
        ...state,
        phase: 'feedback',
        userAnswer,
        isCorrect,
        questionXP: xpEarned,
        sessionXP: state.sessionXP + xpEarned,
        completedQuestionIds: [...state.completedQuestionIds, q.id],
        results: [...state.results, { questionId: q.id, isCorrect, skipped: false, points: earnedPoints, userAnswer, xpEarned }],
        score: state.score + earnedPoints,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
      };
    }

    case ACTIONS.CONTINUE: {
      const { nextQuestion } = action;
      const allDone = state.completedQuestionIds.length >= state.allQuestions.length;
      return {
        ...state,
        phase: allDone ? 'results' : 'question',
        currentQuestion: allDone ? null : nextQuestion,
        userAnswer: '',
        isCorrect: false,
        questionXP: 0,
      };
    }

    case ACTIONS.OVERRIDE_CORRECT: {
      const q = state.currentQuestion;
      const overrideXP = action.xpEarned || 0;
      const newStreak = state.streak + 1;
      // Update the last result entry
      const updatedResults = state.results.map((r, i) =>
        i === state.results.length - 1
          ? { ...r, isCorrect: true, points: q.points, xpEarned: overrideXP }
          : r
      );
      return {
        ...state,
        isCorrect: true,
        questionXP: overrideXP,
        sessionXP: state.sessionXP + overrideXP,
        results: updatedResults,
        score: state.score + q.points,
        streak: newStreak,
        bestStreak: Math.max(state.bestStreak, newStreak),
      };
    }

    case ACTIONS.RESET:
      return { ...initialState };

    default:
      return state;
  }
}
