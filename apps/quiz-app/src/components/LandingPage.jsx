import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const { user, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <div className="landing">
      {/* Auth area */}
      <div className="landing__auth">
        {loading ? null : user ? (
          <div className="landing__user-info">
            <span className="landing__user-email">{user.email}</span>
            <button className="landing__auth-btn" onClick={signOut}>
              Sign Out
            </button>
          </div>
        ) : (
          <button className="landing__auth-btn" onClick={() => setShowLogin(true)}>
            Sign In
          </button>
        )}
      </div>

      {/* Hero Section */}
      <header className="landing__hero">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="landing__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <h1 className="landing__headline">
          Turn Any Gathering Into a Smart Game Night
        </h1>
        <p className="landing__subheadline">
          Play beautifully designed quizzes. Learn something new. Compete with friends.
          Host unforgettable quiz sessions in under 60 seconds.
        </p>

        {/* Primary CTA */}
        <Link to="/play/free" className="landing__cta-primary">
          <span className="landing__cta-icon">&#9654;</span>
          Play a Free Quiz
        </Link>

        {/* Secondary CTAs */}
        <div className="landing__cta-secondary">
          <Link to="/packs" className="landing__cta-btn">
            <span className="landing__cta-icon">&#11088;</span>
            Browse Quiz Packs
          </Link>
        </div>
      </header>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-links">
          <a href="https://patreon.com/Qwizzeria" target="_blank" rel="noopener noreferrer">Patreon</a>
          <span className="landing__footer-sep">&middot;</span>
          <a href="https://instagram.com/qwizzeria" target="_blank" rel="noopener noreferrer">Instagram</a>
          <span className="landing__footer-sep">&middot;</span>
          <a href="mailto:rajan@qwizzeria.com">rajan@qwizzeria.com</a>
        </div>
      </footer>

      {/* Login Modal */}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}
