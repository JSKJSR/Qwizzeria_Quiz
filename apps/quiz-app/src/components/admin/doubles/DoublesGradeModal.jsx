import { useState, useEffect } from 'react';
import { fetchQuestionsByIds, gradeAllDoublesResponses } from '@qwizzeria/supabase-client';

export default function DoublesGradeModal({ session, onClose, onGraded }) {
  const [questions, setQuestions] = useState([]);
  const [grades, setGrades] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const responses = session?.metadata?.responses || {};
  const questionIds = Object.keys(responses);

  useEffect(() => {
    // Initialize grades from existing metadata
    setGrades(session?.metadata?.grades || {});

    const ids = Object.keys(session?.metadata?.responses || {});
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    fetchQuestionsByIds(ids)
      .then(setQuestions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const questionMap = {};
  for (const q of questions) {
    questionMap[q.id] = q;
  }

  const toggleGrade = (qId) => {
    setGrades((prev) => {
      const current = prev[qId];
      if (current === true) return { ...prev, [qId]: false };
      if (current === false) {
        const next = { ...prev };
        delete next[qId];
        return next;
      }
      return { ...prev, [qId]: true };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await gradeAllDoublesResponses(session.id, grades);
      onGraded?.(session.id, grades);
      onClose();
    } catch (err) {
      console.error('Failed to save grades:', err);
    } finally {
      setSaving(false);
    }
  };

  const gradedCount = Object.keys(grades).length;
  const correctCount = Object.values(grades).filter(Boolean).length;

  return (
    <div className="confirm-overlay" onClick={onClose}>
      <div
        className="confirm-dialog"
        style={{ maxWidth: 700, maxHeight: '80vh', overflow: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3>Grade Doubles Responses</h3>
        <p>
          {session.user_profiles?.display_name || 'Unknown User'} &middot;{' '}
          {session.quiz_packs?.title || 'Unknown Pack'} &middot;{' '}
          Part {session.metadata?.part || '?'} &middot;{' '}
          {session.metadata?.player_name || ''}
        </p>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading questions...</p>
        ) : (
          <>
            <table className="data-table" style={{ fontSize: 'var(--font-size-xs)' }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Question</th>
                  <th>Correct Answer</th>
                  <th>Response</th>
                  <th style={{ textAlign: 'center' }}>Grade</th>
                </tr>
              </thead>
              <tbody>
                {questionIds.map((qId, i) => {
                  const q = questionMap[qId];
                  const grade = grades[qId];
                  return (
                    <tr key={qId}>
                      <td>{i + 1}</td>
                      <td style={{ maxWidth: 180, wordBreak: 'break-word' }}>{q?.question_text || '—'}</td>
                      <td style={{ maxWidth: 120, wordBreak: 'break-word' }}>{q?.answer_text || '—'}</td>
                      <td style={{ maxWidth: 120, wordBreak: 'break-word' }}>{responses[qId] || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className={`btn btn-sm ${grade === true ? 'btn-primary' : grade === false ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => toggleGrade(qId)}
                          style={{ minWidth: 36 }}
                        >
                          {grade === true ? '✓' : grade === false ? '✗' : '—'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)', margin: '1rem 0 0.5rem' }}>
              {gradedCount}/{questionIds.length} graded &middot; {correctCount} correct
            </p>
          </>
        )}

        <div className="confirm-dialog__actions">
          <button className="btn btn-secondary btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Grades'}
          </button>
        </div>
      </div>
    </div>
  );
}
