import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserProfile, upsertUserProfile, fetchUserStats, fetchUserHistory } from '@qwizzeria/supabase-client/src/users.js';
import SEO from '../components/SEO';
import '../styles/Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [resumable, setResumable] = useState([]);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const [profileData, statsData, historyData] = await Promise.all([
          fetchUserProfile(user.id).catch(() => null),
          fetchUserStats(user.id).catch(() => null),
          fetchUserHistory({ userId: user.id, status: 'in_progress', pageSize: 10 }).catch(() => ({ data: [] })),
        ]);
        setProfile(profileData);
        setDisplayName(profileData?.display_name || '');
        setStats(statsData);
        setResumable(historyData.data);
      } catch {
        // Non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return;
    setSaving(true);
    try {
      const updated = await upsertUserProfile(user.id, { display_name: displayName.trim() });
      setProfile(updated);
    } catch (err) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="profile">
        <div className="profile__loading">
          <div className="profile__spinner" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <SEO title="Profile" path="/profile" noIndex />
      <h1 className="profile__title">My Profile</h1>

      {/* Display Name */}
      <div className="profile__name-section">
        <span className="profile__name-label">Display Name</span>
        <div className="profile__name-row">
          <input
            className="profile__name-input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.email?.split('@')[0] || 'Your name'}
            maxLength={50}
          />
          <button
            className="profile__save-btn"
            onClick={handleSaveName}
            disabled={saving || !displayName.trim()}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="profile__stats">
          <div className="profile__stat-card">
            <div className="profile__stat-value">{stats.total_quizzes || 0}</div>
            <div className="profile__stat-label">Quizzes Played</div>
          </div>
          <div className="profile__stat-card">
            <div className="profile__stat-value">{stats.total_score || 0}</div>
            <div className="profile__stat-label">Total Score</div>
          </div>
          <div className="profile__stat-card">
            <div className="profile__stat-value">{stats.accuracy_pct || 0}%</div>
            <div className="profile__stat-label">Accuracy</div>
          </div>
          <div className="profile__stat-card">
            <div className="profile__stat-value">{stats.favorite_category || '—'}</div>
            <div className="profile__stat-label">Favorite Category</div>
          </div>
          <div className="profile__stat-card">
            <div className="profile__stat-value">{stats.packs_completed || 0}</div>
            <div className="profile__stat-label">Packs Completed</div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="profile__actions">
        <Link to="/history" className="profile__action-link">View Quiz History</Link>
        <Link to="/leaderboard" className="profile__action-link">Leaderboard</Link>
      </div>

      {/* Resumable sessions */}
      {resumable.length > 0 && (
        <div>
          <h2 className="profile__resume-title">Resume Incomplete Quizzes</h2>
          <div className="profile__resume-list">
            {resumable.map((session) => (
              <div key={session.id} className="profile__resume-card">
                <div className="profile__resume-info">
                  <div className="profile__resume-pack">
                    {session.is_free_quiz ? 'Free Quiz' : session.quiz_packs?.title || 'Quiz Pack'}
                  </div>
                  <div className="profile__resume-meta">
                    Score: {session.score || 0} / {session.total_questions * 10} &middot;{' '}
                    {new Date(session.started_at).toLocaleDateString()}
                  </div>
                </div>
                <button
                  className="profile__resume-btn"
                  onClick={() => navigate(`/play/resume/${session.id}`)}
                >
                  Resume
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {!stats && !resumable.length && (
        <p className="profile__empty">
          No quiz data yet. Play a quiz to see your stats here!
        </p>
      )}
    </div>
  );
}
