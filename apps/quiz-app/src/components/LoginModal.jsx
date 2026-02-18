import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { signInWithGoogle } from '@qwizzeria/supabase-client/src/auth.js';
import '../styles/LoginModal.css';

export default function LoginModal({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (mode === 'signup') {
        await signUp(email, password);
        setMessage('Check your email for a confirmation link.');
      } else {
        // signIn sets user in context before we navigate
        await signIn(email, password);
        onSuccess?.();
        onClose();
        navigate('/dashboard');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="login-modal__overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <button className="login-modal__close" onClick={onClose} aria-label="Close">
          &times;
        </button>

        <h2 className="login-modal__title">
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </h2>

        <button className="login-modal__google-btn" onClick={handleGoogle} type="button">
          Continue with Google
        </button>

        <div className="login-modal__divider">
          <span>or</span>
        </div>

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

          {error && <div className="login-modal__error">{error}</div>}
          {message && <div className="login-modal__message">{message}</div>}

          <button type="submit" className="login-modal__submit" disabled={loading}>
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <p className="login-modal__toggle">
          {mode === 'login' ? (
            <>Don&apos;t have an account?{' '}
              <button type="button" onClick={() => setMode('signup')}>Sign Up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button type="button" onClick={() => setMode('login')}>Sign In</button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
