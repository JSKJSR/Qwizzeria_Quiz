import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { resetPasswordForEmail } from '@qwizzeria/supabase-client';
import '../styles/LoginModal.css';

export default function LoginModal({ onClose, onSuccess, initialMode }) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState(initialMode || 'login'); // 'login', 'signup', or 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const switchMode = (newMode) => {
    setMode(newMode);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'forgot') {
        await resetPasswordForEmail(email);
        setMessage('Check your email for a password reset link.');
      } else if (mode === 'signup') {
        await signUp(email, password);
        setMessage('Check your email for a confirmation link.');
      } else {
        // signIn sets user + role in context and returns the role
        const result = await signIn(email, password);
        onSuccess?.();
        onClose();
        const EDITOR_ROLES = ['editor', 'admin', 'superadmin'];
        navigate(EDITOR_ROLES.includes(result.role) ? '/admin' : '/dashboard');
      }
    } catch (err) {
      const msg = err.message || '';
      if (mode === 'forgot' && (msg.toLowerCase().includes('rate') || msg.toLowerCase().includes('limit') || msg.toLowerCase().includes('429'))) {
        setError('Too many reset requests. Please wait a few minutes before trying again.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'forgot'
    ? 'Reset Password'
    : mode === 'login'
      ? 'Sign In'
      : 'Unlock 50+ Quiz Packs';

  const submitLabel = mode === 'forgot'
    ? 'Send Reset Link'
    : mode === 'login'
      ? 'Sign In'
      : 'Create Free Account';

  return (
    <div className="login-modal__overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal__close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 className="login-modal__title">{title}</h2>
        {mode === 'signup' && (
          <p className="login-modal__subtitle">
            Create a free account to start hosting games instantly.
          </p>
        )}
        {mode === 'forgot' && (
          <p className="login-modal__subtitle">
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>
        )}

        <form onSubmit={handleSubmit} className="login-modal__form">
          <label className="login-modal__label">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="login-modal__input"
              autoComplete="email"
            />
          </label>

          {mode !== 'forgot' && (
            <label className="login-modal__label">
              Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="login-modal__input"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              />
            </label>
          )}

          {error && <div className="login-modal__error">{error}</div>}
          {message && <div className="login-modal__message">{message}</div>}

          <button type="submit" className="login-modal__submit" disabled={loading}>
            {loading ? 'Please wait...' : submitLabel}
          </button>
        </form>

        {mode === 'login' && (
          <p className="login-modal__forgot">
            <button type="button" onClick={() => switchMode('forgot')}>Forgot password?</button>
          </p>
        )}

        {mode === 'signup' && (
          <p className="login-modal__microcopy">
            Free &middot; No credit card &middot; Takes 60 seconds
          </p>
        )}

        <p className="login-modal__toggle">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button type="button" onClick={() => switchMode('signup')}>Sign Up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => switchMode('login')}>Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
