import { useState, useEffect } from 'react';
import { getSupabase } from '@qwizzeria/supabase-client';
import { onAuthStateChange, getCurrentUser, signOut as authSignOut } from '@qwizzeria/supabase-client/src/auth.js';
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

    // Load current user
    getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Listen for auth changes
    const unsubscribe = onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return unsubscribe;
  }, []);

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
