import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/SubscriptionGate.css';

const TIER_FEATURES = {
  free: ['Free Quiz', 'Dashboard', 'Profile / Guide'],
  basic: ['Free Quiz', 'Dashboard', 'Profile / Guide', 'Quiz Packs (browse + play)', 'Quiz History', 'Global Leaderboard'],
  pro: ['Free Quiz', 'Dashboard', 'Profile / Guide', 'Quiz Packs (browse + play)', 'Quiz History', 'Global Leaderboard', 'Host Quiz (multiplayer)', 'Tournaments'],
};

const ALL_FEATURES = TIER_FEATURES.pro;

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

export default function UpgradeWall({ requiredTier, feature }) {
  const { isTrial, subscription } = useAuth();

  const title = isTrial
    ? 'Upgrade to continue'
    : subscription.status === 'expired' || subscription.status === 'canceled'
      ? 'Your free trial has ended'
      : 'Upgrade required';

  const subtitle = requiredTier === 'pro'
    ? 'This feature requires a Pro subscription.'
    : 'This feature requires a Basic or Pro subscription.';

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
          <div className="upgrade-wall__tier-col">
            <h3 className="upgrade-wall__tier-name">Free</h3>
            {ALL_FEATURES.map((f) => (
              <div key={f} className="upgrade-wall__feature-row">
                {TIER_FEATURES.free.includes(f) ? <CheckIcon /> : <CrossIcon />}
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="upgrade-wall__tier-col upgrade-wall__tier-col--highlight">
            <h3 className="upgrade-wall__tier-name">Basic</h3>
            {ALL_FEATURES.map((f) => (
              <div key={f} className="upgrade-wall__feature-row">
                {TIER_FEATURES.basic.includes(f) ? <CheckIcon /> : <CrossIcon />}
                <span>{f}</span>
              </div>
            ))}
          </div>
          <div className="upgrade-wall__tier-col">
            <h3 className="upgrade-wall__tier-name">Pro</h3>
            {ALL_FEATURES.map((f) => (
              <div key={f} className="upgrade-wall__feature-row">
                <CheckIcon />
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="upgrade-wall__actions">
          <Link to="/pricing" className="upgrade-wall__cta">Upgrade Now</Link>
          <Link to="/play/free" className="upgrade-wall__free-link">Continue with Free Quiz</Link>
        </div>
      </div>
    </div>
  );
}
