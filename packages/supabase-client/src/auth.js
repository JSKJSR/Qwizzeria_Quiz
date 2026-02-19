import { getSupabase } from './index.js';

/**
 * Sign up with email and password.
 */
export async function signUpWithEmail(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(email, password) {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Sign in with Google OAuth.
 */
export async function signInWithGoogle() {
  const supabase = getSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin + '/',
    },
  });

  if (error) {
    throw new Error(error.message);
  }
  return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(error.message);
  }
}

/**
 * Get the current session (if any).
 */
export async function getSession() {
  const supabase = getSupabase();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    throw new Error(error.message);
  }
  return session;
}

/**
 * Get the current user (if authenticated).
 */
export async function getCurrentUser() {
  const supabase = getSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }
  return user;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthStateChange(callback) {
  const supabase = getSupabase();
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      callback(event, session);
    }
  );
  return () => subscription.unsubscribe();
}
