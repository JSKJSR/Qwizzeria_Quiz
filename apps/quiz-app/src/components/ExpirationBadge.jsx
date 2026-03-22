import { getExpirationStatus, formatExpiration } from '@/utils/packExpiration';

const STYLES = {
  expired: {
    background: 'rgba(244, 67, 54, 0.15)',
    color: '#f44336',
  },
  expiring_soon: {
    background: 'rgba(255, 152, 0, 0.15)',
    color: '#ff9800',
  },
};

const LABELS = {
  expired: 'Expired',
  expiring_soon: 'Expiring soon',
};

/**
 * Displays an expiration status badge for a pack.
 * Returns null if no expiration is set or the pack is not near expiry.
 * @param {{ expiresAt: string|null }} props
 */
export default function ExpirationBadge({ expiresAt }) {
  const status = getExpirationStatus(expiresAt);

  if (!status || status === 'active') return null;

  return (
    <span
      className="badge"
      style={STYLES[status]}
      title={formatExpiration(expiresAt)}
    >
      {LABELS[status]}
    </span>
  );
}
