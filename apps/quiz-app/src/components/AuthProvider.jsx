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

    // Register auth listener first — handles OAuth SIGNED_IN event
    const unsubscribe = onAuthStateChange(async (event, session) => {
      console.log('AuthProvider: Auth state change:', event, session);
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      await loadRole(currentUser?.id);
      setLoading(false);
    });

    // Always call getSession — it parses the OAuth hash fragment.
    // When OAuth hash is present, don't set loading=false here;
    // wait for onAuthStateChange SIGNED_IN to fire with the session.
    getSession().then(async (session) => {
      console.log('AuthProvider: Initial session loaded:', session);
      if (!hasOAuthHash) {
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        await loadRole(currentUser?.id);
        setLoading(false);
      }
      // If OAuth hash: getSession triggers hash parsing,
      // onAuthStateChange will fire SIGNED_IN with the real session
    }).catch((err) => {
      console.error('AuthProvider: Error loading session:', err);
      if (!hasOAuthHash) {
        setUser(null);
        setRole('user');
        setLoading(false);
      }
    });

    return unsubscribe;
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

