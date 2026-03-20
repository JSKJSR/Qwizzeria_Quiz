import { useAuth } from './useAuth';
import { FEATURE_TIERS, tierSatisfies } from '../config/tiers';

/**
 * Hook to check if the current user has access to a feature.
 *
 * @param {string} feature - Key from FEATURE_TIERS (e.g., 'packs', 'host_quiz')
 * @returns {{ allowed: boolean, requiredTier: string, currentTier: string, reason: string|null }}
 */
export function useEntitlement(feature) {
  const { subscription } = useAuth();

  const requiredTier = FEATURE_TIERS[feature] || 'free';
  const currentTier = subscription?.tier || 'free';
  const isStaff = subscription?.status === 'staff';
  const isTrial = subscription?.status === 'trialing';
  const allowed = isStaff || isTrial || tierSatisfies(currentTier, requiredTier);

  let reason = null;
  if (!allowed) {
    if (subscription?.status === 'expired') {
      reason = 'trial_expired';
    } else if (subscription?.status === 'canceled') {
      reason = 'canceled';
    } else {
      reason = 'tier_insufficient';
    }
  }

  return { allowed, requiredTier, currentTier, reason };
}
