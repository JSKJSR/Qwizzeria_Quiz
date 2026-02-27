import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const RING_SIZE = 80;
const STROKE_WIDTH = 6;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TRIAL_DAYS = 14;

function ProgressRing({ daysLeft }) {
  const progress = Math.max(0, Math.min(1, daysLeft / TRIAL_DAYS));
  const offset = CIRCUMFERENCE * (1 - progress);

  return (
    <svg width={RING_SIZE} height={RING_SIZE} className="trial-widget__ring">
      {/* Background circle */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={STROKE_WIDTH}
      />
      {/* Progress circle */}
      <circle
        cx={RING_SIZE / 2}
        cy={RING_SIZE / 2}
        r={RADIUS}
        fill="none"
        stroke="#e85c1a"
        strokeWidth={STROKE_WIDTH}
        strokeLinecap="round"
        strokeDasharray={CIRCUMFERENCE}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
      />
      {/* Days number */}
      <text
        x={RING_SIZE / 2}
        y={RING_SIZE / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="trial-widget__ring-text"
      >
        {daysLeft}
      </text>
    </svg>
  );
}

export default function SidebarTrialWidget() {
  const { user, subscription, isTrial, role, isEditor } = useAuth();

  // Staff roles: show role badge, no widget
  if (subscription.status === 'staff' || isEditor) {
    return (
      <div className="trial-widget">
        <div className="trial-widget__user">
          <span className="trial-widget__name">{user?.email?.split('@')[0] || 'User'}</span>
          <span className="trial-widget__label trial-widget__label--staff">{role}</span>
        </div>
      </div>
    );
  }

  // Trialing
  if (isTrial) {
    const daysLeft = subscription.trialDaysLeft ?? 0;
    return (
      <div className="trial-widget">
        <ProgressRing daysLeft={daysLeft} />
        <p className="trial-widget__subtitle">
          days remaining in your<br />Free trial
        </p>
        <Link to="/pricing" className="trial-widget__upgrade-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
          </svg>
          UPGRADE
        </Link>
        <div className="trial-widget__user">
          <span className="trial-widget__name">{user?.email?.split('@')[0] || 'User'}</span>
          <span className="trial-widget__label">Free Trial</span>
        </div>
      </div>
    );
  }

  // Active subscription
  if (subscription.status === 'active') {
    const tierLabel = subscription.tier === 'pro' ? 'Pro Plan' : 'Basic Plan';
    return (
      <div className="trial-widget">
        <div className="trial-widget__user">
          <span className="trial-widget__name">{user?.email?.split('@')[0] || 'User'}</span>
          <span className="trial-widget__label trial-widget__label--active">{tierLabel}</span>
        </div>
        {subscription.tier === 'basic' && (
          <Link to="/pricing" className="trial-widget__upgrade-link">Upgrade to Pro</Link>
        )}
      </div>
    );
  }

  // Past due
  if (subscription.status === 'past_due') {
    return (
      <div className="trial-widget">
        <div className="trial-widget__warning">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e8a825" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span>Payment issue</span>
        </div>
        <Link to="/profile" className="trial-widget__upgrade-link">Update Payment</Link>
        <div className="trial-widget__user">
          <span className="trial-widget__name">{user?.email?.split('@')[0] || 'User'}</span>
          <span className="trial-widget__label trial-widget__label--warning">Past Due</span>
        </div>
      </div>
    );
  }

  // Expired / canceled (no active subscription)
  return (
    <div className="trial-widget">
      <Link to="/pricing" className="trial-widget__upgrade-btn">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M13 3L4 14h7l-2 7 9-11h-7l2-7z" />
        </svg>
        UPGRADE
      </Link>
      <div className="trial-widget__user">
        <span className="trial-widget__name">{user?.email?.split('@')[0] || 'User'}</span>
        <span className="trial-widget__label">Free Plan</span>
      </div>
    </div>
  );
}
