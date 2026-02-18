import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserHistory } from '@qwizzeria/supabase-client/src/users.js';
import '../styles/DashboardHome.css';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumable, setResumable] = useState([]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    fetchUserHistory({ userId: user.id, status: 'in_progress', pageSize: 5 })
      .then(({ data }) => {
        if (!cancelled) setResumable(data || []);
      })
      .catch(() => {});

    return () => { cancelled = true; };
  }, [user]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Quizzer';

  return (
    <div className="dash-home">
      <div className="dash-home__welcome">
        <h1 className="dash-home__greeting">Welcome, {displayName}</h1>
        <p className="dash-home__subtitle">Ready for your next quiz challenge?</p>
      </div>

      <div className="dash-home__actions">
        <Link to="/play/free" className="dash-home__action-card">
          <span className="dash-home__action-icon">&#9654;</span>
          <span className="dash-home__action-title">Play Free Quiz</span>
          <span className="dash-home__action-desc">Quick 3x3 Jeopardy grid with random questions</span>
        </Link>
        <Link to="/host" className="dash-home__action-card">
          <span className="dash-home__action-icon">&#127918;</span>
          <span className="dash-home__action-title">Host a Quiz</span>
          <span className="dash-home__action-desc">Multiplayer mode with timer and live scoreboard</span>
        </Link>
        <Link to="/packs" className="dash-home__action-card">
          <span className="dash-home__action-icon">&#11088;</span>
          <span className="dash-home__action-title">Browse Packs</span>
          <span className="dash-home__action-desc">Curated quiz packs by category and difficulty</span>
        </Link>
      </div>

      {resumable.length > 0 && (
        <div>
          <h2 className="dash-home__section-title">Resume Incomplete Quizzes</h2>
          <div className="dash-home__resume-list">
            {resumable.map((session) => (
              <div key={session.id} className="dash-home__resume-card">
                <div className="dash-home__resume-info">
                  <div className="dash-home__resume-pack">
                    {session.is_free_quiz ? 'Free Quiz' : session.quiz_packs?.title || 'Quiz Pack'}
                  </div>
                  <div className="dash-home__resume-meta">
                    Score: {session.score || 0} / {session.total_questions * 10} &middot;{' '}
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="dash-home__resume-btn"
                  onClick={() => navigate(`/play/resume/${session.id}`)}
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
