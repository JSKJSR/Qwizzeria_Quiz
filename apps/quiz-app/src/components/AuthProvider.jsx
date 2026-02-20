import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@qwizzeria/supabase-client';
import { onAuthStateChange, signOut as authSignOut, signInWithEmail, signUpWithEmail } from '@qwizzeria/supabase-client/src/auth.js';
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

  useEffect(() => {
    if (!SUPABASE_AVAILABLE) return;

    let mounted = true;

    async function handleSession(session) {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      if (currentUser?.id) {
        try {
          const userRole = await fetchUserRole(currentUser.id);
          if (mounted) setRole(userRole);
        } catch (err) {
          console.error('AuthProvider: Error fetching role:', err);
          if (mounted) setRole('user');
        }
      } else {
        setRole('user');
      }

      if (mounted) setLoading(false);

      // Clean up OAuth hash fragment from URL
      if (currentUser && window.location.hash.includes('access_token')) {
        window.history.replaceState(null, '', window.location.pathname);
      }
    }

    // onAuthStateChange fires INITIAL_SESSION on registration,
    // which includes the session parsed from the OAuth hash fragment.
    // It also fires SIGNED_IN, TOKEN_REFRESHED, SIGNED_OUT, etc.
    const unsubscribe = onAuthStateChange((_event, session) => {
      handleSession(session);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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

