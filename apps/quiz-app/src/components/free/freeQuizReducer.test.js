import { describe, it, expect, vi } from 'vitest';
import { reducer, initialState, ACTIONS, enrichWithMedia, QUESTION_COUNTS, SECONDS_PER_QUESTION } from './freeQuizReducer';

vi.mock('../../utils/mediaDetector', () => ({
  detectMediaType: (url) => {
    if (url?.includes('youtube')) return { type: 'video', embedUrl: url };
    return { type: 'image', embedUrl: url };
  },
}));

describe('freeQuizReducer', () => {
  describe('constants', () => {
    it('exports SECONDS_PER_QUESTION', () => {
      expect(SECONDS_PER_QUESTION).toBe(15);
    });

    it('exports QUESTION_COUNTS with three options', () => {
      expect(QUESTION_COUNTS).toHaveLength(3);
      expect(QUESTION_COUNTS.map(q => q.label)).toEqual(['9', '18', '27']);
    });
  });

  describe('enrichWithMedia', () => {
    it('sets mediaType to none when no media_url', () => {
      const result = enrichWithMedia({ id: 1, question_text: 'Q1' });
      expect(result.mediaType).toBe('none');
      expect(result.embedUrl).toBeNull();
    });

    it('detects image media from media_url', () => {
      const result = enrichWithMedia({ id: 1, media_url: 'https://example.com/img.png' });
      expect(result.mediaType).toBe('image');
      expect(result.embedUrl).toBe('https://example.com/img.png');
    });

    it('detects video media from mediaUrl (camelCase)', () => {
      const result = enrichWithMedia({ id: 1, mediaUrl: 'https://youtube.com/watch?v=123' });
      expect(result.mediaType).toBe('video');
    });
  });

  describe('initialState', () => {
    it('starts in loading phase with empty data', () => {
      expect(initialState.phase).toBe('loading');
      expect(initialState.topics).toEqual([]);
      expect(initialState.allQuestions).toEqual([]);
      expect(initialState.score).toBe(0);
      expect(initialState.streak).toBe(0);
      expect(initialState.bestStreak).toBe(0);
      expect(initialState.sessionXP).toBe(0);
    });
  });

  describe('LOAD_SUCCESS', () => {
    it('transitions to grid phase with topics and questions', () => {
      const topics = [{ name: 'Science', questions: [] }];
      const allQuestions = [{ id: 1 }, { id: 2 }];
      const state = reducer(initialState, { type: ACTIONS.LOAD_SUCCESS, topics, allQuestions });
      expect(state.phase).toBe('grid');
      expect(state.topics).toBe(topics);
      expect(state.allQuestions).toBe(allQuestions);
      expect(state.score).toBe(0);
    });
  });

  describe('LOAD_ERROR', () => {
    it('transitions to error phase with message', () => {
      const state = reducer(initialState, { type: ACTIONS.LOAD_ERROR, error: 'Network failed' });
      expect(state.phase).toBe('error');
      expect(state.error).toBe('Network failed');
    });
  });

  describe('SELECT_QUESTION', () => {
    it('transitions to question phase with selected question', () => {
      const gridState = { ...initialState, phase: 'grid', allQuestions: [{ id: 1 }] };
      const question = { id: 1, points: 10 };
      const state = reducer(gridState, { type: ACTIONS.SELECT_QUESTION, question });
      expect(state.phase).toBe('question');
      expect(state.currentQuestion).toBe(question);
    });
  });

  describe('BACK_TO_GRID', () => {
    it('returns to grid and clears current question and feedback', () => {
      const questionState = { ...initialState, phase: 'question', currentQuestion: { id: 1 }, userAnswer: 'test', isCorrect: true, questionXP: 5 };
      const state = reducer(questionState, { type: ACTIONS.BACK_TO_GRID });
      expect(state.phase).toBe('grid');
      expect(state.currentQuestion).toBeNull();
      expect(state.userAnswer).toBe('');
      expect(state.isCorrect).toBe(false);
      expect(state.questionXP).toBe(0);
    });
  });

  describe('SUBMIT_ANSWER', () => {
    const baseState = {
      ...initialState,
      phase: 'question',
      allQuestions: [{ id: 1, points: 10 }, { id: 2, points: 20 }],
      currentQuestion: { id: 1, points: 10 },
      completedQuestionIds: [],
      results: [],
      score: 0,
      streak: 2,
      bestStreak: 2,
      sessionXP: 0,
    };

    it('transitions to feedback with correct answer', () => {
      const state = reducer(baseState, {
        type: ACTIONS.SUBMIT_ANSWER,
        userAnswer: 'correct answer',
        isCorrect: true,
        xpEarned: 15,
      });
      expect(state.phase).toBe('feedback');
      expect(state.userAnswer).toBe('correct answer');
      expect(state.isCorrect).toBe(true);
      expect(state.questionXP).toBe(15);
      expect(state.sessionXP).toBe(15);
      expect(state.score).toBe(10);
      expect(state.streak).toBe(3);
      expect(state.bestStreak).toBe(3);
      expect(state.completedQuestionIds).toContain(1);
      expect(state.results).toHaveLength(1);
      expect(state.results[0]).toEqual({
        questionId: 1, isCorrect: true, skipped: false, points: 10, userAnswer: 'correct answer', xpEarned: 15,
      });
    });

    it('resets streak on wrong answer', () => {
      const state = reducer(baseState, {
        type: ACTIONS.SUBMIT_ANSWER,
        userAnswer: 'wrong',
        isCorrect: false,
        xpEarned: 0,
      });
      expect(state.score).toBe(0);
      expect(state.streak).toBe(0);
      expect(state.bestStreak).toBe(2); // preserved from before
    });
  });

  describe('CONTINUE', () => {
    const feedbackState = {
      ...initialState,
      phase: 'feedback',
      allQuestions: [{ id: 1 }, { id: 2 }],
      completedQuestionIds: [1],
      currentQuestion: { id: 1 },
      userAnswer: 'test',
      isCorrect: true,
      questionXP: 10,
    };

    it('goes to next question when more remain', () => {
      const next = { id: 2, points: 20 };
      const state = reducer(feedbackState, { type: ACTIONS.CONTINUE, nextQuestion: next });
      expect(state.phase).toBe('question');
      expect(state.currentQuestion).toBe(next);
      expect(state.userAnswer).toBe('');
      expect(state.isCorrect).toBe(false);
      expect(state.questionXP).toBe(0);
    });

    it('goes to results when all questions completed', () => {
      const allDoneState = { ...feedbackState, completedQuestionIds: [1, 2] };
      const state = reducer(allDoneState, { type: ACTIONS.CONTINUE, nextQuestion: null });
      expect(state.phase).toBe('results');
      expect(state.currentQuestion).toBeNull();
    });
  });

  describe('OVERRIDE_CORRECT', () => {
    it('updates last result to correct and adds points', () => {
      const feedbackState = {
        ...initialState,
        phase: 'feedback',
        currentQuestion: { id: 1, points: 10 },
        results: [{ questionId: 1, isCorrect: false, skipped: false, points: 0, userAnswer: 'wrong', xpEarned: 0 }],
        score: 0,
        streak: 0,
        bestStreak: 0,
        sessionXP: 0,
        isCorrect: false,
      };
      const state = reducer(feedbackState, { type: ACTIONS.OVERRIDE_CORRECT, xpEarned: 12 });
      expect(state.isCorrect).toBe(true);
      expect(state.questionXP).toBe(12);
      expect(state.sessionXP).toBe(12);
      expect(state.score).toBe(10);
      expect(state.streak).toBe(1);
      expect(state.bestStreak).toBe(1);
      expect(state.results[0].isCorrect).toBe(true);
      expect(state.results[0].points).toBe(10);
      expect(state.results[0].xpEarned).toBe(12);
    });
  });

  describe('RESET', () => {
    it('resets to initial state', () => {
      const midGameState = { ...initialState, phase: 'grid', score: 50, streak: 3 };
      const state = reducer(midGameState, { type: ACTIONS.RESET });
      expect(state).toEqual(initialState);
    });
  });

  describe('unknown action', () => {
    it('returns state unchanged', () => {
      const state = reducer(initialState, { type: 'UNKNOWN_ACTION' });
      expect(state).toBe(initialState);
    });
  });
});
