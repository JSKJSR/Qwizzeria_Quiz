import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/SubscriptionGate.css';

const DISMISSED_KEY = 'qwizzeria_trial_banner_dismissed';

export default function TrialBanner() {
  const { isTrial, subscription } = useAuth();
  const [dismissed, setDismissed] = useState(() => sessionStorage.getItem(DISMISSED_KEY) === 'true');

  if (!isTrial || dismissed) return null;

  const daysLeft = subscription.trialDaysLeft ?? 0;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  // Urgent tone for ≤5 days, softer for 6-14
  const isUrgent = daysLeft <= 5;
  const message = daysLeft === 0
    ? 'Your free trial ends today'
    : isUrgent
      ? `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`
      : `You're on a free trial (${daysLeft} days remaining)`;

  return (
    <div className="trial-banner" style={isUrgent ? undefined : { background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05))', borderBottomColor: 'rgba(99, 102, 241, 0.15)' }}>
      <span className="trial-banner__text">
        {message}
        {' — '}
        <Link to="/pricing" className="trial-banner__link">
          {isUrgent ? 'Upgrade now' : 'View plans'}
        </Link>
      </span>
      <button className="trial-banner__dismiss" onClick={handleDismiss} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
