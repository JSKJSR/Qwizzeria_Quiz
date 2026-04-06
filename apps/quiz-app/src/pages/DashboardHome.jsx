import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserHistory, fetchUserStats, fetchGlobalLeaderboard, abandonQuizSession, fetchGamificationStats } from '@qwizzeria/supabase-client';
import { getLevel, getLevelTitle, getLevelProgress, BADGES } from '../utils/gamification';
import SEO from '../components/SEO';
import DailyMissions from '../components/DailyMissions';
import LeagueBadge from '../components/LeagueBadge';
import '../styles/DashboardHome.css';

const COLLAPSE_KEY = 'qwizzeria_resume_collapsed';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [roomError, setRoomError] = useState(null);
  const [resumable, setResumable] = useState([]);
  const [stats, setStats] = useState(null);
  const [weeklyRank, setWeeklyRank] = useState(null);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem(COLLAPSE_KEY) === 'true'; } catch { return false; }
  });
  const [dismissing, setDismissing] = useState(null);
  const [gamification, setGamification] = useState(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    Promise.all([
      fetchUserHistory({ userId: user.id, status: 'in_progress', pageSize: 5 }),
      fetchUserStats(user.id).catch(() => null),
      fetchGlobalLeaderboard('this_week', 50).catch(() => []),
      fetchGamificationStats(user.id).catch(() => null),
    ]).then(([historyResult, statsResult, leaderboard, gamData]) => {
      if (cancelled) return;
      setResumable(historyResult.data || []);
      setStats(statsResult);
      setGamification(gamData);

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

  const handleJoinRoom = useCallback((e) => {
    e.preventDefault();
    setRoomError(null);
    const code = roomCode.trim().toUpperCase();
    if (!code || code.length < 4) {
      setRoomError('Please enter a valid room code.');
      return;
    }
    navigate(`/buzz/${code}`);
  }, [roomCode, navigate]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Quizzer';

  // Gamification derived data
  const level = gamification?.xp_total > 0 ? getLevel(gamification.xp_total) : null;
  const levelTitle = level ? getLevelTitle(level) : null;
  const levelProgress = level ? getLevelProgress(gamification.xp_total) : null;
  const earnedBadges = gamification ? BADGES.filter(b => (gamification.badges || []).includes(b.key)) : [];

  return (
    <div className="dash-home">
      <SEO title="Dashboard" path="/dashboard" noIndex />

      {/* Compact greeting with inline status pills */}
      <div className="dash-home__welcome">
        <div className="dash-home__greeting-row">
          <h1 className="dash-home__greeting">Welcome back, {displayName}</h1>
          <div className="dash-home__status-pills">
            {level > 1 && (
              <span className="dash-home__level-pill">Lv. {level}</span>
            )}
            {gamification?.daily_streak_count > 0 && (
              <span className="dash-home__streak-pill">{gamification.daily_streak_count}d streak</span>
            )}
            {gamification?.streak_freezes_remaining > 0 && (
              <span className="dash-home__freeze-pill" tabIndex={0} aria-label="Streak freeze info">
                {gamification.streak_freezes_remaining} freeze{gamification.streak_freezes_remaining !== 1 ? 's' : ''}
                <span className="dash-home__freeze-tooltip">
                  Miss a day? A freeze saves your streak automatically. Upgrade for more freezes.
                </span>
              </span>
            )}
          </div>
        </div>
        <p className="dash-home__subtitle">Ready for your next quiz challenge?</p>
      </div>

      {error && (
        <div className="dash-home__error">
          <p>{error}</p>
          <button className="dash-home__retry-btn" onClick={() => window.location.reload()}>Try Again</button>
        </div>
      )}

      {/* Resume banner — above the grid, full width */}
      {resumable.length > 0 && (
        <div className="dash-home__resume-section">
          <button
            className="dash-home__section-toggle"
            onClick={handleToggleCollapse}
            aria-expanded={!collapsed}
          >
            <span className={`dash-home__chevron${collapsed ? '' : ' dash-home__chevron--open'}`}>&#9654;</span>
            <h2 className="dash-home__section-title dash-home__section-title--inline">
              Resume ({resumable.length})
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

      {/* Two-column dashboard grid */}
      <div className="dash-home__grid">
        {/* Left: Primary actions — what you DO */}
        <div className="dash-home__actions-col">
          <Link to="/play/free" className="dash-home__action-card dash-home__action-card--featured">
            <span className="dash-home__action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3" /></svg>
            </span>
            <span className="dash-home__action-title">Surprise Me!</span>
            <span className="dash-home__action-desc">Jump into random questions instantly</span>
          </Link>
          <Link to="/packs" className="dash-home__action-card">
            <span className="dash-home__action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            </span>
            <span className="dash-home__action-title">Browse Packs</span>
            <span className="dash-home__action-desc">Curated quizzes by category</span>
          </Link>
          <Link to="/host" className="dash-home__action-card">
            <span className="dash-home__action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M12 12h.01" /><path d="M17 12h.01" /><path d="M7 12h.01" /></svg>
            </span>
            <span className="dash-home__action-title">Host a Quiz</span>
            <span className="dash-home__action-desc">Multiplayer with live scoreboard</span>
          </Link>
          <div className="dash-home__action-card dash-home__join-card">
            <span className="dash-home__action-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" /><polyline points="10 17 15 12 10 7" /><line x1="15" y1="12" x2="3" y2="12" /></svg>
            </span>
            <span className="dash-home__action-title">Join a Room</span>
            <span className="dash-home__action-desc">Enter a code to join a live session</span>
            <form className="dash-home__join-form" onSubmit={handleJoinRoom}>
              <input
                type="text"
                className="dash-home__join-input"
                placeholder="Room code"
                value={roomCode}
                onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setRoomError(null); }}
                maxLength={8}
                autoComplete="off"
                spellCheck="false"
              />
              <button type="submit" className="dash-home__join-btn">Join</button>
            </form>
            {roomError && <span className="dash-home__join-error">{roomError}</span>}
          </div>
        </div>

        {/* Right: Progression — what you ARE */}
        <div className="dash-home__progress-col">
          {/* XP + Level progress */}
          {gamification && gamification.xp_total > 0 && (
            <div className="dash-home__gamification">
              <div className="dash-home__level-row">
                <div className="dash-home__level-badge">Lv. {level}</div>
                <div className="dash-home__level-info">
                  <span className="dash-home__level-title">{levelTitle}</span>
                  <span className="dash-home__xp-text">{gamification.xp_total} XP</span>
                </div>
              </div>
              <div className="dash-home__xp-bar">
                <div className="dash-home__xp-fill" style={{ width: `${levelProgress.pct}%` }} />
              </div>
              {earnedBadges.length > 0 && (
                <div className="dash-home__badges">
                  {earnedBadges.map(b => (
                    <span key={b.key} className="dash-home__badge" title={b.label}>{b.icon}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {user && <LeagueBadge userId={user.id} />}
          {user && <DailyMissions userId={user.id} />}

          {/* Compact stats */}
          {stats && (
            <div className="dash-home__stats-section">
              <h3 className="dash-home__stats-title">Your Stats</h3>
              <div className="dash-home__stats-grid">
                <div className="dash-home__stat-row">
                  <span className="dash-home__stat-label">Accuracy</span>
                  <span className="dash-home__stat-value">{stats.accuracy_pct ?? 0}%</span>
                </div>
                <div className="dash-home__stat-row">
                  <span className="dash-home__stat-label">Best Topic</span>
                  <span className="dash-home__stat-value">{stats.strongest_category || '—'}</span>
                </div>
                <div className="dash-home__stat-row">
                  <span className="dash-home__stat-label">Needs Work</span>
                  <span className="dash-home__stat-value">{stats.weakest_category || '—'}</span>
                </div>
                <div className="dash-home__stat-row">
                  <span className="dash-home__stat-label">Weekly Rank</span>
                  <span className="dash-home__stat-value">{weeklyRank ? `#${weeklyRank}` : '—'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
