import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the supabase client
const mockInvoke = vi.fn();
const mockInsert = vi.fn();
const mockSelect = vi.fn();
const mockSingle = vi.fn();
const mockEq = vi.fn();

const mockSupabase = {
  functions: { invoke: mockInvoke },
  from: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect,
  })),
};

// Chain helpers
mockInsert.mockReturnValue({ select: mockSelect });
mockSelect.mockReturnValue({ single: mockSingle });

vi.mock('./index.js', () => ({
  getSupabase: () => mockSupabase,
}));

describe('aiGenerate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset chain defaults
    mockInsert.mockReturnValue({ select: mockSelect });
    mockSelect.mockReturnValue({ single: mockSingle });
  });

  describe('generateQuiz', () => {
    it('calls supabase.functions.invoke with correct params', async () => {
      mockInvoke.mockResolvedValue({
        data: {
          questions: [
            { question_text: 'Q1', answer_text: 'A1', answer_explanation: 'E1', category: 'Cat', points: 10 },
          ],
        },
        error: null,
      });

      const { generateQuiz } = await import('./aiGenerate.js');
      const result = await generateQuiz({ topic: 'Space', questionCount: 5, difficulty: 'hard' });

      expect(mockInvoke).toHaveBeenCalledWith('generate-quiz', {
        body: { topic: 'Space', questionCount: 5, difficulty: 'hard' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].question_text).toBe('Q1');
    });

    it('throws on invoke error', async () => {
      mockInvoke.mockResolvedValue({
        data: null,
        error: { message: 'Function error' },
      });

      const { generateQuiz } = await import('./aiGenerate.js');
      await expect(generateQuiz({ topic: 'Space' })).rejects.toThrow('Function error');
    });

    it('throws on data-level error (rate limit)', async () => {
      mockInvoke.mockResolvedValue({
        data: { error: 'Rate limit exceeded', detail: 'Max 5 per hour' },
        error: null,
      });

      const { generateQuiz } = await import('./aiGenerate.js');
      await expect(generateQuiz({ topic: 'Space' })).rejects.toThrow('Rate limit exceeded');
    });

    it('throws on invalid response shape', async () => {
      mockInvoke.mockResolvedValue({
        data: { something: 'else' },
        error: null,
      });

      const { generateQuiz } = await import('./aiGenerate.js');
      await expect(generateQuiz({ topic: 'Space' })).rejects.toThrow('Invalid response');
    });
  });

  describe('saveGeneratedPack', () => {
    it('creates questions, pack, and junction rows', async () => {
      const questions = [
        { question_text: 'Q1', answer_text: 'A1', answer_explanation: 'E1', category: 'Cat1', points: 10 },
        { question_text: 'Q2', answer_text: 'A2', answer_explanation: 'E2', category: 'Cat2', points: 20 },
      ];

      // First call: insert questions → select → returns inserted questions
      const insertedQuestions = questions.map((q, i) => ({
        id: `qid-${i}`,
        ...q,
        display_title: null,
        media_url: null,
      }));

      // Track call order
      let callCount = 0;
      mockSupabase.from.mockImplementation((table) => {
        callCount++;
        if (table === 'questions_master') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                data: insertedQuestions,
                error: null,
              })),
            })),
          };
        }
        if (table === 'quiz_packs') {
          return {
            insert: vi.fn(() => ({
              select: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: { id: 'pack-1', title: 'AI: Test' },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'pack_questions') {
          return {
            insert: vi.fn(() => ({ error: null })),
          };
        }
        return { insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(() => ({ data: null, error: null })) })) })) };
      });

      const { saveGeneratedPack } = await import('./aiGenerate.js');
      const result = await saveGeneratedPack({
        title: 'AI: Test',
        questions,
        userId: 'user-1',
      });

      expect(result.pack.id).toBe('pack-1');
      expect(result.questions).toHaveLength(2);
      expect(result.questions[0].sort_order).toBe(1);
      expect(result.questions[1].sort_order).toBe(2);

      // Verify all three tables were called
      const calledTables = mockSupabase.from.mock.calls.map(c => c[0]);
      expect(calledTables).toContain('questions_master');
      expect(calledTables).toContain('quiz_packs');
      expect(calledTables).toContain('pack_questions');
    });

    it('throws when question insert fails', async () => {
      mockSupabase.from.mockImplementation(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            data: null,
            error: { message: 'Insert failed' },
          })),
        })),
      }));

      const { saveGeneratedPack } = await import('./aiGenerate.js');
      await expect(
        saveGeneratedPack({ title: 'Test', questions: [{ question_text: 'Q' }], userId: 'u1' })
      ).rejects.toThrow('Failed to save questions');
    });
  });
});
