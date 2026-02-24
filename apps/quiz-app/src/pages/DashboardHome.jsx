import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserHistory } from '@qwizzeria/supabase-client/src/users.js';
import { fetchUserStats } from '@qwizzeria/supabase-client/src/users.js';
import { fetchGlobalLeaderboard } from '@qwizzeria/supabase-client/src/leaderboard.js';
import { abandonQuizSession } from '@qwizzeria/supabase-client/src/questions.js';
import SEO from '../components/SEO';
import '../styles/DashboardHome.css';

const COLLAPSE_KEY = 'qwizzeria_resume_collapsed';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumable, setResumable] = useState([]);
  const [stats, setStats] = useState(null);
  const [weeklyRank, setWeeklyRank] = useState(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });
  const [dismissing, setDismissing] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      fetchUserHistory({ userId: user.id, status: 'in_progress', pageSize: 5 }),
      fetchUserStats(user.id).catch(() => null),
      fetchGlobalLeaderboard('this_week', 50).catch(() => []),
    ]).then(([historyResult, statsResult, leaderboard]) => {
      if (cancelled) return;
      setResumable(historyResult.data || []);
      setStats(statsResult);

      if (Array.isArray(leaderboard)) {
        const idx = leaderboard.findIndex(e => e.user_id === user.id);
        setWeeklyRank(idx >= 0 ? idx + 1 : null);
      }
    }).catch(() => { /* ignore */ });

    return () => { cancelled = true; };
  }, [user]);

  const handleToggleCollapse = useCallback(() => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem(COLLAPSE_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const handleDismiss = useCallback((sessionId) => {
    if (dismissing === sessionId) {
      abandonQuizSession(sessionId)
        .then(() => {
          setResumable(prev => prev.filter(s => s.id !== sessionId));
          setDismissing(null);
        })
        .catch(() => setDismissing(null));
    } else {
      setDismissing(sessionId);
    }
  }, [dismissing]);

  const handleCancelDismiss = useCallback(() => {
    setDismissing(null);
  }, []);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Quizzer';

  return (
    <div className="dash-home">
      <SEO title="Dashboard" path="/dashboard" noIndex />
      <div className="dash-home__welcome">
        <h1 className="dash-home__greeting">Welcome back, {displayName}</h1>
        <p className="dash-home__subtitle">Ready for your next quiz challenge?</p>
      </div>

      <div className="dash-home__actions">
        <Link to="/host" className="dash-home__action-card">
          <span className="dash-home__action-icon">&#127918;</span>
          <span className="dash-home__action-title">Host a Quiz</span>
          <span className="dash-home__action-desc">Multiplayer mode with timer and live scoreboard</span>
        </Link>
        <Link to="/packs" className="dash-home__action-card">
          <span className="dash-home__action-icon">&#11088;</span>
          <span className="dash-home__action-title">Browse Quiz Packs</span>
          <span className="dash-home__action-desc">Curated quiz packs by category and difficulty</span>
        </Link>
      </div>

      {stats && (
        <div className="dash-home__stats-section">
          <h2 className="dash-home__section-title">Your Stats</h2>
          <div className="dash-home__stats-grid">
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon">&#127919;</span>
              <span className="dash-home__stat-value">{stats.accuracy_pct ?? 0}%</span>
              <span className="dash-home__stat-label">Accuracy</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon">&#128170;</span>
              <span className="dash-home__stat-value">{stats.strongest_category || '—'}</span>
              <span className="dash-home__stat-label">Strongest Topic</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon">&#128269;</span>
              <span className="dash-home__stat-value">{stats.weakest_category || '—'}</span>
              <span className="dash-home__stat-label">Needs Work</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon">&#127942;</span>
              <span className="dash-home__stat-value">{weeklyRank ? `#${weeklyRank}` : '—'}</span>
              <span className="dash-home__stat-label">Weekly Rank</span>
            </div>
          </div>
        </div>
      )}

      {resumable.length > 0 && (
        <div className="dash-home__resume-section">
          <button
            className="dash-home__section-toggle"
            onClick={handleToggleCollapse}
            aria-expanded={!collapsed}
          >
            <span className={`dash-home__chevron${collapsed ? '' : ' dash-home__chevron--open'}`}>&#9654;</span>
            <h2 className="dash-home__section-title dash-home__section-title--inline">
              Resume Incomplete Quizzes ({resumable.length})
            </h2>
          </button>

          {!collapsed && (
            <div className="dash-home__resume-list">
              {resumable.map((session) => (
                <div key={session.id} className="dash-home__resume-card">
                  <div className="dash-home__resume-info">
                    <div className="dash-home__resume-pack">
                      {session.is_free_quiz ? 'Surprise Me!' : session.quiz_packs?.title || 'Quiz Pack'}
                    </div>
                    <div className="dash-home__resume-meta">
                      Score: {session.score || 0} / {session.total_questions * 10} &middot;{' '}
                      {new Date(session.started_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="dash-home__resume-actions">
                    <button
                      className="dash-home__resume-btn"
                      onClick={() => navigate(`/play/resume/${session.id}`)}
                    >
                      Resume
                    </button>
                    {dismissing === session.id ? (
                      <span className="dash-home__dismiss-confirm">
                        <span className="dash-home__dismiss-label">Abandon?</span>
                        <button className="dash-home__dismiss-yes" onClick={() => handleDismiss(session.id)}>Yes</button>
                        <button className="dash-home__dismiss-no" onClick={handleCancelDismiss}>No</button>
                      </span>
                    ) : (
                      <button
                        className="dash-home__dismiss-btn"
                        onClick={() => handleDismiss(session.id)}
                        title="Dismiss quiz"
                        aria-label="Dismiss quiz"
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
