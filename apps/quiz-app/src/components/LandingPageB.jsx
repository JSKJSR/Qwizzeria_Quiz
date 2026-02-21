import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import SEO from './SEO';
import '../styles/LandingPageB.css';

export default function LandingPageB() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('login');

  const openLogin = (mode) => {
    setLoginMode(mode);
    setShowLogin(true);
  };

  const handleUnlockPacks = () => {
    if (user) {
      navigate('/packs');
    } else {
      openLogin('signup');
    }
  };

  return (
    <main className="landing-b">
      <SEO
        title="Qwizzeria — Host a Game Night in 60 Seconds"
        description="Create and play live quizzes with friends, family, or teams. Free to start, no setup, no hassle."
        path="/"
      />

      {/* Header */}
      <header className="landing-b__header">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="landing-b__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <nav className="landing-b__header-nav">
          {loading ? null : user ? (
            <div className="landing-b__user-info">
              <span className="landing-b__user-email">{user.email}</span>
              <button className="landing-b__btn-text" onClick={signOut}>
                Sign Out
              </button>
            </div>
          ) : (
            <>
              <button
                className="landing-b__btn-primary"
                onClick={() => openLogin('signup')}
              >
                Get Started Free
              </button>
              <button
                className="landing-b__btn-text"
                onClick={() => openLogin('login')}
              >
                Sign in
              </button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="landing-b__hero">
        <div className="landing-b__hero-content">
          <h1 className="landing-b__headline">
            Host a Game Night in 60&nbsp;Seconds
          </h1>
          <p className="landing-b__subheadline">
            Create and play live quizzes with friends, family, or teams
            &mdash; no setup, no hassle.
          </p>

          <div className="landing-b__ctas">
            <Link to="/play/free" className="landing-b__cta-primary">
              Start Your Free Game Night
            </Link>
            <button
              className="landing-b__cta-outline"
              onClick={handleUnlockPacks}
            >
              &#128274; Unlock Quiz Packs
            </button>
          </div>

          <p className="landing-b__microcopy">
            Free to start &middot; No credit card &middot; Takes 60 seconds
          </p>
          <p className="landing-b__social-proof">
            Used for pub nights, game nights, &amp; team events
          </p>
        </div>

        <div className="landing-b__hero-visual">
          <div className="landing-b__preview-card">
            <span className="landing-b__preview-icon">&#129504;</span>
            <span className="landing-b__preview-label">Live Quiz Preview</span>
            <div className="landing-b__preview-grid">
              <div className="landing-b__preview-cell">Science</div>
              <div className="landing-b__preview-cell">History</div>
              <div className="landing-b__preview-cell">Sports</div>
              <div className="landing-b__preview-cell">Music</div>
              <div className="landing-b__preview-cell">Geography</div>
              <div className="landing-b__preview-cell">Movies</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-b__footer">
        <div className="landing-b__footer-links">
          <a href="https://patreon.com/Qwizzeria" target="_blank" rel="noopener noreferrer">Patreon</a>
          <span className="landing-b__footer-sep">&middot;</span>
          <a href="https://instagram.com/qwizzeria" target="_blank" rel="noopener noreferrer">Instagram</a>
          <span className="landing-b__footer-sep">&middot;</span>
          <a href="mailto:rajan@qwizzeria.com">rajan@qwizzeria.com</a>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          initialMode={loginMode}
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
    </main>
  );
}
