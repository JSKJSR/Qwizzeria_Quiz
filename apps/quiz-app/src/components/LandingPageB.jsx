import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { browsePublicPacks } from '@qwizzeria/supabase-client/src/packs.js';
import LoginModal from './LoginModal';
import SEO from './SEO';
import '../styles/LandingPageB.css';

export default function LandingPageB() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [loginMode, setLoginMode] = useState('login');

  const [packs, setPacks] = useState([]);
  const trackRef = useRef(null);

  useEffect(() => {
    browsePublicPacks().then(setPacks).catch(() => {});
  }, []);

  const scrollCarousel = useCallback((dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('.landing-b__pack-card');
    const amount = card ? card.offsetWidth + 16 : 280;
    track.scrollBy({ left: dir * amount, behavior: 'smooth' });
  }, []);

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
            <img src="/qwizzeria_logoB.jpg" alt="Qwizzeria" className="landing-b__preview-image" />
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

      {/* Pack Carousel */}
      {packs.length > 0 && (
        <section className="landing-b__packs">
          <div className="landing-b__packs-header">
            <h2 className="landing-b__packs-title">Popular Quiz Packs</h2>
            <div className="landing-b__packs-nav">
              <button
                className="landing-b__packs-arrow"
                onClick={() => scrollCarousel(-1)}
                aria-label="Scroll left"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button
                className="landing-b__packs-arrow"
                onClick={() => scrollCarousel(1)}
                aria-label="Scroll right"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
          <div className="landing-b__packs-track" ref={trackRef}>
            {packs.map((pack) => (
              <div key={pack.id} className="landing-b__pack-card">
                {pack.cover_image_url ? (
                  <img
                    className="landing-b__pack-image"
                    src={pack.cover_image_url}
                    alt={pack.title}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="landing-b__pack-image-placeholder" />
                )}
                <div className="landing-b__pack-body">
                  <div className="landing-b__pack-title">{pack.title}</div>
                  {pack.category && (
                    <div className="landing-b__pack-tags">
                      {pack.category.split(',').map((tag) => (
                        <span key={tag.trim()} className="landing-b__pack-tag">{tag.trim()}</span>
                      ))}
                    </div>
                  )}
                  <div className="landing-b__pack-meta">
                    {pack.question_count} questions
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

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
