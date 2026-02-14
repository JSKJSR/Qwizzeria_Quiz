import '../styles/LandingPage.css';

export default function LandingPage({ onStartQuiz }) {
  return (
    <div className="landing">
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
        <button className="landing__cta-primary" onClick={onStartQuiz}>
          <span className="landing__cta-icon">▶</span>
          Play a Free Quiz
        </button>

        {/* Secondary CTAs (Optional placeholders) */}
        <div className="landing__cta-secondary">
          <button className="landing__cta-btn" disabled>
            <span className="landing__cta-icon">⭐</span>
            Browse Quiz Packs
          </button>
          <button className="landing__cta-btn" disabled>
            <span className="landing__cta-icon">🔓</span>
            Unlock Premium
          </button>
        </div>
      </header>

      {/* Footer */}
      <footer className="landing__footer">
        <div className="landing__footer-links">
          <a href="https://patreon.com/Qwizzeria" target="_blank" rel="noopener noreferrer">Patreon</a>
          <span className="landing__footer-sep">·</span>
          <a href="https://instagram.com/qwizzeria" target="_blank" rel="noopener noreferrer">Instagram</a>
          <span className="landing__footer-sep">·</span>
          <a href="mailto:rajan@qwizzeria.com">rajan@qwizzeria.com</a>
        </div>
      </footer>
    </div>
  );
}
