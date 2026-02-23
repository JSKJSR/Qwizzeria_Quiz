import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

/**
 * Initialize the Supabase client with the given URL and anon key.
 * Call this once at app startup (e.g., in main.jsx).
 */
export function initSupabase(supabaseUrl, supabaseAnonKey) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
    );
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      storage: {
        getItem: (key) => globalThis.localStorage?.getItem(key) ?? null,
        setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
        removeItem: (key) => globalThis.localStorage?.removeItem(key),
      },
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

/**
 * Get the initialized Supabase client.
 * Throws if initSupabase() hasn't been called yet.
 */
export function getSupabase() {
  if (!supabaseInstance) {
    throw new Error(
      'Supabase not initialized. Call initSupabase() first.'
    );
  }
  return supabaseInstance;
}
