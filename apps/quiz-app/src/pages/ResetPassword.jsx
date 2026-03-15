import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupabase, updatePassword } from '@qwizzeria/supabase-client';
import '../styles/ResetPassword.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Supabase redirects here with a hash containing access_token + type=recovery.
    // The Supabase client auto-processes the hash and fires PASSWORD_RECOVERY.
    let unsubscribe;
    try {
      const supabase = getSupabase();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === 'PASSWORD_RECOVERY') {
          setReady(true);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      // Supabase not configured
      setError('Authentication service is not available.');
      return;
    }

    // Also check if user is already in a recovery session (e.g. page refresh)
    const hash = window.location.hash;
    if (hash && hash.includes('type=recovery')) {
      // Supabase will pick this up automatically via onAuthStateChange
    } else {
      // User may have navigated here directly without a recovery token
      // Give Supabase a moment to process, then show ready state anyway
      // (updatePassword will fail if no valid session)
      const timer = setTimeout(() => setReady(true), 1500);
      return () => {
        clearTimeout(timer);
        unsubscribe?.();
      };
    }

    return () => unsubscribe?.();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updatePassword(newPassword);
      setSuccess(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="reset-password">
        <div className="reset-password__card">
          <div className="reset-password__icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-success, #4caf50)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h1 className="reset-password__title">Password Updated</h1>
          <p className="reset-password__text">Your password has been reset successfully.</p>
          <button className="reset-password__btn" onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password">
      <div className="reset-password__card">
        <h1 className="reset-password__title">Set New Password</h1>
        <p className="reset-password__text">Enter your new password below.</p>

        {!ready ? (
          <p className="reset-password__loading">Verifying reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="reset-password__form">
            <label className="reset-password__label">
              New Password
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="reset-password__input"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
              />
            </label>

            <label className="reset-password__label">
              Confirm Password
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="reset-password__input"
                autoComplete="new-password"
                placeholder="Confirm new password"
              />
            </label>

            {error && <div className="reset-password__error">{error}</div>}

            <button type="submit" className="reset-password__btn" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="reset-password__back">
          <button type="button" onClick={() => navigate('/')}>Back to home</button>
        </p>
      </div>
    </div>
  );
}
