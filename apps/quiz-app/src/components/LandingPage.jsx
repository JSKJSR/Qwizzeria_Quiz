import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoginModal from './LoginModal';
import SEO from './SEO';
import '../styles/LandingPage.css';

export default function LandingPage() {
  const { user, loading, signOut } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  return (
    <main className="landing">
      <SEO
        title="Qwizzeria — Where Intelligence Meets Entertainment"
        description="Qwizzeria is Switzerland’s premium knowledge entertainment brand that turns intelligence into experience."
        path="/"
      />
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
          <>
            <button className="landing__auth-btn" onClick={() => setShowLogin(true)}>
              Sign In
            </button>
            <p className="landing__auth-hint">Sign in to play quiz packs</p>
          </>
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
          Qwizzeria is Switzerland’s premium knowledge entertainment brand that turns intelligence into experience.
          Host unforgettable quiz sessions in under 60 seconds.
        </p>

        {/* Primary CTA */}
        <nav aria-label="Quick actions">
        <Link to="/play/free" className="landing__cta-primary">
          <svg className="landing__cta-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5 3l14 9-14 9V3z" /></svg>
          Play a Free Quiz
        </Link>

        {/* Secondary CTAs */}
        <div className="landing__cta-secondary">
          <Link to="/packs" className="landing__cta-btn">
            <svg className="landing__cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /></svg>
            Browse Quiz Packs
          </Link>
          <Link to="/leaderboard" className="landing__cta-btn">
            <svg className="landing__cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
            Leaderboard
          </Link>
          {user && (
            <Link to="/profile" className="landing__cta-btn">
              <svg className="landing__cta-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
              My Profile
            </Link>
          )}
        </div>
        </nav>
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
    </main>
  );
}
