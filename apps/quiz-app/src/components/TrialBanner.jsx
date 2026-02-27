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
  if (daysLeft > 5) return null;

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="trial-banner">
      <span className="trial-banner__text">
        {daysLeft === 0
          ? 'Your free trial ends today'
          : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left in your free trial`}
        {' — '}
        <Link to="/pricing" className="trial-banner__link">Upgrade now</Link>
      </span>
      <button className="trial-banner__dismiss" onClick={handleDismiss} aria-label="Dismiss">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
