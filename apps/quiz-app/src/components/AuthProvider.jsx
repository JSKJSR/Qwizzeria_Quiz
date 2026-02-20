import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@qwizzeria/supabase-client';
import { onAuthStateChange, getSession, signOut as authSignOut, signInWithEmail, signUpWithEmail } from '@qwizzeria/supabase-client/src/auth.js';
import { fetchUserRole, hasMinRole } from '@qwizzeria/supabase-client/src/users.js';
import { AuthContext } from '../contexts/AuthContext';

function isSupabaseConfigured() {
  try {
    getSupabase();
    return true;
  } catch {
    return false;
  }
}

const SUPABASE_AVAILABLE = isSupabaseConfigured();

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('user');
  const [loading, setLoading] = useState(SUPABASE_AVAILABLE);

  // Fetch role from user_profiles whenever user changes
  const loadRole = useCallback(async (userId) => {
    if (!userId) {
      setRole('user');
      return;
    }
    try {
      const userRole = await fetchUserRole(userId);
      setRole(userRole);
    } catch (err) {
      console.error('AuthProvider: Error fetching role:', err);
      setRole('user');
    }
  }, []);

  useEffect(() => {
    if (!SUPABASE_AVAILABLE) return;

    console.log('AuthProvider: Initializing...');

    // Detect OAuth redirect (hash contains access_token)
    const hasOAuthHash = window.location.hash.includes('access_token');
    let resolved = false;

    // Register auth listener first
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state change:', event, session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await loadRole(currentUser?.id);

      // During OAuth redirect: only stop loading once we have a real session
      // (skip INITIAL_SESSION with null user — hash hasn't been parsed yet)
      if (hasOAuthHash) {
        if (currentUser || event === 'SIGNED_IN') {
          resolved = true;
          setLoading(false);
          // Clean up the hash fragment from the URL
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } else {
        resolved = true;
        setLoading(false);
      }
    });

    // getSession() triggers hash fragment parsing for OAuth redirects
    getSession().then(async (session) => {
      console.log('AuthProvider: getSession result:', !!session?.user);
      // If onAuthStateChange already resolved, skip
      if (resolved) return;

      if (!hasOAuthHash) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await loadRole(currentUser?.id);
        setLoading(false);
      }
      // With OAuth hash: onAuthStateChange SIGNED_IN will handle it
    }).catch((err) => {
      console.error('AuthProvider: Error loading session:', err);
      if (!resolved) {
        setUser(null);
        setRole('user');
        setLoading(false);
      }
    });

    // Safety timeout for OAuth: if nothing resolves in 5s, stop loading
    let timeout;
    if (hasOAuthHash) {
      timeout = setTimeout(() => {
        if (!resolved) {
          console.warn('AuthProvider: OAuth timeout — stopping loading');
          setLoading(false);
        }
      }, 5000);
    }

    return () => {
      unsubscribe();
      if (timeout) clearTimeout(timeout);
    };
  }, [loadRole]);

  const signIn = useCallback(async (email, password) => {
    const data = await signInWithEmail(email, password);
    setUser(data.user);
    const userRole = await fetchUserRole(data.user?.id);
    setRole(userRole || 'user');
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
  }, []);

  const isPremium = hasMinRole(role, 'premium');
  const isEditor = hasMinRole(role, 'editor');
  const isAdmin = hasMinRole(role, 'admin');
  const isSuperadmin = role === 'superadmin';

  return (
    <AuthContext.Provider value={{ user, role, isPremium, isEditor, isAdmin, isSuperadmin, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

