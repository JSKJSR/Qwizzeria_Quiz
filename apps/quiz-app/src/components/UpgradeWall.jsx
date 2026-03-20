import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DISPLAY_FEATURES, FEATURE_TIERS, tierSatisfies, TIERS } from '../config/tiers';
import '../styles/SubscriptionGate.css';

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export default function UpgradeWall({ requiredTier, feature, reason }) {
  const { isTrial, subscription } = useAuth();

  // D fix: contextual messaging based on reason
  const derivedReason = reason
    || (subscription.status === 'expired' ? 'trial_expired'
      : subscription.status === 'canceled' ? 'canceled'
        : isTrial ? 'trial_active'
          : 'tier_insufficient');

  const TITLES = {
    trial_expired: 'Your free trial has ended',
    canceled: 'Your subscription has been canceled',
    trial_active: 'Upgrade to continue',
    tier_insufficient: 'Upgrade required',
  };

  const SUBTITLES = {
    trial_expired: 'Subscribe to regain access to premium features.',
    canceled: 'Resubscribe to regain access to your features.',
    trial_active: requiredTier === 'pro'
      ? 'This feature requires a Pro subscription.'
      : 'This feature requires a Basic or Pro subscription.',
    tier_insufficient: requiredTier === 'pro'
      ? 'This feature requires a Pro subscription.'
      : 'This feature requires a Basic or Pro subscription.',
  };

  const title = TITLES[derivedReason] || TITLES.tier_insufficient;
  const subtitle = SUBTITLES[derivedReason] || SUBTITLES.tier_insufficient;

  const tierKeys = ['free', 'basic', 'pro'];

  return (
    <div className="upgrade-wall">
      <div className="upgrade-wall__card">
        <img
          src="/qwizzeria-logo.png"
          alt="Qwizzeria"
          className="upgrade-wall__logo"
          onError={(e) => { e.target.src = '/qwizzeria-logo.svg'; }}
        />
        <h2 className="upgrade-wall__title">{title}</h2>
        <p className="upgrade-wall__subtitle">{subtitle}</p>
        {feature && <p className="upgrade-wall__feature">You need access to: <strong>{feature}</strong></p>}

        {/* Feature comparison */}
        <div className="upgrade-wall__comparison">
          {tierKeys.map((tierKey) => {
            const isHighlight = tierKey === (requiredTier || 'basic');
            return (
              <div key={tierKey} className={`upgrade-wall__tier-col ${isHighlight ? 'upgrade-wall__tier-col--highlight' : ''}`}>
                <h3 className="upgrade-wall__tier-name">{TIERS[tierKey].name}</h3>
                {DISPLAY_FEATURES.map((f) => {
                  const included = tierSatisfies(tierKey, FEATURE_TIERS[f.key] || 'free');
                  return (
                    <div key={f.key} className="upgrade-wall__feature-row">
                      {included
                        ? <><CheckIcon /><span className="sr-only">Included: </span></>
                        : <><CrossIcon /><span className="sr-only">Not included: </span></>}
                      <span>{f.label}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="upgrade-wall__actions">
          <Link to="/pricing" className="upgrade-wall__cta">Upgrade Now</Link>
          <Link to="/play/free" className="upgrade-wall__free-link">Continue with Free Quiz</Link>
        </div>
      </div>
    </div>
  );
}
