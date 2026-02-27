import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import UpgradeWall from './UpgradeWall';

/**
 * TierRoute — works like ProtectedRoute but checks subscription tier.
 * Use as a layout route: <Route element={<TierRoute requiredTier="basic" />}>
 */
export function TierRoute({ requiredTier }) {
  const { hasTier, loading } = useAuth();

  if (loading) return null;

  if (hasTier(requiredTier)) {
    return <Outlet />;
  }

  return <UpgradeWall requiredTier={requiredTier} />;
}

/**
 * SubscriptionGate — wrapper component for inline gating.
 * <SubscriptionGate requiredTier="basic" feature="Quiz Packs">{children}</SubscriptionGate>
 */
export default function SubscriptionGate({ requiredTier, feature, children }) {
  const { hasTier, loading } = useAuth();

  if (loading) return null;

  if (hasTier(requiredTier)) {
    return children;
  }

  return <UpgradeWall requiredTier={requiredTier} feature={feature} />;
}
