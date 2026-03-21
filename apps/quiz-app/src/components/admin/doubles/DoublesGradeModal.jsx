import { useState, useEffect, useCallback, useMemo } from 'react';
import { gradeAllDoublesResponses } from '@qwizzeria/supabase-client';
import useQuestionsById from '@/hooks/useQuestionsById';

export default function DoublesGradeModal({ session, onClose, onGraded }) {
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const responses = useMemo(() => session?.metadata?.responses || {}, [session]);
  const questionIds = useMemo(() => Object.keys(responses), [responses]);

  const { questionMap, loading } = useQuestionsById(questionIds);

  // Initialize grades from existing metadata when session changes
  useEffect(() => {
    setGrades(session?.metadata?.grades || {});
  }, [session]);

  const toggleGrade = useCallback((qId) => {
    setGrades((prev) => {
      const current = prev[qId];
      // Cycle: ungraded → correct → wrong → ungraded
      if (current === true) return { ...prev, [qId]: false };
      if (current === false) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: true };
    });
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      await gradeAllDoublesResponses(session.id, grades);
      onGraded?.(session.id, grades);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, [session.id, grades, onGraded, onClose]);

  const gradedCount = Object.keys(grades).length;
  const correctCount = Object.values(grades).filter(Boolean).length;

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div
        className="confirm-dialog doubles-grade-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Grade Doubles Responses</h3>
        <p className="doubles-grade-modal__subtitle">
          {session.user_profiles?.display_name || 'Unknown User'} &middot;{' '}
          {session.quiz_packs?.title || 'Unknown Pack'} &middot;{' '}
          Part {session.metadata?.part || '?'}
          {session.metadata?.player_name && <> &middot; {session.metadata.player_name}</>}
        </p>

        {error && <div className="alert alert--error">{error}</div>}

        {loading ? (
          <p className="doubles-grade-modal__loading">Loading questions...</p>
        ) : (
          <>
            <div className="doubles-grade-modal__table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Question</th>
                    <th>Correct Answer</th>
                    <th>Response</th>
                    <th className="doubles-grade-modal__col-grade">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {questionIds.map((qId, i) => {
                    const q = questionMap[qId];
                    const grade = grades[qId];
                    return (
                      <tr key={qId}>
                        <td>{i + 1}</td>
                        <td className="doubles-grade-modal__cell-text">{q?.question_text || '—'}</td>
                        <td className="doubles-grade-modal__cell-text">{q?.answer_text || '—'}</td>
                        <td className="doubles-grade-modal__cell-text">{responses[qId] || '—'}</td>
                        <td className="doubles-grade-modal__col-grade">
                          <button
                            className={`btn btn-sm ${grade === true ? 'btn-primary' : grade === false ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={() => toggleGrade(qId)}
                            aria-label={`Grade question ${i + 1}: ${grade === true ? 'correct' : grade === false ? 'wrong' : 'ungraded'}`}
                          >
                            {grade === true ? '✓' : grade === false ? '✗' : '—'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <p className="doubles-grade-modal__summary">
              {gradedCount}/{questionIds.length} graded &middot; {correctCount} correct
            </p>
          </>
        )}

        <div className="confirm-dialog__actions">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </div>
    </div>
  );
}
