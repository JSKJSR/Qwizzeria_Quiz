import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@qwizzeria/supabase-client';
import { onAuthStateChange, signOut as authSignOut, signInWithEmail, signUpWithEmail } from '@qwizzeria/supabase-client/src/auth.js';
import { fetchUserRole, hasMinRole, getSubscriptionState } from '@qwizzeria/supabase-client/src/users.js';
import { AuthContext } from '../contexts/AuthContext';

const DEFAULT_SUBSCRIPTION = { status: 'expired', tier: 'free', gated: true };

function isSupabaseConfigured() {
  try {
    getSupabase();
    return true;
  } catch {
    return false;
  }
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [subscription, setSubscription] = useState(DEFAULT_SUBSCRIPTION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function updateAuthState(session) {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.id) {
        try {
          const [userRole, subState] = await Promise.all([
            fetchUserRole(currentUser.id),
            getSubscriptionState(currentUser.id).catch(() => null),
          ]);
          if (mounted) {
            setRole(userRole);
            setSubscription(subState || DEFAULT_SUBSCRIPTION);
          }
        } catch (err) {
          console.error('AuthProvider: Error fetching role:', err);
          if (mounted) {
            setRole('user');
            setSubscription(DEFAULT_SUBSCRIPTION);
          }
        }
      } else {
        setRole('user');
        setSubscription(DEFAULT_SUBSCRIPTION);
      }

      if (mounted) setLoading(false);
    }

    async function handleOAuthRedirect() {
      const hash = window.location.hash;
      if (!hash || !hash.includes('access_token')) return false;

      try {
        const supabase = getSupabase();
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          // Clean up hash from URL
          window.history.replaceState(null, '', window.location.pathname);

          if (!error && data.session) {
            await updateAuthState(data.session);
            return true;
          }
        }
      } catch (err) {
        console.error('AuthProvider: OAuth hash processing failed:', err);
      }
      // Clean up hash on failure
      window.history.replaceState(null, '', window.location.pathname);
      return false;
    }

    // onAuthStateChange fires INITIAL_SESSION on startup — this is the
    // most reliable way to recover a persisted session on hard refresh.
    // We use it as the primary session recovery mechanism.
    let initialized = false;

    const unsubscribe = onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        initialized = true;
      }
      updateAuthState(session);
    });

    // Handle OAuth redirect separately (hash-based flow)
    handleOAuthRedirect().then((handled) => {
      if (handled) return;
      // Safety fallback: if INITIAL_SESSION hasn't fired after 3s,
      // force-resolve loading to avoid indefinite spinner
      setTimeout(() => {
        if (!initialized && mounted) {
          console.warn('AuthProvider: INITIAL_SESSION timeout, forcing load complete');
          setLoading(false);
        }
      }, 3000);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await signInWithEmail(email, password);
    setUser(data.user);
    const [userRole, subState] = await Promise.all([
      fetchUserRole(data.user?.id),
      getSubscriptionState(data.user?.id).catch(() => null),
    ]);
    setRole(userRole || 'user');
    setSubscription(subState || DEFAULT_SUBSCRIPTION);
    return { ...data, role: userRole || 'user' };
  }, []);

  const signUp = useCallback(async (email, password) => {
    const data = await signUpWithEmail(email, password);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
    setRole('user');
    setSubscription(DEFAULT_SUBSCRIPTION);
  }, []);

  const refreshSubscription = useCallback(async () => {
    if (!user) return;
    try {
      const subState = await getSubscriptionState(user.id);
      setSubscription(subState || DEFAULT_SUBSCRIPTION);
    } catch {
      // Silently fail — subscription state will be stale
    }
  }, [user]);

  const isPremium = hasMinRole(role, 'premium');
  const isEditor = hasMinRole(role, 'editor');
  const isAdmin = hasMinRole(role, 'admin');
  const isSuperadmin = role === 'superadmin';

  // Subscription-derived helpers
  const isTrial = subscription.status === 'trialing';
  const isGated = subscription.gated === true;
  const hasTier = useCallback((requiredTier) => {
    if (subscription.status === 'staff') return true;
    if (subscription.gated) return false;
    if (requiredTier === 'basic') return ['basic', 'pro'].includes(subscription.tier);
    if (requiredTier === 'pro') return subscription.tier === 'pro';
    return true;
  }, [subscription]);

  return (
    <AuthContext.Provider value={{
      user, role, isPremium, isEditor, isAdmin, isSuperadmin, loading,
      signIn, signUp, signOut,
      subscription, isTrial, isGated, hasTier, refreshSubscription,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

