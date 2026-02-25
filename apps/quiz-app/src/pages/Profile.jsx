import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchUserProfile, upsertUserProfile, fetchUserStats } from '@qwizzeria/supabase-client/src/users.js';
import { updatePassword, deleteOwnAccount } from '@qwizzeria/supabase-client/src/auth.js';
import SEO from '../components/SEO';
import '../styles/Profile.css';

export default function Profile() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryKey, setRetryKey] = useState(0);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordSaving, setPasswordSaving] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;

    async function load() {
      setError(null);
      try {
        const [profileData, statsData] = await Promise.all([
          fetchUserProfile(user.id).catch(() => null),
          fetchUserStats(user.id).catch(() => null),
        ]);
        setProfile(profileData);
        setDisplayName(profileData?.display_name || '');
        setStats(statsData);
      } catch {
        setError('Failed to load profile. Please try again.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user, retryKey]);

  const handleSaveName = async () => {
    if (!displayName.trim() || !user) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const updated = await upsertUserProfile(user.id, { display_name: displayName.trim() });
      setProfile(updated);
      setSaveMsg({ type: 'success', text: 'Changes saved.' });
    } catch (err) {
      setSaveMsg({ type: 'error', text: `Failed to save: ${err.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await updatePassword(newPassword);
      setPasswordMsg({ type: 'success', text: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message });
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    try {
      await deleteOwnAccount();
      await signOut();
      navigate('/');
    } catch (err) {
      alert(`Failed to delete account: ${err.message}`);
      setDeleting(false);
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

  if (error) {
    return (
      <div className="profile">
        <h1 className="profile__title">Settings</h1>
        <div className="profile__error">
          <p>{error}</p>
          <button className="profile__retry-btn" onClick={() => { setLoading(true); setRetryKey(k => k + 1); }}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile">
      <SEO title="Settings" path="/profile" noIndex />
      <h1 className="profile__title">Settings</h1>

      {/* Account Section */}
      <section className="profile__section">
        <div className="profile__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h2>Account</h2>
        </div>

        <div className="profile__field">
          <label className="profile__field-label">Email</label>
          <input
            className="profile__input profile__input--readonly"
            type="email"
            value={user?.email || ''}
            readOnly
          />
        </div>

        <div className="profile__field">
          <label className="profile__field-label">Username</label>
          <input
            className="profile__input"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={user?.email?.split('@')[0] || 'Your name'}
            maxLength={50}
          />
        </div>

        <button
          className="profile__save-btn profile__save-btn--full"
          onClick={handleSaveName}
          disabled={saving || !displayName.trim()}
        >
          {saving ? 'Saving...' : 'Save changes'}
        </button>
        {saveMsg && (
          <p className={`profile__feedback profile__feedback--${saveMsg.type}`}>{saveMsg.text}</p>
        )}
      </section>

      {/* Stats Section */}
      {stats && (
        <section className="profile__section">
          <div className="profile__section-header">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
            </svg>
            <h2>Stats</h2>
          </div>

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

          <div className="profile__actions">
            <Link to="/history" className="profile__action-link">View Quiz History</Link>
            <Link to="/leaderboard" className="profile__action-link">Leaderboard</Link>
          </div>
        </section>
      )}

      {/* Password Section */}
      <section className="profile__section">
        <div className="profile__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <h2>Password</h2>
        </div>

        <div className="profile__field">
          <label className="profile__field-label">New password</label>
          <input
            className="profile__input"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min. 6 characters"
            autoComplete="new-password"
          />
        </div>

        <div className="profile__field">
          <label className="profile__field-label">New password again</label>
          <input
            className="profile__input"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
          />
        </div>

        <button
          className="profile__save-btn profile__save-btn--full"
          onClick={handleUpdatePassword}
          disabled={passwordSaving || !newPassword}
        >
          {passwordSaving ? 'Updating...' : 'Update password'}
        </button>
        {passwordMsg && (
          <p className={`profile__feedback profile__feedback--${passwordMsg.type}`}>{passwordMsg.text}</p>
        )}
      </section>

      {/* Delete Account Section */}
      <section className="profile__section profile__section--danger">
        <div className="profile__section-header">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <h2>Delete account</h2>
        </div>

        <p className="profile__danger-text">
          Once you delete your account, there is no going back. All your data will be permanently removed.
        </p>

        {!showDeleteConfirm ? (
          <button
            className="profile__delete-btn"
            onClick={() => setShowDeleteConfirm(true)}
          >
            Permanently delete your account
          </button>
        ) : (
          <div className="profile__delete-confirm">
            <p className="profile__delete-confirm-text">
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              className="profile__input profile__input--danger"
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder="Type DELETE"
              autoComplete="off"
            />
            <div className="profile__delete-actions">
              <button
                className="profile__delete-btn profile__delete-btn--confirm"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirm !== 'DELETE'}
              >
                {deleting ? 'Deleting...' : 'Confirm deletion'}
              </button>
              <button
                className="profile__delete-btn profile__delete-btn--cancel"
                onClick={() => { setShowDeleteConfirm(false); setDeleteConfirm(''); }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </section>

      {!stats && (
        <p className="profile__empty">
          No quiz data yet. Play a quiz to see your stats here!
        </p>
      )}
    </div>
  );
}
