import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchResumableSession } from '@qwizzeria/supabase-client/src/questions.js';
import { fetchPackPlayQuestions } from '@qwizzeria/supabase-client/src/packs.js';
import PackPlayJeopardy from '../components/PackPlayJeopardy';
import PackPlaySequential from '../components/PackPlaySequential';
import FreeQuiz from '../components/FreeQuiz';

export default function ResumePlay() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumeData, setResumeData] = useState(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate('/'); return; }

    let cancelled = false;

    async function load() {
      try {
        const { session, answeredQuestionIds, attempts } = await fetchResumableSession(sessionId);

        // Verify ownership
        if (session.user_id !== user.id) {
          throw new Error('This session does not belong to you.');
        }

        const format = session.metadata?.format || 'sequential';

        if (session.is_free_quiz) {
          // Free quiz resume — pass metadata to FreeQuiz
          if (!cancelled) {
            setResumeData({
              type: 'free',
              session,
              answeredQuestionIds,
              attempts,
              existingScore: session.score || 0,
              questionIds: session.metadata?.question_ids || [],
            });
          }
        } else if (session.quiz_pack_id) {
          // Pack quiz resume — fetch pack questions
          const questions = await fetchPackPlayQuestions(session.quiz_pack_id);
          const pack = session.quiz_packs || { id: session.quiz_pack_id, title: 'Quiz Pack' };

          if (!cancelled) {
            setResumeData({
              type: 'pack',
              format,
              session,
              pack,
              questions,
              answeredQuestionIds,
              attempts,
              existingScore: session.score || 0,
            });
          }
        } else {
          throw new Error('Unknown session type.');
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [sessionId, user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 40, height: 40, border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#be1332', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p>Resuming quiz...</p>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div style={{ minHeight: '100vh', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', padding: '2rem' }}>
        <h2>Cannot Resume</h2>
        <p style={{ color: '#999' }}>{error || 'Session not found or already completed.'}</p>
        <button
          onClick={() => navigate('/profile')}
          style={{ padding: '0.6rem 1.25rem', background: '#be1332', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Back to Profile
        </button>
      </div>
    );
  }

  // Free quiz resume
  if (resumeData.type === 'free') {
    return (
      <FreeQuiz
        resumeData={{
          sessionId: resumeData.session.id,
          answeredQuestionIds: resumeData.answeredQuestionIds,
          existingScore: resumeData.existingScore,
          questionIds: resumeData.questionIds,
        }}
      />
    );
  }

  // Pack quiz resume
  const rd = {
    sessionId: resumeData.session.id,
    answeredQuestionIds: resumeData.answeredQuestionIds,
    existingScore: resumeData.existingScore,
  };

  if (resumeData.format === 'jeopardy') {
    return (
      <PackPlayJeopardy
        pack={resumeData.pack}
        questions={resumeData.questions}
        user={user}
        resumeData={rd}
      />
    );
  }

  return (
    <PackPlaySequential
      pack={resumeData.pack}
      questions={resumeData.questions}
      user={user}
      resumeData={rd}
    />
  );
}
