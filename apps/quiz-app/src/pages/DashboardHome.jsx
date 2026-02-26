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
  const [error, setError] = useState(null);
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
    }).catch(() => { if (!cancelled) setError('Failed to load dashboard data.'); });

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

      {error && (
        <div className="dash-home__error">
          <p>{error}</p>
          <button className="dash-home__retry-btn" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      <div className="dash-home__actions">
        <Link to="/host" className="dash-home__action-card">
          <span className="dash-home__action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" /></svg>
          </span>
          <span className="dash-home__action-title">Host a Quiz</span>
          <span className="dash-home__action-desc">Multiplayer mode with timer and live scoreboard</span>
        </Link>
        <Link to="/packs" className="dash-home__action-card">
          <span className="dash-home__action-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
          </span>
          <span className="dash-home__action-title">Browse Quiz Packs</span>
          <span className="dash-home__action-desc">Curated quiz packs by category and difficulty</span>
        </Link>
      </div>

      {stats && (
        <div className="dash-home__stats-section">
          <h2 className="dash-home__section-title">Your Stats</h2>
          <div className="dash-home__stats-grid">
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg></span>
              <span className="dash-home__stat-value">{stats.accuracy_pct ?? 0}%</span>
              <span className="dash-home__stat-label">Accuracy</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg></span>
              <span className="dash-home__stat-value">{stats.strongest_category || '—'}</span>
              <span className="dash-home__stat-label">Strongest Topic</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg></span>
              <span className="dash-home__stat-value">{stats.weakest_category || '—'}</span>
              <span className="dash-home__stat-label">Needs Work</span>
            </div>
            <div className="dash-home__stat-card">
              <span className="dash-home__stat-icon"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg></span>
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
