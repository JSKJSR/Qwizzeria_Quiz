import { Link } from 'react-router-dom';
import SEO from '../components/SEO';
import '../styles/Pricing.css';

export default function PricingComingSoon() {
  return (
    <div className="pricing">
      <SEO
        title="Pricing"
        description="Qwizzeria pricing plans coming soon."
        path="/pricing"
      />
      <div className="pricing__coming-soon">
        <div className="pricing__coming-soon-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>
        <h1 className="pricing__title">Pricing Coming Soon</h1>
        <p className="pricing__coming-soon-text">
          We're working on new plans to give you the best value.
          Stay tuned for updates!
        </p>
        <p className="pricing__coming-soon-subtext">
          In the meantime, enjoy full access to all features during your trial.
        </p>
        <Link to="/dashboard" className="pricing__back-btn">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
