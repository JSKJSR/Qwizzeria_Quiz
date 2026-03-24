import { useEffect, useRef } from 'react';

const TIERS = ['free', 'basic', 'pro'];

const TIER_CONFIG = {
  free: { label: 'Free', desc: 'No paid features' },
  basic: { label: 'Basic', desc: 'Packs, history, leaderboard' },
  pro: { label: 'Pro', desc: 'All features including AI & host' },
};

export default function UserSubscriptionModal({ target, saving, onConfirm, onCancel, onTierChange }) {
  const dialogRef = useRef(null);

  // Focus trap + Escape to close
  useEffect(() => {
    if (!target) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKey);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', handleKey);
  }, [target, onCancel]);

  if (!target) return null;

  const currentTier = target.currentTier || 'free';
  const isDowngrade = currentTier !== 'free' && target.newTier === 'free';
  const isUpgrade = TIERS.indexOf(target.newTier) > TIERS.indexOf(currentTier);
  const hasChanged = target.newTier !== currentTier;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog confirm-dialog--subscription"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-labelledby="sub-modal-title"
        aria-modal="true"
      >
        <h3 id="sub-modal-title">Change Subscription</h3>
        <p className="confirm-dialog__user">
          Updating tier for <strong>{target.displayName}</strong>
        </p>

        <div className="sub-tier-picker">
          {TIERS.map((t) => {
            const config = TIER_CONFIG[t];
            const isCurrent = t === currentTier;
            const isSelected = t === target.newTier;
            return (
              <button
                key={t}
                type="button"
                className={`sub-tier-card ${isSelected ? 'sub-tier-card--selected' : ''} ${isCurrent ? 'sub-tier-card--current' : ''}`}
                onClick={() => onTierChange(t)}
                aria-pressed={isSelected}
              >
                <span className={`badge badge--subscription-${t}`}>{config.label}</span>
                <span className="sub-tier-card__desc">{config.desc}</span>
                {isCurrent && <span className="sub-tier-card__tag">Current</span>}
              </button>
            );
          })}
        </div>

        {isDowngrade && (
          <div className="alert alert--error sub-modal__alert">
            This will remove the user's paid features immediately.
          </div>
        )}

        {isUpgrade && target.newTier !== 'free' && (
          <p className="sub-modal__note">
            Admin-granted — no Stripe subscription will be created.
          </p>
        )}

        <div className="confirm-dialog__actions">
          <button
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={onConfirm}
            disabled={saving || !hasChanged}
          >
            {saving ? 'Saving...' : hasChanged ? `Set to ${TIER_CONFIG[target.newTier].label}` : 'No change'}
          </button>
        </div>
      </div>
    </div>
  );
}
