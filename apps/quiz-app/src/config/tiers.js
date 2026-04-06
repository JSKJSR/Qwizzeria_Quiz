/**
 * Centralized tier configuration — single source of truth.
 *
 * To add/rename tiers: edit TIER_HIERARCHY + TIERS, add Stripe price env var,
 * run DB migration to ALTER CHECK constraint on subscriptions.tier.
 *
 * To move a feature between tiers: edit FEATURE_TIERS.
 * All UI (Pricing, UpgradeWall, TierRoute, useEntitlement) auto-adapts.
 */

export const TIER_HIERARCHY = ['free', 'basic', 'pro'];

export const TIERS = {
  free: {
    name: 'Free',
    price: '$0',
    period: '',
    priceId: null,
  },
  basic: {
    name: 'Basic',
    price: '$9.99',
    period: '/month',
    priceId: import.meta.env.VITE_STRIPE_BASIC_PRICE_ID || null,
  },
  pro: {
    name: 'Pro',
    price: '$19.99',
    period: '/month',
    popular: true,
    priceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID || null,
  },
};

/**
 * Maps each gated feature to its minimum required tier.
 * Features not listed here are assumed to be free.
 */
export const FEATURE_TIERS = {
  // Free tier features (explicit for documentation)
  free_quiz: 'free',
  dashboard: 'free',
  profile: 'free',
  guide: 'free',
  pricing: 'free',

  // Basic tier features
  packs: 'basic',
  history: 'basic',
  leaderboard: 'basic',
  resume: 'basic',

  // Pro tier features
  doubles: 'pro',
  host_quiz: 'pro',
  tournaments: 'pro',
  ai_generate: 'pro',
  buzzer: 'pro',
  export_results: 'pro',
  certificates: 'pro',
  streak_freeze_3: 'basic',     // 3 freezes/month
  streak_freeze_unlimited: 'pro', // 30 freezes/month (effectively unlimited)
};

/**
 * Feature display names for UI (UpgradeWall, Pricing).
 */
export const FEATURE_LABELS = {
  free_quiz: 'Free Quiz',
  dashboard: 'Dashboard',
  profile: 'Profile / Guide',
  guide: 'Profile / Guide',
  packs: 'Quiz Packs (browse + play)',
  history: 'Quiz History',
  leaderboard: 'Global Leaderboard',
  resume: 'Resume Sessions',
  doubles: 'Doubles',
  host_quiz: 'Host Quiz (multiplayer)',
  tournaments: 'Tournaments',
  ai_generate: 'AI Quiz Generation',
  buzzer: 'Buzzer Rooms',
  export_results: 'Export Results (CSV/PDF)',
  certificates: 'Certificates',
};

/**
 * Features shown on the Pricing page and UpgradeWall comparison.
 * Ordered for display — de-duplicated (profile/guide merged).
 */
export const DISPLAY_FEATURES = [
  { key: 'free_quiz', label: 'Free Quiz' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'profile', label: 'Profile / Guide' },
  { key: 'packs', label: 'Quiz Packs (browse + play)' },
  { key: 'history', label: 'Quiz History' },
  { key: 'leaderboard', label: 'Global Leaderboard' },
  { key: 'doubles', label: 'Doubles' },
  { key: 'host_quiz', label: 'Host Quiz (multiplayer)' },
  { key: 'tournaments', label: 'Tournaments' },
];

/**
 * Check if userTier meets or exceeds requiredTier.
 */
export function tierSatisfies(userTier, requiredTier) {
  return TIER_HIERARCHY.indexOf(userTier) >= TIER_HIERARCHY.indexOf(requiredTier);
}

/**
 * Map a Stripe price ID to a tier key. Returns null for unknown prices.
 * For client-side use — webhook uses process.env equivalent.
 */
export function mapPriceToTier(priceId) {
  if (!priceId) return null;
  const entry = Object.entries(TIERS).find(([, t]) => t.priceId && t.priceId === priceId);
  return entry ? entry[0] : null;
}

/**
 * Get the list of tiers as an array (for Pricing page rendering).
 */
export function getTierList() {
  return TIER_HIERARCHY.map((key) => ({
    id: key,
    ...TIERS[key],
    features: DISPLAY_FEATURES.map((f) => ({
      text: f.label,
      included: tierSatisfies(key, FEATURE_TIERS[f.key] || 'free'),
    })),
  }));
}
