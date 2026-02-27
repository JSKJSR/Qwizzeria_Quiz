import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSupabase } from '@qwizzeria/supabase-client';
import SEO from '../components/SEO';
import '../styles/Pricing.css';

const TIERS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$5',
    period: '/month',
    features: [
      { text: 'Free Quiz', included: true },
      { text: 'Dashboard', included: true },
      { text: 'Profile / Guide', included: true },
      { text: 'Quiz Packs (browse + play)', included: true },
      { text: 'Quiz History', included: true },
      { text: 'Global Leaderboard', included: true },
      { text: 'Host Quiz (multiplayer)', included: false },
      { text: 'Tournaments', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$10',
    period: '/month',
    popular: true,
    features: [
      { text: 'Free Quiz', included: true },
      { text: 'Dashboard', included: true },
      { text: 'Profile / Guide', included: true },
      { text: 'Quiz Packs (browse + play)', included: true },
      { text: 'Quiz History', included: true },
      { text: 'Global Leaderboard', included: true },
      { text: 'Host Quiz (multiplayer)', included: true },
      { text: 'Tournaments', included: true },
    ],
  },
];

async function getAuthToken() {
  const supabase = getSupabase();
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token;
}

export default function Pricing() {
  const { subscription, isTrial } = useAuth();
  const [loadingTier, setLoadingTier] = useState(null);
  const [error, setError] = useState(null);

  const handleSubscribe = async (tier) => {
    setError(null);
    setLoadingTier(tier);
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create checkout');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoadingTier(null);
    }
  };

  const handleManage = async () => {
    setError(null);
    setLoadingTier('manage');
    try {
      const token = await getAuthToken();
      const res = await fetch('/api/stripe/create-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to open portal');
      window.location.href = data.url;
    } catch (err) {
      setError(err.message);
      setLoadingTier(null);
    }
  };

  const isActive = subscription.status === 'active';
  const currentTier = isActive ? subscription.tier : null;

  return (
    <div className="pricing">
      <SEO title="Pricing" path="/pricing" />
      <h1 className="pricing__title">Choose your plan</h1>

      {isTrial && (
        <p className="pricing__trial-info">
          You have <strong>{subscription.trialDaysLeft ?? 0} days</strong> left in your free trial.
          Subscribe now to keep access after your trial ends.
        </p>
      )}

      {subscription.status === 'expired' && (
        <p className="pricing__trial-info">
          Your free trial has ended. Subscribe to regain access to premium features.
        </p>
      )}

      {error && <p className="pricing__error">{error}</p>}

      <div className="pricing__cards">
        {TIERS.map((tier) => {
          const isCurrent = currentTier === tier.id;
          return (
            <div
              key={tier.id}
              className={`pricing__card ${tier.popular ? 'pricing__card--popular' : ''} ${isCurrent ? 'pricing__card--current' : ''}`}
            >
              {tier.popular && <span className="pricing__badge">Most Popular</span>}
              {isCurrent && <span className="pricing__badge pricing__badge--current">Current Plan</span>}

              <h2 className="pricing__card-name">{tier.name}</h2>
              <div className="pricing__card-price">
                <span className="pricing__amount">{tier.price}</span>
                <span className="pricing__period">{tier.period}</span>
              </div>

              <ul className="pricing__features">
                {tier.features.map((f) => (
                  <li key={f.text} className={`pricing__feature ${f.included ? '' : 'pricing__feature--disabled'}`}>
                    {f.included ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    )}
                    {f.text}
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <button className="pricing__btn pricing__btn--manage" onClick={handleManage} disabled={loadingTier === 'manage'}>
                  {loadingTier === 'manage' ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : isActive && tier.id === 'basic' && currentTier === 'pro' ? (
                <button className="pricing__btn pricing__btn--manage" onClick={handleManage} disabled={loadingTier === 'manage'}>
                  {loadingTier === 'manage' ? 'Loading...' : 'Manage Subscription'}
                </button>
              ) : (
                <button
                  className="pricing__btn"
                  onClick={() => handleSubscribe(tier.id)}
                  disabled={loadingTier === tier.id}
                >
                  {loadingTier === tier.id ? 'Loading...' : isCurrent ? 'Current Plan' : 'Subscribe'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {isActive && (
        <p className="pricing__manage-link">
          <button className="pricing__text-btn" onClick={handleManage} disabled={loadingTier === 'manage'}>
            Manage billing, update payment method, or cancel
          </button>
        </p>
      )}
    </div>
  );
}
