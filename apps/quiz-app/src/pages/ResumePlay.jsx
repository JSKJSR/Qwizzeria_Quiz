import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchResumableSession, fetchPackPlayQuestions } from '@qwizzeria/supabase-client';
import PackPlayJeopardy from '../components/PackPlayJeopardy';
import PackPlaySequential from '../components/PackPlaySequential';
import FreeQuiz from '../components/FreeQuiz';
import '../styles/HostQuiz.css';

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
      <div className="resume-play__center">
        <div className="resume-play__spinner" />
        <p>Resuming quiz...</p>
      </div>
    );
  }

  if (error || !resumeData) {
    return (
      <div className="resume-play__center">
        <h2>Cannot Resume</h2>
        <p className="resume-play__error-msg">{error || 'Session not found or already completed.'}</p>
        <button className="resume-play__btn" onClick={() => navigate('/profile')}>
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
