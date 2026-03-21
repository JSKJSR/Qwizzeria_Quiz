import { useState, useEffect, useMemo } from 'react';
import { fetchQuestionsByIds } from '@qwizzeria/supabase-client';

/**
 * Fetches questions by IDs and provides a lookup map.
 * Shared by DoublesHistoryDetail and DoublesGradeModal.
 */
export default function useQuestionsById(questionIds) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (questionIds.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchQuestionsByIds(questionIds)
      .then((data) => {
        if (!cancelled) setQuestions(data);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
    // questionIds is memoized by callers via useMemo, so this is stable
  }, [questionIds]);

  const questionMap = useMemo(() => {
    const map = {};
    for (const q of questions) {
      map[q.id] = q;
    }
    return map;
  }, [questions]);

  return { questions, questionMap, loading };
}
