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

    async function updateAuthState(session) {
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
    }

    async function initialize() {
      const supabase = getSupabase();

      // Handle OAuth redirect: if URL has #access_token, manually set the session
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        try {
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
              return; // Session set, onAuthStateChange will handle future changes
            }
          }
        } catch (err) {
          console.error('AuthProvider: OAuth hash processing failed:', err);
        }
        // If hash processing failed, clean up and fall through
        window.history.replaceState(null, '', window.location.pathname);
      }

      // Normal flow: load existing session from storage
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await updateAuthState(session);
      } catch (err) {
        console.error('AuthProvider: getSession failed:', err);
        if (mounted) setLoading(false);
      }
    }

    // Listen for ongoing auth changes (sign in/out, token refresh)
    const unsubscribe = onAuthStateChange((_event, session) => {
      updateAuthState(session);
    });

    // Run initialization
    initialize();

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

