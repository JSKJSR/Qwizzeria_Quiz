import { useState, useEffect } from 'react';
import { fetchQuestionsByIds } from '@qwizzeria/supabase-client';

export default function DoublesHistoryDetail({ metadata }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const responses = metadata?.responses || {};
  const grades = metadata?.grades || {};
  const questionIds = Object.keys(responses);

  useEffect(() => {
    const ids = Object.keys(metadata?.responses || {});
    if (ids.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    fetchQuestionsByIds(ids)
      .then((data) => {
        if (!cancelled) setQuestions(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [metadata]);

  if (loading) {
    return <p style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem' }}>Loading details...</p>;
  }

  if (questionIds.length === 0) {
    return <p style={{ color: '#999', fontSize: '0.85rem', padding: '0.5rem' }}>No responses recorded.</p>;
  }

  // Build a lookup for quick access
  const questionMap = {};
  for (const q of questions) {
    questionMap[q.id] = q;
  }

  const timerMinutes = metadata.timer_duration_seconds
    ? Math.round(metadata.timer_duration_seconds / 60)
    : null;

  return (
    <div>
      <p style={{ color: '#64b5f6', fontSize: '0.85rem', fontWeight: 600, margin: '0.75rem 0 0.25rem' }}>
        {metadata.player_name && <>{metadata.player_name} &middot; </>}
        Part {metadata.part}
        {timerMinutes && <> &middot; {timerMinutes} min timer</>}
      </p>

      <table className="history__detail-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Category</th>
            <th>Correct Answer</th>
            <th>Your Response</th>
            {Object.keys(grades).length > 0 && <th>Grade</th>}
          </tr>
        </thead>
        <tbody>
          {questionIds.map((qId, i) => {
            const q = questionMap[qId];
            const grade = grades[qId];
            return (
              <tr key={qId}>
                <td>{i + 1}</td>
                <td>{q?.question_text || '—'}</td>
                <td>{q?.category || '—'}</td>
                <td>{q?.answer_text || '—'}</td>
                <td>{responses[qId] || <span style={{ color: '#888' }}>No answer</span>}</td>
                {Object.keys(grades).length > 0 && (
                  <td>
                    {grade === true && <span className="history__detail-correct">Correct</span>}
                    {grade === false && <span className="history__detail-wrong">Wrong</span>}
                    {grade == null && <span className="history__detail-skipped">—</span>}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
