'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from './supabase';
import { useRouter } from 'next/navigation';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        // If there's an error getting the session, clear any stale data
        if (error) {
          console.error('Session error, clearing auth state:', error);
          await supabase.auth.signOut({ scope: 'local' });
          setUser(null);
        } else {
          setUser(session?.user ?? null);
          // Ensure app-level user row exists when session is present
          if (session?.user?.email) {
            try {
              await fetch('/api/user', { method: 'GET' });
            } catch (e) {
              console.warn('Failed to ensure user row exists:', e);
            }
          }
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
        // Clear any stale session data
        await supabase.auth.signOut({ scope: 'local' });
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        // Handle specific auth events
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user ?? null);
        } else if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null);
        } else {
          setUser(session?.user ?? null);
        }
        
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { data, error };
    }

    // Fetch current user to check email confirmation
    const { data: userData } = await supabase.auth.getUser();
    const authedUser = userData?.user;

    if (!authedUser?.email_confirmed_at) {
      // Block access for unverified accounts
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      return { data: null, error: { message: 'Please verify your email before signing in.' } };
    }

    // Ensure app-level user row exists
    try {
      await fetch('/api/user', { method: 'GET' });
    } catch (e) {
      console.warn('Failed to ensure user row exists after sign-in:', e);
    }

    return { data, error: null };
  };

  const signUp = async (email, password, userData = {}) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, userData }),
      });

      const json = await response.json();

      if (!response.ok) {
        const message = json?.error || 'Signup failed';
        return { data: null, error: { message, field: json?.field } };
      }

      return { data: json, error: null };
    } catch (err) {
      return { data: null, error: { message: 'Network error during signup' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear all auth data including localStorage
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
      // Redirect to home page immediately after sign out
      router.push('/');
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error };
    }
  };

  const clearAuthData = async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      setUser(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email);
    return { data, error };
  };

  const updatePassword = async (password) => {
    const { data, error } = await supabase.auth.updateUser({
      password,
    });
    return { data, error };
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    clearAuthData,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 