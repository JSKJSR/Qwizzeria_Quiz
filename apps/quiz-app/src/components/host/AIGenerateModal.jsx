import { useState, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { generateQuiz, saveGeneratedPack } from '@qwizzeria/supabase-client/src/aiGenerate.js';
import '../../styles/AIGenerate.css';

const DIFFICULTIES = ['easy', 'medium', 'hard'];

/**
 * AIGenerateModal — Modal for generating quiz questions with AI.
 *
 * States: input → generating → preview → error
 * Props: onClose(), onConfirm(pack, questions)
 */
export default function AIGenerateModal({ onClose, onConfirm }) {
  const { user, isPremium } = useAuth();

  // Input state
  const [topic, setTopic] = useState('');
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState('medium');

  // Modal state: 'input' | 'generating' | 'preview' | 'error'
  const [phase, setPhase] = useState('input');
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!topic.trim()) return;
    setPhase('generating');
    setError(null);

    try {
      const result = await generateQuiz({ topic: topic.trim(), questionCount, difficulty });
      setQuestions(result);
      setPhase('preview');
    } catch (err) {
      setError({ message: err.message, detail: err.detail });
      setPhase('error');
    }
  }, [topic, questionCount, difficulty]);

  const handleEditQuestion = useCallback((index, field, value) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }, []);

  const handleDeleteQuestion = useCallback((index) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleUseWithoutSaving = useCallback(() => {
    // Build ephemeral pack and questions in the shape HostQuiz expects
    const ephemeralPack = {
      id: `ai-${Date.now()}`,
      title: `AI: ${topic}`,
      category: questions[0]?.category || 'AI Generated',
      question_count: questions.length,
    };

    const formattedQuestions = questions.map((q, i) => ({
      id: `ai-q-${Date.now()}-${i}`,
      question_text: q.question_text,
      answer_text: q.answer_text,
      answer_explanation: q.answer_explanation || '',
      category: q.category || 'General',
      display_title: null,
      media_url: null,
      points: q.points || 10,
      sort_order: i + 1,
    }));

    onConfirm(ephemeralPack, formattedQuestions);
  }, [topic, questions, onConfirm]);

  const handleSaveAndUse = useCallback(async () => {
    if (saving) return;
    setSaving(true);

    try {
      const { pack, questions: savedQuestions } = await saveGeneratedPack({
        title: `AI: ${topic}`,
        questions,
        userId: user?.id,
      });
      onConfirm(pack, savedQuestions);
    } catch (err) {
      setError({ message: err.message });
      setPhase('error');
    } finally {
      setSaving(false);
    }
  }, [saving, topic, questions, user, onConfirm]);

  const handleRetry = useCallback(() => {
    setPhase('input');
    setError(null);
  }, []);

  // Non-Pro users see upgrade prompt
  if (!isPremium) {
    return (
      <div className="ai-modal-overlay" onClick={onClose}>
        <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
          <div className="ai-modal__header">
            <h2 className="ai-modal__title">Generate with AI</h2>
            <button className="ai-modal__close" onClick={onClose}>&times;</button>
          </div>
          <div className="ai-modal__body">
            <div className="ai-pro-gate">
              <div className="ai-pro-gate__icon">&#9889;</div>
              <h3 className="ai-pro-gate__title">Pro Feature</h3>
              <p className="ai-pro-gate__text">
                AI quiz generation is available for Pro subscribers.
                Upgrade to create unlimited quizzes on any topic in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-modal-overlay" onClick={onClose}>
      <div className="ai-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal__header">
          <h2 className="ai-modal__title">Generate with AI</h2>
          <button className="ai-modal__close" onClick={onClose}>&times;</button>
        </div>
        <div className="ai-modal__body">

          {/* Input Phase */}
          {phase === 'input' && (
            <div>
              <div className="ai-form__field">
                <label className="ai-form__label" htmlFor="ai-topic">Topic</label>
                <input
                  id="ai-topic"
                  className="ai-form__input"
                  type="text"
                  placeholder="e.g. Ancient Rome, Space Exploration, 90s Movies..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value.slice(0, 200))}
                  maxLength={200}
                  autoFocus
                />
                <div className="ai-form__char-count">{topic.length}/200</div>
              </div>

              <div className="ai-form__field">
                <label className="ai-form__label" htmlFor="ai-count">
                  Number of Questions
                </label>
                <div className="ai-form__slider-row">
                  <input
                    id="ai-count"
                    className="ai-form__slider"
                    type="range"
                    min={5}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                  />
                  <span className="ai-form__slider-value">{questionCount}</span>
                </div>
              </div>

              <div className="ai-form__field">
                <label className="ai-form__label">Difficulty</label>
                <div className="ai-form__radio-group">
                  {DIFFICULTIES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      className={`ai-form__radio-btn ${difficulty === d ? 'ai-form__radio-btn--active' : ''}`}
                      onClick={() => setDifficulty(d)}
                    >
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                className="ai-form__generate-btn"
                onClick={handleGenerate}
                disabled={!topic.trim()}
              >
                Generate Quiz
              </button>
            </div>
          )}

          {/* Generating Phase */}
          {phase === 'generating' && (
            <div className="ai-generating">
              <div className="ai-generating__spinner" />
              <p className="ai-generating__text">
                Generating your quiz on <span className="ai-generating__topic">{topic}</span>...
              </p>
            </div>
          )}

          {/* Preview Phase */}
          {phase === 'preview' && (
            <div>
              <p className="ai-preview__info">
                {questions.length} questions generated. Click any text to edit.
              </p>
              <table className="ai-preview__table">
                <thead>
                  <tr>
                    <th style={{ width: '4%' }}>#</th>
                    <th style={{ width: '40%' }}>Question</th>
                    <th style={{ width: '25%' }}>Answer</th>
                    <th style={{ width: '15%' }}>Category</th>
                    <th style={{ width: '8%' }}>Pts</th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>
                        <div
                          className="ai-preview__editable"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleEditQuestion(i, 'question_text', e.target.textContent)}
                        >
                          {q.question_text}
                        </div>
                      </td>
                      <td>
                        <div
                          className="ai-preview__editable"
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) => handleEditQuestion(i, 'answer_text', e.target.textContent)}
                        >
                          {q.answer_text}
                        </div>
                      </td>
                      <td>{q.category}</td>
                      <td>{q.points}</td>
                      <td>
                        <button
                          className="ai-preview__delete-btn"
                          onClick={() => handleDeleteQuestion(i)}
                          title="Remove question"
                          disabled={questions.length <= 1}
                        >
                          &times;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ai-preview__actions">
                <button
                  className="ai-preview__btn ai-preview__btn--secondary"
                  onClick={handleUseWithoutSaving}
                >
                  Use Without Saving
                </button>
                <button
                  className="ai-preview__btn ai-preview__btn--primary"
                  onClick={handleSaveAndUse}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save & Use'}
                </button>
              </div>
            </div>
          )}

          {/* Error Phase */}
          {phase === 'error' && (
            <div className="ai-error">
              <p className="ai-error__message">{error?.message || 'Something went wrong'}</p>
              {error?.detail && (
                <p className="ai-error__detail">{error.detail}</p>
              )}
              <button className="ai-error__retry-btn" onClick={handleRetry}>
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
