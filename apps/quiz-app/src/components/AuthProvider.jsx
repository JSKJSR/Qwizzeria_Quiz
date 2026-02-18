import { useState, useEffect, useCallback } from 'react';
import { getSupabase } from '@qwizzeria/supabase-client';
import { onAuthStateChange, getSession, signOut as authSignOut, signInWithEmail, signUpWithEmail } from '@qwizzeria/supabase-client/src/auth.js';
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
  const [loading, setLoading] = useState(SUPABASE_AVAILABLE);

  useEffect(() => {
    if (!SUPABASE_AVAILABLE) return;

    console.log('AuthProvider: Initializing...');
    // Load current session (handles URL hash parsing for OAuth)
    getSession().then((session) => {
      console.log('AuthProvider: Initial session loaded:', session);
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('AuthProvider: Error loading session:', err);
      setUser(null);
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      console.log('AuthProvider: Auth state change:', event, session);
      setUser(session?.user ?? null);

      // If we get a SIGNED_IN event, make sure loading is false
      if (event === 'SIGNED_IN') {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await signInWithEmail(email, password);
    setUser(data.user);
    return data;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const data = await signUpWithEmail(email, password);
    return data;
  }, []);

  const signOut = useCallback(async () => {
    await authSignOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
