import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';

export default function SubscriptionSuccessBanner() {
  const { refreshSubscription, subscription } = useAuth();
  const [visible, setVisible] = useState(false);
  const [tierName, setTierName] = useState(null);
  const pollRef = useRef(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') !== 'success') return;

    // Clean URL
    params.delete('subscription');
    const newUrl = params.toString()
      ? `${window.location.pathname}?${params}`
      : window.location.pathname;
    window.history.replaceState(null, '', newUrl);

    setVisible(true);

    // Poll for subscription refresh (webhook may take 1-5s)
    const maxAttempts = 5;
    const interval = setInterval(() => {
      pollRef.current += 1;
      refreshSubscription();
      if (pollRef.current >= maxAttempts) clearInterval(interval);
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshSubscription]);

  // Update tier name when subscription changes during polling
  useEffect(() => {
    if (visible && subscription.status === 'active' && subscription.tier) {
      setTierName(subscription.tier === 'pro' ? 'Pro' : 'Basic');
    }
  }, [visible, subscription.status, subscription.tier]);

  // Auto-dismiss after 10s
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setVisible(false), 10000);
    return () => clearTimeout(timer);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="trial-banner" style={{ background: 'linear-gradient(135deg, rgba(74, 222, 128, 0.15), rgba(74, 222, 128, 0.05))', borderBottomColor: 'rgba(74, 222, 128, 0.3)' }}>
      <span className="trial-banner__text">
        {tierName
          ? `Welcome to ${tierName}! Your subscription is active.`
          : 'Processing your subscription...'}
      </span>
      <button
        className="trial-banner__dismiss"
        onClick={() => setVisible(false)}
        aria-label="Dismiss"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}
