import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useEntitlement } from '../hooks/useEntitlement';
import UpgradeWall from './UpgradeWall';

/**
 * TierRoute — works like ProtectedRoute but checks subscription tier.
 * Use as a layout route: <Route element={<TierRoute requiredTier="basic" />}>
 *
 * Also accepts a `feature` key from FEATURE_TIERS for useEntitlement-based gating.
 */
export function TierRoute({ requiredTier, feature }) {
  const { hasTier, loading } = useAuth();

  // If feature key provided, use useEntitlement for reason-aware gating
  const entitlement = useEntitlement(feature || '_skip');

  if (loading) return null;

  // Feature-based gating (preferred path)
  if (feature) {
    if (entitlement.allowed) return <Outlet />;
    return <UpgradeWall requiredTier={entitlement.requiredTier} reason={entitlement.reason} />;
  }

  // Legacy tier-based gating
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
