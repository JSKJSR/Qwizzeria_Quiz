import { useMemo } from 'react';
import useQuestionsById from '@/hooks/useQuestionsById';

export default function DoublesHistoryDetail({ metadata }) {
  const responses = useMemo(() => metadata?.responses || {}, [metadata]);
  const grades = metadata?.grades || {};
  const questionIds = useMemo(() => Object.keys(responses), [responses]);
  const hasGrades = Object.keys(grades).length > 0;

  const { questionMap, loading } = useQuestionsById(questionIds);

  if (loading) {
    return <p className="history__detail-message">Loading details...</p>;
  }

  if (questionIds.length === 0) {
    return <p className="history__detail-message">No responses recorded.</p>;
  }

  const timerMinutes = metadata.timer_duration_seconds
    ? Math.round(metadata.timer_duration_seconds / 60)
    : null;

  return (
    <div>
      <p className="history__doubles-info">
        {metadata.player_name && <>{metadata.player_name} &middot; </>}
        Part {metadata.part}
        {timerMinutes != null && <> &middot; {timerMinutes} min timer</>}
      </p>

      <table className="history__detail-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Question</th>
            <th>Category</th>
            <th>Correct Answer</th>
            <th>Your Response</th>
            {hasGrades && <th>Grade</th>}
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
                <td>{responses[qId] || <span className="history__detail-skipped">No answer</span>}</td>
                {hasGrades && (
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
